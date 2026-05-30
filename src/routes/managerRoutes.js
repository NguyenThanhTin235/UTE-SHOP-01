const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  getPendingShops, 
  getShopDetail,
  approveShop, 
  rejectShop,
  requestShopInfo,
  getPendingProducts,
  getApprovedProducts,
  getRejectedProducts,
  approveProduct,
  rejectProduct,
  requestProductInfo,
  getProductDetail,
  getViolations,
  getViolationDetail,
  takeViolationAction
} = require('../controllers/managerController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware to ensure only manager or admin can access
const requireManagerOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'manager' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 403,
      message: 'Access denied. Manager or Admin role required.',
      data: null,
      timestamp: Math.floor(Date.now() / 1000),
    });
  }
  next();
};

// GET /api/manager/dashboard
router.get('/dashboard', verifyToken, requireManagerOrAdmin, getDashboard);

// ─── SHOP APPROVAL ──────────────────────────────────────────────────────────
router.get('/shops/pending', verifyToken, requireManagerOrAdmin, getPendingShops);
router.get('/shops/:id', verifyToken, requireManagerOrAdmin, getShopDetail);
router.post('/shops/:id/approve', verifyToken, requireManagerOrAdmin, approveShop);
router.post('/shops/:id/reject', verifyToken, requireManagerOrAdmin, rejectShop);
router.post('/shops/:id/request-info', verifyToken, requireManagerOrAdmin, requestShopInfo);

// ─── PRODUCT APPROVAL ────────────────────────────────────────────────────────
router.get('/products/pending', verifyToken, requireManagerOrAdmin, getPendingProducts);
router.get('/products/approved', verifyToken, requireManagerOrAdmin, getApprovedProducts);
router.get('/products/rejected', verifyToken, requireManagerOrAdmin, getRejectedProducts);
router.get('/products/:id', verifyToken, requireManagerOrAdmin, getProductDetail);
router.post('/products/:id/approve', verifyToken, requireManagerOrAdmin, approveProduct);
router.post('/products/:id/reject', verifyToken, requireManagerOrAdmin, rejectProduct);
router.post('/products/:id/request-info', verifyToken, requireManagerOrAdmin, requestProductInfo);

// ─── VIOLATIONS ─────────────────────────────────────────────────────────────
router.get('/violations', verifyToken, requireManagerOrAdmin, getViolations);
router.get('/violations/:id', verifyToken, requireManagerOrAdmin, getViolationDetail);
router.post('/violations/:id/action', verifyToken, requireManagerOrAdmin, takeViolationAction);

module.exports = router;
