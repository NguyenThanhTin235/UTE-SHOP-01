import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';

const SellerOrders = ({ onViewDetails }) => {
    const { user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState({
        'All Orders': 0,
        'Pending': 0,
        'To Process': 0,
        'Shipping': 0,
        'Completed': 0,
        'Return/Refund': 0
    });
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Orders');
    const [isLoading, setIsLoading] = useState(false);

    // Sorting and Filtering states
    const [sortBy, setSortBy] = useState('newest');
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const tabs = ['All Orders', 'Pending', 'To Process', 'Shipping', 'Completed', 'Return/Refund'];

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/seller/orders`, {
                params: {
                    page: meta.page,
                    limit: meta.limit,
                    search,
                    status: statusFilter,
                    sortBy
                },
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (res.data.success) {
                setOrders(res.data.data);
                setMeta(res.data.meta);
                setSummary(res.data.summary);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchOrders();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [meta.page, search, statusFilter, sortBy]);

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to change this order status to ${newStatus}?`)) return;
        try {
            const res = await axios.put(`http://localhost:5000/api/seller/orders/${id}/status`, { status: newStatus }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (res.data.success) {
                toast.success('Order status updated successfully');
                fetchOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatPrice = (price) => {
        return price.toLocaleString('vi-VN') + ' ₫';
    };

    const renderActionButtons = (order) => {
        if (order.status === 'pending') {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleStatusUpdate(order._id, 'canceled')} className="p-2.5 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/5 transition-all group relative" title="Cancel Order">
                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                    </button>
                    <button onClick={() => handleStatusUpdate(order._id, 'confirmed')} className="p-2.5 bg-[#004ac6] text-white rounded-xl shadow-lg shadow-[#004ac6]/20 hover:scale-110 active:scale-95 transition-all group relative" title="Confirm Order">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </button>
                </div>
            );
        }
        if (order.status === 'confirmed') {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleStatusUpdate(order._id, 'canceled')} className="p-2.5 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/5 transition-all group relative" title="Cancel Order">
                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                    </button>
                    <button onClick={() => handleStatusUpdate(order._id, 'shipped')} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-[#004ac6] hover:text-white transition-all group relative" title="Prepare Goods & Ship">
                        <span className="material-symbols-outlined text-[20px]">package_2</span>
                    </button>
                    <button className="p-2.5 border border-[#004ac6]/20 text-[#004ac6] rounded-xl hover:bg-[#004ac6]/5 transition-all group relative" title="Print Waybill">
                        <span className="material-symbols-outlined text-[20px]">print</span>
                    </button>
                </div>
            );
        }
        if (order.status === 'shipped') {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleStatusUpdate(order._id, 'delivered')} className="p-2.5 border border-[#004ac6]/20 text-[#004ac6] rounded-xl hover:bg-[#004ac6]/5 transition-all group relative" title="Mark Delivered">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                    </button>
                </div>
            );
        }
        return null;
    };

    const renderLogisticsStatus = (order) => {
        if (order.status === 'pending') {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Pending Confirm</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">— Waiting for seller —</span>
                </div>
            );
        }
        if (order.status === 'confirmed') {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-100">To Process</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                        <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                        Preparing Goods
                    </div>
                </div>
            );
        }
        if (order.status === 'shipped') {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#004ac6]">
                        <span className="px-2.5 py-1 bg-[#004ac6]/10 text-[#004ac6] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#004ac6]/10 animate-pulse">In Transit</span>
                    </div>
                    <div className="flex flex-col text-[10px] font-bold text-slate-600">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                            Shipping Partner
                        </span>
                    </div>
                </div>
            );
        }
        if (order.status === 'delivered') {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">Delivered</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Successfully received</span>
                </div>
            );
        }
        if (order.status === 'canceled') {
            return (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600">
                        <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">Canceled</span>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{order.status}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#004ac6] text-2xl">shopping_cart</span>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order Management</h1>
                    
                    <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-80 group focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all border border-slate-200/60">
                        <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#004ac6]">search</span>
                        <input 
                            type="text" 
                            placeholder="Search orders, customers..." 
                            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 placeholder:font-medium ml-2 outline-none" 
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    
                    <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                            {user?.fullName?.charAt(0).toUpperCase() || 'J'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
                        <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    </div>
                </div>
            </header>

            <div className="p-10 max-w-[1440px] mx-auto w-full space-y-6">
            {/* Status Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 flex px-8 overflow-x-auto bg-slate-50/50">
                    {tabs.map(tab => {
                        const count = summary[tab] || 0;
                        const isActive = statusFilter === tab;
                        return (
                            <button 
                                key={tab}
                                onClick={() => { setStatusFilter(tab); setMeta({ ...meta, page: 1 }); }}
                                className={`px-6 py-6 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${isActive ? 'text-[#004ac6] border-b-[3px] border-[#004ac6]' : 'text-slate-500 hover:text-[#004ac6]'}`}
                            >
                                {tab} {tab !== 'All Orders' && `(${count})`}
                            </button>
                        );
                    })}
                </div>

                {/* Search & Filter Bar */}
                <div className="p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="relative w-full md:w-[500px] group">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#004ac6] transition-colors">search</span>
                        <input 
                            type="text" 
                            placeholder="Search by Order ID, Phone, or Customer Name..." 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#004ac6]/20 transition-all placeholder:text-slate-400"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setMeta({ ...meta, page: 1 }); }}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowSortDropdown(!showSortDropdown)} 
                                className={`flex items-center gap-3 px-6 py-3.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                    sortBy !== 'newest'
                                    ? 'bg-[#004ac6]/5 border-[#004ac6]/30 text-[#004ac6]' 
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                {sortBy === 'newest' && 'Filter'}
                                {sortBy === 'oldest' && 'Ngày xa nhất'}
                                {sortBy === 'priceAsc' && 'Giá tăng dần'}
                                {sortBy === 'priceDesc' && 'Giá giảm dần'}
                                <span className="material-symbols-outlined text-slate-400 text-sm ml-1">expand_more</span>
                            </button>
                            {showSortDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                        <button 
                                            onClick={() => { setSortBy('newest'); setShowSortDropdown(false); setMeta(prev => ({...prev, page: 1})); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'newest' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Lọc theo ngày gần nhất
                                        </button>
                                        <button 
                                            onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); setMeta(prev => ({...prev, page: 1})); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'oldest' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Lọc theo ngày xa nhất
                                        </button>
                                        <button 
                                            onClick={() => { setSortBy('priceAsc'); setShowSortDropdown(false); setMeta(prev => ({...prev, page: 1})); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'priceAsc' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Lọc theo giá tăng dần
                                        </button>
                                        <button 
                                            onClick={() => { setSortBy('priceDesc'); setShowSortDropdown(false); setMeta(prev => ({...prev, page: 1})); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${sortBy === 'priceDesc' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Lọc theo giá giảm dần
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="flex items-center gap-3 px-6 py-3.5 bg-[#004ac6]/5 text-[#004ac6] border border-[#004ac6]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#004ac6]/10 transition-all">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Export
                        </button>
                    </div>
                </div>

                {/* Orders Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Order Details</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Product Information</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Payment</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Logistics Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-slate-500 font-bold">Loading orders...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-slate-500 font-bold">No orders found.</td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-8 py-6 align-top">
                                            <div className="flex flex-col gap-1">
                                                <span onClick={() => onViewDetails && onViewDetails(order._id)} className="font-mono text-xs font-black text-[#004ac6] hover:underline cursor-pointer">{order.order_code}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-slate-900">{order.customer_id?.full_name || 'Unknown User'}</span>
                                                    <span className="size-1 bg-slate-300 rounded-full"></span>
                                                    <span className="text-[11px] font-bold text-slate-600">{order.customer_id?.phone || 'No phone'}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400">{formatDate(order.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 align-top">
                                            <div className="flex flex-col gap-4">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4">
                                                        <div className="size-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-50 border border-slate-200 shadow-sm">
                                                            <img src={item.product_id?.media_url || 'https://placehold.co/100x100?text=No+Image'} className="w-full h-full object-cover" alt="product" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-900 line-clamp-1">{item.product_id?.name || 'Unknown Product'}</span>
                                                            <span className="text-[10px] font-bold text-slate-500">Qty: {item.quantity < 10 ? `0${item.quantity}` : item.quantity} {item.variant_id?.attributes ? `• ${Object.values(item.variant_id.attributes).join(', ')}` : ''}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right align-top">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-[#004ac6]">{formatPrice(order.total_final)}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{order.payment_order_id?.payment_method || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 align-top">
                                            {renderLogisticsStatus(order)}
                                        </td>
                                        <td className="px-8 py-6 align-top">
                                            {renderActionButtons(order)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 pr-40 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-4">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                            Showing <span className="text-[#004ac6] font-black">{(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-slate-900 font-black">{meta.total}</span> orders
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={meta.page === 1}
                            onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                            className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#004ac6] disabled:opacity-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        
                        {[...Array(meta.totalPages)].map((_, i) => (
                            <button 
                                key={i}
                                onClick={() => setMeta({ ...meta, page: i + 1 })}
                                className={`size-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${meta.page === i + 1 ? 'bg-[#004ac6] text-white shadow-lg shadow-[#004ac6]/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button 
                            disabled={meta.page === meta.totalPages}
                            onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                            className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#004ac6] disabled:opacity-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Footer Spacing */}
            <div className="h-24"></div>
            </div>
        </div>
    );
};

export default SellerOrders;
