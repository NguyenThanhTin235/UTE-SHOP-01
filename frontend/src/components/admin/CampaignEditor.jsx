import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Helper to build a tree structure from categories
const buildCategoryTree = (flatList) => {
  const map = {};
  const roots = [];

  flatList.forEach(cat => {
    const id = cat.id || cat._id;
    if (id) {
      map[id] = { ...cat, children: [] };
    }
  });

  flatList.forEach(cat => {
    const id = cat.id || cat._id;
    if (!id) return;

    const parentId = cat.parentId || cat.parent_id;
    if (parentId) {
      const parentIdStr = typeof parentId === 'object' ? (parentId.id || parentId._id || parentId.toString()) : parentId;
      const parent = map[parentIdStr];
      if (parent) {
        parent.children.push(map[id]);
      } else {
        roots.push(map[id]);
      }
    } else {
      roots.push(map[id]);
    }
  });

  return roots;
};

// Helper to flatten the category tree back to an array with depth information
const flattenCategoryTree = (tree, depth = 0) => {
  let result = [];
  tree.forEach(node => {
    result.push({
      ...node,
      depth: depth
    });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenCategoryTree(node.children, depth + 1));
    }
  });
  return result;
};

const CampaignEditor = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract ID from pathname: /admin/promotions/campaign/edit/:id
  const pathParts = location.pathname.split('/').filter(Boolean);
  const campaignId = mode === 'edit' ? pathParts[4] : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'All Categories', // Target Category from template
    discount_logic: 'Percentage (%) per item', // Discount Logic from template
    type: 'Mass Discount',
    value: 0,
    start_at: '',
    end_at: '',
    status: 'active',
    banner_url: ''
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product selector modal states
  const [showModal, setShowModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalProducts, setModalProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSelectedIds, setModalSelectedIds] = useState([]);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    // Fetch categories
    axios.get('http://localhost:5000/api/public/categories')
      .then(res => {
        if (res.data && res.data.success) {
          const tree = buildCategoryTree(res.data.data);
          const flattened = flattenCategoryTree(tree);
          setCategories(flattened);
        }
      })
      .catch(err => console.error('Fetch categories error:', err));

    if (mode === 'edit' && campaignId) {
      setLoading(true);
      axios.get(`http://localhost:5000/api/admin/promotions/campaigns/${campaignId}`, getHeaders())
        .then(res => {
          if (res.data && res.data.success) {
            const { campaign, products } = res.data.data;
            setFormData({
              name: campaign.name,
              description: campaign.description || '',
              category: campaign.category || 'All Categories',
              discount_logic: campaign.discount_logic || 'Percentage (%) per item',
              type: campaign.type || 'Mass Discount',
              value: campaign.value || 0,
              start_at: campaign.startAt ? campaign.startAt.slice(0, 16) : '',
              end_at: campaign.endAt ? campaign.endAt.slice(0, 16) : '',
              status: campaign.status,
              banner_url: campaign.bannerUrl || ''
            });
            // Deduplicate products to prevent any double selection issues
            const uniqueProducts = [];
            const seenIds = new Set();
            products.forEach(p => {
              const id = String(p.id || p._id);
              if (!seenIds.has(id)) {
                seenIds.add(id);
                uniqueProducts.push(p);
              }
            });
            setSelectedProducts(uniqueProducts);
            setModalSelectedIds(Array.from(seenIds));
          }
        })
        .catch(err => {
          console.error('Fetch campaign details error:', err);
          toast.error('Failed to load campaign');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [mode, campaignId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cloudinary Banner upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('banner', file);

    const toastId = toast.loading('Uploading banner image...');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const res = await axios.post('http://localhost:5000/api/admin/promotions/upload-banner', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data && res.data.success) {
        setFormData(prev => ({ ...prev, banner_url: res.data.data.url }));
        toast.success('Banner uploaded successfully', { id: toastId });
      }
    } catch (err) {
      console.error('Upload banner error:', err);
      toast.error('Failed to upload image banner', { id: toastId });
    }
  };

  // Load products in Modal
  const loadModalProducts = async () => {
    setModalLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/promotions/products?q=${modalSearch}&category_id=${modalCategory}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        setModalProducts(res.data.data);
      }
    } catch (err) {
      console.error('Load modal products error:', err);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadModalProducts();
    }
  }, [showModal, modalSearch, modalCategory]);

  const handleToggleProductInModal = (product) => {
    const prodId = String(product.id || product._id);
    setModalSelectedIds(prev => {
      const prevStrings = prev.map(id => String(id));
      if (prevStrings.includes(prodId)) {
        setSelectedProducts(current => current.filter(p => String(p.id || p._id) !== prodId));
        return prev.filter(id => String(id) !== prodId);
      } else {
        // Double check to prevent duplicates in selectedProducts
        setSelectedProducts(current => {
          const exists = current.some(p => String(p.id || p._id) === prodId);
          if (exists) return current;
          return [...current, product];
        });
        return [...prev, prodId];
      }
    });
  };

  const handleRemoveProduct = (productId) => {
    const targetId = String(productId);
    setSelectedProducts(prev => prev.filter(p => String(p.id || p._id) !== targetId));
    setModalSelectedIds(prev => prev.filter(id => String(id) !== targetId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_at || !formData.end_at) {
      toast.error('Please enter name, start time and end time');
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      discount_logic: formData.discount_logic,
      type: formData.discount_logic === 'Combo (Buy 1 Get 1)' ? 'combo' : 'discount',
      value: Number(formData.value),
      start_at: new Date(formData.start_at).toISOString(),
      end_at: new Date(formData.end_at).toISOString(),
      status: formData.status,
      banner_url: formData.banner_url,
      productIds: modalSelectedIds
    };

    try {
      if (mode === 'edit') {
        const res = await axios.put(`http://localhost:5000/api/admin/promotions/campaigns/${campaignId}`, payload, getHeaders());
        if (res.data && res.data.success) {
          toast.success('Campaign updated successfully');
          navigate('/admin/promotions');
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/admin/promotions/campaigns', payload, getHeaders());
        if (res.data && res.data.success) {
          toast.success('Campaign launched successfully');
          navigate('/admin/promotions');
        }
      }
    } catch (err) {
      console.error('Save campaign error:', err);
      toast.error('Failed to save campaign details');
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
              {mode === 'edit' ? 'Edit Campaign' : 'Campaign Editor'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Campaign Management / {mode === 'edit' ? 'Edit Program' : 'New Program'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/promotions')}
            className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Processing...' : mode === 'edit' ? 'Save Changes' : 'Launch Campaign'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="p-10 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Side: Campaign Details & Selected Products */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">
                Program Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Campaign Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. 6.6 Super Flash Sale"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Campaign Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the purpose of this campaign..."
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Target Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                    >
                      <option value="All Categories">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id || c._id} value={c.name}>
                          {c.depth > 0 ? '\u00A0\u00A0'.repeat(c.depth) + '↳ ' : ''}{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Discount Logic
                    </label>
                    <select
                      name="discount_logic"
                      value={formData.discount_logic}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all"
                    >
                      <option value="Percentage (%) per item">Percentage (%) per item</option>
                      <option value="Fixed Amount (VND) reduction">Fixed Amount (VND) reduction</option>
                      <option value="Combo (Buy 1 Get 1)">Combo (Buy 1 Get 1)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Discount Value / Percentage (%) / Fixed Amount (VND)
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    min="0"
                    disabled={formData.discount_logic === 'Combo (Buy 1 Get 1)'}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </section>

            {/* Included Products List */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Included Products</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toast.success('Mock bulk upload successful: 5 products processed')}
                    className="text-slate-400 text-xs font-black uppercase tracking-widest hover:underline cursor-pointer"
                  >
                    Bulk Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="text-primary text-xs font-black uppercase tracking-widest hover:underline cursor-pointer"
                  >
                    + Add Manually
                  </button>
                </div>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="size-16 rounded-full bg-white flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">No products selected</h4>
                  <p className="text-xs text-slate-500 font-medium mb-6">You can filter products by category or upload a CSV file.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => toast.success('Mock bulk upload successful: 5 products processed')}
                      className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Bulk Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-100 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      Select Products
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Original Price</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promo Price</th>
                        <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProducts.map(prod => {
                        const prodId = prod.id || prod._id;
                        const promoPrice = formData.discount_logic === 'Combo (Buy 1 Get 1)'
                          ? prod.sellingPrice
                          : formData.discount_logic === 'Fixed Amount (VND) reduction'
                          ? Math.max(0, prod.sellingPrice - formData.value)
                          : Math.round(prod.sellingPrice * (1 - formData.value / 100));

                        return (
                          <tr key={prodId} className="group">
                            <td className="py-3 text-sm font-bold text-slate-700">{prod.name}</td>
                            <td className="py-3 text-sm font-semibold text-slate-400 line-through">
                              {prod.mrpPrice ? `${prod.mrpPrice.toLocaleString()}₫` : `${prod.sellingPrice.toLocaleString()}₫`}
                            </td>
                            <td className="py-3 text-sm font-black text-error">
                              {formData.discount_logic === 'Combo (Buy 1 Get 1)' ? 'BOGO' : `${promoPrice?.toLocaleString()}₫`}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(prodId)}
                                className="text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right Side: Schedule & Banner Upload */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduling</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="start_at"
                    value={formData.start_at}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="end_at"
                    value={formData.end_at}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-primary transition-all"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-level-1 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Promotion Banner</h3>

              {formData.banner_url ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 group">
                  <img
                    src={formData.banner_url}
                    alt="Campaign Banner"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <label className="px-4 py-2 bg-white text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 group cursor-pointer hover:border-primary transition-all">
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all text-3xl mb-2">
                    add_photo_alternate
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Upload Banner
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-[9px] text-slate-400 font-medium italic">Recommended size: 1200x400px</p>
            </section>

            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
              <span className="material-symbols-outlined text-orange-600">warning</span>
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                Mass discounts will override individual product pricing for the duration of the campaign.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Select Campaign Products</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-6 border-b border-slate-100 flex gap-4 shrink-0">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-primary focus:border-primary"
                />
              </div>
              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-primary focus:border-primary"
              >
                <option value="">All Categories</option>
                {categories.map(cat => {
                  const id = cat.id || cat._id;
                  return (
                    <option key={id} value={id}>
                      {cat.depth > 0 ? '\u00A0\u00A0'.repeat(cat.depth) + '↳ ' : ''}{cat.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Modal Products List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : modalProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No active products found</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {modalProducts.map(prod => {
                    const prodId = prod.id || prod._id;
                    return (
                      <div
                        key={prodId}
                        onClick={() => handleToggleProductInModal(prod)}
                        className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-all"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">{prod.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            {prod.categoryId?.name} | {prod.sellingPrice?.toLocaleString()}₫
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={modalSelectedIds.includes(prodId)}
                          onChange={() => {}}
                          className="rounded border-slate-200 text-primary focus:ring-primary pointer-events-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md cursor-pointer"
              >
                Confirm Selection ({modalSelectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default CampaignEditor;
