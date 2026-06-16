const Order = require('../../models/Order');
const User = require('../../models/User');
const Coupon = require('../../models/Coupon');
const Violation = require('../../models/Violation');
const SellerProfile = require('../../models/SellerProfile');
const ProductMedia = require('../../models/ProductMedia');
const UserRole = require('../../models/UserRole');
const Role = require('../../models/Role');
const Address = require('../../models/Address');
const AuditLog = require('../../models/AuditLog');
const OrderItem = require('../../models/OrderItem');
const Product = require('../../models/Product');
const PlatformFeeSetting = require('../../models/PlatformFeeSetting');
const CoinSetting = require('../../models/CoinSetting');
const WithdrawalSetting = require('../../models/WithdrawalSetting');
const WithdrawRequest = require('../../models/WithdrawRequest');
const Shop = require('../../models/Shop');
const SellerWallet = require('../../models/SellerWallet');
const SellerBankAccount = require('../../models/SellerBankAccount');
const response = require('../../utils/response');

/**
 * Human-readable time ago helper
 */
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * GET /api/admin/dashboard
 */
const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    const days = parseInt(req.query.days) || 30;

    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - days);
    const doublePeriodAgo = new Date();
    doublePeriodAgo.setDate(doublePeriodAgo.getDate() - (days * 2));
    
    // 1. Global GMV (Sum of total_final of all successful orders in selected period)
    const gmvResult = await Order.aggregate([
      { $match: { payment_status: 'success', createdAt: { $gte: periodAgo } } },
      { $group: { _id: null, total: { $sum: '$total_final' } } }
    ]);
    const globalGMV = gmvResult[0]?.total || 0;

    // Prior Period GMV for comparison
    const priorPeriodGmvResult = await Order.aggregate([
      { $match: { payment_status: 'success', createdAt: { $gte: doublePeriodAgo, $lt: periodAgo } } },
      { $group: { _id: null, total: { $sum: '$total_final' } } }
    ]);
    const priorPeriodGMV = priorPeriodGmvResult[0]?.total || 0;
    
    let gmvGrowth = 0;
    if (priorPeriodGMV > 0) {
      gmvGrowth = ((globalGMV - priorPeriodGMV) / priorPeriodGMV) * 100;
    } else if (globalGMV > 0) {
      gmvGrowth = 100;
    }

    // 2. New Users vs Prior Period Users
    const totalUsersCount = await User.countDocuments();
    const newUsersCount = await User.countDocuments({ createdAt: { $gte: periodAgo } });
    const priorUsersCount = await User.countDocuments({ createdAt: { $gte: doublePeriodAgo, $lt: periodAgo } });
    
    let usersGrowth = 0;
    if (priorUsersCount > 0) {
      usersGrowth = ((newUsersCount - priorUsersCount) / priorUsersCount) * 100;
    } else if (newUsersCount > 0) {
      usersGrowth = 100;
    }

    // 3. Active Promotions
    const activePromotions = await Coupon.countDocuments({
      status: 'active',
      end_at: { $gt: today }
    });

    // 4. Security Alerts (Pending violations count)
    const securityAlerts = await Violation.countDocuments({ status: 'pending' });

    // 5. Chart Data based on selected date range
    const chartData = [];
    if (days === 7) {
      // Daily chart data for 7 days
      for (let i = 6; i >= 0; i--) {
        const start = new Date(today);
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const orderSum = await Order.aggregate([
          { $match: { payment_status: 'success', createdAt: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$total_final' } } }
        ]);

        const label = start.toLocaleDateString('en-US', { weekday: 'short' });
        chartData.push({
          label: i === 0 ? 'Today' : label,
          amount: orderSum[0]?.total || 0
        });
      }
    } else if (days === 90) {
      // Monthly chart data for 3 months
      for (let i = 2; i >= 0; i--) {
        const start = new Date(today);
        start.setMonth(start.getMonth() - i);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const orderSum = await Order.aggregate([
          { $match: { payment_status: 'success', createdAt: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$total_final' } } }
        ]);

        const label = start.toLocaleDateString('en-US', { month: 'short' });
        chartData.push({
          label,
          amount: orderSum[0]?.total || 0
        });
      }
    } else {
      // Default: Weekly chart data for last 4 weeks (30 days)
      for (let i = 3; i >= 0; i--) {
        const start = new Date(today);
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date(today);
        end.setDate(end.getDate() - i * 7);
        
        const orderSum = await Order.aggregate([
          { $match: { payment_status: 'success', createdAt: { $gte: start, $lt: end } } },
          { $group: { _id: null, total: { $sum: '$total_final' } } }
        ]);
        chartData.push({
          label: i === 0 ? 'Current' : `W${4 - i}`,
          amount: orderSum[0]?.total || 0
        });
      }
    }

    // Determine percentages for UI bars (max height 95%)
    const maxAmount = Math.max(...chartData.map(w => w.amount), 1);
    const chartDataWithPercentage = chartData.map(w => ({
      ...w,
      percentage: Math.max(Math.round((w.amount / maxAmount) * 95), 10)
    }));

    // 6. Security Pulse Alerts (Large transactions >= 5M VND + Pending Shop registrations)
    const largeOrders = await Order.find({ total_final: { $gte: 5000000 } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('shop_id', 'name');
    
    const largeTransactionAlerts = largeOrders.map(o => ({
      orderCode: o.order_code,
      shopName: o.shop_id?.name || 'Unknown Shop',
      amount: o.total_final,
      timeAgo: timeAgo(o.createdAt)
    }));

    const pendingShopsCount = await SellerProfile.countDocuments({ status: 'pending' });

    // 7. Admin Productivity (Efficiency = Resolved violations / Total violations)
    const resolvedViolations = await Violation.countDocuments({ status: { $in: ['resolved', 'dismissed'] } });
    const totalViolations = await Violation.countDocuments();
    const productivityEfficiency = totalViolations > 0 ? Math.round((resolvedViolations / totalViolations) * 100) : 92;

    // 8. Flagged Product Moderation Queue (Pending violations of products)
    const queue = await Violation.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('shop_id', 'name')
      .populate('product_id', 'name');

    const productModerationQueue = await Promise.all(queue.map(async (v) => {
      let imageUrl = '';
      if (v.product_id) {
        const media = await ProductMedia.findOne({ product_id: v.product_id._id }).sort({ sort_order: 1 });
        if (media) imageUrl = media.media_url;
      }
      return {
        id: v._id,
        name: v.product_id?.name || v.title,
        image: imageUrl,
        seller: v.shop_id?.name || 'Unknown Seller',
        reputation: '4.8',
        violation: v.description || v.title,
        risk: v.severity === 'high' ? 'High' : v.severity === 'medium' ? 'Medium' : 'Low',
        riskColor: v.severity === 'high' 
          ? 'bg-red-50 text-red-600 border border-red-100'
          : v.severity === 'medium'
            ? 'bg-amber-50 text-amber-600 border border-amber-100'
            : 'bg-green-50 text-green-600 border border-green-100'
      };
    }));

    return response.success(res, {
      message: 'Admin dashboard overview data retrieved successfully',
      data: {
        stats: {
          globalGMV,
          lastMonthGMV: priorPeriodGMV,
          gmvGrowth: parseFloat(gmvGrowth.toFixed(1)),
          totalUsers: totalUsersCount,
          newUsers: newUsersCount,
          usersGrowth: parseFloat(usersGrowth.toFixed(1)),
          activePromotions,
          securityAlerts
        },
        weeklyChartData: chartDataWithPercentage,
        securityPulse: {
          largeTransactionAlerts,
          pendingShopsCount
        },
        productivity: {
          resolvedViolations,
          totalViolations,
          efficiency: productivityEfficiency
        },
        productModerationQueue
      }
    });

  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to load admin dashboard statistics',
    });
  }
};

/**
 * GET /api/admin/users
 * Lists users with pagination, role & status filtering, and search.
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;
    const filter = {};

    // 1. Filter by search query
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { full_name: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    // 2. Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 3. Filter by role
    if (role && role !== 'all') {
      const targetRole = await Role.findOne({ name: { $regex: new RegExp('^' + role + '$', 'i') } });
      if (targetRole) {
        const userRoles = await UserRole.find({ role_id: targetRole._id });
        const userIds = userRoles.map(ur => ur.user_id);
        filter._id = { $in: userIds };
      } else {
        // Return empty if role doesn't exist
        filter._id = { $in: [] };
      }
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Populate roles manually for accuracy
    const populatedUsers = await Promise.all(users.map(async (u) => {
      const userRole = await UserRole.findOne({ user_id: u._id }).populate('role_id');
      return {
        id: u._id,
        _id: u._id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone || '',
        avatarUrl: u.avatar_url || '',
        status: u.status,
        coinBalance: u.coin_balance || 0,
        walletBalance: u.wallet_balance || 0,
        role: userRole?.role_id?.name?.toLowerCase() || 'customer',
        createdAt: u.createdAt
      };
    }));

    const totalUsersCount = await User.countDocuments();
    const activeTodayCount = await User.countDocuments({ status: 'active' });
    const newThisWeekCount = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const bannedUsersCount = await User.countDocuments({ status: 'locked' });

    return response.success(res, {
      message: 'Users retrieved successfully',
      data: populatedUsers,
      meta: {
        stats: {
          totalUsers: totalUsersCount,
          activeToday: activeTodayCount,
          newThisWeek: newThisWeekCount,
          bannedUsers: bannedUsersCount
        },
        pagination: {
          total,
          perPage: limit,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('getUsers admin error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve platform users list'
    });
  }
};

/**
 * PUT /api/admin/users/:id/status
 * Locks or unlocks a user profile
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'locked', 'inactive', 'pending'].includes(status)) {
      return response.error(res, {
        statusCode: 422,
        message: 'Invalid profile status values'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return response.error(res, {
        statusCode: 404,
        message: 'User profile not found'
      });
    }

    const oldStatus = user.status;
    user.status = status;
    
    // Nếu chuyển status sang active, reset các cờ khóa đăng nhập
    if (status === 'active') {
      user.failed_login_attempts = 0;
      user.lockout_until = null;
    }
    
    await user.save();

    // Log the action to AuditLog
    await AuditLog.create({
      actor_id: req.user._id,
      action: 'UPDATE_USER_STATUS',
      entity_type: 'User',
      entity_id: user._id,
      metadata: {
        userId: user._id,
        email: user.email,
        oldStatus,
        newStatus: status
      }
    });

    return response.success(res, {
      message: `User profile status updated to ${status} successfully`
    });

  } catch (error) {
    console.error('updateUserStatus admin error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update user profile status'
    });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Changes the administrative role of a user
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'admin', 'manager', 'seller', 'customer'

    if (!role) {
      return response.error(res, {
        statusCode: 422,
        message: 'Role parameter is required'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return response.error(res, {
        statusCode: 404,
        message: 'User profile not found'
      });
    }

    // Find Role object
    const targetRole = await Role.findOne({ name: { $regex: new RegExp('^' + role + '$', 'i') } });
    if (!targetRole) {
      return response.error(res, {
        statusCode: 404,
        message: `Role "${role}" does not exist in the platform system`
      });
    }

    // Find or create UserRole record
    const userRole = await UserRole.findOne({ user_id: user._id });
    const oldRoleId = userRole?.role_id;
    let oldRoleName = 'customer';

    if (oldRoleId) {
      const oldRole = await Role.findById(oldRoleId);
      if (oldRole) oldRoleName = oldRole.name.toLowerCase();
    }

    if (userRole) {
      userRole.role_id = targetRole._id;
      await userRole.save();
    } else {
      await UserRole.create({
        user_id: user._id,
        role_id: targetRole._id
      });
    }

    // Log action to AuditLog
    await AuditLog.create({
      actor_id: req.user._id,
      action: 'UPDATE_USER_ROLE',
      entity_type: 'UserRole',
      entity_id: user._id,
      metadata: {
        userId: user._id,
        email: user.email,
        oldRole: oldRoleName,
        newRole: role.toLowerCase()
      }
    });

    return response.success(res, {
      message: `User role successfully elevated/changed to ${role}`
    });

  } catch (error) {
    console.error('updateUserRole admin error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update user permissions role'
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Fetches comprehensive profile details, shipping addresses, and transaction stats
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return response.error(res, {
        statusCode: 404,
        message: 'User profile not found'
      });
    }

    // Fetch Role
    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
    const roleName = userRole?.role_id?.name?.toLowerCase() || 'customer';

    // Fetch Shipping Addresses
    const addresses = await Address.find({ user_id: user._id });

    // Fetch order counts & total spend
    const ordersCount = await Order.countDocuments({ customer_id: user._id });
    const successfulOrders = await Order.find({ customer_id: user._id, payment_status: 'success' });
    const totalSpent = successfulOrders.reduce((sum, o) => sum + o.total_final, 0);

    // Fetch all orders of this customer with their items
    const allOrders = await Order.find({ customer_id: user._id }).sort({ createdAt: -1 });
    const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
      const items = await OrderItem.find({ order_id: order._id }).populate('product_id');
      const itemsFormatted = await Promise.all(items.map(async (item) => {
        const media = await ProductMedia.findOne({ product_id: item.product_id?._id }).sort({ sort_order: 1 });
        return {
          productId: item.product_id?._id,
          productName: item.product_id?.name || 'Unknown Product',
          productImage: media?.media_url || '',
          quantity: item.quantity,
          price: item.price_at_buy
        };
      }));
      return {
        id: order._id,
        orderCode: order.order_code,
        status: order.status,
        paymentStatus: order.payment_status,
        subtotal: order.subtotal_amount,
        shippingFee: order.shipping_fee,
        totalFinal: order.total_final,
        createdAt: order.createdAt,
        items: itemsFormatted
      };
    }));

    // Fetch audit history actions targeting this user or made by this user
    const auditLogs = await AuditLog.find({
      $or: [
        { entity_id: user._id },
        { actor_id: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actor_id', 'full_name');

    const history = auditLogs.map(log => ({
      id: log._id,
      action: log.action,
      note: log.metadata?.note || log.metadata?.reason || `Role modification: ${log.metadata?.oldRole} -> ${log.metadata?.newRole}` || 'Admin updated user attributes',
      actorName: log.actor_id?.full_name || 'System',
      date: log.createdAt
    }));

    return response.success(res, {
      message: 'User details fetched successfully',
      data: {
        profile: {
          id: user._id,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone || '',
          avatarUrl: user.avatar_url || '',
          status: user.status,
          coinBalance: user.coin_balance || 0,
          walletBalance: user.wallet_balance || 0,
          role: roleName,
          gender: user.gender || 'Not specified',
          dob: user.dob || null,
          createdAt: user.createdAt
        },
        addresses,
        stats: {
          ordersCount,
          successfulOrdersCount: successfulOrders.length,
          totalSpent
        },
        history,
        orders: ordersWithItems
      }
    });

  } catch (error) {
    console.error('getUserDetails admin error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve detailed user profile stats'
    });
  }
};

/**
 * GET /api/admin/finance/settings
 */
const getFinanceSettings = async (req, res) => {
  try {
    const feeSetting = await PlatformFeeSetting.findOne().sort({ effective_from: -1 });
    const coinSetting = await CoinSetting.findOne().sort({ effective_from: -1 });
    let withdrawSetting = await WithdrawalSetting.findOne().sort({ effective_from: -1 });

    if (!withdrawSetting) {
      withdrawSetting = {
        min_withdrawal: 100000,
        max_daily_withdrawal: 50000000,
        payout_processing_time: 'T+1'
      };
    }

    const auditLogs = await AuditLog.find({
      action: 'UPDATE_FINANCE_SETTINGS'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('actor_id', 'full_name');

    const formattedLogs = auditLogs.map(log => ({
      id: log._id,
      admin: log.actor_id?.full_name || 'System',
      action: log.metadata?.action || 'Updated Settings',
      oldValue: log.metadata?.oldValue || '',
      newValue: log.metadata?.newValue || '',
      timestamp: log.createdAt
    }));

    return response.success(res, {
      message: 'Finance settings retrieved successfully',
      data: {
        feeSetting: {
          fee_percent: feeSetting?.fee_percent ?? 3.0,
          gateway_fee_percent: feeSetting?.gateway_fee_percent ?? 1.5,
        },
        coinSetting: {
          earn_rate: coinSetting?.earn_rate ?? 0.01,
          spend_rate: coinSetting?.spend_rate ?? 1,
          max_usage_percent: coinSetting?.max_usage_percent ?? 50,
          expiry_duration: coinSetting?.expiry_duration ?? 'End of Current Year'
        },
        withdrawSetting: {
          min_withdrawal: withdrawSetting.min_withdrawal,
          max_daily_withdrawal: withdrawSetting.max_daily_withdrawal,
          payout_processing_time: withdrawSetting.payout_processing_time
        },
        logs: formattedLogs
      }
    });
  } catch (error) {
    console.error('getFinanceSettings error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve finance settings'
    });
  }
};

/**
 * PUT /api/admin/finance/settings
 */
const updateFinanceSettings = async (req, res) => {
  try {
    const {
      fee_percent,
      gateway_fee_percent,
      earn_rate,
      spend_rate,
      max_usage_percent,
      expiry_duration,
      min_withdrawal,
      max_daily_withdrawal,
      payout_processing_time
    } = req.body;

    const actorId = req.user._id;

    // Fetch current settings to check what changed
    const prevFee = await PlatformFeeSetting.findOne().sort({ effective_from: -1 });
    const prevCoin = await CoinSetting.findOne().sort({ effective_from: -1 });
    const prevWithdraw = await WithdrawalSetting.findOne().sort({ effective_from: -1 });

    const changes = [];

    // 1. Platform Fee Setting
    if (fee_percent !== undefined || gateway_fee_percent !== undefined) {
      const targetFee = fee_percent !== undefined ? Number(fee_percent) : (prevFee?.fee_percent ?? 3.0);
      const targetGateway = gateway_fee_percent !== undefined ? Number(gateway_fee_percent) : (prevFee?.gateway_fee_percent ?? 1.5);

      if (!prevFee || prevFee.fee_percent !== targetFee || prevFee.gateway_fee_percent !== targetGateway) {
        if (prevFee && prevFee.fee_percent !== targetFee) changes.push(`Fee Rate: ${prevFee.fee_percent}% -> ${targetFee}%`);
        if (prevFee && prevFee.gateway_fee_percent !== targetGateway) changes.push(`Gateway Fee: ${prevFee.gateway_fee_percent}% -> ${targetGateway}%`);

        const newFee = new PlatformFeeSetting({
          fee_percent: targetFee,
          gateway_fee_percent: targetGateway,
          effective_from: new Date(),
          created_by: actorId
        });
        await newFee.save();
      }
    }

    // 2. Coin Setting
    if (earn_rate !== undefined || spend_rate !== undefined || max_usage_percent !== undefined || expiry_duration !== undefined) {
      const targetEarn = earn_rate !== undefined ? Number(earn_rate) : (prevCoin?.earn_rate ?? 0.01);
      const targetSpend = spend_rate !== undefined ? Number(spend_rate) : (prevCoin?.spend_rate ?? 1);
      const targetMaxUsage = max_usage_percent !== undefined ? Number(max_usage_percent) : (prevCoin?.max_usage_percent ?? 50);
      const targetExpiry = expiry_duration !== undefined ? expiry_duration : (prevCoin?.expiry_duration ?? 'End of Current Year');

      if (!prevCoin || prevCoin.earn_rate !== targetEarn || prevCoin.spend_rate !== targetSpend || prevCoin.max_usage_percent !== targetMaxUsage || prevCoin.expiry_duration !== targetExpiry) {
        if (prevCoin && prevCoin.earn_rate !== targetEarn) changes.push(`Coin Earn Rate: 10,000đ = ${Math.round(10000 * prevCoin.earn_rate)} coins -> ${Math.round(10000 * targetEarn)} coins`);
        if (prevCoin && prevCoin.max_usage_percent !== targetMaxUsage) changes.push(`Coin Spending Cap: ${prevCoin.max_usage_percent}% -> ${targetMaxUsage}%`);
        if (prevCoin && prevCoin.expiry_duration !== targetExpiry) changes.push(`Coin Expiration: ${prevCoin.expiry_duration} -> ${targetExpiry}`);

        const newCoin = new CoinSetting({
          earn_rate: targetEarn,
          spend_rate: targetSpend,
          max_usage_percent: targetMaxUsage,
          expiry_duration: targetExpiry,
          effective_from: new Date(),
          created_by: actorId
        });
        await newCoin.save();
      }
    }

    // 3. Withdrawal Setting
    if (min_withdrawal !== undefined || max_daily_withdrawal !== undefined || payout_processing_time !== undefined) {
      const targetMin = min_withdrawal !== undefined ? Number(min_withdrawal) : (prevWithdraw?.min_withdrawal ?? 100000);
      const targetMax = max_daily_withdrawal !== undefined ? Number(max_daily_withdrawal) : (prevWithdraw?.max_daily_withdrawal ?? 50000000);
      const targetPayoutTime = payout_processing_time !== undefined ? payout_processing_time : (prevWithdraw?.payout_processing_time ?? 'T+1');

      if (!prevWithdraw || prevWithdraw.min_withdrawal !== targetMin || prevWithdraw.max_daily_withdrawal !== targetMax || prevWithdraw.payout_processing_time !== targetPayoutTime) {
        if (prevWithdraw && prevWithdraw.min_withdrawal !== targetMin) changes.push(`Min Withdraw: ${prevWithdraw.min_withdrawal.toLocaleString()}₫ -> ${targetMin.toLocaleString()}₫`);
        if (prevWithdraw && prevWithdraw.max_daily_withdrawal !== targetMax) changes.push(`Max Withdraw: ${prevWithdraw.max_daily_withdrawal.toLocaleString()}₫ -> ${targetMax.toLocaleString()}₫`);
        if (prevWithdraw && prevWithdraw.payout_processing_time !== targetPayoutTime) changes.push(`Payout Time: ${prevWithdraw.payout_processing_time} -> ${targetPayoutTime}`);

        const newWithdraw = new WithdrawalSetting({
          min_withdrawal: targetMin,
          max_daily_withdrawal: targetMax,
          payout_processing_time: targetPayoutTime,
          effective_from: new Date(),
          created_by: actorId
        });
        await newWithdraw.save();
      }
    }

    if (changes.length > 0) {
      await AuditLog.create({
        actor_id: actorId,
        action: 'UPDATE_FINANCE_SETTINGS',
        entity_type: 'FinanceSetting',
        metadata: {
          action: 'Updated Settings',
          oldValue: 'Previous Configs',
          newValue: changes.join(', ')
        }
      });
    }

    return response.success(res, {
      message: 'Finance settings updated successfully'
    });
  } catch (error) {
    console.error('updateFinanceSettings error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update finance settings'
    });
  }
};

// ==================== Withdrawal Approval ====================

const getWithdrawRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status; // 'pending', 'approved', 'rejected', 'paid'

    const filter = {};
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    const total = await WithdrawRequest.countDocuments(filter);
    const requests = await WithdrawRequest.find(filter)
      .populate({ path: 'shop_id', select: 'name logo_url slug' })
      .populate({ path: 'approved_by', select: 'name email' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch actual bank details from DB for each request
    const requestsWithBank = [];
    for (const reqDoc of requests) {
      const reqObj = reqDoc.toObject();
      const shopId = reqDoc.shop_id?._id || reqDoc.shop_id;
      
      let bankDetails = null;
      if (shopId) {
        // Try to find in SellerBankAccount first
        let bank = await SellerBankAccount.findOne({ shop_id: shopId, is_default: true });
        if (!bank) {
          bank = await SellerBankAccount.findOne({ shop_id: shopId });
        }
        
        if (bank) {
          bankDetails = {
            bankName: bank.bank_name,
            accountName: bank.account_name,
            accountNumber: bank.account_number
          };
        } else {
          // Fallback to SellerProfile of the shop owner
          const shop = await Shop.findById(shopId);
          if (shop && shop.owner_user_id) {
            const profile = await SellerProfile.findOne({ user_id: shop.owner_user_id });
            if (profile) {
              bankDetails = {
                bankName: profile.bank_name || 'N/A',
                accountName: profile.bank_account_name || 'N/A',
                accountNumber: profile.bank_account_number || 'N/A'
              };
            }
          }
        }
      }
      
      reqObj.bankDetails = bankDetails;
      requestsWithBank.push(reqObj);
    }

    // Summary stats
    const allRequests = await WithdrawRequest.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingCount = allRequests.filter(r => r.status === 'pending').length;
    const pendingAmount = allRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const approvedToday = allRequests.filter(r => r.status === 'approved' && r.approved_at && new Date(r.approved_at) >= today).length;
    const rejectedToday = allRequests.filter(r => r.status === 'rejected' && r.updatedAt && new Date(r.updatedAt) >= today).length;

    return response.success(res, {
      data: {
        requests: requestsWithBank,
        summary: {
          pendingCount,
          pendingAmount,
          approvedToday,
          rejectedToday
        }
      },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      message: 'Withdrawal requests retrieved'
    });
  } catch (error) {
    console.error('getWithdrawRequests error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to fetch withdrawal requests' });
  }
};

const approveWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const request = await WithdrawRequest.findById(id);
    if (!request) {
      return response.error(res, { statusCode: 404, message: 'Withdrawal request not found' });
    }
    if (request.status !== 'pending') {
      return response.error(res, { statusCode: 400, message: `Cannot approve a request with status "${request.status}"` });
    }

    request.status = 'approved';
    request.approved_by = adminId;
    request.approved_at = new Date();
    await request.save();

    // Log audit
    await AuditLog.create({
      actor_id: adminId,
      action: 'APPROVE_WITHDRAWAL',
      entity_type: 'WithdrawRequest',
      entity_id: request._id,
      metadata: {
        shop_id: request.shop_id,
        amount: request.amount
      }
    });

    return response.success(res, {
      data: request,
      message: 'Withdrawal request approved successfully'
    });
  } catch (error) {
    console.error('approveWithdraw error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to approve withdrawal' });
  }
};

const rejectWithdraw = async (req, res) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;
    const adminId = req.user.id;

    if (!reject_reason || !reject_reason.trim()) {
      return response.error(res, { statusCode: 400, message: 'Rejection reason is required' });
    }

    const request = await WithdrawRequest.findById(id);
    if (!request) {
      return response.error(res, { statusCode: 404, message: 'Withdrawal request not found' });
    }
    if (request.status !== 'pending') {
      return response.error(res, { statusCode: 400, message: `Cannot reject a request with status "${request.status}"` });
    }

    // Refund the amount back to seller's available balance
    const wallet = await SellerWallet.findOne({ shop_id: request.shop_id });
    if (wallet) {
      wallet.pending_balance = Math.max(0, wallet.pending_balance - request.amount);
      wallet.available_balance += request.amount;
      await wallet.save();
    }

    request.status = 'rejected';
    request.reject_reason = reject_reason.trim();
    await request.save();

    // Log audit
    await AuditLog.create({
      actor_id: adminId,
      action: 'REJECT_WITHDRAWAL',
      entity_type: 'WithdrawRequest',
      entity_id: request._id,
      metadata: {
        shop_id: request.shop_id,
        amount: request.amount,
        reason: reject_reason.trim()
      }
    });

    return response.success(res, {
      data: request,
      message: 'Withdrawal request rejected successfully'
    });
  } catch (error) {
    console.error('rejectWithdraw error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to reject withdrawal' });
  }
};

/**
 * GET /api/admin/security-logs
 * Fetch audit logs with pagination and filters
 */
const getSecurityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { timeRange, role, actionType, search } = req.query;
    const filter = {};

    // Filter by timeRange
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      if (timeRange === '24h') {
        filter.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (timeRange === '7d') {
        filter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === '30d') {
        filter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }

    // Filter by actionType
    if (actionType && actionType !== 'all') {
      if (actionType === 'update') filter.action = { $regex: 'UPDATE', $options: 'i' };
      else if (actionType === 'grant') filter.action = { $regex: 'GRANT|ROLE', $options: 'i' };
      else if (actionType === 'delete') filter.action = { $regex: 'DELETE', $options: 'i' };
      else if (actionType === 'alert') filter.action = { $regex: 'ALERT', $options: 'i' };
      else filter.action = actionType;
    }

    // Filter by role
    if (role && role !== 'all') {
      const targetRole = await Role.findOne({ name: { $regex: new RegExp('^' + role + '$', 'i') } });
      if (targetRole) {
        const userRoles = await UserRole.find({ role_id: targetRole._id });
        const userIds = userRoles.map(ur => ur.user_id);
        filter.actor_id = { $in: userIds };
      } else {
        filter.actor_id = { $in: [] };
      }
    }

    // Filter by search (action, entity_type, or actor name)
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      
      // Search in users first
      const users = await User.find({ full_name: regex }, '_id');
      const userIdsFromSearch = users.map(u => u._id);

      filter.$or = [
        { action: regex },
        { entity_type: regex },
        { actor_id: { $in: userIdsFromSearch } }
      ];
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor_id', 'full_name email avatar_url');

    // Populate role for each actor
    const populatedLogs = await Promise.all(logs.map(async (log) => {
      let roleName = 'user';
      if (log.actor_id) {
        const userRole = await UserRole.findOne({ user_id: log.actor_id._id }).populate('role_id');
        if (userRole && userRole.role_id) {
          roleName = userRole.role_id.name.toLowerCase();
        }
      }
      return {
        _id: log._id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: log.actor_id ? {
          _id: log.actor_id._id,
          full_name: log.actor_id.full_name,
          email: log.actor_id.email,
          avatar: log.actor_id.avatar_url,
          role: roleName
        } : null
      };
    }));

    const totalStats = await AuditLog.countDocuments();

    return response.success(res, {
      message: 'Security logs retrieved successfully',
      data: populatedLogs,
      meta: {
        totalActions: totalStats,
        pagination: {
          total,
          perPage: limit,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('getSecurityLogs error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve security logs'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getUserDetails,
  getFinanceSettings,
  updateFinanceSettings,
  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
  getSecurityLogs
};
