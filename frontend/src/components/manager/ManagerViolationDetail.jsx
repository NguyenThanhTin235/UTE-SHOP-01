import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

function getAuthHeader() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
}

const ManagerViolationDetail = ({ violationId, setHeaderData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [violationId]);

  useEffect(() => {
    const violation = data?.violation;
    if (violation && typeof setHeaderData === 'function') {
      const isHigh = violation.severity === 'high';
      const isMedium = violation.severity === 'medium';

      setHeaderData({
        title: (
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter">Incident: {violation.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`size-2 rounded-full ${isHigh ? 'bg-red-600' : isMedium ? 'bg-orange-500' : 'bg-blue-600'}`}></span>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">#{(violation._id || violation.id || '').toString().substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        ),
        extra: (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isHigh ? 'bg-red-50 border-red-100' : isMedium ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
            <span className={`material-symbols-outlined text-xl ${isHigh ? 'text-red-600 animate-pulse' : isMedium ? 'text-orange-500' : 'text-blue-600'}`}>
              priority_high
            </span>
            <span className={`text-xs font-black uppercase tracking-widest ${isHigh ? 'text-red-600' : isMedium ? 'text-orange-500' : 'text-blue-600'}`}>
              {violation.severity} Severity
            </span>
          </div>
        )
      });
    }

    return () => {
      if (typeof setHeaderData === 'function') {
        setHeaderData(null);
      }
    };
  }, [data, setHeaderData]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/manager/violations/${violationId}`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Fetch detail error:', err);
      toast.error('Failed to load violation detail');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if ((action === 'lock_shop' || action === 'issue_warning') && !reason.trim()) {
      toast.error('Please enter an enforcement note before taking this action');
      return;
    }
    setActionLoading(true);
    try {
      const response = await axios.post(
        `${API}/manager/violations/${violationId}/action`,
        { action, reason },
        { headers: getAuthHeader() }
      );
      if (response.data.success) {
        toast.success(response.data.message || 'Action executed successfully');
        navigate('/manager?tab=violations');
      }
    } catch (err) {
      console.error('Action error:', err);
      toast.error(err.response?.data?.message || 'Failed to execute moderation action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold">Loading case details...</p>
      </div>
    );
  }

  if (!data || !data.violation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#F8FAFC]">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">error</span>
        <h3 className="text-xl font-black text-slate-900">Case Not Found</h3>
        <button onClick={() => navigate('/manager?tab=violations')} className="mt-4 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors">
          Back to Incident Queue
        </button>
      </div>
    );
  }

  const { violation, history } = data;
  const isHigh = violation.severity === 'high';
  const isMedium = violation.severity === 'medium';
  
  return (
    <>
      {/* Workspace */}
      <div className="max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Evidence & Context */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Case Summary */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Incident Summary</h3>
              <div className="grid grid-cols-2 gap-6 mb-8">
                
                {/* Subject Info */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Subject (Reported)</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      <span className="material-symbols-outlined text-slate-300 text-2xl">storefront</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 line-clamp-1">{violation.shopId?.name || 'Unknown Shop'}</p>
                      <p className="text-[10px] text-primary font-bold">ID: {(violation.shopId?.id || '').toString().substring(0, 8)} | Shop</p>
                    </div>
                  </div>
                </div>

                {/* Reporter Info */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Primary Reporter</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden font-black text-primary text-xs shrink-0">
                      RPT
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{violation.reporterInfo || 'Anonymous User'}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{violation.reportedByCount} Reports</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Report Content</p>
                <div className="p-6 bg-slate-50 rounded-3xl text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-red-500/50">
                  "{violation.description}"
                </div>
              </div>
            </div>

            {/* Evidence Gallery */}
            {violation.evidenceUrls && violation.evidenceUrls.length > 0 && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Evidence Gallery</h3>
                  <span className="text-[10px] font-black text-primary bg-blue-50 px-3 py-1 rounded-lg uppercase">{violation.evidenceUrls.length} Attachments</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {violation.evidenceUrls.map((url, index) => {
                    let badgeText = `EVIDENCE #${index + 1}`;
                    let badgeColor = 'text-slate-600';
                    
                    if (index === 0) {
                      badgeText = 'REPORTED ITEM';
                      badgeColor = 'text-red-600';
                    } else if (index === 1) {
                      badgeText = 'REFERENCE (AUTHENTIC)';
                      badgeColor = 'text-green-600';
                    }

                    return (
                      <div 
                        key={index} 
                        className="aspect-video rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 relative group cursor-pointer shadow-sm"
                        onClick={() => setSelectedImage(url)}
                      >
                        <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(url); }}
                            className="bg-white text-primary px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 transform translate-y-3 group-hover:translate-y-0"
                          >
                            <span className="material-symbols-outlined text-base font-black">zoom_in</span>
                            Inspect
                          </button>
                        </div>

                        <div className={`absolute top-4 left-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${badgeColor}`}>
                          {badgeText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History Timeline */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Subject Violation History</h3>
              {history && history.length > 0 ? (
                <div className="space-y-6">
                  {history.map((hist, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <span className="material-symbols-outlined text-orange-500">warning</span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{hist.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Reported on {new Date(hist.createdAt).toLocaleDateString()}. Action: {hist.actionTaken?.replace('_', ' ')}
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] font-black text-slate-400 uppercase">{hist.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No previous violations found for this subject.
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Panel */}
          <div className="space-y-8">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">Take Action</h3>
                  
                  {violation.status === 'pending' ? (
                    <div className="space-y-4">
                      {isHigh ? (
                        <button 
                          onClick={() => handleAction('lock_shop')}
                          disabled={actionLoading}
                          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">block</span>
                          Permanently Ban Shop
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAction('issue_warning')}
                          disabled={actionLoading}
                          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 text-sm cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">warning</span>
                          Issue Final Warning
                        </button>
                      )}
                      
                      <div className="h-px bg-slate-100 my-4"></div>
                      
                      <button 
                        onClick={() => handleAction('dismiss')}
                        disabled={actionLoading}
                        className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">check_circle</span>
                        Dismiss Case
                      </button>
                      
                      <div className="mt-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Enforcement Note</label>
                        <textarea 
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="State the reason for this action (visible to subject)..." 
                          className="w-full h-32 bg-slate-50 border border-slate-200 rounded-3xl p-4 text-sm font-bold focus:ring-primary/20 focus:border-primary/50 placeholder:text-slate-400 transition-all outline-none"
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-200">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">task_alt</span>
                      <p className="text-sm font-black text-slate-900">Case Closed</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">
                        Status: {violation.status}
                      </p>
                    </div>
                  )}
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
              alt="Evidence Fullscreen" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ManagerViolationDetail;
