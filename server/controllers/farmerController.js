const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const getFarmerProfile = async (req, res) => {
  const farmer = await User.findById(req.params.farmerId).select('name bio location coordinates isVerified createdAt');
  if (!farmer || farmer.role === 'consumer') return res.status(404).json({ message: 'Farmer not found' });
  const products = await Product.find({ farmerId: req.params.farmerId, stock: { $gt: 0 } }).sort({ createdAt: -1 });
  res.json({ farmer, products });
};

const getFarmerAnalytics = async (req, res) => {
  const farmerProducts = await Product.find({ farmerId: req.user._id }).select('_id name');
  const productIds = farmerProducts.map((p) => p._id.toString());

  const orders = await Order.find({ 'products.productId': { $in: productIds } });

  // Monthly revenue for last 6 months
  const now = new Date();
  const monthly = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthly[key] = 0;
  }

  orders.forEach((order) => {
    if (order.status === 'delivered') {
      const key = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthly[key] !== undefined) {
        order.products
          .filter((p) => productIds.includes(p.productId?.toString()))
          .forEach((p) => { monthly[key] += p.price * p.quantity; });
      }
    }
  });

  // Top products by revenue
  const productRevenue = {};
  orders.forEach((order) => {
    if (order.status === 'delivered') {
      order.products
        .filter((p) => productIds.includes(p.productId?.toString()))
        .forEach((p) => {
          productRevenue[p.name] = (productRevenue[p.name] || 0) + p.price * p.quantity;
        });
    }
  });
  const topProducts = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));

  // Low stock alerts
  const lowStock = await Product.find({ farmerId: req.user._id, stock: { $lte: 10 } }).select('name stock unit');

  res.json({
    monthlyRevenue: Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })),
    topProducts,
    lowStock,
    totalOrders: orders.length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => {
      return s + o.products.filter(p => productIds.includes(p.productId?.toString())).reduce((ps, p) => ps + p.price * p.quantity, 0);
    }, 0),
  });
};

const updateFarmerProfile = async (req, res) => {
  const { bio, location, coordinates } = req.body;
  const user = await User.findById(req.user._id);
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (coordinates?.lat && coordinates?.lng) user.coordinates = coordinates;
  await user.save();
  res.json({ bio: user.bio, location: user.location, coordinates: user.coordinates });
};

module.exports = { getFarmerProfile, getFarmerAnalytics, updateFarmerProfile };
