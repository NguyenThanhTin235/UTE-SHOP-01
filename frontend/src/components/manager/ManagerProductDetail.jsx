import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ActionReasonModal from './ActionReasonModal';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const ManagerProductDetail = ({ productId }) => {
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/products/${productId}`, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        setProductDetail(data.data);
      } else {
        toast.error('Failed to load product detail');
      }
    } catch (err) {
      console.error('Fetch product detail error:', err);
      toast.error('Error loading product detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const handleApprove = async () => {
    try {
      const { data } = await axios.post(`${API}/manager/products/${productId}/approve`, {}, { headers: getAuthHeader() });
      if (data.success) {
        toast.success(`Approved ${productDetail?.name}`);
        navigate('/manager/product_approval');
      }
    } catch (err) {
      toast.error(`Failed to approve ${productDetail?.name}`);
    }
  };

  const handleRejectConfirm = async (reason) => {
    setRejectModalOpen(false);
    try {
      const { data } = await axios.post(
        `${API}/manager/products/${productId}/reject`,
        { reason },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(`Rejected ${productDetail?.name}`);
        navigate('/manager/product_approval');
      }
    } catch (err) {
      toast.error(`Failed to reject ${productDetail?.name}`);
    }
  };

  const handleRequestInfoConfirm = async (note) => {
    setRequestInfoModalOpen(false);
    try {
      const { data } = await axios.post(
        `${API}/manager/products/${productId}/request-info`,
        { note },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(`Request sent for ${productDetail?.name}`);
        fetchProductDetail(); // Refresh to show the new event in history
      }
    } catch (err) {
      toast.error(`Failed to send request for ${productDetail?.name}`);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-slate-700">Product not found</h2>
      </div>
    );
  }

  return (
    <>
      <div className="p-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Product Gallery & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4">
              <div 
                className="aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer"
                onClick={() => setSelectedImage(productDetail.images[0])}
              >
                <img src={productDetail.images[0]} alt={productDetail.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                {productDetail.images.slice(0, 3).map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`aspect-square rounded-2xl overflow-hidden ${idx === 0 ? 'border-2 border-primary' : 'border border-slate-100'} bg-slate-50 cursor-pointer`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </div>
                ))}
                {productDetail.images.length > 3 && (
                  <div 
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer"
                    onClick={() => setSelectedImage(productDetail.images[3])}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Seller Information</p>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                  <span className="material-symbols-outlined text-2xl">store</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{productDetail.shop.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[#f59e0b] text-xs">star</span>
                    <span className="text-[11px] font-bold text-slate-600">{productDetail.shop.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Total Products:</span>
                  <span className="text-slate-700 font-black">{productDetail.shop.totalProducts}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Violation History:</span>
                  <span className="text-[#16a34a] font-black">{productDetail.shop.violationHistory}</span>
                </div>
              </div>
            </div>

            {/* Approval History Timeline */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Approval History</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{productDetail.history.length} Events Total</span>
              </div>
              <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                {productDetail.history.map((evt, idx) => {
                  const isUploaded = evt.action.includes('Upload');
                  const isRejected = evt.action.includes('Reject');
                  let iconBg = 'bg-slate-50 text-slate-400';
                  let iconName = 'visibility';
                  let iconBorder = 'border-white';

                  if (isUploaded) {
                    iconBg = 'bg-green-50 text-[#16a34a]';
                    iconName = 'publish';
                    iconBorder = 'border-white';
                  } else if (isRejected) {
                    iconBg = 'bg-red-50 text-[#dc2626]';
                    iconName = 'block';
                  }

                  return (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-0 top-0 w-9 h-9 rounded-full ${iconBg} border-4 ${iconBorder} shadow-sm flex items-center justify-center z-10`}>
                        <span className="material-symbols-outlined text-sm">{iconName}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-black text-slate-900">{evt.action}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(evt.date).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{evt.note}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-2">By {evt.actorName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
              <div className="flex items-center justify-between mb-8">
                <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">{productDetail.category}</span>
                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">ID: {productDetail.sku}</span>
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">{productDetail.name}</h2>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-black text-primary">${productDetail.price}</p>
                {productDetail.mrp_price > productDetail.price && (
                  <p className="text-lg font-bold text-slate-400 line-through">${productDetail.mrp_price}</p>
                )}
              </div>

              <div className="mt-10 space-y-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Description</p>
                  <div 
                    className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: productDetail.description || 'No description provided.' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Attributes</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Stock: {productDetail.stock} Units
                      </li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Variants: {productDetail.attributes.length}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Status</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        Current: <span className="uppercase text-[#f59e0b]">{productDetail.status}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {productDetail.status === 'pending' && (
                <div className="mt-12 pt-12 border-t border-slate-100 flex items-center gap-4">
                  <button 
                    onClick={handleApprove}
                    className="flex-1 py-4 bg-[#16a34a] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer">
                    <span className="material-symbols-outlined">verified</span>
                    Approve Listing
                  </button>
                  <button 
                    onClick={() => setRejectModalOpen(true)}
                    className="w-14 h-14 bg-red-50 text-[#dc2626] rounded-2xl flex items-center justify-center hover:bg-[#dc2626] hover:text-white transition-all shadow-sm cursor-pointer" title="Reject">
                    <span className="material-symbols-outlined">block</span>
                  </button>
                  <button 
                    onClick={() => setRequestInfoModalOpen(true)}
                    className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer" title="Edit/Request Info">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
            <button 
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-50"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <img 
              src={selectedImage} 
              alt="Product Fullscreen" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <ActionReasonModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={handleRejectConfirm}
        title="Reject Product"
        itemName={productDetail.name}
        type="product"
      />

      <ActionReasonModal
        isOpen={requestInfoModalOpen}
        onClose={() => setRequestInfoModalOpen(false)}
        onSubmit={handleRequestInfoConfirm}
        title="Request Information"
        itemName={productDetail.name}
        type="info"
      />
    </>
  );
};

export default ManagerProductDetail;
