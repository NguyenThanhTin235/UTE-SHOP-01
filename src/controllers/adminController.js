const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Violation = require('../models/Violation');
const SellerProfile = require('../models/SellerProfile');
const ProductMedia = require('../models/ProductMedia');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');
const Address = require('../models/Address');
const AuditLog = require('../models/AuditLog');
const response = require('../utils/response');

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
      let imageUrl = 'https://via.placeholder.com/150';
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
        phone: u.phone || 'N/A',
        avatarUrl: u.avatar_url || 'https://via.placeholder.com/150',
        status: u.status,
        coinBalance: u.coin_balance || 0,
        walletBalance: u.wallet_balance || 0,
        role: userRole?.role_id?.name?.toLowerCase() || 'customer',
        createdAt: u.createdAt
      };
    }));

    return response.success(res, {
      message: 'Users retrieved successfully',
      data: populatedUsers,
      meta: {
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
          phone: user.phone || 'N/A',
          avatarUrl: user.avatar_url || 'https://via.placeholder.com/150',
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
        history
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

module.exports = {
  getAdminDashboard,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getUserDetails
};
