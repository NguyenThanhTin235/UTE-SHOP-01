const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const ShippingPartner = require('./src/models/ShippingPartner');

mongoose.connect('mongodb://localhost:27017/uteshop_db').then(async () => {
  let defaultPartner = await ShippingPartner.findOne({ is_active: true });
  if (!defaultPartner) {
      defaultPartner = await ShippingPartner.create({
          name: 'SPX Express',
          code: 'SPX',
          shipping_fee: 5000,
          is_active: true
      });
  }

  const result = await Order.updateMany(
    { shipping_partner_id: { $exists: false } },
    { $set: { shipping_partner_id: defaultPartner._id } }
  );
  
  console.log(`Updated ${result.modifiedCount} orders without shipping_partner_id.`);

  const result2 = await Order.updateMany(
    { shipping_partner_id: null },
    { $set: { shipping_partner_id: defaultPartner._id } }
  );

  console.log(`Updated ${result2.modifiedCount} orders with null shipping_partner_id.`);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
