
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Search,
  Database,
  Sparkles,
  RefreshCw,
  FileUp,
  Activity,
  CheckSquare,
  Clock,
  Send,
  AlertTriangle,
  Dna,
  CheckCircle2,
  FileDown,
  Share2,
  Users,
  ShieldAlert,
  UserCheck,
  ClipboardCheck,
  Folder,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  FileText,
  Stethoscope,
  GraduationCap,
  Plus,
  Eye,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { db, sendToCloud } from '../services/firebase';
import { ref, onValue } from "firebase/database";
import { ClinicalReport, AuditType, UserProgress } from '../types';
import { jsPDF } from 'jspdf';

const DESIGNER_PHONE = "966508855131";

type CategoryKey = AuditType | 'mdro-finding' | 'uncategorized';

interface CategoryInfo {
  id: CategoryKey;
  label: string;
  icon: any;
  color: string;
  bgGradient: string;
  accentBorder: string;
  shadowColor: string;
}

const CATEGORIES: CategoryInfo[] = [
  { id: 'mdro-finding', label: 'MDRO Findings', icon: Dna, color: 'text-red-600', bgGradient: 'from-red-50 to-white dark:from-red-950/40 dark:to-slate-900', accentBorder: 'border-red-100 dark:border-red-900/30', shadowColor: 'shadow-red-900/10' },
  { id: 'hand-hygiene', label: 'Hand Hygiene', icon: Activity, color: 'text-blue-600', bgGradient: 'from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-900', accentBorder: 'border-blue-100 dark:border-blue-900/30', shadowColor: 'shadow-blue-900/10' },
  { id: 'ppe-compliance', label: 'PPE Compliance', icon: GraduationCap, color: 'text-emerald-600', bgGradient: 'from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900', accentBorder: 'border-emerald-100 dark:border-emerald-900/30', shadowColor: 'shadow-emerald-900/10' },
  { id: 'environmental', label: 'Environmental', icon: Sparkles, color: 'text-amber-600', bgGradient: 'from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900', accentBorder: 'border-amber-100 dark:border-amber-900/30', shadowColor: 'shadow-amber-900/10' },
  { id: 'equipment', label: 'Equipment Care', icon: Stethoscope, color: 'text-indigo-600', bgGradient: 'from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900', accentBorder: 'border-indigo-100 dark:border-indigo-900/30', shadowColor: 'shadow-indigo-900/10' },
  { id: 'isolation', label: 'Isolation Logs', icon: ShieldAlert, color: 'text-rose-600', bgGradient: 'from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900', accentBorder: 'border-rose-100 dark:border-rose-900/30', shadowColor: 'shadow-rose-900/10' },
  { id: 'visitors', label: 'Visitor Audits', icon: Users, color: 'text-purple-600', bgGradient: 'from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900', accentBorder: 'border-purple-100 dark:border-purple-900/30', shadowColor: 'shadow-purple-900/10' },
  { id: 'uncategorized', label: 'General / Other', icon: Folder, color: 'text-slate-600', bgGradient: 'from-slate-50 to-white dark:from-slate-800 dark:to-slate-900', accentBorder: 'border-slate-100 dark:border-white/10', shadowColor: 'shadow-slate-900/10' },
];

const DocsManager: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ClinicalReport[]>(storageService.getReports());
  const [cloudAudits, setCloudAudits] = useState<any[]>([]);
  const [cloudRegistries, setCloudRegistries] = useState<any[]>([]);
  const [cloudFindings, setCloudFindings] = useState<any[]>([]);
  const [cloudReports, setCloudReports] = useState<any[]>([]);
  const [progress, setProgress] = useState<UserProgress>(storageService.getProgress());
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    const interval = setInterval(() => {
      setReports(storageService.getReports());
      setProgress(storageService.getProgress());
      setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Connect to Firebase audits path for live updates
    const auditsRef = ref(db, 'audits');
    const unsubscribeAudits = onValue(auditsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ 
          id: `cloud-audit-${key}`, 
          ...val[key],
          isCloudRecord: true,
          auditType: val[key].auditType || 'hand-hygiene' // fallback
        }));
        setCloudAudits(list);
      }
    });

    // Connect to Firebase registries path for live updates
    const registriesRef = ref(db, 'registries');
    const unsubscribeRegistries = onValue(registriesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ 
          id: `cloud-reg-${key}`, 
          title: `Registry: ${val[key].name || val[key].fullName || 'Visitor'}`,
          unitName: val[key].department || val[key].unit || 'General',
          timestamp: val[key].timestamp || val[key].serverTime || new Date().toISOString(),
          isCloudRecord: true,
          auditType: 'visitors' as AuditType,
          summary: `Visitor/Staff presence logged: ${val[key].name || val[key].fullName}`,
          extractedScores: { handHygiene: 0, ppe: 0, environmental: 0, equipment: 0 }
        }));
        setCloudRegistries(list);
      }
    });

    // Connect to Firebase findings path for live updates
    const findingsRef = ref(db, 'findings');
    const unsubscribeFindings = onValue(findingsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ 
          id: `cloud-find-${key}`, 
          ...val[key],
          isCloudRecord: true,
          auditType: 'mdro-finding' as any
        }));
        setCloudFindings(list);
      }
    });

    // Connect to Firebase reports path for live updates
    const reportsRef = ref(db, 'reports');
    const unsubscribeReports = onValue(reportsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ 
          id: `cloud-rep-${key}`, 
          ...val[key],
          isCloudRecord: true
        }));
        setCloudReports(list);
      }
    });

    return () => {
      unsubscribeAudits();
      unsubscribeRegistries();
      unsubscribeFindings();
      unsubscribeReports();
    };
  }, []);

  const allReports = [...reports, ...cloudAudits, ...cloudRegistries, ...cloudFindings, ...cloudReports];

  const openInExternalReader = async (file: ClinicalReport) => {
    const fullReport = await storageService.getReportWithData(file.id);
    if (!fullReport || !fullReport.fileData) {
      alert("This record was generated from an audit and does not have an attached source document.");
      return;
    }

    try {
      const arr = fullReport.fileData.split(',');
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: fullReport.fileMimeType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (e) {
      alert("Error opening source file.");
    }
  };

  const createPDFBlob = async (report: ClinicalReport): Promise<{ blob: Blob, filename: string }> => {
    const fullReport = await storageService.getReportWithData(report.id);
    const r = fullReport || report;
    
    const doc = new jsPDF();
    const isAudit = !r.isMdroFinding;
    
    // Header
    doc.setFillColor(isAudit ? 22 : 185, isAudit ? 101 : 28, isAudit ? 52 : 28); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ARH-LTC', 20, 20);
    doc.setFontSize(10);
    doc.text(isAudit ? 'OFFICIAL CLINICAL AUDIT REPORT' : 'MDRO FINDING REPORT', 20, 30);

    // Body
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.text(r.title.toUpperCase(), 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${r.reportDate || 'N/A'}`, 20, 65);
    doc.text(`Unit/Ward: ${r.unitName || 'Unspecified'}`, 20, 72);
    
    let y = 85;

    // Personnel Info
    if (r.auditor || r.audienceName || r.staffGroup) {
      doc.setFont('helvetica', 'bold');
      doc.text('IDENTIFICATION & PERSONNEL:', 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      if (r.auditor) { doc.text(`Clinical Auditor: ${r.auditor}`, 25, y); y += 6; }
      if (r.audienceName) { doc.text(`Personnel Audited: ${r.audienceName}`, 25, y); y += 6; }
      if (r.staffGroup) { doc.text(`Staff Group: ${r.staffGroup}`, 25, y); y += 6; }
      y += 10;
    }

    // Results
    if (isAudit) {
      doc.setFont('helvetica', 'bold');
      const score = Math.max(r.extractedScores.handHygiene, r.extractedScores.ppe, r.extractedScores.environmental, r.extractedScores.equipment);
      doc.text(`TOTAL COMPLIANCE SCORE: ${score}%`, 20, y);
      y += 15;
      
      if (r.checkedItems && r.checkedItems.length > 0) {
        doc.text('COMPLIANT PROTOCOLS VERIFIED:', 20, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        r.checkedItems.forEach(item => {
          doc.text(`• ${item}`, 25, y);
          y += 6;
        });
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text(`ORGANISM DETECTED: ${r.mdroTransmission}`, 20, y);
      y += 15;
    }

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('AI CLINICAL SUMMARY / NOTES:', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(r.summary, 170);
    doc.text(splitSummary, 20, y);
    y += (splitSummary.length * 6) + 10;

    // Embed Image if exists
    if (r.fileData && r.fileMimeType?.startsWith('image/') && r.fileData !== "__STORED_IN_IDB__") {
      try {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text('SOURCE IMAGE ATTACHMENT:', 20, y);
        y += 10;
        doc.addImage(r.fileData, 'JPEG', 20, y, 170, 0); 
      } catch (e) {
        console.error("Image embedding failed", e);
      }
    }

    const filename = `${r.isMdroFinding ? 'MDRO' : 'Audit'}_${r.unitName?.replace(/\s+/g, '_')}_${r.id}.pdf`;
    return { blob: doc.output('blob'), filename };
  };

  const handleDownloadReport = async (report: ClinicalReport) => {
    const { blob, filename } = await createPDFBlob(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareReport = async (e: React.MouseEvent, report: ClinicalReport, platform: 'general' | 'whatsapp' = 'general') => {
    e.preventDefault();
    e.stopPropagation();

    const { blob, filename } = await createPDFBlob(report);
    const file = new File([blob], filename, { type: 'application/pdf' });
    const managerPhone = progress.managerPhone || DESIGNER_PHONE;

    // System share picker is the most reliable way to send an actual PDF file to WhatsApp
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: report.title,
          text: `Official Clinical Report for ${report.unitName}.`
        });
        return;
      } catch (err) {
        console.error("Share failed", err);
      }
    }

    // Fallback: Just trigger download so they have the file, then open WhatsApp
    handleDownloadReport(report);
    
    if (platform === 'whatsapp') {
      const isAudit = !report.isMdroFinding;
      const score = Math.max(report.extractedScores.handHygiene, report.extractedScores.ppe, report.extractedScores.environmental, report.extractedScores.equipment);
      const text = `*ARH-LTC MDRO HUB REPORT EXPORT*\n\nUnit: ${report.unitName}\nResult: ${isAudit ? score + '%' : report.mdroTransmission}\n\nPDF downloaded to terminal. Please attach it to this chat.`;
      const waUrl = `https://wa.me/${managerPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } else {
      alert("Report PDF downloaded. Use your system to share the file manually.");
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setProcessingProgress(20);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        setProcessingProgress(50);
        const fileData = reader.result as string;
        const result = await gemini.analyzeReport(fileData.split(',')[1], file.type);
        
        const newReport: ClinicalReport = {
          id: `ai-${Date.now()}`,
          title: result.isMdroFinding ? `MDRO FINDING: ${result.mdroTransmission}` : `AUDIT: ${result.unitName}`,
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
          auditType: result.auditType as AuditType,
          checkedItems: result.checkedItems,
          staffGroup: result.staffGroup,
          fileData: fileData,
          fileMimeType: file.type
        };
        await storageService.saveReport(newReport);
        
        // Sync to Firebase
        await sendToCloud('reports', newReport);

        setProcessingProgress(100);
        setTimeout(() => setIsProcessing(false), 500);
      };
    } catch (e) {
      setIsProcessing(false);
      alert("Analysis Failed");
    }
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("CRITICAL: Purge this specific clinical record?")) {
      await storageService.deleteReport(id);
      setReports(storageService.getReports());
    }
  };

  const purgeVault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("CRITICAL ACTION: Purge ALL documents in clinical vault? This cannot be undone.")) {
      await storageService.clearAllData();
      setReports([]);
    }
  };

  const filteredReports = allReports.filter(r => 
    (r.title?.toLowerCase() || '').includes(filter.toLowerCase()) || 
    (r.unitName?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  const getReportsByCategory = (catId: CategoryKey) => {
    if (catId === 'mdro-finding') return filteredReports.filter(r => r.isMdroFinding);
    if (catId === 'uncategorized') return filteredReports.filter(r => !r.isMdroFinding && !r.auditType);
    return filteredReports.filter(r => !r.isMdroFinding && r.auditType === catId);
  };

  const activeReports = selectedCategory 
    ? getReportsByCategory(selectedCategory)
    : [];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => selectedCategory ? setSelectedCategory(null) : navigate(-1)} 
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 transition-all hover:bg-blue-600 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em]">
                {selectedCategory 
                  ? `Clinical Vault > ${CATEGORIES.find(c => c.id === selectedCategory)?.label}`
                  : 'Intelligence Repository'}
              </span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
             {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.label : 'Clinical Vault'}
           </h2>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
           {isAdmin && reports.length > 0 && (
             <button type="button" onClick={purgeVault} className="bg-red-600/10 text-red-600 border border-red-600/20 px-6 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all">
                <Trash2 className="w-5 h-5" /> Purge Vault
             </button>
           )}
           <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-900/20">
             <FileUp className="w-5 h-5" /> Upload Report
           </button>
           <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={e => processFile(e.target.files?.[0]!)} className="hidden" />
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Global search..." className={`pl-14 pr-8 py-4 rounded-[2rem] border-none outline-none text-sm font-bold w-full md:w-64 ${isDarkMode ? 'bg-slate-900 ring-1 ring-white/5' : 'bg-slate-100'}`} />
           </div>
        </div>
      </header>

      {isProcessing && (
        <div className="p-20 text-center border-4 border-dashed rounded-[4rem] bg-blue-50/30 dark:bg-blue-900/10 animate-pulse flex flex-col items-center gap-6">
           <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
           <h4 className="text-3xl font-black uppercase text-blue-900 dark:text-blue-400">AI Extraction Active</h4>
           <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${processingProgress}%` }} /></div>
        </div>
      )}

      {!selectedCategory ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {CATEGORIES.map((cat) => {
            const count = getReportsByCategory(cat.id).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`group p-10 rounded-[4rem] border transition-all duration-500 flex flex-col text-left relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 ${count > 0 ? cat.shadowColor : ''} ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}
              >
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none ${cat.color}`}>
                  <Icon className="w-48 h-48" />
                </div>
                
                <div className={`relative w-20 h-20 rounded-[2.2rem] flex items-center justify-center mb-12 shadow-inner border-2 ${cat.accentBorder} bg-gradient-to-br ${cat.bgGradient} transition-transform group-hover:scale-110 duration-500`}>
                   <div className={`absolute inset-0 rounded-[2rem] opacity-20 blur-xl ${cat.color} group-hover:opacity-40 transition-opacity`} />
                   <Icon className={`w-10 h-10 ${cat.color} drop-shadow-sm relative z-10`} />
                </div>
                
                <div className="space-y-1 relative z-10">
                   <h3 className="font-black text-2xl uppercase tracking-tighter leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.label}</h3>
                   <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} Records Indexed</p>
                      {count > 0 && <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500 shadow-glow`} />}
                   </div>
                </div>
                
                <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5 relative z-10">
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Access</span>
                   <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
           <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-500 text-[12px] uppercase tracking-[0.5em] flex items-center gap-4">
                <FileText className="w-6 h-6 opacity-40" /> {activeReports.length} Active Records
              </h3>
              <div className="flex gap-4">
                 <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full">
                  <Plus className="w-4 h-4" /> Add File
                </button>
                <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                  <LayoutGrid className="w-4 h-4" /> Back to Vault
                </button>
              </div>
           </div>

           {activeReports.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {activeReports.map((r) => {
                   const hasSource = r.fileData || r.fileData === "__STORED_IN_IDB__";
                   return (
                  <div key={r.id} className={`p-10 rounded-[4rem] border shadow-sm hover:shadow-2xl transition-all duration-500 group ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-6">
                        <div className={`relative w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-xl border-4 ${r.isMdroFinding ? 'bg-red-600 border-red-500 shadow-red-900/20' : 'bg-emerald-600 border-emerald-500 shadow-emerald-900/20'}`}>
                          {r.isMdroFinding ? <AlertTriangle className="w-10 h-10 text-white" /> : <CheckSquare className="w-10 h-10 text-white" />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-black text-xl uppercase tracking-tighter truncate max-w-xs leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.title}</h4>
                              {r.isCloudRecord && (
                                <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Cloud</span>
                              )}
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5" /> {r.timestamp}
                           </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={(e) => handleDeleteReport(e, r.id)} title="Delete Record" className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>

                    {!r.isMdroFinding && (r.auditor || r.audienceName) && (
                      <div className="mb-8 grid grid-cols-2 gap-4">
                         <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3 text-blue-500" /> Clinical Auditor</p>
                            <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate">{r.auditor || 'Sync AI Agent'}</p>
                         </div>
                         <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5"><UserCheck className="w-3 h-3 text-emerald-500" /> Monitored Staff</p>
                            <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 truncate">{r.audienceName || 'General Care'}</p>
                         </div>
                      </div>
                    )}

                    {r.isMdroFinding ? (
                      <div className="space-y-4 mb-10">
                        <div className="bg-red-50 dark:bg-red-950/40 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-inner">
                           <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-2">Organism Confirmation</p>
                           <p className="text-3xl font-black text-red-700 dark:text-red-400 uppercase tracking-tighter leading-none">{r.mdroTransmission}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 mb-10">
                        <div className="flex items-center justify-between">
                           <div className="flex flex-wrap gap-3">
                             <div className="bg-emerald-50 dark:bg-emerald-950/40 px-6 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30 text-[9px] font-black text-emerald-600 uppercase flex items-center gap-2">
                                <ClipboardCheck className="w-3 h-3" /> {r.auditType?.replace('-', ' ') || 'General Material'}
                             </div>
                             {r.staffGroup && (
                               <div className="bg-blue-50 dark:bg-blue-950/40 px-6 py-2 rounded-full border border-blue-100 dark:border-blue-900/30 text-[9px] font-black text-blue-600 uppercase flex items-center gap-2">
                                 <Users className="w-3 h-3" /> {r.staffGroup}
                               </div>
                             )}
                           </div>
                           <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                              {Math.max(r.extractedScores.handHygiene, r.extractedScores.ppe, r.extractedScores.environmental, r.extractedScores.equipment)}%
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="p-8 rounded-[3rem] border border-blue-50 dark:border-blue-900/20 bg-blue-500/5 mb-8 shadow-inner">
                       <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Summary / Personnel Notes</p>
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">"{r.summary}"</p>
                    </div>

                    <div className="flex flex-col gap-3">
                       <div className="flex gap-3">
                          {hasSource && (
                            <button type="button" onClick={() => openInExternalReader(r)} className="flex-1 bg-slate-900 text-white py-6 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                              <Eye className="w-4 h-4" /> View Original
                            </button>
                          )}
                          <button type="button" onClick={() => handleDownloadReport(r)} className="flex-1 bg-blue-600 text-white py-6 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/10">
                            <FileDown className="w-4 h-4" /> Get PDF
                          </button>
                       </div>
                       <div className="flex gap-3">
                          <button type="button" onClick={(e) => shareReport(e, r, 'general')} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-6 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <Share2 className="w-4 h-4" /> System Share
                          </button>
                          <button type="button" onClick={(e) => shareReport(e, r, 'whatsapp')} className="flex-1 bg-emerald-600 text-white py-6 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-900/20">
                            <MessageSquare className="w-4 h-4" /> Send PDF
                          </button>
                       </div>
                    </div>
                  </div>
                )})}
             </div>
           ) : (
             <div className="py-40 text-center flex flex-col items-center gap-8 bg-slate-50 dark:bg-slate-900/30 rounded-[5rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                <Folder className="w-24 h-24 text-slate-200" />
                <div className="space-y-2">
                   <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-300">Folder Empty</h4>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No intelligence found for this clinical category.</p>
                </div>
                <button onClick={() => setSelectedCategory(null)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">Back to Vault</button>
             </div>
           )}
        </div>
      )}
      
      <footer className={`p-10 rounded-[4rem] border flex flex-col md:flex-row items-center gap-10 ${isDarkMode ? 'bg-blue-900/10 border-blue-500/20 shadow-blue-900/20 shadow-2xl' : 'bg-blue-50 border-blue-100 shadow-xl shadow-blue-100'}`}>
         <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/30"><Database className="w-12 h-12 text-white" /></div>
         <div className="space-y-3 flex-1 text-center md:text-left">
            <h4 className="text-2xl font-black uppercase tracking-tight">Enterprise Intelligence Index</h4>
            <p className="text-xs font-bold text-blue-800/60 dark:text-blue-400/60 leading-relaxed max-w-3xl">
              All documents are automatically indexed using advanced AI meta-tags and observation metadata. Folders represent specific operational streams, ensuring rapid personnel tracking and trend analysis within the ARH-LTC network.
            </p>
         </div>
         <div className="flex items-center gap-3 text-[10px] font-black uppercase text-blue-600 bg-white dark:bg-slate-950 px-8 py-4 rounded-full border border-blue-100 dark:border-blue-900/30 shadow-lg">
            <ShieldAlert className="w-5 h-5 animate-pulse" /> AI INDEXING v2.5 ACTIVE
         </div>
      </footer>
    </div>
  );
};

export default DocsManager;
