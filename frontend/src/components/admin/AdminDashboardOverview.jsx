import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { jsPDF } from 'jspdf';

// Skeleton Loader Component
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />
);

// Helper function to format compact currency values
const formatCompact = (value) => {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B ₫';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M ₫';
  }
  return value.toLocaleString('vi-VN') + ' ₫';
};

const AdminDashboardOverview = ({ 
  searchTerm, 
  dashboardData, 
  loading, 
  days, 
  setDays, 
  setActiveTab,
  refetch 
}) => {
  const stats = dashboardData?.stats || {};
  const weeklyChartData = dashboardData?.weeklyChartData || [];
  const securityPulse = dashboardData?.securityPulse || {};
  const productivity = dashboardData?.productivity || {};
  const productModerationQueue = dashboardData?.productModerationQueue || [];

  const [showDaysDropdown, setShowDaysDropdown] = useState(false);

  const handleAction = (actionType, prodName) => {
    if (actionType === 'view') {
      toast.success(`Opening verification panel for: ${prodName}`);
    }
  };

  // Block/hide violation from DB using manager API
  const handleBlock = async (id, name) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`http://localhost:5000/api/manager/violations/${id}/action`, {
        action: 'hide_products',
        reason: 'Flagged counterfeit item blocked by Admin from Global Dashboard Overview'
      }, config);

      if (response.data && response.data.success) {
        toast.success(`Successfully blocked and suspended: ${name}`);
        if (refetch) refetch(); // Reload stats dynamically
      } else {
        toast.error(response.data?.message || 'Failed to block product');
      }
    } catch (error) {
      console.error('Error blocking product violation:', error);
      toast.error(error.response?.data?.message || 'Failed to take block action');
    }
  };

  // Generate and export PDF Report
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title Block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 74, 198); // primary color
      doc.text("UTEShop Admin Platform Report", 20, 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Reporting Period: Past ${days} Days | Generated on: ${new Date().toLocaleString()}`, 20, 32);
      
      // Divider
      doc.setDrawColor(220, 224, 245);
      doc.line(20, 36, 190, 36);
      
      // Platform stats section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(19, 27, 46); // dark slate text
      doc.text("Platform Performance Stats", 20, 48);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(67, 70, 85); // secondary text
      doc.text(`- Global GMV: ${(stats.globalGMV || 0).toLocaleString('vi-VN')} VND (Growth: ${stats.gmvGrowth || 0}%)`, 25, 58);
      doc.text(`- New Users: ${(stats.newUsers || 0).toLocaleString('vi-VN')} Scholars (Growth: ${stats.usersGrowth || 0}%)`, 25, 66);
      doc.text(`- Active Promotions: ${stats.activePromotions || 0} coupons`, 25, 74);
      doc.text(`- Active Incident Cases: ${stats.securityAlerts || 0} alerts pending`, 25, 82);
      
      // Large Transaction list
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(19, 27, 46);
      doc.text("Recent Large Transaction Alerts", 20, 96);
      
      let y = 106;
      if (securityPulse.largeTransactionAlerts?.length > 0) {
        securityPulse.largeTransactionAlerts.forEach((alert) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`* ${alert.shopName} processed ${alert.amount.toLocaleString('vi-VN')} VND (${alert.timeAgo})`, 25, y);
          y += 8;
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("No recent transactions over 5,000,000 VND detected.", 25, y);
        y += 8;
      }
      
      // Moderation queue
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(19, 27, 46);
      doc.text("Flagged Products in Moderation Queue", 20, y + 10);
      
      y += 20;
      if (productModerationQueue.length > 0) {
        productModerationQueue.slice(0, 5).forEach((item) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`* [Risk: ${item.risk}] ${item.name} by ${item.seller} - Violation: ${item.violation}`, 25, y);
          y += 8;
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("No pending product reports currently flagged in the queue.", 25, y);
        y += 8;
      }
      
      // Footer text
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("CONFIDENTIAL - UTEShop CMS platform administration utility document.", 20, 280);
      
      doc.save(`UTEShop_Admin_Report_${days}_days.pdf`);
      toast.success("Platform performance report downloaded successfully!");
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF report.");
    }
  };

  // Filter queue based on search term
  const filteredQueue = productModerationQueue.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.violation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Global Dashboard</h2>
          <p className="text-slate-600 text-base font-medium mt-1">Real-time health and transaction overview for UTEShop platform.</p>
        </div>
        <div className="flex gap-3 relative">
          <div className="relative">
            <button 
              onClick={() => setShowDaysDropdown(!showDaysDropdown)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Past {days} Days
            </button>
            {showDaysDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button 
                  onClick={() => { setDays(7); setShowDaysDropdown(false); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Past 7 Days
                </button>
                <button 
                  onClick={() => { setDays(30); setShowDaysDropdown(false); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
                >
                  Past 30 Days
                </button>
                <button 
                  onClick={() => { setDays(90); setShowDaysDropdown(false); }}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
                >
                  Past 90 Days
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={exportToPDF}
            className="px-5 py-2.5 bg-[#004ac6] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#004ac6]/30 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Global GMV */}
        {loading ? (
          <Skeleton className="h-44" />
        ) : (
          <div 
            onClick={() => setActiveTab('finance_config')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-[#004ac6] cursor-pointer transition-all duration-300 active:scale-95"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-[#004ac6]">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                  stats.gmvGrowth >= 0 ? 'text-[#2e7d32] bg-[#2e7d32]/10' : 'text-[#b3261e] bg-[#b3261e]/10'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {stats.gmvGrowth >= 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {Math.abs(stats.gmvGrowth || 0)}%
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Global GMV</p>
              <h3 className="text-2xl font-black text-slate-900">
                {(stats.globalGMV || 0).toLocaleString('vi-VN')} <span className="text-sm font-medium text-slate-500">₫</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">vs. previous period: {(stats.lastMonthGMV || 0).toLocaleString('vi-VN')} ₫</p>
            </div>
          </div>
        )}

        {/* Card 2: New Users */}
        {loading ? (
          <Skeleton className="h-44" />
        ) : (
          <div 
            onClick={() => setActiveTab('users')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-[#004ac6] cursor-pointer transition-all duration-300 active:scale-95"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                  stats.usersGrowth >= 0 ? 'text-[#2e7d32] bg-[#2e7d32]/10' : 'text-[#b3261e] bg-[#b3261e]/10'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {stats.usersGrowth >= 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {Math.abs(stats.usersGrowth || 0)}%
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">New Users</p>
              <h3 className="text-2xl font-black text-slate-900">
                {(stats.newUsers || 0).toLocaleString('vi-VN')} <span className="text-xs font-medium text-slate-500">Scholars</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Total registered: {(stats.totalUsers || 0).toLocaleString('vi-VN')}</p>
            </div>
          </div>
        )}

        {/* Card 3: Active Promotions */}
        {loading ? (
          <Skeleton className="h-44" />
        ) : (
          <div 
            onClick={() => setActiveTab('promotions')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-[#004ac6] cursor-pointer transition-all duration-300 active:scale-95"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-[#004ac6]">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <span className="text-xs font-bold text-[#2e7d32] bg-[#2e7d32]/10 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  Live
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Active Promotions</p>
              <h3 className="text-2xl font-black text-slate-900">
                {stats.activePromotions || 0} <span className="text-sm font-medium text-slate-500">Live Now</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Campaign monitors active</p>
            </div>
          </div>
        )}

        {/* Card 4: Security Alerts */}
        {loading ? (
          <Skeleton className="h-44" />
        ) : (
          <div 
            onClick={() => setActiveTab('rbac')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-[#b3261e] cursor-pointer transition-all duration-300 active:scale-95"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-xl text-[#b3261e]">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                  stats.securityAlerts > 0 ? 'text-[#b3261e] bg-[#b3261e]/10' : 'text-[#2e7d32] bg-[#2e7d32]/10'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {stats.securityAlerts > 0 ? 'warning' : 'check_circle'}
                  </span>
                  {stats.securityAlerts > 0 ? 'Action Needed' : 'Healthy'}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Security Status</p>
              <h3 className="text-2xl font-black text-slate-900">
                {stats.securityAlerts || 0} <span className="text-sm font-medium text-slate-500">Incidents</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Last scan: Just now</p>
            </div>
          </div>
        )}
      </div>

      {/* Platform Growth Analytics & Security Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GMV Growth Chart */}
        {loading ? (
          <Skeleton className="lg:col-span-2 h-[380px]" />
        ) : (
          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">Platform-wide GMV Growth</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Aggregated transaction volume across all vendors.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button 
                  onClick={() => setDays(7)}
                  className={`px-5 py-1.5 text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-all ${
                    days === 7 
                      ? 'bg-white text-[#004ac6] font-black shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setDays(30)}
                  className={`px-5 py-1.5 text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-all ${
                    days === 30 
                      ? 'bg-white text-[#004ac6] font-black shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setDays(90)}
                  className={`px-5 py-1.5 text-xs uppercase tracking-widest rounded-lg cursor-pointer transition-all ${
                    days === 90 
                      ? 'bg-white text-[#004ac6] font-black shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-end">
              <div className="relative h-[280px] w-full flex items-end justify-between gap-6 px-4 border-b border-slate-100 pb-2">
                {weeklyChartData.map((week, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                    <div 
                      className={`w-full rounded-t-xl transition-all relative ${
                        week.label === 'Current' || week.label === 'Today'
                          ? 'bg-[#004ac6] shadow-lg shadow-blue-100' 
                          : 'bg-[#004ac6]/20 group-hover:bg-[#004ac6]/40'
                      }`} 
                      style={{ height: `${week.percentage}%` }}
                    >
                      {/* Compact value directly on top of the bar */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-slate-800 text-[10px] font-black whitespace-nowrap">
                        {formatCompact(week.amount)}
                      </div>
                      {/* Tooltip with exact amount visible on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold z-10 pointer-events-none shadow">
                        {week.amount.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                    <span className={`mt-4 text-[10px] font-black uppercase tracking-widest ${
                      week.label === 'Current' || week.label === 'Today' ? 'text-[#004ac6]' : 'text-slate-400'
                    }`}>
                      {week.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Security Pulse & Productivity */}
        {loading ? (
          <Skeleton className="h-[380px]" />
        ) : (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 font-sans">Security Pulse</h3>
              <div className="space-y-6">
                {securityPulse.largeTransactionAlerts?.length > 0 ? (
                  securityPulse.largeTransactionAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="p-2 bg-red-50 text-[#b3261e] rounded-lg">
                        <span className="material-symbols-outlined text-[20px]">policy</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Large Transaction Alert</p>
                        <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                          {alert.shopName} processed {alert.amount.toLocaleString('vi-VN')} ₫. Fraud check required.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => toast.success(`Reviewing Transaction ${alert.orderCode}`)} className="text-[10px] font-black text-[#004ac6] hover:underline cursor-pointer">Review</button>
                          <button onClick={() => toast.error(`Transaction ${alert.orderCode} placed on hold`)} className="text-[10px] font-black text-[#b3261e] hover:underline cursor-pointer">Hold</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight font-sans">No Fraud Alerts</p>
                      <p className="text-[10px] text-slate-600 mt-1 leading-snug">No transactions above 5M VND processed recently.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4 border-t border-slate-100 pt-4">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">store</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight font-sans">New Shop Applications</p>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                      {securityPulse.pendingShopsCount || 0} new merchants are waiting for document verification.
                    </p>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-[10px] font-black text-[#004ac6] hover:underline mt-3 cursor-pointer"
                    >
                      Open Queue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#004ac6] rounded-2xl p-6 text-white shadow-xl shadow-blue-200 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl">insights</span>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-2 font-sans">Admin Productivity</h3>
              <p className="text-2xl font-black mb-6">{productivity.efficiency || 92}% <span className="text-xs font-normal opacity-70 italic">Efficiency</span></p>
              <p className="text-[10px] opacity-70 leading-relaxed mb-6">
                You have resolved {productivity.resolvedViolations || 0} of {productivity.totalViolations || 0} incident reports.
              </p>
              <button 
                onClick={() => setActiveTab('rbac')}
                className="w-full bg-white text-[#004ac6] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
              >
                View Workload
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Moderation Queue */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs font-sans">Product Moderation Queue</h3>
            <span className="bg-[#ba1a1a] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {filteredQueue.length} Flagged
            </span>
          </div>
          <button onClick={() => toast.success('Processing all flagged items...')} className="text-[#004ac6] text-xs font-black hover:underline uppercase tracking-widest cursor-pointer">Process All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Product Info</th>
                <th className="px-8 py-4">Seller</th>
                <th className="px-8 py-4">Violation Type</th>
                <th className="px-8 py-4">Risk Level</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(2).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="5" className="px-8 py-5">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-sm font-bold text-slate-400">
                    No matching flagged products found.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200/60">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.seller}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Reputation: {item.reputation}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600 line-clamp-2">{item.violation}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${item.riskColor}`}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction('view', item.name)}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#004ac6] hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer border border-slate-200/40"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                        <button
                          onClick={() => handleBlock(item.id, item.name)}
                          className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#ba1a1a] hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer border border-slate-200/40"
                        >
                          <span className="material-symbols-outlined text-xl">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            Showing <span className="text-slate-900">{filteredQueue.length}</span> flagged items
          </span>
          <div className="flex items-center gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all opacity-50 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#004ac6] text-white text-xs font-black shadow-lg shadow-blue-100 cursor-pointer">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs font-black transition-all cursor-pointer">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardOverview;
