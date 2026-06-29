import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManagerOrdersTab = ({ searchTerm }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 10,
    status: searchParams.get('status') || 'all',
    shopId: searchParams.get('shopId') || 'all'
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (filters.page !== 1) params.set('page', filters.page);
    else params.delete('page');
    
    if (filters.status !== 'all') params.set('status', filters.status);
    else params.delete('status');
    
    if (filters.shopId !== 'all' && filters.shopId) params.set('shopId', filters.shopId);
    else params.delete('shopId');

    setSearchParams(params, { replace: true });

    fetchOrders();
  }, [filters, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        shopId: filters.shopId,
        ...(searchTerm && { search: searchTerm })
      });

      const res = await axios.get(`http://localhost:5000/api/manager/orders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setOrders(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

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
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Monitoring</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            System-wide order tracking
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-primary focus:border-primary block py-2.5 pl-3 pr-8 font-medium outline-none"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready_to_ship">Ready to Ship</option>
            <option value="shipping">Shipping</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
          
          {/* Shop Filter by ID (Text input) */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Filter by Shop ID"
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 w-40 font-medium outline-none"
              value={filters.shopId === 'all' ? '' : filters.shopId}
              onChange={(e) => setFilters(prev => ({ ...prev, shopId: e.target.value || 'all', page: 1 }))}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm text-slate-600 border-collapse table-fixed">
          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-widest">
            <tr>
              <th className="w-[20%] px-6 py-4">Order Code</th>
              <th className="w-[15%] px-6 py-4">Shop</th>
              <th className="w-[20%] px-6 py-4">Customer</th>
              <th className="w-[15%] px-6 py-4">Total</th>
              <th className="w-[15%] px-6 py-4">Status</th>
              <th className="w-[15%] px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-2 block">receipt_long</span>
                  <p className="text-slate-500 font-medium">No orders found.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => navigate(`/manager/order_detail/${order.id}`)}
                  className="bg-white border-b border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-black text-slate-900">{order.orderCode}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{order.shopName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{order.shopId}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{order.customerName}</td>
                  <td className="px-6 py-4 font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalFinal)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button 
            disabled={filters.page === 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          
          <span className="text-xs font-bold text-slate-500 px-2">
            Page {filters.page} of {meta.pagination.totalPages}
          </span>
          
          <button 
            disabled={filters.page === meta.pagination.totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagerOrdersTab;
