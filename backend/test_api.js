require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop').then(async () => {
  const Product = require('./src/models/Product');
  const ProductMedia = require('./src/models/ProductMedia');

  const products = await Product.find({ approval_status: 'pending' });
  const productIds = products.map(p => p._id);
  const media = await ProductMedia.find({ product_id: { $in: productIds }, media_type: 'image' });

  const mediaMap = {};
  media.forEach(m => {
    mediaMap[m.product_id.toString()] = m.media_url;
  });

  products.forEach(p => {
    console.log(`Product: ${p.name}, Image: ${mediaMap[p._id.toString()]}`);
  });

  process.exit(0);
});
