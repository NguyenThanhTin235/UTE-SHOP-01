require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const sellerController = require('../src/controllers/sellerController');
const Shop = require('../src/models/Shop');
const User = require('../src/models/User');
const SellerWallet = require('../src/models/SellerWallet');

async function testDynamicWallet() {
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

  // Temporarily reset wallet document in DB to initial seed values to test overwrite
  await SellerWallet.findOneAndUpdate(
    { shop_id: shop._id },
    { total_balance: 15000000, pending_balance: 5000000, available_balance: 10000000 }
  );

  console.log('\n[Initial Wallet Balances in DB (Reset to Seed Data)]');
  console.log(`- Total Balance: 15,000,000₫`);
  console.log(`- Pending Balance: 5,000,000₫`);
  console.log(`- Available Balance: 10,000,000₫`);

  const initialWallet = { total_balance: 15000000, pending_balance: 5000000, available_balance: 10000000 };

  // Simulate getWalletInfo request
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

  console.log('\nCalling /api/seller/wallet endpoint...');
  await sellerController.getWalletInfo(mockReq, mockRes, (err) => console.error(err));

  if (!responseData || !responseData.success) {
    console.error('❌ Failed to retrieve wallet info:', responseData);
    process.exit(1);
  }

  const recalculatedWallet = responseData.data;
  console.log('\n[Recalculated Wallet Balances from Endpoint]');
  console.log(`- Total Balance: ${recalculatedWallet.total_balance.toLocaleString()}₫`);
  console.log(`- Pending Balance: ${recalculatedWallet.pending_balance.toLocaleString()}₫`);
  console.log(`- Available Balance: ${recalculatedWallet.available_balance.toLocaleString()}₫`);

  // Fetch wallet document from DB again to verify it has been updated
  const finalWalletInDb = await SellerWallet.findOne({ shop_id: shop._id });
  console.log('\n[Updated Wallet Balances in DB]');
  console.log(`- Total Balance: ${finalWalletInDb.total_balance.toLocaleString()}₫`);
  console.log(`- Pending Balance: ${finalWalletInDb.pending_balance.toLocaleString()}₫`);
  console.log(`- Available Balance: ${finalWalletInDb.available_balance.toLocaleString()}₫`);

  // Assertions
  const matchesResponse = 
    finalWalletInDb.total_balance === recalculatedWallet.total_balance &&
    finalWalletInDb.pending_balance === recalculatedWallet.pending_balance &&
    finalWalletInDb.available_balance === recalculatedWallet.available_balance;

  const isOverwritten = 
    finalWalletInDb.total_balance !== initialWallet.total_balance ||
    finalWalletInDb.pending_balance !== initialWallet.pending_balance ||
    finalWalletInDb.available_balance !== initialWallet.available_balance;

  if (matchesResponse && isOverwritten) {
    console.log('\n✅ SUCCESS: Seed data successfully recalculated and overwritten in database!');
    console.log('Wallet balances are now dynamically derived from actual orders and withdrawals.');
  } else {
    console.log('\n❌ FAILURE: Verification failed.');
    console.log(`Matches response: ${matchesResponse}`);
    console.log(`Is overwritten: ${isOverwritten}`);
  }

  await mongoose.connection.close();
}

testDynamicWallet().catch(console.error);
