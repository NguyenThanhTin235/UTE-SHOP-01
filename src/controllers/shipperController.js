const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderStatusHistory = require('../models/OrderStatusHistory');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Address = require('../models/Address');
const ProductMedia = require('../models/ProductMedia');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Get Dashboard Overview for Shipper
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const shipperId = req.user.id;

    const totalAssigned = await Order.countDocuments({ shipper_id: shipperId });
    const inTransit = await Order.countDocuments({ shipper_id: shipperId, status: 'shipped' });
    const delivered = await Order.countDocuments({ shipper_id: shipperId, status: 'delivered' });
    const failed = await Order.countDocuments({ shipper_id: shipperId, status: 'failed' });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDelivered = await Order.countDocuments({
      shipper_id: shipperId,
      status: 'delivered',
      updatedAt: { $gte: today }
    });

    successResponse(res, 'Shipper dashboard overview retrieved successfully', {
      totalAssigned,
      inTransit,
      delivered,
      failed,
      todayDelivered
    });
  } catch (error) {
    console.error('Error getting shipper dashboard:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Get Orders assigned to Shipper
 */
exports.getOrders = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { page = 1, limit = 10, search } = req.query;
    const status = req.params.status || req.query.status;

    const query = { shipper_id: shipperId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.order_code = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('customer_id', 'full_name phone email')
      .populate('shop_id', 'name address phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    successResponse(res, 'Shipper orders retrieved successfully', {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalOrders,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting shipper orders:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Update Order Status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { id } = req.params;
    const { status, note, reason } = req.body;

    if (!['delivered', 'failed'].includes(status)) {
      return errorResponse(res, 'Invalid status update. Only "delivered" or "failed" are allowed.', 400);
    }

    const order = await Order.findOne({ _id: id, shipper_id: shipperId });

    if (!order) {
      return errorResponse(res, 'Order not found or not assigned to you', 404);
    }

    if (order.status !== 'shipped') {
      return errorResponse(res, `Cannot update order status from ${order.status} to ${status}. Order must be in 'shipped' status.`, 400);
    }

    order.status = status;
    await order.save();

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }

    let finalNote = note || `Shipper marked order as ${status}`;
    if (status === 'failed' && reason) {
      finalNote = note ? `${reason} - ${note}` : reason;
    }

    await OrderStatusHistory.create({
      order_id: order._id,
      status: status,
      note: finalNote,
      image_url: imageUrl,
      updated_by: shipperId
    });

    successResponse(res, `Order status updated to ${status} successfully`, { order });
  } catch (error) {
    console.error('Error updating order status:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Get Shipper Statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { timeframe = 'week', startDate, endDate } = req.query; // week, month

    let dateLimit = new Date();
    let finalEndDate = new Date();

    if (startDate && endDate) {
      dateLimit = new Date(startDate);
      finalEndDate = new Date(endDate);
      finalEndDate.setHours(23, 59, 59, 999);
    } else {
      if (timeframe === 'week') {
        dateLimit.setDate(dateLimit.getDate() - 7);
      } else if (timeframe === 'month') {
        dateLimit.setMonth(dateLimit.getMonth() - 1);
      }
    }

    const historyData = await OrderStatusHistory.find({
      updated_by: shipperId,
      status: { $in: ['delivered', 'failed'] },
      createdAt: { $gte: dateLimit, $lte: finalEndDate }
    }).sort({ createdAt: 1 });

    const statsByDate = {};

    // Generate all dates in range
    const currentDate = new Date(dateLimit);
    while (currentDate <= finalEndDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      statsByDate[dateString] = {
        date: dateString,
        delivered: 0,
        failed: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate data
    historyData.forEach(record => {
      const dateString = record.createdAt.toISOString().split('T')[0];
      if (statsByDate[dateString]) {
        if (record.status === 'delivered') {
          statsByDate[dateString].delivered += 1;
        } else if (record.status === 'failed') {
          statsByDate[dateString].failed += 1;
        }
      }
    });

    const chartData = Object.values(statsByDate);

    successResponse(res, 'Shipper statistics retrieved successfully', { chartData });
  } catch (error) {
    console.error('Error getting shipper statistics:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Get Shipper Order Detail
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, shipper_id: shipperId })
      .populate('customer_id', 'full_name email phone avatar')
      .populate('shop_id', 'name slug address logo')
      .populate('shipping_address_id');

    if (!order) {
      return errorResponse(res, 'Order not found or not assigned to you', 404);
    }

    // Fallback if shipping_address_id is null (for older orders)
    let shippingAddress = order.shipping_address_id;
    if (!shippingAddress) {
      shippingAddress = await Address.findOne({ user_id: order.customer_id._id, is_default: true });
      if (!shippingAddress) {
        shippingAddress = await Address.findOne({ user_id: order.customer_id._id });
      }
    }

    // Fetch Order Items
    const orderItemsRaw = await OrderItem.find({ order_id: order._id })
      .populate('product_id', 'name slug selling_price')
      .populate('variant_id');

    const orderItems = await Promise.all(orderItemsRaw.map(async (item) => {
      let imageUrl = 'https://via.placeholder.com/150';
      if (item.product_id) {
        const media = await ProductMedia.findOne({ product_id: item.product_id._id }).sort({ sort_order: 1 });
        if (media) imageUrl = media.media_url;
      }
      return {
        _id: item._id,
        product: item.product_id,
        variant: item.variant_id,
        quantity: item.quantity,
        price_at_buy: item.price_at_buy,
        imageUrl
      };
    }));

    // Fetch Status History Timeline
    const statusHistory = await OrderStatusHistory.find({ order_id: order._id }).sort({ createdAt: 1 });

    successResponse(res, 'Order detail retrieved successfully', {
      order,
      shippingAddress,
      orderItems,
      statusHistory
    });

  } catch (error) {
    console.error('Error getting shipper order detail:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};
