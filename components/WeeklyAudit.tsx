import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Hand, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  Wind,
  Stethoscope,
  Sparkles,
  Activity,
  RefreshCw,
  FileCheck,
  ArrowLeft,
  ShieldAlert,
  Users,
  AlertTriangle,
  Trash2,
  FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuditRecord, AuditType, ClinicalReport } from '../types';
import { WHO_5_MOMENTS, PPE_DATA, ENVIRONMENTAL_CHECKLIST, EQUIPMENT_CHECKLIST, ISOLATION_CHECKLIST, VISITOR_CHECKLIST } from '../constants';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { db, saveData, sendToCloud, deleteFromCloud } from '../services/firebase';
import { ref, onValue } from "firebase/database";
import * as XLSX from 'xlsx';

const WeeklyAudit: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<AuditRecord[]>(storageService.getAudits());
  const [activeAuditType, setActiveAuditType] = useState<AuditType | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [filter, setFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [auditor, setAuditor] = useState('');
  const [audienceName, setAudienceName] = useState('');
  const [department, setDepartment] = useState('');
  const [staffGroup, setStaffGroup] = useState('Nurses');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<boolean[]>([]);

  const STAFF_GROUPS = ['Nurses', 'Doctors', 'RT', 'Housekeeping', 'PT', 'Others'];

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    setIsDesigner(sessionStorage.getItem('is_designer_active') === 'true');
    
    // Initial load
    setAudits(storageService.getAudits());

    // Real-time listener for audits
    const auditsRef = ref(db, 'audits');
    const unsubscribe = onValue(auditsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const cloudList: any[] = [];
        Object.keys(val).forEach(key => {
          const item = val[key];
          if (item.id && (item.totalScore !== undefined || item.score !== undefined)) {
            cloudList.push({ id: key, ...item });
          } else if (typeof item === 'object') {
            Object.keys(item).forEach(subKey => {
              cloudList.push({ id: subKey, auditType: key, ...item[subKey] });
            });
          }
        });
        
        setAudits(prev => {
          const localAudits = storageService.getAudits();
          const auditMap = new Map();
          
          // Add local first
          localAudits.forEach(a => auditMap.set(a.id, a));
          // Add cloud (overwrites if same ID)
          cloudList.forEach(a => auditMap.set(a.id, a));
          
          const final = Array.from(auditMap.values());
          // Sort by timestamp descending
          return final.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0).getTime();
            const dateB = new Date(b.timestamp || 0).getTime();
            return dateB - dateA;
          });
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const exportToExcel = () => {
    if (audits.length === 0) {
      alert("No data to export.");
      return;
    }

    // Format data for Excel
    const data = audits.map(a => ({
      'ID': a.id,
      'Type': a.auditType,
      'Auditor': a.auditor || 'N/A',
      'Audience': a.audienceName || 'N/A',
      'Staff Group': a.staffGroup || 'N/A',
      'Score %': a.totalScore || a.score || 0,
      'Timestamp': a.timestamp,
      'Notes': a.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Audits");

    // Fix column widths
    const wscols = [
      {wch: 25}, // ID
      {wch: 20}, // Type
      {wch: 20}, // Auditor
      {wch: 20}, // Audience
      {wch: 20}, // Staff Group
      {wch: 15}, // Score
      {wch: 25}, // Timestamp
      {wch: 50}  // Notes
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Weekly_Audits_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActiveChecklistData = () => {
    switch(activeAuditType) {
      case 'hand-hygiene': return WHO_5_MOMENTS.map(m => ({ title: m.en, ar: m.ar }));
      case 'ppe-compliance': return PPE_DATA.donning.map(s => ({ title: s.title, ar: s.ar || '' }));
      case 'environmental': return ENVIRONMENTAL_CHECKLIST;
      case 'equipment': return EQUIPMENT_CHECKLIST;
      case 'isolation': return ISOLATION_CHECKLIST;
      case 'visitors': return VISITOR_CHECKLIST;
      default: return [];
    }
  };

  const startAudit = (type: AuditType) => {
    setActiveAuditType(type);
    let size = getActiveChecklistData().length;
    setChecklist(new Array(size).fill(false));
  };

  const calculateScore = (checks: boolean[]) => {
    if (checks.length === 0) return 0;
    const passed = checks.filter(c => c).length;
    return Math.round((passed / checks.length) * 100);
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();

    const score = calculateScore(checklist);
    const checklistData = getActiveChecklistData();
    const checkedItems = checklistData
      .filter((_, i) => checklist[i])
      .map(item => item);

    const timestamp = new Date().toLocaleString("en-GB");

    const newAudit = {
      id: Date.now().toString(),
      timestamp,
      auditor,
      staffGroup,
      audienceName,
      department,
      score,
      auditType: activeAuditType,
      checkedItems,
    };

    // 1. Save locally first to ensure no data loss
    const localCheckedItems = checkedItems.map(item => item.title);
    const localTimestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const localAudit: AuditRecord = {
      id: newAudit.id,
      timestamp: localTimestamp,
      auditor,
      staffGroup,
      audienceName,
      department,
      handHygieneScore: activeAuditType === 'hand-hygiene' ? score : 0,
      ppeScore: activeAuditType === 'ppe-compliance' ? score : 0,
      environmentalScore: activeAuditType === 'environmental' ? score : 0,
      equipmentScore: activeAuditType === 'equipment' ? score : 0,
      totalScore: score,
      notes,
      actionTaken: '',
      auditType: activeAuditType!,
      checkedItems: localCheckedItems
    };

    storageService.saveAudit(localAudit);
    
    setAudits(storageService.getAudits());
    setShowSuccess(true);
    setActiveAuditType(null);
    
    // Reset form fields
    setAuditor(''); setAudienceName(''); setDepartment(''); setNotes(''); setStaffGroup('Nurses');

    // 2. Attempt background sync to Google Sheets
    syncService.sendToGoogleSheets(newAudit);

    // 3. Save to Firebase in type-specific subfolder
    try {
      // Modified: Send to audits/type as originally requested
      const success = await sendToCloud(`audits/${activeAuditType}`, localAudit);
      if (success) {
        console.log(`Audit synced to cloud: audits/${activeAuditType}`);
      } else {
        // Fallback for offline
        localStorage.setItem('pending_audit', JSON.stringify(localAudit));
      }
    } catch (error) {
      console.error("Firebase sync failed:", error);
    }
  };

  const processAIFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const result = await gemini.analyzeReport((reader.result as string).split(',')[1], file.type);
        const newReport: ClinicalReport = {
          id: `ai-${Date.now()}`,
          title: result.isMdroFinding ? `MDRO: ${result.mdroTransmission}` : `Audit: ${result.unitName}`,
          unitName: result.unitName,
          reportDate: result.reportDate,
          mdroTransmission: result.mdroTransmission,
          timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          analysisDate: new Date().toISOString(),
          extractedScores: {
            handHygiene: result.handHygiene || 0,
            ppe: result.ppe || 0,
            environmental: result.environmental || 0,
            equipment: result.equipment || 0
          },
          summary: result.summary,
          status: 'analyzed',
          isMdroFinding: result.isMdroFinding,
          auditType: result.auditType,
          checkedItems: result.checkedItems,
          staffGroup: result.staffGroup
        };
        storageService.saveReport(newReport);
        setIsProcessing(false);
        setShowSuccess(true);
      };
    } catch (e) {
      setIsProcessing(false);
      alert("AI Processing Failed.");
    }
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput === designerCode) {
      // Find the audit to get its type for the path
      const audit = audits.find(a => a.id === id);
      if (audit) {
        const path = audit.auditType ? `audits/${audit.auditType}` : 'audits';
        await deleteFromCloud(path, id);
      }
      storageService.deleteAudit(id);
      setAudits(storageService.getAudits());
      alert("Audit record purged by Designer.");
    } else if (userInput !== null) {
      alert("Unauthorized! Only the Designer can delete audits.");
    }
  };

  const purgeHistory = () => {
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput === designerCode) {
      if (window.confirm("CRITICAL: Purge ALL manual audit history? Reports in vault will be preserved.")) {
        const all = storageService.getAudits();
        all.forEach(a => storageService.deleteAudit(a.id));
        setAudits([]);
        alert("Audit history purged by Designer.");
      }
    } else if (userInput !== null) {
      alert("Unauthorized! Only the Designer can purge history.");
    }
  };

  const AUDIT_CATEGORIES: { type: AuditType | 'ai-entry', title: string, icon: any, color: string, ar: string }[] = [
    { type: 'ai-entry', title: 'Add Report/Audit', icon: Sparkles, color: 'bg-amber-600', ar: 'إضافة تقرير' },
    { type: 'hand-hygiene', title: 'Hand Hygiene', icon: Hand, color: 'bg-blue-600', ar: 'نظافة اليدين' },
    { type: 'ppe-compliance', title: 'PPE Compliance', icon: ShieldCheck, color: 'bg-emerald-600', ar: 'احتياطات الوقاية' },
    { type: 'environmental', title: 'Environmental', icon: Wind, color: 'bg-amber-600', ar: 'نظافة البيئة' },
    { type: 'equipment', title: 'Equipment', icon: Stethoscope, color: 'bg-indigo-600', ar: 'تعقيم الأجهزة' },
    { type: 'isolation', title: 'Isolation', icon: ShieldAlert, color: 'bg-red-600', ar: 'بروتوكول العزل' },
    { type: 'visitors', title: 'Visitors', icon: Users, color: 'bg-purple-600', ar: 'سلامة الزوار' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-lg z-[500] flex items-center justify-center p-6">
           <div className={`w-full max-w-lg p-12 rounded-[4rem] border shadow-2xl flex flex-col items-center text-center gap-8 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
              <div className="bg-emerald-600 p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-50">
                 <FileCheck className="w-16 h-16 text-white" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-3xl font-black uppercase">Intelligence Logged</h4>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Data secure and persistent in local vault.</p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">DISMISS</button>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
        <div>
           <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">Clinical Performance</span>
           <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Facility Audits</h2>
        </div>
        {!activeAuditType && (
           <div className="flex items-center gap-4">
              {isDesigner && audits.length > 0 && (
                <button onClick={purgeHistory} className="bg-red-50 text-red-600 px-6 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest flex items-center gap-3">
                   <Trash2 className="w-4 h-4" /> Purge
                </button>
              )}
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search logs..." className={`pl-16 pr-8 py-5 rounded-[2rem] border-none outline-none text-sm font-bold w-full md:w-80 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
              </div>
           </div>
        )}
      </header>

      {!activeAuditType ? (
        <div className="space-y-20">
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-5">
            {AUDIT_CATEGORIES.map((cat) => (
              <button 
                key={cat.type}
                onClick={() => {
                  if (cat.type === 'ai-entry') fileInputRef.current?.click();
                  else startAudit(cat.type);
                }}
                className={`flex flex-col items-center text-center p-8 border rounded-[3.5rem] transition-all hover:shadow-2xl active:scale-95 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}
              >
                <div className={`${cat.color} w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl mb-6`}>
                  {cat.type === 'ai-entry' && isProcessing ? <RefreshCw className="w-7 h-7 animate-spin" /> : <cat.icon className="w-7 h-7" />}
                </div>
                <h4 className="font-black text-[10px] tracking-widest uppercase mb-1">{cat.title}</h4>
                <p className="text-[9px] font-bold text-slate-400 font-arabic">{cat.ar}</p>
              </button>
            ))}
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={e => processAIFile(e.target.files?.[0]!)} className="hidden" />
          </section>

          <section className="space-y-6">
              <h3 className="font-black text-slate-500 text-[12px] uppercase tracking-[0.5em] flex items-center gap-4"><Activity className="w-6 h-6 opacity-40" /> Command History</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {audits.filter(a => (a.department?.toLowerCase() || '').includes(filter.toLowerCase())).map((audit) => (
                  <div key={audit.id} className={`p-8 rounded-[3.5rem] border shadow-sm flex items-center justify-between gap-8 group/item transition-all ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
                     <div className="flex items-center gap-8">
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-white text-2xl shadow-xl ${audit.totalScore >= 90 ? 'bg-emerald-600' : 'bg-amber-500'}`}>{audit.totalScore}%</div>
                        <div>
                           <h4 className="font-black uppercase text-base tracking-tighter">{audit.department}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{audit.timestamp} | {audit.staffGroup}</p>
                        </div>
                     </div>
                     {isDesigner && (
                       <button 
                         onClick={(e) => handleDeleteAudit(audit.id, e)}
                         className="p-4 rounded-2xl bg-red-50 text-red-600 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                       >
                          <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                ))}
              </div>
          </section>

          {audits.length > 0 && (
            <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex justify-center">
               <button 
                 type="button" 
                 onClick={exportToExcel}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest flex items-center gap-4 shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer group"
               >
                  <FileDown className="w-6 h-6 group-hover:bounce" />
                  Export All Audits to Excel
               </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveAudit} className="animate-in zoom-in-95">
           <div className={`p-10 md:p-16 rounded-[4.5rem] border shadow-2xl space-y-16 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
              <header className="flex items-center gap-8 border-b border-slate-100 dark:border-white/5 pb-12">
                 <button type="button" onClick={() => setActiveAuditType(null)} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950"><ArrowLeft className="w-8 h-8" /></button>
                 <h3 className="text-4xl font-black uppercase tracking-tighter">{activeAuditType?.replace('-', ' ')} Audit</h3>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { l: 'Auditor Name', v: auditor, s: setAuditor, p: 'Name' },
                  { l: 'Personnel Name', v: audienceName, s: setAudienceName, p: 'Staff Name' },
                  { l: 'Unit/Ward', v: department, s: setDepartment, p: 'Unit' }
                ].map((f, i) => (
                  <div key={i} className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{f.l}</label>
                    <input required value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.p} className={`w-full border-none rounded-[1.8rem] px-8 py-6 text-sm font-bold outline-none ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Audited Staff Group</label>
                <div className="flex flex-wrap gap-3">
                  {STAFF_GROUPS.map(group => {
                    const isSelected = staffGroup === group;
                    const defaultStyle = "bg-white/5 border-white/10 text-slate-500";
                    const selectedStyle = "bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] text-white";
                    
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setStaffGroup(group)}
                        className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${isSelected ? selectedStyle : defaultStyle}`}
                      >
                        {group}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Observations / Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter any specific clinical findings or actions taken..." className={`w-full border-none rounded-[1.8rem] px-8 py-6 text-sm font-bold outline-none h-32 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
              </div>

              <div className="space-y-10">
                 <h4 className="font-black text-sm uppercase flex items-center gap-5"><ClipboardCheck className="w-8 h-8 text-emerald-600" /> Compliance Checklist</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                   {getActiveChecklistData().map((item, i) => {
                     const isSelected = checklist[i];
                     const defaultStyle = "bg-white/5 border-white/10 text-slate-500";
                     const selectedStyle = "bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-[10px]";
                     const textStyle = "text-emerald-400 font-black z-10";
                     
                     return (
                       <button 
                         type="button" 
                         key={i} 
                         onClick={() => { const n = [...checklist]; n[i]=!n[i]; setChecklist(n); }} 
                         className={`w-full text-left p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex items-center justify-between compliance-card relative overflow-hidden ${isSelected ? selectedStyle : defaultStyle}`}
                       >
                          <div className={`space-y-1 ${isSelected ? 'z-10' : ''}`}>
                             <span className={`text-[12px] uppercase block ${isSelected ? textStyle : 'font-black'}`}>{item.title}</span>
                             <span className={`text-[11px] font-bold opacity-50 block font-arabic ${isSelected ? 'text-emerald-400' : ''}`}>{item.ar}</span>
                          </div>
                          <CheckCircle2 className={`w-8 h-8 transition-colors ${isSelected ? 'text-emerald-400 z-10' : 'text-slate-700'}`} />
                       </button>
                     );
                   })}
                 </div>
              </div>

              <div className="flex gap-6">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl">SUBMIT AUDIT</button>
                <button type="button" onClick={() => setActiveAuditType(null)} className="px-12 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest bg-slate-100 text-slate-400">ABORT</button>
              </div>
           </div>
        </form>
      )}
    </div>
  );
};

export default WeeklyAudit;