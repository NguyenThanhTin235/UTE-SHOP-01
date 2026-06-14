const ProductReview = require('../models/ProductReview');
const ProductReviewMedia = require('../models/ProductReviewMedia');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductMedia = require('../models/ProductMedia');
const CoinSetting = require('../models/CoinSetting');
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');

// ─────────────────────────────────────────────
// Helper: lấy CoinSetting đang active
// ─────────────────────────────────────────────
const getActiveCoinSetting = async () => {
  const now = new Date();
  const setting = await CoinSetting.findOne({
    effective_from: { $lte: now },
    $or: [{ effective_to: null }, { effective_to: { $gte: now } }]
  }).sort({ effective_from: -1 });
  return setting;
};

// ─────────────────────────────────────────────
// POST /api/reviews — Tạo đánh giá mới + tặng xu
// ─────────────────────────────────────────────
exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { order_item_id, rating, comment } = req.body;

    if (!order_item_id || !rating) {
      return res.status(400).json({
        success: false, code: 400,
        message: 'Missing required information: order_item_id and rating',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    // 1. Lấy OrderItem và kiểm tra quyền sở hữu
    const orderItem = await OrderItem.findById(order_item_id);
    if (!orderItem) {
      return res.status(404).json({
        success: false, code: 404, message: 'Product not found in order',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    // 2. Kiểm tra đơn hàng đã giao thành công chưa
    const order = await Order.findById(orderItem.order_id);
    if (!order || order.customer_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false, code: 403, message: 'You do not have permission to review this product',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false, code: 400,
        message: 'Only delivered order items can be reviewed',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    // 3. Kiểm tra đã đánh giá chưa
    if (orderItem.is_reviewed) {
      return res.status(400).json({
        success: false, code: 400, message: 'You have already reviewed this product',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    // 4. Tính xu thưởng dựa trên giá trị sản phẩm (3%)
    const itemValue = orderItem.price_at_buy * orderItem.quantity;
    const coinReward = Math.max(1, Math.floor(itemValue * 0.03));

    // 5. Tạo ProductReview
    const review = await ProductReview.create({
      user_id: userId,
      product_id: orderItem.product_id,
      order_item_id: orderItem._id,
      rating: Number(rating),
      comment: comment || '',
      coin_earned: coinReward
    });

    // 6. Upload ảnh đính kèm (nếu có)
    if (req.files && req.files.length > 0) {
      const mediaDocuments = req.files.map(file => ({
        product_review_id: review._id,
        media_type: 'image',
        media_url: file.path
      }));
      await ProductReviewMedia.insertMany(mediaDocuments);
    }

    // 7. Đánh dấu OrderItem đã review
    await OrderItem.findByIdAndUpdate(orderItem._id, {
      is_reviewed: true,
      coin_earned_review: coinReward
    });

    // 8. Cộng xu vào tài khoản user
    const user = await User.findById(userId);
    const balanceBefore = user.coin_balance || 0;
    const balanceAfter = balanceBefore + coinReward;

    await User.findByIdAndUpdate(userId, { coin_balance: balanceAfter });

    await CoinTransaction.create({
      user_id: userId,
      order_id: order._id,
      amount: coinReward,
      type: 'earn',
      description: `Reward coins for product review: ${(await Product.findById(orderItem.product_id).select('name'))?.name || ''}`,
      balance_before: balanceBefore,
      balance_after: balanceAfter
    });

    return res.status(201).json({
      success: true, code: 201,
      message: 'Review submitted successfully!',
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          comment: review.comment,
          coinEarned: coinReward,
          createdAt: review.createdAt
        },
        coinsEarned: coinReward,
        newCoinBalance: balanceAfter
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false, code: 400, message: 'You have already reviewed this product',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/reviews — Lấy danh sách review của user đang đăng nhập
// ─────────────────────────────────────────────
exports.getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Parse query params for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Build filter query
    const query = { user_id: userId };

    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Filter by product name (search) or shop ID
    let productFilter = {};
    if (req.query.search) {
      productFilter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.shopId) {
      productFilter.shop_id = req.query.shopId;
    }

    if (req.query.search || req.query.shopId) {
      const products = await Product.find(productFilter).select('_id');
      const productIds = products.map(p => p._id);
      query.product_id = { $in: productIds };
    }

    // Get all user reviews to extract unique shops for frontend filters
    const allUserReviews = await ProductReview.find({ user_id: userId })
      .populate({
        path: 'product_id',
        select: 'shop_id',
        populate: {
          path: 'shop_id',
          select: 'name'
        }
      });

    const shopsMap = new Map();
    allUserReviews.forEach(r => {
      if (r.product_id && r.product_id.shop_id) {
        const s = r.product_id.shop_id;
        shopsMap.set(s._id.toString(), s.name);
      }
    });
    const uniqueShops = Array.from(shopsMap.entries()).map(([id, name]) => ({ id, name }));

    // Get count and paginated reviews
    const total = await ProductReview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const reviews = await ProductReview.find(query)
      .populate({
        path: 'product_id',
        select: 'name slug shop_id',
        populate: {
          path: 'shop_id',
          select: 'name'
        }
      })
      .populate('order_item_id', 'quantity price_at_buy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const reviewsWithMedia = await Promise.all(reviews.map(async (r) => {
      const media = await ProductReviewMedia.find({ product_review_id: r._id });
      // Lấy ảnh đại diện sản phẩm
      const productMedia = await ProductMedia.findOne({ product_id: r.product_id?._id }).sort({ sort_order: 1 });

      return {
        id: r._id,
        rating: r.rating,
        comment: r.comment,
        coinEarned: r.coin_earned || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        product: r.product_id ? {
          id: r.product_id._id,
          name: r.product_id.name,
          slug: r.product_id.slug,
          imageUrl: productMedia?.media_url || null,
          shop: r.product_id.shop_id ? {
            id: r.product_id.shop_id._id,
            name: r.product_id.shop_id.name
          } : null
        } : null,
        orderItem: r.order_item_id ? {
          id: r.order_item_id._id,
          quantity: r.order_item_id.quantity,
          priceAtBuy: r.order_item_id.price_at_buy
        } : null,
        media: media.map(m => ({ id: m._id, url: m.media_url, type: m.media_type })),
        replyComment: r.reply_comment,
        replyCreatedAt: r.reply_createdAt
      };
    }));

    return res.status(200).json({
      success: true, code: 200,
      message: 'Successfully fetched review list',
      data: reviewsWithMedia,
      pagination: {
        page,
        limit,
        totalPages,
        total
      },
      filterOptions: {
        shops: uniqueShops
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PUT /api/reviews/:id — Sửa đánh giá
// ─────────────────────────────────────────────
exports.updateReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { rating, comment, delete_media_ids } = req.body;

    const review = await ProductReview.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false, code: 404, message: 'Review not found',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
    if (review.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false, code: 403, message: 'You do not have permission to edit this review',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    // Cập nhật rating, comment
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Xóa ảnh cũ nếu được chỉ định
    let deleteIds = delete_media_ids;
    if (deleteIds && !Array.isArray(deleteIds)) {
      deleteIds = [deleteIds];
    }
    if (deleteIds && Array.isArray(deleteIds) && deleteIds.length > 0) {
      await ProductReviewMedia.deleteMany({
        _id: { $in: deleteIds },
        product_review_id: review._id
      });
    }

    // Thêm ảnh mới nếu có upload
    if (req.files && req.files.length > 0) {
      const currentMediaCount = await ProductReviewMedia.countDocuments({ product_review_id: review._id });
      const canAdd = 5 - currentMediaCount;
      if (canAdd > 0) {
        const newMedia = req.files.slice(0, canAdd).map(file => ({
          product_review_id: review._id,
          media_type: 'image',
          media_url: file.path
        }));
        await ProductReviewMedia.insertMany(newMedia);
      }
    }

    const updatedMedia = await ProductReviewMedia.find({ product_review_id: review._id });

    return res.status(200).json({
      success: true, code: 200,
      message: 'Successfully updated review',
      data: {
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        coinEarned: review.coin_earned,
        updatedAt: review.updatedAt,
        media: updatedMedia.map(m => ({ id: m._id, url: m.media_url, type: m.media_type }))
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/reviews/:id — Xóa đánh giá + hoàn xu
// ─────────────────────────────────────────────
exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const review = await ProductReview.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false, code: 404, message: 'Review not found',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
    if (review.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false, code: 403, message: 'You do not have permission to delete this review',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    const coinToDeduct = review.coin_earned || 0;

    // Xóa media đính kèm
    await ProductReviewMedia.deleteMany({ product_review_id: review._id });

    // Xóa review
    await ProductReview.findByIdAndDelete(id);

    // Đặt lại trạng thái OrderItem
    await OrderItem.findByIdAndUpdate(review.order_item_id, {
      is_reviewed: false,
      coin_earned_review: 0
    });

    // Trừ xu đã thưởng (nếu có)
    if (coinToDeduct > 0) {
      const user = await User.findById(userId);
      const balanceBefore = user.coin_balance || 0;
      const balanceAfter = Math.max(0, balanceBefore - coinToDeduct);

      await User.findByIdAndUpdate(userId, { coin_balance: balanceAfter });

      await CoinTransaction.create({
        user_id: userId,
        amount: coinToDeduct,
        type: 'spend',
        description: 'Refund coins for deleted product review',
        balance_before: balanceBefore,
        balance_after: balanceAfter
      });
    }

    return res.status(200).json({
      success: true, code: 200,
      message: 'Successfully deleted review',
      data: { coinsDeducted: coinToDeduct },
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/orders/:orderId/reviewable — Lấy các item của đơn hàng delivered (kèm review nếu có)
// ─────────────────────────────────────────────
exports.getReviewableItems = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order || order.customer_id.toString() !== userId.toString()) {
      return res.status(404).json({
        success: false, code: 404, message: 'Order not found',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false, code: 400,
        message: 'Only delivered order items can be reviewed',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }

    const orderItems = await OrderItem.find({ order_id: orderId });

    const itemsWithDetails = await Promise.all(orderItems.map(async (item) => {
      const product = await Product.findById(item.product_id).select('name slug');
      const productMedia = await ProductMedia.findOne({ product_id: item.product_id }).sort({ sort_order: 1 });

      // Tính xu dự kiến nếu đánh giá (3%)
      const estimatedCoins = Math.max(1, Math.floor(item.price_at_buy * item.quantity * 0.03));

      // Lấy review hiện tại (nếu đã đánh giá)
      let existingReview = null;
      if (item.is_reviewed) {
        const review = await ProductReview.findOne({
          order_item_id: item._id,
          user_id: userId
        });
        if (review) {
          const media = await ProductReviewMedia.find({ product_review_id: review._id });
          existingReview = {
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            coinEarned: review.coin_earned,
            createdAt: review.createdAt,
            media: media.map(m => ({ id: m._id, url: m.media_url }))
          };
        }
      }

      return {
        orderItemId: item._id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        priceAtBuy: item.price_at_buy,
        isReviewed: item.is_reviewed,
        estimatedCoins,
        product: product ? {
          name: product.name,
          slug: product.slug,
          imageUrl: productMedia?.media_url || null
        } : null,
        existingReview
      };
    }));

    return res.status(200).json({
      success: true, code: 200,
      message: 'Successfully fetched reviewable products',
      data: itemsWithDetails,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};
