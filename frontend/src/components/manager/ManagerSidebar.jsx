import React from 'react';

const ManagerSidebar = ({ navItems, activeTab, setActiveTab, stats, handleLogout }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-sm">
      {/* Brand */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
            UM
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tighter">Manager</h2>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Operations Hub</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const showCategory = index === 0 || navItems[index - 1].category !== item.category;
          return (
            <React.Fragment key={item.id}>
              {showCategory && (
                <div className="pt-5 pb-2 px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.category}
                  </p>
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-medium group cursor-pointer ${
                  activeTab === item.id || (activeTab === 'shop_detail' && item.id === 'shop_approval') || (activeTab === 'product_detail' && item.id === 'product_approval') || (activeTab === 'violation_detail' && item.id === 'violations')
                    ? 'bg-[#E8EFFF] text-primary font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: activeTab === item.id || (activeTab === 'shop_detail' && item.id === 'shop_approval') || (activeTab === 'product_detail' && item.id === 'product_approval') || (activeTab === 'violation_detail' && item.id === 'violations') ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* System Health */}
      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Operational Health</span>
            <span className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#16a34a]" style={{ width: '98%' }} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            Uptime: 99.9% | Pending: {(stats?.pendingShops ?? 0) + (stats?.pendingProducts ?? 0)}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-[#dc2626] hover:bg-red-100 transition-all rounded-xl text-sm font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Exit Manager</span>
        </button>
      </div>
    </aside>
  );
};

export default ManagerSidebar;
