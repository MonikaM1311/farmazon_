const Combo = require('../models/Combo');
const Product = require('../models/Product');

const getCombos = async (req, res) => {
  const combos = await Combo.find({ active: true }).sort({ createdAt: -1 });
  res.json(combos);
};

// Seed default combos (call once via GET /api/combos/seed)
const seedCombos = async (req, res) => {
  const defaults = [
    {
      name: '🥦 Veggie Combo Pack',
      description: 'Fresh daily vegetables for a family of 4 — tomatoes, onions, potatoes & spinach',
      comboPrice: 199,
      originalPrice: 260,
      products: [
        { name: 'Tomatoes', quantity: 1, unit: 'kg' },
        { name: 'Onions', quantity: 1, unit: 'kg' },
        { name: 'Potatoes', quantity: 1, unit: 'kg' },
        { name: 'Spinach', quantity: 500, unit: 'g' },
      ],
    },
    {
      name: '🍎 Fruit Basket',
      description: 'Seasonal fresh fruits — bananas, apples, mangoes & papaya',
      comboPrice: 299,
      originalPrice: 380,
      products: [
        { name: 'Bananas', quantity: 1, unit: 'dozen' },
        { name: 'Apples', quantity: 500, unit: 'g' },
        { name: 'Papaya', quantity: 1, unit: 'piece' },
      ],
    },
    {
      name: '🌾 Weekly Staples Pack',
      description: 'Weekly essentials — rice, lentils, onions & garlic',
      comboPrice: 349,
      originalPrice: 430,
      products: [
        { name: 'Onions', quantity: 2, unit: 'kg' },
        { name: 'Garlic', quantity: 250, unit: 'g' },
        { name: 'Carrots', quantity: 1, unit: 'kg' },
        { name: 'Cabbage', quantity: 1, unit: 'piece' },
      ],
    },
    {
      name: '💪 Health Booster Pack',
      description: 'Immunity-boosting produce — ginger, turmeric, amla & broccoli',
      comboPrice: 249,
      originalPrice: 320,
      products: [
        { name: 'Ginger', quantity: 250, unit: 'g' },
        { name: 'Broccoli', quantity: 500, unit: 'g' },
        { name: 'Spinach', quantity: 500, unit: 'g' },
        { name: 'Carrots', quantity: 500, unit: 'g' },
      ],
    },
  ];

  for (const c of defaults) {
    await Combo.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
  }
  res.json({ message: `${defaults.length} combos seeded` });
};

module.exports = { getCombos, seedCombos };
