import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNotifications } from '../../hooks/useNotifications';

const SellerProducts = ({ setActiveTab }) => {
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Selling');
    const [loading, setLoading] = useState(false);

    // Sorting and Filtering states
    const [sortBy, setSortBy] = useState('newest');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });

    const { user } = useSelector(state => state.auth);
    const { unreadCount } = useNotifications();

    const statusTabs = ['Selling', 'Pending', 'Violated', 'Out of Stock'];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/seller/products`, {
                params: {
                    page: meta.page,
                    limit: meta.limit,
                    search,
                    status: statusFilter,
                    sortBy
                },
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                }
            });
            if (res.data.success) {
                setProducts(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [meta.page, meta.limit, search, statusFilter, sortBy]);

    const handleExport = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/seller/products/export`, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to export products');
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
            {/* Header */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#004ac6] text-2xl">inventory_2</span>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product Management</h1>

                    <div className="ml-8 hidden md:flex items-center bg-[#F1F5F9] rounded-2xl px-4 py-2.5 w-80 group focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-slate-200/60">
                        <span className="material-symbols-outlined text-slate-400 text-xl group-focus-within:text-[#004ac6]">search</span>
                        <input
                            type="text"
                            placeholder="Search products, SKU..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 placeholder:font-medium ml-2 outline-none"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setMeta(prev => ({ ...prev, page: 1 })); }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('addProduct')} className="bg-[#004ac6] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center gap-2 mr-4">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add New Product
                    </button>

                    <div className="h-8 w-px bg-slate-200 mx-2"></div>

                    <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer border border-slate-100">
                        <span className="material-symbols-outlined text-2xl">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    <div className="flex items-center gap-3 bg-[#F1F5F9] pl-1 pr-4 py-1 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-200 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-200">
                            {user?.fullName?.charAt(0).toUpperCase() || 'J'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{user?.fullName || 'John Doe'}</span>
                        <span className="material-symbols-outlined text-slate-400 text-lg group-hover:translate-y-0.5 transition-transform">expand_more</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-10 max-w-[1400px] mx-auto w-full">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="border-b border-slate-100 flex px-6 pt-4 overflow-x-auto custom-scrollbar">
                        {statusTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setStatusFilter(tab); setMeta({ ...meta, page: 1 }); }}
                                className={`px-6 pb-4 pt-2 text-sm whitespace-nowrap tracking-tight flex items-center gap-2 transition-colors relative ${statusFilter === tab ? 'font-black text-[#004ac6]' : 'font-bold text-slate-500 hover:text-[#004ac6]'}`}
                            >
                                {tab}
                                {tab === 'Violated' && <span className="size-2 bg-red-500 rounded-full"></span>}
                                {statusFilter === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#004ac6] rounded-t-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search and Actions */}
                    <div className="p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full md:w-[450px] group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004ac6] transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search product name, SKU, or category..."
                                className="w-full pl-12 pr-4 py-3 bg-[#F1F5F9] border border-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#004ac6] transition-all outline-none font-medium"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setMeta({ ...meta, page: 1 }); }}
                            />
                        </div>
                        <div className="flex gap-3">
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${sortBy !== 'newest'
                                            ? 'bg-[#004ac6]/5 border-[#004ac6]/30 text-[#004ac6]'
                                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                    {sortBy === 'newest' && 'Filter'}
                                    {sortBy === 'oldest' && 'Ngày xa nhất'}
                                    {sortBy === 'priceAsc' && 'Giá tăng dần'}
                                    {sortBy === 'priceDesc' && 'Giá giảm dần'}
                                    <span className="material-symbols-outlined text-slate-400 text-sm ml-1">expand_more</span>
                                </button>
                                {showSortDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)}></div>
                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                            <button
                                                onClick={() => { setSortBy('newest'); setShowSortDropdown(false); setMeta(prev => ({ ...prev, page: 1 })); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sortBy === 'newest' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                Lọc theo ngày gần nhất
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); setMeta(prev => ({ ...prev, page: 1 })); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sortBy === 'oldest' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                Lọc theo ngày xa nhất
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('priceAsc'); setShowSortDropdown(false); setMeta(prev => ({ ...prev, page: 1 })); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sortBy === 'priceAsc' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                Lọc theo giá tăng dần
                                            </button>
                                            <button
                                                onClick={() => { setSortBy('priceDesc'); setShowSortDropdown(false); setMeta(prev => ({ ...prev, page: 1 })); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${sortBy === 'priceDesc' ? 'bg-[#004ac6]/5 text-[#004ac6]' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                Lọc theo giá giảm dần
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">download</span>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8FAFC]">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Product</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SKU</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Price (VND)</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Stock</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-slate-500">Loading products...</td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-slate-500">No products found.</td></tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product._id} className="hover:bg-slate-50 transition-all group bg-white">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm border border-slate-200">
                                                        <img src={product.media && product.media.length > 0 ? product.media[0].media_url : "https://via.placeholder.com/100"} alt="Product" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 max-w-[250px]">
                                                        <span className="text-sm font-black text-slate-900 line-clamp-2 group-hover:text-[#004ac6] transition-colors">{product.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{product.category_id?.name || 'Category'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{product.sku || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-sm text-[#004ac6]">{product.selling_price.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-center font-black text-sm text-slate-900">{product.totalStock || 0}</td>
                                            <td className="px-6 py-5 text-center">
                                                {product.currentStatus === 'Selling' && <span className="px-3 py-1 bg-[#e6f4ea] text-[#1e7e34] rounded-lg text-[9px] font-black uppercase tracking-wider border border-[#1e7e34]/10 shadow-sm inline-block">Selling</span>}
                                                {product.currentStatus === 'Pending' && <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-yellow-200 shadow-sm inline-block">Pending</span>}
                                                {product.currentStatus === 'Violated' && <span className="px-3 py-1 bg-[#fdecea] text-[#c62828] rounded-lg text-[9px] font-black uppercase tracking-wider border border-[#c62828]/10 shadow-sm inline-block">Violated</span>}
                                                {product.currentStatus === 'Out of Stock' && <span className="px-3 py-1 bg-[#F1F5F9] text-[#64748B] rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200 shadow-sm inline-block">Out of Stock</span>}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2.5 text-slate-500 hover:text-[#004ac6] hover:bg-[#004ac6]/5 transition-all rounded-xl">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-slate-500">Showing <span className="text-slate-900">{(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="text-slate-900">{meta.total}</span> products</p>
                            <div className="h-4 w-[1px] bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
                                <select
                                    className="bg-transparent border-none text-xs font-black text-slate-900 focus:ring-0 cursor-pointer outline-none"
                                    value={meta.limit}
                                    onChange={(e) => setMeta({ ...meta, limit: Number(e.target.value), page: 1 })}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setMeta({ ...meta, page: 1 })}
                                className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                title="First Page"
                            >
                                <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_left</span>
                            </button>
                            <button
                                disabled={meta.page <= 1}
                                onClick={() => setMeta({ ...meta, page: meta.page - 1 })}
                                className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                title="Previous Page"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(meta.totalPages)].map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMeta({ ...meta, page: idx + 1 })}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${meta.page === idx + 1 ? 'bg-[#004ac6] text-white shadow-lg shadow-[#004ac6]/30' : 'text-slate-600 hover:bg-slate-50 border border-transparent bg-white'}`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={meta.page >= meta.totalPages}
                                onClick={() => setMeta({ ...meta, page: meta.page + 1 })}
                                className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                title="Next Page"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                            <button
                                disabled={meta.page >= meta.totalPages}
                                onClick={() => setMeta({ ...meta, page: meta.totalPages })}
                                className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                                title="Last Page"
                            >
                                <span className="material-symbols-outlined text-[20px]">keyboard_double_arrow_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerProducts;
