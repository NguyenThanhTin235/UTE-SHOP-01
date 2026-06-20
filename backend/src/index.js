require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const cartSyncService = require('./services/cartSyncService');

const requestId = require('./middleware/requestId');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3600, // limit each IP to 3600 requests per windowMs
  message: {
    success: false,
    code: 429,
    message: 'Bạn đã yêu cầu quá nhiều lần, vui lòng thử lại sau 15 phút',
    timestamp: Math.floor(Date.now() / 1000)
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(requestId);
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/shared/authRoutes'));
app.use('/api/users', require('./routes/customer/userRoutes'));
app.use('/api/public', require('./routes/customer/publicRoutes'));
app.use('/api/seller', require('./routes/seller/sellerRoutes'));
app.use('/api/notifications', require('./routes/shared/notificationRoutes'));
app.use('/api/cart', require('./routes/customer/cartRoutes'));
app.use('/api/checkout', require('./routes/customer/checkoutRoutes'));
app.use('/api/orders', require('./routes/customer/orderRoutes'));
app.use('/api/reviews', require('./routes/customer/reviewRoutes'));
app.use('/api/manager', require('./routes/manager/managerRoutes'));
app.use('/api/shipper', require('./routes/shipper/shipperRoutes'));
app.use('/api/admin', require('./routes/admin/adminRoutes'));
app.use('/api/support', require('./routes/customer/supportRoutes'));
app.use('/api/chat', require('./routes/shared/chatRoutes'));
app.use('/api/chatbot', require('./routes/customer/chatbotRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: err.message || 'Internal Server Error',
    data: null,
    errors: err.errors || null,
    requestId: req.id,
    timestamp: Math.floor(Date.now() / 1000)
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  cartSyncService.start();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
