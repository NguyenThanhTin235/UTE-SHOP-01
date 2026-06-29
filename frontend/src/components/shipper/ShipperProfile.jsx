import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ShipperProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/shipper/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserData(res.data.data.user);
        setProfileData(res.data.data.profile);
        setFormData({
          fullName: res.data.data.user.fullName || '',
          phone: res.data.data.user.phone || '',
          gender: res.data.data.user.gender || '',
          dob: res.data.data.user.dob ? res.data.data.user.dob.split('T')[0] : '',
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
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await axios.put('http://localhost:5000/api/shipper/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUserData(res.data.data.user);
        setProfileData(res.data.data.profile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: userData?.fullName || '',
      phone: userData?.phone || '',
      gender: userData?.gender || '',
      dob: userData?.dob ? userData.dob.split('T')[0] : '',
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

  const vehicleTypeLabels = {
    motorbike: 'Xe máy',
    bicycle: 'Xe đạp',
    car: 'Ô tô',
    van: 'Xe tải nhỏ'
  };

  const vehicleTypeIcons = {
    motorbike: 'two_wheeler',
    bicycle: 'pedal_bike',
    car: 'directions_car',
    van: 'local_shipping'
  };

  const statusBadge = (status) => {
    const map = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Đang hoạt động' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Chờ duyệt' },
      suspended: { bg: 'bg-red-50', text: 'text-red-700', label: 'Đã tạm ngưng' }
    };
    const s = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {s.label}
      </span>
    );
  };

  const InfoRow = ({ icon, label, value, field, type = 'text', options, placeholder }) => (
    <div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-slate-500 text-[20px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        {editing && field ? (
          type === 'select' ? (
            <select
              value={formData[field] || ''}
              onChange={e => handleChange(field, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all"
            >
              {options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={formData[field] || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder || label}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#004ac6]/20 focus:border-[#004ac6] outline-none transition-all"
            />
          )
        ) : (
          <p className="text-sm font-bold text-slate-900 truncate">{value || '—'}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-10 max-w-[1280px] mx-auto w-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-[1280px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900">Shipper Profile</h2>
        <div className="flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] text-white rounded-xl text-sm font-bold hover:bg-[#003da6] transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'check'}</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] text-white rounded-xl text-sm font-bold hover:bg-[#003da6] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-gradient-to-r from-[#004ac6] to-[#0066ff] rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute -right-5 -bottom-10 w-28 h-28 bg-white/5 rounded-full"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black backdrop-blur-sm border border-white/30">
            {userData?.fullName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black tracking-tight">{userData?.fullName || 'Shipper'}</h3>
            <p className="text-white/70 text-sm font-medium mt-1">{userData?.email}</p>
            <div className="flex items-center gap-4 mt-3">
              {statusBadge(profileData?.profileStatus)}
              {profileData?.joinedDate && (
                <span className="text-white/60 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Joined {new Date(profileData.joinedDate).toLocaleDateString('vi-VN')}
                </span>
              )}
              <span className="text-white/60 text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">{vehicleTypeIcons[profileData?.vehicleType] || 'two_wheeler'}</span>
                {vehicleTypeLabels[profileData?.vehicleType] || 'Xe máy'} • {profileData?.vehiclePlate || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#004ac6]">person</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Personal Information</h3>
          </div>
          <InfoRow icon="badge" label="Full Name" value={userData?.fullName} field="fullName" placeholder="Họ và tên" />
          <InfoRow icon="mail" label="Email" value={userData?.email} />
          <InfoRow icon="call" label="Phone Number" value={userData?.phone || formData.phone} field="phone" placeholder="Số điện thoại" />
          <InfoRow
            icon="wc"
            label="Gender"
            value={userData?.gender === 'male' ? 'Nam' : userData?.gender === 'female' ? 'Nữ' : userData?.gender === 'other' ? 'Khác' : ''}
            field="gender"
            type="select"
            options={[
              { value: '', label: '-- Chọn giới tính --' },
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
              { value: 'other', label: 'Khác' }
            ]}
          />
          <InfoRow icon="cake" label="Date of Birth" value={userData?.dob ? new Date(userData.dob).toLocaleDateString('vi-VN') : ''} field="dob" type="date" />
        </div>

        {/* Vehicle & Work Information */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">two_wheeler</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vehicle & Work</h3>
          </div>
          <InfoRow
            icon="category"
            label="Vehicle Type"
            value={vehicleTypeLabels[profileData?.vehicleType] || ''}
            field="vehicleType"
            type="select"
            options={[
              { value: 'motorbike', label: 'Xe máy' },
              { value: 'bicycle', label: 'Xe đạp' },
              { value: 'car', label: 'Ô tô' },
              { value: 'van', label: 'Xe tải nhỏ' }
            ]}
          />
          <InfoRow icon="confirmation_number" label="License Plate" value={profileData?.vehiclePlate} field="vehiclePlate" placeholder="VD: 59F1-12345" />
          <InfoRow icon="local_shipping" label="Shipping Company" value={profileData?.shippingCompany} field="shippingCompany" placeholder="VD: GHN, GHTK, Tự do" />
          <InfoRow icon="location_on" label="Operating Area" value={profileData?.operatingArea} field="operatingArea" placeholder="VD: TP.HCM - Quận 1, 3, 5" />
          <InfoRow icon="id_card" label="CCCD/CMND Number" value={profileData?.cccdNumber} field="cccdNumber" placeholder="Số CCCD/CMND" />
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600">emergency</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Emergency Contact</h3>
          </div>
          <InfoRow icon="person" label="Contact Name" value={profileData?.emergencyContactName} field="emergencyContactName" placeholder="Tên người liên hệ khẩn cấp" />
          <InfoRow icon="call" label="Contact Phone" value={profileData?.emergencyContact} field="emergencyContact" placeholder="Số điện thoại khẩn cấp" />
        </div>

        {/* Bank Information */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">account_balance</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bank Information</h3>
          </div>
          <InfoRow icon="assured_workload" label="Bank Name" value={profileData?.bankName} field="bankName" placeholder="Tên ngân hàng" />
          <InfoRow icon="person" label="Account Holder" value={profileData?.bankAccountName} field="bankAccountName" placeholder="Tên chủ tài khoản" />
          <InfoRow icon="pin" label="Account Number" value={profileData?.bankAccountNumber} field="bankAccountNumber" placeholder="Số tài khoản" />
        </div>
      </div>
    </div>
  );
};

export default ShipperProfile;
