import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Droplets, Activity } from 'lucide-react';

const HandHygieneAudit = () => {
  const [logs, setLogs] = useState<any[]>([]);
  
  const moments = [
    { id: 1, label: "Moment 1", desc: "Before touching a patient" },
    { id: 2, label: "Moment 2", desc: "Before clean/aseptic procedures" },
    { id: 3, label: "Moment 3", desc: "After body fluid exposure risk" },
    { id: 4, label: "Moment 4", desc: "After touching a patient" },
    { id: 5, label: "Moment 5", desc: "After touching patient surroundings" }
  ];

  const handleAudit = (momentId: number, isPass: boolean) => {
    const entry = { id: Date.now(), moment: momentId, status: isPass ? 'Pass' : 'Fail', time: new Date().toLocaleTimeString() };
    setLogs([entry, ...logs]);
  };

  const getRate = (id: number) => {
    const mLogs = logs.filter(l => l.moment === id);
    return mLogs.length ? Math.round((mLogs.filter(l => l.status === 'Pass').length / mLogs.length) * 100) : 0;
  };

  const handleSave = () => {
    if (logs.length === 0) return;

    const overall = Math.round(
      moments.reduce((acc, m) => acc + getRate(m.id), 0) / moments.length
    );

    const newReport = {
      id: `HH-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      overall,
      stats: moments.map(m => ({ rate: getRate(m.id) })),
      details: "Audit completed successfully"
    };

    const saved = JSON.parse(localStorage.getItem('hand_hygiene_reports') || '[]');
    localStorage.setItem('hand_hygiene_reports', JSON.stringify([newReport, ...saved]));
    
    // Clear logs after saving
    setLogs([]);
    alert('Report Saved! Check the RESULTS tab.');
  };

  return (
    <div className="p-4 bg-[#0a0f1e] min-h-screen text-white rounded-[2.5rem] overflow-hidden pb-32">
      <div className="mb-6 flex items-center justify-between bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
        <div>
          <h1 className="text-xl font-bold">HAND HYGIENE AUDIT</h1>
          <p className="text-[10px] text-blue-400 font-mono">WHO 5 MOMENTS STANDARD</p>
        </div>
        <Droplets className="text-blue-400" size={28} />
      </div>

      <div className="space-y-4">
        {moments.map(m => (
          <div key={m.id} className="bg-[#161d31] p-5 rounded-3xl border border-white/5 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-blue-400 font-bold text-xs uppercase tracking-tighter">{m.label}</span>
                <h3 className="text-sm font-semibold text-gray-200">{m.desc}</h3>
              </div>
              <div className={`text-lg font-black ${getRate(m.id) >= 80 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {getRate(m.id)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAudit(m.id, true)} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-3 rounded-xl border border-emerald-500/20 font-bold text-xs transition-all active:scale-95">
                <ShieldCheck className="inline mr-1" size={14} /> PASS
              </button>
              <button onClick={() => handleAudit(m.id, false)} className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white py-3 rounded-xl border border-rose-500/20 font-bold text-xs transition-all active:scale-95">
                <ShieldAlert className="inline mr-1" size={14} /> FAIL
              </button>
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="mt-10 px-2">
          <button 
            onClick={handleSave}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
          >
            <Activity size={18} /> SAVE AUDIT TO RESULTS
          </button>
        </div>
      )}
    </div>
  );
};

export default HandHygieneAudit;
