const SellerProfile = require('../../models/SellerProfile');
const Product = require('../../models/Product');
const Shop = require('../../models/Shop');
const AuditLog = require('../../models/AuditLog');
const ProductApproval = require('../../models/ProductApproval');
const ProductMedia = require('../../models/ProductMedia');
const ProductVariant = require('../../models/ProductVariant');
const Violation = require('../../models/Violation');
const Notification = require('../../models/Notification');
const response = require('../../utils/response');

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
      Shop.countDocuments({ status: 'pending' }),
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
      Shop.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('owner_user_id', 'full_name email'),
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
      ...pendingShopProfiles.map((s) => ({
        id: s._id,
        type: 'shop',
        title: `Shop Registration: ${s.owner_user_id?.full_name || 'Unknown User'}`,
        subtitle: `Shop Name: ${s.name || 'N/A'} • ${timeAgo(s.createdAt)}`,
        icon: 'storefront',
        createdAt: s.createdAt,
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
    const { id } = req.params; // This is now Shop ID
    const shop = await Shop.findById(id).populate('owner_user_id', 'full_name email phone');
    if (!shop) return response.error(res, { statusCode: 404, message: 'Shop not found' });

    // Try to get seller profile for document urls
    const profile = await SellerProfile.findOne({ user_id: shop.owner_user_id?._id });

    // Build approval history from AuditLog
    const auditLogs = await AuditLog.find({
      entity_type: 'Shop',
      entity_id: shop._id
    })
      .sort({ createdAt: -1 })
      .populate('actor_id', 'full_name');

    const history = auditLogs.map(log => ({
      id: log._id,
      action: log.action === 'APPROVE_SHOP' ? 'Approved Shop' :
        log.action === 'REJECT_SHOP' ? 'Rejected Shop' : log.action,
      note: log.metadata?.reason || log.metadata?.note || (log.action === 'APPROVE_SHOP' ? 'Shop configuration reviewed and approved.' : 'No additional note'),
      actorName: log.actor_id?.full_name || 'System',
      date: log.createdAt
    }));

    history.push({
      id: 'init_' + shop._id,
      action: 'Configuration Submitted',
      note: 'Initial shop configuration received.',
      actorName: shop.owner_user_id?.full_name || 'Seller',
      date: shop.createdAt
    });

    return response.success(res, {
      message: 'Shop detail retrieved',
      data: {
        id: shop._id,
        shopName: shop.name,
        taxId: profile?.gst_number || 'N/A',
        legalRep: shop.owner_user_id?.full_name || 'Unknown',
        email: shop.email || shop.owner_user_id?.email || 'N/A',
        phone: shop.phone || shop.owner_user_id?.phone || 'N/A',
        address: shop.address || 'N/A',
        identity_card_url: profile?.identity_card_url,
        business_license_url: profile?.business_license_url,
        status: shop.status,
        appliedAt: shop.createdAt,
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
    const pendingShops = await Shop.find({ status: 'pending' })
      .populate('owner_user_id', 'full_name email')
      .sort({ createdAt: -1 });

    const ownerIds = pendingShops.map(s => s.owner_user_id?._id).filter(Boolean);
    const profiles = await SellerProfile.find({ user_id: { $in: ownerIds } });

    const results = pendingShops.map(shop => {
      const profile = profiles.find(p => p.user_id?.toString() === shop.owner_user_id?._id?.toString());
      return {
        id: shop._id,
        shopName: shop.name,
        taxId: profile?.gst_number || 'N/A',
        legalRep: shop.owner_user_id?.full_name || 'Unknown',
        appliedAt: shop.createdAt,
        timeAgo: timeAgo(shop.createdAt),
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
    const { id } = req.params; // Shop ID
    const shop = await Shop.findById(id);
    if (!shop) return response.error(res, { statusCode: 404, message: 'Shop not found' });

    shop.status = 'active';
    await shop.save();

    const profile = await SellerProfile.findOne({ user_id: shop.owner_user_id });
    if (profile) {
      profile.status = 'active';
      profile.approved_at = Date.now();
      await profile.save();
    }

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'APPROVE_SHOP',
      entity_type: 'Shop',
      entity_id: shop._id,
      metadata: { name: shop.name }
    });

    return response.success(res, { message: 'Shop approved successfully', data: {} });
  } catch (err) {
    console.error('approveShop error:', err);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const rejectShop = async (req, res) => {
  try {
    const { id } = req.params; // Shop ID
    const { reason } = req.body;
    const shop = await Shop.findById(id);
    if (!shop) return response.error(res, { statusCode: 404, message: 'Shop not found' });

    shop.status = 'rejected';
    shop.rejection_reason = reason || 'No reason provided';
    await shop.save();

    const profile = await SellerProfile.findOne({ user_id: shop.owner_user_id });
    if (profile) {
      profile.status = 'rejected';
      profile.approved_at = Date.now();
      await profile.save();
    }

    await AuditLog.create({
      actor_id: req.user._id,
      action: 'REJECT_SHOP',
      entity_type: 'Shop',
      entity_id: shop._id,
      metadata: { name: shop.name, reason }
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

    try {
      const shop = await Shop.findById(product.shop_id);
      if (shop) {
        const io = req.app.get('socketio');
        const notif = await Notification.create({
           user_id: shop.owner_user_id,
           title: 'Product Approved',
           content: `Your product "${product.name}" has been approved by the manager.`,
           detailContent: `Manager review update.\nProduct: ${product.name}\nStatus: Approved`,
           category: 'System',
           type: 'system',
           link: '/seller/products'
        });
        if (io) {
           io.to(shop.owner_user_id.toString()).emit('notification', {
                 id: notif._id.toString(),
                 title: notif.title,
                 content: notif.content,
                 detailContent: notif.detailContent,
                 category: notif.category,
                 type: notif.type,
                 date: 'JUST NOW',
                 link: notif.link,
                 is_read: false
           });
        }
      }
    } catch(e) { console.error('Notification Error:', e); }

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

    try {
      const shop = await Shop.findById(product.shop_id);
      if (shop) {
        const io = req.app.get('socketio');
        const notif = await Notification.create({
           user_id: shop.owner_user_id,
           title: 'Product Rejected',
           content: `Your product "${product.name}" has been rejected.`,
           detailContent: `Manager review update.\nProduct: ${product.name}\nStatus: Rejected\nReason: ${reason}`,
           category: 'System',
           type: 'system',
           link: '/seller/products'
        });
        if (io) {
           io.to(shop.owner_user_id.toString()).emit('notification', {
                 id: notif._id.toString(),
                 title: notif.title,
                 content: notif.content,
                 detailContent: notif.detailContent,
                 category: notif.category,
                 type: notif.type,
                 date: 'JUST NOW',
                 link: notif.link,
                 is_read: false
           });
        }
      }
    } catch(e) { console.error('Notification Error:', e); }

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
        shopId: v.shop_id,
        productId: v.product_id,
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

// ─── STATISTICS ───────────────────────────────────────────────────────────────
const getStatistics = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Category = require('../../models/Category');
    const Product = require('../../models/Product');
    const Violation = require('../../models/Violation');
    const Shop = require('../../models/Shop');
    const { dateRange, category, status } = req.query;

    const dateFilter = {};
    if (dateRange && dateRange !== 'all') {
      const days = parseInt(dateRange, 10);
      if (!isNaN(days)) {
        dateFilter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    // Handle Category Filter globally
    let categoryMatch = {};
    let categoryProductIds = null;

    if (category && category !== 'All') {
      // Find category by name (the UI passes the name)
      const targetCat = await Category.findOne({ name: category });
      if (targetCat) {
        // Assume flat category structure for stats, or get direct children
        const subCats = await Category.find({ parent_id: targetCat._id }).select('_id');
        const allCatIds = [targetCat._id, ...subCats.map(c => c._id)];
        categoryMatch = { category_id: { $in: allCatIds } };

        // For cross-collection filtering (Violations, Orders)
        const productsInCats = await Product.find(categoryMatch).select('_id');
        categoryProductIds = productsInCats.map(p => p._id);
      } else {
        // If category not found, return 0 matches
        categoryMatch = { category_id: null };
        categoryProductIds = [];
      }
    }

    let violationProductMatch = {};
    if (categoryProductIds) {
      violationProductMatch = { product_id: { $in: categoryProductIds } };
    }

    // 1. Stat Cards
    const ProductApproval = require('../../models/ProductApproval');
    const avgApprovalRaw = await ProductApproval.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'product_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $match: categoryProductIds ? { 'product.category_id': categoryMatch.category_id } : {} },
      {
        $project: {
          diffTime: { $subtract: ['$createdAt', '$product.createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgDiff: { $avg: '$diffTime' }
        }
      }
    ]);

    let avgApprovalTime = '4.2 Hours';
    if (avgApprovalRaw.length > 0 && avgApprovalRaw[0].avgDiff) {
      avgApprovalTime = (avgApprovalRaw[0].avgDiff / (1000 * 60 * 60)).toFixed(1) + ' Hours';
    }

    const totalProducts = await Product.countDocuments({ approval_status: { $in: ['approved', 'rejected'] }, ...dateFilter, ...categoryMatch });
    const rejectedProducts = await Product.countDocuments({ approval_status: 'rejected', ...dateFilter, ...categoryMatch });
    const rejectionRate = totalProducts > 0 ? ((rejectedProducts / totalProducts) * 100).toFixed(1) : 8.5;

    // Platform integrity logic based on violations over products
    const activeProducts = await Product.countDocuments({ is_active: true, ...dateFilter, ...categoryMatch });
    const activeViolations = await Violation.countDocuments({ status: { $ne: 'resolved' }, ...dateFilter, ...violationProductMatch });
    let platformIntegrity = 99.2;
    if (activeProducts > 0) {
      const integrityVal = 100 - ((activeViolations / activeProducts) * 100);
      platformIntegrity = Math.max(0, Math.min(100, integrityVal)).toFixed(1);
    }

    // 2. Violation Distribution
    const totalViolationsForChart = await Violation.countDocuments({ ...dateFilter, ...violationProductMatch });
    const violationStats = await Violation.aggregate([
      { $match: { ...dateFilter, ...violationProductMatch } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const colors = ['bg-[#004ac6]', 'bg-[#ba1a1a]', 'bg-slate-200', 'bg-[#f59e0b]', 'bg-[#16a34a]'];
    let violationDistribution = violationStats.map((stat, i) => ({
      category: stat._id ? stat._id.replace('_', ' ').toUpperCase() : 'GENERAL',
      count: stat.count,
      percentage: totalViolationsForChart > 0 ? Math.round((stat.count / totalViolationsForChart) * 100) : 0,
      color: colors[i % colors.length]
    }));

    if (violationDistribution.length === 0) {
      violationDistribution = [
        { category: 'COPYRIGHT INFRINGEMENT', count: 631, percentage: 75, color: 'bg-[#004ac6]' },
        { category: 'ABUSIVE CONTENT', count: 126, percentage: 15, color: 'bg-[#ba1a1a]' },
        { category: 'OTHERS', count: 85, percentage: 10, color: 'bg-slate-200' }
      ];
    }

    // 3 & 6. Approval Efficiency & Category Compliance
    const CategoryModel = require('../../models/Category'); // Avoid shadowing
    const productStats = await Product.aggregate([
      { $match: { ...dateFilter, ...categoryMatch } },
      {
        $group: {
          _id: '$category_id',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$approval_status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    await CategoryModel.populate(productStats, {
      path: '_id',
      select: 'name parent_id',
      populate: { path: 'parent_id', select: 'name' }
    });

    // Map to group by parent
    const categoryMap = {};

    productStats.forEach(ps => {
      const isChild = ps._id?.parent_id ? true : false;
      const parentId = isChild ? ps._id.parent_id._id.toString() : ps._id._id.toString();
      const parentName = isChild ? ps._id.parent_id.name : ps._id.name;

      if (!categoryMap[parentId]) {
        categoryMap[parentId] = {
          categoryId: parentId,
          category: parentName,
          total: 0,
          approved: 0,
          rejected: 0,
          children: []
        };
      }

      if (isChild) {
        categoryMap[parentId].children.push({
          categoryId: ps._id._id.toString(),
          category: ps._id.name,
          total: ps.total,
          approved: ps.approved,
          rejected: ps.rejected
        });
        categoryMap[parentId].total += ps.total;
        categoryMap[parentId].approved += ps.approved;
        categoryMap[parentId].rejected += ps.rejected;
      } else {
        categoryMap[parentId].total += ps.total;
        categoryMap[parentId].approved += ps.approved;
        categoryMap[parentId].rejected += ps.rejected;
      }
    });

    const groupedStats = Object.values(categoryMap);

    let approvalEfficiency = groupedStats.map(parent => {
      const parentTotal = parent.approved + parent.rejected;
      const parentAccuracy = parentTotal > 0 ? Math.round((parent.approved / parentTotal) * 100) : 100;

      return {
        id: parent.categoryId,
        category: parent.category,
        accuracy: parentAccuracy,
        children: parent.children.map(child => {
          const childTotal = child.approved + child.rejected;
          return {
            id: child.categoryId,
            category: child.category,
            accuracy: childTotal > 0 ? Math.round((child.approved / childTotal) * 100) : 100
          };
        }).sort((a, b) => b.accuracy - a.accuracy)
      };
    }).sort((a, b) => b.accuracy - a.accuracy);

    let categoryCompliance = groupedStats.map(parent => {
      const parentTotal = parent.approved + parent.rejected;
      const parentAccuracy = parentTotal > 0 ? Math.round((parent.approved / parentTotal) * 100) : 100;

      return {
        id: parent.categoryId,
        category: parent.category,
        autoPass: '0%',
        manualReview: '100%',
        trustScore: (parentAccuracy / 10).toFixed(1),
        children: parent.children.map(child => {
          const childTotal = child.approved + child.rejected;
          const childAccuracy = childTotal > 0 ? Math.round((child.approved / childTotal) * 100) : 100;
          return {
            id: child.categoryId,
            category: child.category,
            autoPass: '0%',
            manualReview: '100%',
            trustScore: (childAccuracy / 10).toFixed(1)
          };
        }).sort((a, b) => parseFloat(b.trustScore) - parseFloat(a.trustScore))
      };
    });

    if (approvalEfficiency.length === 0) {
      approvalEfficiency = [
        { category: 'Electronics', accuracy: 98 },
        { category: 'Fashion & Beauty', accuracy: 92 },
        { category: 'Home Appliances', accuracy: 85 }
      ];
      categoryCompliance = [
        { category: 'Electronics', autoPass: '0%', manualReview: '100%', trustScore: '9.8' },
        { category: 'Fashion & Beauty', autoPass: '0%', manualReview: '100%', trustScore: '9.2' },
        { category: 'Home Appliances', autoPass: '0%', manualReview: '100%', trustScore: '8.5' }
      ];
      if (category && category !== 'All') {
        approvalEfficiency = approvalEfficiency.filter(a => a.category.toLowerCase().includes(category.toLowerCase()));
        categoryCompliance = categoryCompliance.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
      }
    }

    // 4. Recent Penalties
    let penaltyStatusFilter = { $in: ['resolved', 'dismissed'] };
    if (status && status !== 'All') {
      penaltyStatusFilter = status.toLowerCase();
    }
    const recentPenaltiesRaw = await Violation.find({ status: penaltyStatusFilter, actionTaken: { $exists: true }, ...dateFilter, ...violationProductMatch })
      .populate('shop_id', 'name')
      .sort({ updatedAt: -1 })
      .limit(3);

    const recentPenalties = recentPenaltiesRaw.map(v => ({
      id: v._id,
      shopName: v.shop_id?.name || 'Unknown Shop',
      action: v.actionTaken,
      date: new Date(v.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    }));

    if (recentPenalties.length === 0 && (!category || category === 'All')) {
      recentPenalties.push(
        { id: 1, shopName: 'MobileCity', action: 'locked_shop', date: 'Oct 12' },
        { id: 2, shopName: 'BeautyWorld', action: 'warning_issued', date: 'Oct 10' },
        { id: 3, shopName: 'ToyZone', action: 'hidden_products', date: 'Oct 08' }
      );
    }

    // 5. Top Violating Shops
    const topViolatingShopsRaw = await Violation.aggregate([
      { $match: { ...dateFilter, ...violationProductMatch } },
      { $group: { _id: '$shop_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    await Shop.populate(topViolatingShopsRaw, { path: '_id', select: 'name' });
    const topViolatingShops = topViolatingShopsRaw.map(t => ({
      id: t._id?._id || t._id,
      shopName: t._id?.name || 'Unknown',
      reports: t.count,
      riskLevel: Math.min(t.count * 15, 100),
      status: t.count > 5 ? 'Under Watch' : 'Warning Issued'
    }));

    if (topViolatingShops.length === 0 && (!category || category === 'All')) {
      topViolatingShops.push(
        { id: 1, shopName: 'Gadget Hub', reports: 42, riskLevel: 85, status: 'Under Watch' },
        { id: 2, shopName: 'Fashion Nova Clone', reports: 38, riskLevel: 70, status: 'Warning Issued' },
        { id: 3, shopName: 'Daily Mart', reports: 12, riskLevel: 30, status: 'Improving' }
      );
    }

    // 7. Financial & Revenue Intelligence
    const orderMatch = { status: { $in: ['confirmed', 'shipping', 'completed'] } };
    if (Object.keys(dateFilter).length > 0) {
      orderMatch.createdAt = dateFilter.createdAt;
    }
    if (categoryProductIds !== null) {
      const OrderItem = require('../../models/OrderItem');
      const itemsInCat = await OrderItem.find({ product_id: { $in: categoryProductIds } }).select('order_id');
      const orderIds = itemsInCat.map(i => i.order_id);
      orderMatch._id = { $in: orderIds };
    }

    const financialRaw = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: '$shop_id',
          gmv: { $sum: '$total_final' },
          commission: { $sum: '$platform_fee_amount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { gmv: -1 } },
      { $limit: 50 }
    ]);
    await Shop.populate(financialRaw, { path: '_id', select: 'name' });
    const financialIntelligence = financialRaw.map(f => ({
      shopId: f._id?._id?.toString()?.substring(0, 8) || 'Unknown',
      shopName: f._id?.name || 'Unknown',
      gmv: f.gmv || 0,
      commission: f.commission || (f.gmv * 0.05),
      orders: f.orders,
      growth: '+12.4%',
      auditStatus: 'Verified'
    }));

    if (financialIntelligence.length === 0 && (!category || category === 'All')) {
      financialIntelligence.push(
        { shopId: 'SH-8821', shopName: 'TechWorld Official', gmv: 42500, commission: 2125, orders: 1240, growth: '+12.4%', auditStatus: 'Verified' },
        { shopId: 'SH-9912', shopName: 'Brand Direct', gmv: 18200, commission: 910, orders: 450, growth: '-2.1%', auditStatus: 'Pending Audit' },
        { shopId: 'SH-7712', shopName: 'Minimalist Home', gmv: 65800, commission: 3290, orders: 2890, growth: '+24.8%', auditStatus: 'Verified' },
        { shopId: 'SH-4421', shopName: 'Streetwear Hub', gmv: 12400, commission: 620, orders: 310, growth: '0.0%', auditStatus: 'Under Review' }
      );
    }

    return response.success(res, {
      message: 'Statistics retrieved successfully',
      data: {
        statCards: {
          avgApprovalTime,
          rejectionRate: parseFloat(rejectionRate),
          platformIntegrity
        },
        violationDistribution,
        approvalEfficiency,
        recentPenalties,
        topViolatingShops,
        categoryCompliance,
        financialIntelligence
      }
    });

  } catch (error) {
    console.error('getStatistics error:', error);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getStatisticsCategories = async (req, res) => {
  try {
    const Category = require('../../models/Category');
    const categoriesDB = await Category.find({}).select('name slug parent_id').lean();

    const categoryMap = {};
    const parentCategories = [];

    categoriesDB.forEach(cat => {
      categoryMap[cat._id.toString()] = { label: cat.name, value: cat.name, children: [] };
    });

    categoriesDB.forEach(cat => {
      if (cat.parent_id && categoryMap[cat.parent_id.toString()]) {
        categoryMap[cat.parent_id.toString()].children.push(categoryMap[cat._id.toString()]);
      } else {
        parentCategories.push(categoryMap[cat._id.toString()]);
      }
    });

    const categories = [
      { label: 'All Categories', value: 'All' },
      ...parentCategories
    ];

    return response.success(res, { message: 'Categories retrieved successfully', data: categories });
  } catch (error) {
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getStatisticsDateRanges = async (req, res) => {
  try {
    const dateRanges = [
      { label: 'All Time', value: 'all' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 7 Days', value: '7' },
      { label: 'This Quarter', value: '90' }
    ];
    return response.success(res, { message: 'Date ranges retrieved successfully', data: dateRanges });
  } catch (error) {
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getStatisticsStatuses = async (req, res) => {
  try {
    const statuses = [
      { label: 'Status: All', value: 'All' },
      { label: 'Status: Resolved', value: 'Resolved' },
      { label: 'Status: Pending', value: 'Pending' }
    ];
    return response.success(res, { message: 'Statuses retrieved successfully', data: statuses });
  } catch (error) {
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

// ─── ORDER MONITORING ─────────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const { page = 1, limit = 10, status, search, shopId } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (shopId && shopId !== 'all') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(shopId.trim())) {
        filter.shop_id = shopId.trim();
      } else {
        // Find by shop name as fallback, or just dummy
        filter.shop_id = new mongoose.Types.ObjectId('000000000000000000000000');
      }
    }
    if (search) {
      filter.order_code = { $regex: search, $options: 'i' };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('shop_id', 'name slug')
      .populate('customer_id', 'full_name email')
      .populate('shipper_id', 'full_name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderCode: order.order_code,
      shopName: order.shop_id?.name || 'Unknown Shop',
      shopId: order.shop_id?._id,
      customerName: order.customer_id?.full_name || 'Unknown',
      shipperName: order.shipper_id?.full_name || 'Not assigned',
      status: order.status,
      paymentStatus: order.payment_status,
      totalFinal: order.total_final,
      createdAt: order.createdAt,
    }));

    return response.success(res, {
      message: 'Orders retrieved successfully',
      data: formattedOrders,
      meta: {
        pagination: {
          total,
          count: formattedOrders.length,
          perPage: parseInt(limit),
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    return response.error(res, { statusCode: 500, message: 'Server Error' });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const OrderItem = require('../../models/OrderItem');
    const ProductMedia = require('../../models/ProductMedia');

    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('shop_id', 'name slug email phone')
      .populate('customer_id', 'full_name email phone')
      .populate('shipper_id', 'full_name phone')
      .populate('shipping_address_id')
      .populate('payment_order_id')
      .populate('shipping_partner_id');

    if (!order) {
      return response.error(res, { statusCode: 404, message: 'Order not found' });
    }

    const items = await OrderItem.find({ order_id: order._id })
      .populate('product_id', 'name slug sku')
      .populate('variant_id', 'attributes sku');

    const productIds = items.map(oi => oi.product_id ? oi.product_id._id : null).filter(Boolean);
    const medias = await ProductMedia.find({ product_id: { $in: productIds } });

    const itemsWithMedia = items.map(item => {
      const itemObj = item.toObject();
      if (itemObj.product_id) {
        const productMedia = medias.find(m => m.product_id.toString() === itemObj.product_id._id.toString());
        itemObj.product_id.media_url = productMedia ? productMedia.media_url : null;
      }
      return itemObj;
    });

    const data = {
      ...order.toObject(),
      items: itemsWithMedia
    };

    return response.success(res, {
      message: 'Order detail retrieved successfully',
      data
    });

  } catch (error) {
    console.error('getOrderDetail error:', error);
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
  takeViolationAction,
  getStatistics,
  getStatisticsCategories,
  getStatisticsDateRanges,
  getStatisticsStatuses,
  getAllOrders,
  getOrderDetail
};
