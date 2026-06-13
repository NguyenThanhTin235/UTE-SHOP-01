require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const checkoutController = require('../src/controllers/checkoutController');
const sellerOrderController = require('../src/controllers/sellerOrderController');
const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Cart = require('../src/models/Cart');
const CartItem = require('../src/models/CartItem');
const CoinSetting = require('../src/models/CoinSetting');
const PlatformFeeSetting = require('../src/models/PlatformFeeSetting');
const SellerWallet = require('../src/models/SellerWallet');
const SellerWalletTransaction = require('../src/models/SellerWalletTransaction');

async function testPayout() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  // 1. Find or create settings
  await PlatformFeeSetting.findOneAndUpdate(
    {},
    { fee_percent: 4.0, gateway_fee_percent: 2.0, effective_from: new Date() },
    { upsert: true, new: true }
  );
  console.log('Set PlatformFeeSetting: platform fee 4%, gateway fee 2%');

  await CoinSetting.findOneAndUpdate(
    {},
    { max_usage_percent: 70, earn_rate: 0.01, spend_rate: 1, effective_from: new Date() },
    { upsert: true, new: true }
  );

  // 2. Find customer user, seller user and product
  const customer = await User.findOne({ email: 'admin@uteshop.vn' }) || await User.findOne();
  if (!customer) {
    console.error('No customer user found.');
    process.exit(1);
  }

  // Find a shop and product
  const product = await Product.findOne().populate('shop_id');
  if (!product || !product.shop_id) {
    console.error('No products/shops found.');
    process.exit(1);
  }
  const shop = product.shop_id;
  const seller = await User.findById(shop.owner_user_id);
  if (!seller) {
    console.error('No seller user found for shop.');
    process.exit(1);
  }

  console.log(`Customer: ${customer.email}, Shop: ${shop.name}, Seller: ${seller.email}, Product: ${product.name}`);

  // Give customer sufficient coins
  await User.findByIdAndUpdate(customer._id, { coin_balance: 500000 });

  // 3. Setup cart and item
  let cart = await Cart.findOne({ user_id: customer._id });
  if (!cart) {
    cart = await Cart.create({ user_id: customer._id });
  }

  // Ensure there is a cart item
  await CartItem.deleteMany({ cart_id: cart._id }); // clear old
  const testQty = 2;
  const testItem = await CartItem.create({
    cart_id: cart._id,
    product_id: product._id,
    quantity: testQty,
    price: product.selling_price
  });

  const subtotal = product.selling_price * testQty;
  console.log(`Cart subtotal: ${subtotal.toLocaleString()}₫`);

  // Reset seller wallet to 0 for clean test
  await SellerWallet.findOneAndUpdate(
    { shop_id: shop._id },
    { available_balance: 0, total_balance: 0, pending_balance: 0 },
    { upsert: true }
  );
  console.log('Reset seller wallet available balance to 0₫');

  // 4. Place order with mock headers
  const mockReqPlace = {
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
    user: { id: customer._id.toString() },
    body: {
      itemIds: [testItem._id.toString()],
      addressId: new mongoose.Types.ObjectId().toString(), // mock address
      useCoins: true,
      paymentMethod: 'vnpay'
    }
  };

  // Mock address check
  const Address = require('../src/models/Address');
  let addr = await Address.findOne({ user_id: customer._id });
  if (!addr) {
    addr = await Address.create({
      user_id: customer._id,
      recipient_name: 'Test Name',
      recipient_phone: '0987654321',
      street_address: '123 Test St',
      city: 'Hanoi',
      label: 'Home'
    });
  }
  mockReqPlace.body.addressId = addr._id.toString();

  let placeResponse = null;
  const mockResPlace = {
    status: (code) => mockResPlace,
    json: (data) => {
      placeResponse = data;
      return mockResPlace;
    }
  };

  await checkoutController.placeOrder(mockReqPlace, mockResPlace);
  
  if (!placeResponse || !placeResponse.success) {
    console.error('❌ Order placement failed:', placeResponse);
    process.exit(1);
  }

  console.log('Order placed successfully.');

  // Find created Order
  const order = await Order.findOne({ customer_id: customer._id }).sort({ createdAt: -1 });
  if (!order) {
    console.error('Order record not found in DB.');
    process.exit(1);
  }

  console.log(`Created order code: ${order.order_code}`);
  console.log(`Subtotal: ${order.subtotal_amount.toLocaleString()}₫, Shipping: ${order.shipping_fee.toLocaleString()}₫`);
  console.log(`Platform Fee Rate: ${order.platform_fee_rate}%, Platform Fee Amount: ${order.platform_fee_amount.toLocaleString()}₫`);
  console.log(`Gateway Fee Rate: ${order.gateway_fee_rate}%, Gateway Fee Amount: ${order.gateway_fee_amount.toLocaleString()}₫`);
  console.log(`Coin Discount Applied: ${order.coin_discount.toLocaleString()}₫`);
  console.log(`Total Final customer paid: ${order.total_final.toLocaleString()}₫`);

  // Verify rates and calculations at placement
  const expectedPlatformFee = Math.round(order.subtotal_amount * 0.04);
  const expectedGatewayFee = Math.round(order.subtotal_amount * 0.02);

  if (order.platform_fee_amount === expectedPlatformFee && order.gateway_fee_amount === expectedGatewayFee) {
    console.log('✅ SUCCESS: Platform and gateway fees calculated and stored correctly on order placement!');
  } else {
    console.log('❌ FAILURE: Platform/Gateway fee mismatch.');
    console.log(`Expected platform: ${expectedPlatformFee}, actual: ${order.platform_fee_amount}`);
    console.log(`Expected gateway: ${expectedGatewayFee}, actual: ${order.gateway_fee_amount}`);
  }

  // 5. Complete order (mark as delivered)
  const mockReqUpdate = {
    user: { id: seller._id.toString() },
    params: { id: order._id.toString() },
    body: { status: 'delivered' }
  };

  let updateResponse = null;
  const mockResUpdate = {
    status: (code) => mockResUpdate,
    json: (data) => {
      updateResponse = data;
      return mockResUpdate;
    }
  };

  console.log('\nUpdating order status to "delivered"...');
  await sellerOrderController.updateOrderStatus(mockReqUpdate, mockResUpdate, (err) => console.error(err));

  if (!updateResponse || !updateResponse.success) {
    console.error('❌ Failed to update status to delivered:', updateResponse);
    process.exit(1);
  }

  // Verify wallet credit
  const wallet = await SellerWallet.findOne({ shop_id: shop._id });
  const expectedPayout = order.subtotal_amount + order.shipping_fee - order.platform_fee_amount - order.gateway_fee_amount;

  console.log(`\nSeller Wallet Balances after delivery:`);
  console.log(`- Total Balance: ${wallet.total_balance.toLocaleString()}₫`);
  console.log(`- Pending Balance: ${wallet.pending_balance.toLocaleString()}₫`);
  console.log(`- Available Balance: ${wallet.available_balance.toLocaleString()}₫`);
  console.log(`Expected Payout Amount: ${expectedPayout.toLocaleString()}₫`);

  // Check transaction log
  const tx = await SellerWalletTransaction.findOne({ order_id: order._id });
  
  if (tx) {
    console.log(`Created SellerWalletTransaction: type: ${tx.type}, amount: ${tx.amount.toLocaleString()}₫, balance_after: ${tx.balance_after.toLocaleString()}₫`);
  } else {
    console.log('❌ SellerWalletTransaction record was NOT created.');
  }

  const isPendingCorrect = wallet.pending_balance === expectedPayout;
  const isTotalCorrect = wallet.total_balance === expectedPayout;
  const isAvailableCorrect = wallet.available_balance === 0;

  if (isPendingCorrect && isTotalCorrect && isAvailableCorrect && tx && tx.type === 'earning' && tx.amount === expectedPayout) {
    console.log('\n✅ SUCCESS: Seller received full payout credited to frozen/pending balances!');
    console.log('Platform correctly absorbed the promotion discount cost and held the funds in escrow.');
  } else {
    console.log('\n❌ FAILURE: Seller payout calculations or wallet credit is incorrect.');
    if (!isPendingCorrect) console.log(`- Pending balance mismatch: expected ${expectedPayout}, got ${wallet.pending_balance}`);
    if (!isTotalCorrect) console.log(`- Total balance mismatch: expected ${expectedPayout}, got ${wallet.total_balance}`);
    if (!isAvailableCorrect) console.log(`- Available balance mismatch: expected 0, got ${wallet.available_balance}`);
  }

  await mongoose.connection.close();
}

testPayout().catch(console.error);
