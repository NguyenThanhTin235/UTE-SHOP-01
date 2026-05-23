const express = require('express');
const router = express.Router();
const sellerProductController = require('../controllers/sellerProductController');
const sellerOrderController = require('../controllers/sellerOrderController');
const sellerAnalyticsController = require('../controllers/sellerAnalyticsController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

// Get products with pagination & filtering
router.get('/products', verifyToken, sellerProductController.getProducts);

// Export products to excel
router.get('/products/export', verifyToken, sellerProductController.exportProducts);

// Create new product
router.post('/products', verifyToken, sellerProductController.createProduct);

// Upload product images
router.post('/products/upload', verifyToken, uploadProduct.array('images', 10), sellerProductController.uploadProductImages);

const sellerCancellationController = require('../controllers/sellerCancellationController');

// Orders
router.get('/orders', verifyToken, sellerOrderController.getOrders);
router.get('/orders/:id', verifyToken, sellerOrderController.getOrderById);
router.put('/orders/:id/status', verifyToken, sellerOrderController.updateOrderStatus);

// Cancellations
router.get('/cancellations', verifyToken, sellerCancellationController.getCancellations);
router.put('/cancellations/:id/status', verifyToken, sellerCancellationController.updateCancellationStatus);

// Analytics
router.get('/analytics', verifyToken, sellerAnalyticsController.getAnalytics);
router.get('/analytics/export', verifyToken, sellerAnalyticsController.exportAnalytics);

module.exports = router;
