import React from 'react';

const ShipperSidebar = ({ activeTab, setActiveTab, navItems, handleLogout }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-50 shadow-sm">
      {/* Shipper Identity */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#004ac6] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            SH
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Delivery Center</h2>
            <p className="text-xs text-slate-500 font-medium">Logistics Partner</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
          const showCategory = index === 0 || navItems[index - 1].category !== item.category;
          const isActive = activeTab === item.id;
          return (
            <React.Fragment key={item.id}>
              {showCategory && item.category === 'Settings' && (
                <div className="pt-4 pb-2 px-4 border-t border-slate-100/80 mt-2">
                </div>
              )}
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] transition-all text-[15px] group cursor-pointer ${isActive
                  ? 'bg-[#E8EFFF] text-[#004ac6] font-bold shadow-sm shadow-blue-100/50'
                  : 'text-[#475569] font-medium hover:bg-slate-50'
                  }`}
              >
                <span
                  className="material-symbols-outlined text-[24px] w-6 flex justify-center group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon === 'dashboard' ? 'space_dashboard' : item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="px-6 py-4 mt-auto border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-[#b3261e] hover:bg-red-100 transition-all rounded-xl text-sm font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>Exit Delivery Center</span>
        </button>
      </div>
    </aside>
  );
};

export default ShipperSidebar;
