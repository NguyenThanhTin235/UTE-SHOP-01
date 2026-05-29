const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');
const ProductApproval = require('../models/ProductApproval');
const response = require('../utils/response');

/**
 * GET /api/manager/dashboard
 * Returns all stats needed for the Manager Dashboard Overview.
 */
const getDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // --- Stat Cards ---
    const [pendingShops, pendingProducts] = await Promise.all([
      SellerProfile.countDocuments({ status: 'pending' }),
      Product.countDocuments({ approval_status: 'pending' }),
    ]);

    // "Resolved Today" = shop approvals + product approvals made today
    const [shopsResolvedToday, productsResolvedToday] = await Promise.all([
      SellerProfile.countDocuments({
        status: { $in: ['active', 'rejected'] },
        approved_at: { $gte: todayStart, $lte: todayEnd },
      }),
      ProductApproval.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
    ]);
    const resolvedToday = shopsResolvedToday + productsResolvedToday;

    // --- Approval Trends (last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const productTrends = await ProductApproval.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const shopTrends = await SellerProfile.aggregate([
      {
        $match: {
          status: { $in: ['active', 'rejected'] },
          approved_at: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$approved_at' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map for the last 7 days
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { date: key, count: 0, dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }) };
    }
    productTrends.forEach(({ _id, count }) => {
      if (trendMap[_id]) trendMap[_id].count += count;
    });
    shopTrends.forEach(({ _id, count }) => {
      if (trendMap[_id]) trendMap[_id].count += count;
    });
    const approvalTrends = Object.values(trendMap);

    // --- Pending Tasks (5 most recent: mix shops + products) ---
    const [pendingShopProfiles, pendingProductList] = await Promise.all([
      SellerProfile.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('user_id', 'full_name email'),
      Product.find({ approval_status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('shop_id', 'name'),
    ]);

    const pendingTasks = [
      ...pendingShopProfiles.map((sp) => ({
        id: sp._id,
        type: 'shop',
        title: sp.user_id?.full_name || 'Unknown Seller',
        subtitle: `Shop Registration • ${timeAgo(sp.createdAt)}`,
        icon: 'store',
      })),
      ...pendingProductList.map((p) => ({
        id: p._id,
        type: 'product',
        title: p.name,
        subtitle: `Product Approval • ${timeAgo(p.createdAt)}`,
        icon: 'inventory_2',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // --- Recent Activity (last 8 audit logs) ---
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('actor_id', 'full_name');

    const recentActivity = recentLogs.map((log) => ({
      id: log._id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      metadata: log.metadata,
      actorName: log.actor_id?.full_name || 'System',
      createdAt: log.createdAt,
      timeAgo: timeAgo(log.createdAt),
    }));

    return response.success(res, {
      message: 'Manager dashboard data retrieved successfully',
      data: {
        stats: {
          pendingShops,
          pendingProducts,
          resolvedToday,
        },
        approvalTrends,
        pendingTasks,
        recentActivity,
      },
    });
  } catch (err) {
    console.error('Manager getDashboard error:', err);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to load manager dashboard',
    });
  }
};

// Helper: human-readable time ago
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

// ─── SHOP APPROVAL ─────────────────────────────────────────────────────────────

const getShopDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await SellerProfile.findById(id).populate('user_id', 'full_name email phone');
    if (!profile) return response.error(res, { statusCode: 404, message: 'Profile not found' });

    const shop = await Shop.findOne({ owner_user_id: profile.user_id?._id });
    if (!shop) return response.error(res, { statusCode: 404, message: 'Shop not found' });

    // Build approval history from AuditLog
    const auditLogs = await AuditLog.find({
      entity_type: 'Shop',
      entity_id: { $in: [shop._id, profile._id] }
    })
      .sort({ createdAt: -1 })
      .populate('actor_id', 'full_name');

    const history = auditLogs.map(log => ({
      id: log._id,
      action: log.action === 'APPROVE_SHOP' ? 'Approved Registration' : 
              log.action === 'REJECT_SHOP' ? 'Rejected Registration' : log.action,
      note: log.metadata?.reason || log.metadata?.note || (log.action === 'APPROVE_SHOP' ? 'Application reviewed and approved.' : 'No additional note'),
      actorName: log.actor_id?.full_name || 'System',
      date: log.createdAt
    }));

    history.push({
      id: 'init_' + profile._id,
      action: 'Documents Submitted',
      note: 'Initial registration documents received from applicant.',
      actorName: profile.user_id?.full_name || 'Applicant',
      date: profile.createdAt
    });

    return response.success(res, {
      message: 'Shop detail retrieved',
      data: {
        id: profile._id,
        shopName: shop.name,
        taxId: profile.gst_number || 'N/A',
        legalRep: profile.user_id?.full_name || 'Unknown',
        email: profile.user_id?.email || shop.email || 'N/A',
        phone: shop.phone || 'N/A',
        address: shop.address || profile.pickup_address || 'N/A',
        identity_card_url: profile.identity_card_url,
        business_license_url: profile.business_license_url,
        status: profile.status,
        appliedAt: profile.createdAt,
        history
      }
    });
  } catch (err) {
    console.error('getShopDetail error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getPendingShops = async (req, res) => {
  try {
    const pendingProfiles = await SellerProfile.find({ status: 'pending' })
      .populate('user_id', 'full_name email')
      .sort({ createdAt: -1 });

    const ownerIds = pendingProfiles.map(p => p.user_id?._id).filter(Boolean);
    const shops = await Shop.find({ owner_user_id: { $in: ownerIds } });
    
    // Map shop data to profile
    const results = pendingProfiles.map(profile => {
      const shop = shops.find(s => s.owner_user_id.toString() === profile.user_id?._id?.toString());
      return {
        id: profile._id,
        shopName: shop?.name || 'Unknown Shop',
        taxId: profile.gst_number || 'N/A',
        legalRep: profile.user_id?.full_name || 'Unknown',
        appliedAt: profile.createdAt,
        timeAgo: timeAgo(profile.createdAt),
      };
    });

    return response.success(res, {
      message: 'Pending shops retrieved',
      data: results
    });
  } catch (err) {
    console.error('getPendingShops error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const approveShop = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await SellerProfile.findById(id);
    if (!profile) return response.error(res, { statusCode: 404, message: 'Profile not found' });

    profile.status = 'active';
    profile.approved_by = req.user._id;
    profile.approved_at = new Date();
    await profile.save();

    const shop = await Shop.findOne({ owner_user_id: profile.user_id });
    if (shop) {
      shop.status = 'active';
      await shop.save();
    }

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'APPROVE_SHOP',
      entity_type: 'Shop',
      entity_id: shop ? shop._id : profile._id,
      metadata: { name: shop?.name || 'A shop' }
    });

    return response.success(res, { message: 'Shop approved successfully', data: {} });
  } catch (err) {
    console.error('approveShop error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const rejectShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const profile = await SellerProfile.findById(id);
    if (!profile) return response.error(res, { statusCode: 404, message: 'Profile not found' });

    profile.status = 'rejected';
    profile.rejection_reason = reason || 'No reason provided';
    await profile.save();

    const shop = await Shop.findOne({ owner_user_id: profile.user_id });
    if (shop) {
      shop.status = 'suspended';
      await shop.save();
    }

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'REJECT_SHOP',
      entity_type: 'Shop',
      entity_id: shop ? shop._id : profile._id,
      metadata: { name: shop?.name || 'A shop', reason }
    });

    return response.success(res, { message: 'Shop rejected successfully', data: {} });
  } catch (err) {
    console.error('rejectShop error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const requestShopInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const profile = await SellerProfile.findById(id);
    if (!profile) return response.error(res, { statusCode: 404, message: 'Profile not found' });

    const shop = await Shop.findOne({ owner_user_id: profile.user_id });

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'Information Requested',
      entity_type: 'Shop',
      entity_id: shop ? shop._id : profile._id,
      metadata: { note: note || 'Please provide additional information for your shop registration.' }
    });

    return response.success(res, { message: 'Information request sent successfully', data: {} });
  } catch (err) {
    console.error('requestShopInfo error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

module.exports = { 
  getDashboard,
  getPendingShops,
  getShopDetail,
  approveShop,
  rejectShop,
  requestShopInfo
};
