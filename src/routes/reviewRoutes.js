const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadReview } = require('../config/cloudinary');

// Lấy danh sách đánh giá của user đang đăng nhập
router.get('/', verifyToken, reviewController.getMyReviews);

// Tạo đánh giá mới (kèm upload ảnh tối đa 5 tấm)
router.post('/', verifyToken, uploadReview.array('images', 5), reviewController.createReview);

// Sửa đánh giá (kèm upload ảnh bổ sung)
router.put('/:id', verifyToken, uploadReview.array('images', 5), reviewController.updateReview);

// Xóa đánh giá
router.delete('/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
