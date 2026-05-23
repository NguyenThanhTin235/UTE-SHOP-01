import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SellerAddProduct = ({ setActiveTab }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        mrp_price: '',
        selling_price: '',
        description: '',
        media: []
    });
    
    const [variants, setVariants] = useState([
        { attributes: { color: '', size: '' }, sku: '', stock_quantity: 0, additional_price: 0 }
    ]);
    


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/public/categories');
                if (res.data.success) {
                    setCategories(res.data.data);
                    if (res.data.data.length > 0) {
                        setFormData(prev => ({ ...prev, category_id: res.data.data[0]._id }));
                    }
                }
            } catch (error) {
                toast.error('Failed to load categories');
            }
        };
        fetchCategories();
    }, []);

    const handleAddVariant = () => {
        setVariants([...variants, { attributes: { color: '', size: '' }, sku: '', stock_quantity: 0, additional_price: 0 }]);
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        if (field === 'color' || field === 'size') {
            newVariants[index].attributes[field] = value;
        } else {
            newVariants[index][field] = value;
        }
        setVariants(newVariants);
    };



    const handleSubmit = async () => {
        if (!formData.name || !formData.selling_price) {
            return toast.error('Name and Selling Price are required');
        }
        try {
            const payload = {
                ...formData,
                mrp_price: Number(formData.mrp_price) || Number(formData.selling_price),
                selling_price: Number(formData.selling_price),
                variants: variants.map(v => ({
                    ...v,
                    stock_quantity: Number(v.stock_quantity),
                    additional_price: Number(v.additional_price)
                }))
            };
            
            const res = await axios.post('http://localhost:5000/api/seller/products', payload, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (res.data.success) {
                toast.success('Product created successfully');
                setActiveTab('products');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create product');
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('products')} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add New Product</h1>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setActiveTab('products')} className="px-6 py-2.5 border border-slate-300 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        Discard
                    </button>
                    <button onClick={handleSubmit} className="bg-[#004ac6] text-white px-8 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-[#004ac6]/30 hover:brightness-110 active:scale-95 transition-all">
                        Save & Publish
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-10 max-w-[1400px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#004ac6]">info</span>
                            <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Basic Information</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Product Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Premium Academic Leather Satchel" 
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</label>
                                    <select 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer outline-none"
                                        value={formData.category_id}
                                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Selling Price (VND)</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 150000" 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                        value={formData.selling_price}
                                        onChange={e => setFormData({...formData, selling_price: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Original Price (VND)</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 200000" 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                        value={formData.mrp_price}
                                        onChange={e => setFormData({...formData, mrp_price: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variations */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#004ac6]">layers</span>
                                <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Variations Table</h3>
                            </div>
                            <button onClick={handleAddVariant} className="text-[#004ac6] text-xs font-bold hover:underline cursor-pointer">
                                + Add Variant
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-slate-50/30">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Color</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Size</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">SKU ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Stock</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Add. Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {variants.map((variant, index) => (
                                        <tr key={index} className="hover:bg-white transition-colors bg-white">
                                            <td className="px-6 py-4">
                                                <input type="text" placeholder="e.g. Blue" value={variant.attributes.color} onChange={e => handleVariantChange(index, 'color', e.target.value)} className="w-24 bg-transparent border-b border-slate-200 p-1 text-xs font-bold text-slate-700 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" placeholder="e.g. M" value={variant.attributes.size} onChange={e => handleVariantChange(index, 'size', e.target.value)} className="w-16 bg-transparent border-b border-slate-200 p-1 text-xs font-bold text-slate-700 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" placeholder="SKU-001" value={variant.sku} onChange={e => handleVariantChange(index, 'sku', e.target.value)} className="w-24 bg-transparent border-b border-slate-200 p-1 text-xs font-bold text-slate-700 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="number" placeholder="10" value={variant.stock_quantity} onChange={e => handleVariantChange(index, 'stock_quantity', e.target.value)} className="w-16 bg-transparent border-b border-slate-200 p-1 text-xs font-black text-slate-900 outline-none" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="number" placeholder="0" value={variant.additional_price} onChange={e => handleVariantChange(index, 'additional_price', e.target.value)} className="w-20 bg-transparent border-b border-slate-200 p-1 text-xs font-bold text-slate-900 outline-none" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Media Gallery */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#004ac6]" style={{ fontVariationSettings: "'wght' 700" }}>image</span>
                                <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Media Gallery</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">MAX 10 IMAGES</span>
                        </div>
                        


                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-2 md:col-span-4 border-4 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group">
                                <div className="size-20 bg-[#004ac6]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-[#004ac6] text-4xl">cloud_upload</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 mb-1">Drag & drop product images</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-6">Support JPG, PNG, MP4. Max 10MB</p>
                                <button className="px-8 py-2.5 bg-[#004ac6] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#004ac6]/20">Browse Files</button>
                            </div>

                            {formData.media.map((url, idx) => (
                                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 relative group shadow-sm">
                                    <img src={url} className="w-full h-full object-cover" alt="Product preview" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-2 bg-white rounded-lg text-[#004ac6] hover:scale-110 transition-transform shadow-lg cursor-pointer"><span className="material-symbols-outlined text-sm">visibility</span></button>
                                        <button onClick={() => setFormData({...formData, media: formData.media.filter((_, i) => i !== idx)})} className="p-2 bg-red-500 rounded-lg text-white hover:scale-110 transition-transform shadow-lg cursor-pointer">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">add</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#004ac6]" style={{ fontVariationSettings: "'wght' 700" }}>description</span>
                            <h3 className="text-base font-black uppercase tracking-widest text-slate-900">Product Description</h3>
                        </div>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-3 border-b border-slate-200 flex gap-1 overflow-x-auto">
                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 cursor-pointer"><span className="material-symbols-outlined text-lg">format_bold</span></button>
                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 cursor-pointer"><span className="material-symbols-outlined text-lg">format_italic</span></button>
                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 cursor-pointer"><span className="material-symbols-outlined text-lg">format_list_bulleted</span></button>
                                <div className="w-px h-6 bg-slate-200 mx-2 self-center"></div>
                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 cursor-pointer"><span className="material-symbols-outlined text-lg">link</span></button>
                                <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 cursor-pointer"><span className="material-symbols-outlined text-lg">image</span></button>
                            </div>
                            <textarea 
                                className="w-full p-6 text-sm font-bold text-slate-600 border-none focus:ring-0 outline-none resize-none bg-white min-h-[300px]" 
                                placeholder="Tell your customers about the academic precision and premium quality of this item..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Right Column (Tips) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#004ac6] rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <span className="material-symbols-outlined text-[120px]">lightbulb</span>
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-white">auto_awesome</span>
                                <h3 className="text-base font-black uppercase tracking-widest">Seller Tips</h3>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="material-symbols-outlined text-green-300 text-lg shrink-0">check_circle</span>
                                    <p className="text-xs font-bold text-white/90 leading-relaxed">Include keywords like 'durable' or 'premium' in your description to boost search relevance.</p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="material-symbols-outlined text-green-300 text-lg shrink-0">check_circle</span>
                                    <p className="text-xs font-bold text-white/90 leading-relaxed">List at least 3 variations to increase buyer conversion by up to 15%.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SellerAddProduct;
