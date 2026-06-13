import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const SellerWallet = () => {
    const { user } = useSelector(state => state.auth);
    const { unreadCount } = useNotifications();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    
    // Pagination states
    const [transPage, setTransPage] = useState(1);
    const [transLimit, setTransLimit] = useState(5);
    const [transMeta, setTransMeta] = useState({ total: 0, totalPages: 1 });

    const [withdrawPage, setWithdrawPage] = useState(1);
    const [withdrawLimit, setWithdrawLimit] = useState(5);
    const [withdrawMeta, setWithdrawMeta] = useState({ total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);

    // Detail Modal states
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [orderDetail, setOrderDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Withdrawal form states
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankAccount, setBankAccount] = useState('Vietcombank (***8829)');

    const handleViewDetail = async (trans) => {
        setSelectedTransaction(trans);
        setDetailModalOpen(true);
        if (trans.type === 'earning' && trans.order_id) {
            setLoadingDetail(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/seller/orders/${trans.order_id._id}`, {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
                });
                if (res.data.success) {
                    setOrderDetail(res.data.data);
                }
            } catch (error) {
                toast.error('Failed to fetch order details');
            } finally {
                setLoadingDetail(false);
            }
        } else {
            setOrderDetail(null);
        }
    };

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
                params: { page: transPage, limit: transLimit },
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setTransactions(res.data.data);
                setTransMeta({ total: res.data.meta.total, totalPages: res.data.meta.totalPages });
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
                params: { page: withdrawPage, limit: withdrawLimit },
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setWithdrawals(res.data.data);
                setWithdrawMeta({ total: res.data.meta.total, totalPages: res.data.meta.totalPages });
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
        fetchTransactions();
    }, [transPage, transLimit]);

    useEffect(() => {
        fetchWithdrawals();
    }, [withdrawPage, withdrawLimit]);

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
                fetchWithdrawals();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request withdrawal');
        }
    };

    const handleExport = async (type) => {
        try {
            const endpoint = type === 'history' 
                ? 'http://localhost:5000/api/seller/wallet/transactions/export'
                : 'http://localhost:5000/api/seller/wallet/withdrawals/export';
            
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', type === 'history' ? 'transactions.csv' : 'withdrawals.csv');
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
            {/* Main Container */}
            <div className="p-10 max-w-[1200px] mx-auto w-full space-y-8 flex-1">
            
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Balance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-level-1 relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-slate-200 text-4xl">payments</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Total Balance</h4>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-on-surface">{formatPrice(wallet?.total_balance)}</span>
                        <span className="text-sm font-black text-secondary">₫</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-secondary">
                        <span className="material-symbols-outlined text-sm">update</span>
                        Last updated just now
                    </div>
                </div>

                {/* Frozen Balance */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-level-1 relative overflow-hidden group hover:border-warning/20 transition-all">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-warning/20 text-4xl">lock_clock</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Pending (Frozen)</h4>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-on-surface">{formatPrice(wallet?.pending_balance)}</span>
                        <span className="text-sm font-black text-secondary">₫</span>
                    </div>
                    <p className="mt-4 text-[10px] text-secondary font-medium leading-relaxed">Funds are locked for 7 days after order completion for dispute safety or pending withdrawal.</p>
                </div>

                {/* Available Balance */}
                <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group transition-all">
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
                        className="mt-6 w-full bg-white text-primary py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                    >
                        Withdraw Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Withdrawal Form */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-level-1">
                        <h3 className="text-sm font-black text-on-surface uppercase tracking-widest mb-6">Withdraw Funds</h3>
                        <form onSubmit={handleWithdraw} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Select Bank Account</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                >
                                    <option value="Vietcombank (***8829)">Vietcombank (***8829)</option>
                                    <option value="Techcombank (***4412)">Techcombank (***4412)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest">Amount to Withdraw</label>
                                <div className="relative">
                                    <input 
                                        id="withdraw-amount"
                                        type="number" 
                                        placeholder="0" 
                                        className="w-full bg-slate-50 border-slate-200 rounded-2xl pl-4 pr-16 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        min="100000"
                                    />
                                    <span className="absolute right-12 top-1/2 -translate-y-1/2 font-black text-secondary text-sm">₫</span>
                                    <button 
                                        type="button" 
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase cursor-pointer"
                                        onClick={() => setWithdrawAmount(wallet?.available_balance || '')}
                                    >
                                        All
                                    </button>
                                </div>
                                <div className="flex justify-end items-center px-1">
                                    <span className="text-[10px] text-secondary font-medium">Min: 100,000 ₫</span>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                Confirm Withdrawal
                            </button>
                        </form>
                    </div>
                </div>

                {/* Withdrawal Status */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-level-1 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">
                                Withdrawal Requests
                            </h3>
                            <button 
                                onClick={() => handleExport('withdrawals')}
                                className="flex items-center gap-2 text-[10px] font-black text-primary uppercase hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">download</span>
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Date & Time</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Note</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-8 font-bold text-slate-500">Loading...</td></tr>
                                    ) : withdrawals.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8 font-bold text-slate-500">No withdrawal requests found</td></tr>
                                    ) : withdrawals.map(withdraw => {
                                        const { date, time } = formatDate(withdraw.createdAt);
                                        let statusClass = 'bg-blue-50 text-primary';
                                        if (withdraw.status === 'approved' || withdraw.status === 'paid') statusClass = 'bg-green-50 text-[#2e7d32]';
                                        if (withdraw.status === 'rejected') statusClass = 'bg-red-50 text-[#b3261e]';

                                        return (
                                            <tr key={withdraw._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-on-surface">{date}</p>
                                                    <p className="text-[10px] text-secondary font-medium">{time}</p>
                                                </td>
                                                <td className="px-8 py-5 text-xs font-black text-on-surface">
                                                    {formatPrice(withdraw.amount)} ₫
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-xs font-medium text-slate-600">{withdraw.note}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                                    <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${statusClass}`}>{withdraw.status}</span>
                                                    <button
                                                        onClick={() => handleViewDetail({ type: 'withdraw', amount: -withdraw.amount, createdAt: withdraw.createdAt, status: withdraw.status, note: withdraw.note, _id: withdraw._id })}
                                                        className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {withdrawMeta.totalPages > 0 && (
                            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
                                <div className="flex items-center gap-4">
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                        Showing <span className="text-[#004ac6]">{(withdrawPage - 1) * withdrawLimit + 1} - {Math.min(withdrawPage * withdrawLimit, withdrawMeta.total)}</span> of <span className="text-slate-800">{withdrawMeta.total}</span> requests
                                    </p>
                                    <div className="w-px h-4 bg-slate-200"></div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                                        <select
                                            value={withdrawLimit}
                                            onChange={(e) => {
                                                setWithdrawLimit(Number(e.target.value));
                                                setWithdrawPage(1);
                                            }}
                                            className="text-xs font-bold text-slate-800 border-none bg-transparent focus:ring-0 cursor-pointer p-0 pr-6"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>

                                {withdrawMeta.totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={withdrawPage <= 1}
                                            onClick={() => setWithdrawPage(1)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
                                        </button>
                                        <button
                                            disabled={withdrawPage <= 1}
                                            onClick={() => setWithdrawPage(withdrawPage - 1)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        
                                        <div className="flex items-center gap-1 mx-2">
                                            {(() => {
                                                const { totalPages } = withdrawMeta;
                                                const pages = [];
                                                let startPage = Math.max(1, withdrawPage - 2);
                                                let endPage = Math.min(totalPages, withdrawPage + 2);
                                                if (endPage - startPage < 4) {
                                                    if (startPage === 1) endPage = Math.min(totalPages, 5);
                                                    if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
                                                }
                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => setWithdrawPage(i)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                                withdrawPage === i
                                                                    ? 'bg-[#004ac6] text-white shadow-md shadow-blue-200'
                                                                    : 'text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                }
                                                return pages;
                                            })()}
                                        </div>

                                        <button
                                            disabled={withdrawPage >= withdrawMeta.totalPages}
                                            onClick={() => setWithdrawPage(withdrawPage + 1)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                        <button
                                            disabled={withdrawPage >= withdrawMeta.totalPages}
                                            onClick={() => setWithdrawPage(withdrawMeta.totalPages)}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction History (at the bottom) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-level-1 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">
                        Recent Transactions
                    </h3>
                    <button 
                        onClick={() => handleExport('history')}
                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Date & Time</th>
                                <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Order ID</th>
                                <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Type</th>
                                <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 font-bold text-slate-500">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
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

                                const transStatusText = trans.status || 'Completed';
                                let transStatusClass = 'bg-slate-100 text-slate-600';
                                if (transStatusText === 'pending') {
                                    transStatusClass = 'bg-blue-50 text-primary';
                                } else if (transStatusText === 'approved') {
                                    transStatusClass = 'bg-green-50 text-[#2e7d32]';
                                } else if (transStatusText === 'rejected') {
                                    transStatusClass = 'bg-red-50 text-[#b3261e]';
                                }

                                return (
                                    <tr key={trans._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-bold text-on-surface">{date}</p>
                                            <p className="text-[10px] text-secondary font-medium">{time}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            {trans.order_id ? (
                                                <span className="text-xs font-black text-primary hover:underline cursor-pointer">
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
                                                <span className="text-xs font-bold text-on-surface">{typeName}</span>
                                            </div>
                                        </td>
                                        <td className={`px-8 py-5 text-xs font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? '+' : ''}{formatPrice(trans.amount)} ₫
                                        </td>
                                        <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                            <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${transStatusClass}`}>{transStatusText}</span>
                                            <button
                                                onClick={() => handleViewDetail(trans)}
                                                className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {transMeta.totalPages > 0 && (
                    <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
                        <div className="flex items-center gap-4">
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                Showing <span className="text-[#004ac6]">{(transPage - 1) * transLimit + 1} - {Math.min(transPage * transLimit, transMeta.total)}</span> of <span className="text-slate-800">{transMeta.total}</span> transactions
                            </p>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rows per page:</span>
                                <select
                                    value={transLimit}
                                    onChange={(e) => {
                                        setTransLimit(Number(e.target.value));
                                        setTransPage(1);
                                    }}
                                    className="text-xs font-bold text-slate-800 border-none bg-transparent focus:ring-0 cursor-pointer p-0 pr-6"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {transMeta.totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={transPage <= 1}
                                    onClick={() => setTransPage(1)}
                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
                                </button>
                                <button
                                    disabled={transPage <= 1}
                                    onClick={() => setTransPage(transPage - 1)}
                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                
                                <div className="flex items-center gap-1 mx-2">
                                    {(() => {
                                        const { totalPages } = transMeta;
                                        const pages = [];
                                        let startPage = Math.max(1, transPage - 2);
                                        let endPage = Math.min(totalPages, transPage + 2);
                                        if (endPage - startPage < 4) {
                                            if (startPage === 1) endPage = Math.min(totalPages, 5);
                                            if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
                                        }
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setTransPage(i)}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                                        transPage === i
                                                            ? 'bg-[#004ac6] text-white shadow-md shadow-blue-200'
                                                            : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        return pages;
                                    })()}
                                </div>

                                <button
                                    disabled={transPage >= transMeta.totalPages}
                                    onClick={() => setTransPage(transPage + 1)}
                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                                <button
                                    disabled={transPage >= transMeta.totalPages}
                                    onClick={() => setTransPage(transMeta.totalPages)}
                                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#004ac6] disabled:opacity-30 transition-all bg-white shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            </div>

        {/* Transaction Detail Modal */}
        {detailModalOpen && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 max-w-[500px] w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Transaction Details</h3>
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">
                                {selectedTransaction.type === 'earning' ? 'Completed Order Earning' : 'Withdrawal Request'}
                            </p>
                        </div>
                        <button 
                            onClick={() => setDetailModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-secondary hover:text-on-surface transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    {loadingDetail ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Loading details...</p>
                        </div>
                    ) : selectedTransaction.type === 'earning' && orderDetail ? (
                        <div className="space-y-6">
                            {/* Order Info */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Order Code</p>
                                    <p className="text-sm font-black text-on-surface mt-1">{orderDetail.order_code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Delivery Date</p>
                                    <p className="text-xs font-bold text-on-surface mt-1">
                                        {new Date(orderDetail.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Payout Breakdown</h4>
                                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                    <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                        <span>Subtotal (Base Revenue)</span>
                                        <span className="font-bold text-green-600">+{formatPrice(orderDetail.subtotal_amount)} ₫</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                        <span>Shipping Fee (Paid to Carrier)</span>
                                        <span className="font-bold text-slate-500">{formatPrice(orderDetail.shipping_fee)} ₫ (Excluded)</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                        <span>Platform Commission Fee ({orderDetail.platform_fee_rate}%)</span>
                                        <span className="font-bold text-red-600">-{formatPrice(orderDetail.platform_fee_amount)} ₫</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                        <span>Online Payment Gateway Fee ({orderDetail.gateway_fee_rate}%)</span>
                                        <span className="font-bold text-red-600">-{formatPrice(orderDetail.gateway_fee_amount)} ₫</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-4 text-sm font-black text-slate-900 bg-slate-50">
                                        <span>Total Net Payout</span>
                                        <span className="text-primary text-base">
                                            {formatPrice(orderDetail.subtotal_amount - orderDetail.platform_fee_amount - orderDetail.gateway_fee_amount)} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Promotion Absorption */}
                            {(orderDetail.coin_discount > 0 || orderDetail.coupon_discount > 0) && (
                                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        Platform Absorb Promotion
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                                        {orderDetail.coin_discount > 0 && (
                                            <div>Coins Discount: <span className="text-primary">{formatPrice(orderDetail.coin_discount)} ₫</span></div>
                                        )}
                                        {orderDetail.coupon_discount > 0 && (
                                            <div>Coupon Discount: <span className="text-primary">{formatPrice(orderDetail.coupon_discount)} ₫</span></div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 leading-normal">
                                        * The customer used coin/coupon discounts to pay. This cost is 100% absorbed by UTEShop and is NOT deducted from your payout.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Withdrawal request details
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Requested Withdrawal Amount</p>
                                <p className="text-3xl font-black text-primary mt-2">{formatPrice(Math.abs(selectedTransaction.amount))} ₫</p>
                            </div>

                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                    <span>Status</span>
                                    <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full ${
                                        selectedTransaction.status === 'pending' ? 'bg-blue-50 text-primary' :
                                        selectedTransaction.status === 'approved' ? 'bg-green-50 text-[#2e7d32]' :
                                        selectedTransaction.status === 'rejected' ? 'bg-red-50 text-[#b3261e]' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {selectedTransaction.status === 'paid' ? 'Completed' : (selectedTransaction.status || 'Completed')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                    <span>Date & Time Requested</span>
                                    <span className="font-bold text-slate-900">
                                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                    <span>Destination Account</span>
                                    <span className="font-bold text-slate-900">
                                        {selectedTransaction.note || 'Bank Account'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3 text-xs font-medium text-slate-700">
                                    <span>Processing Speed</span>
                                    <span className="font-bold text-slate-900">T+1 Business Day</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8">
                        <button 
                            onClick={() => setDetailModalOpen(false)}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default SellerWallet;
