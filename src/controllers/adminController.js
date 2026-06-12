const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Violation = require('../models/Violation');
const SellerProfile = require('../models/SellerProfile');
const ProductMedia = require('../models/ProductMedia');
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

module.exports = {
  getAdminDashboard
};
