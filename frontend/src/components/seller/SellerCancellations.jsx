import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';

const SellerCancellations = ({ setActiveTab }) => {
    const { user } = useSelector(state => state.auth);
    const [cancellations, setCancellations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ new: 0, system: 0, seller: 0, refund: 0 });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCancellations();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [activeFilter, search]);

    const fetchCancellations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/seller/cancellations`, {
                params: {
                    status: activeFilter,
                    search: search
                },
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (res.data.success) {
                setCancellations(res.data.data);
                
                // Calculate simple stats based on loaded data
                const pendingCount = res.data.data.filter(c => c.status === 'pending').length;
                const totalRefund = res.data.data.reduce((acc, c) => acc + (c.order_id?.total_final || 0), 0);
                
                setStats(prev => ({
                    ...prev,
                    new: pendingCount,
                    refund: totalRefund
                }));
            }
        } catch (error) {
            toast.error('Failed to load cancellations');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        if (status === 'rejected') {
            const reason = window.prompt("Please enter a reason for rejecting this cancellation:");
            if (reason === null) return; // User cancelled prompt
        } else {
            const confirm = window.confirm("Are you sure you want to approve this cancellation? This will cancel the order.");
            if (!confirm) return;
        }

        try {
            const res = await axios.put(`http://localhost:5000/api/seller/cancellations/${id}/status`, { status }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCancellations(); // Reload the list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#0052CC] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cancellations</h1>
                    
                    <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-80 group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#0052CC]">search</span>
                        <input 
                            type="text" 
                            placeholder="Search cancellations..." 
                            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 placeholder:font-medium ml-2 outline-none" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    
                    <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-200 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                            {user?.fullName?.charAt(0).toUpperCase() || 'J'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
                        <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    </div>
                </div>
            </header>

            <div className="p-10 max-w-[1440px] mx-auto w-full space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-[#0052CC]/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC]">
                                <span className="material-symbols-outlined">pending_actions</span>
                            </div>
                            {stats.new > 0 && <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">NEW</span>}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">To Respond</span>
                        <div className="text-2xl font-black mt-1">{stats.new} Requests</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <span className="material-symbols-outlined">system_update_alt</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">System Canceled</span>
                        <div className="text-2xl font-black mt-1">0 Orders</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-400/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-slate-500">
                                <span className="material-symbols-outlined">person_cancel</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">Seller Canceled</span>
                        <div className="text-2xl font-black mt-1">0 Orders</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-[#0052CC]/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC]">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">Total Refund</span>
                        <div className="text-2xl font-black mt-1">{formatCurrency(stats.refund)}</div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-slate-200 flex px-8 overflow-x-auto bg-slate-50/50">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-6 py-6 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                                    activeFilter === tab 
                                    ? 'text-[#0052CC] border-b-[3px] border-[#0052CC]' 
                                    : 'text-slate-500 hover:text-[#0052CC]'
                                }`}
                            >
                                {tab === 'Pending' ? `Pending (${stats.new})` : tab === 'All' ? 'All Requests' : tab}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left border-b border-slate-200 bg-slate-50/30">
                                    <th className="pl-8 pr-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Order Information</th>
                                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reason</th>
                                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Refund Amount</th>
                                    <th className="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="pl-4 pr-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-500 font-bold">Loading...</td>
                                    </tr>
                                ) : cancellations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-500 font-bold">No cancellations found.</td>
                                    </tr>
                                ) : (
                                    cancellations.map((cancel) => {
                                        const firstItem = cancel.items && cancel.items.length > 0 ? cancel.items[0] : null;
                                        const productName = firstItem?.product_id?.name || 'Unknown Product';
                                        // Normally would fetch image from firstItem.product_id.media, but we mock it here if absent
                                        const productImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200";
                                        
                                        return (
                                            <tr key={cancel._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="pl-8 pr-4 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                            <img src={productImage} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-black text-[#0052CC] hover:underline cursor-pointer">{cancel.order_id?.order_code || '#UNKNOWN'}</span>
                                                            <span className="text-sm font-bold truncate max-w-[200px]">{productName}</span>
                                                            <span className="text-[10px] font-bold text-slate-500">Qty: {firstItem?.quantity || 1}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black">{cancel.user_id?.full_name || 'Guest'}</span>
                                                        <span className="text-[10px] font-bold text-slate-500">{cancel.user_id?.email || ''}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-6">
                                                    <div className="flex flex-col gap-1 max-w-[250px]">
                                                        <span className="text-sm font-bold text-slate-900">{cancel.reason}</span>
                                                        <span className="text-[10px] font-medium text-slate-500 italic">"Requested on {new Date(cancel.createdAt).toLocaleDateString()}"</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-6 text-right">
                                                    <span className="text-sm font-black">{formatCurrency(cancel.order_id?.total_final || 0)}</span>
                                                </td>
                                                <td className="px-4 py-6">
                                                    {cancel.status === 'pending' && (
                                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">Pending Review</span>
                                                    )}
                                                    {cancel.status === 'approved' && (
                                                        <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">Approved</span>
                                                    )}
                                                    {cancel.status === 'rejected' && (
                                                        <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/20">Rejected</span>
                                                    )}
                                                </td>
                                                <td className="pl-4 pr-8 py-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {cancel.status === 'pending' ? (
                                                            <>
                                                                <button onClick={() => handleUpdateStatus(cancel._id, 'approved')} className="p-2.5 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm" title="Approve">
                                                                    <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                                                                </button>
                                                                <button onClick={() => handleUpdateStatus(cancel._id, 'rejected')} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Reject">
                                                                    <span className="material-symbols-outlined text-[18px] font-bold">close</span>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="text-[10px] font-bold text-slate-500 mr-2">Processed</div>
                                                        )}
                                                        <button className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white transition-all shadow-sm" title="View Detail">
                                                            <span className="material-symbols-outlined text-[18px] font-bold">visibility</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerCancellations;
