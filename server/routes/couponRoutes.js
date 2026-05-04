const express = require('express');
const router = express.Router();
const { validateCoupon, applyCoupon, seedCoupons } = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');

router.post('/validate', protect, validateCoupon);
router.post('/apply', protect, applyCoupon);
router.post('/seed', seedCoupons); // call once to seed default coupons

module.exports = router;
