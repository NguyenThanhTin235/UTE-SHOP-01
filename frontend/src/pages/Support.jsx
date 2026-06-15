import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import FABGroup from '../../components/FABGroup';

const Support = () => {
  const { user } = useSelector((state) => state.auth);

  // Status Check State
  const [searchTicketId, setSearchTicketId] = useState('');
  const [ticketStatus, setTicketStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Other', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FAQs Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (!searchTicketId.trim()) {
      toast.error('Please enter a valid Ticket ID');
      return;
    }

    setIsChecking(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/support/${searchTicketId.trim()}`);
      if (response.data.success) {
        setTicketStatus(response.data.data);
        toast.success('Ticket found!');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error(error.response?.data?.message || 'Ticket not found');
      setTicketStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to create a support ticket');
      return;
    }

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post('http://localhost:5000/api/support', newTicket, config);
      if (response.data.success) {
        toast.success(`Ticket ${response.data.data.ticketId} created successfully!`);
        setIsModalOpen(false);
        setNewTicket({ subject: '', category: 'Other', description: '' });
        // Automatically show the new ticket status
        setSearchTicketId(response.data.data.ticketId);
        setTicketStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How do I track my order?',
      a: 'You can track your order by going to "My Orders" in your profile section. Each order has a unique tracking number provided by our logistics partners. You can also use the "Orders & Shipping" quick action card above.'
    },
    {
      q: 'What is the return period?',
      a: 'We offer a 15-day free return policy for most items. The item must be in its original condition and packaging. Some categories like electronics or intimate wear may have different policies.'
    },
    {
      q: 'How can I earn and use UTEShop Coins?',
      a: 'You earn coins for every successful purchase (10,000 VND = 100 Coins). You can use these coins to get discounts on your next purchase at a rate of 1 Coin = 1 VND.'
    },
    {
      q: 'Is my payment information secure?',
      a: 'Yes, UTEShop uses industry-standard SSL encryption and partners with leading payment gateways to ensure your data is always protected. We never store your full credit card details.'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'in_progress': return 'bg-blue-50 text-primary';
      case 'resolved': return 'bg-green-50 text-success';
      case 'closed': return 'bg-slate-50 text-slate-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusProgress = (status) => {
    switch(status) {
      case 'pending': return '15%';
      case 'in_progress': return '50%';
      case 'resolved': return '100%';
      case 'closed': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '-2s' }}></div>
          </div>

          <div className="max-w-4xl mx-auto px-margin-mobile text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#131b2e]">
                How can we <span className="text-primary italic">help you?</span>
              </h1>
              <p className="text-[#434655] text-lg font-medium max-w-2xl mx-auto">
                Find answers to your questions, track your orders, and get in touch with our dedicated academic support team.
              </p>
            </div>

              <div className="relative max-w-2xl mx-auto search-container group shadow-[0_20px_40px_-15px_rgba(0,74,198,0.1)] rounded-full">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-[#434655] group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                placeholder="Search for 'how to return', 'refund policy', etc." 
                className="w-full h-16 bg-white border-none rounded-full pl-16 pr-8 text-lg font-medium focus:ring-4 focus:ring-primary/10 transition-all shadow-xl"
              />
              <button 
                onClick={() => toast('Search feature is being optimized', { icon: '🔍' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Popular:</span>
              <button onClick={() => toast('Order Tracking documentation coming soon')} className="text-xs font-bold text-primary hover:underline">Order Tracking</button>
              <button onClick={() => toast('Refund Status documentation coming soon')} className="text-xs font-bold text-primary hover:underline">Refund Status</button>
              <button onClick={() => toast('Voucher Issues documentation coming soon')} className="text-xs font-bold text-primary hover:underline">Voucher Issues</button>
              <button onClick={() => toast('Account Security documentation coming soon')} className="text-xs font-bold text-primary hover:underline">Account Security</button>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="max-w-container-max mx-auto px-margin-mobile -mt-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'local_shipping', color: 'bg-blue-50 text-primary', title: 'Orders & Shipping', desc: 'Track your package, change delivery address, or view order history.', link: '/support/policy/orders-shipping' },
              { icon: 'assignment_return', color: 'bg-amber-50 text-amber-600', title: 'Returns & Refunds', desc: 'Start a return, check refund status, or read our return policy.', link: '/support/policy/returns-refunds' },
              { icon: 'payments', color: 'bg-red-50 text-[#ba1a1a]', title: 'Payments & Wallets', desc: 'Manage payment methods, UTEShop coins, and wallet security.', link: '/support/policy/payments-wallets' },
              { icon: 'verified_user', color: 'bg-green-50 text-[#2e7d32]', title: 'Account & Security', desc: 'Update profile, change password, or report suspicious activity.', link: '/support/policy/account-security' }
            ].map((card, index) => (
              <Link key={index} to={card.link} className="group bg-white p-8 rounded-[2rem] border border-[#c3c6d7]/30 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary group-hover:text-white ${card.color}`}>
                  <span className="material-symbols-outlined text-3xl">{card.icon}</span>
                </div>
                <h3 className="text-lg font-black text-[#131b2e] mb-2">{card.title}</h3>
                <p className="text-sm text-[#434655] font-medium leading-relaxed">{card.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQs Section */}
        <section className="max-w-4xl mx-auto px-margin-mobile py-32 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-[#131b2e]">Frequently Asked Questions</h2>
            <p className="text-[#434655] font-medium">Quick answers to common questions from our academic community.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="group bg-white border border-[#c3c6d7]/30 rounded-3xl overflow-hidden cursor-pointer hover:border-primary hover:bg-[#f7f9ff] transition-all duration-300"
                onClick={() => toggleFaq(index)}
              >
                <div className="p-6 flex justify-between items-center">
                  <h4 className="font-bold text-[#131b2e]">{faq.q}</h4>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-sm text-[#434655] font-medium leading-relaxed animate-[fadeIn_0.3s_ease-in-out]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <button 
              onClick={() => toast('Help Articles are being written. Check back later!', { icon: '📚' })}
              className="px-8 py-3 border-2 border-primary text-primary rounded-full text-sm font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
            >
              View All Help Articles
            </button>
          </div>
        </section>

        {/* Ticket Status Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile py-20">
          <div className="bg-primary/5 rounded-[3rem] p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12 border border-primary/10">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Active Support
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#131b2e]">
                Already have a <span className="text-primary italic">support ticket?</span>
              </h2>
              <p className="text-[#434655] text-lg font-medium">
                Check the status of your ongoing support request by entering your Ticket ID below.
              </p>
              
              <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  value={searchTicketId}
                  onChange={(e) => setSearchTicketId(e.target.value)}
                  placeholder="Enter Ticket ID (e.g. #TK-12345)" 
                  className="flex-1 bg-white border-[#c3c6d7]/50 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-primary focus:border-primary shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={isChecking}
                  className="px-8 py-4 bg-[#131b2e] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-125 transition-all disabled:opacity-50"
                >
                  {isChecking ? 'Checking...' : 'Check Status'}
                </button>
              </form>
            </div>
            
            {/* Display Ticket Status Result */}
            <div className="lg:w-1/3 w-full">
              {ticketStatus ? (
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#c3c6d7]/30 space-y-6 animate-[fadeIn_0.5s_ease-in-out]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket Status</span>
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg ${getStatusColor(ticketStatus.status)}`}>
                      {ticketStatus.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-[#131b2e]">{ticketStatus.ticketId}: {ticketStatus.subject}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Updated {new Date(ticketStatus.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${getStatusColor(ticketStatus.status).split(' ')[0].replace('50', '500')}`} 
                      style={{ width: getStatusProgress(ticketStatus.status) }}
                    ></div>
                  </div>
                  <p className="text-sm text-[#434655] font-medium line-clamp-2">
                    {ticketStatus.description}
                  </p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#c3c6d7]/30 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <span className="material-symbols-outlined text-4xl text-[#c3c6d7] mb-2">assignment</span>
                  <p className="text-[#434655] font-medium text-sm">Enter a ticket ID to view its status here.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile py-32 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">chat</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#131b2e]">Live Chat</h3>
              <p className="text-sm text-[#434655] font-medium mt-2">Chat with our academic support specialists in real-time.</p>
            </div>
            <button 
              onClick={() => toast('Live Chat will be available in the next update', { icon: '💬' })}
              className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-blue-200 transition-all"
            >
              Start Chat
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Avg. wait time: <span className="text-[#2e7d32]">2 mins</span></p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">mail</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#131b2e]">Create Ticket</h3>
              <p className="text-sm text-[#434655] font-medium mt-2">Send us a detailed inquiry and we'll get back to you soon.</p>
            </div>
            <button 
              onClick={() => {
                if(!user) {
                  toast.error('Please login to create ticket');
                  return;
                }
                setIsModalOpen(true);
              }}
              className="w-full py-4 border-2 border-[#c3c6d7] text-[#434655] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f7f9ff] transition-all"
            >
              Open Ticket
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Response within <span className="text-[#131b2e]">24 hours</span></p>
          </div>

          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">call</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#131b2e]">Call Center</h3>
              <p className="text-sm text-[#434655] font-medium mt-2">Speak directly with our team for urgent matters.</p>
            </div>
            <button 
              onClick={() => toast('Call Center Numbers:\n- CSKH: 1900 1234\n- Support: 028 3812 3456', { duration: 5000, icon: '📞' })}
              className="w-full py-4 border-2 border-[#c3c6d7] text-[#434655] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#f7f9ff] transition-all"
            >
              View Phone Numbers
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mon-Fri: <span className="text-[#131b2e]">8:00 - 20:00</span></p>
          </div>
        </section>
      </main>

      <Footer />

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-white border-t border-[#c3c6d7] md:hidden shadow-lg">
        <Link to="/" className="flex flex-col items-center justify-center text-[#505f76] hover:text-primary">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/search" className="flex flex-col items-center justify-center text-[#505f76] hover:text-primary">
          <span className="material-symbols-outlined">storefront</span>
          <span className="text-[10px] font-bold">Shop</span>
        </Link>
        <Link to="/support" className="flex flex-col items-center justify-center text-primary">
          <span className="material-symbols-outlined">help</span>
          <span className="text-[10px] font-bold">Support</span>
        </Link>
        <Link to="/user/profile" className="flex flex-col items-center justify-center text-[#505f76] hover:text-primary">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold">Account</span>
        </Link>
      </nav>

      <FABGroup />

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-8 py-6 border-b border-[#c3c6d7]/30 flex justify-between items-center bg-primary text-white">
              <h2 className="text-xl font-bold">Create Support Ticket</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#131b2e] block">Category</label>
                <select 
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  className="w-full bg-[#f2f3ff] border border-[#c3c6d7] rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="Orders & Shipping">Orders & Shipping</option>
                  <option value="Returns & Refunds">Returns & Refunds</option>
                  <option value="Payments & Wallets">Payments & Wallets</option>
                  <option value="Account & Security">Account & Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#131b2e] block">Subject</label>
                <input 
                  type="text" 
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  placeholder="Brief summary of your issue"
                  className="w-full bg-[#f2f3ff] border border-[#c3c6d7] rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#131b2e] block">Description</label>
                <textarea 
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Please provide details about your issue..."
                  className="w-full h-32 bg-[#f2f3ff] border border-[#c3c6d7] rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[#c3c6d7]/30">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 font-bold text-[#505f76] hover:bg-[#f2f3ff] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Animations defined in a style block or tailwind config */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Support;
