require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

// Import models
const Campaign = require('../src/models/Campaign');
const CampaignTarget = require('../src/models/CampaignTarget');
const Coupon = require('../src/models/Coupon');
const CouponRedemption = require('../src/models/CouponRedemption');
const Product = require('../src/models/Product');
const Banner = require('../src/models/Banner');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');


async function seedCampaigns() {
  try {
    await connectDB();
    console.log('🔌 Connected to database for campaign seeding...');

    // 1. Clear existing campaign/coupon data
    console.log('🧹 Clearing old campaigns, campaign targets, coupons, redemptions, banners, and promotion notifications...');
    await Campaign.deleteMany({});
    await CampaignTarget.deleteMany({});
    await Coupon.deleteMany({});
    await CouponRedemption.deleteMany({});
    await Banner.deleteMany({});
    await Notification.deleteMany({ type: 'promotion' });


    // Fetch some approved products to link to campaigns
    const products = await Product.find({ approval_status: 'approved' }).limit(6);
    console.log(`📦 Found ${products.length} approved products to associate with campaigns`);

    const now = new Date();

    // 2. Create Campaigns
    console.log('🎟️ Creating new campaigns...');
    
    // Campaign 1: Summer Fashion Week 2026 (Active)
    const summerCampaign = await Campaign.create({
      name: 'Summer Fashion Week 2026',
      slug: 'summer-2026',
      description: 'Grab the hottest deals of summer 2026 with our active and stylish fashion collection.',
      banner_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200',
      start_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
      end_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),  // Ends in 30 days
      status: 'active',
      type: 'discount',
      value: 20
    });

    // Campaign 2: Black Friday Sale 2026 (Active)
    const blackFridayCampaign = await Campaign.create({
      name: 'Black Friday Super Sale 2026',
      slug: 'black-friday-2026',
      description: 'The biggest shopping event of the year! Enjoy ground-breaking discounts up to 50% on top brands.',
      banner_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200',
      start_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
      end_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),    // Ends in 7 days
      status: 'active',
      type: 'discount',
      value: 50
    });

    // Campaign 3: New Year Festival 2027 (Upcoming / Inactive)
    const newYearCampaign = await Campaign.create({
      name: 'New Year Festival 2027',
      slug: 'new-year-2027',
      description: 'Celebrate a brilliant new year with thousands of exciting discounts starting next month.',
      banner_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200',
      start_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Starts in 30 days
      end_at: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),  // Ends in 45 days
      status: 'inactive',
      type: 'discount',
      value: 30
    });

    // 3. Associate products with campaigns using CampaignTarget
    console.log('🔗 Creating campaign targets...');
    if (products.length > 0) {
      // Link first 3 products to Summer Campaign
      for (let i = 0; i < Math.min(3, products.length); i++) {
        await CampaignTarget.create({
          campaign_id: summerCampaign._id,
          product_id: products[i]._id,
          target_type: 'featured'
        });
      }
      
      // Link next 3 products to Black Friday Campaign
      for (let i = 3; i < Math.min(6, products.length); i++) {
        await CampaignTarget.create({
          campaign_id: blackFridayCampaign._id,
          product_id: products[i]._id,
          target_type: 'discount'
        });
      }
    }

    // 4. Create Coupons
    console.log('💳 Seeding coupons...');
    
    // Coupon A: FASHION20 (Linked to Summer Campaign)
    await Coupon.create({
      campaign_id: summerCampaign._id,
      code: 'FASHION20',
      type: 'percent',
      value: 20,
      max_discount: 150000,
      min_order_total: 500000,
      start_at: summerCampaign.start_at,
      end_at: summerCampaign.end_at,
      usage_limit: 1000,
      used_count: 5,
      status: 'active'
    });

    // Coupon B: BLACKFRIDAY50 (Linked to Black Friday Campaign)
    await Coupon.create({
      campaign_id: blackFridayCampaign._id,
      code: 'BLACKFRIDAY50',
      type: 'percent',
      value: 50,
      max_discount: 300000,
      min_order_total: 1000000,
      start_at: blackFridayCampaign.start_at,
      end_at: blackFridayCampaign.end_at,
      usage_limit: 500,
      used_count: 12,
      status: 'active'
    });

    // Coupon C: WELCOME50 (General site-wide, fixed amount)
    await Coupon.create({
      code: 'WELCOME50',
      type: 'fixed_amount',
      value: 50000,
      max_discount: 50000,
      min_order_total: 100000,
      start_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
      end_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),  // Valid for 1 year
      usage_limit: 10000,
      used_count: 154,
      status: 'active'
    });

    // Coupon D: UTESHOP200K (General site-wide, fixed amount)
    await Coupon.create({
      code: 'UTESHOP200K',
      type: 'fixed_amount',
      value: 200000,
      max_discount: 200000,
      min_order_total: 200000,
      start_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      end_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      usage_limit: 5000,
      used_count: 82,
      status: 'active'
    });

    // Coupon E: FREESHIP (Shipping assistance, fixed amount)
    await Coupon.create({
      code: 'FREESHIP',
      type: 'fixed_amount',
      value: 35000,
      max_discount: 35000,
      min_order_total: 150000,
      start_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      end_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      usage_limit: 100000,
      used_count: 2420,
      status: 'active'
    });

    // Coupon F: EXP10 (Expired coupon)
    await Coupon.create({
      code: 'EXP10',
      type: 'percent',
      value: 10,
      max_discount: 50000,
      min_order_total: 100000,
      start_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
      usage_limit: 100,
      used_count: 100,
      status: 'active' // Even though status is active, end_at date has passed
    });

    // 5. Create Banners
    console.log('🖼️ Seeding banners...');
    await Banner.create([
      {
        title: 'Summer Fashion Week 2026',
        image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200',
        link: '/promotions',
        sort_order: 1,
        is_active: true
      },
      {
        title: 'Black Friday Super Sale 2026',
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200',
        link: '/promotions',
        sort_order: 2,
        is_active: true
      },
      {
        title: 'The Precision Autumn Semester Edit',
        image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1280',
        link: '/search',
        sort_order: 3,
        is_active: true
      }
    ]);

    // 6. Pre-seed notifications for all users
    console.log('🔔 Pre-seeding active promotion notifications for all users...');
    const users = await User.find({});
    console.log(`👤 Found ${users.length} users in the database`);
    const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    for (const user of users) {
      // Summer Campaign Notification
      await Notification.create({
        user_id: user._id,
        title: `${summerCampaign.name} is LIVE!`,
        content: summerCampaign.description,
        detailContent: `Great news! Our promotional campaign "${summerCampaign.name}" is now active.\n\nEnjoy savings up to ${summerCampaign.value}% on selected products.\n\nVisit our Promotions page to copy your coupons and shop now!`,
        category: 'Promotions',
        type: 'promotion',
        date: dateStr,
        link: `/promotions#${summerCampaign.slug}`
      });

      // Black Friday Campaign Notification
      await Notification.create({
        user_id: user._id,
        title: `${blackFridayCampaign.name} is LIVE!`,
        content: blackFridayCampaign.description,
        detailContent: `Great news! Our promotional campaign "${blackFridayCampaign.name}" is now active.\n\nEnjoy savings up to ${blackFridayCampaign.value}% on selected products.\n\nVisit our Promotions page to copy your coupons and shop now!`,
        category: 'Promotions',
        type: 'promotion',
        date: dateStr,
        link: `/promotions#${blackFridayCampaign.slug}`
      });
    }
    console.log(`✅ Seeded ${users.length * 2} promotion notifications!`);

    console.log('✅ Campaigns, coupons and banners seeded successfully!');
    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error seeding campaigns/coupons:', error);
    process.exit(1);
  }
}

seedCampaigns();
