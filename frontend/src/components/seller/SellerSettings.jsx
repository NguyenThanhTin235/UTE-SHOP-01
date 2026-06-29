import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import MapPicker from '../MapPicker';

const SellerSettings = ({ setActiveTab }) => {
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [shopData, setShopData] = useState({
        name: '',
        slug: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        latitude: null,
        longitude: null,
        banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        logo_url: '',
        shipping_carriers: {
            ghtk: true,
            grab: false,
            jt: true
        },
        status: '',
        rejection_reason: ''
    });
    const [showMap, setShowMap] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/seller/settings', {
                headers: { Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token') || '')}` }
            });
            if (res.data.success && res.data.data) {
                const data = res.data.data;
                setShopData({
                    name: data.name || '',
                    slug: data.slug || '',
                    description: data.description || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                    banner_url: data.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
                    logo_url: data.logo_url || '',
                    shipping_carriers: data.shipping_carriers || { ghtk: true, grab: false, jt: true },
                    status: data.status || 'not_created',
                    rejection_reason: data.rejection_reason || ''
                });
            } else {
                setShopData(prev => ({ ...prev, status: 'not_created' }));
            }
        } catch (error) {
            toast.error('Failed to load shop settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleInputChange = (field, value) => {
        if (shopData.status === 'pending') return;
        setShopData(prev => ({ ...prev, [field]: value }));
    };

    const handleCarrierToggle = (carrier) => {
        if (shopData.status === 'pending') return;
        setShopData(prev => ({
            ...prev,
            shipping_carriers: {
                ...prev.shipping_carriers,
                [carrier]: !prev.shipping_carriers[carrier]
            }
        }));
    };

    const handleSaveAll = async () => {
        try {
            const res = await axios.put('http://localhost:5000/api/seller/settings', shopData, {
                headers: { Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token') || '')}` }
            });
            if (res.data.success) {
                toast.success('Settings saved successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        }
    };

    useEffect(() => {
        const handleSaveEvent = () => {
            handleSaveAll();
        };
        window.addEventListener('save-shop-settings', handleSaveEvent);
        return () => window.removeEventListener('save-shop-settings', handleSaveEvent);
    }, [shopData]);

    const handleDeleteShop = () => {
        setShowDeleteModal(true);
    };

    const executeDeleteShop = async () => {
        setShowDeleteModal(false);
        try {
            const res = await axios.delete('http://localhost:5000/api/seller/settings', {
                headers: { Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token') || '')}` }
            });
            if (res.data.success) {
                toast.success('Shop closed successfully.');
                window.location.reload();
            }
        } catch (error) {
            toast.error('Failed to close shop');
        }
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        const uploadPromise = axios.post('http://localhost:5000/api/seller/settings/upload', formData, {
            headers: {
                Authorization: `Bearer ${(localStorage.getItem('token') || sessionStorage.getItem('token') || '')}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        toast.promise(uploadPromise, {
            loading: 'Uploading image...',
            success: 'Image uploaded successfully!',
            error: 'Failed to upload image'
        });

        try {
            const res = await uploadPromise;
            if (res.data.success) {
                handleInputChange(type, res.data.data.url);
            }
        } catch (error) {
            console.error('Upload error', error);
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            

            {/* Body Content */}
            <div className="p-10 max-w-[1000px] mx-auto w-full space-y-6">
                
                {shopData.status === 'not_created' && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-[2rem] flex items-start gap-4">
                        <span className="material-symbols-outlined text-3xl">info</span>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Welcome to Seller Center!</h3>
                            <p className="text-sm">Please fill out your shop information below to start selling. Your shop will need to be approved by a manager before you can add products.</p>
                        </div>
                    </div>
                )}

                {shopData.status === 'pending' && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-[2rem] flex items-start gap-4">
                        <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Shop Under Review</h3>
                            <p className="text-sm">Your shop configuration is currently pending approval by the manager. You will be able to manage products and orders once approved. Information is read-only during this time.</p>
                        </div>
                    </div>
                )}

                {shopData.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-[2rem] flex items-start gap-4">
                        <span className="material-symbols-outlined text-3xl">error</span>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Shop Registration Rejected</h3>
                            <p className="text-sm mb-2">Your shop configuration was rejected for the following reason:</p>
                            <p className="text-sm font-bold bg-white/50 p-3 rounded-xl border border-red-100">{shopData.rejection_reason}</p>
                            <p className="text-sm mt-3">Please update your shop information and save settings to submit for review again.</p>
                        </div>
                    </div>
                )}

                {/* Section: Shop Profile */}
                <section className="bg-white rounded-[2rem] border border-slate-200 shadow-level-1 overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="text-lg font-black text-on-surface">Shop Profile</h3>
                        <p className="text-xs text-secondary font-medium">Manage your shop's public identity</p>
                    </div>
                    <div className="p-8 space-y-8">
                        {/* Shop Banner */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Shop Banner</label>
                            <div className="relative h-48 w-full bg-slate-100 rounded-3xl overflow-hidden group">
                                <img src={shopData.banner_url} alt="Shop Banner" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {shopData.status !== 'pending' && (
                                        <label className="bg-white text-on-surface px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            Change Banner
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner_url')} disabled={shopData.status === 'pending'} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Shop Logo */}
                            <div className="shrink-0 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Shop Logo</label>
                                <div className="relative w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-xl group overflow-hidden">
                                    {shopData.logo_url ? (
                                        <img src={shopData.logo_url} alt="Shop Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-primary">{shopData.name?.charAt(0).toUpperCase() || 'US'}</span>
                                    )}
                                    {shopData.status !== 'pending' && (
                                        <label className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <span className="material-symbols-outlined text-white">photo_camera</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo_url')} disabled={shopData.status === 'pending'} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Shop Info Fields */}
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Shop Name</label>
                                        <input 
                                            type="text" 
                                            value={shopData.name} 
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            disabled={shopData.status === 'pending'}
                                            className="w-full bg-[#F8FAFC] border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Shop URL</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold">uteshop.vn/</span>
                                            <input 
                                                type="text" 
                                                value={shopData.slug} 
                                                onChange={(e) => handleInputChange('slug', e.target.value)}
                                                disabled={shopData.status === 'pending'}
                                                className="flex-1 bg-[#F8FAFC] border-slate-200 rounded-r-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Shop Description</label>
                                    <textarea 
                                        rows="4" 
                                        value={shopData.description} 
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        disabled={shopData.status === 'pending'}
                                        className="w-full bg-[#F8FAFC] border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Contact Information */}
                <section className="bg-white rounded-[2rem] border border-slate-200 shadow-level-1 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-on-surface">Contact & Pickup</h3>
                            <p className="text-xs text-secondary font-medium">Essential information for order fulfillment</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={shopData.email} 
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    disabled={shopData.status === 'pending'}
                                    className="w-full bg-[#F8FAFC] border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Phone Number</label>
                                <input 
                                    type="tel" 
                                    value={shopData.phone} 
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    disabled={shopData.status === 'pending'}
                                    className="w-full bg-[#F8FAFC] border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Warehouse Address (Pickup)</label>
                                <button 
                                  type="button" 
                                  onClick={() => setShowMap(true)}
                                  disabled={shopData.status === 'pending'}
                                  className="text-[#004ac6] text-[10px] font-bold flex items-center gap-1 hover:underline bg-[#e2e7ff] px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="material-symbols-outlined text-[12px]">map</span>
                                  Select on map
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <textarea 
                                    rows="2" 
                                    value={shopData.address} 
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    disabled={shopData.status === 'pending'}
                                    className="w-full bg-[#F8FAFC] border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder="Enter full pickup address..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </section>



                {/* Danger Zone */}
                <section className="bg-red-50 rounded-[2rem] border border-red-100 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-lg font-black text-red-900">Close Official Store</h3>
                        <p className="text-sm text-red-700 font-medium italic">Deleting your shop will remove all product listings and historical data permanently.</p>
                    </div>
                    <button 
                        onClick={handleDeleteShop}
                        className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 shrink-0 cursor-pointer"
                    >
                        Delete Shop
                    </button>
                </section>

                {/* Close Shop Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="size-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto border border-error/10">
                                <span className="material-symbols-outlined text-[32px]">warning</span>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Close Official Store?</h3>
                                <p className="text-slate-500 font-medium text-sm text-slate-500">
                                    Are you sure you want to close your official store? <span className="font-bold text-error">This action cannot be undone</span> and will delete all products and shop history.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executeDeleteShop}
                                    className="flex-1 py-4 bg-error text-white rounded-2xl font-black text-sm hover:brightness-110 shadow-lg shadow-error/20 cursor-pointer"
                                >
                                    Close Shop
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MapPicker Component */}
                <MapPicker 
                  isOpen={showMap}
                  onClose={() => setShowMap(false)}
                  onConfirm={(data) => {
                    setShopData(prev => ({
                        ...prev,
                        address: data.addressString,
                        latitude: data.lat,
                        longitude: data.lng
                    }));
                  }}
                  initialLat={shopData.latitude}
                  initialLng={shopData.longitude}
                />
            </div>
        </div>
    );
};

export default SellerSettings;
