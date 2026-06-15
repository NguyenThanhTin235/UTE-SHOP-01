import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const CustomerChatWidget = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  
  const [viewState, setViewState] = useState('list'); // 'list' or 'chat'
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null); // { id, title, type, logo }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (viewState === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, viewState]);

  // Main polling & fetching logic
  useEffect(() => {
    let interval;
    if (isOpen && user) {
      if (viewState === 'list') {
        fetchConversations();
        interval = setInterval(fetchConversations, 5000);
      } else if (viewState === 'chat' && activeConversation?.id) {
        fetchMessages();
        interval = setInterval(fetchMessages, 3000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, user, viewState, activeConversation]);

  // Reset to list view when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setViewState('list');
        setActiveConversation(null);
        setMessages([]);
      }, 300); // Wait for transition
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/chat/conversations', config);
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!activeConversation?.id) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      axios.put(`http://localhost:5000/api/chat/conversations/${activeConversation.id}/read`, {}, config)
        .then(() => document.dispatchEvent(new CustomEvent('refresh-unread-chat')))
        .catch(() => {});

      const res = await axios.get(`http://localhost:5000/api/chat/conversations/${activeConversation.id}/messages`, config);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleOpenAdminChat = async () => {
    // Admin chat might already exist in conversations
    const existingAdminChat = conversations.find(c => c.type === 'admin');
    if (existingAdminChat) {
      setActiveConversation({ id: existingAdminChat._id, title: 'Admin Support', type: 'admin' });
      setViewState('chat');
    } else {
      // Need to init
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.post('http://localhost:5000/api/chat/admin/init', {}, config);
        
        if (res.data.success) {
          setActiveConversation({ id: res.data.data._id, title: 'Admin Support', type: 'admin' });
          setViewState('chat');
        }
      } catch (error) {
        toast.error('Failed to connect to Admin Support.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const onOpenAdminChat = () => {
      handleOpenAdminChat();
    };
    document.addEventListener('open-admin-chat', onOpenAdminChat);
    return () => document.removeEventListener('open-admin-chat', onOpenAdminChat);
  }, [conversations]);

  const handleOpenShopChat = (conv) => {
    setActiveConversation({ 
      id: conv._id, 
      title: conv.shop_id?.name || 'Shop', 
      type: 'shop',
      logo: conv.shop_id?.logo_url 
    });
    setViewState('chat');
  };

  const handleBackToList = () => {
    setViewState('list');
    setActiveConversation(null);
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation?.id) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const tempMsg = {
        _id: Date.now().toString(),
        content: newMessage,
        sender_id: { _id: user._id || user.id, full_name: user.full_name, avatar_url: user.avatar_url },
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
      setNewMessage('');

      const res = await axios.post('http://localhost:5000/api/chat/messages', {
        conversation_id: activeConversation.id,
        content: tempMsg.content
      }, config);

      if (!res.data.success) {
        fetchMessages();
        toast.error('Failed to send message');
      } else {
          // If we are sending a new message to admin chat that was just created, we need to refresh the list next time we go back
      }
    } catch (error) {
      toast.error('Failed to send message');
      fetchMessages();
    }
  };

  if (!isOpen) return null;

  const adminConv = conversations.find(c => c.type === 'admin');
  const shopConvs = conversations.filter(c => c.type === 'shop');

  return (
    <div className="fixed bottom-8 right-[110px] w-[380px] h-[550px] bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden z-50 border border-[#c3c6d7]/30 animate-[slideUp_0.3s_ease-out]">
      
      {/* Header */}
      <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          {viewState === 'chat' && (
            <button onClick={handleBackToList} className="p-1.5 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center -ml-2">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
            {viewState === 'list' ? (
              <span className="material-symbols-outlined">forum</span>
            ) : activeConversation?.type === 'admin' ? (
              <span className="material-symbols-outlined">support_agent</span>
            ) : activeConversation?.logo ? (
              <img src={activeConversation.logo} alt="Shop" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined">storefront</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold truncate">{viewState === 'list' ? 'Messages' : activeConversation?.title}</h3>
            <p className="text-[10px] text-white/80 truncate">
              {viewState === 'list' ? 'Your conversations' : activeConversation?.type === 'admin' ? 'We typically reply in minutes' : 'Shop Support'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-6 bg-[#f7f9ff]">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d7]">lock</span>
          <p className="text-sm font-medium text-[#434655]">Please log in to chat with support or shops.</p>
        </div>
      ) : viewState === 'list' ? (
        /* LIST VIEW */
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Admin Pinned Item */}
          {(() => {
            const isAdminUnread = adminConv?.latestMessage && !adminConv.latestMessage.is_read && (typeof adminConv.latestMessage.sender_id === 'object' ? adminConv.latestMessage.sender_id._id : adminConv.latestMessage.sender_id) !== (user?._id || user?.id);
            return (
              <div 
                onClick={handleOpenAdminChat}
                className={`flex items-center gap-4 p-4 border-b border-[#c3c6d7]/20 hover:bg-amber-50 cursor-pointer transition-colors relative group ${isAdminUnread ? 'bg-amber-100/50' : 'bg-amber-50/40'}`}
              >
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`truncate ${isAdminUnread ? 'font-black text-[#131b2e]' : 'font-bold text-[#131b2e]'}`}>Admin Support</h4>
                    {adminConv?.latestMessage && (
                      <span className={`text-[10px] whitespace-nowrap ml-2 ${isAdminUnread ? 'text-primary font-bold' : 'text-[#434655]'}`}>
                        {new Date(adminConv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate ${isAdminUnread ? 'text-[#131b2e] font-bold' : 'text-[#434655]'}`}>
                    {adminConv?.latestMessage ? adminConv.latestMessage.content : "Tap to start conversation"}
                  </p>
                </div>
                <span className="material-symbols-outlined text-amber-500 text-sm absolute right-4 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity">push_pin</span>
                {isAdminUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              </div>
            );
          })()}

          {/* Shop List */}
          {shopConvs.length === 0 ? (
            <div className="p-8 text-center text-[#434655] text-sm opacity-60">
              No shop conversations yet.
            </div>
          ) : (
            shopConvs.map(conv => {
              const isUnread = conv.latestMessage && !conv.latestMessage.is_read && (typeof conv.latestMessage.sender_id === 'object' ? conv.latestMessage.sender_id._id : conv.latestMessage.sender_id) !== (user?._id || user?.id);
              return (
                <div 
                  key={conv._id}
                  onClick={() => handleOpenShopChat(conv)}
                  className={`flex items-center gap-4 p-4 border-b border-[#c3c6d7]/20 hover:bg-[#f7f9ff] cursor-pointer transition-colors relative ${isUnread ? 'bg-[#f7f9ff]' : ''}`}
                >
                  <div className="w-12 h-12 bg-[#f2f3ff] text-primary rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-[#c3c6d7]/30">
                    {conv.shop_id?.logo_url ? (
                      <img src={conv.shop_id.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined">storefront</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`truncate ${isUnread ? 'font-black text-[#131b2e]' : 'font-bold text-[#131b2e]'}`}>{conv.shop_id?.name || 'Shop'}</h4>
                      {conv.latestMessage && (
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? 'text-primary font-bold' : 'text-[#434655]'}`}>
                          {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-[#131b2e] font-bold' : 'text-[#434655]'}`}>
                      {conv.latestMessage ? conv.latestMessage.content : "Start chatting..."}
                    </p>
                  </div>
                  {isUnread && <div className="absolute right-4 w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CHAT VIEW */
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-[#f7f9ff] flex flex-col gap-4">
            {isLoading && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                <span className="material-symbols-outlined text-4xl">forum</span>
                <p className="text-sm font-medium">Send a message to start the conversation</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const senderIdStr = typeof msg.sender_id === 'object' ? msg.sender_id?._id : msg.sender_id;
                const myIdStr = user?._id || user?.id;
                const isMe = senderIdStr === myIdStr;
                
                const msgDate = new Date(msg.createdAt).toDateString();
                const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                const showDate = msgDate !== prevMsgDate;

                return (
                  <React.Fragment key={msg._id}>
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <span className="text-[10px] text-[#434655] bg-[#c3c6d7]/20 px-3 py-1 rounded-full font-medium shadow-sm">
                          {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_0.2s_ease-out]`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words ${
                        isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-[#c3c6d7]/30 text-[#131b2e] rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-[#434655] px-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-[#c3c6d7]/30 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#f2f3ff] border border-transparent rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary/30 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerChatWidget;
