import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const BlogDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/public/blog/${slug}`);
        if (res.data && res.data.success) {
          setPost(res.data.data.post);
          setRelatedPosts(res.data.data.relatedPosts || []);
        }
      } catch (error) {
        console.error('Fetch blog detail error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!post) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] text-2xl font-bold">Post not found</div>;
  }

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-['Manrope']">
      <Header />

      <main className="flex-grow">
        <article className="max-w-4xl mx-auto px-4 md:px-10 py-12 md:py-20">
          <nav className="flex items-center gap-2 text-sm font-medium text-[#505f76] mb-8">
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-[#434655]">{post.category}</span>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#131b2e] mb-6 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#eeefff] rounded-full overflow-hidden">
                  <img src={post.author?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'} alt="Author" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#131b2e]">{post.author?.fullName || 'Admin'}</p>
                  <p className="text-[12px] text-[#434655]">Author</p>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-[#c3c6d7]"></div>
              <div className="text-sm text-[#434655]">
                <p className="font-bold">{new Date(post.createdAt).toLocaleDateString()}</p>
                <p>Read time: {Math.max(1, Math.ceil(post.content?.length / 1000))} min • {post.views || 0} views</p>
              </div>
            </div>
          </header>

          {post.coverImage && (
            <div className="aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 shadow-2xl bg-slate-100">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div 
            className="prose max-w-none prose-lg text-[#434655] mb-20 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#131b2e] [&_h2]:mt-8 [&_h2]:mb-4 [&_img]:rounded-3xl [&_img]:my-8 [&_p]:mb-6 [&_p]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-20 p-8 md:p-12 bg-[#f2f3ff] rounded-[3rem] border border-[#c3c6d7]/30">
              <h3 className="text-3xl font-bold text-[#131b2e] mb-10">Related Posts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(rp => (
                  <Link key={rp._id} to={`/blog/${rp.slug}`} className="bg-white p-4 rounded-2xl border border-transparent hover:border-primary/20 transition-all group block">
                    <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-4">
                      <img src={rp.coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80'} alt={rp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h4>
                    <p className="text-[12px] text-[#434655]">{new Date(rp.createdAt).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;
