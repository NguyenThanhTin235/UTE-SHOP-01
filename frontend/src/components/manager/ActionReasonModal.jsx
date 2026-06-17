import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ActionReasonModal = ({ isOpen, onClose, onSubmit, title, itemName, type }) => {
  if (!isOpen) return null;

  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Define common options based on type
  const options = type === 'shop' ? [
    'Invalid or blurry business license',
    'Information mismatch between documents',
    'Suspected fraudulent activity',
    'Store name violates policies',
    'Other'
  ] : type === 'product' ? [
    'Prohibited item / Counterfeit',
    'Inappropriate images or description',
    'Misleading pricing or information',
    'Missing required certificates',
    'Other'
  ] : [
    'Information is unclear',
    'Need updated documents',
    'Other'
  ];

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!finalReason) {
      toast.error('Please select or enter a reason');
      return;
    }
    onSubmit(finalReason);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <span className="material-symbols-outlined text-3xl">gavel</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
          <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
            Please provide a reason for rejecting <span className="font-bold text-slate-700">{itemName}</span>.
          </p>

          <div className="space-y-3 mb-6">
            {options.map((opt, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedReason(opt)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedReason === opt ? 'border-red-500 bg-red-50/50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedReason === opt ? 'border-red-500' : 'border-slate-300'}`}>
                    {selectedReason === opt && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                  </div>
                </div>
                <span className={`text-sm font-bold ${selectedReason === opt ? 'text-red-700' : 'text-slate-700'}`}>{opt}</span>
              </div>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none"
                rows="3"
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
              className="flex-1 px-6 py-4 rounded-xl font-black text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionReasonModal;
