const ShippingPartner = require('../../models/ShippingPartner');
const Shipment = require('../../models/Shipment');
const ShippingReview = require('../../models/ShippingReview');
const response = require('../../utils/response');

/**
 * GET /api/admin/logistics
 * Retrieves all shipping partners, supporting search filters
 */
const getShippingPartners = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { code: regex }
      ];
    }

    const partners = await ShippingPartner.find(filter).sort({ createdAt: -1 });

    return response.success(res, {
      message: 'Logistics partners retrieved successfully',
      data: partners
    });
  } catch (error) {
    console.error('getShippingPartners error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to retrieve logistics partners list'
    });
  }
};

/**
 * POST /api/admin/logistics
 * Creates a new logistics partner
 */
const createShippingPartner = async (req, res) => {
  try {
    const { name, code, avatar_url, shipping_fee, is_active } = req.body;

    if (!name || !code) {
      return response.error(res, {
        statusCode: 422,
        message: 'Name and Code are required fields'
      });
    }

    const codeUpper = code.trim().toUpperCase();

    // Check unique code
    const existing = await ShippingPartner.findOne({ code: codeUpper });
    if (existing) {
      return response.error(res, {
        statusCode: 400,
        message: `Logistics partner code "${codeUpper}" already exists`
      });
    }

    const feeNum = Number(shipping_fee) || 0;
    if (feeNum < 0) {
      return response.error(res, {
        statusCode: 422,
        message: 'Shipping fee cannot be negative'
      });
    }

    const partner = await ShippingPartner.create({
      name: name.trim(),
      code: codeUpper,
      avatar_url: avatar_url || '',
      shipping_fee: feeNum,
      is_active: is_active !== undefined ? is_active : true
    });

    return response.success(res, {
      statusCode: 201,
      message: 'Logistics partner created successfully',
      data: partner
    });
  } catch (error) {
    console.error('createShippingPartner error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to create logistics partner'
    });
  }
};

/**
 * PUT /api/admin/logistics/:id
 * Updates an existing logistics partner
 */
const updateShippingPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, avatar_url, shipping_fee, is_active } = req.body;

    const partner = await ShippingPartner.findById(id);
    if (!partner) {
      return response.error(res, {
        statusCode: 404,
        message: 'Logistics partner not found'
      });
    }

    if (code) {
      const codeUpper = code.trim().toUpperCase();
      if (codeUpper !== partner.code) {
        const existing = await ShippingPartner.findOne({ code: codeUpper });
        if (existing) {
          return response.error(res, {
            statusCode: 400,
            message: `Logistics partner code "${codeUpper}" already exists`
          });
        }
        partner.code = codeUpper;
      }
    }

    if (name !== undefined) partner.name = name.trim();
    if (avatar_url !== undefined) partner.avatar_url = avatar_url;
    
    if (shipping_fee !== undefined) {
      const feeNum = Number(shipping_fee) || 0;
      if (feeNum < 0) {
        return response.error(res, {
          statusCode: 422,
          message: 'Shipping fee cannot be negative'
        });
      }
      partner.shipping_fee = feeNum;
    }

    if (is_active !== undefined) partner.is_active = is_active;

    await partner.save();

    return response.success(res, {
      message: 'Logistics partner updated successfully',
      data: partner
    });
  } catch (error) {
    console.error('updateShippingPartner error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to update logistics partner'
    });
  }
};

/**
 * DELETE /api/admin/logistics/:id
 * Deletes a logistics partner if not referenced in shipments or reviews
 */
const deleteShippingPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await ShippingPartner.findById(id);
    if (!partner) {
      return response.error(res, {
        statusCode: 404,
        message: 'Logistics partner not found'
      });
    }

    // 1. Check if references in Shipment exists
    const hasShipment = await Shipment.findOne({ shipping_partner_id: id });
    if (hasShipment) {
      return response.error(res, {
        statusCode: 400,
        message: 'Cannot delete logistics partner because they are associated with existing shipments. Please set status to inactive instead.'
      });
    }

    // 2. Check if references in ShippingReview exists
    const hasReview = await ShippingReview.findOne({ shipping_partner_id: id });
    if (hasReview) {
      return response.error(res, {
        statusCode: 400,
        message: 'Cannot delete logistics partner because they have customer reviews. Please set status to inactive instead.'
      });
    }

    await ShippingPartner.findByIdAndDelete(id);

    return response.success(res, {
      message: 'Logistics partner deleted successfully'
    });
  } catch (error) {
    console.error('deleteShippingPartner error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to delete logistics partner'
    });
  }
};

/**
 * POST /api/admin/logistics/upload-avatar
 * Uploads logo/avatar image to Cloudinary and returns URL
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, {
        statusCode: 400,
        message: 'No image file uploaded'
      });
    }

    return response.success(res, {
      message: 'Avatar uploaded successfully',
      data: {
        url: req.file.path || req.file.secure_url
      }
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    return response.error(res, {
      statusCode: 500,
      message: 'Failed to upload logistics partner logo'
    });
  }
};

module.exports = {
  getShippingPartners,
  createShippingPartner,
  updateShippingPartner,
  deleteShippingPartner,
  uploadAvatar
};
