const Campaign = require('../models/Campaign');
const CampaignTarget = require('../models/CampaignTarget');
const ProductVariant = require('../models/ProductVariant');

/**
 * Fetch all active promotional campaigns and build a Map of product_id -> discount_percentage
 */
const getActiveCampaignsWithProducts = async () => {
  try {
    const activeCampaigns = await Campaign.find({
      status: 'active',
      start_at: { $lte: new Date() },
      end_at: { $gte: new Date() }
    });
    
    if (activeCampaigns.length === 0) return new Map();
    
    const campIds = activeCampaigns.map(c => c._id);
    const targets = await CampaignTarget.find({ campaign_id: { $in: campIds } });
    
    const productDiscounts = new Map();
    for (const t of targets) {
      const camp = activeCampaigns.find(c => c._id.toString() === t.campaign_id.toString());
      if (camp && camp.value > 0) {
        const existingDiscount = productDiscounts.get(t.product_id.toString()) || 0;
        productDiscounts.set(t.product_id.toString(), Math.max(existingDiscount, camp.value));
      }
    }
    return productDiscounts;
  } catch (error) {
    console.error('Error fetching active campaigns for discounts:', error);
    return new Map();
  }
};

/**
 * Apply campaign discount dynamically to a product object (modifying in-place)
 * If isListing is true, it adjusts the base price using the first (default) variant's additional price.
 */
const applyCampaignDiscount = async (productObj, productDiscounts, isListing = false) => {
  if (!productObj) return productObj;
  
  // 1. If it's a listing card, adjust base price by the first variant's additional price
  if (isListing && !productObj.listing_price_adjusted) {
    try {
      const variants = await ProductVariant.find({ product_id: productObj._id }).sort({ _id: 1 });
      if (variants && variants.length > 0) {
        const defaultVar = variants[0];
        const addPrice = defaultVar.additional_price || 0;
        productObj.selling_price += addPrice;
        productObj.mrp_price += addPrice;
        productObj.listing_price_adjusted = true;
      }
    } catch (err) {
      console.error('Error fetching default variant for price adjustment:', err);
    }
  }

  // 2. Apply campaign discount
  const pIdStr = productObj._id ? productObj._id.toString() : '';
  const discountPercent = productDiscounts.get(pIdStr) || 0;
  
  // Always store the discount percent so the frontend can compute variant prices correctly
  productObj.campaign_discount_percent = discountPercent;

  if (discountPercent > 0 && !productObj.campaign_discount_applied) {
    const origSelling = productObj.selling_price;
    productObj.selling_price = Math.round(origSelling * (1 - discountPercent / 100));
    productObj.mrp_price = Math.max(productObj.mrp_price || origSelling, origSelling);
    productObj.campaign_discount_applied = true;
  }
  return productObj;
};

module.exports = {
  getActiveCampaignsWithProducts,
  applyCampaignDiscount
};
