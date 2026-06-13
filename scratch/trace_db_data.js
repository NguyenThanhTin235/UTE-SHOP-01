require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const Order = require('../src/models/Order');
const SellerWallet = require('../src/models/SellerWallet');
const SellerWalletTransaction = require('../src/models/SellerWalletTransaction');
const WithdrawRequest = require('../src/models/WithdrawRequest');
const WithdrawalSetting = require('../src/models/WithdrawalSetting');
const PlatformFeeSetting = require('../src/models/PlatformFeeSetting');
const CoinSetting = require('../src/models/CoinSetting');

async function traceDbData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');
  console.log('========================================================================');

  // 1. Settings
  console.log('\n--- 1. ACTIVE FINANCE SETTINGS ---');
  const platformFee = await PlatformFeeSetting.findOne().sort({ effective_from: -1 });
  console.log('Platform Fee Setting:', platformFee ? JSON.stringify(platformFee.toObject(), null, 2) : 'None');

  const coinSetting = await CoinSetting.findOne().sort({ effective_from: -1 });
  console.log('Coin Setting:', coinSetting ? JSON.stringify(coinSetting.toObject(), null, 2) : 'None');

  const withdrawSetting = await WithdrawalSetting.findOne().sort({ effective_from: -1 });
  console.log('Withdrawal Limit Setting:', withdrawSetting ? JSON.stringify(withdrawSetting.toObject(), null, 2) : 'None');

  // 2. Seller Wallets
  console.log('\n--- 2. SELLER WALLETS ---');
  const wallets = await SellerWallet.find().populate({
    path: 'shop_id',
    select: 'name slug owner_user_id'
  });
  if (wallets.length === 0) {
    console.log('No seller wallets found.');
  } else {
    for (const wallet of wallets) {
      console.log(`Wallet ID: ${wallet._id}`);
      console.log(`- Shop: ${wallet.shop_id ? `${wallet.shop_id.name} (${wallet.shop_id.slug})` : 'Unknown Shop'}`);
      console.log(`- Total Balance: ${wallet.total_balance.toLocaleString()}₫`);
      console.log(`- Pending (Frozen) Balance: ${wallet.pending_balance.toLocaleString()}₫`);
      console.log(`- Available Balance: ${wallet.available_balance.toLocaleString()}₫`);
      console.log('----------------------------------------------------');
    }
  }

  // 3. Recent Wallet Transactions
  console.log('\n--- 3. RECENT WALLET TRANSACTIONS (MAX 10) ---');
  const txs = await SellerWalletTransaction.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({
      path: 'shop_id',
      select: 'name'
    })
    .populate({
      path: 'order_id',
      select: 'order_code'
    });
  if (txs.length === 0) {
    console.log('No transactions found.');
  } else {
    txs.forEach((tx, idx) => {
      console.log(`${idx + 1}. [${tx.createdAt.toISOString()}] Shop: ${tx.shop_id ? tx.shop_id.name : 'Unknown'}`);
      console.log(`   Type: ${tx.type}, Amount: ${tx.amount.toLocaleString()}₫`);
      console.log(`   Order: ${tx.order_id ? tx.order_id.order_code : 'N/A'}`);
      console.log(`   Balance Before: ${tx.balance_before.toLocaleString()}₫ | After: ${tx.balance_after.toLocaleString()}₫`);
      console.log('   -------------------------------------------------');
    });
  }

  // 4. Withdrawal Requests
  console.log('\n--- 4. RECENT WITHDRAWAL REQUESTS (MAX 5) ---');
  const withdrawals = await WithdrawRequest.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({
      path: 'shop_id',
      select: 'name'
    });
  if (withdrawals.length === 0) {
    console.log('No withdrawal requests found.');
  } else {
    withdrawals.forEach((w, idx) => {
      console.log(`${idx + 1}. [${w.createdAt.toISOString()}] Shop: ${w.shop_id ? w.shop_id.name : 'Unknown'}`);
      console.log(`   Amount: ${w.amount.toLocaleString()}₫, Status: ${w.status}`);
      console.log(`   Note: ${w.note || 'None'}`);
      console.log('   -------------------------------------------------');
    });
  }

  // 5. Recent Completed/Delivered Orders Payout Reference
  console.log('\n--- 5. RECENT DELIVERED ORDERS WITH FEES (MAX 5) ---');
  const orders = await Order.find({ status: 'delivered' })
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate({
      path: 'shop_id',
      select: 'name'
    });
  if (orders.length === 0) {
    console.log('No delivered orders found.');
  } else {
    orders.forEach((order, idx) => {
      const platformFee = order.platform_fee_amount || 0;
      const gatewayFee = order.gateway_fee_amount || 0;
      const payout = order.subtotal_amount + order.shipping_fee - platformFee - gatewayFee;
      console.log(`${idx + 1}. Order Code: ${order.order_code} (Shop: ${order.shop_id ? order.shop_id.name : 'Unknown'})`);
      console.log(`   Subtotal: ${order.subtotal_amount.toLocaleString()}₫ | Shipping: ${order.shipping_fee.toLocaleString()}₫`);
      console.log(`   Platform Fee: ${platformFee.toLocaleString()}₫ (${order.platform_fee_rate}%)`);
      console.log(`   Gateway Fee: ${gatewayFee.toLocaleString()}₫ (${order.gateway_fee_rate}%)`);
      console.log(`   Calculated Payout: ${payout.toLocaleString()}₫`);
      console.log('   -------------------------------------------------');
    });
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
}

traceDbData().catch(console.error);
