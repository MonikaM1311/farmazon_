const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Step 1: Create Razorpay order and save pending DB order
const createRazorpayOrder = async (req, res) => {
  const { products, deliveryAddress, totalPrice } = req.body;
  if (!products?.length) return res.status(400).json({ message: 'No products in order' });

  // Create Razorpay order (amount in paise)
  const rzpOrder = await getRazorpay().orders.create({
    amount: Math.round(totalPrice * 100),
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  });

  // Save order in DB with pending payment status
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const order = await Order.create({
    userId: req.user._id,
    products,
    totalPrice,
    deliveryAddress,
    paymentMethod: 'Razorpay',
    paymentStatus: 'pending',
    razorpayOrderId: rzpOrder.id,
    status: 'pending',
    estimatedDelivery,
  });

  res.json({
    orderId: order._id,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};

// Step 2: Verify Razorpay signature and mark order paid
const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  // Verify HMAC signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    // Mark order as failed
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  // Mark order as paid + confirmed
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      paymentStatus: 'paid',
      razorpayPaymentId,
      status: 'confirmed',
    },
    { new: true }
  );

  res.json({ success: true, order });
};

// Step 3: Create COD order directly
const createCODOrder = async (req, res) => {
  const { products, deliveryAddress, totalPrice } = req.body;
  if (!products?.length) return res.status(400).json({ message: 'No products in order' });

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const order = await Order.create({
    userId: req.user._id,
    products,
    totalPrice,
    deliveryAddress,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    status: 'confirmed',
    estimatedDelivery,
  });

  res.status(201).json(order);
};

// Mark payment failed (called on Razorpay modal dismiss)
const failPayment = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ message: 'orderId required' });
  const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' }, { new: true });
  res.json(order);
};

module.exports = { createRazorpayOrder, verifyPayment, createCODOrder, failPayment };
