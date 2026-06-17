import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/public/blog?page=${page}&limit=10&category=${category}`);
      if (res.data && res.data.success) {
        setPosts(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Fetch blog posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscriberEmail) {
      toast.error('Please enter your email');
      return;
    }
    setSubscribing(true);
    try {
      const res = await axios.post('http://localhost:5000/api/public/newsletter/subscribe', { email: subscriberEmail });
      if (res.data.success) {
        toast.success(res.data.message || 'Subscribed successfully!');
        setSubscriberEmail('');
      } else {
        toast.error(res.data.message || 'Failed to subscribe');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, category]);

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-['Manrope']">
      <Header />

      <main className="flex-grow">
        <section className="bg-[#faf8ff] border-b border-[#c3c6d7] py-20 px-4 md:px-10" style={{ backgroundImage: 'radial-gradient(#dbe1ff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
          <div className="max-w-[1280px] mx-auto">
            <p className="text-[12px] font-bold text-[#004ac6] mb-4 uppercase tracking-widest">Fashion & Lifestyle</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#131b2e] mb-4 max-w-3xl leading-tight">Academic Style & Modern Curation</h1>
            <p className="text-base text-[#434655] max-w-2xl leading-relaxed">
              Discover the intersection of academic style and modern fashion trends. Sharing styling tips and quality lifestyle inspiration exclusively for the UTE community.
            </p>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-4 md:px-10 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Latest Insights */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-[#131b2e]">Trends & Styling Tips</h2>
              <div className="flex gap-2">
                <button onClick={() => {setCategory(''); setPage(1);}} className={`px-3 py-1 rounded-full text-[12px] font-bold ${category === '' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#e2e7ff] text-[#434655]'}`}>All</button>
                <button onClick={() => {setCategory('Fashion Trends'); setPage(1);}} className={`px-3 py-1 rounded-full text-[12px] font-bold ${category === 'Fashion Trends' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#e2e7ff] text-[#434655]'}`}>Trends</button>
                <button onClick={() => {setCategory('Styling Tips'); setPage(1);}} className={`px-3 py-1 rounded-full text-[12px] font-bold ${category === 'Styling Tips' ? 'bg-[#004ac6]/10 text-[#004ac6]' : 'bg-[#e2e7ff] text-[#434655]'}`}>Styling</button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : posts.length > 0 ? (
              <div className="space-y-8">
                {/* First post as Featured */}
                <article className="group cursor-pointer block">
                  <Link to={`/blog/${posts[0].slug}`} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl overflow-hidden border border-transparent hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <img src={posts[0].coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000'} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="p-8">
                      <p className="text-[12px] font-medium text-primary mb-2">{posts[0].category} • {new Date(posts[0].createdAt).toLocaleDateString()} • {posts[0].views || 0} views</p>
                      <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">{posts[0].title}</h3>
                      <p className="text-sm text-[#434655] mb-8 line-clamp-3">
                        {posts[0].content?.replace(/<[^>]*>?/gm, '')}
                      </p>
                      <span className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                        Read Full Article
                        <span className="material-symbols-outlined text-[20px]">arrow_right_alt</span>
                      </span>
                    </div>
                  </Link>
                </article>

                {/* Sub-grid for remaining posts */}
                {posts.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {posts.slice(1).map(post => (
                      <article key={post._id} className="bg-white rounded-3xl overflow-hidden border border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 group cursor-pointer block">
                        <Link to={`/blog/${post.slug}`}>
                          <div className="aspect-video overflow-hidden bg-slate-100">
                            <img src={post.coverImage || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600'} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="p-6">
                            <p className="text-[12px] font-medium text-[#505f76] mb-2">{post.category} • {new Date(post.createdAt).toLocaleDateString()} • {post.views || 0} views</p>
                            <h4 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h4>
                            <p className="text-sm text-[#434655] line-clamp-2">{post.content?.replace(/<[^>]*>?/gm, '')}</p>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-[#c3c6d7] rounded-lg disabled:opacity-50">Prev</button>
                    <span className="px-4 py-2">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-[#c3c6d7] rounded-lg disabled:opacity-50">Next</button>
                  </div>
                )}

              </div>
            ) : (
              <p className="text-[#434655]">No blog posts found.</p>
            )}

            {/* FAQ Section */}
            <section className="pt-12 border-t border-[#c3c6d7]">
              <h2 className="text-3xl font-bold text-[#131b2e] mb-8">FAQ & Policies</h2>
              <div className="space-y-4">
                <div className="p-6 bg-[#f2f3ff] rounded-2xl group cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-[#131b2e]">Shipping Policy for Students</h4>
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                  <div className="mt-4 text-sm text-[#434655] leading-relaxed hidden group-hover:block transition-all">
                    <p className="mb-2">UTEShop is proud to support the student community with special shipping rates. We offer <strong>express delivery within the inner city</strong> for all verified student accounts.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Free shipping on all orders over 500,000₫.</li>
                      <li>Standard delivery within 2-3 business days.</li>
                      <li>Same-day delivery available for central districts with a flat fee of 15,000₫.</li>
                    </ul>
                    <p className="mt-2 text-xs italic">* Note: A valid Student ID is required to be linked with your account to unlock these benefits.</p>
                  </div>
                </div>

                <div className="p-6 bg-[#f2f3ff] rounded-2xl group cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-[#131b2e]">Return & Exchange Policy</h4>
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                  <div className="mt-4 text-sm text-[#434655] leading-relaxed hidden group-hover:block transition-all">
                    <p>We want you to be completely satisfied with your purchase. If a product does not meet your expectations, you can return it within <strong>7 days of delivery</strong>.</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Items must be unworn, unwashed, and in their original packaging with tags attached.</li>
                      <li>To initiate a return, navigate to your Order History and click "Request Return".</li>
                      <li>Refunds will be processed to your original payment method within 3-5 business days after we receive the item.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-[#f2f3ff] rounded-2xl group cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-[#131b2e]">How to apply Student Discount Codes?</h4>
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                  <div className="mt-4 text-sm text-[#434655] leading-relaxed hidden group-hover:block transition-all">
                    <p>Subscribing to our newsletter gives you access to exclusive student discount codes. To apply them:</p>
                    <ol className="list-decimal pl-5 mt-2 space-y-1">
                      <li>Add your desired items to the shopping cart.</li>
                      <li>Proceed to checkout and look for the "Promo Code" or "Voucher" field.</li>
                      <li>Enter the code you received in your email and click "Apply".</li>
                      <li>The discount will be automatically calculated and deducted from your total bill.</li>
                    </ol>
                  </div>
                </div>

                <div className="p-6 bg-[#f2f3ff] rounded-2xl group cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-[#131b2e]">Quality Assurance Guarantee</h4>
                    <span className="material-symbols-outlined group-hover:text-primary transition-colors">expand_more</span>
                  </div>
                  <div className="mt-4 text-sm text-[#434655] leading-relaxed hidden group-hover:block transition-all">
                    <p>Every seller on UTEShop undergoes a strict verification process. We ensure that all products listed on our platform meet our high-quality standards. If you suspect an item is counterfeit or differs significantly from its description, please report it immediately through our support center.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-primary text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-semibold mb-4 relative z-10">Join Our Newsletter</h3>
              <p className="text-sm opacity-80 mb-6 relative z-10">Subscribe to receive weekly styling tips and exclusive discount codes.</p>
              <form onSubmit={handleSubscribe} className="relative z-10 space-y-3">
                <input 
                  type="email" 
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                  placeholder="Your email address" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/50" 
                  required
                />
                <button 
                  type="submit" 
                  disabled={subscribing}
                  className="w-full bg-white text-primary py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </form>
            </section>

            <section className="bg-[#f2f3ff] rounded-3xl p-8 border border-[#c3c6d7]/30">
              <h3 className="text-xl font-semibold mb-6">Categories</h3>
              <ul className="space-y-4">
                <li onClick={() => {setCategory('Fashion Trends'); setPage(1);}} className="flex justify-between items-center text-sm font-medium hover:text-primary cursor-pointer transition-colors">
                  <span>Fashion Trends</span>
                </li>
                <li onClick={() => {setCategory('Styling Tips'); setPage(1);}} className="flex justify-between items-center text-sm font-medium hover:text-primary cursor-pointer transition-colors">
                  <span>Styling Tips</span>
                </li>
                <li onClick={() => {setCategory('Minimalist Style'); setPage(1);}} className="flex justify-between items-center text-sm font-medium hover:text-primary cursor-pointer transition-colors">
                  <span>Minimalist Style</span>
                </li>
                <li onClick={() => {setCategory('Techwear'); setPage(1);}} className="flex justify-between items-center text-sm font-medium hover:text-primary cursor-pointer transition-colors">
                  <span>Techwear</span>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
