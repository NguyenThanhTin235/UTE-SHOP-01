require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const checkoutController = require('../src/controllers/checkoutController');
const User = require('../src/models/User');
const CoinSetting = require('../src/models/CoinSetting');
const Cart = require('../src/models/Cart');
const CartItem = require('../src/models/CartItem');
const Product = require('../src/models/Product');

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uteshop_db');
  console.log('Connected to MongoDB');

  // 1. Find ANY user
  const customer = await User.findOne();
  if (!customer) {
    console.error('No users found in the database. Run seed script first.');
    process.exit(1);
  }
  console.log(`Using user: ${customer.email} (ID: ${customer._id})`);

  // Ensure customer has sufficient coin balance for testing cap (e.g. 500,000 coins)
  await User.findByIdAndUpdate(customer._id, { coin_balance: 500000 });
  console.log('Set customer coin balance to 500,000');

  // 2. Find customer's cart or create one
  let cart = await Cart.findOne({ user_id: customer._id });
  if (!cart) {
    cart = await Cart.create({ user_id: customer._id });
  }

  // Find a product to add to cart
  const product = await Product.findOne();
  if (!product) {
    console.error('No products found in database to test checkout.');
    process.exit(1);
  }

  // Ensure there is at least one cart item
  let cartItems = await CartItem.find({ cart_id: cart._id });
  if (cartItems.length === 0) {
    await CartItem.create({
      cart_id: cart._id,
      product_id: product._id,
      quantity: 2,
      price: product.selling_price
    });
    cartItems = await CartItem.find({ cart_id: cart._id });
  }

  const itemIds = cartItems.map(item => item._id.toString());
  console.log(`Cart items to test: ${itemIds.join(', ')}`);

  const runPreview = async (testCapPercent) => {
    // Set CoinSetting max_usage_percent
    await CoinSetting.findOneAndUpdate(
      {},
      { max_usage_percent: testCapPercent, earn_rate: 0.01, spend_rate: 1, effective_from: new Date() },
      { upsert: true, new: true }
    );
    console.log(`\nUpdated CoinSetting spending cap to: ${testCapPercent}%`);

    const mockReq = {
      user: { id: customer._id.toString() },
      body: {
        itemIds,
        useCoins: true
      }
    };

    let responseData = null;
    const mockRes = {
      status: (code) => mockRes,
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    await checkoutController.previewCheckout(mockReq, mockRes);

    if (responseData && responseData.success) {
      const { subtotalAmount, shippingAmount, coinDiscount, coinBalance, finalAmount } = responseData.data;
      const expectedCap = Math.round(subtotalAmount * (testCapPercent / 100));

      console.log(`- Subtotal: ${subtotalAmount.toLocaleString()}₫`);
      console.log(`- Shipping: ${shippingAmount.toLocaleString()}₫`);
      console.log(`- Coin Balance: ${coinBalance.toLocaleString()}`);
      console.log(`- Coin Discount Applied: ${coinDiscount.toLocaleString()}₫`);
      console.log(`- Expected Cap (${testCapPercent}% of subtotal): ${expectedCap.toLocaleString()}₫`);

      if (coinDiscount === expectedCap) {
        console.log(`✅ SUCCESS: Coin discount matches exactly the ${testCapPercent}% subtotal cap limit!`);
      } else {
        console.log(`❌ FAILURE: Coin discount (${coinDiscount}) does not match expected subtotal cap (${expectedCap})`);
      }
    } else {
      console.error('❌ Error in previewCheckout response:', responseData);
    }
  };

  // Run tests with 70% and 40% cap
  await runPreview(70);
  await runPreview(40);

  await mongoose.connection.close();
}

runTest().catch(console.error);
