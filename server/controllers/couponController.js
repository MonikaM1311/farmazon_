const Coupon = require('../models/Coupon');

const validateCoupon = async (req, res) => {
  const { code, total } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ message: 'Coupon expired' });
  if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ message: 'Coupon usage limit reached' });
  if (total < coupon.minOrder) return res.status(400).json({ message: `Minimum order ₹${coupon.minOrder} required` });

  const discountAmount = ((total * coupon.discount) / 100).toFixed(2);
  res.json({ discount: coupon.discount, discountAmount: Number(discountAmount), code: coupon.code });
};

const applyCoupon = async (req, res) => {
  const { code } = req.body;
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
  res.json({ message: 'Coupon applied' });
};

// Seed some default coupons (admin use)
const seedCoupons = async (req, res) => {
  const defaults = [
    { code: 'FRESH10', discount: 10, minOrder: 100, maxUses: 1000 },
    { code: 'FARM20', discount: 20, minOrder: 200, maxUses: 500 },
    { code: 'WELCOME15', discount: 15, minOrder: 0, maxUses: 10000 },
  ];
  for (const c of defaults) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true });
  }
  res.json({ message: 'Coupons seeded' });
};

module.exports = { validateCoupon, applyCoupon, seedCoupons };
