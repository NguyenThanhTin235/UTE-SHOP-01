const Coupon = require('../../models/Coupon');
const Campaign = require('../../models/Campaign');
const CampaignTarget = require('../../models/CampaignTarget');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Category = require('../../models/Category');
const response = require('../../utils/response');

const validateCouponData = (data) => {
  const { code, type, value, max_discount, min_order_total, start_at, end_at, usage_limit } = data;

  // 1. Code validation
  if (code) {
    const codeClean = code.trim();
    if (!/^[A-Z0-9]{3,20}$/i.test(codeClean)) {
      return 'Coupon code must only contain letters and numbers, with a length between 3 and 20 characters.';
    }
  }

  // 2. Type validation
  if (type && !['percent', 'fixed_amount', 'free_shipping', 'fixed_shipping'].includes(type)) {
    return 'Invalid coupon type.';
  }

  // 3. Value limits
  if (type === 'percent') {
    if (value === undefined || Number(value) <= 0 || Number(value) > 100) {
      return 'Discount percentage must be greater than 0 and less than or equal to 100.';
    }
  } else if (['fixed_amount', 'fixed_shipping'].includes(type)) {
    if (value === undefined || Number(value) <= 0) {
      return 'Fixed discount amount must be greater than 0.';
    }
  } else if (type === 'free_shipping') {
    if (value !== undefined && Number(value) < 0) {
      return 'Shipping fee discount value cannot be negative.';
    }
  }

  // 4. Max discount validation
  if (type === 'percent' && max_discount !== undefined && max_discount !== null && max_discount !== '') {
    if (Number(max_discount) <= 0) {
      return 'Maximum discount must be greater than 0.';
    }
  }

  // 5. Min order total
  if (min_order_total !== undefined && min_order_total !== null) {
    if (Number(min_order_total) < 0) {
      return 'Minimum order total cannot be negative.';
    }
  }

  // 6. Usage limit
  if (usage_limit !== undefined && usage_limit !== null) {
    if (Number(usage_limit) < 1) {
      return 'Usage limit must be at least 1.';
    }
  }

  // 7. Date checks
  if (start_at && end_at) {
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid start or end date.';
    }
    if (endDate <= startDate) {
      return 'End date must be after start date.';
    }
  }

  return null;
};

const validateCampaignData = (data) => {
  const { name, start_at, end_at, value, discount_logic } = data;

  if (name !== undefined) {
    if (!name || name.trim() === '') {
      return 'Campaign title cannot be empty.';
    }
  }

  // Date checks
  if (start_at && end_at) {
    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid start or end date.';
    }
    if (endDate <= startDate) {
      return 'End time must be after start time.';
    }
  }

  // Value checks
  if (value !== undefined && value !== null) {
    if (Number(value) < 0) {
      return 'Discount value cannot be negative.';
    }
    // If logic is percentage based
    const isPercentage = discount_logic && discount_logic.toLowerCase().includes('percent');
    if (isPercentage && Number(value) > 100) {
      return 'Discount percentage cannot exceed 100%.';
    }
  }

  return null;
};


/**
 * GET /api/admin/promotions/stats
 */
const getPromotionsStats = async (req, res) => {
  try {
    const now = new Date();

    // 1. Active Coupons count
    const activeCoupons = await Coupon.countDocuments({
      status: 'active',
      end_at: { $gt: now }
    });

    // 2. Ongoing Campaigns count
    const ongoingCampaigns = await Campaign.countDocuments({
      status: 'active',
      start_at: { $lte: now },
      end_at: { $gte: now }
    });

    // 3. Discount Volume (sum of coupon_discount in successful orders)
    const discountVolumeResult = await Order.aggregate([
      { $match: { payment_status: 'success' } },
      { $group: { _id: null, total: { $sum: '$coupon_discount' } } }
    ]);
    const discountVolume = discountVolumeResult[0]?.total || 0;

    // 4. ROI Efficiency (Revenue from orders with coupon / Coupon Discount given)
    const revenueResult = await Order.aggregate([
      { $match: { payment_status: 'success', coupon_discount: { $gt: 0 } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total_final' }, totalDiscount: { $sum: '$coupon_discount' } } }
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalDiscount = revenueResult[0]?.totalDiscount || 0;
    const roiEfficiency = totalDiscount > 0 ? Number((totalRevenue / totalDiscount).toFixed(1)) : 3.2;

    return response.success(res, {
      message: 'Promotions statistics retrieved successfully',
      data: {
        activeCoupons,
        ongoingCampaigns,
        discountVolume,
        roiEfficiency
      }
    });
  } catch (error) {
    console.error('getPromotionsStats error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve promotions statistics'
    });
  }
};

/**
 * GET /api/admin/promotions/coupons
 */
const getCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const filter = {};
    if (search && search.trim() !== '') {
      filter.code = { $regex: new RegExp(search.trim(), 'i') };
    }

    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        filter.status = 'active';
        filter.end_at = { $gt: now };
      } else if (status === 'inactive') {
        filter.status = 'inactive';
      } else if (status === 'expired') {
        filter.$or = [
          { status: 'expired' },
          { end_at: { $lte: now } }
        ];
      }
    }

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return response.success(res, {
      message: 'Coupons retrieved successfully',
      data: coupons,
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
    console.error('getCoupons error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve coupons list'
    });
  }
}

/**
 * POST /api/admin/promotions/coupons
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      max_discount,
      min_order_total,
      start_at,
      end_at,
      usage_limit,
      status
    } = req.body;

    if (!code || !type || (type !== 'free_shipping' && value === undefined)) {
      return response.error(res, {
        statusCode: 422,
        message: 'Coupon code, type, and value are required fields'
      });
    }

    const validationError = validateCouponData(req.body);
    if (validationError) {
      return response.error(res, {
        statusCode: 422,
        message: validationError
      });
    }

    const codeUpper = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeUpper });
    if (existing) {
      return response.error(res, {
        statusCode: 400,
        message: `Coupon code "${codeUpper}" already exists`
      });
    }

    const coupon = await Coupon.create({
      code: codeUpper,
      type,
      value: value !== undefined ? value : 0,
      max_discount: max_discount || null,
      min_order_total: min_order_total || 0,
      start_at: start_at ? new Date(start_at) : null,
      end_at: end_at ? new Date(end_at) : null,
      usage_limit: usage_limit || 1,
      status: status || 'active'
    });

    return response.success(res, {
      statusCode: 211,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    console.error('createCoupon error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to create coupon'
    });
  }
};

/**
 * GET /api/admin/promotions/coupons/:id
 */
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return response.error(res, {
        statusCode: 404,
        message: 'Coupon not found'
      });
    }

    return response.success(res, {
      message: 'Coupon details retrieved successfully',
      data: coupon
    });
  } catch (error) {
    console.error('getCouponById error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve coupon details'
    });
  }
};

/**
 * PUT /api/admin/promotions/coupons/:id
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      type,
      value,
      max_discount,
      min_order_total,
      start_at,
      end_at,
      usage_limit,
      status
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return response.error(res, {
        statusCode: 404,
        message: 'Coupon not found'
      });
    }

    const mergedData = {
      code: code !== undefined ? code : coupon.code,
      type: type !== undefined ? type : coupon.type,
      value: value !== undefined ? value : coupon.value,
      max_discount: max_discount !== undefined ? max_discount : coupon.max_discount,
      min_order_total: min_order_total !== undefined ? min_order_total : coupon.min_order_total,
      start_at: start_at !== undefined ? start_at : coupon.start_at,
      end_at: end_at !== undefined ? end_at : coupon.end_at,
      usage_limit: usage_limit !== undefined ? usage_limit : coupon.usage_limit
    };

    const validationError = validateCouponData(mergedData);
    if (validationError) {
      return response.error(res, {
        statusCode: 422,
        message: validationError
      });
    }

    if (code) {
      const codeUpper = code.trim().toUpperCase();
      if (codeUpper !== coupon.code) {
        const existing = await Coupon.findOne({ code: codeUpper });
        if (existing) {
          return response.error(res, {
            statusCode: 400,
            message: `Coupon code "${codeUpper}" already exists`
          });
        }
        coupon.code = codeUpper;
      }
    }

    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (max_discount !== undefined) coupon.max_discount = max_discount;
    if (min_order_total !== undefined) coupon.min_order_total = min_order_total;
    if (start_at !== undefined) coupon.start_at = start_at ? new Date(start_at) : null;
    if (end_at !== undefined) coupon.end_at = end_at ? new Date(end_at) : null;
    if (usage_limit !== undefined) coupon.usage_limit = usage_limit;
    if (status !== undefined) coupon.status = status;

    await coupon.save();

    return response.success(res, {
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    console.error('updateCoupon error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update coupon'
    });
  }
};

/**
 * DELETE /api/admin/promotions/coupons/:id
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Coupon.findByIdAndDelete(id);

    if (!result) {
      return response.error(res, {
        statusCode: 404,
        message: 'Coupon not found'
      });
    }

    return response.success(res, {
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('deleteCoupon error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to delete coupon'
    });
  }
};

/**
 * PUT /api/admin/promotions/coupons/:id/status
 */
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'inactive'

    if (!['active', 'inactive'].includes(status)) {
      return response.error(res, {
        statusCode: 422,
        message: 'Status must be active or inactive'
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return response.error(res, {
        statusCode: 404,
        message: 'Coupon not found'
      });
    }

    coupon.status = status;
    await coupon.save();

    return response.success(res, {
      message: `Coupon status updated to ${status} successfully`,
      data: coupon
    });
  } catch (error) {
    console.error('toggleCouponStatus error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to toggle coupon status'
    });
  }
};

/**
 * GET /api/admin/promotions/campaigns
 */
const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, status } = req.query;

    const filter = {};
    if (search && search.trim() !== '') {
      filter.name = { $regex: new RegExp(search.trim(), 'i') };
    }

    if (status && status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        filter.status = 'active';
        filter.start_at = { $lte: now };
        filter.end_at = { $gte: now };
      } else if (status === 'scheduled') {
        filter.status = 'active';
        filter.start_at = { $gt: now };
      } else if (status === 'inactive') {
        filter.status = 'inactive';
      } else if (status === 'expired') {
        filter.end_at = { $lt: now };
      }
    }

    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedCampaigns = await Promise.all(campaigns.map(async (c) => {
      const targetsCount = await CampaignTarget.countDocuments({ campaign_id: c._id });
      // Fetch target product names/categories just for quick summary preview if needed
      const targets = await CampaignTarget.find({ campaign_id: c._id }).populate({
        path: 'product_id',
        populate: { path: 'category_id', select: 'name' }
      });
      const categories = [...new Set(targets.map(t => t.product_id?.category_id?.name).filter(Boolean))];

      return {
        ...c.toObject(),
        targetsCount,
        appliedCategories: categories
      };
    }));

    return response.success(res, {
      message: 'Campaigns retrieved successfully',
      data: formattedCampaigns,
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
    console.error('getCampaigns error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve campaigns list'
    });
  }
};

/**
 * POST /api/admin/promotions/campaigns
 */
const createCampaign = async (req, res) => {
  try {
    const {
      name,
      description,
      start_at,
      end_at,
      status,
      type,
      banner_url,
      value,
      productIds
    } = req.body;

    if (!name || !start_at || !end_at) {
      return response.error(res, {
        statusCode: 422,
        message: 'Campaign name, start_at, and end_at are required fields'
      });
    }

    const validationError = validateCampaignData(req.body);
    if (validationError) {
      return response.error(res, {
        statusCode: 422,
        message: validationError
      });
    }

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const uniqueProductIds = [...new Set(productIds)];
      const productsCount = await Product.countDocuments({ _id: { $in: uniqueProductIds } });
      if (productsCount !== uniqueProductIds.length) {
        return response.error(res, {
          statusCode: 400,
          message: 'One or more linked products do not exist in the system.'
        });
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const campaign = await Campaign.create({
      name,
      slug,
      description: description || '',
      banner_url: banner_url || '',
      start_at: new Date(start_at),
      end_at: new Date(end_at),
      status: status || 'active',
      type: type || 'Mass Discount',
      value: value || 0
    });

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const targets = productIds.map(pid => ({
        campaign_id: campaign._id,
        product_id: pid,
        target_type: 'product'
      }));
      await CampaignTarget.insertMany(targets);
    }

    return response.success(res, {
      statusCode: 211,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('createCampaign error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to create campaign'
    });
  }
};

/**
 * GET /api/admin/promotions/campaigns/:id
 */
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return response.error(res, {
        statusCode: 404,
        message: 'Campaign not found'
      });
    }

    const targets = await CampaignTarget.find({ campaign_id: id }).populate('product_id');

    return response.success(res, {
      message: 'Campaign details retrieved successfully',
      data: {
        campaign,
        products: targets.map(t => t.product_id).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('getCampaignById error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve campaign details'
    });
  }
};

/**
 * PUT /api/admin/promotions/campaigns/:id
 */
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      start_at,
      end_at,
      status,
      type,
      banner_url,
      value,
      productIds
    } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return response.error(res, {
        statusCode: 404,
        message: 'Campaign not found'
      });
    }

    const mergedData = {
      name: name !== undefined ? name : campaign.name,
      start_at: start_at !== undefined ? start_at : campaign.start_at,
      end_at: end_at !== undefined ? end_at : campaign.end_at,
      value: value !== undefined ? value : campaign.value,
      discount_logic: type !== undefined ? type : campaign.type
    };

    const validationError = validateCampaignData(mergedData);
    if (validationError) {
      return response.error(res, {
        statusCode: 422,
        message: validationError
      });
    }

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      const uniqueProductIds = [...new Set(productIds)];
      const productsCount = await Product.countDocuments({ _id: { $in: uniqueProductIds } });
      if (productsCount !== uniqueProductIds.length) {
        return response.error(res, {
          statusCode: 400,
          message: 'One or more linked products do not exist in the system.'
        });
      }
    }

    if (name) {
      campaign.name = name;
      campaign.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }
    if (description !== undefined) campaign.description = description;
    if (start_at) campaign.start_at = new Date(start_at);
    if (end_at) campaign.end_at = new Date(end_at);
    if (status) campaign.status = status;
    if (type) campaign.type = type;
    if (banner_url !== undefined) campaign.banner_url = banner_url;
    if (value !== undefined) campaign.value = value;

    await campaign.save();

    if (productIds && Array.isArray(productIds)) {
      // Re-create targets list
      await CampaignTarget.deleteMany({ campaign_id: id });
      if (productIds.length > 0) {
        const targets = productIds.map(pid => ({
          campaign_id: id,
          product_id: pid,
          target_type: 'product'
        }));
        await CampaignTarget.insertMany(targets);
      }
    }

    return response.success(res, {
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('updateCampaign error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update campaign'
    });
  }
};

/**
 * DELETE /api/admin/promotions/campaigns/:id
 */
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Campaign.findByIdAndDelete(id);

    if (!result) {
      return response.error(res, {
        statusCode: 404,
        message: 'Campaign not found'
      });
    }

    // Clean up targets
    await CampaignTarget.deleteMany({ campaign_id: id });

    return response.success(res, {
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('deleteCampaign error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to delete campaign'
    });
  }
};

/**
 * GET /api/admin/promotions/products
 */
const searchProducts = async (req, res) => {
  try {
    const { q, category_id } = req.query;

    const filter = { approval_status: 'approved', is_active: true };

    if (q && q.trim() !== '') {
      filter.name = { $regex: new RegExp(q.trim(), 'i') };
    }

    if (category_id && category_id !== '') {
      filter.category_id = category_id;
    }

    const products = await Product.find(filter)
      .populate('category_id', 'name')
      .limit(30)
      .select('name selling_price mrp_price category_id');

    return response.success(res, {
      message: 'Products matching search query retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('searchProducts error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to query product lists'
    });
  }
};

/**
 * POST /api/admin/promotions/upload-banner
 */
const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, {
        statusCode: 400,
        message: 'No image file uploaded'
      });
    }

    return response.success(res, {
      message: 'Banner uploaded successfully',
      data: {
        url: req.file.path || req.file.secure_url
      }
    });
  } catch (error) {
    console.error('uploadBanner error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to upload image banner'
    });
  }
};

module.exports = {
  getPromotionsStats,
  getCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  searchProducts,
  uploadBanner
};
