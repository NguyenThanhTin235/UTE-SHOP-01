const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const ProductMedia = require('../models/ProductMedia');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const CouponRedemption = require('../models/CouponRedemption');
const PaymentOrder = require('../models/PaymentOrder');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const CoinTransaction = require('../models/CoinTransaction');
const { toCamelCase } = require('../utils/formatter');

class CheckoutController {
  /**
   * Preview checkout information before placing order
   */
  async previewCheckout(req, res) {
    try {
      const userId = req.user.id;
      const { itemIds, couponCode, useCoins } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Please select at least one item to checkout'
        });
      }

      // Fetch user's cart items
      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'User cart not found'
        });
      }

      const cartItems = await CartItem.find({
        _id: { $in: itemIds },
        cart_id: cart._id
      }).populate({
        path: 'product_id',
        populate: { path: 'shop_id' }
      }).populate('variant_id');

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'No selected items found in cart'
        });
      }

      // Group products by Shop
      const shopsMap = {};
      let overallSubtotal = 0;

      for (const item of cartItems) {
        const product = item.product_id;
        if (!product) continue;

        const shop = product.shop_id || { _id: 'default', name: 'UTEShop Official Store', slug: 'uteshop' };
        const shopIdStr = shop._id.toString();

        let additionalPrice = 0;
        let variantName = 'Standard';
        let stockQuantity = 100;

        if (item.variant_id) {
          const v = item.variant_id;
          additionalPrice = v.additional_price || 0;
          stockQuantity = v.stock_quantity || 0;
          if (v.attributes) {
            variantName = Object.entries(v.attributes)
              .map(([key, val]) => `${key}: ${val}`)
              .join(' | ');
          }
        }

        const price = product.selling_price + additionalPrice;
        const itemSubtotal = price * item.quantity;
        overallSubtotal += itemSubtotal;

        // Get product media image
        const media = await ProductMedia.findOne({ product_id: product._id }).sort({ sort_order: 1 });
        const imageUrl = media ? media.media_url : 'https://via.placeholder.com/150';

        if (!shopsMap[shopIdStr]) {
          shopsMap[shopIdStr] = {
            shop: {
              id: shopIdStr,
              name: shop.name || 'UTEShop Official Store',
              slug: shop.slug || 'uteshop'
            },
            items: [],
            subtotal: 0,
            shippingFee: 35000, // Default shipping fee per shop
            couponDiscount: 0,
            coinDiscount: 0,
            totalFinal: 0
          };
        }

        shopsMap[shopIdStr].items.push({
          cartItemId: item._id.toString(),
          productId: product._id.toString(),
          name: product.name,
          slug: product.slug,
          variantId: item.variant_id ? item.variant_id._id.toString() : null,
          variantName,
          imageUrl,
          price,
          quantity: item.quantity,
          stock: stockQuantity,
          itemSubtotal
        });

        shopsMap[shopIdStr].subtotal += itemSubtotal;
      }

      const shopsArray = Object.values(shopsMap);

      // Shipping total
      const overallShipping = shopsArray.length * 35000;

      // Handle Coupon
      let couponDiscount = 0;
      let coupon = null;
      let couponError = null;

      if (couponCode) {
        const codeUpper = couponCode.trim().toUpperCase();
        coupon = await Coupon.findOne({ code: codeUpper });
        
        // Auto create UTESHOP200K if missing
        if (!coupon && codeUpper === 'UTESHOP200K') {
          coupon = await Coupon.create({
            code: 'UTESHOP200K',
            type: 'fixed_amount',
            value: 200000,
            min_order_total: 200000,
            max_discount: 200000,
            usage_limit: 999999,
            status: 'active',
            start_at: new Date('2024-01-01'),
            end_at: new Date('2030-12-31')
          });
        }

        if (coupon) {
          const now = new Date();
          // Validate status & dates
          if (coupon.status !== 'active') {
            couponError = 'Coupon is currently inactive';
          } else if (coupon.start_at && now < coupon.start_at) {
            couponError = 'Coupon promotion has not started yet';
          } else if (coupon.end_at && now > coupon.end_at) {
            couponError = 'Coupon has expired';
          } else if (coupon.used_count >= coupon.usage_limit) {
            couponError = 'Coupon usage limit has been reached';
          } else if (overallSubtotal < (coupon.min_order_total || 0)) {
            couponError = `Minimum order amount to apply this coupon is ${coupon.min_order_total.toLocaleString()}₫`;
          } else {
            // Check redemption for this user
            const isRedeemed = await CouponRedemption.findOne({ coupon_id: coupon._id, user_id: userId });
            if (isRedeemed) {
              couponError = 'You have already used this coupon';
            } else {
              // Calculate discount
              if (coupon.type === 'fixed_amount') {
                couponDiscount = coupon.value;
              } else if (coupon.type === 'percent') {
                couponDiscount = (overallSubtotal * coupon.value) / 100;
                if (coupon.max_discount) {
                  couponDiscount = Math.min(couponDiscount, coupon.max_discount);
                }
              }
              couponDiscount = Math.min(couponDiscount, overallSubtotal);
            }
          }
        } else {
          couponError = 'Coupon does not exist';
        }
      }

      // Handle Coins
      let coinDiscount = 0;
      const user = await User.findById(userId);
      const userCoins = user ? user.coin_balance : 0;

      if (useCoins && userCoins > 0) {
        // Capped at 50% of the overall subtotal (product value only) and cannot pay for shipping
        const maxCoinSpend = Math.floor(overallSubtotal * 0.5);
        const remainingToDiscount = overallSubtotal - couponDiscount;
        coinDiscount = Math.min(userCoins, maxCoinSpend, remainingToDiscount);
        coinDiscount = Math.max(0, coinDiscount);
      }

      // Distribute discounts
      let remainingCoupon = couponDiscount;
      let remainingCoin = coinDiscount;

      for (let i = 0; i < shopsArray.length; i++) {
        const s = shopsArray[i];
        if (i === shopsArray.length - 1) {
          s.couponDiscount = remainingCoupon;
          s.coinDiscount = remainingCoin;
        } else {
          const ratio = s.subtotal / overallSubtotal;
          const couponShare = Math.round(couponDiscount * ratio);
          const coinShare = Math.round(coinDiscount * ratio);

          s.couponDiscount = Math.min(couponShare, remainingCoupon);
          s.coinDiscount = Math.min(coinShare, remainingCoin);

          remainingCoupon -= s.couponDiscount;
          remainingCoin -= s.coinDiscount;
        }
        s.totalFinal = Math.max(0, s.subtotal + s.shippingFee - s.couponDiscount - s.coinDiscount);
      }

      const overallFinal = Math.max(0, overallSubtotal + overallShipping - couponDiscount - coinDiscount);

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Preview checkout information retrieved successfully',
        data: toCamelCase({
          shops: shopsArray,
          subtotalAmount: overallSubtotal,
          shippingAmount: overallShipping,
          couponDiscount,
          couponCode: couponDiscount > 0 ? coupon.code : null,
          couponError,
          coinDiscount,
          coinBalance: userCoins,
          finalAmount: overallFinal
        }),
        timestamp: Math.floor(Date.now() / 1000)
      });

    } catch (error) {
      console.error('Preview Checkout Error:', error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: 'System error during checkout preview',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  }

  /**
   * Place Order (Create PaymentOrder, split Orders, deduct stock/coins)
   */
  async placeOrder(req, res) {
    try {
      const userId = req.user.id;
      const { itemIds, addressId, couponCode, useCoins, paymentMethod } = req.body;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Please select at least one item to checkout'
        });
      }

      if (!addressId) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Please provide a shipping address'
        });
      }

      if (!paymentMethod || !['cod', 'vnpay'].includes(paymentMethod)) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Invalid payment method (only cod or vnpay are supported)'
        });
      }

      // 1. Verify address
      const address = await Address.findOne({ _id: addressId, user_id: userId });
      if (!address) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'Shipping address not found'
        });
      }

      // 2. Fetch User & Cart
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'User does not exist'
        });
      }

      const cart = await Cart.findOne({ user_id: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'Cart is empty'
        });
      }

      const cartItems = await CartItem.find({
        _id: { $in: itemIds },
        cart_id: cart._id
      }).populate('product_id').populate('variant_id');

      if (cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'Selected products to checkout not found'
        });
      }

      // 3. Stock Check & Calculations
      const shopsMap = {};
      let overallSubtotal = 0;

      for (const item of cartItems) {
        const product = item.product_id;
        if (!product) {
          return res.status(404).json({
            success: false,
            code: 404,
            message: 'Some products do not exist in the system'
          });
        }

        let additionalPrice = 0;
        if (item.variant_id) {
          const v = item.variant_id;
          if (v.stock_quantity < item.quantity) {
            return res.status(400).json({
              success: false,
              code: 400,
              message: `Product ${product.name} (${Object.entries(v.attributes).map(([k,v]) => `${k}:${v}`).join(' ')}) is out of stock.`
            });
          }
          additionalPrice = v.additional_price || 0;
        }

        const price = product.selling_price + additionalPrice;
        const itemSubtotal = price * item.quantity;
        overallSubtotal += itemSubtotal;

        const shopIdStr = product.shop_id ? product.shop_id.toString() : 'default';

        if (!shopsMap[shopIdStr]) {
          shopsMap[shopIdStr] = {
            shopId: shopIdStr,
            items: [],
            subtotal: 0,
            shippingFee: 35000,
            couponDiscount: 0,
            coinDiscount: 0,
            totalFinal: 0
          };
        }

        shopsMap[shopIdStr].items.push({
          product_id: product._id,
          variant_id: item.variant_id ? item.variant_id._id : null,
          quantity: item.quantity,
          price_at_buy: price
        });
        shopsMap[shopIdStr].subtotal += itemSubtotal;
      }

      const shopsArray = Object.values(shopsMap);
      const overallShipping = shopsArray.length * 35000;

      // Handle Coupon
      let couponDiscount = 0;
      let coupon = null;

      if (couponCode) {
        const codeUpper = couponCode.trim().toUpperCase();
        coupon = await Coupon.findOne({ code: codeUpper });

        if (!coupon && codeUpper === 'UTESHOP200K') {
          coupon = await Coupon.create({
            code: 'UTESHOP200K',
            type: 'fixed_amount',
            value: 200000,
            min_order_total: 200000,
            max_discount: 200000,
            usage_limit: 999999,
            status: 'active',
            start_at: new Date('2024-01-01'),
            end_at: new Date('2030-12-31')
          });
        }

        if (coupon) {
          const now = new Date();
          if (
            coupon.status === 'active' &&
            (!coupon.start_at || now >= coupon.start_at) &&
            (!coupon.end_at || now <= coupon.end_at) &&
            coupon.used_count < coupon.usage_limit &&
            overallSubtotal >= (coupon.min_order_total || 0)
          ) {
            const isRedeemed = await CouponRedemption.findOne({ coupon_id: coupon._id, user_id: userId });
            if (!isRedeemed) {
              if (coupon.type === 'fixed_amount') {
                couponDiscount = coupon.value;
              } else if (coupon.type === 'percent') {
                couponDiscount = (overallSubtotal * coupon.value) / 100;
                if (coupon.max_discount) {
                  couponDiscount = Math.min(couponDiscount, coupon.max_discount);
                }
              }
              couponDiscount = Math.min(couponDiscount, overallSubtotal);
            }
          }
        }
      }

      // Handle Coins
      let coinDiscount = 0;
      if (useCoins && user.coin_balance > 0) {
        const maxCoinSpend = Math.floor(overallSubtotal * 0.5);
        const remainingToDiscount = overallSubtotal - couponDiscount;
        coinDiscount = Math.min(user.coin_balance, maxCoinSpend, remainingToDiscount);
        coinDiscount = Math.max(0, coinDiscount);
      }

      // Distribute discounts
      let remainingCoupon = couponDiscount;
      let remainingCoin = coinDiscount;

      for (let i = 0; i < shopsArray.length; i++) {
        const s = shopsArray[i];
        if (i === shopsArray.length - 1) {
          s.couponDiscount = remainingCoupon;
          s.coinDiscount = remainingCoin;
        } else {
          const ratio = s.subtotal / overallSubtotal;
          const couponShare = Math.round(couponDiscount * ratio);
          const coinShare = Math.round(coinDiscount * ratio);

          s.couponDiscount = Math.min(couponShare, remainingCoupon);
          s.coinDiscount = Math.min(coinShare, remainingCoin);

          remainingCoupon -= s.couponDiscount;
          remainingCoin -= s.coinDiscount;
        }
        s.totalFinal = Math.max(0, s.subtotal + s.shippingFee - s.couponDiscount - s.coinDiscount);
      }

      const overallFinal = Math.max(0, overallSubtotal + overallShipping - couponDiscount - coinDiscount);

      // 4. Deduct variant stock
      for (const item of cartItems) {
        if (item.variant_id) {
          const v = item.variant_id;
          v.stock_quantity -= item.quantity;
          await v.save();
        }
      }

      // 5. Deduct Coins from user & Log transaction
      if (coinDiscount > 0) {
        const balanceBefore = user.coin_balance;
        user.coin_balance -= coinDiscount;
        await user.save();

        await CoinTransaction.create({
          user_id: userId,
          amount: -coinDiscount,
          type: 'spend',
          description: `Payment for order`,
          balance_before: balanceBefore,
          balance_after: user.coin_balance
        });
      }

      // 6. If coupon used, increment coupon used count
      if (couponDiscount > 0 && coupon) {
        coupon.used_count += 1;
        await coupon.save();
      }

      // 7. Create PaymentOrder
      const paymentCode = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const paymentOrder = await PaymentOrder.create({
        payment_code: paymentCode,
        customer_id: userId,
        coupon_id: couponDiscount > 0 ? coupon._id : null,
        coin_spent_total: coinDiscount,
        subtotal_amount: overallSubtotal,
        discount_amount: couponDiscount,
        shipping_amount: overallShipping,
        final_amount: overallFinal,
        payment_method: paymentMethod,
        payment_status: 'pending'
      });

      // 8. Create Sub-Orders and OrderItems
      const createdOrders = [];
      for (const s of shopsArray) {
        const orderCode = `ORD-${Date.now()}-${s.shopId.substring(Math.max(0, s.shopId.length - 6))}-${Math.floor(Math.random() * 100)}`;
        
        // Calculate platform fee (simulated 2%)
        const platformFeeRate = 2;
        const platformFeeAmount = Math.round((s.subtotal * 2) / 100);

        // Calculate coin earned (1% of subtotal)
        const coinEarned = Math.round(s.subtotal * 0.01);

        const order = await Order.create({
          order_code: orderCode,
          payment_order_id: paymentOrder._id,
          customer_id: userId,
          shop_id: s.shopId === 'default' ? new mongoose.Types.ObjectId() : s.shopId,
          status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
          subtotal_amount: s.subtotal,
          shipping_fee: s.shippingFee,
          coupon_discount: s.couponDiscount,
          coin_discount: s.coinDiscount,
          platform_fee_rate: platformFeeRate,
          platform_fee_amount: platformFeeAmount,
          total_final: s.totalFinal,
          payment_status: 'pending',
          coin_earned: coinEarned
        });

        // Register coupon redemption if voucher used
        if (s.couponDiscount > 0 && coupon) {
          try {
            await CouponRedemption.create({
              coupon_id: coupon._id,
              user_id: userId,
              order_id: order._id
            });
          } catch (err) {
            console.error('Error logging CouponRedemption:', err);
          }
        }

        // Create order items
        for (const item of s.items) {
          await OrderItem.create({
            order_id: order._id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price_at_buy: item.price_at_buy
          });
        }

        createdOrders.push(order);
      }

      // 9. Processing payment response
      if (paymentMethod === 'cod') {
        // Clear items from cart
        await CartItem.deleteMany({ _id: { $in: itemIds } });
        
        return res.status(201).json({
          success: true,
          code: 201,
          message: 'Order placed successfully (COD)',
          data: toCamelCase({
            paymentCode,
            paymentMethod,
            paymentStatus: 'pending',
            finalAmount: overallFinal,
            redirectUrl: `/order-success?paymentCode=${paymentCode}`
          })
        });
      } else {
        // VnPay Mock URL redirection
        const mockVnPayUrl = `/vnpay-mock?paymentCode=${paymentCode}&amount=${overallFinal}`;
        
        return res.status(201).json({
          success: true,
          code: 201,
          message: 'VNPAY payment request initialized',
          data: toCamelCase({
            paymentCode,
            paymentMethod,
            paymentStatus: 'pending',
            finalAmount: overallFinal,
            redirectUrl: mockVnPayUrl
          })
        });
      }

    } catch (error) {
      console.error('Place Order Error:', error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: 'System error during order creation',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  }

  /**
   * VNPAY Mock callback receiver (handles success or cancel/failure)
   */
  async vnpayCallback(req, res) {
    try {
      const userId = req.user.id;
      const { paymentCode, status } = req.body;

      if (!paymentCode || !status) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: 'Please provide a payment code and payment status'
        });
      }

      // Fetch PaymentOrder
      const paymentOrder = await PaymentOrder.findOne({ payment_code: paymentCode, customer_id: userId });
      if (!paymentOrder) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'Payment transaction not found'
        });
      }

      if (paymentOrder.payment_status !== 'pending') {
        return res.status(400).json({
          success: false,
          code: 400,
          message: 'This transaction has already been processed'
        });
      }

      // Fetch sub-orders
      const orders = await Order.find({ payment_order_id: paymentOrder._id });

      if (status === 'success') {
        // 1. Update PaymentOrder
        paymentOrder.payment_status = 'success';
        paymentOrder.transaction_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await paymentOrder.save();

        // 2. Update sub-orders
        for (const order of orders) {
          order.payment_status = 'success';
          order.status = 'confirmed';
          await order.save();
        }

        // 3. Clear cart items that match this order
        // Fetch order items of these orders to know which product/variant to clear
        const orderItems = await OrderItem.find({ order_id: { $in: orders.map(o => o._id) } });
        const cart = await Cart.findOne({ user_id: userId });
        if (cart) {
          for (const oi of orderItems) {
            const query = { cart_id: cart._id, product_id: oi.product_id };
            if (oi.variant_id) {
              query.variant_id = oi.variant_id;
            } else {
              query.variant_id = null;
            }
            await CartItem.findOneAndDelete(query);
          }
        }

        return res.status(200).json({
          success: true,
          code: 200,
          message: 'Order payment via VNPAY completed successfully',
          data: toCamelCase({
            paymentCode,
            paymentStatus: 'success',
            transactionId: paymentOrder.transaction_id
          })
        });
      } else {
        // 1. Update PaymentOrder & sub-orders
        paymentOrder.payment_status = 'failed';
        await paymentOrder.save();

        for (const order of orders) {
          order.payment_status = 'failed';
          order.status = 'canceled';
          await order.save();
        }

        // 2. Restore stocks
        const orderItems = await OrderItem.find({ order_id: { $in: orders.map(o => o._id) } });
        for (const oi of orderItems) {
          if (oi.variant_id) {
            const v = await ProductVariant.findById(oi.variant_id);
            if (v) {
              v.stock_quantity += oi.quantity;
              await v.save();
            }
          }
        }

        // 3. Refund coins
        if (paymentOrder.coin_spent_total > 0) {
          const user = await User.findById(userId);
          if (user) {
            const balanceBefore = user.coin_balance;
            user.coin_balance += paymentOrder.coin_spent_total;
            await user.save();

            await CoinTransaction.create({
              user_id: userId,
              amount: paymentOrder.coin_spent_total,
              type: 'refund',
              description: `Refund coins from failed VNPAY transaction`,
              balance_before: balanceBefore,
              balance_after: user.coin_balance
            });
          }
        }

        // 4. Refund coupon usage count
        if (paymentOrder.coupon_id) {
          const coupon = await Coupon.findById(paymentOrder.coupon_id);
          if (coupon) {
            coupon.used_count = Math.max(0, coupon.used_count - 1);
            await coupon.save();
          }
          await CouponRedemption.deleteMany({ coupon_id: paymentOrder.coupon_id, user_id: userId });
        }

        return res.status(200).json({
          success: true,
          code: 200,
          message: 'Order payment was failed or canceled',
          data: toCamelCase({
            paymentCode,
            paymentStatus: 'failed'
          })
        });
      }

    } catch (error) {
      console.error('VNPAY Callback Error:', error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: 'System error during VNPAY callback processing',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  }

  /**
   * Get order details by paymentCode for order success page
   */
  async getOrderDetails(req, res) {
    try {
      const userId = req.user.id;
      const { paymentCode } = req.params;

      const paymentOrder = await PaymentOrder.findOne({ payment_code: paymentCode, customer_id: userId })
        .populate('coupon_id');
      if (!paymentOrder) {
        return res.status(404).json({
          success: false,
          code: 404,
          message: 'Transaction details not found'
        });
      }

      const orders = await Order.find({ payment_order_id: paymentOrder._id })
        .populate('shop_id');

      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order._id })
          .populate('product_id');
        return {
          ...order.toObject(),
          items: items.map(it => ({
            ...it.toObject(),
            product: it.product_id ? {
              name: it.product_id.name,
              slug: it.product_id.slug
            } : null
          }))
        };
      }));

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Order details retrieved successfully',
        data: toCamelCase({
          paymentOrder,
          orders: ordersWithItems
        }),
        timestamp: Math.floor(Date.now() / 1000)
      });
    } catch (error) {
      console.error('Get Order Details Error:', error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: 'System error during order details retrieval',
        timestamp: Math.floor(Date.now() / 1000)
      });
    }
  }
}

module.exports = new CheckoutController();
