const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
    },
  ],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  deliveryAddress: { type: String, required: true },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  returnRequest: {
    type:        { type: String, enum: ['refund', 'replacement', ''], default: '' },
    reason:      { type: String, default: '' },
    image:       { type: String, default: '' },
    status:      { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    refundAmount:{ type: Number, default: 0 },
    farmerNote:  { type: String, default: '' },
    createdAt:   { type: Date },
    resolvedAt:  { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
