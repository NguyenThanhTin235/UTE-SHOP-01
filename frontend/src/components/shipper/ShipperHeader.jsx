import React, { useState } from 'react';
import NotificationDropdown from '../NotificationDropdown';

const ShipperHeader = ({ activeTab, headerInfo, user, navigate }) => {

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[#004ac6] text-2xl">
          {headerInfo.icon}
        </span>
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {headerInfo.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <div onClick={() => navigate('/shipper/profile')} className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
          <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
            {user?.fullName?.charAt(0).toUpperCase() || 'S'}
          </div>
          <span className="text-sm font-bold text-slate-700">{user?.fullName || 'Shipper Name'}</span>
        </div>
      </div>
    </header>
  );
};

export default ShipperHeader;
