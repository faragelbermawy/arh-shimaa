
import React, { useState, useEffect } from 'react';
import { ClipboardList, UserPlus, History, CheckCircle, Lock, AlertCircle, Database, ChevronRight, UserCheck, Trash2 } from 'lucide-react';
import { Visitor } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { saveData, sendToCloud } from '../services/firebase';

const VisitorRegistry: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(storageService.getVisitors());
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setVisitors(storageService.getVisitors());
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dept.trim()) return;

    const newVisitor: Visitor = {
      id: Date.now().toString(),
      name: name.trim(),
      department: dept.trim(),
      timestamp: new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }),
    };

    storageService.saveVisitor(newVisitor);
    setVisitors(storageService.getVisitors());
    
    // Sync to Google Sheets
    syncService.sendToGoogleSheets({
      type: 'visitor_registry',
      ...newVisitor
    });

    // Save to Firebase
    await sendToCloud('registries', newVisitor);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    setName('');
    setDept('');
  };

  const handleDeleteVisitor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Purge this visitor log from history?")) {
      storageService.deleteVisitor(id);
      setVisitors(storageService.getVisitors());
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 duration-300 w-[90%] max-w-sm">
           <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center text-center gap-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="bg-blue-600 p-5 rounded-3xl shadow-2xl shadow-blue-900/30"><UserCheck className="w-10 h-10 text-white" /></div>
              <div className="space-y-2">
                 <h4 className="text-xl font-black uppercase tracking-tight">Presence Logged</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Safety protocols active for current entry</p>
              </div>
           </div>
        </div>
      )}

      <header className="pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
           <div className="h-px w-6 bg-blue-600" />
           <span className="text-blue-600 font-black text-[9px] uppercase tracking-[0.3em]">Operational Flow</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
          <ClipboardList className="text-blue-600 w-10 h-10 md:w-14 md:h-14" />
          Presence Registry
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <form onSubmit={handleCheckIn} className={`p-8 rounded-[3rem] border shadow-2xl space-y-8 sticky top-10 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="font-black text-sm uppercase flex items-center gap-3"><UserPlus className="w-5 h-5 text-blue-600" /> Quick Register</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Clinical Name / Visitor" className={`w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 py-5 text-sm outline-none focus:ring-1 focus:ring-blue-900 transition-all`} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Unit</label>
                <input required value={dept} onChange={e => setDept(e.target.value)} placeholder="Department / Area" className={`w-full bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 py-5 text-sm outline-none focus:ring-1 focus:ring-blue-900 transition-all`} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/30 hover:bg-blue-500 active:scale-95 transition-all">
                LOG PRESENCE
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <h3 className="font-black text-slate-500 text-[11px] uppercase tracking-[0.4em] px-2 flex items-center gap-3">
              <History className="w-5 h-5 opacity-40" /> Clinical Registry history
           </h3>
           
           {visitors.length > 0 ? (
             <div className={`rounded-[3.5rem] border shadow-sm overflow-hidden p-3 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="space-y-2">
                  {visitors.map((v) => (
                    <div key={v.id} className={`flex items-center justify-between p-6 rounded-[2.5rem] transition-all border border-transparent group/item ${isDarkMode ? 'hover:bg-slate-950 hover:border-slate-800' : 'hover:bg-slate-50 hover:border-slate-100'}`}>
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black uppercase text-xl shadow-lg shadow-blue-900/20">
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">{v.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{v.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase">{v.timestamp}</p>
                         </div>
                         <button 
                           onClick={(e) => handleDeleteVisitor(v.id, e)}
                           className="p-3 rounded-xl bg-red-50 text-red-600 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           ) : (
             <div className={`p-20 md:p-32 rounded-[4rem] border-4 border-dashed text-center flex flex-col items-center gap-8 transition-colors ${isDarkMode ? 'bg-slate-900/30 border-slate-900/50' : 'bg-slate-50 border-slate-100'}`}>
                <div className="bg-white dark:bg-slate-900 p-10 rounded-full shadow-2xl ring-8 ring-slate-100 dark:ring-slate-900/50 animate-bounce-slow">
                   <ClipboardList className="w-16 h-16 text-slate-200" />
                </div>
                <div className="space-y-3 max-w-sm">
                   <h4 className="text-2xl font-black uppercase tracking-tight text-slate-300">Registry Is Idle</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Safety protocols require a log for all active personnel and visitors.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VisitorRegistry;
