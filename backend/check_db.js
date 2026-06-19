const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const ShippingPartner = require('./src/models/ShippingPartner');
const ShipperProfile = require('./src/models/ShipperProfile');

mongoose.connect('mongodb://localhost:27017/ute_shop_01').then(async () => {
  const partners = await ShippingPartner.find();
  console.log('Shipping Partners:', partners);

  const profiles = await ShipperProfile.find();
  console.log('Shipper Profiles:', profiles);

  const orders = await Order.find({ status: 'ready_to_ship' });
  console.log('Ready to ship orders:', orders.map(o => ({ id: o._id, code: o.order_code, shipping_partner_id: o.shipping_partner_id })));

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
