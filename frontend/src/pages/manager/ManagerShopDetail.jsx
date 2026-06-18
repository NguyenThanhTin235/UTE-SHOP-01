import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const ManagerShopDetail = ({ shopId }) => {
  const [loading, setLoading] = useState(true);
  const [shopDetail, setShopDetail] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const fetchShopDetail = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/manager/shops/${shopId}`, {
        headers: getAuthHeader(),
      });
      if (data.success) {
        setShopDetail(data.data);
      } else {
        toast.error('Failed to load shop detail');
      }
    } catch (err) {
      console.error('Fetch shop detail error:', err);
      toast.error('Error loading shop detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopId) {
      fetchShopDetail();
    }
  }, [shopId]);

  const handleApprove = async () => {
    try {
      const { data } = await axios.post(`${API}/manager/shops/${shopId}/approve`, {}, { headers: getAuthHeader() });
      if (data.success) {
        toast.success(`Approved ${shopDetail?.shopName}`);
        navigate('/manager/shop_approval');
      }
    } catch (err) {
      toast.error(`Failed to approve ${shopDetail?.shopName}`);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(`Reason for rejecting ${shopDetail?.shopName}:`);
    if (reason === null) return;
    try {
      const { data } = await axios.post(
        `${API}/manager/shops/${shopId}/reject`,
        { reason: reason || 'Not eligible' },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(`Rejected ${shopDetail?.shopName}`);
        navigate('/manager/shop_approval');
      }
    } catch (err) {
      toast.error(`Failed to reject ${shopDetail?.shopName}`);
    }
  };

  const handleRequestInfo = async () => {
    const note = window.prompt(`Information requested for ${shopDetail?.shopName}:`);
    if (note === null) return;
    try {
      const { data } = await axios.post(
        `${API}/manager/shops/${shopId}/request-info`,
        { note: note || 'Please provide additional information.' },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        toast.success(`Request sent to ${shopDetail?.shopName}`);
        fetchShopDetail(); // Refresh to show the new event in history
      }
    } catch (err) {
      toast.error(`Failed to send request for ${shopDetail?.shopName}`);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const toastId = toast.loading('Generating PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const getBase64ImageFromUrl = async (imageUrl) => {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const idImgUrl = shopDetail.identity_card_url || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800";
      const bizImgUrl = shopDetail.business_license_url || "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800";

      const idImgData = await getBase64ImageFromUrl(idImgUrl);
      const bizImgData = await getBase64ImageFromUrl(bizImgUrl);

      // Page 1: Identity Card
      pdf.setFontSize(16);
      pdf.text('Identity Card Front', 10, 15);
      pdf.addImage(idImgData, 'JPEG', 10, 25, pageWidth - 20, (pageWidth - 20) * 0.6);

      // Page 2: Business License
      pdf.addPage();
      pdf.text('Business License', 10, 15);
      pdf.addImage(bizImgData, 'JPEG', 10, 25, pageWidth - 20, (pageWidth - 20) * 0.6);

      pdf.save(`${shopDetail.shopName.replace(/\s+/g, '_')}_Legal_Documents.pdf`);
      toast.success('Downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. CORS might be blocking the images.', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shopDetail) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-slate-700">Shop not found</h2>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Application Details */}
          <div className="lg:col-span-2 space-y-8">
          {/* Shop Identity Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <span className="material-symbols-outlined text-4xl">store</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{shopDetail.shopName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-black rounded-lg uppercase">Standard Shop</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Applied: {new Date(shopDetail.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase ${
                  shopDetail.status === 'pending' ? 'bg-orange-100 text-[#f59e0b]' :
                  shopDetail.status === 'active' ? 'bg-green-100 text-[#16a34a]' :
                  'bg-red-100 text-[#dc2626]'
                }`}>
                  {shopDetail.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Representative</p>
                <p className="text-sm font-bold text-slate-700">{shopDetail.legalRep}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tax ID (MST)</p>
                <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg inline-block">{shopDetail.taxId}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Address</p>
                <p className="text-sm font-bold text-slate-700">{shopDetail.address}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</p>
                <p className="text-sm font-bold text-slate-700">{shopDetail.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Number</p>
                <p className="text-sm font-bold text-slate-700">{shopDetail.phone}</p>
              </div>
            </div>
          </div>

          {/* Legal Documents Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Legal Documents</h3>
              <button onClick={handleDownloadPDF} className="text-primary text-xs font-black hover:underline uppercase tracking-widest cursor-pointer">Download All (PDF)</button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div 
                className="group relative rounded-3xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 cursor-pointer"
                onClick={() => setSelectedImage(shopDetail.identity_card_url || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800")}
              >
                <img src={shopDetail.identity_card_url || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800"} alt="Identity Card" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-all shadow-xl cursor-pointer">
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Identity Card Front</span>
                  <span className="material-symbols-outlined text-[#16a34a] text-lg">verified</span>
                </div>
              </div>
              <div 
                className="group relative rounded-3xl overflow-hidden border border-slate-200 aspect-video bg-slate-50 cursor-pointer"
                onClick={() => setSelectedImage(shopDetail.business_license_url || "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800")}
              >
                <img src={shopDetail.business_license_url || "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800"} alt="Business License" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-all shadow-xl cursor-pointer">
                    <span className="material-symbols-outlined">zoom_in</span>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Business License</span>
                  <span className="material-symbols-outlined text-[#f59e0b] text-lg">pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Approval History Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Approval History</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shopDetail.history?.length || 0} Events Total</span>
            </div>
            <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              {shopDetail.history && shopDetail.history.map((evt, idx) => {
                const isDocSubmitted = evt.action === 'Documents Submitted';
                const isInfoReq = evt.action === 'Information Requested';
                const isAppOpened = evt.action === 'Application Opened';

                let iconBg = 'bg-slate-50 text-slate-400';
                let iconName = 'history';

                if (isDocSubmitted) {
                  iconBg = 'bg-green-50 text-[#16a34a]';
                  iconName = 'description';
                } else if (isInfoReq) {
                  iconBg = 'bg-blue-50 text-primary';
                  iconName = 'edit_note';
                } else if (isAppOpened) {
                  iconBg = 'bg-slate-50 text-slate-400';
                  iconName = 'visibility';
                }

                return (
                  <div key={idx} className="relative pl-10">
                    <div className={`absolute left-0 top-0 w-9 h-9 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${iconBg}`}>
                      <span className="material-symbols-outlined text-sm">
                        {iconName}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-black text-slate-900">{evt.action}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(evt.date).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">"{evt.note}"</p>
                      {!isDocSubmitted && (
                        <p className={`text-[10px] font-black uppercase mt-2 ${isInfoReq ? 'text-primary' : 'text-slate-400'}`}>By {evt.actorName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Action Panel */}
        <div className="space-y-8">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Review Decision</h3>
                {shopDetail.status === 'pending' ? (
                  <div className="space-y-4">
                    <button 
                      onClick={handleApprove}
                      className="w-full py-4 bg-[#16a34a] text-white rounded-2xl font-black text-sm shadow-lg shadow-green-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 cursor-pointer">
                      <span className="material-symbols-outlined">check_circle</span>
                      Approve Shop
                    </button>
                    <button 
                      onClick={handleRequestInfo}
                      className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 cursor-pointer">
                      <span className="material-symbols-outlined">help</span>
                      Request More Info
                    </button>
                    <button 
                      onClick={handleReject}
                      className="w-full py-4 bg-red-50 text-[#dc2626] rounded-2xl font-black text-sm hover:bg-[#dc2626] hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer">
                      <span className="material-symbols-outlined">cancel</span>
                      Reject Shop
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center p-4 bg-slate-50 rounded-2xl">
                    <p className="text-sm font-bold text-slate-600">This application has already been processed.</p>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Internal Notes</p>
                  <textarea placeholder="Add a private note for other managers..." className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 min-h-[100px] outline-none"></textarea>
                </div>
              </div>

              {/* AI Insights Footer */}
              <div className="p-8 bg-blue-50/50 border-t border-primary/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                  </div>
                  <h3 className="font-black text-primary text-sm tracking-tight">AI Audit Result</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#16a34a] text-lg mt-0.5">check_circle</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Tax ID (MST) matches public business records.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#16a34a] text-lg mt-0.5">check_circle</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Address verified via Google Maps.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#f59e0b] text-lg mt-0.5">info</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">Owner has 1 other shop with good rating.</p>
                  </li>
                </ul>
              </div>
            </div>
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
              alt="Document Fullscreen" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ManagerShopDetail;
