const response = require('../../utils/response');
const Banner = require('../../models/Banner');
const HomepageSection = require('../../models/HomepageSection');
const ThemeSetting = require('../../models/ThemeSetting');

const getUIConfig = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ sort_order: 1 });
    const sections = await HomepageSection.find().sort({ sort_order: 1 });
    let theme = await ThemeSetting.findOne();
    
    if (!theme) {
      theme = await ThemeSetting.create({});
    }

    // Default sections if none exist
    if (sections.length === 0) {
      const defaultSections = [
        { title: 'Hero Banner Slider', type: 'hero', sort_order: 1, is_active: true },
        { title: 'Flash Deals (Countdown)', type: 'flash_deals', sort_order: 2, is_active: true },
        { title: 'Category Highlights', type: 'category_highlights', sort_order: 3, is_active: true },
        { title: 'Recommended For You', type: 'recommendations', sort_order: 4, is_active: true }
      ];
      await HomepageSection.insertMany(defaultSections);
      sections.push(...(await HomepageSection.find().sort({ sort_order: 1 })));
    }

    return response.success(res, {
      data: {
        banners,
        sections,
        theme
      },
      message: 'UI Configuration fetched successfully'
    });
  } catch (error) {
    console.error('getUIConfig error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to fetch UI Configuration' });
  }
};

const updateTheme = async (req, res) => {
  try {
    const { primary_color, font_family, border_radius, dark_mode_support } = req.body;
    let theme = await ThemeSetting.findOne();
    
    if (!theme) {
      theme = new ThemeSetting();
    }
    
    if (primary_color) theme.primary_color = primary_color;
    if (font_family) theme.font_family = font_family;
    if (border_radius) theme.border_radius = border_radius;
    if (dark_mode_support !== undefined) theme.dark_mode_support = dark_mode_support;

    await theme.save();

    return response.success(res, { data: theme, message: 'Theme settings updated successfully' });
  } catch (error) {
    console.error('updateTheme error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to update Theme settings' });
  }
};

const updateBanners = async (req, res) => {
  try {
    const { banners } = req.body; // Array of banner objects
    
    if (!Array.isArray(banners)) {
      return response.error(res, { statusCode: 400, message: 'Banners should be an array' });
    }

    // Replace all banners or update existing? Let's just drop and reinsert for simplicity,
    // OR we can update by ID. To keep `_id` we should upsert.
    
    // Process upserts and deletes
    const currentBannerIds = banners.filter(b => b._id).map(b => b._id);
    await Banner.deleteMany({ _id: { $nin: currentBannerIds } });

    for (const bannerData of banners) {
      if (bannerData._id) {
        await Banner.findByIdAndUpdate(bannerData._id, bannerData);
      } else {
        await Banner.create(bannerData);
      }
    }

    const updatedBanners = await Banner.find().sort({ sort_order: 1 });

    return response.success(res, { data: updatedBanners, message: 'Banners updated successfully' });
  } catch (error) {
    console.error('updateBanners error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to update Banners' });
  }
};

const updateSections = async (req, res) => {
  try {
    const { sections } = req.body; // Array of section objects
    
    if (!Array.isArray(sections)) {
      return response.error(res, { statusCode: 400, message: 'Sections should be an array' });
    }

    for (const sectionData of sections) {
      if (sectionData._id) {
        await HomepageSection.findByIdAndUpdate(sectionData._id, sectionData);
      }
    }

    const updatedSections = await HomepageSection.find().sort({ sort_order: 1 });

    return response.success(res, { data: updatedSections, message: 'Sections updated successfully' });
  } catch (error) {
    console.error('updateSections error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to update Sections' });
  }
};

const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, { statusCode: 400, message: 'No image file provided' });
    }
    
    // req.file.path is the Cloudinary URL from the multer-storage-cloudinary
    const imageUrl = req.file.path;
    
    return response.success(res, { 
      data: { imageUrl },
      message: 'Banner uploaded successfully' 
    });
  } catch (error) {
    console.error('uploadBanner error:', error);
    return response.error(res, { statusCode: 500, message: 'Failed to upload banner' });
  }
};

module.exports = {
  getUIConfig,
  updateTheme,
  updateBanners,
  updateSections,
  uploadBanner
};
