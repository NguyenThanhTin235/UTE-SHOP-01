import React, { useState, useEffect } from 'react';
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
      }
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-6">
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
                      className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
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
                      className="flex-1 py-2.5 bg-[#004ac6] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
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

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Overview</h3>
        
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">Loading chart data...</div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-slate-500">No data available for this period.</div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="delivered" name="Delivered Successfully" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="failed" name="Failed Deliveries" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipperStatistics;
