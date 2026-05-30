import React from 'react';

const ManagerHeader = ({
  activeTab,
  setActiveTab,
  headerData,
  searchTerm,
  setSearchTerm,
  getSearchPlaceholder,
  unreadCount,
  user,
  navigate
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        {activeTab === 'shop_detail' || activeTab === 'product_detail' || activeTab === 'violation_detail' ? (
          <button onClick={() => setActiveTab(activeTab === 'shop_detail' ? 'shop_approval' : activeTab === 'violation_detail' ? 'violations' : 'product_approval')} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#004ac6] hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-[#004ac6] text-[28px]">
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
          <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-96 group focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all border border-slate-200/60">
            <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#004ac6]">search</span>
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
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#dc2626] text-[10px] text-white flex items-center justify-center rounded-full font-bold shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}
        <div className="h-8 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
          <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-200">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'NB'}
          </div>
          <span className="text-sm font-bold text-slate-700">{user?.fullName || 'Operations Manager'}</span>
          <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
        </div>
      </div>
    </header>
  );
};

export default ManagerHeader;
