require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../src/models/Shop');
const Product = require('../src/models/Product');
const Violation = require('../src/models/Violation');

async function seedViolations() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uteshop_db');
    console.log('✅ Connected to MongoDB for seeding violations');

    // Clean existing pending violations
    await Violation.deleteMany({ status: 'pending' });

    // Fetch existing active shops
    let shops = await Shop.find({ status: 'active' });
    if (shops.length === 0) {
      shops = await Shop.find();
    }

    if (shops.length === 0) {
      console.log('⚠️ No shops found in database. Please run npm run seed first!');
      return;
    }

    // Assign shops
    const shop1 = shops[0];
    const shop2 = shops[1] || shops[0];
    const shop3 = shops[2] || shops[0];
    const shop4 = shops[3] || shops[0];
    const shop5 = shops[4] || shops[0];
    const shop6 = shops[5] || shops[0];

    // Fetch products
    const product1 = await Product.findOne({ shop_id: shop1._id });
    const product2 = await Product.findOne({ shop_id: shop3._id }) || product1;
    const product3 = await Product.findOne({ shop_id: shop5._id }) || product1;

    // Seed 6 diverse violations
    const violationData = [
      {
        shop_id: shop1._id,
        product_id: product1 ? product1._id : null,
        title: 'Counterfeit Product Reported',
        description: `Shop "${shop1.name}" (ID: ${shop1._id.toString().substring(0, 8)}) has been reported for selling unauthorized replicas of luxury watches. 12 user reports received in 24 hours.`,
        severity: 'high',
        status: 'pending',
        reportedByCount: 12,
        reporterInfo: 'Reported by 12 Users',
        type: 'shop_report'
      },
      {
        shop_id: shop2._id,
        title: 'Abusive Language in Chat',
        description: `Seller "${shop2.name}" (ID: ${shop2._id.toString().substring(0, 8)}) used inappropriate language during a dispute with a customer. Chat logs flag ID: MSG-2248.`,
        severity: 'medium',
        status: 'pending',
        reportedByCount: 1,
        reporterInfo: 'Automated Chat Flag',
        type: 'chat_abusive'
      },
      {
        shop_id: shop3._id,
        product_id: product2 ? product2._id : null,
        title: 'Intellectual Property Infringement',
        description: `Product "${product2 ? product2.name : 'Premium Item'}" listed by "${shop3.name}" contains copyrighted graphics and logos without explicit merchant authorization.`,
        severity: 'high',
        status: 'pending',
        reportedByCount: 4,
        reporterInfo: 'Copyright Holder Report',
        type: 'product_flag'
      },
      {
        shop_id: shop4._id,
        title: 'Prohibited Medical Claims',
        description: `Shop "${shop4.name}" has been flagged for listing non-registered dietary supplements with illegal therapeutic claims promising viral cure statistics.`,
        severity: 'high',
        status: 'pending',
        reportedByCount: 8,
        reporterInfo: 'Automated Listing Scan',
        type: 'shop_report'
      },
      {
        shop_id: shop5._id,
        product_id: product3 ? product3._id : null,
        title: 'Misleading Listing Description',
        description: `Listing details for item "${product3 ? product3.name : 'Exclusive Accessory'}" display wrong material specs, causing high customer return rates.`,
        severity: 'medium',
        status: 'pending',
        reportedByCount: 15,
        reporterInfo: 'Reported by 15 Customers',
        type: 'product_flag'
      },
      {
        shop_id: shop6._id,
        title: 'Spam Duplicate Product Listings',
        description: `Shop "${shop6.name}" uploaded more than 50 duplicate fashion listings within a 10-minute interval, breaching listing flood safety guidelines.`,
        severity: 'medium',
        status: 'pending',
        reportedByCount: 1,
        reporterInfo: 'Automated Flood Protection',
        type: 'general'
      },
      {
        shop_id: shop1._id,
        title: 'Fake Discounts During Sale',
        description: `Shop "${shop1.name}" artificially inflated prices before a flash sale to offer a fake 50% discount.`,
        severity: 'medium',
        status: 'pending',
        reportedByCount: 3,
        reporterInfo: 'Reported by 3 Customers',
        type: 'shop_report'
      },
      {
        shop_id: shop2._id,
        product_id: product1 ? product1._id : null,
        title: 'Off-Platform Transactions',
        description: `Seller "${shop2.name}" requested customers to transfer money directly to a personal bank account via WhatsApp to avoid platform fees.`,
        severity: 'high',
        status: 'pending',
        reportedByCount: 2,
        reporterInfo: 'System Chat Scanner',
        type: 'general'
      },
      {
        shop_id: shop3._id,
        title: 'Poor Packaging Quality',
        description: `Received multiple complaints about items from "${shop3.name}" arriving broken due to insufficient bubble wrap and protective packaging.`,
        severity: 'medium',
        status: 'pending',
        reportedByCount: 5,
        reporterInfo: 'Reported by 5 Customers',
        type: 'shop_report'
      }
    ];

    for (const v of violationData) {
      await Violation.create(v);
    }

    console.log(`✅ Seeded ${violationData.length} pending violations successfully!`);
  } catch (err) {
    console.error('Seeding violations error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedViolations();
