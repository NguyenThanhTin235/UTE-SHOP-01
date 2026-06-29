const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const OrderStatusHistory = require('../../models/OrderStatusHistory');
const User = require('../../models/User');
const Shop = require('../../models/Shop');
const Address = require('../../models/Address');
const ProductMedia = require('../../models/ProductMedia');
const ShipperProfile = require('../../models/ShipperProfile');
const PaymentOrder = require('../../models/PaymentOrder');
const Payment = require('../../models/Payment');
const { successResponse, errorResponse } = require('../../utils/responseHelper');

/**
 * Get Dashboard Overview for Shipper
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const shipperId = req.user.id;

    const totalAssigned = await Order.countDocuments({ shipper_id: shipperId });
    const inTransit = await Order.countDocuments({ shipper_id: shipperId, status: 'shipping' });
    const delivered = await Order.countDocuments({ shipper_id: shipperId, status: 'completed' });
    const failed = await Order.countDocuments({ shipper_id: shipperId, status: 'failed' });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDelivered = await Order.countDocuments({
      shipper_id: shipperId,
      status: 'completed',
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

    let query = {};

    if (status && status !== 'all') {
      query.shipper_id = shipperId;
      query.status = status;
    } else {
      // For 'all', we need to fetch assigned orders AND available orders
      const profile = await ShipperProfile.findOne({ user_id: shipperId });
      const ShippingPartner = require('../../models/ShippingPartner');
      let partner;
      if (profile && profile.shipping_company) {
        if (profile.shipping_company.length === 24) {
          partner = await ShippingPartner.findById(profile.shipping_company);
        }
        if (!partner) {
          partner = await ShippingPartner.findOne({ name: profile.shipping_company });
        }
      }

      if (partner) {
        query.$or = [
          { shipper_id: shipperId },
          { status: 'ready_to_ship', shipping_partner_id: partner._id }
        ];
      } else {
        query.shipper_id = shipperId;
      }
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
 * Get Available Orders for Shipper
 */
exports.getAvailableOrders = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { page = 1, limit = 10, search } = req.query;

    const profile = await ShipperProfile.findOne({ user_id: shipperId });
    if (!profile || !profile.shipping_company) {
      return errorResponse(res, 'Shipper profile not found or no shipping company assigned', 400);
    }

    const ShippingPartner = require('../../models/ShippingPartner');
    let partner;
    if (profile.shipping_company.length === 24) {
      partner = await ShippingPartner.findById(profile.shipping_company);
    }
    if (!partner) {
      partner = await ShippingPartner.findOne({ name: profile.shipping_company });
    }

    if (!partner) {
      return errorResponse(res, 'Shipping partner not found', 404);
    }

    const query = { status: 'ready_to_ship', shipping_partner_id: partner._id };

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

    successResponse(res, 'Available orders retrieved successfully', {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalOrders,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting available orders:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Accept an Available Order
 */
exports.acceptOrder = async (req, res) => {
  try {
    const shipperId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, status: 'ready_to_ship' });

    if (!order) {
      return errorResponse(res, 'Order not found or no longer available', 404);
    }

    if (order.shipper_id) {
      return errorResponse(res, 'Order is already taken by another shipper', 400);
    }

    const profile = await ShipperProfile.findOne({ user_id: shipperId });
    const ShippingPartner = require('../../models/ShippingPartner');
    let partner;
    if (profile && profile.shipping_company && profile.shipping_company.length === 24) {
      partner = await ShippingPartner.findById(profile.shipping_company);
    }
    if (!partner && profile) {
      partner = await ShippingPartner.findOne({ name: profile.shipping_company });
    }

    if (!partner || order.shipping_partner_id.toString() !== partner._id.toString()) {
      return errorResponse(res, 'You are not authorized to accept this order', 403);
    }

    order.shipper_id = shipperId;
    order.status = 'shipping';
    await order.save();

    await OrderStatusHistory.create({
      order_id: order._id,
      status: 'shipping',
      note: 'Order accepted by shipper and is now shipping',
      updated_by: shipperId
    });

    successResponse(res, 'Order accepted successfully', { order });
  } catch (error) {
    console.error('Error accepting order:', error);
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

    if (!['completed', 'failed'].includes(status)) {
      return errorResponse(res, 'Invalid status update. Only "delivered" or "failed" are allowed.', 400);
    }

    const order = await Order.findOne({ _id: id, shipper_id: shipperId }).populate('shop_id');

    if (!order) {
      return errorResponse(res, 'Order not found or not assigned to you', 404);
    }

    if (order.status !== 'shipping') {
      return errorResponse(res, `Cannot update order status from ${order.status} to ${status}. Order must be in 'shipping' status.`, 400);
    }

    order.status = status;

    if (status === 'completed') {
      const paymentOrder = await PaymentOrder.findById(order.payment_order_id);
      if (paymentOrder && (paymentOrder.payment_method === 'cod' || order.payment_status === 'success')) {
          order.payment_status = 'success';

          await Payment.updateMany(
              { payment_order_id: order.payment_order_id, status: 'pending' },
              { status: 'success', payment_date: new Date() }
          );

          const siblingOrders = await Order.find({ payment_order_id: paymentOrder._id });
          const allSiblingSuccess = siblingOrders.every(so =>
              so._id.toString() === order._id.toString() ? true : so.payment_status === 'success' || so.status === 'completed'
          );
          if (allSiblingSuccess) {
              paymentOrder.payment_status = 'success';
              await paymentOrder.save();
          }
      }
    }

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

    // Notify Customer and Seller
    try {
      const Notification = require('../../models/Notification');
      const io = req.app.get('socketio');

      let customerTitle = 'Order Delivered';
      let customerContent = `Your order ${order.order_code} has been successfully delivered by the shipper.`;
      let sellerTitle = 'Order Completed';
      let sellerContent = `Order ${order.order_code} has been successfully delivered to the customer.`;

      if (status === 'failed') {
        customerTitle = 'Delivery Failed';
        customerContent = `Delivery for order ${order.order_code} failed. Reason: ${reason || note || 'Unknown'}`;
        sellerTitle = 'Delivery Failed';
        sellerContent = `Delivery for order ${order.order_code} failed. Reason: ${reason || note || 'Unknown'}`;
      }

      const customerNotif = await Notification.create({
        user_id: order.customer_id,
        title: customerTitle,
        content: customerContent,
        category: 'Orders',
        type: 'order',
        link: `/order-history/${order._id}`
      });

      const sellerNotif = await Notification.create({
        user_id: order.shop_id.owner_user_id,
        title: sellerTitle,
        content: sellerContent,
        category: 'Orders',
        type: 'order',
        link: `/seller/orders/${order._id}`
      });

      if (io) {
        io.to(order.customer_id.toString()).emit('notification', {
          id: customerNotif._id.toString(),
          title: customerNotif.title,
          content: customerNotif.content,
          category: customerNotif.category,
          type: customerNotif.type,
          date: 'JUST NOW',
          link: customerNotif.link,
          is_read: false
        });
        io.to(order.shop_id.owner_user_id.toString()).emit('notification', {
          id: sellerNotif._id.toString(),
          title: sellerNotif.title,
          content: sellerNotif.content,
          category: sellerNotif.category,
          type: sellerNotif.type,
          date: 'JUST NOW',
          link: sellerNotif.link,
          is_read: false
        });
      }
    } catch (notifErr) {
      console.error('Notification Error on Shipper Status Update:', notifErr);
    }

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
      status: { $in: ['completed', 'failed'] },
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
        if (record.status === 'completed') {
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
      .populate('shop_id', 'name slug address logo latitude longitude')
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

/**
 * Get Shipper Profile
 */
exports.getShipperProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password -failed_login_attempts -lockout_until');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    let profile = await ShipperProfile.findOne({ user_id: userId });
    if (!profile) {
      profile = await ShipperProfile.create({ user_id: userId });
    }

    successResponse(res, 'Shipper profile retrieved successfully', {
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        dob: user.dob,
        status: user.status,
        createdAt: user.createdAt
      },
      profile: {
        id: profile._id,
        cccdNumber: profile.cccd_number,
        cccdFrontUrl: profile.cccd_front_url,
        cccdBackUrl: profile.cccd_back_url,
        vehicleType: profile.vehicle_type,
        vehiclePlate: profile.vehicle_plate,
        shippingCompany: profile.shipping_company,
        operatingArea: profile.operating_area,
        emergencyContact: profile.emergency_contact,
        emergencyContactName: profile.emergency_contact_name,
        bankName: profile.bank_name,
        bankAccountName: profile.bank_account_name,
        bankAccountNumber: profile.bank_account_number,
        profileStatus: profile.status,
        joinedDate: profile.joined_date
      }
    });
  } catch (error) {
    console.error('Error getting shipper profile:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};

/**
 * Update Shipper Profile
 */
exports.updateShipperProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      phone, fullName, gender, dob,
      cccdNumber, cccdFrontUrl, cccdBackUrl,
      vehicleType, vehiclePlate, shippingCompany, operatingArea,
      emergencyContact, emergencyContactName,
      bankName, bankAccountName, bankAccountNumber
    } = req.body;

    // Update User basic info
    const userUpdate = {};
    if (fullName !== undefined) userUpdate.full_name = fullName;
    if (phone !== undefined) userUpdate.phone = phone;
    if (gender !== undefined) userUpdate.gender = gender;
    if (dob !== undefined) userUpdate.dob = dob;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdate);
    }

    // Update ShipperProfile (upsert)
    const profileUpdate = {};
    if (cccdNumber !== undefined) profileUpdate.cccd_number = cccdNumber;
    if (cccdFrontUrl !== undefined) profileUpdate.cccd_front_url = cccdFrontUrl;
    if (cccdBackUrl !== undefined) profileUpdate.cccd_back_url = cccdBackUrl;
    if (vehicleType !== undefined) profileUpdate.vehicle_type = vehicleType;
    if (vehiclePlate !== undefined) profileUpdate.vehicle_plate = vehiclePlate;
    if (shippingCompany !== undefined) profileUpdate.shipping_company = shippingCompany;
    if (operatingArea !== undefined) profileUpdate.operating_area = operatingArea;
    if (emergencyContact !== undefined) profileUpdate.emergency_contact = emergencyContact;
    if (emergencyContactName !== undefined) profileUpdate.emergency_contact_name = emergencyContactName;
    if (bankName !== undefined) profileUpdate.bank_name = bankName;
    if (bankAccountName !== undefined) profileUpdate.bank_account_name = bankAccountName;
    if (bankAccountNumber !== undefined) profileUpdate.bank_account_number = bankAccountNumber;

    await ShipperProfile.findOneAndUpdate(
      { user_id: userId },
      { $set: profileUpdate },
      { upsert: true, new: true }
    );

    // Return updated full profile
    const user = await User.findById(userId).select('-password -failed_login_attempts -lockout_until');
    const profile = await ShipperProfile.findOne({ user_id: userId });

    successResponse(res, 'Shipper profile updated successfully', {
      user: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        dob: user.dob,
        status: user.status,
        createdAt: user.createdAt
      },
      profile: {
        id: profile._id,
        cccdNumber: profile.cccd_number,
        cccdFrontUrl: profile.cccd_front_url,
        cccdBackUrl: profile.cccd_back_url,
        vehicleType: profile.vehicle_type,
        vehiclePlate: profile.vehicle_plate,
        shippingCompany: profile.shipping_company,
        operatingArea: profile.operating_area,
        emergencyContact: profile.emergency_contact,
        emergencyContactName: profile.emergency_contact_name,
        bankName: profile.bank_name,
        bankAccountName: profile.bank_account_name,
        bankAccountNumber: profile.bank_account_number,
        profileStatus: profile.status,
        joinedDate: profile.joined_date
      }
    });
  } catch (error) {
    console.error('Error updating shipper profile:', error);
    errorResponse(res, 'Internal server error', 500, error.message);
  }
};
