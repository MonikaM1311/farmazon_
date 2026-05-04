const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      unit: String,
    },
  ],
  comboPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true }, // sum of individual prices
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Combo', comboSchema);
