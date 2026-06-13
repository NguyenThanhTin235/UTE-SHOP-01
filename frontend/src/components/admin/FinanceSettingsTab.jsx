import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FinanceSettingsTab = ({ searchTerm, setApplyChangesHandler, setApplyingState }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [feePercent, setFeePercent] = useState(2.5);
  const [gatewayFeePercent, setGatewayFeePercent] = useState(1.5);
  const [coinEarnRate, setCoinEarnRate] = useState(100); // coins per 10,000 VND
  const [coinSpendRate, setCoinSpendRate] = useState(1);
  const [coinMaxUsagePercent, setCoinMaxUsagePercent] = useState(50);
  const [coinExpiryDuration, setCoinExpiryDuration] = useState('End of Current Year');
  const [minWithdrawal, setMinWithdrawal] = useState(100000);
  const [maxDailyWithdrawal, setMaxDailyWithdrawal] = useState(50000000);
  const [payoutProcessingTime, setPayoutProcessingTime] = useState('T+1');

  // Logs and pagination
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState('All Actions');

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/finance/settings', getHeaders());
      if (res.data && res.data.success) {
        const { feeSetting, coinSetting, withdrawSetting, logs: auditLogs } = res.data.data;
        
        if (feeSetting) {
          setFeePercent(feeSetting.feePercent ?? 2.5);
          setGatewayFeePercent(feeSetting.gatewayFeePercent ?? 1.5);
        }
        if (coinSetting) {
          // earn_rate in DB is multiplier, e.g. 0.01 means 10,000 * 0.01 = 100 coins
          setCoinEarnRate(Math.round(10000 * (coinSetting.earnRate ?? 0.01)));
          setCoinSpendRate(coinSetting.spendRate ?? 1);
          setCoinMaxUsagePercent(coinSetting.maxUsagePercent ?? 50);
          setCoinExpiryDuration(coinSetting.expiryDuration ?? 'End of Current Year');
        }
        if (withdrawSetting) {
          setMinWithdrawal(withdrawSetting.minWithdrawal ?? 100000);
          setMaxDailyWithdrawal(withdrawSetting.maxDailyWithdrawal ?? 50000000);
          setPayoutProcessingTime(withdrawSetting.payoutProcessingTime ?? 'T+1');
        }
        if (auditLogs) {
          setLogs(auditLogs);
        }
      }
    } catch (err) {
      console.error('Fetch finance settings error:', err);
      toast.error('Failed to load finance settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setApplyingState(true);
    try {
      const payload = {
        fee_percent: Number(feePercent),
        gateway_fee_percent: Number(gatewayFeePercent),
        earn_rate: Number(coinEarnRate) / 10000, // convert back to multiplier, e.g. 100 coins / 10,000 = 0.01
        spend_rate: Number(coinSpendRate),
        max_usage_percent: Number(coinMaxUsagePercent),
        expiry_duration: coinExpiryDuration,
        min_withdrawal: Number(minWithdrawal),
        max_daily_withdrawal: Number(maxDailyWithdrawal),
        payout_processing_time: payoutProcessingTime
      };

      const res = await axios.put('http://localhost:5000/api/admin/finance/settings', payload, getHeaders());
      if (res.data && res.data.success) {
        toast.success('Finance settings saved and applied successfully!');
        fetchSettings(); // Refresh settings and audit log
      }
    } catch (err) {
      console.error('Save finance settings error:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
      setApplyingState(false);
    }
  };

  useEffect(() => {
    setApplyChangesHandler(() => handleSave);
    return () => setApplyChangesHandler(null);
  }, [feePercent, gatewayFeePercent, coinEarnRate, coinSpendRate, coinMaxUsagePercent, coinExpiryDuration, minWithdrawal, maxDailyWithdrawal, payoutProcessingTime]);

  // Filter logs based on search or select box
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm ? (
      log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.newValue.toLowerCase().includes(searchTerm.toLowerCase())
    ) : true;

    if (logFilter === 'All Actions') return matchesSearch;
    if (logFilter === 'Fee Changes') return matchesSearch && (log.newValue.includes('Fee Rate') || log.newValue.includes('Gateway Fee'));
    if (logFilter === 'Coin Config') return matchesSearch && log.newValue.includes('Coin');
    if (logFilter === 'Withdrawal Limits') return matchesSearch && (log.newValue.includes('Withdraw') || log.newValue.includes('Payout Time'));
    return matchesSearch;
  });

  // Pagination helper
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage);

  useEffect(() => {
    setLogPage(1);
  }, [logFilter, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#004ac6]"></div>
      </div>
    );
  }

  const totalCommission = (parseFloat(feePercent) + parseFloat(gatewayFeePercent)).toFixed(1);

  return (
    <div className="space-y-8 pb-12">

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[#004ac6]">
            <span className="material-symbols-outlined text-3xl">percent</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Fee Rate</p>
            <h3 className="text-2xl font-black text-slate-900">{feePercent}%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <span className="material-symbols-outlined text-3xl">database</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coin Spending Cap</p>
            <h3 className="text-2xl font-black text-slate-900">{coinMaxUsagePercent}% <span className="text-xs text-slate-400 font-medium">per Order</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="size-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min. Withdrawal</p>
            <h3 className="text-2xl font-black text-slate-900">{minWithdrawal?.toLocaleString()} <span className="text-xs text-slate-400 font-medium">₫</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Fee Configuration */}
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">payments</span>
              Platform Fee Structures
            </h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Base Transaction Fee (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="text-slate-400 font-black text-xl">%</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Applied to every successful transaction on the platform.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Payment Gateway Fee (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={gatewayFeePercent}
                  onChange={(e) => setGatewayFeePercent(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="text-slate-400 font-black text-xl">%</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Additional fee for processing online payments (Momo, VNPay, etc).</p>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Total Standard Commission</span>
              <span className="text-xl font-black text-[#004ac6]">{totalCommission}%</span>
            </div>
          </div>
        </section>

        {/* Loyalty Coins */}
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">savings</span>
              UTEShop Coin Logic
            </h3>
          </div>
          <div className="p-8 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Earning Rate (VND to Coins)</label>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-slate-400 whitespace-nowrap">10,000 ₫ =</span>
                <input
                  type="number"
                  value={coinEarnRate}
                  onChange={(e) => setCoinEarnRate(e.target.value)}
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="text-slate-400 font-black text-sm">Coins</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Calculated as {((Number(coinEarnRate) || 0) / 10000 * 100).toFixed(1)}% cashback conversion rate for purchases.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Spending Cap per Order (%)</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={coinMaxUsagePercent}
                  onChange={(e) => setCoinMaxUsagePercent(e.target.value)}
                  min="0"
                  max="100"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="text-slate-400 font-black text-xl">%</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Maximum percentage of order total that can be paid with coins.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Coin Expiry Duration</label>
              <select
                value={coinExpiryDuration}
                onChange={(e) => setCoinExpiryDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all cursor-pointer outline-none font-semibold text-slate-700"
              >
                <option value="6 Months from Earning">6 Months from Earning</option>
                <option value="End of Current Year">End of Current Year</option>
                <option value="12 Months from Earning">12 Months from Earning</option>
                <option value="No Expiry">No Expiry</option>
              </select>
            </div>
          </div>
        </section>

        {/* Withdrawal & Payout Limits */}
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">account_balance</span>
              Withdrawal & Payout Controls
            </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Min. Withdrawal Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₫</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Max. Daily Withdrawal</label>
              <div className="relative">
                <input
                  type="number"
                  value={maxDailyWithdrawal}
                  onChange={(e) => setMaxDailyWithdrawal(e.target.value)}
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₫</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">Payout Processing Time</label>
              <select
                value={payoutProcessingTime}
                onChange={(e) => setPayoutProcessingTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-[#004ac6] focus:border-[#004ac6] transition-all cursor-pointer outline-none font-semibold text-slate-700"
              >
                <option value="Instant Payout">Instant Payout</option>
                <option value="T+1">T+1 (Next Business Day)</option>
                <option value="T+3">T+3 (3 Business Days)</option>
                <option value="Manual Approval">Manual Approval</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Audit Log Table */}
      <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-950 uppercase tracking-widest text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-base">list_alt</span>
            Finance Audit Log
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 gap-2 shadow-sm">
              <span className="material-symbols-outlined text-slate-400 text-sm">filter_alt</span>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[11px] font-black text-slate-600 p-0 outline-none cursor-pointer"
              >
                <option value="All Actions">All Actions</option>
                <option value="Fee Changes">Fee Changes</option>
                <option value="Coin Config">Coin Config</option>
                <option value="Withdrawal Limits">Withdrawal Limits</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Changes Description</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-8 text-center text-sm font-medium text-slate-400">
                    No finance setting logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-slate-800">{log.admin}</td>
                    <td className="px-8 py-4 text-sm font-medium text-slate-500">{log.action}</td>
                    <td className="px-8 py-4 text-sm font-semibold text-slate-600 max-w-md">
                      {log.newValue.split(', ').map((c, i) => (
                        <span key={i} className="inline-block bg-blue-50/50 text-[#004ac6] border border-blue-100/50 text-[11px] font-black px-2 py-0.5 rounded-lg mr-1.5 mb-1">
                          {c}
                        </span>
                      ))}
                    </td>
                    <td className="px-8 py-4 text-xs font-semibold text-slate-400">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Showing {(logPage - 1) * itemsPerPage + 1} to {Math.min(logPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={logPage === 1}
                onClick={() => setLogPage(p => p - 1)}
                className="size-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#004ac6] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setLogPage(page)}
                  className={`size-9 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer ${
                    logPage === page
                      ? 'bg-[#004ac6] text-white shadow-lg shadow-blue-200'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={logPage === totalPages}
                onClick={() => setLogPage(p => p + 1)}
                className="size-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-[#004ac6] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default FinanceSettingsTab;
