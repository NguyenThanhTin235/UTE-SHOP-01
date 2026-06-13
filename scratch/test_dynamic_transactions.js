require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const sellerController = require('../src/controllers/sellerController');
const Shop = require('../src/models/Shop');
const User = require('../src/models/User');

async function testDynamicTransactions() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  const shop = await Shop.findOne({ slug: 'gumac-fashion-store' });
  if (!shop) {
    console.error('GUMAC shop not found.');
    process.exit(1);
  }

  const owner = await User.findById(shop.owner_user_id);
  
  const mockReq = {
    user: { id: owner._id.toString() },
    query: { page: 1, limit: 10 }
  };

  let responseData = null;
  const mockRes = {
    status: (code) => mockRes,
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  console.log('\nFetching dynamic transactions list for GUMAC...');
  await sellerController.getWalletTransactions(mockReq, mockRes, (err) => console.error(err));

  if (responseData && responseData.success) {
    console.log(`\n✅ SUCCESS: Retrieved ${responseData.data.length} transactions dynamically!`);
    console.log(`Meta:`, responseData.meta);
    console.log('\nSample Transactions:');
    responseData.data.slice(0, 3).forEach((t, idx) => {
      console.log(`[${idx + 1}] Date: ${t.createdAt}`);
      console.log(`    Type: ${t.type}, Amount: ${t.amount.toLocaleString()}₫, Status: ${t.status}`);
      console.log(`    Order Code: ${t.order_id ? t.order_id.order_code : 'N/A'}`);
    });
  } else {
    console.log('\n❌ FAILURE: Failed to retrieve transactions.', responseData);
  }

  await mongoose.connection.close();
}

testDynamicTransactions().catch(console.error);
