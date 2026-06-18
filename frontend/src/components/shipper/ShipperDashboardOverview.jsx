import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']; // Emerald, Red, Amber, Blue

const ShipperDashboardOverview = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    totalAssigned: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
    todayDelivered: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` };
      
      const [dashboardRes, ordersRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/shipper/dashboard', { headers }),
        axios.get('http://localhost:5000/api/shipper/orders?limit=5', { headers }),
        axios.get('http://localhost:5000/api/shipper/statistics?timeframe=week', { headers })
      ]);

      if (dashboardRes.data.success) setStats(dashboardRes.data.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.orders);
      if (statsRes.data.success) setPerformanceData(statsRes.data.data.chartData);

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-700',
      shipping: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-slate-100 text-slate-700';
  };

  const pieData = [
    { name: 'Completed', value: stats.delivered },
    { name: 'Failed', value: stats.failed },
    { name: 'In Transit', value: stats.inTransit },
    { name: 'Others', value: Math.max(0, stats.totalAssigned - stats.delivered - stats.failed - stats.inTransit) }
  ].filter(item => item.value > 0);

  if (loading) {
    return <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined animate-spin text-4xl text-blue-500 mb-4">autorenew</span>
      <p className="text-slate-500 font-medium">Loading your dashboard...</p>
    </div>;
  }

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#004ac6] to-[#0052cc] rounded-3xl p-8 text-white shadow-lg shadow-blue-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:justify-between items-start md:items-center">
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
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-4">Status Distribution</h3>
          <div className="flex-1 min-h-[250px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data available</div>
            )}
          </div>
        </div>

        {/* Bar Chart: Last 7 Days Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 mb-4">Performance (Last 7 Days)</h3>
          <div className="flex-1 min-h-[250px]">
            {performanceData && performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">No performance data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900">Recent Assignments</h3>
          <button 
            onClick={() => setActiveTab('orders')}
            className="text-sm font-bold text-[#004ac6] hover:text-[#003699] transition-colors"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Order ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Address</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order, index) => (
                  <tr key={order._id || order.id || index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">#{order?.orderCode || order?.order_code || order?._id?.substring(0, 8) || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{order.customerId?.fullName || order.customer_id?.full_name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{order.customerId?.phone || order.customer_id?.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 max-w-[250px] truncate" title={order.shopId?.address || order.shop_id?.address}>
                        {order.shopId?.address || order.shop_id?.address || 'Address not available'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500 font-medium">
              No recent assignments found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboardOverview;
