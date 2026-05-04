const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getFarmerProducts,
  uploadLabReport, verifyLabReport, getLabVerificationStatus, retriggerAIVerification,
} = require('../controllers/productController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/my', protect, farmerOnly, getFarmerProducts);
router.get('/:id', getProductById);
router.post('/', protect, farmerOnly, createProduct);
router.put('/:id', protect, farmerOnly, updateProduct);
router.delete('/:id', protect, farmerOnly, deleteProduct);
router.post('/:id/lab-report', protect, farmerOnly, uploadLabReport);
router.put('/:id/lab-report/verify', protect, farmerOnly, verifyLabReport);
router.get('/:id/lab-report/status', protect, farmerOnly, getLabVerificationStatus);
router.post('/:id/lab-report/retry', protect, farmerOnly, retriggerAIVerification);

module.exports = router;
