const SellerProfile = require('../models/SellerProfile');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const AuditLog = require('../models/AuditLog');
const ProductApproval = require('../models/ProductApproval');
const ProductMedia = require('../models/ProductMedia');
const ProductVariant = require('../models/ProductVariant');
const Violation = require('../models/Violation');
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
    const [pendingShops, pendingProducts, activeReports] = await Promise.all([
      SellerProfile.countDocuments({ status: 'pending' }),
      Product.countDocuments({ approval_status: 'pending' }),
      Violation.countDocuments({ status: 'pending' }),
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

    // --- Pending Tasks (15 most recent: mix shops + products + violations) ---
    const [pendingShopProfiles, pendingProductList, pendingViolations] = await Promise.all([
      SellerProfile.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user_id', 'full_name email'),
      Product.find({ approval_status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('shop_id', 'name'),
      Violation.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('shop_id', 'name')
    ]);

    const pendingTasks = [
      ...pendingShopProfiles.map((sp) => ({
        id: sp._id,
        type: 'shop',
        title: sp.user_id?.full_name || 'Unknown Seller',
        subtitle: `Shop Registration • ${timeAgo(sp.createdAt)}`,
        icon: 'store',
        createdAt: sp.createdAt,
      })),
      ...pendingProductList.map((p) => ({
        id: p._id,
        type: 'product',
        title: p.name,
        subtitle: `Product Approval • ${timeAgo(p.createdAt)}`,
        icon: 'inventory_2',
        createdAt: p.createdAt,
      })),
      ...pendingViolations.map((v) => ({
        id: v._id,
        type: 'violation',
        title: v.title || 'Violation Report',
        subtitle: `Incident • ${timeAgo(v.createdAt)}`,
        icon: 'report_problem',
        createdAt: v.createdAt,
      }))
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

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
          activeReports,
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

// ─── PRODUCT APPROVAL ────────────────────────────────────────────────────────
const fetchProductsByStatus = async (status, req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments({ approval_status: status });
    const products = await Product.find({ approval_status: status })
      .populate('shop_id', 'name owner_user_id')
      .populate('category_id', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const productIds = products.map(p => p._id);
    const media = await ProductMedia.find({ product_id: { $in: productIds }, media_type: 'image' }).sort({ sort_order: 1 });

    const mediaMap = {};
    media.forEach(m => {
      if (!mediaMap[m.product_id.toString()]) {
        mediaMap[m.product_id.toString()] = m.media_url;
      }
    });

    const data = products.map(p => {
      return {
        id: p._id,
        name: p.name,
        price: p.selling_price,
        sku: p.sku || p.slug || p._id.toString().substring(0, 8),
        shopName: p.shop_id?.name || 'Unknown Shop',
        category: p.category_id?.name || 'Uncategorized',
        image_url: mediaMap[p._id.toString()] || 'https://via.placeholder.com/200',
        submittedAt: p.createdAt,
        sellerStatus: p.shop_id ? 'Pro Seller' : 'New Seller'
      };
    });

    return response.success(res, {
      data,
      meta: {
        pagination: {
          total,
          count: data.length,
          perPage: limit,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error(`fetchProductsByStatus error:`, err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getPendingProducts = (req, res) => fetchProductsByStatus('pending', req, res);
const getApprovedProducts = (req, res) => fetchProductsByStatus('approved', req, res);
const getRejectedProducts = (req, res) => fetchProductsByStatus('rejected', req, res);

const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { approval_status: 'approved' }, { new: true });
    if (!product) return response.error(res, { statusCode: 404, message: 'Product not found' });

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'Approve Product',
      entity_type: 'Product',
      entity_id: product._id,
      metadata: { name: product.name }
    });

    return response.success(res, { message: 'Product approved' });
  } catch (err) {
    console.error('approveProduct error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const product = await Product.findByIdAndUpdate(id, { approval_status: 'rejected' }, { new: true });
    if (!product) return response.error(res, { statusCode: 404, message: 'Product not found' });

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'Reject Product',
      entity_type: 'Product',
      entity_id: product._id,
      metadata: { name: product.name, reason }
    });

    return response.success(res, { message: 'Product rejected' });
  } catch (err) {
    console.error('rejectProduct error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const requestProductInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const product = await Product.findById(id);
    if (!product) return response.error(res, { statusCode: 404, message: 'Product not found' });

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'Information Requested',
      entity_type: 'Product',
      entity_id: product._id,
      metadata: { name: product.name, note }
    });

    return response.success(res, { message: 'Information request sent' });
  } catch (err) {
    console.error('requestProductInfo error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('shop_id', 'name owner_user_id')
      .populate('category_id', 'name');

    if (!product) return response.error(res, { statusCode: 404, message: 'Product not found' });

    // Fetch media
    const media = await ProductMedia.find({ product_id: product._id }).sort({ sort_order: 1 });
    const images = media.map(m => m.media_url);

    // Fetch attributes / stock
    let variants = [];
    try {
      variants = await ProductVariant.find({ product_id: product._id });
    } catch (e) { }

    let totalStock = 0;
    let attributes = [];
    if (variants && variants.length > 0) {
      totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      attributes = variants.map(v => v.attributes);
    } else {
      totalStock = 50; // Mock stock if variants not found
      attributes = [{ "color": "N/A", "size": "N/A" }];
    }

    // Fetch Shop Info
    const shop = await Shop.findById(product.shop_id?._id).populate('owner_user_id', 'full_name');
    const totalProducts = await Product.countDocuments({ shop_id: shop?._id });

    // Fetch AuditLog
    const auditLogs = await AuditLog.find({
      entity_type: 'Product',
      entity_id: product._id
    })
      .sort({ createdAt: -1 })
      .populate('actor_id', 'full_name');

    const history = auditLogs.map(log => ({
      id: log._id,
      action: log.action,
      note: log.metadata?.reason || log.metadata?.note || 'No additional note',
      actorName: log.actor_id?.full_name || 'System',
      date: log.createdAt
    }));

    // Add default creation event if empty or as initial
    history.push({
      id: 'init_' + product._id,
      action: 'Product Uploaded',
      note: `New product listing "${product.name}" submitted.`,
      actorName: 'Seller Portal',
      date: product.createdAt
    });

    return response.success(res, {
      message: 'Product detail retrieved',
      data: {
        id: product._id,
        name: product.name,
        price: product.selling_price,
        mrp_price: product.mrp_price,
        description: product.description,
        sku: product.sku || product._id.toString().substring(0, 8),
        category: product.category_id?.name || 'Uncategorized',
        status: product.approval_status,
        stock: totalStock,
        attributes: attributes,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'],
        shop: {
          id: shop?._id,
          name: shop?.name || 'Unknown Shop',
          ownerName: shop?.owner_user_id?.full_name || 'Unknown',
          rating: '4.8 (1.2k Reviews)',
          totalProducts: totalProducts,
          violationHistory: 'Clean (0)'
        },
        history: history
      }
    });
  } catch (err) {
    console.error('getProductDetail error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getViolations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const severity = req.query.severity || 'all';
    const querySearch = req.query.search || '';

    const filter = { status: 'pending' };

    if (severity !== 'all') {
      filter.severity = severity.toLowerCase();
    }

    if (querySearch) {
      filter.$or = [
        { title: { $regex: querySearch, $options: 'i' } },
        { description: { $regex: querySearch, $options: 'i' } }
      ];
    }

    const total = await Violation.countDocuments(filter);
    const violations = await Violation.find(filter)
      .populate({
        path: 'shop_id',
        select: 'name slug owner_user_id email phone address'
      })
      .populate({
        path: 'product_id',
        select: 'name slug mrp_price selling_price'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const data = violations.map(v => {
      return {
        id: v._id,
        _id: v._id,
        shop_id: v.shop_id,
        product_id: v.product_id,
        title: v.title,
        description: v.description,
        severity: v.severity,
        status: v.status,
        reportedByCount: v.reportedByCount,
        reporterInfo: v.reporterInfo,
        type: v.type,
        actionTaken: v.actionTaken,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      };
    });

    return response.success(res, {
      message: 'Violations retrieved successfully',
      data,
      meta: {
        pagination: {
          total,
          count: data.length,
          perPage: limit,
          currentPage: page,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('getViolations error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getViolationDetail = async (req, res) => {
  try {
    const violation = await Violation.findById(req.params.id)
      .populate({
        path: 'shop_id',
        select: 'name slug owner_user_id email phone address status'
      })
      .populate({
        path: 'product_id',
        select: 'name slug mrp_price selling_price main_image status'
      });

    if (!violation) {
      return response.error(res, { statusCode: 404, message: 'Violation not found' });
    }

    // Fetch history for the same shop, excluding the current violation
    const history = await Violation.find({ 
      shop_id: violation.shop_id._id, 
      _id: { $ne: violation._id },
      status: { $in: ['resolved', 'dismissed'] }
    }).sort({ createdAt: -1 }).limit(5);

    return response.success(res, {
      message: 'Violation detail retrieved successfully',
      data: {
        violation,
        history
      }
    });
  } catch (err) {
    console.error('getViolationDetail error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const takeViolationAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'lock_shop', 'hide_products', 'issue_warning', 'suspend_chat', 'dismiss'

    const violation = await Violation.findById(id).populate('shop_id');
    if (!violation) {
      return response.error(res, { statusCode: 404, message: 'Violation report not found' });
    }

    let message = '';
    if (action === 'lock_shop') {
      if (violation.shop_id) {
        await Shop.findByIdAndUpdate(violation.shop_id._id, { status: 'suspended' });
        message = `Shop "${violation.shop_id.name}" has been successfully suspended.`;
      } else {
        return response.error(res, { statusCode: 400, message: 'No shop associated with this violation' });
      }
      violation.actionTaken = 'locked_shop';
      violation.status = 'resolved';
    } else if (action === 'hide_products') {
      if (violation.shop_id) {
        await Product.updateMany({ shop_id: violation.shop_id._id }, { is_active: false });
        message = `All products for shop "${violation.shop_id.name}" have been hidden.`;
      } else {
        return response.error(res, { statusCode: 400, message: 'No shop associated with this violation' });
      }
      violation.actionTaken = 'hidden_products';
      violation.status = 'resolved';
    } else if (action === 'issue_warning') {
      message = 'Warning has been issued to the seller profile.';
      violation.actionTaken = 'warning_issued';
      violation.status = 'resolved';
    } else if (action === 'suspend_chat') {
      message = 'Chat privileges for this seller have been suspended.';
      violation.actionTaken = 'chat_suspended';
      violation.status = 'resolved';
    } else if (action === 'dismiss') {
      message = 'Violation incident has been dismissed.';
      violation.actionTaken = 'dismissed';
      violation.status = 'dismissed';
    } else {
      return response.error(res, { statusCode: 400, message: 'Invalid violation action' });
    }

    await violation.save();

    // Log this action to AuditLog
    await AuditLog.create({
      actor_id: req.user._id,
      action: 'VIOLATION_ACTION_' + action.toUpperCase(),
      entity_type: 'Violation',
      entity_id: violation._id,
      metadata: {
        violationTitle: violation.title,
        shopName: violation.shop_id?.name || 'N/A',
        action,
        reason
      }
    });

    return response.success(res, {
      message,
      data: violation
    });
  } catch (err) {
    console.error('takeViolationAction error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

module.exports = {
  getDashboard,
  getPendingShops,
  getShopDetail,
  approveShop,
  rejectShop,
  requestShopInfo,
  getPendingProducts,
  getApprovedProducts,
  getRejectedProducts,
  approveProduct,
  rejectProduct,
  requestProductInfo,
  getProductDetail,
  getViolations,
  getViolationDetail,
  takeViolationAction
};
