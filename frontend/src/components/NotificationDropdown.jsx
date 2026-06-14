import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API}/notifications/unread-count`, {
        headers: getAuthHeader()
      });
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: getAuthHeader()
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      setSelectedNotification(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, {
        headers: getAuthHeader()
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, {
        headers: getAuthHeader()
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete(`${API}/notifications/clear-all`, {
        headers: getAuthHeader()
      });
      setNotifications([]);
      setUnreadCount(0);
      setSelectedNotification(null);
      toast.success('All notifications cleared');
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const handleSelectNotification = (notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIconData = (type, title) => {
    const t = title?.toLowerCase() || '';
    
    if (type === 'order') {
      if (t.includes('cancel') || t.includes('reject')) {
        return { icon: 'cancel', bg: 'bg-rose-100 text-rose-600', detailBg: 'bg-rose-50', badgeBg: 'bg-rose-100 text-rose-700 border-rose-200' };
      }
      if (t.includes('refund')) {
        return { icon: 'payments', bg: 'bg-amber-100 text-amber-600', detailBg: 'bg-amber-50', badgeBg: 'bg-amber-100 text-amber-700 border-amber-200' };
      }
      if (t.includes('pending')) {
        return { icon: 'hourglass_empty', bg: 'bg-orange-100 text-orange-600', detailBg: 'bg-orange-50', badgeBg: 'bg-orange-100 text-orange-700 border-orange-200' };
      }
      if (t.includes('dispute')) {
        return { icon: 'warning', bg: 'bg-purple-100 text-purple-600', detailBg: 'bg-purple-50', badgeBg: 'bg-purple-100 text-purple-700 border-purple-200' };
      }
      if (t.includes('deliver') || t.includes('complete')) {
        return { icon: 'check_circle', bg: 'bg-teal-100 text-teal-600', detailBg: 'bg-teal-50', badgeBg: 'bg-teal-100 text-teal-700 border-teal-200' };
      }
      if (t.includes('ship') || t.includes('way')) {
        return { icon: 'local_shipping', bg: 'bg-indigo-100 text-indigo-600', detailBg: 'bg-indigo-50', badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      }
      if (t.includes('confirm') || t.includes('verified')) {
        return { icon: 'task_alt', bg: 'bg-sky-100 text-sky-600', detailBg: 'bg-sky-50', badgeBg: 'bg-sky-100 text-sky-700 border-sky-200' };
      }
      if (t.includes('placed') || t.includes('paid') || t.includes('success')) {
        return { icon: 'shopping_basket', bg: 'bg-emerald-100 text-emerald-600', detailBg: 'bg-emerald-50', badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      }
      return { icon: 'package_2', bg: 'bg-blue-100 text-primary', detailBg: 'bg-blue-50', badgeBg: 'bg-blue-100 text-blue-700 border-blue-200' };
    }

    if (type === 'promotion') {
      return { icon: 'sell', bg: 'bg-orange-100 text-[#f59e0b]', detailBg: 'bg-orange-50', badgeBg: 'bg-orange-100 text-orange-700 border-orange-200' };
    }

    return { icon: 'settings_suggest', bg: 'bg-slate-100 text-slate-600', detailBg: 'bg-slate-50', badgeBg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // ── Detail View ──
  const renderDetailView = () => {
    if (!selectedNotification) return null;
    const n = selectedNotification;
    const { icon, bg, detailBg, badgeBg } = getIconData(n.type, n.title);

    return (
      <div className="flex flex-col h-full">
        {/* Detail header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <button
            onClick={() => setSelectedNotification(null)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-primary transition-all cursor-pointer shrink-0"
            title="Back to list"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">Notification Detail</h3>
        </div>

        {/* Detail body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Icon + Badge + Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${bg}`}>
              <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border ${badgeBg}`}>
              {n.type || 'Notification'}
            </span>
            <h2 className="text-base font-black text-slate-900 leading-snug">{n.title}</h2>
            <p className="text-[11px] text-slate-400 font-bold">
              {getFullDate(n.createdAt || n.date)}
            </p>
          </div>

          {/* Content card */}
          <div className={`rounded-2xl p-4 border border-slate-100 ${detailBg}`}>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
              {n.detailContent || n.content}
            </p>
          </div>

          {/* Order Summary (if available) */}
          {n.orderSummary && (
            <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-sm">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Order Summary</h4>
              <div className="flex gap-3 items-center">
                {n.orderSummary.image && (
                  <img 
                    src={n.orderSummary.image} 
                    alt="Product" 
                    className="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-sm" 
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{n.orderSummary.name}</p>
                  {n.orderSummary.variant && (
                    <p className="text-xs text-slate-500 mt-0.5">{n.orderSummary.variant}</p>
                  )}
                  {n.orderSummary.qty && (
                    <p className="text-xs font-bold text-primary mt-1">Qty: {n.orderSummary.qty}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {n.link && (
              <a 
                href={n.link}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md shadow-blue-200/50 cursor-pointer text-center"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                View Details
              </a>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Notification: ${n.title}\n${n.content}`);
                toast.success('Notification copied');
              }}
              className="w-full py-3 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy Content
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── List View ──
  const renderListView = () => (
    <>
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">You have {unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllAsRead}
            title="Mark all as read"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
          </button>
          <button 
            onClick={handleClearAll}
            title="Clear all"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
            <p className="text-sm font-bold mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-300">notifications_paused</span>
            </div>
            <h4 className="text-sm font-black text-slate-700">All Caught Up!</h4>
            <p className="text-xs text-slate-400 font-medium mt-1">You have no new notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(notification => {
              const { icon, bg } = getIconData(notification.type, notification.title);
              return (
                <div 
                  key={notification.id} 
                  onClick={() => handleSelectNotification(notification)}
                  className={`p-4 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 group ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${bg}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-black truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                        {getTimeAgo(notification.createdAt || notification.date)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${!notification.is_read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                      {notification.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                    <span className="material-symbols-outlined text-[16px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
          <button 
            onClick={() => setIsOpen(false)}
            className="text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
          >
            Close Menu
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative cursor-pointer border ${
          isOpen ? 'bg-slate-50 text-primary border-blue-100 shadow-inner' : 'text-slate-500 hover:bg-slate-50 border-slate-100'
        }`}
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#dc2626] text-[10px] text-white flex items-center justify-center rounded-full font-bold shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden transition-all duration-300 flex flex-col ${
          selectedNotification ? 'w-[420px]' : 'w-80 sm:w-[380px]'
        }`}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {selectedNotification ? renderDetailView() : renderListView()}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
