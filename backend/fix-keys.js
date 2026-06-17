const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/shipper/ShipperOrderDetail.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace snake_case to camelCase
content = content.replace(/order\.order_code/g, 'order.orderCode');
content = content.replace(/order\.customer_id\?\.full_name/g, 'order.customerId?.fullName');
content = content.replace(/order\.customer_id\?\.phone/g, 'order.customerId?.phone');
content = content.replace(/order\.shop_id\?\.name/g, 'order.shopId?.name');
content = content.replace(/order\.shop_id\?\.address/g, 'order.shopId?.address');

content = content.replace(/shippingAddress\?\.recipient_name/g, 'shippingAddress?.recipientName');
content = content.replace(/shippingAddress\?\.recipient_phone/g, 'shippingAddress?.recipientPhone');
content = content.replace(/shippingAddress\?\.street_address/g, 'shippingAddress?.streetAddress');

content = content.replace(/order\.subtotal_amount/g, 'order.subtotalAmount');
content = content.replace(/order\.shipping_fee/g, 'order.shippingFee');
content = content.replace(/order\.coupon_discount/g, 'order.couponDiscount');
content = content.replace(/order\.coin_discount/g, 'order.coinDiscount');
content = content.replace(/order\.total_final/g, 'order.totalFinal');
content = content.replace(/order\.payment_status/g, 'order.paymentStatus');

content = content.replace(/item\.price_at_buy/g, 'item.priceAtBuy');
content = content.replace(/historyRecord\.image_url/g, 'historyRecord.imageUrl');

fs.writeFileSync(filePath, content);
console.log('Fixed cases in ShipperOrderDetail.jsx');
