import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BlogEditor = ({ mode, postId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'Fashion Trends',
    status: 'draft',
    content: '',
    tags: '',
    cover_image: ''
  });

  useEffect(() => {
    if (mode === 'edit' && postId) {
      const fetchPost = async () => {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
          const res = await axios.get(`http://localhost:5000/api/admin/blog/${postId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.success) {
            const post = res.data.data;
            setForm({
              title: post.title,
              slug: post.slug,
              category: post.category || 'Fashion Trends',
              status: post.status,
              content: post.content || '',
              tags: post.tags ? post.tags.join(', ') : '',
              cover_image: post.cover_image || ''
            });
          }
        } catch (error) {
          toast.error('Failed to load post');
          navigate('/admin/blog');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [mode, postId, navigate]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setForm(prev => ({ ...prev, title, slug }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    const res = await axios.post('http://localhost:5000/api/admin/blog/upload-image', formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalCoverImage = form.cover_image;
      if (imageFile) {
        finalCoverImage = await uploadImage(imageFile);
      }

      const payload = {
        ...form,
        cover_image: finalCoverImage,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (mode === 'edit') {
        await axios.put(`http://localhost:5000/api/admin/blog/${postId}`, payload, config);
        toast.success('Post updated successfully');
      } else {
        await axios.post(`http://localhost:5000/api/admin/blog`, payload, config);
        toast.success('Post created successfully');
      }
      navigate('/admin/blog');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-w-0">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter">
              {mode === 'edit' ? 'Edit Post' : 'Blog Editor'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Blog Management / {mode === 'edit' ? 'Edit Post' : 'New Post'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-all cursor-pointer"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Form Body */}
      <div className="p-10 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Title</label>
              <input 
                required
                type="text" 
                value={form.title} 
                onChange={handleTitleChange}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Slug</label>
              <input 
                required
                type="text" 
                value={form.slug} 
                onChange={(e) => setForm({...form, slug: e.target.value})}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                value={form.category} 
                onChange={(e) => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="Fashion Trends">Fashion Trends</option>
                <option value="Styling Tips">Styling Tips</option>
                <option value="Minimalist Style">Minimalist Style</option>
                <option value="Techwear">Techwear</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select 
                value={form.status} 
                onChange={(e) => setForm({...form, status: e.target.value})}
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags (comma separated)</label>
              <input 
                type="text" 
                value={form.tags} 
                onChange={(e) => setForm({...form, tags: e.target.value})}
                placeholder="e.g. blazer, student, tech"
                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cover Image</label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {(imageFile || form.cover_image) && (
                <img 
                  src={imageFile ? URL.createObjectURL(imageFile) : form.cover_image} 
                  alt="Preview" 
                  className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Content (HTML allowed)</label>
            <textarea 
              required
              rows="15"
              value={form.content} 
              onChange={(e) => setForm({...form, content: e.target.value})}
              className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-primary focus:border-primary leading-relaxed"
              placeholder="<p>Write your amazing blog post here...</p>"
            ></textarea>
            <p className="text-[11px] text-slate-400">You can use basic HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;img src=&quot;...&quot;&gt; for formatting.</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BlogEditor;
