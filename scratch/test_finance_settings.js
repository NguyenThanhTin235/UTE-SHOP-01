require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { getFinanceSettings, updateFinanceSettings } = require('../src/controllers/adminController');
const { requestWithdrawal } = require('../src/controllers/sellerController');
const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const SellerWallet = require('../src/models/SellerWallet');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  // Find an admin user to act as req.user
  const admin = await User.findOne({ email: 'admin@uteshop.vn' });
  if (!admin) {
    console.error('Admin user not found. Run seed script first.');
    process.exit(1);
  }

  // 1. Test getFinanceSettings
  console.log('\n--- 1. Testing getFinanceSettings ---');
  let resData = null;
  const mockRes = {
    status: (code) => {
      console.log(`Res status: ${code}`);
      return mockRes;
    },
    json: (data) => {
      resData = data;
      console.log('Res json:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  };

  await getFinanceSettings({ user: admin }, mockRes);

  // 2. Test updateFinanceSettings
  console.log('\n--- 2. Testing updateFinanceSettings ---');
  const mockReqUpdate = {
    user: admin,
    body: {
      fee_percent: 3.5,
      gateway_fee_percent: 2.0,
      earn_rate: 150 / 10000, // 150 coins per 10,000 VND
      spend_rate: 1,
      max_usage_percent: 40,
      expiry_duration: '6 Months from Earning',
      min_withdrawal: 250000,
      max_daily_withdrawal: 40000000,
      payout_processing_time: 'Instant Payout'
    }
  };

  await updateFinanceSettings(mockReqUpdate, mockRes);

  // 3. Verify changes were saved
  console.log('\n--- 3. Verifying updated settings in DB ---');
  await getFinanceSettings({ user: admin }, mockRes);

  // 4. Test seller withdrawal enforcement
  console.log('\n--- 4. Testing seller withdrawal enforcement ---');
  // Find a seller to test with
  const fashionSeller = await User.findOne({ email: 'fashion@gmail.com' });
  const shop = await Shop.findOne({ owner_user_id: fashionSeller._id });
  
  // Set wallet available balance to 1,000,000 to ensure balance is sufficient
  await SellerWallet.findOneAndUpdate(
    { shop_id: shop._id },
    { available_balance: 1000000 }
  );

  const mockWithdrawReq = {
    user: { id: fashionSeller._id },
    body: {
      amount: 150000, // below new min withdrawal limit of 250000
      bank_account: '9999999999'
    }
  };

  let withdrawStatus = null;
  let withdrawJson = null;
  const mockWithdrawRes = {
    status: (code) => {
      withdrawStatus = code;
      return mockWithdrawRes;
    },
    json: (data) => {
      withdrawJson = data;
      return mockWithdrawRes;
    }
  };

  // Call seller withdrawal
  await requestWithdrawal(mockWithdrawReq, mockWithdrawRes, (err) => console.error(err));
  
  console.log(`Withdrawal response status: ${withdrawStatus}`);
  console.log('Withdrawal response json:', JSON.stringify(withdrawJson, null, 2));

  if (withdrawStatus === 400 && withdrawJson.message.includes('250,000')) {
    console.log('\n✅ SUCCESS: Withdrawal limit of 250,000 was correctly enforced!');
  } else {
    console.log('\n❌ FAILURE: Withdrawal limit was not enforced correctly.');
  }

  await mongoose.connection.close();
}

test().catch(console.error);
