import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import MapPicker from '../MapPicker';

const PlatformSettingsTab = ({ activeInnerTab }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nameVn: '',
    slug: '',
    parentId: '',
    icon: 'category',
    isVisible: true,
    enableCommission: false
  });

  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    storeName: '',
    logoUrl: '',
    faviconUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    isMaintenanceMode: false,
    maintenanceMessage: ''
  });
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch General Settings
  const fetchGeneralSettings = async () => {
    setLoadingGeneral(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/platform/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        setGeneralSettings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch general settings:', error);
      toast.error('Failed to load platform settings');
    } finally {
      setLoadingGeneral(false);
    }
  };

  useEffect(() => {
    if (activeInnerTab === 'general') {
      fetchGeneralSettings();
    }
  }, [activeInnerTab]);

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // Format to snake_case for backend
      const payload = {
        store_name: generalSettings.storeName,
        logo_url: generalSettings.logoUrl,
        favicon_url: generalSettings.faviconUrl,
        contact_email: generalSettings.contactEmail,
        contact_phone: generalSettings.contactPhone,
        contact_address: generalSettings.contactAddress,
        is_maintenance_mode: generalSettings.isMaintenanceMode,
        maintenance_message: generalSettings.maintenanceMessage
      };

      const res = await axios.put('http://localhost:5000/api/admin/platform/settings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Platform settings saved successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save platform settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSetDefault = () => {
    setGeneralSettings({
      storeName: 'UTEShop',
      logoUrl: '',
      faviconUrl: '',
      contactEmail: 'support@uteshop.com',
      contactPhone: '1900 1234',
      contactAddress: 'Ho Chi Minh City, Vietnam',
      isMaintenanceMode: false,
      maintenanceMessage: 'We are currently under maintenance. Please check back later.'
    });
    toast.success('Restored default values. Click Save Settings to apply.');
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading image...');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/admin/platform/settings/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setGeneralSettings(prev => ({
          ...prev,
          [field]: res.data.data.url
        }));
        toast.success('Image uploaded successfully', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  // Build tree from flat array
  const treeData = useMemo(() => {
    const map = {};
    const roots = [];
    // Deep clone and map
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    categories.forEach(cat => {
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(map[cat.id]);
      } else {
        roots.push(map[cat.id]);
      }
    });
    return roots;
  }, [categories]);

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsCreating(false);
    setFormData({
      name: cat.name || '',
      nameVn: cat.nameVn || '',
      slug: cat.slug || '',
      parentId: cat.parentId || '',
      icon: cat.icon || 'category',
      isVisible: cat.isVisible !== undefined ? cat.isVisible : true,
      enableCommission: cat.enableCommission || false
    });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedCategory(null);
    setFormData({
      name: '',
      nameVn: '',
      slug: '',
      parentId: '',
      icon: 'category',
      isVisible: true,
      enableCommission: false
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and Slug are required');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const payload = {
        name: formData.name,
        name_vn: formData.nameVn,
        slug: formData.slug,
        parent_id: formData.parentId || null,
        icon: formData.icon,
        is_visible: formData.isVisible,
        enable_commission: formData.enableCommission
      };

      if (isCreating) {
        await axios.post('http://localhost:5000/api/admin/categories', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category created successfully');
      } else if (selectedCategory) {
        await axios.put(`http://localhost:5000/api/admin/categories/${selectedCategory.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category updated successfully');
      }
      
      fetchCategories();
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteClick = () => {
    if (!selectedCategory) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/categories/${selectedCategory.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted successfully');
      setSelectedCategory(null);
      setShowDeleteModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const getLevel = (parentId) => {
    if (!parentId) return 1;
    const parent = categories.find(c => c.id === parentId);
    if (!parent) return 1;
    if (!parent.parentId) return 2;
    return 3;
  };

  const renderTree = (nodes, level = 1) => {
    return nodes.map(node => {
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedCategory?.id === node.id;
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className="space-y-1 relative">
          <div 
            onClick={() => handleSelectCategory(node)}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${isSelected ? 'bg-[#E8EFFF] border-l-4 border-primary' : 'hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
                {node.icon || 'category'}
              </span>
              <span className={`text-sm ${isSelected ? 'font-black text-primary' : 'font-bold text-slate-600'}`}>
                {node.name}
              </span>
            </div>
            <div className="flex gap-1 items-center">
              {level === 3 ? (
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">Leaf</span>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSelectCategory(node); setIsCreating(true); setFormData(p => ({...p, parentId: node.id})); }}
                  className="size-6 rounded bg-slate-100 text-slate-400 hover:text-primary transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              )}
              {hasChildren && (
                <span 
                  onClick={(e) => toggleExpand(e, node.id)}
                  className="material-symbols-outlined text-slate-400 text-sm hover:text-primary ml-1"
                >
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              )}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="ml-8 border-l-2 border-slate-100 pl-4 space-y-1 relative">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getSiblings = () => {
    if (!selectedCategory && !isCreating) return [];
    const parentId = formData.parentId;
    return categories.filter(c => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const moveSibling = async (index, direction) => {
    const siblings = [...getSiblings()];
    if (direction === 'up' && index > 0) {
      [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
    } else if (direction === 'down' && index < siblings.length - 1) {
      [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
    } else {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/categories/reorder', {
        orderedIds: siblings.map(s => s.id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      toast.error('Failed to reorder categories');
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F8FAFC] max-w-full mx-auto w-full overflow-hidden">
      <div className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col md:flex-row gap-8">
        {activeInnerTab === 'general' ? (
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.05)] flex flex-col overflow-hidden max-w-4xl mx-auto">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-3xl">store</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">General Information</h3>
                  <p className="text-sm text-slate-500 font-medium">Update store identity and maintenance</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSetDefault}
                  className="px-6 py-3 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">restore</span>
                  Set Defaults
                </button>
                <button 
                  onClick={handleSaveGeneral}
                  disabled={savingGeneral}
                  className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {savingGeneral ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <span className="material-symbols-outlined text-[16px]">save</span>}
                  Save Settings
                </button>
              </div>
            </div>

            {loadingGeneral ? (
              <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c3c6d7] [&::-webkit-scrollbar-thumb]:rounded-full">
                
                {/* Platform Identity */}
                <section className="space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Platform Identity</h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Name</label>
                    <input 
                      type="text" 
                      name="storeName"
                      value={generalSettings.storeName}
                      onChange={handleGeneralChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {generalSettings.logoUrl ? (
                            <img src={generalSettings.logoUrl} alt="Logo" className="max-h-full object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300">image</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                            Upload Logo
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-2">Recommended: 250x100px PNG</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Favicon</label>
                      <div className="flex items-center gap-4">
                        <div className="size-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {generalSettings.faviconUrl ? (
                            <img src={generalSettings.faviconUrl} alt="Favicon" className="max-h-full object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-300">image</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                            Upload Favicon
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-2">Recommended: 32x32px ICO/PNG</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Contact Info */}
                <section className="space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          name="contactEmail"
                          value={generalSettings.contactEmail}
                          onChange={handleGeneralChange}
                          className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm font-bold focus:ring-primary focus:border-primary transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">mail</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hotline Phone</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="contactPhone"
                          value={generalSettings.contactPhone}
                          onChange={handleGeneralChange}
                          className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm font-bold focus:ring-primary focus:border-primary transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">call</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters Address</label>
                      <button 
                        type="button" 
                        onClick={() => setShowMap(true)}
                        className="text-[#004ac6] text-[10px] font-bold flex items-center gap-1 hover:underline bg-[#e2e7ff] px-2 py-1 rounded-md transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">map</span>
                        Select on map
                      </button>
                    </div>
                    <div className="relative">
                      <textarea 
                        name="contactAddress"
                        value={generalSettings.contactAddress}
                        onChange={handleGeneralChange}
                        rows="3"
                        className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm font-bold focus:ring-primary focus:border-primary transition-all resize-none"
                      ></textarea>
                      <span className="absolute left-4 top-[14px] material-symbols-outlined text-slate-400 text-xl">location_on</span>
                    </div>
                  </div>
                </section>

                {/* Maintenance Mode */}
                <section className="space-y-6">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Maintenance Settings</h4>
                  
                  <div className={`p-6 rounded-3xl border-2 transition-all ${generalSettings.isMaintenanceMode ? 'bg-[#fff5f5] border-error/20' : 'bg-slate-50 border-transparent'}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h5 className="font-bold text-slate-900">Enable Maintenance Mode</h5>
                        <p className="text-xs text-slate-500 mt-1">If enabled, the public site will be hidden and display the message below.</p>
                      </div>
                      <div className="relative inline-block w-12 h-6 align-middle select-none shrink-0">
                        <input 
                          type="checkbox" 
                          name="isMaintenanceMode"
                          checked={generalSettings.isMaintenanceMode}
                          onChange={handleGeneralChange}
                          className="sr-only peer" 
                          id="maintenance_toggle" 
                        />
                        <label htmlFor="maintenance_toggle" className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 ${generalSettings.isMaintenanceMode ? 'bg-error' : 'bg-slate-300'}`}></label>
                      </div>
                    </div>

                    {generalSettings.isMaintenanceMode && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 mt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Maintenance Message</label>
                        <textarea 
                          name="maintenanceMessage"
                          value={generalSettings.maintenanceMessage}
                          onChange={handleGeneralChange}
                          rows="3"
                          className="w-full bg-white border-error/20 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-error focus:border-error transition-all resize-none text-slate-700"
                          placeholder="e.g. We are upgrading our servers. We will be back in 2 hours."
                        ></textarea>
                      </div>
                    )}
                  </div>
                </section>

              </div>
            )}
          </div>
        ) : (
          <>
      {/* Category Tree Panel */}
      <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.05)] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Category Hierarchy (3 Levels)</h3>
          <button 
            onClick={handleCreateNew}
            className="size-8 rounded-lg bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all shadow-md shadow-blue-100"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c3c6d7] [&::-webkit-scrollbar-thumb]:rounded-full space-y-1">
          {renderTree(treeData)}
          {treeData.length === 0 && <p className="text-center text-slate-400 text-sm mt-4">No categories yet</p>}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-widest">
            Total: {categories.length} Categories
          </p>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.05)] flex flex-col overflow-hidden">
        {selectedCategory || isCreating ? (
          <>
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-3xl">{formData.icon || 'devices'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {isCreating ? 'Create New Category' : `Edit Category: ${selectedCategory.name}`}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">
                    {formData.parentId ? 'Sub Category' : 'Root Category'} {selectedCategory ? `· ID: ${selectedCategory.id.substring(0,8)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isCreating && (
                  <button 
                    onClick={handleDeleteClick}
                    className="size-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-[#ba1a1a] hover:text-white transition-all shadow-sm"
                    title="Delete Category"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#c3c6d7] [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name (EN)</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name (VN)</label>
                  <input 
                    type="text" 
                    name="nameVn"
                    value={formData.nameVn}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug / URL Key</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm font-mono text-primary focus:ring-primary focus:border-primary transition-all"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">link</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Category</label>
                  <select 
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">None (Root)</option>
                    {categories.filter(c => c.id !== selectedCategory?.id && getLevel(c.id) < 3).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Icon (Material Symbol)</label>
                <div className="flex gap-4">
                  <div className="size-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <span className="material-symbols-outlined text-3xl">{formData.icon || 'category'}</span>
                  </div>
                  <input 
                    type="text" 
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    className="flex-1 bg-slate-50 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-mono focus:ring-primary focus:border-primary transition-all" 
                    placeholder="Enter icon name (e.g. devices, home)..."
                  />
                </div>
              </div>

              {!isCreating && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reorder Siblings</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Order Position</p>
                  </div>
                  <div className="space-y-2">
                    {getSiblings().map((sib, index) => (
                      <div key={sib.id} className={`flex items-center justify-between p-4 rounded-2xl border ${sib.id === selectedCategory.id ? 'bg-white border-primary shadow-sm' : 'bg-slate-50 border-slate-200'} group`}>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-400">#{String(index + 1).padStart(2, '0')}</span>
                          <span className={`text-sm font-bold ${sib.id === selectedCategory.id ? 'text-slate-900' : 'text-slate-500'}`}>{sib.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => moveSibling(index, 'up')}
                            disabled={index === 0}
                            className="size-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">keyboard_arrow_up</span>
                          </button>
                          <button 
                            onClick={() => moveSibling(index, 'down')}
                            disabled={index === getSiblings().length - 1}
                            className="size-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced Meta */}
            <div className="p-6 md:p-8 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
              <div className="flex items-center justify-between py-3 px-5 bg-white rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-600">Visible on Navigation</span>
                <div className="relative inline-block w-10 h-5 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={handleChange}
                    className="sr-only peer" 
                    id="vis_toggle" 
                  />
                  <label htmlFor="vis_toggle" className="block overflow-hidden h-5 rounded-full bg-slate-200 peer-checked:bg-[#2e7d32] cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 px-5 bg-white rounded-xl border border-slate-200">
                <span className="text-sm font-bold text-slate-600">Enable Commission overrides</span>
                <div className="relative inline-block w-10 h-5 align-middle select-none">
                  <input 
                    type="checkbox" 
                    name="enableCommission"
                    checked={formData.enableCommission}
                    onChange={handleChange}
                    className="sr-only peer" 
                    id="comm_toggle" 
                  />
                  <label htmlFor="comm_toggle" className="block overflow-hidden h-5 rounded-full bg-slate-200 peer-checked:bg-primary cursor-pointer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></label>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">account_tree</span>
            <p className="text-lg font-bold text-slate-600">Select a category to edit</p>
            <p className="text-sm">Or click the + button to create a new one</p>
          </div>
        )}
      </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Delete Category?</h3>
            <p className="text-sm font-medium text-slate-500 text-center mb-8">
              Are you sure you want to delete <span className="text-slate-900 font-bold">"{selectedCategory.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-5 py-3 rounded-xl bg-[#ba1a1a] text-white text-sm font-bold shadow-lg shadow-red-200 hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Delete'}
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
          setGeneralSettings(prev => ({
            ...prev,
            contactAddress: data.addressString
          }));
        }}
      />
    </div>
  );
};

export default PlatformSettingsTab;
