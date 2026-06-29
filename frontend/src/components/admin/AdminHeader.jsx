import React from 'react';
import NotificationDropdown from '../NotificationDropdown';

const AdminHeader = ({
  searchTerm,
  setSearchTerm,
  unreadCount,
  user,
  navigate,
  showApplyButton,
  onApplyChanges,
  applying,
  addPartnerTrigger,
  addRoleTrigger,
  addPostTrigger,
  activeTab,
  activePlatformTab,
  setActivePlatformTab
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-primary text-2xl">admin_panel_settings</span>
        <h1 className="text-xl font-black text-slate-900 tracking-tighter">Platform Intelligence</h1>

        <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-96 group focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-slate-200/60">
          <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-primary">search</span>
          <input
            type="text"
            placeholder="Search users, shops, or product SKUs..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium ml-2 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {activeTab === 'platform_settings' && (
          <div className="mr-2 hidden md:flex items-center bg-slate-100 p-1 rounded-xl group transition-all border border-slate-200/60">
            <button
              onClick={() => setActivePlatformTab('general')}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activePlatformTab === 'general' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              General
            </button>
            <button
              onClick={() => setActivePlatformTab('categories')}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activePlatformTab === 'categories' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Categories
            </button>
          </div>
        )}
        {showApplyButton && (
          <button
            onClick={onApplyChanges}
            disabled={applying}
            className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {applying ? 'Applying...' : 'Apply Changes'}
          </button>
        )}
        {addPartnerTrigger && (
          <button
            onClick={addPartnerTrigger}
            className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            Add Partner
          </button>
        )}
        {addRoleTrigger && (
          <button
            onClick={addRoleTrigger}
            className="px-5 py-2.5 bg-[#004ac6] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create New Role
          </button>
        )}
        {addPostTrigger && (
          <button
            onClick={addPostTrigger}
            className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit_document</span>
            Create Post
          </button>
        )}
        <NotificationDropdown />
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div onClick={() => navigate('/admin/profile')} className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-200">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <span className="text-sm font-bold text-slate-700">{user?.fullName || 'System Admin'}</span>
          <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
