import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FABGroup from '../components/FABGroup';

const Promotions = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'percent', 'fixed'
  const [copiedCode, setCopiedCode] = useState('');

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const [campaignsRes, couponsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/public/campaigns', config),
        axios.get('http://localhost:5000/api/public/coupons', config)
      ]);

      if (campaignsRes.data.success) {
        setCampaigns(campaignsRes.data.data || []);
      }
      if (couponsRes.data.success) {
        setCoupons(couponsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Failed to load promotions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code: ${code}`);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  // Filter coupons based on tab selection
  const filteredCoupons = coupons.filter(coupon => {
    if (activeTab === 'all') return true;
    if (activeTab === 'percent') return coupon.type === 'percent';
    if (activeTab === 'fixed') return coupon.type === 'fixed_amount';
    return true;
  });

  const formatPrice = (value) => {
    return value?.toLocaleString('vi-VN') + '₫';
  };

  const getRemainingDays = (endDateStr) => {
    if (!endDateStr) return null;
    const diffTime = new Date(endDateStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-[1280px] mx-auto w-full px-4 md:px-10 pt-24 pb-32">
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden mb-16 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-800 text-white p-8 md:p-16 shadow-[0px_10px_30px_rgba(99,102,241,0.2)]">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 max-w-2xl text-left">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
              Summer Special Offer
            </span>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
              Hottest Vouchers & <br/> Infinite Savings
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed">
              Discover the biggest promotions from top trusted brands. Apply voucher codes at checkout to get discounts up to 50%.
            </p>
            <a href="#vouchers" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-2xl font-black text-sm hover:scale-105 hover:shadow-lg active:scale-95 transition-all shadow-md">
              <span className="material-symbols-outlined text-[20px]">local_activity</span>
              Explore Vouchers
            </a>
          </div>
        </section>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
            <p className="text-sm font-bold text-[#505f76] animate-pulse">Loading promotion programs...</p>
          </div>
        ) : (
          <>
            {/* Active Campaigns Section */}
            {campaigns.length > 0 && (
              <section className="mb-20 text-left">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Featured Promotional Campaigns</h2>
                  <div className="flex-grow h-px bg-[#c3c6d7]/30"></div>
                </div>

                <div className="flex flex-col gap-12">
                  {campaigns.map((camp) => {
                    const daysLeft = getRemainingDays(camp.endAt);
                    return (
                      <div key={camp.id} className="bg-white rounded-3xl p-6 md:p-8 border border-[#c3c6d7]/20 shadow-[0px_4px_25px_rgba(15,23,42,0.03)] flex flex-col lg:flex-row gap-8 items-start">
                        {/* Campaign Banner & Details */}
                        <div className="w-full lg:w-5/12 space-y-6">
                          <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#c3c6d7]/20 relative shadow-inner">
                            <img 
                              src={camp.bannerUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600'} 
                              alt={camp.name} 
                              className="w-full h-full object-cover"
                            />
                            {daysLeft !== null && (
                              <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] text-amber-400">schedule</span>
                                <span>{daysLeft} days left</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                              Up to {camp.value}% discount
                            </span>
                            <h3 className="text-xl md:text-2xl font-black text-[#131b2e] leading-tight">{camp.name}</h3>
                            <p className="text-xs md:text-sm text-[#505f76] leading-relaxed">{camp.description}</p>
                          </div>
                        </div>

                        {/* Campaign Target Products */}
                        <div className="w-full lg:w-7/12 space-y-4">
                          <h4 className="font-extrabold text-sm text-[#505f76] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-blue-600">inventory_2</span>
                            Eligible Campaign Products
                          </h4>
                          
                          {camp.products && camp.products.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {camp.products.slice(0, 6).map((item) => (
                                <Link 
                                  to={`/product/${item.slug}`} 
                                  key={item.id} 
                                  className="group flex flex-col bg-[#faf8ff] hover:bg-white rounded-2xl p-3 border border-[#c3c6d7]/10 hover:border-blue-600/30 hover:shadow-md transition-all text-left"
                                >
                                  <div className="aspect-square rounded-xl overflow-hidden bg-white mb-3">
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                    />
                                  </div>
                                  <h5 className="font-bold text-xs text-[#131b2e] line-clamp-2 min-h-[32px] leading-tight group-hover:text-blue-700 transition-colors">
                                    {item.name}
                                  </h5>
                                  <div className="flex items-baseline gap-1 mt-2 flex-wrap">
                                    <span className="text-xs font-black text-blue-700">{item.sellingPrice?.toLocaleString()}₫</span>
                                    {item.mrpPrice > item.sellingPrice && (
                                      <span className="text-[10px] text-[#737686] line-through">
                                        {item.mrpPrice?.toLocaleString()}₫
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 text-center bg-[#faf8ff] rounded-2xl border border-dashed border-[#c3c6d7]/40">
                              <p className="text-xs text-[#737686] italic">Currently no products are assigned to this campaign.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Coupons Section */}
            <section id="vouchers" className="text-left scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 flex-grow">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Voucher Collection</h2>
                  <div className="flex-grow h-px bg-[#c3c6d7]/30"></div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-[#c3c6d7]/30 self-start md:self-auto shadow-sm">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#505f76] hover:text-blue-600'}`}
                  >
                    All Vouchers
                  </button>
                  <button 
                    onClick={() => setActiveTab('percent')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'percent' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#505f76] hover:text-blue-600'}`}
                  >
                    Percentage Deals
                  </button>
                  <button 
                    onClick={() => setActiveTab('fixed')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'fixed' ? 'bg-blue-600 text-white shadow-sm' : 'text-[#505f76] hover:text-blue-600'}`}
                  >
                    Fixed Discounts
                  </button>
                </div>
              </div>

              {filteredCoupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCoupons.map((coupon) => {
                    const daysLeft = getRemainingDays(coupon.endAt);
                    const isPercentage = coupon.type === 'percent';
                    const isFreeship = coupon.type === 'free_shipping' || coupon.code === 'FREESHIP';
                    
                    return (
                      <div 
                        key={coupon.id} 
                        className={`bg-white rounded-2xl border border-[#c3c6d7]/20 shadow-[0px_4px_20px_rgba(15,23,42,0.03)] overflow-hidden flex relative group hover:border-blue-600/30 hover:shadow-md transition-all min-h-[140px] ${
                          coupon.isUsed ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Coupon Left Part: Graphic / Icon */}
                        <div className={`w-28 flex flex-col items-center justify-center text-white p-3 relative ${isFreeship ? 'bg-emerald-600' : (isPercentage ? 'bg-gradient-to-br from-blue-700 to-indigo-600' : 'bg-gradient-to-br from-violet-700 to-purple-600')}`}>
                          {/* Ticket jagged edge simulator */}
                          <div className="absolute top-0 bottom-0 -right-1 w-2 flex flex-col justify-between py-1 z-10">
                            {[...Array(8)].map((_, i) => (
                              <div key={i} className="w-2 h-2 bg-white rounded-full -mr-1"></div>
                            ))}
                          </div>
                          <span className="material-symbols-outlined text-3xl mb-1 animate-pulse">
                            {isFreeship ? 'local_shipping' : (isPercentage ? 'percent' : 'payments')}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/90">
                            {isFreeship ? 'Shipping' : (isPercentage ? 'Percent %' : 'Fixed Cash')}
                          </span>
                        </div>

                        {/* Coupon Right Part: Details */}
                        <div className="flex-1 p-4 flex flex-col justify-between items-start text-left pl-6">
                          <div className="space-y-1 w-full">
                            <h3 className="font-black text-sm text-[#131b2e] leading-snug line-clamp-1">
                              {coupon.type === 'free_shipping' 
                                ? 'Free shipping on order'
                                : coupon.type === 'fixed_shipping'
                                ? `Save ${formatPrice(coupon.value)} on shipping`
                                : (isPercentage ? `Save ${coupon.value}% on order` : `Save ${formatPrice(coupon.value)}`)}
                            </h3>
                            <p className="text-[11px] text-[#505f76] font-medium leading-normal">
                              Min Spend: <span className="font-extrabold text-[#131b2e]">{formatPrice(coupon.minOrderTotal)}</span>
                            </p>
                            {coupon.maxDiscount && isPercentage && (
                              <p className="text-[11px] text-[#505f76] font-medium leading-normal">
                                Max Discount: <span className="font-extrabold text-[#131b2e]">{formatPrice(coupon.maxDiscount)}</span>
                              </p>
                            )}
                          </div>

                          <div className="w-full flex items-center justify-between pt-3 border-t border-[#c3c6d7]/10 mt-2">
                            <div className="text-left">
                              <p className="text-[12px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wide">
                                {coupon.code}
                              </p>
                              {daysLeft !== null && (
                                <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  <span>{daysLeft} days left</span>
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => {
                                if (coupon.isUsed) return;
                                handleCopyCode(coupon.code);
                              }}
                              disabled={coupon.isUsed}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                                coupon.isUsed 
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                  : copiedCode === coupon.code 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-primary text-white hover:opacity-90 shadow-sm cursor-pointer'
                              }`}
                            >
                              {coupon.isUsed ? 'Used' : copiedCode === coupon.code ? 'Copied' : 'Copy Code'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-[#c3c6d7]/30 shadow-sm">
                  <span className="material-symbols-outlined text-4xl text-[#737686] mb-2">confirmation_number</span>
                  <p className="text-sm font-bold text-[#505f76]">No vouchers found under this category.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <FABGroup />
      <Footer />
    </div>
  );
};

export default Promotions;
