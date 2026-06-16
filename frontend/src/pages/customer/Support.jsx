import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import FABGroup from '../../components/FABGroup';

const Support = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNoMatchModal, setShowNoMatchModal] = useState(false);
  const [contactModalInfo, setContactModalInfo] = useState(null);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    if (query.includes('return') || query.includes('refund')) {
      navigate('/support/policy/returns-refunds');
    } else if (query.includes('order') || query.includes('ship') || query.includes('track')) {
      navigate('/support/policy/orders-shipping');
    } else if (query.includes('pay') || query.includes('wallet') || query.includes('coin') || query.includes('voucher')) {
      navigate('/support/policy/payments-wallets');
    } else if (query.includes('account') || query.includes('password') || query.includes('secur')) {
      navigate('/support/policy/account-security');
    } else {
      setShowNoMatchModal(true);
    }
  };

  // FAQs Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
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

              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto search-container group shadow-[0_20px_40px_-15px_rgba(0,74,198,0.1)] rounded-full">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-[#434655] group-focus-within:text-primary transition-colors">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for 'how to return', 'refund policy', etc." 
                className="w-full h-16 bg-white border-none rounded-full pl-16 pr-32 text-lg font-medium focus:ring-4 focus:ring-primary/10 transition-all shadow-xl outline-none"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Popular:</span>
              <Link to="/support/policy/orders-shipping" className="text-xs font-bold text-primary hover:underline">Order Tracking</Link>
              <Link to="/support/policy/returns-refunds" className="text-xs font-bold text-primary hover:underline">Refund Status</Link>
              <Link to="/support/policy/payments-wallets" className="text-xs font-bold text-primary hover:underline">Voucher Issues</Link>
              <Link to="/support/policy/account-security" className="text-xs font-bold text-primary hover:underline">Account Security</Link>
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
            <Link 
              to="/blog"
              className="inline-block px-8 py-3 border-2 border-primary text-primary rounded-full text-sm font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
            >
              View All Help Articles
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section className="max-w-container-max mx-auto px-margin-mobile py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">chat</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#131b2e]">Live Chat</h3>
              <p className="text-sm text-[#434655] font-medium mt-2">Chat with our academic support specialists in real-time.</p>
            </div>
            <button 
              onClick={() => document.dispatchEvent(new CustomEvent('open-admin-chat'))}
              className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-blue-200 transition-all cursor-pointer"
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
              <h3 className="text-xl font-black text-[#131b2e]">Email Support</h3>
              <p className="text-sm text-[#434655] font-medium mt-2">Send us a detailed inquiry via email and we'll reply soon.</p>
            </div>
            <button 
              onClick={() => setContactModalInfo({ type: 'email' })}
              className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              Send Email
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
              onClick={() => setContactModalInfo({ type: 'phone' })}
              className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg shadow-blue-200 transition-all cursor-pointer"
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

      <FABGroup />

      {/* No Match Modal */}
      {showNoMatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-8 py-6 border-b border-[#c3c6d7]/30 flex justify-between items-center bg-primary text-white">
              <h2 className="text-xl font-bold">Search Results</h2>
              <button 
                onClick={() => setShowNoMatchModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">search_off</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-[#131b2e]">No exact match found</h3>
                <p className="text-sm text-[#434655] font-medium mt-2">
                  We couldn't find a specific policy matching "{searchQuery}".
                </p>
              </div>
              
              <div className="text-left bg-[#f2f3ff] p-4 rounded-xl space-y-2">
                <p className="text-xs font-bold text-[#131b2e] uppercase tracking-widest">Suggested topics:</p>
                <ul className="text-sm text-primary font-medium flex flex-col gap-2">
                  <li><Link to="/support/policy/returns-refunds" onClick={() => setShowNoMatchModal(false)} className="hover:underline flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">arrow_right_alt</span> Returns & Refunds</Link></li>
                  <li><Link to="/support/policy/orders-shipping" onClick={() => setShowNoMatchModal(false)} className="hover:underline flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">arrow_right_alt</span> Orders & Shipping</Link></li>
                  <li><Link to="/support/policy/account-security" onClick={() => setShowNoMatchModal(false)} className="hover:underline flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">arrow_right_alt</span> Account Security</Link></li>
                </ul>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowNoMatchModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-[#434655] font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    window.location.href = 'mailto:support@uteshop.com';
                  }}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors"
                >
                  Email Us
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Info Modal */}
      {contactModalInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-in-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="px-8 py-6 border-b border-[#c3c6d7]/30 flex justify-between items-center bg-primary text-white">
              <h2 className="text-xl font-bold">
                {contactModalInfo.type === 'phone' ? 'Call Center Information' : 
                 contactModalInfo.type === 'email' ? 'Email Support' : 'Live Chat'}
              </h2>
              <button 
                onClick={() => setContactModalInfo(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                contactModalInfo.type === 'phone' ? 'bg-red-50 text-[#ba1a1a]' : 
                contactModalInfo.type === 'email' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-primary'
              }`}>
                <span className="material-symbols-outlined text-4xl">
                  {contactModalInfo.type === 'phone' ? 'call' : 
                   contactModalInfo.type === 'email' ? 'mail' : 'chat'}
                </span>
              </div>
              
              <div className="bg-[#f2f3ff] p-6 rounded-2xl text-left space-y-4">
                {contactModalInfo.type === 'phone' && (
                  <>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Service (CSKH)</p>
                      <p className="text-lg font-black text-[#131b2e]">1900 1234</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Technical Support</p>
                      <p className="text-lg font-black text-[#131b2e]">028 3812 3456</p>
                    </div>
                  </>
                )}
                {contactModalInfo.type === 'email' && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Direct Email</p>
                    <p className="text-lg font-black text-[#131b2e]">support@uteshop.com</p>
                    <p className="text-sm text-[#434655] mt-2">Please include your Order ID if applicable for faster resolution.</p>
                  </div>
                )}
                {contactModalInfo.type === 'chat' && (
                  <div className="text-center">
                    <p className="text-lg font-black text-[#131b2e]">Coming Soon</p>
                    <p className="text-sm text-[#434655] mt-2">Our live chat feature is currently being upgraded. Please use Email or Call Center for immediate assistance.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setContactModalInfo(null)}
                className="w-full py-3 bg-slate-100 text-[#434655] font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
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
