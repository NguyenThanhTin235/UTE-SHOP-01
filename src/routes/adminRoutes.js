const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// GET /api/admin/dashboard
router.get('/dashboard', verifyToken, isAdmin, adminController.getAdminDashboard);

// User Management Routes
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserDetails);
router.put('/users/:id/status', verifyToken, isAdmin, adminController.updateUserStatus);
router.put('/users/:id/role', verifyToken, isAdmin, adminController.updateUserRole);

module.exports = router;
