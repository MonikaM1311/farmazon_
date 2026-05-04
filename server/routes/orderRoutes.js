const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrderById,
  getFarmerOrders, updateOrderStatus, reorder,
  requestReturn, resolveReturn,
} = require('../controllers/orderController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/farmer', protect, farmerOnly, getFarmerOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, farmerOnly, updateOrderStatus);
router.post('/:id/reorder', protect, reorder);
router.post('/:id/return', protect, requestReturn);
router.put('/:id/return/resolve', protect, farmerOnly, resolveReturn);

module.exports = router;
