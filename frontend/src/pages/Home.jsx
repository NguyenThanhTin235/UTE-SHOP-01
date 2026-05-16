import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header';

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommended');

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/homepage');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
        toast.error('Không thể tải dữ liệu trang chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004ac6]"></div>
      </div>
    );
  }

  const { banners, categories, flashDeals, newArrivals, bestSellers, campaign } = data || {};

  return (
    <div className="text-[#131b2e] min-h-screen bg-[#faf8ff] font-['Manrope']">
      <Header />

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 space-y-12">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="hidden lg:block bg-white border border-[#c3c6d7] rounded-2xl overflow-hidden shadow-sm h-full">
            <div className="p-4 border-b border-[#c3c6d7]">
              <h3 className="font-bold text-xs uppercase tracking-widest text-[#434655]">Categories</h3>
            </div>
            <nav className="p-2">
              {categories?.map((cat, idx) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className={`category-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${idx === 0 ? 'active' : 'text-[#434655]'}`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {cat.slug.includes('electronics') ? 'devices' : cat.slug.includes('fashion') ? 'apparel' : cat.slug.includes('book') ? 'menu_book' : 'category'}
                  </span>
                  {cat.name}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="lg:col-span-3 relative h-[450px] rounded-3xl overflow-hidden group shadow-md border border-[#c3c6d7]">
            <img src={banners?.[0]?.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1280"} alt="Hero Banner" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#131b2e]/60 to-transparent"></div>
            <div className="relative h-full flex flex-col justify-center px-12 max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#004ac6] px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                CURATED FOR SCHOLARS
              </div>
              <h1 className="text-5xl font-extrabold text-white leading-tight">
                {banners?.[0]?.title || "The Precision Autumn Semester Edit"}
              </h1>
              <p className="text-white/80 text-lg">Engineered for focus. Curated for performance. Discover the intersection of sophisticated design and academic utility.</p>
              <div className="flex gap-4 pt-4">
                <Link to="/shop" className="bg-[#004ac6] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-[#004ac6]/20">Explore the Collection</Link>
                <Link to="#" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-3 rounded-full font-bold hover:bg-white/20 transition-colors">View Lookbook</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Shop by Discipline */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Shop by Discipline</h2>
            <div className="h-[1px] flex-grow mx-8 bg-[#c3c6d7]/30 hidden md:block"></div>
            <span className="text-xs font-bold text-[#434655] uppercase tracking-widest">Faculty Collections</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: 'precision_manufacturing', label: 'Engineering' },
              { icon: 'architecture', label: 'Design & Art' },
              { icon: 'payments', label: 'Business' },
              { icon: 'biotech', label: 'Sciences' },
              { icon: 'history_edu', label: 'Humanities' },
              { icon: 'balance', label: 'Law & Policy' },
            ].map((d, i) => (
              <button key={i} className="group p-4 bg-white border border-[#c3c6d7] rounded-2xl hover:border-[#004ac6] transition-all text-center">
                <span className="material-symbols-outlined text-3xl mb-2 text-[#434655] group-hover:text-[#004ac6] transition-colors">{d.icon}</span>
                <p className="text-xs font-bold uppercase tracking-wide">{d.label}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Flash Deals */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 fill-1 animate-pulse">bolt</span>
                <h2 className="text-2xl font-extrabold tracking-tight">Flash Sale: {campaign?.name || 'The Lab Edition'}</h2>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="flex flex-col items-center">
                  <div className="bg-[#131b2e] text-white px-3 py-1.5 rounded-lg text-sm font-bold font-mono shadow-sm">02</div>
                  <span className="text-[8px] uppercase font-bold mt-1 opacity-50">Hrs</span>
                </div>
                <span className="font-bold mb-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#131b2e] text-white px-3 py-1.5 rounded-lg text-sm font-bold font-mono shadow-sm">45</div>
                  <span className="text-[8px] uppercase font-bold mt-1 opacity-50">Min</span>
                </div>
                <span className="font-bold mb-4">:</span>
                <div className="flex flex-col items-center">
                  <div className="bg-[#131b2e] text-white px-3 py-1.5 rounded-lg text-sm font-bold font-mono shadow-sm">12</div>
                  <span className="text-[8px] uppercase font-bold mt-1 opacity-50">Sec</span>
                </div>
              </div>
            </div>
            <Link to="/deals" className="text-sm font-bold text-[#004ac6] hover:underline">View All Deals</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flashDeals?.map((product) => (
              <div key={product.id} className="product-card bg-white border border-[#c3c6d7] rounded-2xl overflow-hidden flex flex-col group cursor-pointer">
                <Link to={`/product/${product.slug}`} className="aspect-[4/3] bg-[#eaedff] relative block overflow-hidden">
                  <img src={product.media?.[0] || "https://via.placeholder.com/400x300"} alt={product.name} className="w-full h-full object-cover p-2 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                    -{Math.round((1 - product.sellingPrice / product.mrpPrice) * 100)}%
                  </div>
                </Link>
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#004ac6] uppercase tracking-widest">Tech Essential</span>
                    <span className="text-[10px] font-medium text-[#434655] flex items-center gap-1"><span className="material-symbols-outlined text-[12px] fill-1 text-amber-500">star</span> {product.averageRating || 5.0}</span>
                  </div>
                  <Link to={`/product/${product.slug}`} className="font-bold text-sm line-clamp-2 hover:text-[#004ac6] transition-colors block mb-3 min-h-[2.5rem]">{product.name}</Link>
                  
                  <div className="mt-auto space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-[#004ac6]">{product.sellingPrice.toLocaleString()}₫</span>
                        <span className="text-xs text-[#434655] line-through">{product.mrpPrice.toLocaleString()}₫</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-[#434655] uppercase">
                          <span>Sold 65%</span>
                        </div>
                        <div className="h-1 bg-[#e1e4f5] rounded-full overflow-hidden">
                          <div className="h-full bg-[#004ac6]" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#004ac6] text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-sm">
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Product Exploration */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#c3c6d7] gap-4">
            <div className="flex gap-8">
              <button onClick={() => setActiveTab('recommended')} className={`tab-btn pb-4 text-sm font-bold ${activeTab === 'recommended' ? 'active text-[#004ac6]' : 'text-[#434655] hover:text-[#004ac6]'}`}>Recommended</button>
              <button onClick={() => setActiveTab('best-sellers')} className={`tab-btn pb-4 text-sm font-bold ${activeTab === 'best-sellers' ? 'active text-[#004ac6]' : 'text-[#434655] hover:text-[#004ac6]'}`}>Best Sellers</button>
              <button onClick={() => setActiveTab('new-arrivals')} className={`tab-btn pb-4 text-sm font-bold ${activeTab === 'new-arrivals' ? 'active text-[#004ac6]' : 'text-[#434655] hover:text-[#004ac6]'}`}>New Arrivals</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {(activeTab === 'new-arrivals' ? newArrivals : activeTab === 'best-sellers' ? bestSellers : newArrivals)?.map((product) => (
              <div key={product.id} className="product-card bg-white border border-[#c3c6d7] rounded-2xl overflow-hidden flex flex-col group cursor-pointer">
                <Link to={`/product/${product.slug}`} className="aspect-square bg-[#eaedff] relative block overflow-hidden">
                  <img src={product.media?.[0] || "https://via.placeholder.com/400"} alt={product.name} className="w-full h-full object-cover p-2 group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-[#004ac6] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-tight">CAMPUS TREND</div>
                </Link>
                <div className="p-4 flex-grow flex flex-col">
                  <Link to={`/product/${product.slug}`} className="font-bold text-sm line-clamp-2 leading-snug hover:text-[#004ac6] transition-colors block mb-2 min-h-[2.5rem]">{product.name}</Link>
                  <div className="mt-auto space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#004ac6]">{product.sellingPrice.toLocaleString()}₫</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#434655]">Lifestyle</span>
                        <span className="text-[10px] text-[#434655] ml-auto flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] fill-1 text-amber-500">star</span> {product.averageRating || 5.0}</span>
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-[#004ac6]/10 text-[#004ac6] rounded-xl font-bold text-xs hover:bg-[#004ac6] hover:text-white transition-all active:scale-95">
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <button className="px-12 py-3 rounded-xl border-2 border-[#004ac6] text-[#004ac6] font-bold hover:bg-[#004ac6] hover:text-white transition-all duration-300">
              Load More Products
            </button>
          </div>
        </section>

        {/* Student Perks */}
        <section className="bg-white border border-[#c3c6d7] rounded-3xl p-12 overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#004ac6]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#004ac6]/10 transition-colors"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight">Verified Student Benefits</h2>
              <p className="text-[#434655] text-lg leading-relaxed">Join 15,000+ scholars getting exclusive access to academic pricing, early-release textbooks, and limited-edition faculty merchandise.</p>
              <button className="bg-[#131b2e] text-white px-8 py-4 rounded-full font-bold hover:bg-[#004ac6] transition-all flex items-center gap-3 shadow-lg shadow-[#131b2e]/10">
                <span className="material-symbols-outlined">verified_user</span>
                Verify My Student ID
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[#eaedff] rounded-2xl border border-[#c3c6d7]/50 text-center">
                <p className="text-2xl font-extrabold text-[#004ac6]">15%</p>
                <p className="text-[10px] font-bold text-[#434655] uppercase mt-1 tracking-wider">Tech Discount</p>
              </div>
              <div className="p-6 bg-[#eaedff] rounded-2xl border border-[#c3c6d7]/50 text-center">
                <p className="text-2xl font-extrabold text-[#004ac6]">Free</p>
                <p className="text-[10px] font-bold text-[#434655] uppercase mt-1 tracking-wider">Campus Delivery</p>
              </div>
              <div className="p-6 bg-[#eaedff] rounded-2xl border border-[#c3c6d7]/50 text-center">
                <p className="text-2xl font-extrabold text-[#004ac6]">Priority</p>
                <p className="text-[10px] font-bold text-[#434655] uppercase mt-1 tracking-wider">Lab Access</p>
              </div>
              <div className="p-6 bg-[#eaedff] rounded-2xl border border-[#c3c6d7]/50 text-center">
                <p className="text-2xl font-extrabold text-[#004ac6]">24h</p>
                <p className="text-[10px] font-bold text-[#434655] uppercase mt-1 tracking-wider">Support Line</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#f7f9ff] border-t border-[#c3c6d7] mt-24">
        <div className="w-full py-12 px-margin-mobile md:px-margin-desktop mt-auto flex flex-col md:flex-row justify-between items-start max-w-container-max mx-auto gap-12">
          <div className="max-w-xs space-y-6">
            <Link to="/" className="font-['Manrope'] text-2xl text-[#004ac6] tracking-tight font-extrabold block">UTEShop</Link>
            <p className="text-sm text-[#434655] leading-relaxed">Elevating the multi-vendor experience with academic precision and soft aesthetics.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-grow">
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider">Explore</h4>
              <ul className="space-y-3 text-sm text-[#434655]">
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">New Arrivals</Link></li>
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">Featured Designers</Link></li>
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">Boutiques</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm text-[#434655]">
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">About Us</Link></li>
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">Careers</Link></li>
                <li><Link className="hover:text-[#004ac6] transition-all" to="#">Terms of Service</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1 space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider">Connect</h4>
              <div className="flex gap-4">
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-[#004ac6] hover:text-white transition-all shadow-sm" href="#"><span className="material-symbols-outlined text-[20px]">language</span></a>
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-[#004ac6] hover:text-white transition-all shadow-sm" href="#"><span className="material-symbols-outlined text-[20px]">alternate_email</span></a>
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e1e4f5] text-[#434655] hover:bg-[#004ac6] hover:text-white transition-all shadow-sm" href="#"><span className="material-symbols-outlined text-[20px]">share</span></a>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-margin-mobile md:px-margin-desktop py-6 border-t border-[#c3c6d7] max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#434655]">© 2024 UTEShop Marketplace.</p>
          <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Academic Modernism Framework v1.0</p>
        </div>
      </footer>

      {/* AI Chatbot FAB */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-[#004ac6] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group">
        <span className="material-symbols-outlined text-3xl group-hover:hidden">smart_toy</span>
        <span className="material-symbols-outlined text-3xl hidden group-hover:block">chat</span>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">1</span>
      </button>
    </div>
  );
};

export default Home;
