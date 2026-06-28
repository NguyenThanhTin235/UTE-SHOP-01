import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';

const ShipperStatistics = () => {
  const { timeframe: timeframeParam } = useParams();
  const navigate = useNavigate();
  
  const validTimeframes = ['week', 'month', 'custom'];
  const timeframe = validTimeframes.includes(timeframeParam) ? timeframeParam : 'week';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (timeframe !== 'custom' || (startDate && endDate)) {
      fetchStatistics();
    }
  }, [timeframe, startDate, endDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      let query = `timeframe=${timeframe}`;
      if (timeframe === 'custom') {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        query = `startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await axios.get(`http://localhost:5000/api/shipper/statistics?${query}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setData(response.data.data.chartData);
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const headers = ['Date', 'Delivered', 'Failed', 'Success Rate (%)'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(row => {
      const total = row.delivered + row.failed;
      const successRate = total > 0 ? ((row.delivered / total) * 100).toFixed(1) : 0;
      csvRows.push(`${row.date},${row.delivered},${row.failed},${successRate}`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shipper_statistics_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded successfully!');
  };

  const kpis = useMemo(() => {
    if (!data || data.length === 0) return { totalDelivered: 0, totalFailed: 0, successRate: 0, bestDay: 'N/A', maxDelivered: 0 };
    let d = 0, f = 0, maxD = -1, bestDate = 'N/A';
    data.forEach(item => {
      d += item.delivered;
      f += item.failed;
      if (item.delivered > maxD) {
        maxD = item.delivered;
        bestDate = item.date;
      }
    });
    const total = d + f;
    const rate = total > 0 ? ((d / total) * 100).toFixed(1) : 0;
    return { totalDelivered: d, totalFailed: f, successRate: rate, bestDay: maxD > 0 ? bestDate : 'N/A', maxDelivered: maxD };
  }, [data]);

  const itemsPerPage = 7;
  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
  const paginatedData = data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  return (
    <div className="p-4 md:p-10 max-w-[1280px] mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">Delivery Statistics</h2>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['week', 'month'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  navigate(t === 'week' ? '/shipper/statistics' : `/shipper/statistics/${t}`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  timeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                This {t}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setTempDateFrom(startDate);
                setTempDateTo(endDate);
                setShowDatePicker(!showDatePicker);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                timeframe === 'custom' || startDate || endDate
                  ? 'bg-blue-50 border-blue-200 text-[#004ac6]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              {startDate || endDate
                ? `${startDate || '...'} → ${endDate || '...'}`
                : 'Date Range'}
              {(startDate || endDate) && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setStartDate('');
                    setEndDate('');
                    navigate('/shipper/statistics');
                  }}
                  className="material-symbols-outlined text-[16px] text-red-500 hover:scale-110 transition-transform ml-1"
                  title="Clear date filter"
                >close</span>
              )}
            </button>

            {showDatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)}></div>
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Filter by Date Range</p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">From</label>
                      <input
                        type="date"
                        value={tempDateFrom}
                        max={tempDateTo || undefined}
                        onChange={(e) => setTempDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#004ac6]/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">To</label>
                      <input
                        type="date"
                        value={tempDateTo}
                        min={tempDateFrom || undefined}
                        onChange={(e) => setTempDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#004ac6]/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setTempDateFrom('');
                        setTempDateTo('');
                        setStartDate('');
                        setEndDate('');
                        setShowDatePicker(false);
                        navigate('/shipper/statistics');
                      }}
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(tempDateFrom);
                        setEndDate(tempDateTo);
                        setShowDatePicker(false);
                        navigate('/shipper/statistics/custom');
                      }}
                      className="flex-1 py-2.5 bg-[#004ac6] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Delivered</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.totalDelivered}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined">cancel</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Failed</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.totalFailed}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#004ac6] flex items-center justify-center">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Success Rate</p>
            <h3 className="text-2xl font-black text-slate-900">{kpis.successRate}%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Best Day</p>
            <h3 className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{kpis.bestDay}</h3>
            <p className="text-xs text-slate-500 font-bold">{kpis.maxDelivered > 0 ? `${kpis.maxDelivered} deliveries` : ''}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Timeline</h3>
        
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">Loading chart data...</div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-500">No data available for this period.</div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="delivered" name="Delivered Successfully" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="failed" name="Failed Deliveries" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Daily Breakdown</h3>
            <p className="text-sm text-slate-500">Detailed view of your delivery performance.</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#004ac6] text-white text-sm font-bold rounded-xl hover:bg-[#003da6] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          {data.length > 0 && !loading ? (
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-[25%] px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">Date</th>
                  <th className="w-[25%] px-6 py-4 text-xs font-black uppercase tracking-widest text-emerald-600">Delivered</th>
                  <th className="w-[25%] px-6 py-4 text-xs font-black uppercase tracking-widest text-red-600">Failed</th>
                  <th className="w-[25%] px-6 py-4 text-xs font-black uppercase tracking-widest text-[#004ac6]">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((row) => {
                  const total = row.delivered + row.failed;
                  const rate = total > 0 ? ((row.delivered / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{row.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{row.delivered}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">{row.failed}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#004ac6]">{rate}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-slate-500 font-medium">
              No detailed data to display.
            </div>
          )}
        </div>
        
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-3xl">
            <div className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, data.length)}</span> of <span className="font-bold text-slate-900">{data.length}</span> entries
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:border-[#004ac6] hover:text-[#004ac6] shadow-sm cursor-pointer'}`}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex items-center justify-center px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:border-[#004ac6] hover:text-[#004ac6] shadow-sm cursor-pointer'}`}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipperStatistics;
