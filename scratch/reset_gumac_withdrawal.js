require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Shop = require('../src/models/Shop');
const WithdrawRequest = require('../src/models/WithdrawRequest');
const SellerWallet = require('../src/models/SellerWallet');
const sellerController = require('../src/controllers/sellerController');

async function resetGumacWithdrawal() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  const shop = await Shop.findOne({ slug: 'gumac-fashion-store' });
  if (!shop) {
    console.error('GUMAC shop not found.');
    process.exit(1);
  }

  // Delete all pending/approved withdrawal requests for GUMAC to reset
  const result = await WithdrawRequest.deleteMany({
    shop_id: shop._id,
    status: { $in: ['pending', 'approved'] }
  });

  console.log(`Deleted ${result.deletedCount} pending/approved withdrawal requests for GUMAC.`);

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

resetGumacWithdrawal().catch(console.error);
