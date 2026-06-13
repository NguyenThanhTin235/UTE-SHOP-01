import React from 'react';
import NotificationDropdown from '../NotificationDropdown';

const ManagerHeader = ({
  activeTab,
  setActiveTab,
  headerData,
  searchTerm,
  setSearchTerm,
  getSearchPlaceholder,
  user,
  navigate
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        {activeTab === 'shop_detail' || activeTab === 'product_detail' || activeTab === 'violation_detail' ? (
          <button onClick={() => setActiveTab(activeTab === 'shop_detail' ? 'shop_approval' : activeTab === 'violation_detail' ? 'violations' : 'product_approval')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-primary text-[28px]">
            {activeTab === 'dashboard' ? 'engineering' : 
             activeTab === 'shop_approval' ? 'verified' : 
             activeTab === 'product_approval' ? 'fact_check' : 
             activeTab === 'violations' ? 'gavel' : 
             activeTab === 'statistics' ? 'monitoring' : 'engineering'}
          </span>
        )}
        {headerData ? (
          headerData.title
        ) : (
          <h1 className="text-xl font-black text-slate-900 tracking-tighter">
            {activeTab === 'shop_detail' ? 'Registration Review' : activeTab === 'product_detail' ? 'Product Review' : activeTab === 'violation_detail' ? 'Incident Detail' : 'Operations Intelligence'}
          </h1>
        )}
        {activeTab !== 'shop_detail' && activeTab !== 'product_detail' && activeTab !== 'violation_detail' && (
          <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-96 group focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-slate-200/60">
            <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-primary">search</span>
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium ml-2 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {headerData && headerData.extra}
        {activeTab !== 'shop_detail' && activeTab !== 'product_detail' && activeTab !== 'violation_detail' && (
          <NotificationDropdown />
        )}
        <div className="h-8 w-px bg-slate-200 mx-2" />
        <div onClick={() => navigate('/manager/profile')} className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-200">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'NB'}
          </div>
          <span className="text-sm font-bold text-slate-700">{user?.fullName || 'Operations Manager'}</span>
        </div>
      </div>
    </header>
  );
};

export default ManagerHeader;
