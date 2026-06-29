require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const SellerProfile = require('../src/models/SellerProfile');
const AuditLog = require('../src/models/AuditLog');

async function seedPendingShops() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop_db');
    console.log('✅ MongoDB Connected');

    // Create 5 dummy users for shops
    const users = [];
    const usersData = [
      { name: 'Le Van A', email: 'levana@vintage.com', phone: '0901234567' },
      { name: 'Nguyen Thi B', email: 'nguyenb@greenlife.com', phone: '0912345678' },
      { name: 'Tran Van C', email: 'tranc@techzone.com', phone: '0923456789' },
      { name: 'Pham Thi D', email: 'phamd@fashionhub.com', phone: '0934567890' },
      { name: 'Hoang Van E', email: 'hoange@sportsworld.com', phone: '0945678901' },
    ];

    for (let i = 0; i < 5; i++) {
      const ud = usersData[i];
      let user = await User.findOne({ email: ud.email });
      if (!user) {
        user = await User.create({
          full_name: ud.name,
          email: ud.email,
          phone: ud.phone,
          password: '*Tin230983',
          role: 'user',
          is_active: true,
          is_verified: true,
        });
      }
      users.push(user);
    }

    // Create 5 pending Seller Profiles and corresponding inactive Shops
    const shopsData = [
      { name: 'Vintage Collectibles', tax: '0316542XXX', address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City', phone: '0901234567', id_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800', biz_url: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Green Life Organic', tax: '0318991XXX', address: '456 Le Loi Street, Hai Chau District, Da Nang', phone: '0912345678', id_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800', biz_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800' },
      { name: 'Tech Zone Hub', tax: '0312224XXX', address: '789 Cau Giay Street, Cau Giay District, Hanoi', phone: '0923456789', id_url: 'https://images.unsplash.com/photo-1633158829585-23bb8f628e3c?auto=format&fit=crop&q=80&w=800', biz_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66cb85?auto=format&fit=crop&q=80&w=800' },
      { name: 'Fashion Hub', tax: '0313335XXX', address: '101 Nguyen Dinh Chieu, District 3, Ho Chi Minh City', phone: '0934567890', id_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800', biz_url: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Sports World', tax: '0314446XXX', address: '202 Tran Hung Dao, Hoan Kiem District, Hanoi', phone: '0945678901', id_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800', biz_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800' },
    ];

    for (let i = 0; i < 5; i++) {
      const u = users[i];
      const sd = shopsData[i];

      let shop = await Shop.findOne({ owner_user_id: u._id });
      if (!shop) {
        shop = await Shop.create({
          name: sd.name,
          owner_user_id: u._id,
          slug: sd.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          status: 'inactive', // inactive because it's pending approval
          email: u.email,
          address: sd.address,
          phone: sd.phone,
        });
      }

      let profile = await SellerProfile.findOne({ user_id: u._id });
      if (!profile) {
        profile = await SellerProfile.create({
          user_id: u._id,
          gst_number: sd.tax,
          pickup_address: sd.address,
          identity_card_url: sd.id_url,
          business_license_url: sd.biz_url,
          status: 'pending', // THIS IS WHAT MAKES IT SHOW ON THE DASHBOARD
        });
      } else {
        profile.identity_card_url = sd.id_url;
        profile.business_license_url = sd.biz_url;
        profile.pickup_address = sd.address;
        await profile.save();
      }

      // Seed diverse history for the first two shops
      if (i < 2) {
        // Find or create 'System Dispatcher' user
        let botUser = await User.findOne({ email: 'bot@system.com' });
        if (!botUser) {
          botUser = await User.create({ full_name: 'OPERATIONS BOT', email: 'bot@system.com', password: '*Tin230983', role: 'admin' });
        }
        
        let managerUser = await User.findOne({ email: 'senior@system.com' });
        if (!managerUser) {
          managerUser = await User.create({ full_name: 'SENIOR MANAGER', email: 'senior@system.com', password: '*Tin230983', role: 'admin' });
        }

        // Clear existing audit logs for this shop to avoid duplicates on re-run
        await AuditLog.deleteMany({ entity_id: shop._id });

        // Create 'Application Opened' event
        const openedDate = new Date();
        openedDate.setDate(openedDate.getDate() - 1); // Yesterday
        await AuditLog.create({
          actor_id: botUser._id,
          action: 'Application Opened',
          entity_type: 'Shop',
          entity_id: shop._id,
          metadata: { note: 'Review process initiated by system dispatcher.' },
          createdAt: openedDate
        });

        // Create 'Information Requested' event (only for the first shop)
        if (i === 0) {
          const infoDate = new Date(); // Today
          await AuditLog.create({
            actor_id: managerUser._id,
            action: 'Information Requested',
            entity_type: 'Shop',
            entity_id: shop._id,
            metadata: { note: 'Please re-upload a clearer image of the Business License. Current copy is slightly blurry.' },
            createdAt: infoDate
          });
        }
      }
    }

    console.log('✅ Seeded 5 pending shops successfully.');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedPendingShops();
