import React from 'react';

const AdminSidebar = ({ navItems, activeTab, setActiveTab, handleLogout }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-sm">
      {/* Brand Identity */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#004ac6] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
            UA
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tighter">Admin CMS</h2>
            <p className="text-[10px] text-[#004ac6] font-black uppercase tracking-widest">Platform Authority</p>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
          const showCategory = index === 0 || navItems[index - 1].category !== item.category;
          return (
            <React.Fragment key={item.id}>
              {showCategory && (item.category !== 'General') && (
                <div className="pt-6 pb-2 px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-sm font-medium group cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#E8EFFF] text-[#004ac6] font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-6 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Server Health</span>
            <span className="w-2 h-2 bg-[#2e7d32] rounded-full animate-pulse"></span>
          </div>
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2e7d32]" style={{ width: '94%' }}></div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Latent: 12ms | Load: 0.45</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-[#b3261e] hover:bg-red-100 transition-all rounded-xl text-sm font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Exit Admin CMS</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
