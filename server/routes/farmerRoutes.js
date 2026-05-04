const express = require('express');
const router = express.Router();
const { getFarmerProfile, getFarmerAnalytics, updateFarmerProfile } = require('../controllers/farmerController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');

router.get('/analytics', protect, farmerOnly, getFarmerAnalytics);
router.put('/profile', protect, farmerOnly, updateFarmerProfile);
router.get('/:farmerId', getFarmerProfile);

module.exports = router;
