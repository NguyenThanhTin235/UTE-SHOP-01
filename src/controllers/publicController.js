const Banner = require('../models/Banner');
const Product = require('../models/Product');
const ProductMedia = require('../models/ProductMedia');
const Category = require('../models/Category');
const Campaign = require('../models/Campaign');
const CampaignTarget = require('../models/CampaignTarget');
const { toCamelCase } = require('../utils/formatter');

exports.getHomepageData = async (req, res, next) => {
  try {
    // 1. Fetch Banners
    const banners = await Banner.find({ is_active: true }).sort({ sort_order: 1 });

    // 2. Fetch Categories (Top level)
    const categories = await Category.find({ parent_id: null }).limit(6);

    // 3. Fetch Flash Deals (Active campaigns)
    const activeCampaigns = await Campaign.find({
      start_at: { $lte: new Date() },
      end_at: { $gte: new Date() }
    }).limit(1);

    let flashDeals = [];
    if (activeCampaigns.length > 0) {
      const targets = await CampaignTarget.find({ campaign_id: activeCampaigns[0]._id }).limit(4);
      const productIds = targets.map(t => t.product_id);
      flashDeals = await Product.find({ _id: { $in: productIds }, approval_status: 'approved' });
    }

    // 4. Fetch New Arrivals
    const newArrivals = await Product.find({ approval_status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(10);

    // 5. Fetch Best Sellers (Mocked by rating for now)
    const bestSellers = await Product.find({ approval_status: 'approved' })
      .sort({ average_rating: -1 })
      .limit(10);

    // Helper to attach media to products
    const attachMedia = async (products) => {
      return await Promise.all(products.map(async (p) => {
        const media = await ProductMedia.find({ product_id: p._id }).sort({ sort_order: 1 });
        return {
          ...p.toObject(),
          media: media.map(m => m.media_url)
        };
      }));
    };

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Homepage data fetched successfully',
      data: toCamelCase({
        banners,
        categories,
        flashDeals: await attachMedia(flashDeals),
        newArrivals: await attachMedia(newArrivals),
        bestSellers: await attachMedia(bestSellers),
        campaign: activeCampaigns[0] || null
      }),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    next(error);
  }
};
