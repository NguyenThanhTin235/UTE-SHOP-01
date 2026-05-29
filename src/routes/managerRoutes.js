const express = require('express');
const router = express.Router();
const { 
  getDashboard, 
  getPendingShops, 
  getShopDetail,
  approveShop, 
  rejectShop,
  requestShopInfo
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

module.exports = router;
