const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const recalcRating = async (productId) => {
  const reviews = await Review.find({ productId });
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  await Product.findByIdAndUpdate(productId, { avgRating: avg.toFixed(1), reviewCount: reviews.length });
};

const getReviews = async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews);
};

const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  // Only buyers who received the product can review
  const delivered = await Order.findOne({
    userId: req.user._id,
    status: 'delivered',
    'products.productId': productId,
  });
  if (!delivered) return res.status(403).json({ message: 'You can only review products you have received' });

  const existing = await Review.findOne({ productId, userId: req.user._id });
  if (existing) return res.status(400).json({ message: 'You already reviewed this product' });

  const review = await Review.create({ productId, userId: req.user._id, userName: req.user.name, rating, comment });
  await recalcRating(productId);
  res.status(201).json(review);
};

const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  if (review.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
  await review.deleteOne();
  await recalcRating(review.productId);
  res.json({ message: 'Review deleted' });
};

module.exports = { getReviews, addReview, deleteReview };
