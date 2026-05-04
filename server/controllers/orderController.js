const Order = require('../models/Order');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const createOrder = async (req, res) => {
  const { products, deliveryAddress, paymentMethod } = req.body;
  if (!products?.length) return res.status(400).json({ message: 'No products in order' });

  const totalPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const order = await Order.create({
    userId: req.user._id,
    products,
    totalPrice,
    deliveryAddress,
    paymentMethod,
  });
  res.status(201).json(order);
};

const getMyOrders = async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(order);
};

const getFarmerOrders = async (req, res) => {
  // Get all products by this farmer
  const farmerProducts = await Product.find({ farmerId: req.user._id }).select('_id');
  const productIds = farmerProducts.map((p) => p._id.toString());

  const orders = await Order.find({
    'products.productId': { $in: productIds },
  }).sort({ createdAt: -1 });

  // Filter products in each order to only farmer's products
  const filtered = orders.map((o) => ({
    ...o.toObject(),
    products: o.products.filter((p) => productIds.includes(p.productId?.toString())),
  }));

  res.json(filtered);
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = req.body.status;
  await order.save();
  res.json(order);
};

const reorder = async (req, res) => {
  const original = await Order.findById(req.params.id);
  if (!original) return res.status(404).json({ message: 'Order not found' });
  if (original.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const order = await Order.create({
    userId: req.user._id,
    products: original.products,
    totalPrice: original.totalPrice,
    deliveryAddress: original.deliveryAddress,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    status: 'confirmed',
    estimatedDelivery,
  });
  res.status(201).json(order);
};

const requestReturn = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Not authorized' });
  if (order.status !== 'delivered')
    return res.status(400).json({ message: 'Only delivered orders can be returned' });
  if (order.returnRequest?.status && order.returnRequest.status !== 'none')
    return res.status(400).json({ message: 'Return request already submitted' });

  const { type, reason, image } = req.body;
  if (!type || !reason) return res.status(400).json({ message: 'Type and reason are required' });

  let imageUrl = '';
  if (image) {
    const uploaded = await cloudinary.uploader.upload(image, { folder: 'farmazon/returns' });
    imageUrl = uploaded.secure_url;
  }

  order.returnRequest = { type, reason, image: imageUrl, status: 'pending', createdAt: new Date() };
  await order.save();
  res.json({ message: 'Return request submitted successfully', order });
};

const resolveReturn = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('userId', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only the farmer who owns products in this order can resolve
  const farmerProducts = await Product.find({ farmerId: req.user._id }).select('_id');
  const productIds = farmerProducts.map((p) => p._id.toString());
  const isFarmerOrder = order.products.some((p) => productIds.includes(p.productId?.toString()));
  if (!isFarmerOrder) return res.status(403).json({ message: 'Not authorized' });
  if (order.returnRequest?.status !== 'pending')
    return res.status(400).json({ message: 'No pending return request' });

  const { status, refundAmount, farmerNote } = req.body;
  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Status must be approved or rejected' });

  order.returnRequest.status = status;
  order.returnRequest.farmerNote = farmerNote || '';
  order.returnRequest.resolvedAt = new Date();

  if (status === 'approved') {
    order.returnRequest.refundAmount = refundAmount || order.totalPrice;
    if (order.returnRequest.type === 'refund') order.paymentStatus = 'refunded';
    if (order.returnRequest.type === 'replacement') order.status = 'confirmed'; // re-ship
  }

  await order.save();
  res.json({ message: `Return request ${status}`, order });
};

module.exports = { createOrder, getMyOrders, getOrderById, getFarmerOrders, updateOrderStatus, reorder, requestReturn, resolveReturn };
