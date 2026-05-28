require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Shop = require('./src/models/Shop');
const SellerProfile = require('./src/models/SellerProfile');

async function seedPendingShops() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop_db');
    console.log('✅ MongoDB Connected');

    // Create 3 dummy users for shops
    const users = [];
    for (let i = 1; i <= 3; i++) {
      let user = await User.findOne({ email: `pending_seller${i}@test.com` });
      if (!user) {
        user = await User.create({
          full_name: `Test Legal Rep ${i}`,
          email: `pending_seller${i}@test.com`,
          password: 'hashedpassword',
          role: 'user',
          is_active: true,
          is_verified: true,
        });
      }
      users.push(user);
    }

    // Create 3 pending Seller Profiles and corresponding inactive Shops
    const shopsData = [
      { name: 'Vintage Collectibles', tax: '0316542XXX' },
      { name: 'Green Life Organic', tax: '0318991XXX' },
      { name: 'Tech Zone Hub', tax: '0312224XXX' },
    ];

    for (let i = 0; i < 3; i++) {
      const u = users[i];
      const sd = shopsData[i];

      let shop = await Shop.findOne({ owner_user_id: u._id });
      if (!shop) {
        shop = await Shop.create({
          name: sd.name,
          owner_user_id: u._id,
          slug: sd.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          status: 'inactive', // inactive because it's pending approval
          email: u.email
        });
      }

      let profile = await SellerProfile.findOne({ user_id: u._id });
      if (!profile) {
        profile = await SellerProfile.create({
          user_id: u._id,
          gst_number: sd.tax,
          status: 'pending', // THIS IS WHAT MAKES IT SHOW ON THE DASHBOARD
        });
      }
    }

    console.log('✅ Seeded 3 pending shops successfully.');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedPendingShops();
