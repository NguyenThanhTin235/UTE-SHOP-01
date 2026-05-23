import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNotifications } from '../../hooks/useNotifications';

const SellerWallet = () => {
    const { user } = useSelector(state => state.auth);
    const { unreadCount } = useNotifications();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('history');
    
    // Withdrawal form states
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankAccount, setBankAccount] = useState('Vietcombank (***8829)');

    const fetchWalletInfo = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/seller/wallet', {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setWallet(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch wallet information');
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/seller/wallet/transactions', {
                params: { page: meta.page, limit: meta.limit },
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setTransactions(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (error) {
            toast.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/seller/wallet/withdrawals', {
                params: { page: meta.page, limit: meta.limit },
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setWithdrawals(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (error) {
            toast.error('Failed to fetch withdrawals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletInfo();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchTransactions();
        } else {
            fetchWithdrawals();
        }
    }, [activeTab, meta.page, meta.limit]);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (!amount || amount < 100000) {
            toast.error('Minimum withdrawal amount is 100,000 ₫');
            return;
        }
        if (wallet && amount > wallet.available_balance) {
            toast.error('Insufficient balance');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/seller/wallet/withdraw', 
                { amount, bank_account: bankAccount },
                { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } }
            );
            if (res.data.success) {
                toast.success('Withdrawal requested successfully');
                setWithdrawAmount('');
                fetchWalletInfo();
                fetchTransactions();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request withdrawal');
        }
    };

    const handleExport = async () => {
        try {
            const endpoint = activeTab === 'history' 
                ? 'http://localhost:5000/api/seller/wallet/transactions/export'
                : 'http://localhost:5000/api/seller/wallet/withdrawals/export';
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', activeTab === 'history' ? 'transactions.csv' : 'withdrawals.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const formatPrice = (price) => {
        if (!price) return '0';
        return price.toLocaleString('vi-VN');
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#004ac6] text-2xl">account_balance</span>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial Management</h1>
                </div>

                <div className="flex-1 max-w-xl mx-8 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Search finance..." 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#004ac6]/20 transition-all outline-none text-slate-900"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-2"></div>

                    <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                            {user?.fullName?.charAt(0).toUpperCase() || 'J'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
                        <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <div className="p-10 max-w-[1200px] mx-auto w-full space-y-8 flex-1">
            
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Balance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#004ac6]/20 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-200 text-4xl">payments</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Total Balance</h4>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">{formatPrice(wallet?.total_balance)}</span>
                        <span className="text-sm font-black text-slate-500">₫</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="material-symbols-outlined text-sm">update</span>
                        Last updated just now
                    </div>
                </div>

                {/* Frozen Balance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-orange-500/20 text-4xl">lock_clock</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Pending (Frozen)</h4>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">{formatPrice(wallet?.pending_balance)}</span>
                        <span className="text-sm font-black text-slate-500">₫</span>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-500 font-medium leading-relaxed">Funds are locked for 7 days after order completion for dispute safety or pending withdrawal.</p>
                </div>

                {/* Available Balance */}
                <div className="bg-[#004ac6] p-8 rounded-[2.5rem] shadow-xl shadow-[#004ac6]/20 relative overflow-hidden group transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white/20 text-4xl">check_circle</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">Available for Withdrawal</h4>
                    <div className="flex items-baseline gap-1 text-white">
                        <span className="text-4xl font-black">{formatPrice(wallet?.available_balance)}</span>
                        <span className="text-sm font-black opacity-60">₫</span>
                    </div>
                    <button 
                        onClick={() => document.getElementById('withdraw-amount').focus()}
                        className="mt-6 w-full bg-white text-[#004ac6] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        Withdraw Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Withdrawal Form */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Withdraw Funds</h3>
                        <form onSubmit={handleWithdraw} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Bank Account</label>
                                <select 
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#004ac6]/20 outline-none"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                >
                                    <option value="Vietcombank (***8829)">Vietcombank (***8829)</option>
                                    <option value="Techcombank (***4412)">Techcombank (***4412)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount to Withdraw</label>
                                <div className="relative">
                                    <input 
                                        id="withdraw-amount"
                                        type="number" 
                                        placeholder="0" 
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl pl-4 pr-16 py-3 text-sm font-bold focus:ring-2 focus:ring-[#004ac6]/20 outline-none"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        min="100000"
                                    />
                                    <span className="absolute right-12 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₫</span>
                                    <button 
                                        type="button" 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#004ac6] uppercase cursor-pointer"
                                        onClick={() => setWithdrawAmount(wallet?.available_balance || '')}
                                    >
                                        All
                                    </button>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-slate-500 font-medium">Withdrawal Fee: <span className="font-bold">11,000 ₫</span></span>
                                    <span className="text-[10px] text-slate-500 font-medium">Min: 100,000 ₫</span>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-[#004ac6] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#004ac6]/20 cursor-pointer"
                            >
                                Confirm Withdrawal
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Need Help?</h4>
                            <p className="text-xs font-bold leading-relaxed mb-6 italic text-slate-300">"Withdrawals are usually processed within 24 business hours. If you encounter any issues, please contact our support team."</p>
                            <a href="#" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                                Contact Support
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </a>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[160px] opacity-5 pointer-events-none">support_agent</span>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Tabs */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => { setActiveTab('history'); setMeta({...meta, page: 1}); }}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer ${
                                activeTab === 'history' 
                                ? 'bg-white text-[#004ac6] shadow-sm border border-[#004ac6]/10' 
                                : 'text-slate-500 hover:bg-white'
                            }`}
                        >
                            Transaction History
                        </button>
                        <button 
                            onClick={() => { setActiveTab('withdrawals'); setMeta({...meta, page: 1}); }}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer ${
                                activeTab === 'withdrawals' 
                                ? 'bg-white text-[#004ac6] shadow-sm border border-[#004ac6]/10' 
                                : 'text-slate-500 hover:bg-white'
                            }`}
                        >
                            Withdrawal Status
                        </button>
                    </div>

                    {/* History Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                {activeTab === 'history' ? 'Recent Transactions' : 'Withdrawal Requests'}
                            </h3>
                            <button 
                                onClick={handleExport}
                                className="flex items-center gap-2 text-[10px] font-black text-[#004ac6] uppercase hover:bg-[#004ac6]/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">download</span>
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    {activeTab === 'history' ? (
                                        <tr className="bg-slate-50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    ) : (
                                        <tr className="bg-slate-50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Note</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-8 font-bold text-slate-500">Loading...</td></tr>
                                    ) : activeTab === 'history' ? (
                                        transactions.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-8 font-bold text-slate-500">No transactions found</td></tr>
                                        ) : transactions.map(trans => {
                                            const { date, time } = formatDate(trans.createdAt);
                                            const isPositive = trans.amount > 0;
                                            let typeIcon = 'add';
                                            let typeColor = 'text-green-600 bg-green-100';
                                            let typeName = 'Sale Credit';
                                            
                                            if (trans.type === 'withdraw') {
                                                typeIcon = 'remove';
                                                typeColor = 'text-red-600 bg-red-100';
                                                typeName = 'Withdrawal';
                                            } else if (trans.type === 'refund') {
                                                typeIcon = 'undo';
                                                typeColor = 'text-red-600 bg-red-100';
                                                typeName = 'Refund Debit';
                                            } else if (trans.type === 'fee') {
                                                typeIcon = 'remove';
                                                typeColor = 'text-orange-600 bg-orange-100';
                                                typeName = 'Fee Deduction';
                                            }

                                            return (
                                                <tr key={trans._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-bold text-slate-900">{date}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{time}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {trans.order_id ? (
                                                            <span className="text-xs font-black text-[#004ac6] hover:underline cursor-pointer">
                                                                {trans.order_id.order_code || '---'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-400">---</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${typeColor}`}>
                                                                <span className="material-symbols-outlined text-[14px]">{typeIcon}</span>
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-900">{typeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className={`px-8 py-5 text-xs font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isPositive ? '+' : ''}{formatPrice(trans.amount)} ₫
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-full">Completed</span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        withdrawals.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-8 font-bold text-slate-500">No withdrawal requests found</td></tr>
                                        ) : withdrawals.map(withdraw => {
                                            const { date, time } = formatDate(withdraw.createdAt);
                                            let statusClass = 'bg-blue-50 text-[#004ac6]';
                                            if (withdraw.status === 'approved' || withdraw.status === 'paid') statusClass = 'bg-green-50 text-[#2e7d32]';
                                            if (withdraw.status === 'rejected') statusClass = 'bg-red-50 text-[#b3261e]';

                                            return (
                                                <tr key={withdraw._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-bold text-slate-900">{date}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{time}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-black text-slate-900">
                                                        {formatPrice(withdraw.amount)} ₫
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-medium text-slate-600">{withdraw.note}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${statusClass}`}>{withdraw.status}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} transactions
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={meta.page <= 1}
                                    onClick={() => setMeta({...meta, page: meta.page - 1})}
                                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-[#004ac6] hover:border-[#004ac6]/20 transition-all disabled:opacity-30 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                                </button>
                                
                                <div className="flex items-center gap-1.5">
                                    {[...Array(meta.totalPages)].map((_, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setMeta({...meta, page: idx + 1})}
                                            className={`w-10 h-10 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                                                meta.page === idx + 1 
                                                ? 'bg-[#004ac6] text-white shadow-lg shadow-[#004ac6]/20' 
                                                : 'border border-slate-200 text-slate-500 hover:bg-white hover:text-[#004ac6]'
                                            }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>

                                <button 
                                    disabled={meta.page >= meta.totalPages}
                                    onClick={() => setMeta({...meta, page: meta.page + 1})}
                                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-[#004ac6] hover:border-[#004ac6]/20 transition-all disabled:opacity-30 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default SellerWallet;
