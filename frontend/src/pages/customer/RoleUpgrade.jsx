import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import FABGroup from '../../components/FABGroup';
import { logout } from '../../redux/authSlice';

const RoleUpgrade = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('seller'); // 'seller' or 'shipper'
  const [statusData, setStatusData] = useState({ seller: null, shipper: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);

  // Form states
  const [sellerForm, setSellerForm] = useState({
    gst_number: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    pickup_address: ''
  });
  const [sellerFiles, setSellerFiles] = useState({ identity_card: null, business_license: null });

  const [shipperForm, setShipperForm] = useState({
    cccd_number: '',
    vehicle_type: 'motorbike',
    vehicle_plate: '',
    shipping_company: '',
    operating_area: '',
    emergency_contact: '',
    emergency_contact_name: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: ''
  });
  const [shipperFiles, setShipperFiles] = useState({ cccd_front: null, cccd_back: null });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchUpgradeStatus();
    }
  }, [user, navigate]);

  const fetchUpgradeStatus = async () => {
    try {
      setIsFetchingStatus(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users/role-upgrades/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusData(response.data.data);
      
      // Prepopulate form data if exists
      if (response.data.data.seller) {
        const seller = response.data.data.seller;
        setSellerForm({
            bank_name: seller.bank_name || '',
            bank_account_name: seller.bank_account_name || '',
            bank_account_number: seller.bank_account_number || '',
            gst_number: seller.gst_number || '',
            pickup_address: seller.pickup_address || ''
        });
      }
      if (response.data.data.shipper) {
        const shipper = response.data.data.shipper;
        setShipperForm({
            cccd_number: shipper.cccd_number || '',
            vehicle_type: shipper.vehicle_type || 'motorbike',
            vehicle_plate: shipper.vehicle_plate || '',
            shipping_company: shipper.shipping_company || '',
            operating_area: shipper.operating_area || '',
            emergency_contact: shipper.emergency_contact || '',
            emergency_contact_name: shipper.emergency_contact_name || '',
            bank_name: shipper.bank_name || '',
            bank_account_name: shipper.bank_account_name || '',
            bank_account_number: shipper.bank_account_number || ''
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingStatus(false);
    }
  };

  const handleSellerSubmit = async (e) => {
    e.preventDefault();
    
    // Check files
    const hasIdentityCard = sellerFiles.identity_card || statusData?.seller?.identity_card_url;
    const hasBusinessLicense = sellerFiles.business_license || statusData?.seller?.business_license_url;

    if (!statusData.seller || statusData.seller.status === 'rejected') {
        if (!hasIdentityCard || !hasBusinessLicense) {
            return toast.error('Please provide Identity Card and Business License.');
        }
    }

    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      Object.keys(sellerForm).forEach(key => formData.append(key, sellerForm[key]));
      if (sellerFiles.identity_card) formData.append('identity_card', sellerFiles.identity_card);
      if (sellerFiles.business_license) formData.append('business_license', sellerFiles.business_license);

      const res = await axios.post('http://localhost:5000/api/users/role-upgrades/seller', formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data.message);
      fetchUpgradeStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipperSubmit = async (e) => {
    e.preventDefault();

    const hasCccdFront = shipperFiles.cccd_front || statusData?.shipper?.cccd_front_url;
    const hasCccdBack = shipperFiles.cccd_back || statusData?.shipper?.cccd_back_url;

    if (!statusData.shipper || statusData.shipper.status === 'rejected') {
        if (!hasCccdFront || !hasCccdBack) {
            return toast.error('Please provide front and back images of your Identity Card.');
        }
    }

    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      Object.keys(shipperForm).forEach(key => formData.append(key, shipperForm[key]));
      if (shipperFiles.cccd_front) formData.append('cccd_front', shipperFiles.cccd_front);
      if (shipperFiles.cccd_back) formData.append('cccd_back', shipperFiles.cccd_back);

      const res = await axios.post('http://localhost:5000/api/users/role-upgrades/shipper', formData, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data.message);
      fetchUpgradeStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setIsLoading(false);
    }
  };

  const onLogout = (e) => {
    e.preventDefault();
    dispatch(logout());
    navigate('/login');
  };

  const renderStatus = (statusData) => {
    if (!statusData) return null;
    if (statusData.status === 'pending') {
        return null;
    }
    if (statusData.status === 'rejected') {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <div>
                    <h4 className="font-bold">Request Rejected</h4>
                    <p className="text-sm">Reason: {statusData.rejection_reason}</p>
                    <p className="text-sm mt-1">You can update your information and resubmit the request below.</p>
                </div>
            </div>
        );
    }
    if (statusData.status === 'active') {
        return (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <div>
                    <h4 className="font-bold">Request Approved</h4>
                    <p className="text-sm">You now have access. Please refresh the page or log in again if you don't see the changes.</p>
                </div>
            </div>
        );
    }
    return null;
  };

  const renderHistory = (statusData) => {
    if (!statusData) return null;
    
    let timeline = [];
    
    // If new history array is present, use it directly
    if (statusData.history && statusData.history.length > 0) {
        timeline = [...statusData.history].map(h => ({ note: h.note, date: h.date }));
    } else {
        // Fallback for legacy requests without history array
        if (statusData.status === 'active') {
          timeline.push({ note: 'Request Approved', date: statusData.updatedAt });
        } else if (statusData.status === 'rejected') {
          timeline.push({ note: `Request Rejected. Reason: ${statusData.rejection_reason}`, date: statusData.updatedAt });
        } else if (statusData.status === 'pending') {
          if (statusData.updatedAt !== statusData.createdAt) {
              timeline.push({ note: 'Request Resubmitted & Pending Approval', date: statusData.updatedAt });
          } else {
              timeline.push({ note: 'Request Pending Approval', date: statusData.createdAt });
          }
        }
    
        if (statusData.status !== 'pending' || statusData.updatedAt !== statusData.createdAt) {
           timeline.push({ note: 'Request Created', date: statusData.createdAt });
        }
    
        if (statusData.past_rejections && statusData.past_rejections.length > 0) {
           statusData.past_rejections.forEach(rej => {
               if (statusData.status === 'rejected' && new Date(rej.rejected_at).getTime() === new Date(statusData.updatedAt).getTime()) {
                   return;
               }
               timeline.push({ note: `Request Rejected. Reason: ${rej.reason}`, date: rej.rejected_at });
           });
        }
    }

    // Sort timeline by date descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (timeline.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-[#c3c6d7]/30">
            <h3 className="text-lg font-extrabold text-[#131b2e] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Approval History
            </h3>
            <div className="bg-[#f2f3ff]/40 rounded-2xl p-5 border border-[#c3c6d7]/10">
                <div className="space-y-6 relative border-l border-primary/20 ml-2.5 pl-6">
                {timeline.map((evt, idx) => (
                    <div key={idx} className="relative text-left">
                    <div className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ${
                        idx === 0 ? 'bg-primary ring-primary/10' : 'bg-gray-300 ring-transparent'
                    }`}></div>
                    <div>
                        <p className={`font-bold text-xs ${idx === 0 ? 'text-[#131b2e]' : 'text-[#434655]'}`}>
                        {evt.note}
                        </p>
                        <p className="text-[10px] text-[#737686] font-medium mt-0.5">
                        {new Date(evt.date).toLocaleString()}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
  };

  const getImageUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
  };

  const avatarSrc = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=004ac6&color=fff`;

  return (
    <Layout>
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8 md:py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* SideNavBar */}
        <aside className="w-full md:w-72 flex flex-col gap-4 md:sticky md:top-24 flex-shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#c3c6d7]/30 mb-2 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                <img src={avatarSrc} alt={user?.fullName || 'Avatar'} className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-[#131b2e] tracking-tight truncate">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-[#434655]">{user?.tier || 'Standard Member'}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-left">
            <Link to="/user/profile" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span>Personal Profile</span>
            </Link>
            <Link to="/order-history" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span>Order History</span>
            </Link>
            <Link to="/reviews" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">star</span>
              <span>My Reviews</span>
            </Link>
            <Link to="/wishlist" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">favorite</span>
              <span>Wishlist</span>
            </Link>
            <Link to="/recently-viewed" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">history</span>
              <span>Recently Viewed</span>
            </Link>
            <Link to="/address-book" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">location_on</span>
              <span>Shipping Address</span>
            </Link>
            <Link to="/coins" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">monetization_on</span>
              <span>My Coins</span>
            </Link>
            <Link to="/user/statistics" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              <span>Statistics</span>
            </Link>
            <Link to="/security" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-primary transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined">security</span>
              <span>Security Settings</span>
            </Link>
            <Link to="/role-upgrade" className="flex items-center px-4 py-3 space-x-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined">upgrade</span>
              <span>Upgrade Role</span>
            </Link>
          </nav>

          <div className="mt-6 pt-4 border-t border-[#c3c6d7]/50 text-left">
            <button onClick={onLogout} className="w-full flex items-center px-4 py-3 space-x-3 text-[#b3261e] hover:bg-[#b3261e]/10 transition-all font-medium rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full">
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden border border-[#c3c6d7]/30">
            <div className="p-8 border-b border-[#c3c6d7]/30 text-left">
              <h1 className="text-3xl font-bold text-[#131b2e] tracking-tight">Upgrade Role</h1>
              <p className="text-sm text-[#434655] mt-2">Register to become a Seller or a Shipper.</p>
            </div>
            
            <div className="p-8">
              {/* Tabs */}
              <div className="flex space-x-4 mb-8 border-b border-[#c3c6d7]/30 pb-2">
                  <button 
                      onClick={() => setActiveTab('seller')}
                      className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'seller' ? 'border-primary text-primary' : 'border-transparent text-[#434655] hover:text-primary'}`}
                  >
                      Register as Seller
                  </button>
                  <button 
                      onClick={() => setActiveTab('shipper')}
                      className={`px-4 py-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'shipper' ? 'border-primary text-primary' : 'border-transparent text-[#434655] hover:text-primary'}`}
                  >
                      Register as Shipper
                  </button>
              </div>

              {isFetchingStatus ? (
                  <div className="flex justify-center p-8">
                      <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                  </div>
              ) : (
                <>
                  {activeTab === 'seller' && (
                    <div className="animate-fade-in text-left">
                        {statusData.shipper?.status === 'active' ? (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-600">error</span>
                                <div>
                                    <h4 className="font-bold">Cannot Register</h4>
                                    <p className="text-sm">You are already an active Shipper. You cannot register as a Seller.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {renderStatus(statusData.seller)}
                                
                                <form onSubmit={handleSellerSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Bank Name</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={sellerForm.bank_name} onChange={(e) => setSellerForm({...sellerForm, bank_name: e.target.value})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Holder Name</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={sellerForm.bank_account_name} onChange={(e) => setSellerForm({...sellerForm, bank_account_name: e.target.value})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Number</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={sellerForm.bank_account_number} onChange={(e) => setSellerForm({...sellerForm, bank_account_number: e.target.value})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">GST Number</label>
                                            <input className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={sellerForm.gst_number} onChange={(e) => setSellerForm({...sellerForm, gst_number: e.target.value})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Pickup Address</label>
                                        <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={sellerForm.pickup_address} onChange={(e) => setSellerForm({...sellerForm, pickup_address: e.target.value})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Identity Card (Front)</label>
                                            <input type="file" accept="image/*" onChange={(e) => setSellerFiles({...sellerFiles, identity_card: e.target.files[0]})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                            {sellerFiles.identity_card ? (
                                                <img src={URL.createObjectURL(sellerFiles.identity_card)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            ) : statusData.seller?.identity_card_url && (
                                                <img src={getImageUrl(statusData.seller.identity_card_url)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Business License</label>
                                            <input type="file" accept="image/*" onChange={(e) => setSellerFiles({...sellerFiles, business_license: e.target.files[0]})} disabled={statusData.seller?.status === 'pending' || statusData.seller?.status === 'active'} className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                            {sellerFiles.business_license ? (
                                                <img src={URL.createObjectURL(sellerFiles.business_license)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            ) : statusData.seller?.business_license_url && (
                                                <img src={getImageUrl(statusData.seller.business_license_url)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            )}
                                        </div>
                                    </div>

                                    {statusData.seller?.status !== 'pending' && statusData.seller?.status !== 'active' && (
                                        <div className="flex justify-end pt-6 mt-6 border-t border-[#c3c6d7]/30">
                                            <button 
                                                type="submit" 
                                                disabled={isLoading} 
                                                className="bg-primary text-white font-bold px-8 py-3 rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {isLoading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : null}
                                                Submit Request
                                            </button>
                                        </div>
                                    )}
                                </form>
                                {renderHistory(statusData.seller)}
                            </>
                        )}
                    </div>
                  )}

                  {activeTab === 'shipper' && (
                    <div className="animate-fade-in text-left">
                        {statusData.seller?.status === 'active' ? (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-600">error</span>
                                <div>
                                    <h4 className="font-bold">Cannot Register</h4>
                                    <p className="text-sm">You are already an active Seller. You cannot register as a Shipper.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {renderStatus(statusData.shipper)}
                                
                                <form onSubmit={handleShipperSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Identity Card Number</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.cccd_number} onChange={(e) => setShipperForm({...shipperForm, cccd_number: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Vehicle Type</label>
                                            <select className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" value={shipperForm.vehicle_type} onChange={(e) => setShipperForm({...shipperForm, vehicle_type: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'}>
                                                <option value="motorbike">Motorbike</option>
                                                <option value="car">Car</option>
                                                <option value="van">Van</option>
                                                <option value="bicycle">Bicycle</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">License Plate</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.vehicle_plate} onChange={(e) => setShipperForm({...shipperForm, vehicle_plate: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Shipping Company</label>
                                            <select className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" value={shipperForm.shipping_company} onChange={(e) => setShipperForm({...shipperForm, shipping_company: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'}>
                                                <option value="">-- Select Shipping Company --</option>
                                                <option value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm</option>
                                                <option value="Giao Hàng Nhanh">Giao Hàng Nhanh</option>
                                                <option value="Viettel Post">Viettel Post</option>
                                                <option value="J&T Express">J&T Express</option>
                                                <option value="Shopee Express">Shopee Express</option>
                                                <option value="Ninja Van">Ninja Van</option>
                                                <option value="Ahamove">Ahamove</option>
                                                <option value="GrabExpress">GrabExpress</option>
                                                <option value="BeDelivery">BeDelivery</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Operating Area</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" placeholder="Ex: District 1, HCMC" value={shipperForm.operating_area} onChange={(e) => setShipperForm({...shipperForm, operating_area: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#c3c6d7]/30">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Bank Name</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.bank_name} onChange={(e) => setShipperForm({...shipperForm, bank_name: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Account Number</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.bank_account_number} onChange={(e) => setShipperForm({...shipperForm, bank_account_number: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Emergency Contact Name</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.emergency_contact_name} onChange={(e) => setShipperForm({...shipperForm, emergency_contact_name: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Emergency Contact Number</label>
                                            <input required className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-3 outline-none focus:border-primary" type="text" value={shipperForm.emergency_contact} onChange={(e) => setShipperForm({...shipperForm, emergency_contact: e.target.value})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Identity Card (Front)</label>
                                            <input type="file" accept="image/*" onChange={(e) => setShipperFiles({...shipperFiles, cccd_front: e.target.files[0]})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                            {shipperFiles.cccd_front ? (
                                                <img src={URL.createObjectURL(shipperFiles.cccd_front)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            ) : statusData.shipper?.cccd_front_url && (
                                                <img src={getImageUrl(statusData.shipper.cccd_front_url)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-[#434655]">Identity Card (Back)</label>
                                            <input type="file" accept="image/*" onChange={(e) => setShipperFiles({...shipperFiles, cccd_back: e.target.files[0]})} disabled={statusData.shipper?.status === 'pending' || statusData.shipper?.status === 'active'} className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                            {shipperFiles.cccd_back ? (
                                                <img src={URL.createObjectURL(shipperFiles.cccd_back)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            ) : statusData.shipper?.cccd_back_url && (
                                                <img src={getImageUrl(statusData.shipper.cccd_back_url)} alt="Preview" className="mt-2 h-24 max-w-[200px] object-cover rounded-md border border-[#c3c6d7] shadow-sm" />
                                            )}
                                        </div>
                                    </div>

                                    {statusData.shipper?.status !== 'pending' && statusData.shipper?.status !== 'active' && (
                                        <div className="flex justify-end pt-6 mt-6 border-t border-[#c3c6d7]/30">
                                            <button 
                                                type="submit" 
                                                disabled={isLoading} 
                                                className="bg-primary text-white font-bold px-8 py-3 rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {isLoading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : null}
                                                Submit Request
                                            </button>
                                        </div>
                                    )}
                                </form>
                                {renderHistory(statusData.shipper)}
                            </>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <FABGroup />
    </Layout>
  );
};

export default RoleUpgrade;
