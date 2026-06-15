const express = require('express');
const router = express.Router();
const shipperController = require('../../controllers/shipper/shipperController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { isShipper } = require('../../middleware/roleMiddleware');
const { uploadProof } = require('../../config/cloudinary');

// Protect all shipper routes
router.use(verifyToken);
router.use(isShipper);

router.get('/dashboard', shipperController.getDashboardOverview);
router.get('/orders', shipperController.getOrders);
router.get('/orders/:id/detail', shipperController.getOrderDetail);
router.get('/orders/:status', shipperController.getOrders);
router.put('/orders/:id/status', uploadProof.single('image'), shipperController.updateOrderStatus);
router.get('/statistics', shipperController.getStatistics);

module.exports = router;
