const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: ['fruit', 'vegetable', 'grain', 'dairy', 'other'], required: true },
  image: { type: String, default: '' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String },
  harvestDate: { type: Date },
  stock: { type: Number, default: 100 },
  unit: { type: String, default: 'kg' },
  shelfLife: { type: String, default: '' }, // e.g. '3-5 days'
  seasonalPrices: {
    spring: { type: Number },
    summer: { type: Number },
    autumn: { type: Number },
    winter: { type: Number },
  },
  marketPrice: { type: Number, default: 0 },
  labReport: {
    url:        { type: String, default: '' },
    fileType:   { type: String, enum: ['image', 'pdf', ''], default: '' },
    uploadedAt: { type: Date },
    verified:   { type: Boolean, default: false },
    aiScore:    { type: Number, default: null },
    aiStatus:   { type: String, enum: ['approved', 'needs_review', 'rejected', 'pending', ''], default: '' },
    aiBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    aiVerifiedAt: { type: Date },
  },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
