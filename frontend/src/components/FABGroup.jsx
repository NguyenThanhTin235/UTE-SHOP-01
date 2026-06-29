import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import CustomerChatWidget from './CustomerChatWidget';
import ChatbotWidget from './ChatbotWidget';

const FABGroup = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    document.addEventListener('open-admin-chat', handleOpenChat);
    document.addEventListener('open-shop-chat', handleOpenChat);
    return () => {
      document.removeEventListener('open-admin-chat', handleOpenChat);
      document.removeEventListener('open-shop-chat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    let interval;
    const fetchUnread = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('http://localhost:5000/api/chat/unread-count', config);
        if (res.data.success) {
          setUnreadCount(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnread();
    interval = setInterval(fetchUnread, 5000);

    const refreshUnread = () => fetchUnread();
    document.addEventListener('refresh-unread-chat', refreshUnread);

    return () => {
      clearInterval(interval);
      document.removeEventListener('refresh-unread-chat', refreshUnread);
    };
  }, [user]);

  const isHiddenRoute = /^\/(admin|seller|manager|shipper)/.test(location.pathname);
  if (isHiddenRoute) return null;

  return (
    <>
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        {/* Message FAB */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border border-primary/10"
        >
          <span className="material-symbols-outlined text-3xl">{isChatOpen ? 'close' : 'chat'}</span>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white text-[#ba1a1a] font-black flex items-center justify-center rounded-full border-2 border-[#ba1a1a] shadow-lg text-[12px]">{unreadCount}</div>
          )}
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-[#131b2e] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Support Chat</span>
        </button>
        {/* AI Chatbot FAB */}
        <button 
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border border-primary/10"
        >
          <span className="material-symbols-outlined text-3xl">{isAIChatOpen ? 'close' : 'smart_toy'}</span>
          {!isAIChatOpen && (
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-white text-[#ba1a1a] font-black flex items-center justify-center rounded-full border-2 border-[#ba1a1a] shadow-lg text-[12px]">1</div>
          )}
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-[#131b2e] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">AI Assistant</span>
        </button>
      </div>

      <CustomerChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ChatbotWidget isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </>
  );
};

export default FABGroup;
