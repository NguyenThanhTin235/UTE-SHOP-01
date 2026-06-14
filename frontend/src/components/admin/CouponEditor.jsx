import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CouponEditor = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract ID from pathname: /admin/promotions/coupon/edit/:id
  const pathParts = location.pathname.split('/').filter(Boolean);
  const couponId = mode === 'edit' ? pathParts[4] : null;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percent', // 'percent', 'fixed_amount', 'free_shipping'
    value: 0,
    max_discount: '',
    min_order_total: 0,
    usage_limit: 1000,
    user_limit: 1, // Usage limit per User from template
    platform: 'All Platforms', // Applied Platform from template
    status: 'active',
    start_at: '',
    end_at: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (mode === 'edit' && couponId) {
      setLoading(true);
      axios.get(`http://localhost:5000/api/admin/promotions/coupons/${couponId}`, getHeaders())
        .then(res => {
          if (res.data && res.data.success) {
            const c = res.data.data;
            setFormData({
              name: c.name || `Voucher ${c.code}`,
              code: c.code,
              type: c.type,
              value: c.value,
              max_discount: c.maxDiscount || '',
              min_order_total: c.minOrderTotal || 0,
              usage_limit: c.usageLimit || 1000,
              user_limit: c.userLimit || 1,
              platform: c.platform || 'All Platforms',
              status: c.status,
              start_at: c.startAt ? c.startAt.slice(0, 10) : '',
              end_at: c.endAt ? c.endAt.slice(0, 10) : ''
            });
          }
        })
        .catch(err => {
          console.error('Fetch coupon error:', err);
          toast.error('Failed to load coupon details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [mode, couponId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'active' : 'inactive') : value
    }));
  };

  const handleGenerateCode = (e) => {
    e.preventDefault();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SUMMER';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || formData.value === undefined) {
      toast.error('Coupon code and value are required');
      return;
    }

    setSaving(true);
    const payload = {
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      value: Number(formData.value),
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      min_order_total: Number(formData.min_order_total),
      usage_limit: Number(formData.usage_limit),
      user_limit: Number(formData.user_limit),
      platform: formData.platform,
      status: formData.status,
      start_at: formData.start_at || null,
      end_at: formData.end_at || null,
      name: formData.name // Send name to backend as helper field
    };

    try {
      if (mode === 'edit') {
        const res = await axios.put(`http://localhost:5000/api/admin/promotions/coupons/${couponId}`, payload, getHeaders());
        if (res.data && res.data.success) {
          toast.success('Coupon updated successfully');
          navigate('/admin/promotions');
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/admin/promotions/coupons', payload, getHeaders());
        if (res.data && res.data.success) {
          toast.success('Coupon created successfully');
          navigate('/admin/promotions');
        }
      }
    } catch (err) {
      console.error('Save coupon error:', err);
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-w-0">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/promotions')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              {mode === 'edit' ? 'Edit Coupon' : 'Coupon Editor'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Promotion Management / {mode === 'edit' ? 'Edit Coupon' : 'New Coupon'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/promotions')}
            className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-all cursor-pointer"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Form Body */}
      <div className="p-10 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Main Configuration */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">
                Voucher Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Voucher Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Summer Mega Sale 2024"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Coupon Code <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="SUMMER50K"
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl pl-4 pr-20 py-3 text-sm font-black text-primary focus:ring-primary uppercase transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-blue-700 font-bold text-[10px] uppercase cursor-pointer animate-pulse"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Discount Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                    >
                      <option value="percent">Percentage Off (%)</option>
                      <option value="fixed_amount">Fixed Amount (VND)</option>
                      <option value="free_shipping">Free Shipping</option>
                      <option value="fixed_shipping">Fixed Shipping Discount (VND)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Discount Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="value"
                        value={formData.value}
                        onChange={handleChange}
                        placeholder="15"
                        disabled={formData.type === 'free_shipping'}
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all disabled:opacity-50"
                        min="0"
                        required={formData.type !== 'free_shipping'}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        {formData.type === 'percent' ? '%' : 'VND'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Maximum Discount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="max_discount"
                        value={formData.max_discount}
                        onChange={handleChange}
                        placeholder="50000"
                        disabled={formData.type !== 'percent'}
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all disabled:opacity-50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VND</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">
                Usage Restrictions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Minimum Spend
                  </label>
                  <input
                    type="number"
                    name="min_order_total"
                    value={formData.min_order_total}
                    onChange={handleChange}
                    placeholder="250000"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Usage Limit per User
                  </label>
                  <input
                    type="number"
                    name="user_limit"
                    value={formData.user_limit}
                    onChange={handleChange}
                    placeholder="1"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Total Budget Limit
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    placeholder="1000"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Applied Platform
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                  >
                    <option value="All Platforms">All Platforms</option>
                    <option value="App Only">App Only</option>
                    <option value="Web Only">Web Only</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Meta & Publishing */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publishing Status</h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-bold text-slate-700">Active Status</span>
                <div className="relative inline-block w-10 h-5 align-middle select-none">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={handleChange}
                    className="sr-only peer"
                    id="status-toggle"
                  />
                  <label
                    htmlFor="status-toggle"
                    className="block overflow-hidden h-5 rounded-full bg-slate-200 peer-checked:bg-success cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"
                  ></label>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    name="start_at"
                    value={formData.start_at}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="end_at"
                    value={formData.end_at}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </section>

            <section className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Editor Note</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Global coupons are applied at the final checkout stage. Ensure the budget is sufficient for the expected
                traffic during peak hours.
              </p>
            </section>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CouponEditor;
