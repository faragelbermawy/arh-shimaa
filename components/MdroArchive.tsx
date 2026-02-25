
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Trash2, 
  Search,
  Database,
  Sparkles,
  RefreshCw,
  FileUp,
  CheckCircle,
  Clock,
  Download,
  Send,
  History,
  AlertTriangle,
  Calendar,
  Dna,
  ArrowLeft,
  FileDown,
  Share2,
  Eye,
  MessageSquare
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { sendToCloud } from '../services/firebase';
import { ClinicalReport, UserProgress } from '../types';
import { jsPDF } from 'jspdf';

const DESIGNER_PHONE = "966508855131";

const MdroArchive: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [progress, setProgress] = useState<UserProgress>(storageService.getProgress());
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const interval = setInterval(loadAllData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = () => {
    const all = storageService.getReports();
    setReports(all.filter(r => r.isMdroFinding));
    setProgress(storageService.getProgress());
  };

  const showLocalToast = (msg: string) => {
    setToast({ message: msg, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const openInExternalReader = async (file: ClinicalReport) => {
    const fullReport = await storageService.getReportWithData(file.id);
    if (!fullReport || !fullReport.fileData) {
      alert("No original image source available for this finding.");
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
      const blob = new Blob([u8arr], { type: fullReport.fileMimeType || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (e) {
      alert("Error opening source file.");
    }
  };

  const createPDFBlob = async (report: ClinicalReport): Promise<{ blob: Blob, filename: string }> => {
    const fullReport = await storageService.getReportWithData(report.id);
    const r = fullReport || report;

    const doc = new jsPDF();
    doc.setFillColor(185, 28, 28); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ARH-LTC', 20, 20);
    doc.setFontSize(10);
    doc.text('MDRO LABORATORY FINDING REPORT', 20, 30);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.text(r.title.toUpperCase(), 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Finding Date: ${r.reportDate || 'N/A'}`, 20, 65);
    doc.text(`Unit/Ward: ${r.unitName || 'Unspecified'}`, 20, 72);
    doc.text(`Recorded On: ${r.timestamp}`, 20, 79);

    doc.setFont('helvetica', 'bold');
    doc.text(`ORGANISM IDENTIFIED: ${r.mdroTransmission}`, 20, 95);

    doc.text('AI EXECUTIVE TAKEAWAY:', 20, 115);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(r.summary, 170);
    doc.text(splitSummary, 20, 123);
    
    let y = 130 + (splitSummary.length * 6);

    if (r.fileData && r.fileMimeType?.startsWith('image/') && r.fileData !== "__STORED_IN_IDB__") {
      try {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text('SOURCE LAB EVIDENCE:', 20, y);
        y += 10;
        doc.addImage(r.fileData, 'JPEG', 20, y, 170, 0);
      } catch (e) {
        console.error("Image embedding failed", e);
      }
    }

    const filename = `MDRO_Finding_${r.mdroTransmission?.replace(/\s+/g, '_')}_${r.id}.pdf`;
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

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `MDRO ALERT: ${report.mdroTransmission}`,
          text: `Immediate Laboratory Finding in ${report.unitName}.`
        });
        return;
      } catch (err) {
        console.error("Native share failed", err);
      }
    }

    // Fallback logic
    handleDownloadReport(report);
    
    if (platform === 'whatsapp') {
      const appUrl = 'https://arh-ltc-mdro-hub-314466822792.us-west1.run.app/';
      const text = `*MDRO ALERT - ARH-LTC*\n\nOrganism: ${report.mdroTransmission}\nUnit: ${report.unitName}\n\nPDF report downloaded to terminal. Please attach it to this message manually.\n\nPortal: ${appUrl}`;
      const waUrl = `https://wa.me/${managerPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } else {
      alert("PDF downloaded. Use system tools to share manually.");
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setProcessingProgress(10);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        setProcessingProgress(40);
        const fileData = reader.result as string;
        const result = await gemini.analyzeReport(fileData.split(',')[1], file.type);
        setProcessingProgress(90);
        const newReport: ClinicalReport = {
          id: `mdro-find-${Date.now()}`,
          title: `MDRO FINDING: ${result.mdroTransmission}`,
          unitName: result.unitName || "Unspecified Unit",
          reportDate: result.reportDate || "Unknown Date",
          mdroTransmission: result.mdroTransmission || "Unknown Organism",
          timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          analysisDate: new Date().toISOString(),
          extractedScores: { handHygiene: 0, ppe: 0, environmental: 0, equipment: 0 },
          summary: result.summary || "Laboratory confirmed MDRO transmission finding.",
          status: 'analyzed',
          isMdroFinding: true,
          checkedItems: result.checkedItems,
          fileData: fileData,
          fileMimeType: file.type
        };
        storageService.saveReport(newReport);
        
        // Sync to Firebase
        await sendToCloud('findings', newReport);

        // Sync to Google Sheets
        syncService.sendToGoogleSheets({
          type: 'mdro_finding',
          ...newReport
        });

        setProcessingProgress(100);
        setTimeout(() => { setIsProcessing(false); showLocalToast("Finding Logged Successfully"); }, 500);
      };
    } catch (err) {
      setIsProcessing(false);
      alert("Analysis Failed. Please try again.");
    }
  };

  const deleteFinding = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("CRITICAL: Purge this MDRO finding from archive?")) {
      storageService.deleteReport(id);
      loadAllData();
      showLocalToast("Record Purged");
    }
  };

  const filtered = reports.filter(r => 
    (r.mdroTransmission?.toLowerCase() || '').includes(filter.toLowerCase()) || 
    (r.unitName?.toLowerCase() || '').includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
           <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors group cursor-pointer">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span>
           </button>
           <div className="flex items-center gap-5">
              <div className="bg-red-600 p-5 rounded-[2rem] shadow-2xl shadow-red-900/30"><Dna className="w-10 h-10 text-white" /></div>
              <div>
                 <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">MDRO Findings</h2>
                 <p className="text-slate-400 font-bold text-sm md:text-lg mt-2 tracking-tight">Active Transmission Tracking Archive</p>
              </div>
           </div>
        </div>
        <div className="flex flex-wrap gap-4">
           <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-red-600 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 cursor-pointer"><FileUp className="w-5 h-5" /> Upload Report</button>
           <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 cursor-pointer"><Camera className="w-5 h-5" /> Scan Finding</button>
           <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files?.[0]!)} className="hidden" />
           <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => processFile(e.target.files?.[0]!)} className="hidden" />
        </div>
      </header>

      {isProcessing ? (
        <div className="p-20 rounded-[4rem] text-center border-4 border-dashed border-red-100 bg-red-50/30 flex flex-col items-center gap-8 animate-pulse">
           <div className="bg-white p-10 rounded-full shadow-2xl"><RefreshCw className="w-12 h-12 text-red-600 animate-spin" /></div>
           <h4 className="text-3xl font-black uppercase tracking-tighter text-red-900">Analyzing Clinical Data...</h4>
           <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-red-600" style={{ width: `${processingProgress}%` }} /></div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-500 text-[12px] uppercase tracking-[0.4em] flex items-center gap-4"><History className="w-5 h-5 opacity-40" /> Archive Stream</h3>
              <div className="relative group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search organism..." className={`pl-14 pr-8 py-5 rounded-[2rem] border-none outline-none text-sm font-bold w-full md:w-80 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`} />
              </div>
           </div>

           {filtered.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((r) => {
                   const hasSource = r.fileData || r.fileData === "__STORED_IN_IDB__";
                   return (
                  <div key={r.id} className="p-10 rounded-[4rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Dna className="w-32 h-32 text-red-600" /></div>
                    <div className="flex justify-between items-start mb-8 relative z-10">
                       <div className="bg-red-600 p-4 rounded-3xl shadow-xl"><AlertTriangle className="w-6 h-6 text-white" /></div>
                       <button type="button" onClick={(e) => deleteFinding(e, r.id)} className="p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer z-20"><Trash2 className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-6 relative z-10">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Dna className="w-3 h-3" /> Organism Kind</p>
                          <h4 className="text-3xl font-black text-red-600 uppercase tracking-tighter">{r.mdroTransmission}</h4>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Unit</p><p className="text-sm font-black uppercase">{r.unitName}</p></div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Found On</p><p className="text-sm font-black uppercase">{r.reportDate}</p></div>
                       </div>
                       <div className="pt-6 border-t border-slate-50 dark:border-white/5 mb-6">
                          <p className="text-[10px] font-black text-amber-600 uppercase mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Insight</p>
                          <p className="text-xs font-bold text-slate-500 italic">"{r.summary}"</p>
                       </div>
                       <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                           {hasSource && (
                             <button type="button" onClick={() => openInExternalReader(r)} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer">
                               <Eye className="w-4 h-4" /> View
                             </button>
                           )}
                           <button type="button" onClick={() => handleDownloadReport(r)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer">
                             <FileDown className="w-4 h-4" /> PDF
                           </button>
                        </div>
                        <div className="flex gap-3">
                           <button type="button" onClick={(e) => shareReport(e, r, 'general')} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
                             <Share2 className="w-4 h-4" /> Share
                           </button>
                           <button type="button" onClick={(e) => shareReport(e, r, 'whatsapp')} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/10 cursor-pointer">
                             <MessageSquare className="w-4 h-4" /> Send PDF
                           </button>
                        </div>
                       </div>
                    </div>
                  </div>
                )})}
             </div>
           ) : (
             <div className="py-40 text-center flex flex-col items-center gap-8 bg-slate-50 dark:bg-slate-900/30 rounded-[5rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                <Database className="w-20 h-20 text-slate-200" />
                <div className="space-y-2">
                   <h4 className="text-3xl font-black uppercase tracking-tighter text-amber-300">Archive Empty</h4>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upload a MDRO report to begin tracking.</p>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default MdroArchive;
