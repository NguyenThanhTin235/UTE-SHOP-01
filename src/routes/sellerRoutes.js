const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

// ─── PROFILE MANAGEMENT ──
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/profile/change-password', verifyToken, userController.changePassword);

// ─── SECURITY SETTINGS ──
router.get('/security/settings', verifyToken, userController.getSecuritySettings);
router.put('/security/settings', verifyToken, userController.updateSecuritySettings);

// Get products with pagination & filtering
router.get('/products', verifyToken, sellerController.getProducts);

// Export products to excel
router.get('/products/export', verifyToken, sellerController.exportProducts);

// Create new product
router.post('/products', verifyToken, sellerController.createProduct);

// Update product
router.put('/products/:id', verifyToken, sellerController.updateProduct);

// Delete product
router.delete('/products/:id', verifyToken, sellerController.deleteProduct);

// Upload product images
router.post('/products/upload', verifyToken, uploadProduct.array('images', 10), sellerController.uploadProductImages);

// Orders
router.get('/orders', verifyToken, sellerController.getOrders);
router.get('/orders/export', verifyToken, sellerController.exportOrders);
router.get('/orders/:id', verifyToken, sellerController.getOrderById);
router.put('/orders/:id/status', verifyToken, sellerController.updateOrderStatus);

// Cancellations
router.get('/cancellations', verifyToken, sellerController.getCancellations);
router.put('/cancellations/:id/status', verifyToken, sellerController.updateCancellationStatus);

// Analytics
router.get('/analytics', verifyToken, sellerController.getAnalytics);
router.get('/analytics/export', verifyToken, sellerController.exportAnalytics);

// Settings
router.get('/settings', verifyToken, sellerController.getSettings);
router.put('/settings', verifyToken, sellerController.updateSettings);
router.post('/settings/upload', verifyToken, uploadProduct.single('image'), sellerController.uploadShopAssets);
router.delete('/settings', verifyToken, sellerController.deleteShop);

// Wallet
router.get('/wallet', verifyToken, sellerController.getWalletInfo);
router.get('/wallet/transactions', verifyToken, sellerController.getWalletTransactions);
router.get('/wallet/transactions/export', verifyToken, sellerController.exportTransactions);
router.get('/wallet/withdrawals', verifyToken, sellerController.getWithdrawalRequests);
router.get('/wallet/withdrawals/export', verifyToken, sellerController.exportWithdrawals);
router.post('/wallet/withdraw', verifyToken, sellerController.requestWithdrawal);

// Bank Accounts
router.get('/wallet/bank-accounts', verifyToken, sellerController.getBankAccounts);
router.post('/wallet/bank-accounts', verifyToken, sellerController.addBankAccount);
router.put('/wallet/bank-accounts/:id', verifyToken, sellerController.updateBankAccount);
router.put('/wallet/bank-accounts/:id/default', verifyToken, sellerController.setDefaultBankAccount);
// Reviews
router.get('/reviews', verifyToken, sellerController.getSellerReviews);
router.post('/reviews/:id/reply', verifyToken, sellerController.replyToReview);

module.exports = router;
