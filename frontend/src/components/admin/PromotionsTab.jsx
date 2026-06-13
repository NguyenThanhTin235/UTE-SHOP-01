import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PromotionsTab = ({ searchTerm }) => {
  const navigate = useNavigate();
  const isScrollingRef = useRef(false);
  const [activeSubTab, setActiveSubTab] = useState('coupons'); // 'coupons', 'mass_discounts', 'flash_deals'
  const [stats, setStats] = useState({
    activeCoupons: 0,
    ongoingCampaigns: 0,
    discountVolume: 0,
    roiEfficiency: 3.2
  });
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Pagination & Search states
  const [couponPage, setCouponPage] = useState(1);
  const [couponTotalPages, setCouponTotalPages] = useState(1);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatus, setCouponStatus] = useState('all');
  const [campaignStatus, setCampaignStatus] = useState('all');

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/promotions/stats', getHeaders());
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/promotions/coupons?page=${couponPage}&limit=2&search=${couponSearch || searchTerm}&status=${couponStatus}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        setCoupons(res.data.data);
        if (res.data.meta && res.data.meta.pagination) {
          const totalCoupons = res.data.meta.pagination.total;
          const calculatedTotalPages = Math.ceil(totalCoupons / 2);
          setCouponTotalPages(calculatedTotalPages || 1);
        }
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
      toast.error('Failed to load coupons');
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/promotions/campaigns?limit=100&search=${searchTerm}&status=${campaignStatus}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Fetch campaigns error:', err);
      toast.error('Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [couponPage, couponSearch, searchTerm, couponStatus]);

  useEffect(() => {
    fetchCampaigns();
  }, [searchTerm, campaignStatus]);

  const handleToggleCouponStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/promotions/coupons/${id}/status`,
        { status: nextStatus },
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success(`Coupon status updated to ${nextStatus}`);
        fetchCoupons();
        fetchStats();
      }
    } catch (err) {
      console.error('Toggle coupon status error:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/admin/promotions/coupons/${id}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await axios.delete(
        `http://localhost:5000/api/admin/promotions/campaigns/${id}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success('Campaign deleted successfully');
        fetchCampaigns();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete campaign error:', err);
      toast.error('Failed to delete campaign');
    }
  };

  // Helper to format discount volume like '12.4M' or '20K'
  const formatVolume = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'K';
    }
    return val.toString();
  };

  // Helper to calculate days remaining
  const getExpiresText = (endAt) => {
    if (!endAt) return 'No Expiration';
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff < 0) return 'Ended';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Expires in ${days} days`;
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.scrollTo({
          top: el.offsetTop - 140,
          behavior: 'smooth'
        });
      } else {
        const offset = 140; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleTabClick = (tabId, sectionId) => {
    isScrollingRef.current = true;
    setActiveSubTab(tabId);
    scrollToSection(sectionId);
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  };

  useEffect(() => {
    const mainContent = document.querySelector('main');
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const sec1 = document.getElementById('coupons-section');
      const sec2 = document.getElementById('mass-discounts-section');
      const sec3 = document.getElementById('flash-deals-section');
      
      const scrollPos = mainContent ? mainContent.scrollTop : window.scrollY;
      
      // Check if scrolled to bottom
      const scrollHeight = mainContent ? mainContent.scrollHeight : document.documentElement.scrollHeight;
      const clientHeight = mainContent ? mainContent.clientHeight : window.innerHeight;
      const isAtBottom = scrollHeight - scrollPos - clientHeight < 50;

      if (isAtBottom && sec3) {
        setActiveSubTab('flash_deals');
      } else if (sec3 && sec3.offsetTop - 200 <= scrollPos) {
        setActiveSubTab('flash_deals');
      } else if (sec2 && sec2.offsetTop - 200 <= scrollPos) {
        setActiveSubTab('mass_discounts');
      } else if (sec1) {
        setActiveSubTab('coupons');
      }
    };

    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const massDiscounts = campaigns.filter(c => c.type !== 'Flash Sale');
  const flashDeals = campaigns.filter(c => c.type === 'Flash Sale');

  return (
    <div className="space-y-10 max-w-7xl mx-auto w-full pb-20">
      {/* Actions & Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 sticky top-20 bg-[#F8FAFC]/95 backdrop-blur-sm z-30 pt-4">
        <div className="flex gap-8">
          <button
            onClick={() => handleTabClick('coupons', 'coupons-section')}
            className={`px-2 py-4 text-sm font-black tracking-tight transition-all uppercase cursor-pointer ${
              activeSubTab === 'coupons'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            Global Coupons
          </button>
          <button
            onClick={() => handleTabClick('mass_discounts', 'mass-discounts-section')}
            className={`px-2 py-4 text-sm font-black tracking-tight transition-all uppercase cursor-pointer ${
              activeSubTab === 'mass_discounts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            Mass Discounts
          </button>
          <button
            onClick={() => handleTabClick('flash_deals', 'flash-deals-section')}
            className={`px-2 py-4 text-sm font-black tracking-tight transition-all uppercase cursor-pointer ${
              activeSubTab === 'flash_deals'
                ? 'text-primary border-b-2 border-primary'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            Flash Deals
          </button>
        </div>
        
        <div className="flex gap-4 pb-2">
          <button
            onClick={() => navigate('/admin/promotions/coupon/new')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Voucher
          </button>
          <button
            onClick={() => navigate('/admin/promotions/campaign/new')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-200 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Campaign
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            </div>
            <span className="text-xs font-black text-success">+12% vs LW</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Coupons</p>
            <h4 className="text-3xl font-black text-slate-900">{stats.activeCoupons}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <span className="text-xs font-black text-slate-400">Live now</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ongoing Campaigns</p>
            <h4 className="text-3xl font-black text-slate-900">
              {stats.ongoingCampaigns < 10 ? `0${stats.ongoingCampaigns}` : stats.ongoingCampaigns}
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <span className="text-xs font-black text-slate-400">Total Applied</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Discount Volume</p>
            <h4 className="text-3xl font-black text-slate-900">
              {formatVolume(stats.discountVolume)} <span className="text-xs font-bold text-slate-400 ml-1">VND</span>
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="size-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <span className="text-xs font-black text-success">8.4% Conversion</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ROI Efficiency</p>
            <h4 className="text-3xl font-black text-slate-900">{stats.roiEfficiency}x</h4>
          </div>
        </div>
      </div>

      {/* Global Coupons Section */}
      <div id="coupons-section" className="space-y-6 scroll-mt-28">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Global Platform Coupons</h2>
          
          <div className="flex items-center gap-3">
            {/* Pagination buttons < and > */}
            <div className="flex items-center gap-2 mr-2">
              <button
                disabled={couponPage === 1}
                onClick={() => setCouponPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              <span className="text-xs font-black text-slate-500 min-w-[32px] text-center select-none">
                {couponPage}/{couponTotalPages}
              </span>

              <button
                disabled={couponPage === couponTotalPages}
                onClick={() => setCouponPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search coupon code..."
                value={couponSearch}
                onChange={(e) => {
                  setCouponSearch(e.target.value);
                  setCouponPage(1);
                }}
                className="bg-white border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:ring-primary w-64 transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <select
                value={couponStatus}
                onChange={(e) => {
                  setCouponStatus(e.target.value);
                  setCouponPage(1);
                }}
                className="bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:border-primary transition-all cursor-pointer appearance-none font-bold"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-base">expand_more</span>
            </div>
          </div>
        </div>

        {couponsLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((coupon) => {
              const isExpired = coupon.endAt && new Date(coupon.endAt) < new Date();
              const displayStatus = isExpired ? 'Expired' : coupon.status;
              const isInactive = displayStatus !== 'active';

              return (
                <div
                  key={coupon.id}
                  className={`coupon-card bg-white rounded-3xl border border-slate-200 shadow-level-1 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isInactive ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div
                    className={`p-6 border-b border-dashed relative ${
                      isInactive
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className="absolute -left-3 top-full -translate-y-1/2 w-6 h-6 rounded-full bg-[#F8FAFC]"></div>
                    <div className="absolute -right-3 top-full -translate-y-1/2 w-6 h-6 rounded-full bg-[#F8FAFC]"></div>

                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-white ${
                          isExpired
                            ? 'bg-slate-400'
                            : isInactive
                            ? 'bg-slate-400'
                            : 'bg-primary'
                        }`}
                      >
                        {isExpired ? 'Expired' : coupon.name || 'Site-wide Voucher'}
                      </div>
                      
                      {!isExpired && (
                        <div className="relative inline-block w-8 h-4 align-middle select-none">
                          <input
                            type="checkbox"
                            checked={coupon.status === 'active'}
                            onChange={() => handleToggleCouponStatus(coupon.id, coupon.status)}
                            className="sr-only peer"
                            id={`toggle-${coupon.id}`}
                          />
                          <label
                            htmlFor={`toggle-${coupon.id}`}
                            className="block overflow-hidden h-4 rounded-full bg-slate-200 peer-checked:bg-success cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"
                          ></label>
                        </div>
                      )}
                    </div>
                    <h3 className={`text-2xl font-black mb-1 ${isInactive ? 'text-slate-500' : 'text-primary'}`}>
                      {coupon.code}
                    </h3>
                    <p className={`text-sm font-bold ${isInactive ? 'text-slate-400' : 'text-slate-600'}`}>
                      {coupon.type === 'percent'
                        ? `Save ${coupon.value}% - Max ${coupon.maxDiscount?.toLocaleString()}₫`
                        : coupon.type === 'free_shipping'
                        ? `Free shipping - Min spend ${coupon.minOrderTotal?.toLocaleString()}₫`
                        : coupon.type === 'fixed_shipping'
                        ? `Save ${coupon.value?.toLocaleString()}₫ shipping fee - Min spend ${coupon.minOrderTotal?.toLocaleString()}₫`
                        : `Save ${coupon.value?.toLocaleString()}₫ - Min spend ${coupon.minOrderTotal?.toLocaleString()}₫`}
                    </p>
                  </div>

                  <div className="p-6 flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Min Spend</p>
                        <p className="text-xs font-black text-slate-700">{coupon.minOrderTotal?.toLocaleString()}₫</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Uses</p>
                        <p className="text-xs font-black text-slate-700">{coupon.usageLimit} Users</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 uppercase tracking-widest">Usage Progress</span>
                        <span className="font-black text-primary">
                          {isExpired ? `${coupon.usedCount} Redeemed` : `${coupon.usedCount} / ${coupon.usageLimit}`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isExpired ? 'bg-slate-300' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-300 text-sm">
                          {isExpired ? 'event_busy' : 'schedule'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {isExpired ? 'Ended' : getExpiresText(coupon.endAt)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/promotions/coupon/edit/${coupon.id}`)}
                          className="text-primary text-xs font-black hover:underline cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-500 text-xs font-black hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Placeholder */}
            <button
              onClick={() => navigate('/admin/promotions/coupon/new')}
              className="rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 hover:border-primary hover:bg-blue-50/30 transition-all group min-h-[300px] cursor-pointer"
            >
              <div className="size-14 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all mb-4">
                <span className="material-symbols-outlined text-3xl">add_circle</span>
              </div>
              <span className="text-sm font-black text-slate-500 group-hover:text-primary tracking-tight">
                Generate Coupon Code
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Mass Discounts Section */}
      <div id="mass-discounts-section" className="bg-white rounded-3xl border border-slate-200 shadow-level-1 overflow-hidden scroll-mt-28">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Mass Discount Programs</h2>
            <p className="text-sm text-slate-500 font-medium">Platform-wide price reductions by category or product tags.</p>
          </div>
          <div className="relative">
            <select
              value={campaignStatus}
              onChange={(e) => setCampaignStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:border-primary transition-all cursor-pointer appearance-none font-bold"
            >
              <option value="all">All Campaigns</option>
              <option value="active">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {campaignsLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied To</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Range</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {massDiscounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                        No campaigns found
                      </td>
                    </tr>
                  ) : (
                    massDiscounts.map((camp) => {
                      const now = new Date();
                      const isExpired = new Date(camp.endAt) < now;
                      const isLive = new Date(camp.startAt) <= now && !isExpired;
                      
                      let statusText = 'Scheduled';
                      let statusBg = 'bg-success/10 text-success';
                      let dotColor = 'bg-success';
                      
                      if (camp.status === 'inactive') {
                        statusText = 'Inactive';
                        statusBg = 'bg-slate-100 text-slate-500';
                        dotColor = 'bg-slate-400';
                      } else if (isExpired) {
                        statusText = 'Expired';
                        statusBg = 'bg-red-50 text-red-500';
                        dotColor = 'bg-red-400';
                      } else if (isLive) {
                        statusText = 'Running';
                        statusBg = 'bg-primary/10 text-primary';
                        dotColor = 'bg-primary';
                      }
                      
                      const isInactiveOrExpired = camp.status === 'inactive' || isExpired;
                      const isFlash = camp.type === 'Flash Sale';
                      const iconColorClass = isFlash 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-blue-50 text-blue-600';
                      const iconName = isFlash ? 'bolt' : 'checkroom';

                      return (
                        <tr key={camp.id} className={`hover:bg-slate-50/50 transition-all group ${isInactiveOrExpired ? 'opacity-60 grayscale' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                <span className="material-symbols-outlined text-xl">{iconName}</span>
                              </div>
                              <span className="text-sm font-black text-slate-700">{camp.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {camp.appliedCategories && camp.appliedCategories.length > 0 ? (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                {camp.appliedCategories[0]}
                                {camp.appliedCategories.length > 1 ? ` +${camp.appliedCategories.length - 1} categories` : ''}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                All Categories
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-primary">
                                {camp.value > 0 ? `Up to ${camp.value}% OFF` : 'Flat 20% OFF'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Mass Mark-down
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700">
                                {new Date(camp.startAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - {new Date(camp.endAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : camp.status === 'inactive' ? 'text-slate-500' : isLive ? 'text-primary' : 'text-success'}`}>
                                {isExpired ? 'Ended' : camp.status === 'inactive' ? 'Inactive' : isLive ? 'Active' : 'Scheduled'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${statusBg}`}>
                              <span className={`size-1.5 rounded-full ${dotColor} ${statusText === 'Running' ? 'animate-pulse' : ''}`}></span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/admin/promotions/campaign/edit/${camp.id}`)}
                              className="p-2 text-slate-400 hover:text-primary transition-all inline-block cursor-pointer"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-2 text-slate-400 hover:text-error transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                Total {massDiscounts.length} Campaigns
              </p>
            </div>
          </>
        )}
      </div>

      {/* Flash Deals Section */}
      <div id="flash-deals-section" className="bg-white rounded-3xl border border-slate-200 shadow-level-1 overflow-hidden scroll-mt-28">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Flash Deals</h2>
            <p className="text-sm text-slate-500 font-medium">Limited-time high-discount promotions.</p>
          </div>
          <div className="relative">
            <select
              value={campaignStatus}
              onChange={(e) => setCampaignStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:border-primary transition-all cursor-pointer appearance-none font-bold"
            >
              <option value="all">All Campaigns</option>
              <option value="active">Live</option>
              <option value="scheduled">Scheduled</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-base">expand_more</span>
          </div>
        </div>

        {campaignsLoading ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied To</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Range</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flashDeals.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                        No flash deals found
                      </td>
                    </tr>
                  ) : (
                    flashDeals.map((camp) => {
                      const now = new Date();
                      const isExpired = new Date(camp.endAt) < now;
                      const isLive = new Date(camp.startAt) <= now && !isExpired;
                      
                      let statusText = 'Scheduled';
                      let statusBg = 'bg-success/10 text-success';
                      let dotColor = 'bg-success';
                      
                      if (camp.status === 'inactive') {
                        statusText = 'Inactive';
                        statusBg = 'bg-slate-100 text-slate-500';
                        dotColor = 'bg-slate-400';
                      } else if (isExpired) {
                        statusText = 'Expired';
                        statusBg = 'bg-red-50 text-red-500';
                        dotColor = 'bg-red-400';
                      } else if (isLive) {
                        statusText = 'Running';
                        statusBg = 'bg-primary/10 text-primary';
                        dotColor = 'bg-primary';
                      }
                      
                      const isInactiveOrExpired = camp.status === 'inactive' || isExpired;
                      const isFlash = camp.type === 'Flash Sale';
                      const iconColorClass = isFlash 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-blue-50 text-blue-600';
                      const iconName = isFlash ? 'bolt' : 'checkroom';

                      return (
                        <tr key={camp.id} className={`hover:bg-slate-50/50 transition-all group ${isInactiveOrExpired ? 'opacity-60 grayscale' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
                                <span className="material-symbols-outlined text-xl">{iconName}</span>
                              </div>
                              <span className="text-sm font-black text-slate-700">{camp.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {camp.appliedCategories && camp.appliedCategories.length > 0 ? (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                {camp.appliedCategories[0]}
                                {camp.appliedCategories.length > 1 ? ` +${camp.appliedCategories.length - 1} categories` : ''}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                All Categories
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-error">
                                {camp.value > 0 ? `Up to ${camp.value}% OFF` : 'Flat 20% OFF'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Direct Price Reduction
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700">
                                {new Date(camp.startAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - {new Date(camp.endAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : camp.status === 'inactive' ? 'text-slate-500' : isLive ? 'text-primary' : 'text-success'}`}>
                                {isExpired ? 'Ended' : camp.status === 'inactive' ? 'Inactive' : isLive ? 'Active' : 'Scheduled'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${statusBg}`}>
                              <span className={`size-1.5 rounded-full ${dotColor} ${statusText === 'Running' ? 'animate-pulse' : ''}`}></span>
                              <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/admin/promotions/campaign/edit/${camp.id}`)}
                              className="p-2 text-slate-400 hover:text-primary transition-all inline-block cursor-pointer"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-2 text-slate-400 hover:text-error transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                Total {flashDeals.length} Flash Deals
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PromotionsTab;
