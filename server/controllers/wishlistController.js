const User = require('../models/User');

const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist);
};

const toggleWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.wishlist.indexOf(productId);
  if (idx === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(idx, 1);
  }
  await user.save();
  res.json({ wishlisted: idx === -1, wishlist: user.wishlist });
};

module.exports = { getWishlist, toggleWishlist };
