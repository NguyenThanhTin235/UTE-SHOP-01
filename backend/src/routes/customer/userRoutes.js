const express = require('express');
const router = express.Router();
const userController = require('../../controllers/customer/userController');
const userStatisticsController = require('../../controllers/customer/userStatisticsController');
const { verifyToken } = require('../../middleware/authMiddleware');
const { isAdmin, isVendor, isShipper } = require('../../middleware/roleMiddleware');

/**
 * ── PROFILE MANAGEMENT ──
 */

// Lấy thông tin cá nhân hiện tại
router.get('/profile', verifyToken, userController.getProfile);

// Lấy thống kê người dùng
router.get('/statistics', verifyToken, userStatisticsController.getStatistics);

// Cập nhật thông tin cá nhân (UC04 + Avatar, Student Info)
router.put('/profile', verifyToken, userController.updateProfile);

// Đổi mật khẩu (Chủ động)
router.put('/profile/change-password', verifyToken, userController.changePassword);

/**
 * ── SECURITY SETTINGS ──
 */
router.get('/security/settings', verifyToken, userController.getSecuritySettings);
router.put('/security/settings', verifyToken, userController.updateSecuritySettings);

/**
 * ── ADDRESS MANAGEMENT ──
 */

// Lấy danh sách địa chỉ
router.get('/addresses', verifyToken, userController.getAddresses);

// Thêm địa chỉ mới
router.post('/addresses', verifyToken, userController.addAddress);

// Cập nhật địa chỉ
router.put('/addresses/:addressId', verifyToken, userController.updateAddress);

// Xóa địa chỉ
router.delete('/addresses/:addressId', verifyToken, userController.removeAddress);

/**
 * ── NOTIFICATIONS ──
 */
router.get('/notifications/unread-count', verifyToken, userController.getUnreadNotificationCount);
/**
 * ── WISHLIST MANAGEMENT ──
 */
router.get('/wishlist', verifyToken, userController.getWishlist);
router.post('/wishlist', verifyToken, userController.addToWishlist);
router.delete('/wishlist/:productId', verifyToken, userController.removeFromWishlist);

/**
 * ── COINS MANAGEMENT ──
 */
router.get('/coins/transactions', verifyToken, userController.getCoinTransactions);

/**
 * ── RECENTLY VIEWED PRODUCTS ──
 */
router.post('/recently-viewed', verifyToken, userController.recordRecentlyViewed);
router.get('/recently-viewed', verifyToken, userController.getRecentlyViewed);
router.delete('/recently-viewed/:productId', verifyToken, userController.removeFromRecentlyViewed);
router.delete('/recently-viewed', verifyToken, userController.clearRecentlyViewed);

const roleUpgradeController = require('../../controllers/customer/roleUpgradeController');
const { uploadProof } = require('../../config/cloudinary');

/**
 * ── ROLE UPGRADE ──
 */
router.post('/role-upgrades/seller', verifyToken, uploadProof.fields([{ name: 'identity_card', maxCount: 1 }, { name: 'business_license', maxCount: 1 }]), roleUpgradeController.registerSeller);
router.post('/role-upgrades/shipper', verifyToken, uploadProof.fields([{ name: 'cccd_front', maxCount: 1 }, { name: 'cccd_back', maxCount: 1 }]), roleUpgradeController.registerShipper);
router.get('/role-upgrades/status', verifyToken, roleUpgradeController.getUpgradeStatus);

module.exports = router;
