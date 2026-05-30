import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
    // Set up polling or listen for real-time events if needed
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
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
      toast.success('All notifications cleared');
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
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

  const getIconData = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return { icon: 'local_shipping', bg: 'bg-blue-100 text-[#004ac6]' };
      case 'promotion':
        return { icon: 'sell', bg: 'bg-orange-100 text-[#f59e0b]' };
      case 'system':
      default:
        return { icon: 'info', bg: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative cursor-pointer border ${
          isOpen ? 'bg-slate-50 text-[#004ac6] border-blue-100 shadow-inner' : 'text-slate-500 hover:bg-slate-50 border-slate-100'
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-[380px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Notifications</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">You have {unreadCount} unread</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-[#004ac6] hover:text-white transition-all cursor-pointer"
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

          <div className="max-h-[400px] overflow-y-auto">
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
                  const { icon, bg } = getIconData(notification.type);
                  return (
                    <div 
                      key={notification.id} 
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                      className={`p-4 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
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
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#004ac6] shrink-0 mt-2"></div>
                      )}
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
                className="text-xs font-bold text-slate-500 hover:text-[#004ac6] transition-colors uppercase tracking-widest cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
