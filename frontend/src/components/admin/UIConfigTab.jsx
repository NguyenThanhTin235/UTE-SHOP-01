import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UIConfigTab = ({ setApplyChangesHandler, setApplyingState }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // States
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState([]);
  const [theme, setTheme] = useState({
    primary_color: '#004ac6',
    font_family: 'Manrope (Standard)',
    border_radius: 'rounded',
    dark_mode_support: true
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/admin/ui-config', config);

      if (response.data && response.data.success) {
        const toSnakeCase = (obj) => {
          if (Array.isArray(obj)) return obj.map(toSnakeCase);
          if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((acc, key) => {
              const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
              acc[snakeKey] = obj[key];
              return acc;
            }, {});
          }
          return obj;
        };

        const rawData = response.data.data;
        const banners = toSnakeCase(rawData.banners);
        const sections = toSnakeCase(rawData.sections);
        const theme = toSnakeCase(rawData.theme);

        setBanners(banners || []);
        setSections(sections || []);
        if (theme && Object.keys(theme).length > 0) {
          setTheme(theme);
        }
      }
    } catch (error) {
      console.error('Fetch UI config error:', error);
      toast.error('Failed to load UI configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handlePublish = async () => {
    setSaving(true);
    const toastId = toast.loading('Publishing changes...');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Ensure sort_orders are updated based on array index
      const updatedBanners = banners.map((b, idx) => ({ ...b, sort_order: idx + 1 }));
      const updatedSections = sections.map((s, idx) => ({ ...s, sort_order: idx + 1 }));

      await Promise.all([
        axios.put('http://localhost:5000/api/admin/ui-config/theme', theme, config),
        axios.put('http://localhost:5000/api/admin/ui-config/banners', { banners: updatedBanners }, config),
        axios.put('http://localhost:5000/api/admin/ui-config/sections', { sections: updatedSections }, config)
      ]);

      toast.success('UI Configuration published successfully!', { id: toastId });
      fetchConfig();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish changes', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Theme Actions
  const handleRestoreDefaults = () => {
    setTheme({
      primary_color: '#004ac6',
      font_family: 'Manrope (Standard)',
      border_radius: 'rounded',
      dark_mode_support: true
    });
    toast.success('Restored default theme settings. Click Publish to save.');
  };

  // Banner Actions
  const triggerBannerUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Uploading banner...');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('banner', file);

      const response = await axios.post('http://localhost:5000/api/admin/ui-config/upload-banner', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        const imageUrl = response.data.data.imageUrl;
        const newBanner = {
          title: 'New Banner',
          link: '/',
          image_url: imageUrl,
          is_active: true,
          sort_order: banners.length + 1
        };
        setBanners([...banners, newBanner]);
        toast.success('Banner uploaded successfully', { id: toastId });
      }
    } catch (error) {
      console.error('Upload banner error:', error);
      toast.error('Failed to upload banner image', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  const removeBanner = (index) => {
    const newBanners = [...banners];
    newBanners.splice(index, 1);
    setBanners(newBanners);
  };

  const updateBannerField = (index, field, value) => {
    const newBanners = [...banners];
    newBanners[index][field] = value;
    setBanners(newBanners);
  };

  // Section Actions
  const moveSection = (index, direction) => {
    if (index === 0) return; // Hero banner is fixed at top usually, but we allow moving others
    
    // Actually, let's just make it simple. If it's hero, we probably shouldn't move it.
    const section = sections[index];
    if (section.type === 'hero') return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex <= 0 || newIndex >= sections.length) return; // <=0 because 0 is Hero

    const newSections = [...sections];
    // Swap
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  };

  const toggleSectionActive = (index) => {
    const newSections = [...sections];
    if (newSections[index].type !== 'hero') { // Prevent disabling hero
      newSections[index].is_active = !newSections[index].is_active;
      setSections(newSections);
    }
  };

  const getSectionIcon = (type) => {
    switch (type) {
      case 'hero': return { icon: 'view_carousel', bg: 'bg-primary/10', text: 'text-primary' };
      case 'flash_deals': return { icon: 'bolt', bg: 'bg-orange-50', text: 'text-orange-500' };
      case 'category_highlights': return { icon: 'grid_view', bg: 'bg-emerald-50', text: 'text-emerald-500' };
      case 'recommendations': return { icon: 'auto_awesome', bg: 'bg-blue-50', text: 'text-blue-500' };
      default: return { icon: 'dashboard', bg: 'bg-slate-50', text: 'text-slate-500' };
    }
  };

  useEffect(() => {
    if (setApplyChangesHandler) {
      setApplyChangesHandler(() => handlePublish);
    }
    return () => {
      if (setApplyChangesHandler) setApplyChangesHandler(null);
    };
  }, [banners, theme]);

  useEffect(() => {
    if (setApplyingState) {
      setApplyingState(saving);
    }
  }, [saving, setApplyingState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Banner Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Homepage Hero Banners</h2>
            <p className="text-sm text-slate-500">Manage the main slider on the homepage (Recommended size: 1920x600px)</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBannerUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={triggerBannerUpload}
            className="px-4 py-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-level-1 text-center">
            <p className="text-slate-400 font-bold text-sm">No banners uploaded yet. Upload your first banner.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((banner, index) => (
              <div key={banner._id || index} className="group relative rounded-3xl overflow-hidden border border-slate-200 shadow-level-1 banner-card transition-all duration-300">
                <img src={banner.image_url} alt={`Banner ${index}`} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 banner-overlay">
                  <div className="flex justify-between items-end">
                    <div className="flex-1 mr-4">
                      <input 
                        type="text" 
                        value={banner.title || ''} 
                        onChange={(e) => updateBannerField(index, 'title', e.target.value)}
                        placeholder="Banner Title"
                        className="bg-transparent border-b border-white/30 text-white font-black text-lg focus:ring-0 focus:border-white w-full placeholder:text-white/50 mb-1"
                      />
                      <input 
                        type="text" 
                        value={banner.link || ''} 
                        onChange={(e) => updateBannerField(index, 'link', e.target.value)}
                        placeholder="Link URL (e.g., /category/shoes)"
                        className="bg-transparent border-b border-white/30 text-white/70 text-xs font-medium focus:ring-0 focus:border-white w-full placeholder:text-white/40"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateBannerField(index, 'is_active', !banner.is_active)}
                        className={`size-10 rounded-xl backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer ${banner.is_active ? 'bg-success/80 hover:bg-success' : 'bg-white/20 hover:bg-white hover:text-primary'}`}
                        title="Toggle Active Status"
                      >
                        <span className="material-symbols-outlined text-xl">{banner.is_active ? 'visibility' : 'visibility_off'}</span>
                      </button>
                      <button 
                        onClick={() => removeBanner(index)}
                        className="size-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                        title="Delete Banner"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                    Order #{index + 1}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm ${banner.is_active ? 'bg-green-600' : 'bg-slate-400'}`}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* Appearance Settings */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-level-1 p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Global Theme & Style</h2>
            <p className="text-sm text-slate-500">Customize the visual identity of the customer-facing storefront</p>
          </div>
          <button 
            onClick={handleRestoreDefaults}
            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
            Restore Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={theme.primary_color} 
                onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                className="size-10 rounded-xl cursor-pointer border-none p-0 overflow-hidden" 
              />
              <input 
                type="text" 
                value={theme.primary_color} 
                onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black focus:ring-2 focus:ring-primary focus:border-primary outline-none uppercase" 
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font Family</label>
            <select 
              value={theme.font_family}
              onChange={(e) => setTheme({ ...theme, font_family: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="Manrope (Standard)">Manrope (Standard)</option>
              <option value="Inter">Inter</option>
              <option value="Outfit">Outfit</option>
              <option value="Roboto">Roboto</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Border Radius</label>
            <div className="flex items-center gap-2">
              {['sharp', 'rounded', 'pill'].map((br) => (
                <button 
                  key={br}
                  onClick={() => setTheme({ ...theme, border_radius: br })}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black capitalize transition-all cursor-pointer ${
                    theme.border_radius === br 
                    ? 'bg-primary text-white shadow-md shadow-blue-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {br}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dark Mode Support</label>
            <div className="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Auto Detect</span>
              <div className="relative inline-block w-10 h-5 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={theme.dark_mode_support} 
                  onChange={(e) => setTheme({ ...theme, dark_mode_support: e.target.checked })}
                  id="dark_toggle"
                  className="sr-only peer" 
                />
                <label htmlFor="dark_toggle" className="block overflow-hidden h-5 rounded-full bg-slate-200 peer-checked:bg-primary cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UIConfigTab;
