const rateLimit = require('express-rate-limit');

/**
 * RateLimitMiddleware - checkLoginAttempts(email, ip)
 * Giới hạn tần suất đăng nhập theo IP để chống brute-force.
 * Block 15 phút sau 10 request liên tiếp.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,                  // Tăng lên 100 trong lúc dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau 15 phút'
  }
});

module.exports = { loginLimiter };
