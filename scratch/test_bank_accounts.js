require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const sellerController = require('../src/controllers/sellerController');
const Shop = require('../src/models/Shop');
const User = require('../src/models/User');
const SellerBankAccount = require('../src/models/SellerBankAccount');

async function testBankAccounts() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  // Find GUMAC Fashion Store shop and owner user
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

  console.log(`\nShop: ${shop.name}`);
  console.log(`Owner User: ${owner.email}`);

  // Delete all existing accounts for this shop first to start clean
  await SellerBankAccount.deleteMany({ shop_id: shop._id });
  console.log('Cleaned up existing test accounts.');

  // Mock req & res for getBankAccounts (which should dynamically seed the first default account from SellerProfile)
  const mockReq = {
    user: { id: owner._id.toString() }
  };

  let responseData = null;
  const mockRes = {
    status: (code) => mockRes,
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  console.log('\n--- 1. Testing getBankAccounts (Seeding default from Profile) ---');
  await sellerController.getBankAccounts(mockReq, mockRes, (err) => console.error(err));
  console.log('Response:', JSON.stringify(responseData, null, 2));

  if (!responseData || responseData.data.length !== 1) {
    console.error('❌ Expected 1 seeded bank account.');
    process.exit(1);
  }
  const seededAccount = responseData.data[0];

  console.log('\n--- 2. Testing addBankAccount (Adding a new ACB account) ---');
  const mockAddReq = {
    user: { id: owner._id.toString() },
    body: {
      bank_name: 'ACB',
      account_name: 'FASHION GURU ACB',
      account_number: '9988776655',
      is_default: false
    }
  };

  await sellerController.addBankAccount(mockAddReq, mockRes, (err) => console.error(err));
  console.log('Response:', JSON.stringify(responseData, null, 2));

  // Verify there are now two accounts
  console.log('\n--- 3. Verifying updated accounts list ---');
  await sellerController.getBankAccounts(mockReq, mockRes, (err) => console.error(err));
  console.log('All Accounts:', JSON.stringify(responseData.data, null, 2));

  if (responseData.data.length !== 2) {
    console.error('❌ Expected 2 bank accounts in database.');
    process.exit(1);
  }

  console.log('\n--- 4. Testing deleteBankAccount ---');
  const accountToDelete = responseData.data.find(acc => acc.bank_name === 'ACB');
  const mockDeleteReq = {
    user: { id: owner._id.toString() },
    params: { id: accountToDelete._id.toString() }
  };

  await sellerController.deleteBankAccount(mockDeleteReq, mockRes, (err) => console.error(err));
  console.log('Response:', JSON.stringify(responseData, null, 2));

  // Verify it is deleted
  console.log('\n--- 5. Verifying accounts list after deletion ---');
  await sellerController.getBankAccounts(mockReq, mockRes, (err) => console.error(err));
  console.log('Accounts left:', JSON.stringify(responseData.data, null, 2));

  if (responseData.data.length !== 1) {
    console.error('❌ Expected 1 bank account after deletion.');
    process.exit(1);
  }

  console.log('\n✅ ALL DATABASE AND CONTROLLER TESTS PASSED SUCCESSFULLY!');
  await mongoose.connection.close();
}

testBankAccounts().catch(console.error);
