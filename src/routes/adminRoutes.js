const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminPromotionController = require('../controllers/adminPromotionController');
const adminLogisticsController = require('../controllers/adminLogisticsController');
const adminUIController = require('../controllers/adminUIController');
const adminRBACController = require('../controllers/adminRBACController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const { uploadProduct, upload } = require('../config/cloudinary');

// GET /api/admin/dashboard
router.get('/dashboard', verifyToken, isAdmin, adminController.getAdminDashboard);

// User Management Routes
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserDetails);
router.put('/users/:id/status', verifyToken, isAdmin, adminController.updateUserStatus);
router.put('/users/:id/role', verifyToken, isAdmin, adminController.updateUserRole);

// Promotions & Campaigns Routes
router.get('/promotions/stats', verifyToken, isAdmin, adminPromotionController.getPromotionsStats);

// Coupons CRUD
router.get('/promotions/coupons', verifyToken, isAdmin, adminPromotionController.getCoupons);
router.post('/promotions/coupons', verifyToken, isAdmin, adminPromotionController.createCoupon);
router.get('/promotions/coupons/:id', verifyToken, isAdmin, adminPromotionController.getCouponById);
router.put('/promotions/coupons/:id', verifyToken, isAdmin, adminPromotionController.updateCoupon);
router.delete('/promotions/coupons/:id', verifyToken, isAdmin, adminPromotionController.deleteCoupon);
router.put('/promotions/coupons/:id/status', verifyToken, isAdmin, adminPromotionController.toggleCouponStatus);

// Campaigns CRUD
router.get('/promotions/campaigns', verifyToken, isAdmin, adminPromotionController.getCampaigns);
router.post('/promotions/campaigns', verifyToken, isAdmin, adminPromotionController.createCampaign);
router.get('/promotions/campaigns/:id', verifyToken, isAdmin, adminPromotionController.getCampaignById);
router.put('/promotions/campaigns/:id', verifyToken, isAdmin, adminPromotionController.updateCampaign);
router.delete('/promotions/campaigns/:id', verifyToken, isAdmin, adminPromotionController.deleteCampaign);

// Auxiliary Routes
router.get('/promotions/products', verifyToken, isAdmin, adminPromotionController.searchProducts);
router.post('/promotions/upload-banner', verifyToken, isAdmin, uploadProduct.single('banner'), adminPromotionController.uploadBanner);

// Finance Settings Routes
router.get('/finance/settings', verifyToken, isAdmin, adminController.getFinanceSettings);
router.put('/finance/settings', verifyToken, isAdmin, adminController.updateFinanceSettings);

// Withdrawal Approval Routes
router.get('/withdrawals', verifyToken, isAdmin, adminController.getWithdrawRequests);
router.put('/withdrawals/:id/approve', verifyToken, isAdmin, adminController.approveWithdraw);
router.put('/withdrawals/:id/reject', verifyToken, isAdmin, adminController.rejectWithdraw);

// Logistics Partners Routes
router.get('/logistics', verifyToken, isAdmin, adminLogisticsController.getShippingPartners);
router.post('/logistics', verifyToken, isAdmin, adminLogisticsController.createShippingPartner);
router.put('/logistics/:id', verifyToken, isAdmin, adminLogisticsController.updateShippingPartner);
router.delete('/logistics/:id', verifyToken, isAdmin, adminLogisticsController.deleteShippingPartner);
router.post('/logistics/upload', verifyToken, isAdmin, upload.single('avatar'), adminLogisticsController.uploadAvatar);


// Security Logs
router.get('/security-logs', verifyToken, isAdmin, adminController.getSecurityLogs);

// RBAC
router.get('/rbac/roles', verifyToken, isAdmin, adminRBACController.getRoles);
router.post('/rbac/roles', verifyToken, isAdmin, adminRBACController.createRole);
router.put('/rbac/roles/:id', verifyToken, isAdmin, adminRBACController.updateRole);
router.delete('/rbac/roles/:id', verifyToken, isAdmin, adminRBACController.deleteRole);
router.get('/rbac/permissions', verifyToken, isAdmin, adminRBACController.getPermissions);
router.put('/rbac/permissions', verifyToken, isAdmin, adminRBACController.updatePermissions);

// UI/UX Config
router.get('/ui-config', verifyToken, isAdmin, adminUIController.getUIConfig);
router.put('/ui-config/theme', verifyToken, isAdmin, adminUIController.updateTheme);
router.put('/ui-config/banners', verifyToken, isAdmin, adminUIController.updateBanners);
router.put('/ui-config/sections', verifyToken, isAdmin, adminUIController.updateSections);
router.post('/ui-config/upload-banner', verifyToken, isAdmin, upload.single('banner'), adminUIController.uploadBanner);

// Blog Management
const adminBlogController = require('../controllers/adminBlogController');
router.get('/blog', verifyToken, isAdmin, adminBlogController.getAllPosts);
router.get('/blog/:id', verifyToken, isAdmin, adminBlogController.getPostById);
router.post('/blog', verifyToken, isAdmin, adminBlogController.createPost);
router.put('/blog/:id', verifyToken, isAdmin, adminBlogController.updatePost);
router.delete('/blog/:id', verifyToken, isAdmin, adminBlogController.deletePost);
router.post('/blog/upload-image', verifyToken, isAdmin, upload.single('image'), adminBlogController.uploadBlogImage);

// Category Management (Platform Settings)
const adminCategoryController = require('../controllers/adminCategoryController');
router.get('/categories', verifyToken, isAdmin, adminCategoryController.getCategories);
router.post('/categories', verifyToken, isAdmin, adminCategoryController.createCategory);
router.post('/categories/reorder', verifyToken, isAdmin, adminCategoryController.reorderCategories);
router.put('/categories/:id', verifyToken, isAdmin, adminCategoryController.updateCategory);
router.delete('/categories/:id', verifyToken, isAdmin, adminCategoryController.deleteCategory);

// Platform Settings - General
const adminPlatformSettingController = require('../controllers/adminPlatformSettingController');
router.get('/platform/settings', verifyToken, isAdmin, adminPlatformSettingController.getSettings);
router.put('/platform/settings', verifyToken, isAdmin, adminPlatformSettingController.updateSettings);
router.post('/platform/settings/upload', verifyToken, isAdmin, upload.single('image'), adminPlatformSettingController.uploadImage);

module.exports = router;
