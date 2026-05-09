const User = require('../models/User');
const OTP = require('../models/OTP');
const authService = require('../services/authService');
const responseHelper = require('../utils/responseHelper');
const response = require('../utils/response');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.authenticate(email, password);

    return response.success(res, {
      message: 'Đăng nhập thành công',
      data: {
        token: result.token,
        user: result.user,
        redirectUrl: result.redirectUrl
      }
    });
  } catch (err) {
    return response.error(res, {
      statusCode: 401,
      message: err.message
    });
  }
};

/**
 * @desc    Send OTP for registration
 * @route   POST /api/auth/register/send-otp
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendRegistrationOTP(email);

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Mã OTP đã được gửi đến email của bạn',
      data: null,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, otp_code } = req.body;
    const result = await authService.registerUser({
      full_name,
      email,
      password,
      otp_code
    });

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Đăng ký tài khoản thành công',
      data: {
        token: result.token,
        user: {
          id: result.user._id,
          full_name: result.user.full_name,
          email: result.user.email,
          role: result.user.role
        }
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Forgot Password OTP
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return responseHelper.errorResponse(res, 'Email is required', 422, { email: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return responseHelper.errorResponse(res, 'Tài khoản Email không tồn tại', 422, { email: 'Email does not exist' });
    }

    const otpCode = authService.generateOTP ? authService.generateOTP() : Math.floor(100000 + Math.random() * 900000).toString();
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      email,
      otp_code: otpCode,
      otp_type: 'reset_password',
      expired_at: expiredAt
    });

    if (authService.sendOTPEmail) {
      await authService.sendOTPEmail(email, otpCode);
    }

    return responseHelper.successResponse(res, 'Mã OTP đã được gửi về email của bạn');
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return responseHelper.errorResponse(res, 'Internal Server Error', 500);
  }
};

/**
 * @desc    Reset Password using OTP
 * @route   POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!otp) errors.otp = 'OTP is required';
    if (!newPassword) errors.newPassword = 'New Password is required';
    
    if (Object.keys(errors).length > 0) {
      return responseHelper.errorResponse(res, 'Validation failed', 422, errors);
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return responseHelper.errorResponse(res, 'Mật khẩu phải từ 8 ký tự, bao gồm chữ số và ký tự đặc biệt', 422, {
        newPassword: 'Password does not meet security requirements'
      });
    }

    const isValid = await authService.verifyOTP(email, otp, 'reset_password');
    if (!isValid) {
      return responseHelper.errorResponse(res, 'Mã OTP không chính xác hoặc đã hết hạn', 422, {
        otp: 'Invalid or expired OTP'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return responseHelper.errorResponse(res, 'User not found', 404);
    }

    user.password = await authService.hashPassword(newPassword);
    await user.save();

    return responseHelper.successResponse(res, 'Mật khẩu đã được cập nhật thành công');
  } catch (error) {
    console.error('Reset Password Error:', error);
    return responseHelper.errorResponse(res, 'Internal Server Error', 500);
  }
};
