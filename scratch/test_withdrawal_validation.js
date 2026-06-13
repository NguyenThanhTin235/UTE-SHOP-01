require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const sellerController = require('../src/controllers/sellerController');
const Shop = require('../src/models/Shop');
const User = require('../src/models/User');

async function testWithdrawalValidation() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  const shop = await Shop.findOne({ slug: 'gumac-fashion-store' });
  if (!shop) {
    console.error('GUMAC shop not found.');
    process.exit(1);
  }

  const owner = await User.findById(shop.owner_user_id);
  if (!owner) {
    console.error('Owner user not found.');
    process.exit(1);
  }

  // Attempt to withdraw 200,000₫ when GUMAC available balance is 0₫
  const mockReq = {
    user: { id: owner._id.toString() },
    body: {
      amount: 200000,
      bank_account: 'Vietcombank (***8829)'
    }
  };

  let responseCode = null;
  let responseData = null;
  const mockRes = {
    status: (code) => {
      responseCode = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  console.log('\nSubmitting withdrawal request of 200,000₫ (Expected to fail due to 0₫ available balance)...');
  await sellerController.requestWithdrawal(mockReq, mockRes, (err) => console.error(err));

  console.log(`Response Status Code: ${responseCode}`);
  console.log('Response JSON:', JSON.stringify(responseData, null, 2));

  if (responseCode === 400 && responseData && responseData.message === 'Số dư khả dụng không đủ') {
    console.log('\n✅ SUCCESS: Backend successfully blocked withdrawal and returned correct message!');
  } else {
    console.log('\n❌ FAILURE: Validation did not behave as expected.');
  }

  await mongoose.connection.close();
}

testWithdrawalValidation().catch(console.error);
