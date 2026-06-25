const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const PaymentOrder = require('../../models/PaymentOrder');
const Payment = require('../../models/Payment');
const Product = require('../../models/Product');
const ProductVariant = require('../../models/ProductVariant');
const ProductMedia = require('../../models/ProductMedia');
const Shop = require('../../models/Shop');
const User = require('../../models/User');
const Address = require('../../models/Address');
const Shipment = require('../../models/Shipment');
const SellerWallet = require('../../models/SellerWallet');
const SellerWalletTransaction = require('../../models/SellerWalletTransaction');

const getOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const shop = await Shop.findOne({ owner_user_id: userId });
        if (!shop) {
            return res.status(404).json({ success: false, code: 404, message: 'Shop not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, status, minPrice, maxPrice, startDate, endDate, sortBy } = req.query;
        let query = { shop_id: shop._id };

        if (status && status !== 'All Orders') {
            if (status === 'Pending') query.status = 'pending';
            else if (status === 'To Process') query.status = 'confirmed';
            else if (status === 'Ready to Ship') query.status = 'ready_to_ship';
            else if (status === 'Shipping') query.status = 'shipping';
            else if (status === 'Completed') query.status = 'completed';
            else if (status === 'Return/Refund') query.status = { $in: ['disputed', 'refunded'] };
            else if (status === 'Canceled') query.status = 'canceled';
        }

        if (search) {
            const matchedCustomers = await User.find({
                $or: [
                    { full_name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const customerIds = matchedCustomers.map(c => c._id);

            query.$or = [
                { order_code: { $regex: search, $options: 'i' } },
                { customer_id: { $in: customerIds } }
            ];
        }

        if (minPrice || maxPrice) {
            query.total_final = {};
            if (minPrice) query.total_final.$gte = Number(minPrice);
            if (maxPrice) query.total_final.$lte = Number(maxPrice);
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === 'oldest') sortOption = { createdAt: 1 };
        else if (sortBy === 'priceAsc') sortOption = { total_final: 1 };
        else if (sortBy === 'priceDesc') sortOption = { total_final: -1 };

        const orders = await Order.find(query)
            .populate('customer_id', 'full_name phone email')
            .populate('payment_order_id', 'payment_method payment_status transaction_id')
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        const total = await Order.countDocuments(query);

        // Map statuses for summary counts
        const allStatuses = await Order.aggregate([
            { $match: { shop_id: shop._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const summary = {
            'All Orders': 0,
            'Pending': 0,
            'To Process': 0,
            'Ready to Ship': 0,
            'Shipping': 0,
            'Completed': 0,
            'Return/Refund': 0
        };

        allStatuses.forEach(s => {
            summary['All Orders'] += s.count;
            if (s._id === 'pending') summary['Pending'] += s.count;
            else if (s._id === 'confirmed') summary['To Process'] += s.count;
            else if (s._id === 'ready_to_ship') summary['Ready to Ship'] += s.count;
            else if (s._id === 'shipping') summary['Shipping'] += s.count;
            else if (s._id === 'completed') summary['Completed'] += s.count;
            else if (['disputed', 'refunded'].includes(s._id)) summary['Return/Refund'] += s.count;
        });

        // Fetch order items
        const orderIds = orders.map(o => o._id);
        const orderItems = await OrderItem.find({ order_id: { $in: orderIds } })
            .populate('product_id', 'name slug sku')
            .populate('variant_id', 'attributes sku');

        const productIds = orderItems.map(oi => oi.product_id ? oi.product_id._id : null).filter(Boolean);
        const medias = await ProductMedia.find({ product_id: { $in: productIds } });

        const ordersWithItems = orders.map(order => {
            const items = orderItems.filter(oi => oi.order_id.toString() === order._id.toString());

            const itemsWithMedia = items.map(item => {
                const itemObj = item.toObject();
                if (itemObj.product_id) {
                    const productMedia = medias.find(m => m.product_id.toString() === itemObj.product_id._id.toString());
                    itemObj.product_id.media_url = productMedia ? productMedia.media_url : null;
                }
                return itemObj;
            });

            return {
                ...order.toObject(),
                items: itemsWithMedia
            };
        });

        res.status(200).json({
            success: true,
            code: 200,
            message: 'Orders retrieved successfully',
            data: ordersWithItems,
            summary,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const shop = await Shop.findOne({ owner_user_id: userId });
        if (!shop) {
            return res.status(404).json({ success: false, code: 404, message: 'Shop not found' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready_to_ship', 'shipping', 'canceled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, code: 400, message: 'Invalid status' });
        }

        const order = await Order.findOne({ _id: id, shop_id: shop._id });
        if (!order) {
            return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
        }

        const isAlreadyDelivered = order.status === 'completed';
        order.status = status;

        if (status === 'ready_to_ship' && !order.shipping_partner_id) {
            const ShippingPartner = require('../../models/ShippingPartner');
            let defaultPartner = await ShippingPartner.findOne({ is_active: true });
            if (!defaultPartner) {
                defaultPartner = await ShippingPartner.create({
                    name: 'SPX Express',
                    code: 'SPX',
                    shipping_fee: 5000,
                    is_active: true
                });
            }
            order.shipping_partner_id = defaultPartner._id;
        }

        if (status === 'completed' && !isAlreadyDelivered) {
            // Add funds to seller's wallet
            let wallet = await SellerWallet.findOne({ shop_id: shop._id });
            if (!wallet) {
                wallet = new SellerWallet({ shop_id: shop._id, total_balance: 0, pending_balance: 0, available_balance: 0 });
            }

            // Payout calculation: subtotal - platform_fee - gateway_fee (promotions borne by platform, shipping fee paid to carrier)
            const platformFee = order.platform_fee_amount || 0;
            const gatewayFee = order.gateway_fee_amount || 0;
            const payoutAmount = order.subtotal_amount - platformFee - gatewayFee;

            const beforeAvailable = wallet.available_balance;
            wallet.pending_balance += payoutAmount;
            wallet.total_balance += payoutAmount;
            wallet.available_balance = wallet.total_balance - wallet.pending_balance;
            await wallet.save();

            // Create seller wallet transaction
            await SellerWalletTransaction.create({
                shop_id: shop._id,
                order_id: order._id,
                type: 'earning',
                amount: payoutAmount,
                balance_before: beforeAvailable,
                balance_after: wallet.available_balance
            });

            // Sync with legacy User.wallet_balance for safety
            const shopOwner = await User.findById(shop.owner_user_id);
            if (shopOwner) {
                shopOwner.wallet_balance = (shopOwner.wallet_balance || 0) + payoutAmount;
                await shopOwner.save();
            }

            const paymentOrder = await PaymentOrder.findById(order.payment_order_id);
            if (paymentOrder && (paymentOrder.payment_method === 'cod' || order.payment_status === 'success')) {
                order.payment_status = 'success';

                // Update pending payments to success
                await Payment.updateMany(
                    { payment_order_id: order.payment_order_id, status: 'pending' },
                    { status: 'success', payment_date: new Date() }
                );

                // Update parent PaymentOrder if all sub-orders are success/delivered
                const siblingOrders = await Order.find({ payment_order_id: paymentOrder._id });
                const allSiblingSuccess = siblingOrders.every(so =>
                    so._id.toString() === order._id.toString() ? true : so.payment_status === 'success' || so.status === 'completed'
                );
                if (allSiblingSuccess) {
                    paymentOrder.payment_status = 'success';
                    await paymentOrder.save();
                }
            }
        }

        await order.save();

        // Notify Customer
        try {
            const Notification = require('../../models/Notification');
            const io = req.app.get('socketio');
            let notifTitle = 'Order Status Updated';
            let notifContent = `Your order ${order.order_code} is now ${status}.`;
            
            if (status === 'confirmed') notifContent = `Your order ${order.order_code} has been confirmed.`;
            else if (status === 'ready_to_ship') notifContent = `Your order ${order.order_code} is packed and ready to ship.`;
            else if (status === 'shipping') notifContent = `Your order ${order.order_code} is out for delivery.`;
            else if (status === 'completed') notifContent = `Your order ${order.order_code} has been marked as completed.`;
            else if (status === 'canceled') notifContent = `Your order ${order.order_code} has been cancelled by the shop.`;

            const customerNotif = await Notification.create({
                user_id: order.customer_id,
                title: notifTitle,
                content: notifContent,
                category: 'Orders',
                type: 'order',
                link: `/order-history/${order._id}`
            });

            if (io) {
                io.to(order.customer_id.toString()).emit('notification', {
                    id: customerNotif._id.toString(),
                    title: customerNotif.title,
                    content: customerNotif.content,
                    category: customerNotif.category,
                    type: customerNotif.type,
                    date: 'JUST NOW',
                    link: customerNotif.link,
                    is_read: false
                });
            }
        } catch (notifErr) {
            console.error('Customer Notification Error on Status Update:', notifErr);
        }

        res.status(200).json({
            success: true,
            code: 200,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const shop = await Shop.findOne({ owner_user_id: userId });
        if (!shop) {
            return res.status(404).json({ success: false, code: 404, message: 'Shop not found' });
        }

        const { id } = req.params;
        const order = await Order.findOne({ _id: id, shop_id: shop._id })
            .populate('customer_id', 'full_name phone email')
            .populate('payment_order_id', 'payment_method payment_status transaction_id subtotal_amount shipping_amount discount_amount final_amount');

        if (!order) {
            return res.status(404).json({ success: false, code: 404, message: 'Order not found' });
        }

        // Fetch address prioritizing default
        let address = await Address.findOne({ user_id: order.customer_id._id, is_default: true });
        if (!address) {
            address = await Address.findOne({ user_id: order.customer_id._id });
        }

        // Fetch Order Items
        const orderItems = await OrderItem.find({ order_id: order._id })
            .populate('product_id', 'name slug sku')
            .populate('variant_id', 'attributes sku');

        const productIds = orderItems.map(oi => oi.product_id ? oi.product_id._id : null).filter(Boolean);
        const medias = await ProductMedia.find({ product_id: { $in: productIds } });

        const itemsWithMedia = orderItems.map(item => {
            const itemObj = item.toObject();
            if (itemObj.product_id) {
                const productMedia = medias.find(m => m.product_id.toString() === itemObj.product_id._id.toString());
                itemObj.product_id.media_url = productMedia ? productMedia.media_url : null;
            }
            return itemObj;
        });

        // Fetch Shipment
        const shipment = await Shipment.findOne({ order_id: order._id })
            .populate('shipping_partner_id', 'name service_type');

        const orderData = {
            ...order.toObject(),
            items: itemsWithMedia,
            shipping_address: address,
            shipment: shipment
        };

        res.status(200).json({
            success: true,
            code: 200,
            message: 'Order retrieved successfully',
            data: orderData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrders,
    updateOrderStatus,
    getOrderById
};
