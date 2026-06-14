const Category = require('../models/Category');
const Product = require('../models/Product');
const { toCamelCase } = require('../utils/formatter');

// Get all categories in a flat list (frontend will build the tree)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sort_order: 1, createdAt: 1 });
    res.status(200).json({
      success: true,
      code: 200,
      data: toCamelCase(categories)
    });
  } catch (error) {
    next(error);
  }
};

// Create a new category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, name_vn, slug, parent_id, icon, is_visible, enable_commission } = req.body;

    // Check slug uniqueness
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, code: 400, message: 'Slug already exists' });
    }

    // Determine sort_order (put at the end by default)
    const siblingsCount = await Category.countDocuments({ parent_id: parent_id || null });
    
    const category = await Category.create({
      name,
      name_vn,
      slug,
      parent_id: parent_id || null,
      icon: icon || 'category',
      sort_order: siblingsCount + 1,
      is_visible: is_visible !== undefined ? is_visible : true,
      enable_commission: enable_commission || false
    });

    res.status(201).json({
      success: true,
      code: 201,
      message: 'Category created successfully',
      data: toCamelCase(category)
    });
  } catch (error) {
    next(error);
  }
};

// Update a category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, name_vn, slug, parent_id, icon, is_visible, enable_commission } = req.body;

    // Check slug uniqueness if slug is changed
    const existing = await Category.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ success: false, code: 400, message: 'Slug already exists' });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        name_vn,
        slug,
        parent_id: parent_id || null,
        icon,
        is_visible,
        enable_commission
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, code: 404, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Category updated successfully',
      data: toCamelCase(category)
    });
  } catch (error) {
    next(error);
  }
};

// Delete a category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if it has children
    const children = await Category.countDocuments({ parent_id: id });
    if (children > 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Cannot delete category with sub-categories. Please delete them first.'
      });
    }

    // Check if it has products
    const products = await Product.countDocuments({ category_id: id });
    if (products > 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: 'Cannot delete category containing products. Please reassign products first.'
      });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, code: 404, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reorder categories
exports.reorderCategories = async (req, res, next) => {
  try {
    const { orderedIds } = req.body; // Array of category IDs in the new order

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, code: 400, message: 'orderedIds must be an array' });
    }

    // Update sort_order for each ID
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { sort_order: index + 1 }
      }
    }));

    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};
