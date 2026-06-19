import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManagerOrderDetail = ({ orderId }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/manager/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setOrder(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrderDetail();
  }, [orderId]);

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      preparing: { color: 'bg-orange-100 text-orange-800', label: 'Preparing' },
      ready_to_ship: { color: 'bg-indigo-100 text-indigo-800', label: 'Ready to Ship' },
      shipping: { color: 'bg-purple-100 text-purple-800', label: 'Shipping' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      canceled: { color: 'bg-red-100 text-red-800', label: 'Canceled' },
      disputed: { color: 'bg-orange-100 text-orange-800', label: 'Disputed' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
      cancel_pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Cancel Pending' }
    };
    const s = statuses[status] || { color: 'bg-slate-100 text-slate-800', label: status };
    return (
      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${s.color}`}>
        {s.label}
      </span>
    );
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm animate-pulse min-h-[500px] flex justify-center items-center">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-center items-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
        <h3 className="text-xl font-bold text-slate-800">Order Not Found</h3>
        <button 
          onClick={() => navigate('/manager/orders')}
          className="mt-6 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* ── HEADER ── */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/manager/orders')}
            className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Order {order.orderCode}
              {getStatusBadge(order.status)}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* ── INFO GRIDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Customer & Address */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">person</span>
            <h3 className="text-lg font-bold text-slate-900">Customer Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{order.customerId?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {order.customerId?.phone || 'N/A'} <br/>
                {order.customerId?.email || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shipping Address</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {order.shippingAddressId ? `${order.shippingAddressId.street}, ${order.shippingAddressId.ward}, ${order.shippingAddressId.district}, ${order.shippingAddressId.city}` : 'No Address Provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Shop Details */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-orange-500 text-2xl">storefront</span>
            <h3 className="text-lg font-bold text-slate-900">Shop Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Name</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{order.shopId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Contact</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {order.shopId?.phone || 'N/A'} <br/>
                {order.shopId?.email || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop ID</p>
              <p className="text-[10px] font-mono bg-slate-100 p-2 rounded mt-1 overflow-x-auto text-slate-700">
                {order.shopId?._id || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery & Payment */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-green-500 text-2xl">local_shipping</span>
            <h3 className="text-lg font-bold text-slate-900">Delivery & Payment</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shipping Partner</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{order.shippingPartnerId?.name || 'Waiting for assignment'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Shipper</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {order.shipperId ? `${order.shipperId.fullName} (${order.shipperId.phone})` : 'Not assigned yet'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment Method</p>
              <p className="text-sm font-bold text-slate-900 mt-1 uppercase">
                {order.paymentOrderId?.paymentMethod || 'N/A'} 
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${order.paymentStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── ITEMS & TOTALS ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-500 text-2xl">inventory_2</span>
          <h3 className="text-lg font-bold text-slate-900">Order Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold tracking-widest">
              <tr>
                <th className="px-8 py-4">Product</th>
                <th className="px-8 py-4">Price</th>
                <th className="px-8 py-4 text-center">Qty</th>
                <th className="px-8 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items && order.items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                        {item.productId?.mediaUrl ? (
                          <img src={item.productId.mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300 w-full h-full flex items-center justify-center">image</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-2">{item.productId?.name || 'Unknown Product'}</p>
                        {item.variantId && item.variantId.attributes && (
                          <p className="text-xs text-slate-500 mt-1">
                            {Object.entries(item.variantId.attributes).map(([k,v]) => `${k}: ${v}`).join(' | ')}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">SKU: {item.variantId?.sku || item.productId?.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-medium">{formatCurrency(item.price)}</td>
                  <td className="px-8 py-6 text-center font-bold">{item.quantity}</td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Cost Summary */}
        <div className="bg-slate-50 p-8 flex flex-col items-end gap-3 border-t border-slate-100">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Shipping Fee</span>
              <span>{formatCurrency(order.shippingFee)}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(order.couponDiscount)}</span>
              </div>
            )}
            {order.coinDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Coin Discount</span>
                <span>-{formatCurrency(order.coinDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Platform Fee</span>
              <span>{formatCurrency(order.platformFeeAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium">
              <span>Gateway Fee</span>
              <span>{formatCurrency(order.gatewayFeeAmount || 0)}</span>
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Final</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(order.totalFinal)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ManagerOrderDetail;
