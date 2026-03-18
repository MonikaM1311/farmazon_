const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, createCODOrder, failPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/cod', protect, createCODOrder);
router.post('/fail', protect, failPayment);

module.exports = router;
