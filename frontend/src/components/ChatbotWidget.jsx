import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, User, Loader2, Plus, Copy, Check, Ticket } from 'lucide-react';

const CouponCard = ({ coupon }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(coupon.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 shadow-sm w-full shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Ticket size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-800">{coupon.type === 'percent' ? `Giảm ${coupon.value}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(coupon.value)}đ`}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {coupon.min_order_total ? `Đơn từ ${new Intl.NumberFormat('vi-VN').format(coupon.min_order_total)}đ` : 'Mọi đơn hàng'}
                        {coupon.max_discount ? ` (Tối đa ${new Intl.NumberFormat('vi-VN').format(coupon.max_discount)}đ)` : ''}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-gray-200">{coupon.code}</span>
                <button onClick={handleCopy} className="text-[10px] flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium">
                    {copied ? <><Check size={12} /> Đã chép</> : <><Copy size={12} /> Sao chép</>}
                </button>
            </div>
        </div>
    );
};

const ChatbotWidget = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionToken, setSessionToken] = useState(localStorage.getItem('chatbot_session') || '');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            if (messages.length === 0) {
                fetchHistory();
            }
        }
    }, [isOpen, messages]);

    const fetchHistory = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const params = sessionToken ? { sessionToken } : {};
            
            const response = await axios.get('http://localhost:5000/api/chatbot/history', { headers, params });
            if (response.data.success && response.data.data.length > 0) {
                setMessages(response.data.data);
            } else {
                // Initial greeting
                setMessages([{ sender: 'bot', content: 'Hello! I am the AI Assistant for UTE-SHOP. How can I help you today? (e.g. Product consultation, Item search, Order tracking...)' }]);
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { sender: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.post('http://localhost:5000/api/chatbot/message', {
                message: userMsg.content,
                sessionToken: sessionToken
            }, { headers });

            if (response.data.success) {
                setMessages(prev => [...prev, response.data.message]);
                if (response.data.sessionToken && response.data.sessionToken !== sessionToken) {
                    setSessionToken(response.data.sessionToken);
                    localStorage.setItem('chatbot_session', response.data.sessionToken);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, { sender: 'bot', content: 'Sorry, the system is encountering an issue. Please try again later!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        // Clear local storage and state to start a fresh chat session
        localStorage.removeItem('chatbot_session');
        setSessionToken('');
        setMessages([{ sender: 'bot', content: 'Hello! I am the AI Assistant for UTE-SHOP. How can I help you today? (e.g. Product consultation, Item search, Order tracking...)' }]);
    };

    return (
        <div className="fixed bottom-6 right-[100px] z-50">

            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot size={24} />
                            <div>
                                <h3 className="font-bold text-sm">UTE-SHOP AI Assistant</h3>
                                <p className="text-xs text-white/80">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={handleNewChat} title="New Chat" className="hover:bg-white/20 p-1 rounded-full transition-colors">
                                <Plus size={20} />
                            </button>
                            <button onClick={onClose} title="Close" className="hover:bg-white/20 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-100 text-primary' : 'bg-primary/10 text-primary'}`}>
                                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className="flex flex-col gap-1 w-full overflow-hidden">
                                    <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none whitespace-pre-wrap'}`}>
                                        {msg.content}
                                    </div>
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-1 w-full">
                                            {msg.attachments.map((att, attIdx) => {
                                                if (att.type === 'products') {
                                                    return (
                                                        <div key={attIdx} className="flex overflow-x-auto gap-2 pb-2 w-full scrollbar-thin">
                                                            {att.data.map(product => (
                                                                <Link to={`/product/${product.slug}`} key={product._id} className="min-w-[140px] max-w-[140px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow shrink-0">
                                                                    <img src={product.images && product.images.length > 0 ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0].startsWith('/') ? '' : '/'}${product.images[0]}`) : '/placeholder.png'} alt={product.name} className="w-full h-24 object-cover" />
                                                                    <div className="p-2 flex flex-col gap-1">
                                                                        <h4 className="text-xs font-bold truncate" title={product.name}>{product.name}</h4>
                                                                        <div className="text-xs text-primary font-bold">
                                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.selling_price)}
                                                                        </div>
                                                                        {product.mrp_price > product.selling_price && (
                                                                            <div className="text-[10px] text-gray-400 line-through">
                                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.mrp_price)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    );
                                                } else if (att.type === 'order') {
                                                    const order = att.data;
                                                    return (
                                                        <div key={attIdx} className="bg-white border border-primary/20 rounded-lg p-3 shadow-sm w-full shrink-0">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-gray-600">Đơn hàng #{order.order_code}</span>
                                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-500">Tổng tiền:</span>
                                                                <span className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (att.type === 'coupons') {
                                                    return (
                                                        <div key={attIdx} className="flex flex-col gap-2 w-full">
                                                            {att.data.map((coupon, cIdx) => (
                                                                <CouponCard key={cIdx} coupon={coupon} />
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 max-w-[85%] self-start">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Bot size={16} />
                                </div>
                                <div className="p-3 bg-white border border-gray-200 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 className="animate-spin text-primary" size={16} />
                                    <span className="text-xs text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
