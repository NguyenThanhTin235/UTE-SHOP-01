import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const DashboardShipperInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [shippingPartners, setShippingPartners] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'shipper') {
      navigate('/');
      return;
    }
    fetchProfile();
    fetchShippingPartners();
  }, [user, navigate]);

  const fetchShippingPartners = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/public/shipping-partners');
      if (res.data.success) {
        setShippingPartners(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load shipping partners:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/shipper/profile', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setProfileData(res.data.data.profile);
        setFormData({
          cccdNumber: res.data.data.profile.cccdNumber || '',
          vehicleType: res.data.data.profile.vehicleType || 'motorbike',
          vehiclePlate: res.data.data.profile.vehiclePlate || '',
          shippingCompany: res.data.data.profile.shippingCompany || '',
          operatingArea: res.data.data.profile.operatingArea || '',
          emergencyContact: res.data.data.profile.emergencyContact || '',
          emergencyContactName: res.data.data.profile.emergencyContactName || '',
          bankName: res.data.data.profile.bankName || '',
          bankAccountName: res.data.data.profile.bankAccountName || '',
          bankAccountNumber: res.data.data.profile.bankAccountNumber || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load shipper profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.put('http://localhost:5000/api/shipper/profile', formData, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setProfileData(res.data.data.profile);
        setEditing(false);
        toast.success('Shipper profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      cccdNumber: profileData?.cccdNumber || '',
      vehicleType: profileData?.vehicleType || 'motorbike',
      vehiclePlate: profileData?.vehiclePlate || '',
      shippingCompany: profileData?.shippingCompany || '',
      operatingArea: profileData?.operatingArea || '',
      emergencyContact: profileData?.emergencyContact || '',
      emergencyContactName: profileData?.emergencyContactName || '',
      bankName: profileData?.bankName || '',
      bankAccountName: profileData?.bankAccountName || '',
      bankAccountNumber: profileData?.bankAccountNumber || ''
    });
    setEditing(false);
  };

  const avatarSrc = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="h-20 bg-white border-b border-[#c3c6d7]/30 flex items-center px-4 md:px-10 sticky top-0 z-40 shadow-sm">
        <button onClick={() => navigate('/shipper')} className="flex items-center gap-2 text-[#434655] hover:text-primary transition-colors font-bold cursor-pointer">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Dashboard
        </button>
      </header>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* SideNavBar */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c3c6d7]/30 mb-2 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                <img src={avatarSrc} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-[#131b2e] tracking-tight truncate">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-[#434655]">{user?.tier || 'Standard Member'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-left">
            <Link to="/shipper/profile" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span>Personal Profile</span>
            </Link>
            <Link to="/shipper/info" className="flex items-center px-4 py-3 space-x-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
              <span>Shipper Information</span>
            </Link>
            <Link to="/shipper/security" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">security</span>
              <span>Security Settings</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full">
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden border border-[#c3c6d7]/30">
            <div className="p-8 border-b border-[#c3c6d7]/30 text-left flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#131b2e] tracking-tight">Shipper Information</h1>
                <p className="text-sm text-[#434655] mt-2">Manage your vehicle details, operating area, and banking information.</p>
              </div>
              {editing ? (
                <div className="flex gap-3">
                  <button onClick={handleCancel} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit Info
                </button>
              )}
            </div>
            
            <div className="p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-[#434655]">Loading information...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  
                  {/* Vehicle & Work */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Vehicle & Work</h3>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Vehicle Type</label>
                      {editing ? (
                        <select 
                          value={formData.vehicleType} 
                          onChange={e => handleChange('vehicleType', e.target.value)}
                          className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="motorbike">Motorbike</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                      ) : (
                        <p className="text-base font-bold text-slate-900 capitalize">{profileData?.vehicleType || '—'}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">License Plate</label>
                      {editing ? (
                        <input type="text" value={formData.vehiclePlate} onChange={e => handleChange('vehiclePlate', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.vehiclePlate || '—'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Shipping Company</label>
                      {editing ? (
                        <select 
                          value={formData.shippingCompany} 
                          onChange={e => handleChange('shippingCompany', e.target.value)}
                          className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Select a shipping company</option>
                          {shippingPartners.map(partner => (
                            <option key={partner._id || partner.id} value={partner.name}>{partner.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.shippingCompany || '—'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Operating Area</label>
                      {editing ? (
                        <input type="text" value={formData.operatingArea} onChange={e => handleChange('operatingArea', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.operatingArea || '—'}</p>
                      )}
                    </div>
                  </div>

                  {/* Identity & Emergency */}
                  <div className="flex flex-col gap-5">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Identity & Emergency</h3>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">CCCD / ID Number</label>
                      {editing ? (
                        <input type="text" value={formData.cccdNumber} onChange={e => handleChange('cccdNumber', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.cccdNumber || '—'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Emergency Contact Name</label>
                      {editing ? (
                        <input type="text" value={formData.emergencyContactName} onChange={e => handleChange('emergencyContactName', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.emergencyContactName || '—'}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Emergency Contact Phone</label>
                      {editing ? (
                        <input type="text" value={formData.emergencyContact} onChange={e => handleChange('emergencyContact', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                      ) : (
                        <p className="text-base font-bold text-slate-900">{profileData?.emergencyContact || '—'}</p>
                      )}
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="flex flex-col gap-5 md:col-span-2 mt-4 pt-8 border-t border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Bank Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Bank Name</label>
                        {editing ? (
                          <input type="text" value={formData.bankName} onChange={e => handleChange('bankName', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                        ) : (
                          <p className="text-base font-bold text-slate-900">{profileData?.bankName || '—'}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Holder</label>
                        {editing ? (
                          <input type="text" value={formData.bankAccountName} onChange={e => handleChange('bankAccountName', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                        ) : (
                          <p className="text-base font-bold text-slate-900">{profileData?.bankAccountName || '—'}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Number</label>
                        {editing ? (
                          <input type="text" value={formData.bankAccountNumber} onChange={e => handleChange('bankAccountNumber', e.target.value)} className="w-full bg-white border border-[#c3c6d7] rounded-lg p-3 text-sm font-bold text-[#131b2e] focus:ring-2 focus:ring-primary outline-none" />
                        ) : (
                          <p className="text-base font-bold text-slate-900">{profileData?.bankAccountNumber || '—'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardShipperInfo;
