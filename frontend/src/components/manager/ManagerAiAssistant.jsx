import React from 'react';

const ManagerAiAssistant = ({
  showAI,
  setShowAI,
  aiInput,
  setAiInput,
  aiMessages,
  handleAiSubmit,
  unreadCount,
  aiEndRef
}) => {
  return (
    <>
      {/* ── FAB: AI Assistant ────────────────────────────────────────────── */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <button
          onClick={() => setShowAI(!showAI)}
          className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group relative border border-white/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-3xl">smart_toy</span>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-[#dc2626] font-black flex items-center justify-center rounded-full border-2 border-[#dc2626] shadow-lg text-[11px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant
          </span>
        </button>
      </div>

      {/* ── AI Chat Window ───────────────────────────────────────────────── */}
      {showAI && (
        <div className="fixed bottom-28 right-8 w-96 h-[560px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col z-[60] overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-primary text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">Manager AI Assistant</h3>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Operations Expert</p>
              </div>
            </div>
            <button
              onClick={() => setShowAI(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 flex flex-col">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-sm">{msg.sender === 'user' ? 'person' : 'smart_toy'}</span>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed max-w-[80%] ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={aiEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleAiSubmit} className="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200/60">
              <input
                type="text"
                placeholder="Ask AI anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-2 outline-none"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ManagerAiAssistant;
