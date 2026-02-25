
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Image as ImageIcon,
  Download,
  Building2,
  ShieldCheck,
  Camera,
  FileUp as FileUpIcon,
  CheckCircle
} from 'lucide-react';
import { db, sendToCloud, deleteFromCloud, clearCloudPath } from '../services/firebase';
import { ref, onValue } from "firebase/database";
import { AuditType, ClinicalReport } from '../types';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DESIGNER_PHONE = "966508855131";

type CategoryKey = AuditType | 'mdro-finding' | 'registries' | 'uncategorized';

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
  { id: 'registries', label: 'Visitor Registry', icon: UserCheck, color: 'text-teal-600', bgGradient: 'from-teal-50 to-white dark:from-teal-950/40 dark:to-slate-900', accentBorder: 'border-teal-100 dark:border-teal-900/30', shadowColor: 'shadow-teal-900/10' },
  { id: 'uncategorized', label: 'General / Other', icon: Folder, color: 'text-slate-600', bgGradient: 'from-slate-50 to-white dark:from-slate-800 dark:to-slate-900', accentBorder: 'border-slate-100 dark:border-white/10', shadowColor: 'shadow-slate-900/10' },
];

const DocsManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allReports, setAllReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [filter, setFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [viewingOriginal, setViewingOriginal] = useState(false);
  const [reportWithData, setReportWithData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Read type from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const typeFilter = queryParams.get('type');
    if (typeFilter && CATEGORIES.some(cat => cat.id === typeFilter)) {
      setSelectedCategory(typeFilter as CategoryKey);
    } else {
      setSelectedCategory(null);
    }
  }, [location.search]);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    
    const paths = ['audits', 'reports', 'findings', 'registries'];
    const unsubscribes: (() => void)[] = [];
    const aggregatedData: Record<string, any[]> = {};

    paths.forEach(path => {
      const dataRef = ref(db, path);
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        const pathData: any[] = [];
        
        if (data) {
          Object.keys(data).forEach(key => {
            const entry = data[key];
            if (entry.auditType || entry.timestamp || entry.id) {
              pathData.push({ id: key, ...entry, sourcePath: path });
            } else if (typeof entry === 'object') {
              Object.keys(entry).forEach(subKey => {
                pathData.push({ id: subKey, ...entry[subKey], auditType: key, sourcePath: path });
              });
            }
          });
        }
        
        aggregatedData[path] = pathData;
        const allCombined = Object.values(aggregatedData).flat();
        setAllReports(allCombined);
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleOpenReport = async (report: any) => {
    setIsProcessing(true);
    try {
      const fullData = await storageService.getReportWithData(report.id);
      if (fullData) {
        setReportWithData(fullData);
        setSelectedReport(report);
      } else {
        // If not in local storage, it might be a cloud-only record or just metadata
        setSelectedReport(report);
        setReportWithData(report);
      }
    } catch (err) {
      console.error("Failed to load report data", err);
      setSelectedReport(report);
    }
    setIsProcessing(false);
  };

  const handleDeleteReport = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    const reportToDelete = allReports.find(r => r.id === id);
    if (!reportToDelete) return;

    if (window.confirm("CRITICAL: Purge this clinical record from vault?")) {
      // 1. Delete from Firebase if it has a source path
      if (reportToDelete.sourcePath) {
        await deleteFromCloud(reportToDelete.sourcePath, id);
      }
      
      // 2. Delete locally
      await storageService.deleteReport(id);
      
      setAllReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
        setReportWithData(null);
      }
      showToast("Record Purged");
    }
  };

  const handleClearAll = async () => {
    if (!isAdmin) return;
    const confirmMsg = selectedCategory 
      ? `CRITICAL: Purge ALL records in ${selectedCategory}?`
      : "CRITICAL: Purge ALL clinical records in the vault?";
      
    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      try {
        if (selectedCategory) {
          // Clear specific category
          const reportsToClear = allReports.filter(r => r.auditType === selectedCategory || r.sourcePath === selectedCategory);
          await Promise.all(reportsToClear.map(r => deleteFromCloud(r.sourcePath || 'reports', r.id)));
          // Also clear locally
          for (const r of reportsToClear) {
            await storageService.deleteReport(r.id);
          }
        } else {
          // Clear everything
          const paths = ['audits', 'reports', 'findings', 'registries'];
          await Promise.all(paths.map(path => clearCloudPath(path)));
          await storageService.clearAllData();
        }
        showToast("Vault Purged Successfully");
      } catch (e) {
        console.error("Purge failed", e);
        showToast("Purge Failed");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadReport = async (report: any) => {
    const doc = new jsPDF();
    const isAudit = !report.isMdroFinding;
    const dataToUse = reportWithData?.id === report.id ? reportWithData : report;
    
    const auditTypeLabel = report.auditType?.replace('-', ' ').toUpperCase() || 'CLINICAL';
    const reportTitle = isAudit ? `${auditTypeLabel} AUDIT: ${report.unitName || report.department || 'N/A'}` : `MDRO FINDING: ${report.mdroTransmission}`;

    // Header Section
    doc.setFillColor(21, 128, 61); // Emerald 700
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("ARH-LTC", 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("OFFICIAL CLINICAL AUDIT REPORT", 20, 30);

    // Main Title
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 20, 60);

    // Basic Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Date: ${report.reportDate || report.timestamp?.split(',')[0] || 'N/A'}`, 20, 70);
    doc.text(`Unit/Ward: ${report.unitName || report.department || 'N/A'}`, 20, 77);

    // Identification & Personnel Section
    doc.setFont('helvetica', 'bold');
    doc.text("IDENTIFICATION & PERSONNEL:", 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(`Clinical Auditor: ${report.auditor || 'N/A'}`, 25, 97);
    doc.text(`Personnel Audited: ${report.audienceName || 'No name'}`, 25, 104);
    doc.text(`Staff Group: ${report.staffGroup || 'N/A'}`, 25, 111);

    // Score Section
    const score = report.totalScore || report.score || 0;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL COMPLIANCE SCORE: ${score}%`, 20, 125);

    // Protocols Section
    if (report.checkedItems && report.checkedItems.length > 0) {
      doc.text("COMPLIANT PROTOCOLS VERIFIED:", 20, 135);
      doc.setFont('helvetica', 'normal');
      let yPos = 142;
      report.checkedItems.forEach((item: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${item}`, 25, yPos);
        yPos += 7;
      });
    }

    // AI Summary Section
    let summaryY = (report.checkedItems?.length || 0) * 7 + 150;
    if (summaryY > 260) {
      doc.addPage();
      summaryY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text("AI CLINICAL SUMMARY / NOTES:", 20, summaryY);
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(report.summary || "No clinical summary available.", 170);
    doc.text(splitSummary, 20, summaryY + 7);

    // Original Image Page
    if (dataToUse.fileData && dataToUse.fileData !== "__STORED_IN_IDB__") {
      try {
        doc.addPage();
        doc.setFillColor(21, 128, 61);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("ORIGINAL CLINICAL EVIDENCE ATTACHMENT", 105, 12, { align: 'center' });
        
        doc.addImage(dataToUse.fileData, 'JPEG', 10, 30, 190, 0);
      } catch (e) {
        console.error("Could not add image to PDF", e);
      }
    }

    // Footer on all pages would be complex with jsPDF, so just on last
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("This is an electronically generated clinical document from ARH-LTC MDRO Hub.", 105, 285, { align: 'center' });
    }

    const safeTitle = reportTitle.replace(/[:/\\?%*|"<>]/g, '').replace(/\s+/g, '_');
    doc.save(`${safeTitle}_${Date.now()}.pdf`);
    showToast("Report Downloaded");
  };

  const handleShareReport = async (report: any, platform: 'whatsapp' | 'system') => {
    const isAudit = !report.isMdroFinding;
    const score = report.totalScore || report.score || 0;
    const appUrl = window.location.origin;
    
    const text = `*ARH-LTC MDRO HUB REPORT*\n\nUnit: ${report.unitName || report.department}\nType: ${isAudit ? 'Audit' : 'MDRO Finding'}\nResult: ${isAudit ? score + '%' : report.mdroTransmission}\nDate: ${report.timestamp}\n\nPortal: ${appUrl}`;
    
    if (platform === 'whatsapp') {
      const waUrl = `https://wa.me/${DESIGNER_PHONE}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'ARH-LTC Report',
          text: text,
          url: appUrl
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setProcessingProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setProcessingProgress(30);
        
        try {
          const analysis = await gemini.analyzeReport(base64, file.type);
          setProcessingProgress(70);
          
          const newReport: ClinicalReport = {
            id: `rep_${Date.now()}`,
            title: analysis.isMdroFinding ? `MDRO Alert: ${analysis.mdroTransmission}` : `Audit: ${analysis.unitName}`,
            unitName: analysis.unitName,
            timestamp: new Date().toLocaleString(),
            analysisDate: new Date().toISOString(),
            summary: analysis.summary,
            isMdroFinding: analysis.isMdroFinding,
            mdroTransmission: analysis.mdroTransmission,
            auditType: selectedCategory || analysis.auditType || 'uncategorized',
            status: 'analyzed',
            fileData: `data:${file.type};base64,${base64}`,
            fileMimeType: file.type,
            extractedScores: {
              handHygiene: analysis.handHygiene,
              ppe: analysis.ppe,
              environmental: analysis.environmental,
              equipment: analysis.equipment
            },
            totalScore: Math.round((analysis.handHygiene + analysis.ppe + analysis.environmental + analysis.equipment) / 4),
            auditor: analysis.auditor || "N/A",
            audienceName: analysis.audienceName || "N/A",
            staffGroup: analysis.staffGroup || "N/A",
            checkedItems: analysis.checkedItems
          };

          // Save locally
          await storageService.saveReport(newReport);
          
          // Sync to cloud
          const cloudPath = newReport.isMdroFinding ? 'findings' : 'audits';
          await sendToCloud(cloudPath, newReport);
          
          setProcessingProgress(100);
          showToast("Report Analyzed & Saved");
          setTimeout(() => setIsProcessing(false), 1000);
        } catch (err) {
          console.error("Analysis failed", err);
          alert("Clinical analysis failed. Please ensure the document is legible.");
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading failed", err);
      setIsProcessing(false);
    }
  };

  const filteredReports = allReports.filter(r => {
    const matchesCategory = selectedCategory 
      ? (r.auditType === selectedCategory || r.sourcePath === selectedCategory)
      : true;
    
    const searchStr = filter.toLowerCase();
    const matchesSearch = !filter || 
      (r.unitName?.toLowerCase().includes(searchStr)) || 
      (r.department?.toLowerCase().includes(searchStr)) ||
      (r.mdroTransmission?.toLowerCase().includes(searchStr));

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.timestamp || 0).getTime();
    const dateB = new Date(b.timestamp || 0).getTime();
    return dateB - dateA;
  });

  const getCategoryCount = (catId: CategoryKey) => {
    return allReports.filter(r => r.auditType === catId || r.sourcePath === catId).length;
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-bold gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="uppercase tracking-widest text-[10px]">Accessing Secure Vault...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 animate-in fade-in duration-500 pb-24">
      
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
          <div className="bg-blue-600/20 p-10 rounded-[4rem] border border-blue-500/30 flex flex-col items-center gap-8 animate-pulse">
            <div className="bg-white p-6 rounded-full shadow-2xl">
              <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-black uppercase tracking-tighter text-white">Analyzing Intelligence...</h4>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Gemini Clinical Engine Active</p>
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${processingProgress}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
          {selectedCategory ? (
            <button 
              onClick={() => navigate('/docs')} 
              className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-white transition-all active:scale-95 shadow-xl border border-white/5"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="bg-blue-600 p-5 rounded-[2rem] shadow-2xl shadow-blue-900/30">
              <Database className="w-10 h-10 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.label : 'Clinical Vault'}
            </h2>
            <p className="text-slate-400 font-bold text-xs md:text-sm mt-2 tracking-widest uppercase">
              {selectedCategory ? 'Category Archives' : 'Enterprise Intelligence Repository'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {isAdmin && (allReports.length > 0 || (selectedCategory && getCategoryCount(selectedCategory) > 0)) && (
            <button 
              onClick={handleClearAll}
              className="flex-1 sm:flex-none bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-red-600/20 shadow-xl"
            >
              <Trash2 className="w-4 h-4" /> {selectedCategory ? 'Clear Category' : 'Clear All Vault'}
            </button>
          )}
          {selectedCategory && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                <FileUpIcon className="w-4 h-4" /> Upload
              </button>
              <button 
                onClick={() => cameraInputRef.current?.click()} 
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all border border-white/5"
              >
                <Camera className="w-4 h-4" /> Scan
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={(e) => processFile(e.target.files?.[0]!)} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => processFile(e.target.files?.[0]!)} className="hidden" />
            </div>
          )}
          <div className="relative group flex-1 lg:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
              placeholder="Search records..." 
              className="w-full pl-14 pr-6 py-5 bg-slate-900/50 border border-white/5 rounded-[2rem] text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
      </header>

      {!selectedCategory ? (
        /* Category Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/docs?type=${cat.id}`)}
                className={`group relative p-10 rounded-[4rem] border transition-all duration-500 text-left overflow-hidden hover:shadow-2xl hover:-translate-y-2 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10 space-y-8">
                  <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center ${cat.color} bg-slate-950/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <cat.icon className="w-10 h-10" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {cat.label}
                    </h3>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="px-4 py-1.5 bg-slate-950/20 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        {count} Records
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* File List View */
        <div className="space-y-6">
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  onClick={() => handleOpenReport(report)}
                  className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-8 rounded-[2.5rem] flex justify-between items-center group hover:border-blue-500/30 transition-all duration-500 shadow-xl cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <h4 className="text-white font-black uppercase text-sm tracking-tight truncate max-w-[180px]">
                        {report.department || report.unitName || 'General Unit'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
                      <Clock className="w-3.5 h-3.5" />
                      {report.timestamp}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Score: {report.extractedScores?.handHygiene ?? report.totalScore ?? 0}%
                      </div>
                      {report.mdroTransmission && (
                        <div className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                          {report.mdroTransmission}
                        </div>
                      )}
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="p-4 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-lg"
                        title="Delete Report"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleShareReport(report, 'whatsapp'); }}
                        className="p-4 bg-emerald-600/20 text-emerald-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90 shadow-lg"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadReport(report); }}
                        className="p-4 bg-slate-800 rounded-2xl text-white hover:bg-blue-600 transition-all active:scale-90 shadow-lg group-hover:shadow-blue-900/20"
                        title="Download PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center flex flex-col items-center gap-6 bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-white/5">
              <FileText className="w-16 h-16 text-slate-800" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No clinical records found in this category</p>
              <button onClick={() => navigate('/docs')} className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Back to Categories</button>
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${selectedReport.isMdroFinding ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {selectedReport.isMdroFinding ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white leading-tight">
                    {selectedReport.title || (selectedReport.isMdroFinding ? 'MDRO Alert' : 'Audit Report')}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedReport.timestamp}</p>
                    {selectedReport.sourcePath === 'cloud' && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black rounded uppercase">Cloud</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedReport(null); setViewingOriginal(false); setReportWithData(null); }}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              
              {viewingOriginal && reportWithData?.fileData ? (
                <div className="rounded-3xl overflow-hidden border border-white/10 bg-black flex items-center justify-center min-h-[300px]">
                  {reportWithData.fileMimeType?.includes('pdf') ? (
                    <div className="p-10 text-center space-y-4">
                      <FileText className="w-16 h-16 text-blue-500 mx-auto" />
                      <p className="text-white font-bold uppercase text-xs">PDF Document Preview Not Available</p>
                      <button onClick={() => handleDownloadReport(selectedReport)} className="text-blue-500 underline text-[10px] font-bold uppercase">Download to View</button>
                    </div>
                  ) : (
                    <img 
                      src={reportWithData.fileData} 
                      alt="Original Document" 
                      className="max-w-full h-auto"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Organism / Result Section */}
                  <div className={`p-8 rounded-[2rem] border ${selectedReport.isMdroFinding ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-3 ${selectedReport.isMdroFinding ? 'text-red-500' : 'text-emerald-500'}`}>
                      {selectedReport.isMdroFinding ? 'Organism Confirmation' : 'Compliance Result'}
                    </p>
                    <h4 className={`text-2xl md:text-4xl font-black uppercase tracking-tighter ${selectedReport.isMdroFinding ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedReport.isMdroFinding ? selectedReport.mdroTransmission : `${selectedReport.totalScore || selectedReport.score}% Compliance`}
                    </h4>
                  </div>

                  {/* Summary Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Sparkles className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">AI Summary / Personnel Notes</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-slate-800/50 border border-white/5 italic text-slate-300 text-sm leading-relaxed">
                      "{selectedReport.summary || 'No clinical summary available for this record.'}"
                    </div>
                  </div>

                  {/* Scores Grid if Audit */}
                  {!selectedReport.isMdroFinding && selectedReport.extractedScores && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedReport.auditType === 'hand-hygiene' ? (
                        <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 col-span-full">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Hand Hygiene Compliance</p>
                          <p className="text-4xl font-black text-blue-600">{selectedReport.extractedScores.handHygiene || selectedReport.totalScore || selectedReport.score}%</p>
                        </div>
                      ) : selectedReport.auditType === 'ppe-compliance' ? (
                        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 col-span-full">
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">PPE Compliance Score</p>
                          <p className="text-4xl font-black text-emerald-600">{selectedReport.extractedScores.ppe || selectedReport.totalScore || selectedReport.score}%</p>
                        </div>
                      ) : selectedReport.auditType === 'environmental' ? (
                        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 col-span-full">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Environmental Score</p>
                          <p className="text-4xl font-black text-amber-600">{selectedReport.extractedScores.environmental || selectedReport.totalScore || selectedReport.score}%</p>
                        </div>
                      ) : selectedReport.auditType === 'equipment' ? (
                        <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 col-span-full">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Equipment Care Score</p>
                          <p className="text-4xl font-black text-indigo-600">{selectedReport.extractedScores.equipment || selectedReport.totalScore || selectedReport.score}%</p>
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/5 col-span-full">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Compliance Score</p>
                          <p className="text-4xl font-black text-white">{selectedReport.totalScore || selectedReport.score}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-8 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm grid grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setViewingOriginal(!viewingOriginal)}
                disabled={!reportWithData?.fileData}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${viewingOriginal ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50'}`}
              >
                <Eye className="w-4 h-4" /> {viewingOriginal ? 'Show Details' : 'View Original'}
              </button>
              <button 
                onClick={() => handleDownloadReport(selectedReport)}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Get PDF
              </button>
              <button 
                onClick={() => handleShareReport(selectedReport, 'system')}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" /> System Share
              </button>
              <button 
                onClick={() => handleShareReport(selectedReport, 'whatsapp')}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> Send PDF
              </button>
              <button 
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-600/20 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> Purge Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status */}
      <footer className="mt-20 p-8 rounded-[3rem] bg-blue-900/10 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
            Clinical Intelligence Node v2.5 - Secure Transmission Active
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Intelligence</p>
            <p className="text-xl font-black text-white">{allReports.length}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Nodes</p>
            <p className="text-xl font-black text-emerald-500">4/4</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocsManager;
