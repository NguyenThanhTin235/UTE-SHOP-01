import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) throw new Error('No token found');
  return { headers: { Authorization: `Bearer ${token}` } };
}

const GenericDropdown = ({ options, selectedValue, onSelect, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === selectedValue) || options.flatMap(o => o.children || []).find(o => o.value === selectedValue);
  const selectedLabel = selectedOption ? selectedOption.label : selectedValue;

  return (
    <div className="relative flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:shadow transition-shadow group cursor-pointer" ref={dropdownRef} onClick={() => setIsOpen(!isOpen)}>
      <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>
      <span className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[150px] select-none">
        {selectedLabel}
      </span>
      <span className="material-symbols-outlined text-slate-400 text-[16px] ml-auto group-hover:text-primary transition-colors">expand_more</span>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2">
          {options.map((opt, idx) => (
            <div 
              key={idx}
              className="relative group/item"
            >
              <div 
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary cursor-pointer flex justify-between items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
                {opt.children && opt.children.length > 0 && (
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                )}
              </div>
              
              {/* Submenu */}
              {opt.children && opt.children.length > 0 && (
                <div className="absolute top-0 left-full ml-1 hidden group-hover/item:block min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg py-2">
                  {opt.children.map((child, cIdx) => (
                    <div 
                      key={cIdx}
                      className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-primary cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(child.value);
                        setIsOpen(false);
                      }}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManagerStatistics = ({ searchTerm = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState(searchParams.get('dateRange') || '30');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRange !== '30') params.set('dateRange', dateRange);
    if (category !== 'All') params.set('category', category);
    if (status !== 'All') params.set('status', status);
    
    setSearchParams(params, { replace: true });
  }, [dateRange, category, status, setSearchParams]);

  // Pagination for Financial Intelligence
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;

  const [expandedEff, setExpandedEff] = useState({});
  const toggleEff = (id) => setExpandedEff(prev => ({...prev, [id]: !prev[id]}));

  const [expandedComp, setExpandedComp] = useState({});
  const toggleComp = (id) => setExpandedComp(prev => ({...prev, [id]: !prev[id]}));

  const [filterOptions, setFilterOptions] = useState({
    categories: [{ label: 'All Categories', value: 'All' }],
    dateRanges: [
      { label: 'All Time', value: 'all' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 7 Days', value: '7' }
    ],
    statuses: [
      { label: 'Status: All', value: 'All' },
      { label: 'Status: Resolved', value: 'Resolved' },
      { label: 'Status: Pending', value: 'Pending' }
    ]
  });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, dateRes, statusRes] = await Promise.all([
          axios.get(`${API}/manager/statistics/filters/categories`, getAuthHeader()),
          axios.get(`${API}/manager/statistics/filters/date-ranges`, getAuthHeader()),
          axios.get(`${API}/manager/statistics/filters/statuses`, getAuthHeader())
        ]);
        setFilterOptions({
          categories: catRes.data.data,
          dateRanges: dateRes.data.data,
          statuses: statusRes.data.data
        });
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchStatistics = async (isManualRefresh = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange !== '30') params.append('dateRange', dateRange);
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);

      const res = await axios.get(`${API}/manager/statistics?${params.toString()}`, getAuthHeader());
      if (res.data.success) {
        setData(res.data.data);
        if (isManualRefresh === true) {
          toast.success('Data refreshed successfully');
        }
      } else {
        toast.error('Failed to load statistics');
      }
    } catch (error) {
      console.error('fetchStatistics error:', error);
      toast.error('Error fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, category, status]);

  const handleExportCSV = () => {
    if (!data?.financialIntelligence || data.financialIntelligence.length === 0) {
      return toast.error('No data to export');
    }
    const headers = ['Shop ID', 'Shop Name', 'GMV (Revenue)', 'Commission', 'Orders', 'Growth', 'Audit Status'];
    const rows = data.financialIntelligence.map(f => [
      f.shopId,
      f.shopName,
      f.gmv,
      f.commission,
      f.orders,
      f.growth,
      f.auditStatus
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(item => `"${item}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const {
    statCards,
    violationDistribution,
    approvalEfficiency,
    recentPenalties,
    topViolatingShops,
    categoryCompliance,
    financialIntelligence
  } = data || {};

  const filteredRecentPenalties = recentPenalties?.filter(p => !searchTerm || 
    p.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTopViolatingShops = topViolatingShops?.filter(s => !searchTerm || 
    s.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFinancialIntelligence = financialIntelligence?.filter(f => !searchTerm || 
    f.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.auditStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncidents = violationDistribution?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-10">
      {/* Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <GenericDropdown options={filterOptions.dateRanges} selectedValue={dateRange} onSelect={setDateRange} icon="calendar_month" />
          <GenericDropdown options={filterOptions.categories} selectedValue={category} onSelect={setCategory} icon="category" />
          <GenericDropdown options={filterOptions.statuses} selectedValue={status} onSelect={setStatus} icon="filter_list" />
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
          <button 
            onClick={() => fetchStatistics(true)} 
            disabled={loading}
            className={`w-11 h-11 flex items-center justify-center bg-white border ${loading ? 'border-primary text-primary' : 'border-slate-200 text-slate-400'} rounded-xl hover:text-primary hover:border-primary transition-all shadow-sm`} 
            title="Refresh Data"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg. Approval Time</p>
          <h3 className="text-3xl font-black text-slate-900">{statCards?.avgApprovalTime || '—'}</h3>
          <div className="flex items-center gap-2 mt-4 text-[#16a34a]">
            <span className="material-symbols-outlined text-sm font-black">trending_down</span>
            <span className="text-[10px] font-black uppercase tracking-widest">12% Faster than last week</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rejection Rate</p>
          <h3 className="text-3xl font-black text-slate-900">{statCards?.rejectionRate || 0}%</h3>
          <div className="flex items-center gap-2 text-error mt-4">
            <span className="material-symbols-outlined text-sm font-black text-[#dc2626]">trending_up</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#dc2626]">2% Higher due to Tax Audit</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Integrity</p>
          <h3 className="text-3xl font-black text-slate-900">{statCards?.platformIntegrity || 0}%</h3>
          <div className="flex items-center gap-2 mt-4 text-[#16a34a]">
            <span className="material-symbols-outlined text-sm font-black">verified</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Stable rating</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Violation Distribution</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Breakdown of reports by category</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDateRange('30')} className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200 ${dateRange === '30' ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-400'}`}>30 Days</button>
            <button onClick={() => setDateRange('90')} className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200 ${dateRange === '90' ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-400'}`}>90 Days</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative w-64 h-64 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="12"></circle>
              {violationDistribution && violationDistribution.length > 0 && (
                <>
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#004ac6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * violationDistribution[0].percentage / 100)}`}></circle>
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ba1a1a" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * (violationDistribution[1]?.percentage || 0) / 100)}`} style={{ transformOrigin: 'center', transform: `rotate(${violationDistribution[0].percentage * 3.6}deg)` }}></circle>
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{totalIncidents}</span>
              <span className="text-[8px] font-black text-slate-400 uppercase">Total Incidents</span>
            </div>
          </div>

          <div className="space-y-6">
            {violationDistribution?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                  <span className="text-sm font-bold text-slate-700">{item.category}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Approval Efficiency</h3>
          <div className="space-y-4">
            {approvalEfficiency?.map((item, idx) => (
              <div key={idx} className="space-y-2 border border-slate-100 p-4 rounded-2xl">
                <div 
                  className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => toggleEff(item.id)}
                >
                  <div className="flex items-center gap-2">
                    {item.children && item.children.length > 0 ? (
                      <span className={`material-symbols-outlined text-[16px] transition-transform ${expandedEff[item.id] ? 'rotate-180' : ''}`}>expand_more</span>
                    ) : <span className="w-4"></span>}
                    <span>{item.category}</span>
                  </div>
                  <span>{item.accuracy}% Accuracy</span>
                </div>
                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${item.accuracy}%` }}></div>
                </div>
                
                {/* Children */}
                {expandedEff[item.id] && item.children && item.children.length > 0 && (
                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-4 pl-6">
                    {item.children.map((child, cIdx) => (
                      <div key={cIdx} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <span>{child.category}</span>
                          <span>{child.accuracy}% Accuracy</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400" style={{ width: `${child.accuracy}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Recent Penalties</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="w-[40%] pb-4">Shop</th>
                  <th className="w-[30%] pb-4">Action</th>
                  <th className="w-[30%] pb-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecentPenalties?.map((penalty, idx) => {
                  let actionColor = 'bg-slate-100 text-slate-500';
                  if (penalty.action?.includes('locked') || penalty.action?.includes('hidden')) actionColor = 'bg-red-50 text-[#dc2626]';
                  else if (penalty.action?.includes('warning')) actionColor = 'bg-orange-50 text-[#f59e0b]';
                  
                  return (
                    <tr key={idx}>
                      <td className="py-4 font-bold text-sm text-slate-700">{penalty.shopName}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 ${actionColor} text-[10px] font-black rounded-full uppercase tracking-widest`}>
                          {penalty.action?.replace('_', ' ') || 'Action Taken'}
                        </span>
                      </td>
                      <td className="py-4 text-right text-xs text-slate-400 font-medium">{penalty.date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Top Violating Shops</h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="w-[35%] pb-4">Shop Name</th>
                  <th className="w-[20%] pb-4">Reports</th>
                  <th className="w-[25%] pb-4">Risk Level</th>
                  <th className="w-[20%] pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold text-sm">
                {filteredTopViolatingShops?.map((shop, idx) => {
                  let riskColor = 'bg-[#16a34a]'; 
                  let statusColor = 'text-[#16a34a]';
                  if (shop.riskLevel >= 70) {
                    riskColor = 'bg-[#ba1a1a]'; 
                    statusColor = 'text-[#ba1a1a]';
                  } else if (shop.riskLevel >= 40) {
                    riskColor = 'bg-[#f59e0b]'; 
                    statusColor = 'text-[#f59e0b]';
                  }
                  return (
                    <tr key={idx}>
                      <td className="py-4 text-slate-700">{shop.shopName}</td>
                      <td className="py-4 text-slate-600">{shop.reports}</td>
                      <td className="py-4">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${riskColor}`} style={{ width: `${shop.riskLevel}%` }}></div>
                        </div>
                      </td>
                      <td className={`py-4 text-right`}>
                        <span className={`text-[10px] font-black ${statusColor} uppercase`}>{shop.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Category Compliance</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Metrics</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="w-[35%] pb-4">Category</th>
                  <th className="w-[20%] pb-4">Auto-Pass</th>
                  <th className="w-[25%] pb-4">Manual Review</th>
                  <th className="w-[20%] pb-4 text-right">Trust Score</th>
                </tr>
              </thead>
              <tbody className="font-bold text-sm">
                {categoryCompliance?.map((cat, idx) => {
                  const trustValue = parseFloat(cat.trustScore);
                  const trustColor = trustValue >= 9 ? 'text-[#16a34a]' : 'text-[#f59e0b]';
                  const hasChildren = cat.children && cat.children.length > 0;
                  
                  return (
                    <React.Fragment key={idx}>
                      <tr className={`border-b border-slate-50 ${hasChildren ? 'cursor-pointer hover:bg-slate-50' : ''}`} onClick={() => hasChildren && toggleComp(cat.id)}>
                        <td className="py-4 text-slate-700 flex items-center gap-2">
                          {hasChildren ? (
                            <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${expandedComp[cat.id] ? 'rotate-180' : ''}`}>expand_more</span>
                          ) : (
                            <span className="w-[16px]"></span>
                          )}
                          {cat.category}
                        </td>
                        <td className="py-4 text-slate-600">{cat.autoPass}</td>
                        <td className="py-4 text-slate-600">{cat.manualReview}</td>
                        <td className={`py-4 text-right ${trustColor}`}>{cat.trustScore}/10</td>
                      </tr>
                      {expandedComp[cat.id] && hasChildren && cat.children.map((child, cIdx) => {
                        const cTrustValue = parseFloat(child.trustScore);
                        const cTrustColor = cTrustValue >= 9 ? 'text-[#16a34a]' : 'text-[#f59e0b]';
                        return (
                          <tr key={`${idx}-${cIdx}`} className="bg-slate-50/50 border-b border-slate-50/50">
                            <td className="py-3 pl-10 text-slate-500 text-xs">{child.category}</td>
                            <td className="py-3 text-slate-400 text-xs">{child.autoPass}</td>
                            <td className="py-3 text-slate-400 text-xs">{child.manualReview}</td>
                            <td className={`py-3 text-right text-xs ${cTrustColor}`}>{child.trustScore}/10</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Revenue Intelligence</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audit-ready shop performance & commission metrics</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={handleExportCSV} className="px-5 py-2.5 bg-[#1D6F42] text-white text-[10px] font-black rounded-xl hover:bg-[#155231] transition-all flex items-center gap-2 shadow-lg shadow-green-100">
              <span className="material-symbols-outlined text-sm">grid_on</span>
              Download Excel (.csv)
            </button>
            <button onClick={handlePrint} className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              Financial Summary
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-[10%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">Shop ID</th>
                <th className="w-[20%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100">Shop Name</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 text-right">GMV (Revenue)</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 text-right">Commission (5%)</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 text-center">Orders</th>
                <th className="w-[10%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 text-right">Growth</th>
                <th className="w-[15%] px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-sm">
              {(filteredFinancialIntelligence?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || []).map((f, idx) => {
                const isPositiveGrowth = f.growth?.startsWith('+');
                const isZeroGrowth = f.growth === '0.0%';
                let growthColor = isPositiveGrowth ? 'text-[#16a34a]' : 'text-[#dc2626]';
                let growthIcon = isPositiveGrowth ? 'trending_up' : 'trending_down';
                if (isZeroGrowth) {
                  growthColor = 'text-[#16a34a]';
                  growthIcon = 'trending_flat';
                }

                let auditColor = 'bg-slate-100 text-slate-500';
                if (f.auditStatus === 'Verified') auditColor = 'bg-green-50 text-[#16a34a]';
                else if (f.auditStatus === 'Pending Audit') auditColor = 'bg-orange-50 text-[#f59e0b]';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 text-slate-400 text-xs font-mono">{f.shopId?.toUpperCase()}</td>
                    <td className="px-6 py-5 text-slate-900">{f.shopName}</td>
                    <td className="px-6 py-5 text-right font-black text-primary">${f.gmv?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-6 py-5 text-right text-[#16a34a]">${f.commission?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-6 py-5 text-center text-slate-600">{f.orders?.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right">
                      <div className={`flex items-center justify-end gap-1 ${growthColor}`}>
                        <span className="material-symbols-outlined text-sm">{growthIcon}</span>
                        <span>{f.growth}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-2.5 py-1 ${auditColor} text-[10px] font-black rounded-lg uppercase`}>{f.auditStatus}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/50 font-black">
                <td colSpan="2" className="px-6 py-5 text-[10px] text-slate-900 uppercase">Total Period Metrics</td>
                <td className="px-6 py-5 text-right text-primary text-base">
                  ${filteredFinancialIntelligence?.reduce((acc, curr) => acc + (curr.gmv || 0), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="px-6 py-5 text-right text-[#16a34a] text-base">
                  ${filteredFinancialIntelligence?.reduce((acc, curr) => acc + (curr.commission || 0), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="px-6 py-5 text-center text-slate-900">
                  {filteredFinancialIntelligence?.reduce((acc, curr) => acc + (curr.orders || 0), 0).toLocaleString()}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-8 print:hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {financialIntelligence?.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} - {Math.min(currentPage * rowsPerPage, financialIntelligence?.length || 0)} of {financialIntelligence?.length || 0} performance records</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: Math.ceil((financialIntelligence?.length || 0) / rowsPerPage) || 1 }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${currentPage === page ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-400 hover:text-primary shadow-sm'}`}
              >
                {page}
              </button>
            ))}
            <button disabled={currentPage === Math.ceil((financialIntelligence?.length || 0) / rowsPerPage)} onClick={() => setCurrentPage(p => Math.min(Math.ceil((financialIntelligence?.length || 0) / rowsPerPage), p + 1))} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-50">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerStatistics;
