import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ShipperDashboardOverview = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    totalAssigned: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
    todayDelivered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/shipper/dashboard', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#004ac6] to-[#0052cc] rounded-3xl p-8 text-white shadow-lg shadow-blue-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black mb-2">Welcome back, Partner!</h2>
            <p className="text-blue-100 font-medium text-lg">Here is your delivery performance summary.</p>
          </div>
          <div className="text-right bg-white/20 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="text-blue-50 font-bold text-sm uppercase tracking-wider mb-1">Successfully Delivered Today</p>
            <p className="text-4xl font-black flex items-baseline justify-end gap-2">
              {stats.todayDelivered} <span className="text-base font-bold text-blue-100">orders</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assigned</p>
          <h3 className="text-3xl font-black text-slate-900">{stats.totalAssigned}</h3>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">In Transit</p>
          <h3 className="text-3xl font-black text-slate-900">{stats.inTransit}</h3>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Delivered</p>
          <h3 className="text-3xl font-black text-slate-900">{stats.delivered}</h3>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">cancel</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Failed</p>
          <h3 className="text-3xl font-black text-slate-900">{stats.failed}</h3>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboardOverview;
