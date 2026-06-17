import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const UserSupportTab = ({ searchTerm }) => {
  const { user } = useSelector((state) => state.auth);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch list of conversations
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/chat/admin/all-conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Mark as read implicitly
      axios.put(`http://localhost:5000/api/chat/conversations/${convId}/read`, {}, config).catch(() => {});
      
      const res = await axios.get(`http://localhost:5000/api/chat/conversations/${convId}/messages`, config);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Polling logic for list
  useEffect(() => {
    fetchConversations();
    const listInterval = setInterval(fetchConversations, 5000);
    return () => clearInterval(listInterval);
  }, []);

  // Polling logic for active messages
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      const msgInterval = setInterval(() => fetchMessages(activeConversation._id), 3000);
      return () => clearInterval(msgInterval);
    }
  }, [activeConversation]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setIsLoadingMessages(true);
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const myIdStr = user?._id || user?.id;
      const myFullName = user?.full_name || 'Admin Support';
      const myAvatar = user?.avatar_url;

      const tempMsg = {
        _id: Date.now().toString(),
        content: newMessage,
        sender_id: { _id: myIdStr, full_name: myFullName, avatar_url: myAvatar },
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, tempMsg]);
      setNewMessage('');

      const res = await axios.post('http://localhost:5000/api/chat/messages', {
        conversation_id: activeConversation._id,
        content: tempMsg.content
      }, config);

      if (!res.data.success) {
        toast.error('Failed to send message');
        fetchMessages(activeConversation._id);
      } else {
        fetchConversations(); // update latest message in list
      }
    } catch (error) {
      toast.error('Failed to send message');
      fetchMessages(activeConversation._id);
    }
  };

  // Filter list by searchTerm
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const name = conv.customer_id?.full_name?.toLowerCase() || '';
    const email = conv.customer_id?.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex overflow-hidden" style={{ height: '700px' }}>
      
      {/* LEFT PANE: CONVERSATION LIST */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-6 border-b border-slate-200 bg-white shrink-0">
          <h2 className="text-xl font-black text-slate-900">User Support</h2>
          <p className="text-sm text-slate-500 mt-1">Manage customer inquiries</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
              <span className="material-symbols-outlined text-4xl mb-2">forum</span>
              <p className="text-sm">No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const customer = conv.customer_id;
              const myIdStr = user?._id || user?.id;
              const isUnread = conv.latestMessage && !conv.latestMessage.is_read && 
                              (typeof conv.latestMessage.sender_id === 'object' 
                                ? conv.latestMessage.sender_id._id 
                                : conv.latestMessage.sender_id) !== myIdStr;
              const isActive = activeConversation?._id === conv._id;

              return (
                <div 
                  key={conv._id} 
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-4 p-4 border-b border-slate-200/60 cursor-pointer transition-colors relative
                    ${isActive ? 'bg-primary/5' : 'hover:bg-white'} 
                    ${isUnread && !isActive ? 'bg-amber-50' : ''}
                  `}
                >
                  {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                  
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {customer?.avatar_url ? (
                      <img src={customer.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-500">person</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                        {customer?.full_name || 'Unknown User'}
                      </h4>
                      {conv.latestMessage && (
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? 'text-primary font-bold' : 'text-slate-500'}`}>
                          {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                      {conv.latestMessage ? conv.latestMessage.content : 'No messages yet.'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: CHAT VIEW */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 bg-slate-50">
            <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
            <p className="text-lg font-bold">Select a conversation</p>
            <p className="text-sm">Choose a user from the list to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-4 shrink-0 bg-white">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {activeConversation.customer_id?.avatar_url ? (
                  <img src={activeConversation.customer_id.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-slate-500">person</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activeConversation.customer_id?.full_name || 'Unknown User'}</h3>
                <p className="text-xs text-slate-500">{activeConversation.customer_id?.email || 'No email provided'}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f7f9ff] flex flex-col gap-4">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                  <p className="text-sm font-medium">No messages in this conversation yet.</p>
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
                        <div className="flex justify-center my-4">
                          <span className="text-[10px] text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full font-medium">
                            {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_0.2s_ease-out]`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words ${
                          isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 px-1 font-medium">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none focus:border-primary focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-md shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default UserSupportTab;
