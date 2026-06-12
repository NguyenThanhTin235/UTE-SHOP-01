const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// GET /api/admin/dashboard
router.get('/dashboard', verifyToken, isAdmin, adminController.getAdminDashboard);

module.exports = router;
