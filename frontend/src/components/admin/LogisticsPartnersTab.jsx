import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LogisticsPartnersTab = ({ searchTerm, setAddPartnerTrigger }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPartnerId, setCurrentPartnerId] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Uploader state
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/logistics', getHeaders());
      if (res.data && res.data.success) {
        setPartners(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch logistics partners error:', err);
      toast.error('Failed to load logistics partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const resetForm = () => {
    setName('');
    setCode('');
    setShippingFee(0);
    setAvatarUrl('');
    setIsActive(true);
    setCurrentPartnerId(null);
    setIsEditing(false);
  };

  const handleOpenAddModal = useCallback(() => {
    setName('');
    setCode('');
    setShippingFee(0);
    setAvatarUrl('');
    setIsActive(true);
    setCurrentPartnerId(null);
    setIsEditing(false);
    setShowModal(true);
  }, []);

  useEffect(() => {
    setAddPartnerTrigger(() => handleOpenAddModal);
    return () => setAddPartnerTrigger(null);
  }, [setAddPartnerTrigger, handleOpenAddModal]);

  const handleOpenEditModal = (partner) => {
    setName(partner.name);
    setCode(partner.code);
    setShippingFee(partner.shippingFee || partner.shipping_fee || 0);
    setAvatarUrl(partner.avatarUrl || partner.avatar_url || '');
    setIsActive(partner.isActive !== undefined ? partner.isActive : partner.is_active);
    setCurrentPartnerId(partner.id || partner._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('Only image files (JPG, PNG, WEBP) are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/admin/logistics/upload',
        formData,
        {
          headers: {
            ...getHeaders().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      if (res.data && res.data.success) {
        setAvatarUrl(res.data.data.url);
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Partner Name is required');
    if (!code.trim()) return toast.error('Partner Code is required');
    if (Number(shippingFee) < 0) return toast.error('Shipping fee cannot be negative');

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      shipping_fee: Number(shippingFee),
      avatar_url: avatarUrl,
      is_active: isActive
    };

    try {
      if (isEditing) {
        const res = await axios.put(
          `http://localhost:5000/api/admin/logistics/${currentPartnerId}`,
          payload,
          getHeaders()
        );
        if (res.data && res.data.success) {
          toast.success('Logistics partner updated successfully');
          setShowModal(false);
          fetchPartners();
        }
      } else {
        const res = await axios.post(
          'http://localhost:5000/api/admin/logistics',
          payload,
          getHeaders()
        );
        if (res.data && res.data.success) {
          toast.success('Logistics partner added successfully');
          setShowModal(false);
          fetchPartners();
        }
      }
    } catch (err) {
      console.error('Save logistics partner error:', err);
      toast.error(err.response?.data?.message || 'Failed to save logistics partner');
    }
  };

  const handleToggleStatus = async (partner) => {
    const partnerId = partner.id || partner._id;
    const currentStatus = partner.isActive !== undefined ? partner.isActive : partner.is_active;
    const nextStatus = !currentStatus;

    try {
      const res = await axios.put(
        `http://localhost:5000/api/admin/logistics/${partnerId}`,
        { is_active: nextStatus },
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success(`Partner status updated to ${nextStatus ? 'Active' : 'Inactive'}`);
        // Optimize local state update directly
        setPartners(prev => prev.map(p => {
          const pId = p.id || p._id;
          if (pId === partnerId) {
            return { ...p, is_active: nextStatus, isActive: nextStatus };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      toast.error('Failed to change partner status');
    }
  };

  const handleDelete = async (partner) => {
    const partnerId = partner.id || partner._id;
    if (!window.confirm(`Are you sure you want to delete "${partner.name}"?`)) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/admin/logistics/${partnerId}`,
        getHeaders()
      );
      if (res.data && res.data.success) {
        toast.success('Logistics partner deleted successfully');
        fetchPartners();
      }
    } catch (err) {
      console.error('Delete logistics partner error:', err);
      // Display the specific database integrity restriction message returned from server
      toast.error(err.response?.data?.message || 'Failed to delete partner');
    }
  };

  // Filter partners by search term
  const filteredPartners = partners.filter(p => {
    const term = searchTerm ? searchTerm.toLowerCase().trim() : '';
    if (!term) return true;
    return p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">local_shipping</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Logistics Management</h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Configure and monitor platform delivery carriers and rates</p>
          </div>
        </div>
      </div>

      {/* Partners List Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 animate-pulse">local_shipping</span>
          <h3 className="text-base font-black text-slate-800">No logistics partners found</h3>
          <p className="text-slate-400 text-xs mt-1 font-semibold max-w-sm">
            {searchTerm ? 'Try tweaking your search term to match names or codes.' : 'Get started by creating a new shipping carrier partner.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {filteredPartners.map((partner) => {
            const isPartnerActive = partner.isActive !== undefined ? partner.isActive : partner.is_active;
            const fee = partner.shippingFee !== undefined ? partner.shippingFee : (partner.shipping_fee || 0);
            
            return (
              <div
                key={partner.id || partner._id}
                className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between w-full sm:w-[380px]"
              >
                <div>
                  {/* Top row: Status & Actions */}
                  <div className="flex justify-between items-center mb-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isPartnerActive
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                    >
                      {isPartnerActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(partner)}
                        title="Edit Partner"
                        className="size-8 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(partner)}
                        title="Delete Partner"
                        className="size-8 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Logo and Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
                      {(partner.avatarUrl || partner.avatar_url) ? (
                        <img
                          src={partner.avatarUrl || partner.avatar_url}
                          alt={partner.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-slate-400">
                          {partner.name.substr(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                        {partner.name}
                      </h4>
                      <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5">
                        {partner.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Base Fee per km
                    </span>
                    <span className="text-base font-black text-slate-900 mt-0.5">
                      {fee.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">₫</span>
                    </span>
                  </div>
                  {/* Status Quick Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Active</span>
                    <button
                      onClick={() => handleToggleStatus(partner)}
                      className={`w-9 h-5 rounded-full relative cursor-pointer transition-all duration-200 outline-none ${
                        isPartnerActive ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`size-3.5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200 ${
                          isPartnerActive ? 'left-[18px]' : 'left-[2.5px]'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  {isEditing ? 'edit' : 'local_shipping'}
                </span>
                {isEditing ? 'Edit Partner Details' : 'Register New Partner'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {/* Logo Uploader */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">Logo / Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className="size-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden relative shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Logo Preview" className="size-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl">image</span>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <div className="animate-spin rounded-full size-5 border-2 border-t-transparent border-primary"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Upload Image
                      </button>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5">Max size 5MB. JPG, PNG, WEBP formats.</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">Partner Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Giao Hàng Tiết Kiệm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-primary focus:border-primary transition-all outline-none"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">Partner Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. GHTK"
                    disabled={isEditing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-primary focus:border-primary transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {!isEditing && (
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Unique identifier code. Usually abbreviated (e.g. VNPOST, GRAB).</p>
                  )}
                </div>

                {/* Shipping Fee */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">Base Fee per km (VND)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value)}
                      placeholder="e.g. 30000"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-sm font-bold focus:ring-primary focus:border-primary transition-all outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₫</span>
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-[10px] text-primary font-bold mt-1">
                      Preview: {Number(shippingFee).toLocaleString('vi-VN')} ₫
                    </p>
                  )}
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div>
                    <span className="text-xs font-black text-slate-700 block">Carrier Status</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Allow users to choose this carrier on checkout</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(prev => !prev)}
                    className={`w-9 h-5 rounded-full relative cursor-pointer transition-all duration-200 outline-none ${
                      isActive ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all duration-200 ${
                        isActive ? 'left-[18px]' : 'left-[2.5px]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-[#003da6] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsPartnersTab;
