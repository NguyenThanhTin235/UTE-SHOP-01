const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validator');
const { registrationRules, sendOTPRules } = require('../middleware/authValidator');

// Đăng ký
router.post(
  '/register/send-otp', 
  sendOTPRules(), 
  validate, 
  authController.sendOTP
);

router.post(
  '/register', 
  registrationRules(), 
  validate, 
  authController.register
);

// Login
router.post('/login', authController.login);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
