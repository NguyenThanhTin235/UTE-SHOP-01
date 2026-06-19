const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Shop = require('./src/models/Shop');

mongoose.connect('mongodb://localhost:27017/uteshop_db').then(async () => {
  const order = await Order.findOne({ order_code: 'ORD-2026-0173' }).populate('shop_id').lean();
  console.log(Object.keys(order));
  console.log(order.shop_id ? "Has shop_id" : "No shop_id");
  console.log(order.shopId ? "Has shopId" : "No shopId");
  process.exit();
});
