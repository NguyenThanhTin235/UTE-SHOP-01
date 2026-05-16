import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Header from '../components/Header';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Interactions
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/public/product/${slug}`);
        if (response.data.success) {
          setData(response.data.data);
          if (response.data.data.media?.length > 0) {
            setSelectedImage(response.data.data.media[0].mediaUrl);
          }
        }
      } catch (error) {
        toast.error('Failed to load product details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!data) return null;

  const { product, shop, category, media, variants, stock, sold, reviews, relatedProducts } = data;

  const handleQuantityChange = (type) => {
    if (type === 'inc' && quantity < stock) setQuantity(q => q + 1);
    if (type === 'dec' && quantity > 1) setQuantity(q => q - 1);
  };

  const handleAddToCart = () => {
    toast.success('Added to cart successfully!');
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-['Manrope']">
      <Header />
      <main className="flex-grow max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#434655] mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-[#004ac6]">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          {category?.breadcrumbs?.map((bc, i) => (
             <React.Fragment key={i}>
                <Link to={`/category/${bc.slug}`} className="hover:text-[#004ac6]">{bc.name}</Link>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
             </React.Fragment>
          ))}
          <span className="text-[#131b2e] font-semibold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border border-[#c3c6d7] group">
              <img src={selectedImage || 'https://via.placeholder.com/800'} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-zoom-in" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {stock > 0 ? (
                   <span className="bg-[#004ac6] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">In Stock</span>
                ) : (
                   <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">Out of Stock</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {media?.map((m, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(m.mediaUrl)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === m.mediaUrl ? 'border-[#004ac6] opacity-100 scale-105 shadow-md' : 'border-[#c3c6d7] opacity-60 hover:opacity-100 hover:border-[#004ac6]'}`}
                >
                  <img src={m.mediaUrl} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-2">
              <p className="text-[12px] text-[#004ac6] font-bold tracking-widest uppercase">{shop?.name || 'UTEShop Official'}</p>
              <h1 className="text-3xl font-extrabold text-[#131b2e] leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[#505f76]">
                  <span className="material-symbols-outlined text-[18px] text-amber-500" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  <span className="font-bold">{product.averageRating || 5.0}</span>
                </div>
                <span className="text-[#737686]">|</span>
                <span className="text-sm text-[#434655] underline cursor-pointer">{reviews?.length || 0} Reviews</span>
                <span className="text-[#737686]">|</span>
                <span className="text-sm text-[#434655]">{sold || 0} Sold</span>
              </div>
            </div>

            <div className="bg-[#eaedff] p-6 rounded-2xl space-y-3">
              <div className="flex items-baseline flex-wrap gap-x-4 gap-y-2">
                <p className="text-4xl text-[#004ac6] font-extrabold">{product.sellingPrice.toLocaleString()}₫</p>
                {product.mrpPrice > product.sellingPrice && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[#434655] line-through">{product.mrpPrice.toLocaleString()}₫</p>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      -{Math.round((1 - product.sellingPrice / product.mrpPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Variations */}
            {variants?.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-sm font-bold uppercase tracking-wider text-[#505f76]">Options</p>
                    <div className="flex flex-wrap gap-2">
                        {variants.map(v => (
                            <button 
                                key={v.id} 
                                onClick={() => setSelectedVariant(v)}
                                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${selectedVariant?.id === v.id ? 'border-2 border-[#004ac6] text-[#004ac6] bg-[#004ac6]/5 shadow-sm' : 'border-[#c3c6d7] hover:border-[#004ac6] hover:text-[#004ac6]'}`}>
                                {Object.values(v.attributes).join(' - ')}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wider text-[#505f76]">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#f2f3ff] rounded-xl p-1 border border-[#c3c6d7]">
                  <button onClick={() => handleQuantityChange('dec')} className="w-10 h-10 flex items-center justify-center hover:bg-[#e2e7ff] rounded-lg transition-colors">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <input type="text" value={quantity} readOnly className="w-12 text-center bg-transparent border-none focus:ring-0 font-bold" />
                  <button onClick={() => handleQuantityChange('inc')} className="w-10 h-10 flex items-center justify-center hover:bg-[#e2e7ff] rounded-lg transition-colors">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <p className="text-xs text-[#434655]">{stock} pieces available</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={handleAddToCart} disabled={stock <= 0} className="flex items-center justify-center gap-2 border-2 border-[#004ac6] text-[#004ac6] py-4 rounded-2xl font-bold hover:bg-[#004ac6]/5 transition-all disabled:opacity-50 active:scale-95">
                <span className="material-symbols-outlined">add_shopping_cart</span>
                Add to Cart
              </button>
              <button disabled={stock <= 0} className="bg-[#004ac6] text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95">
                Buy It Now
              </button>
            </div>
            
          </div>
        </div>

        {/* Shop Profile */}
        {shop && (
          <section className="mt-12 bg-[#eaedff] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 border border-[#c3c6d7]/50">
              <div className="flex items-center gap-4 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#c3c6d7] pb-6 md:pb-0">
                  <div className="relative">
                      <img src={shop.logoUrl || "https://via.placeholder.com/100"} alt="Shop Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#004ac6] ring-4 ring-[#004ac6]/10" />
                      <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[#eaedff] rounded-full"></span>
                  </div>
                  <div>
                      <h3 className="text-xl font-bold text-[#131b2e]">{shop.name}</h3>
                      <p className="text-xs text-[#434655] mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {shop.address || 'Ho Chi Minh City, Vietnam'}
                      </p>
                      <div className="flex gap-2">
                          <button className="px-4 py-2 bg-[#004ac6]/10 text-[#004ac6] rounded-xl text-xs font-bold hover:bg-[#004ac6]/20 transition-all flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                              Chat Now
                          </button>
                          <Link to={`/shop/${shop.slug}`} className="px-4 py-2 border border-[#c3c6d7] bg-white rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">storefront</span>
                              View Shop
                          </Link>
                      </div>
                  </div>
              </div>

              {/* Shop Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full md:w-2/3">
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Ratings</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">{shop.rating || 0} / 5.0</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Products</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">1.2k+</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Response Rate</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">{shop.responseRate || 0}%</span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Joined</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">
                        {shop.joinedAt ? new Date(shop.joinedAt).getFullYear() : '2024'}
                      </span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Followers</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">
                        {shop.followers >= 1000 ? `${(shop.followers / 1000).toFixed(1)}k` : shop.followers || 0}
                      </span>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-[#434655] uppercase tracking-wider font-bold">Response Time</span>
                      <span className="text-[#004ac6] font-extrabold text-lg">{shop.responseTime || 'N/A'}</span>
                  </div>
              </div>
          </section>
        )}

        {/* Consolidated Product Information Stack */}
        <div className="mt-16 relative">
          {/* Quick Navigation Bar (Sticky) */}
          <div className="sticky top-[72px] z-30 bg-[#faf8ff]/90 backdrop-blur-md border-b border-[#c3c6d7] -mx-4 px-4 md:-mx-10 md:px-10 mb-12">
              <div className="flex gap-8 overflow-x-auto no-scrollbar py-4 max-w-[1280px] mx-auto">
                  <a href="#specifications" className="text-sm font-bold uppercase tracking-widest text-[#004ac6] border-b-2 border-[#004ac6] pb-1 whitespace-nowrap">Specifications</a>
                  <a href="#reviews" className="text-sm font-bold uppercase tracking-widest text-[#434655] hover:text-[#004ac6] transition-colors pb-1 whitespace-nowrap">Reviews ({reviews?.length || 0})</a>
                  <a href="#shipping" className="text-sm font-bold uppercase tracking-widest text-[#434655] hover:text-[#004ac6] transition-colors pb-1 whitespace-nowrap">Shipping & Returns</a>
              </div>
          </div>

          <div className="space-y-24">
              {/* Section 1: Specifications & Description */}
              <section id="specifications" className="space-y-12 scroll-mt-32">
                  <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-extrabold text-[#131b2e]">Product Specifications</h2>
                      <div className="flex-grow h-px bg-[#c3c6d7]/50"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                          <h3 className="text-xl font-bold text-[#131b2e]">Overview</h3>
                          {product.description ? (
                              <div dangerouslySetInnerHTML={{__html: product.description}} className="text-sm text-[#434655] leading-relaxed space-y-4" />
                          ) : (
                              <p className="text-sm text-[#434655] leading-relaxed">The {product.name} is designed with precision and tailored for everyday use. Combining high-quality materials and modern aesthetics, it guarantees both durability and comfort.</p>
                          )}
                          <ul className="space-y-3 text-sm text-[#434655] pt-4">
                              <li className="flex items-start gap-2">
                                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">check_circle</span>
                                  Premium quality materials
                              </li>
                              <li className="flex items-start gap-2">
                                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">check_circle</span>
                                  Durable and long-lasting construction
                              </li>
                              <li className="flex items-start gap-2">
                                  <span className="material-symbols-outlined text-[#004ac6] text-[18px]">check_circle</span>
                                  Authentic brand guarantee
                              </li>
                          </ul>
                      </div>
                      <div className="bg-[#eaedff] rounded-3xl p-8 border border-[#c3c6d7]/50">
                          <h3 className="text-xl font-bold text-[#131b2e] mb-6">Technical Details</h3>
                          <div className="space-y-4">
                              <div className="flex justify-between border-b border-[#c3c6d7]/50 pb-2">
                                  <span className="text-sm text-[#434655]">Brand</span>
                                  <span className="text-sm font-bold text-[#131b2e]">UTEShop Exclusive</span>
                              </div>
                              <div className="flex justify-between border-b border-[#c3c6d7]/50 pb-2">
                                  <span className="text-sm text-[#434655]">SKU</span>
                                  <span className="text-sm font-bold text-[#131b2e]">{product.sku}</span>
                              </div>
                              <div className="flex justify-between border-b border-[#c3c6d7]/50 pb-2">
                                  <span className="text-sm text-[#434655]">Condition</span>
                                  <span className="text-sm font-bold text-[#131b2e]">New</span>
                              </div>
                              <div className="flex justify-between border-b border-[#c3c6d7]/50 pb-2">
                                  <span className="text-sm text-[#434655]">Warranty</span>
                                  <span className="text-sm font-bold text-[#131b2e]">12 Months</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Section 2: Reviews */}
              <section id="reviews" className="space-y-12 scroll-mt-32">
                  <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-extrabold text-[#131b2e]">Customer Reviews</h2>
                      <div className="flex-grow h-px bg-[#c3c6d7]/50"></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      {/* Rating Summary */}
                      <div className="lg:col-span-4 space-y-6">
                          <div className="bg-[#eaedff] rounded-3xl p-8 text-center space-y-2 border border-[#c3c6d7]/50">
                              <p className="text-5xl font-extrabold text-[#004ac6]">4.9</p>
                              <div className="flex justify-center gap-1 text-[#004ac6]">
                                  <span className="material-symbols-outlined fill-current">star</span>
                                  <span className="material-symbols-outlined fill-current">star</span>
                                  <span className="material-symbols-outlined fill-current">star</span>
                                  <span className="material-symbols-outlined fill-current">star</span>
                                  <span className="material-symbols-outlined fill-current">star</span>
                              </div>
                              <p className="text-sm text-[#434655]">Based on {reviews?.length || 128} verified reviews</p>
                          </div>
                          <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-12 text-[#434655]">5 Stars</span>
                                  <div className="flex-grow h-2 bg-[#eaedff] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#004ac6] w-[92%]"></div>
                                  </div>
                                  <span className="text-xs font-bold w-8 text-[#131b2e]">92%</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-12 text-[#434655]">4 Stars</span>
                                  <div className="flex-grow h-2 bg-[#eaedff] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#004ac6] w-[6%]"></div>
                                  </div>
                                  <span className="text-xs font-bold w-8 text-[#131b2e]">6%</span>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold w-12 text-[#434655]">3 Stars</span>
                                  <div className="flex-grow h-2 bg-[#eaedff] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#004ac6] w-[2%]"></div>
                                  </div>
                                  <span className="text-xs font-bold w-8 text-[#131b2e]">2%</span>
                              </div>
                          </div>
                      </div>

                      {/* Review List */}
                      <div className="lg:col-span-8 space-y-8">
                          {reviews?.length > 0 ? reviews.map((r, index) => (
                              <div key={r.id} className={`space-y-4 ${index !== 0 ? 'pt-6 border-t border-[#c3c6d7]/50' : ''}`}>
                                  <div className="flex justify-between items-start">
                                      <div className="flex gap-4">
                                          {r.user?.avatarUrl && r.user.avatarUrl !== "https://ui-avatars.com/api/?name=User&background=random" ? (
                                              <img src={r.user.avatarUrl} className="w-12 h-12 rounded-full border border-[#c3c6d7]" alt="Avatar" />
                                          ) : (
                                              <div className="w-12 h-12 rounded-full bg-[#eaedff] flex items-center justify-center font-bold text-[#004ac6]">
                                                  {r.user?.fullName ? r.user.fullName.substring(0, 2).toUpperCase() : 'JD'}
                                              </div>
                                          )}
                                          <div>
                                              <h4 className="font-bold text-[#131b2e]">{r.user?.fullName || 'John Doe'}</h4>
                                              <div className="flex text-[#004ac6] text-[14px]">
                                                  {[...Array(5)].map((_, i) => (
                                                      <span key={i} className={`material-symbols-outlined text-[16px] ${i < r.rating ? 'fill-current' : ''}`}>star</span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                      <span className="text-xs text-[#434655]">{new Date(r.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-[#434655] leading-relaxed">
                                      {r.comment}
                                  </p>
                              </div>
                          )) : (
                              <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                      <div className="flex gap-4">
                                          <div className="w-12 h-12 rounded-full bg-[#eaedff] flex items-center justify-center font-bold text-[#004ac6]">JD</div>
                                          <div>
                                              <h4 className="font-bold text-[#131b2e]">John Doe</h4>
                                              <div className="flex text-[#004ac6] text-[14px]">
                                                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                                  <span className="material-symbols-outlined text-[16px] fill-current">star</span>
                                              </div>
                                          </div>
                                      </div>
                                      <span className="text-xs text-[#434655]">2 days ago</span>
                                  </div>
                                  <p className="text-sm text-[#434655] leading-relaxed">
                                      Absolutely stunning product. The finish is even better in person. Highly recommended!
                                  </p>
                              </div>
                          )}
                      </div>
                  </div>
              </section>

              {/* Section 3: Shipping & Returns */}
              <section id="shipping" className="space-y-12 scroll-mt-32">
                  <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-extrabold text-[#131b2e]">Shipping & Returns</h2>
                      <div className="flex-grow h-px bg-[#c3c6d7]/50"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                          <div className="space-y-4">
                              <h3 className="text-xl font-bold flex items-center gap-2 text-[#131b2e]">
                                  <span className="material-symbols-outlined text-[#004ac6]">local_shipping</span>
                                  Delivery Options
                              </h3>
                              <div className="space-y-3">
                                  <div className="flex items-center justify-between p-4 bg-[#eaedff] rounded-2xl border border-[#004ac6]/20">
                                      <div>
                                          <p className="font-bold text-[#131b2e]">Standard Delivery</p>
                                          <p className="text-xs text-[#434655]">Estimated arrival: 3-5 business days</p>
                                      </div>
                                      <span className="font-extrabold text-[#004ac6]">FREE</span>
                                  </div>
                                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#c3c6d7]">
                                      <div>
                                          <p className="font-bold text-[#131b2e]">Express Shipping</p>
                                          <p className="text-xs text-[#434655]">Estimated arrival: 1-2 business days</p>
                                      </div>
                                      <span className="font-extrabold text-[#131b2e]">50.000 VNĐ</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-[#eaedff] rounded-3xl p-8 space-y-6 border border-[#c3c6d7]/50">
                          <h3 className="text-xl font-bold flex items-center gap-2 text-[#131b2e]">
                              <span className="material-symbols-outlined text-[#004ac6]">assignment_return</span>
                              Return Policy
                          </h3>
                          <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-[#004ac6] text-[20px]">check_circle</span>
                                  <p className="text-sm text-[#434655]"><span className="font-bold text-[#131b2e]">15-Day</span> Money Back Guarantee</p>
                              </div>
                              <div className="flex items-start gap-3">
                                  <span className="material-symbols-outlined text-[#004ac6] text-[20px]">check_circle</span>
                                  <p className="text-sm text-[#434655]"><span className="font-bold text-[#131b2e]">Free</span> Return Shipping on eligible items</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>
          </div>
        </div>

        {/* Related Products */}
        <section className="mt-24 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[12px] text-[#004ac6] mb-2 uppercase tracking-widest font-bold">Recommended</p>
                    <h2 className="text-3xl font-extrabold text-[#131b2e]">You May Also Like</h2>
                </div>
                <button className="text-[#004ac6] font-bold hover:underline">View All</button>
            </div>
            
            {relatedProducts?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {relatedProducts.map(p => (
                        <Link to={`/product/${p.slug}`} key={p.id} className="group bg-white rounded-3xl overflow-hidden border border-[#c3c6d7]/50 hover:border-[#004ac6]/30 hover:shadow-xl transition-all duration-500 flex flex-col h-full">
                            <div className="aspect-square relative overflow-hidden bg-[#eaedff]">
                                <img src={p.media?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            <div className="p-5 flex-grow flex flex-col">
                                <p className="text-[10px] font-bold text-[#434655] uppercase tracking-widest mb-1">{p.category?.name || 'Category'}</p>
                                <h4 className="font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[#004ac6] transition-colors">{p.name}</h4>
                                <div className="mt-auto flex items-center justify-between">
                                    <p className="text-[#004ac6] font-extrabold">{p.sellingPrice.toLocaleString()}₫</p>
                                    <button className="w-8 h-8 rounded-full bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center hover:bg-[#004ac6] hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-[#434655]">No related products found.</p>
            )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#eaedff] border-t border-[#c3c6d7] mt-24">
          <div className="w-full py-12 px-4 md:px-10 flex flex-col md:flex-row justify-between items-start max-w-[1280px] mx-auto gap-8">
              <div className="max-w-xs">
                  <Link to="/" className="font-['Manrope'] text-2xl text-[#131b2e] opacity-50 block mb-4 font-bold">UTEShop</Link>
                  <p className="text-sm text-[#434655]">Elevating the multi-channel shopping experience with academic precision and soft aesthetics.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-grow">
                  <div>
                      <h4 className="font-bold text-xs tracking-widest uppercase text-[#131b2e] mb-4">Explore</h4>
                      <ul className="space-y-2 text-sm text-[#434655]">
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">New Arrivals</a></li>
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">Featured Designers</a></li>
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">Boutiques</a></li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-xs tracking-widest uppercase text-[#131b2e] mb-4">Company</h4>
                      <ul className="space-y-2 text-sm text-[#434655]">
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">About Us</a></li>
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">Careers</a></li>
                          <li><a className="hover:text-[#004ac6] transition-all" href="#">Terms of Service</a></li>
                      </ul>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                      <h4 className="font-bold text-xs tracking-widest uppercase text-[#131b2e] mb-4">Connect</h4>
                      <div className="flex gap-4">
                          <a className="w-8 h-8 flex items-center justify-center rounded-full bg-[#c3c6d7]/30 hover:bg-[#004ac6] hover:text-white transition-all" href="#"><span className="material-symbols-outlined text-sm">language</span></a>
                          <a className="w-8 h-8 flex items-center justify-center rounded-full bg-[#c3c6d7]/30 hover:bg-[#004ac6] hover:text-white transition-all" href="#"><span className="material-symbols-outlined text-sm">alternate_email</span></a>
                          <a className="w-8 h-8 flex items-center justify-center rounded-full bg-[#c3c6d7]/30 hover:bg-[#004ac6] hover:text-white transition-all" href="#"><span className="material-symbols-outlined text-sm">share</span></a>
                      </div>
                  </div>
              </div>
          </div>
          <div className="w-full px-4 md:px-10 py-6 border-t border-[#c3c6d7] max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-[#434655]">© 2024 UTEShop Marketplace. Academic Modernism Precision.</p>
              <p className="font-bold text-[10px] opacity-50 uppercase tracking-widest text-[#131b2e]">Academic Modernism Framework v1.0</p>
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

export default ProductDetail;
