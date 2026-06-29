const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const ProductMedia = require('../src/models/ProductMedia');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db';

const seedProducts = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create or get generic User for shop owners
    let owner = await User.findOne({ email: 'seller_seed@uteshop.com' });
    if (!owner) {
      owner = await User.create({
        full_name: 'Seed Seller',
        email: 'seller_seed@uteshop.com',
        password: '*Tin230983',
        role: 'seller',
        status: 'active'
      });
    }

    // 2. Create or get Shops
    const shops = [
      { name: 'Sneaker Head Store', handle: 'sneaker-head' },
      { name: 'Timeless Elegance', handle: 'timeless-elegance' },
      { name: 'Tech Gadgets Pro', handle: 'tech-gadgets' }
    ];

    const shopMap = {};
    for (const s of shops) {
      let shop = await Shop.findOne({ name: s.name });
      if (!shop) {
        shop = await Shop.create({
          owner_user_id: owner._id,
          name: s.name,
          slug: s.handle,
          description: 'A mock shop',
          status: 'active'
        });
      }
      shopMap[s.name] = shop;
    }

    // 3. Create or get Categories
    const categories = ['Footwear', 'Accessories', 'Electronics'];
    const categoryMap = {};
    for (const c of categories) {
      let cat = await Category.findOne({ name: c });
      if (!cat) {
        cat = await Category.create({
          name: c,
          slug: c.toLowerCase()
        });
      }
      categoryMap[c] = cat;
    }

    // 4. Products to seed
    const productsData = [
      {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270-seed',
        sku: 'PRD-78210',
        price: 150.00,
        shopName: 'Sneaker Head Store',
        categoryName: 'Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Minimalist White Watch',
        slug: 'minimalist-white-watch-seed',
        sku: 'PRD-33412',
        price: 85.00,
        shopName: 'Timeless Elegance',
        categoryName: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'
      },
      {
        name: 'Sony WH-1000XM4 Headphones',
        slug: 'sony-wh-1000xm4-seed',
        sku: 'PRD-99123',
        price: 348.00,
        shopName: 'Tech Gadgets Pro',
        categoryName: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=200'
      }
    ];

    for (const pd of productsData) {
      let product = await Product.findOne({ sku: pd.sku });
      if (!product) {
        product = await Product.create({
          shop_id: shopMap[pd.shopName]._id,
          category_id: categoryMap[pd.categoryName]._id,
          name: pd.name,
          slug: pd.slug,
          sku: pd.sku,
          description: `A great ${pd.name}`,
          mrp_price: pd.price * 1.2,
          selling_price: pd.price,
          approval_status: 'pending'
        });
      } else {
        // Reset to pending if it was already created and approved/rejected
        product.approval_status = 'pending';
        await product.save();
      }

      // 5. Add Media
      let media = await ProductMedia.findOne({ product_id: product._id });
      if (!media) {
        await ProductMedia.create({
          product_id: product._id,
          media_type: 'image',
          media_url: pd.imageUrl,
          sort_order: 1
        });
      } else {
        media.media_url = pd.imageUrl;
        await media.save();
      }
      console.log(`Seeded pending product: ${pd.name}`);
    }

    console.log('Successfully seeded pending products!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
};

seedProducts();
