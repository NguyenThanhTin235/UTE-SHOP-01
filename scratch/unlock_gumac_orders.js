require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Shop = require('../src/models/Shop');
const Order = require('../src/models/Order');
const sellerController = require('../src/controllers/sellerController');

async function unlockGumacOrders() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  const shop = await Shop.findOne({ slug: 'gumac-fashion-store' });
  if (!shop) {
    console.error('GUMAC shop not found.');
    process.exit(1);
  }

  // Find delivered orders for GUMAC
  const orders = await Order.find({ shop_id: shop._id, status: 'delivered' }).limit(5);
  console.log(`Found ${orders.length} delivered orders for GUMAC.`);

  // Set the updatedAt of the first 3 orders to 10 days ago
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  
  let updatedCount = 0;
  for (let i = 0; i < Math.min(orders.length, 3); i++) {
    const order = orders[i];
    await Order.findByIdAndUpdate(order._id, {
      updatedAt: tenDaysAgo
    }, { timestamps: false });
    console.log(`Updated Order ${order.order_code} status date to 10 days ago (${tenDaysAgo.toISOString()})`);
    updatedCount++;
  }

  console.log(`Successfully unlocked ${updatedCount} orders.`);

  // Recalculate wallet using the endpoint mock call
  const User = require('../src/models/User');
  const owner = await User.findById(shop.owner_user_id);
  
  const mockReq = {
    user: { id: owner._id.toString() }
  };
  const mockRes = {
    status: (code) => mockRes,
    json: (data) => {
      console.log('\nRecalculated Wallet Balances:');
      console.log(JSON.stringify(data.data, null, 2));
      return mockRes;
    }
  };

  await sellerController.getWalletInfo(mockReq, mockRes, (err) => console.error(err));

  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

unlockGumacOrders().catch(console.error);
