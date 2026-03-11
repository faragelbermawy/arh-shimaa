
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
  CheckCircle,
  Edit,
  Edit2
} from 'lucide-react';
import { db, sendToCloud, deleteFromCloud, clearCloudPath } from '../services/firebase';
import { ref, onValue } from "firebase/database";
import { AuditType, ClinicalReport } from '../types';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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
  const [isAdmin, setIsAdmin] = useState(true); // Default to true for full control
  const [isDesigner, setIsDesigner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  
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
    setIsDesigner(sessionStorage.getItem('is_designer_active') === 'true');
    
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
        
        // Robust deduplication across all paths
        const dedupeMap = new Map();
        const mdroSeen = new Set();
        
        Object.values(aggregatedData).flat().forEach(item => {
          if (!item.id) return;
          
          // Special deduplication for MDRO findings by content
          const isMdro = item.isMdroFinding || item.sourcePath === 'findings' || item.auditType === 'mdro-finding';
          if (isMdro) {
            // Filter out results without a valid date
            if (!item.reportDate || item.reportDate === "Unknown Date" || item.reportDate.trim() === "") {
              return;
            }
            
            const contentKey = `${item.unitName?.toLowerCase()}-${item.mdroTransmission?.toLowerCase()}-${item.reportDate}`;
            if (mdroSeen.has(contentKey)) return;
            mdroSeen.add(contentKey);
          }
          
          dedupeMap.set(item.id, item);
        });
        
        const allCombined = Array.from(dedupeMap.values());
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
    setIsEditing(false);
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
      e.preventDefault();
      e.stopPropagation();
    }
    
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput !== designerCode) {
      if (userInput !== null) alert("Unauthorized! Only the Designer can delete records.");
      return;
    }

    // Find the report to get its source path
    const reportToDelete = allReports.find(r => r.id === id);
    
    setIsProcessing(true);
    try {
      // 1. Try to delete from cloud using known source path
      if (reportToDelete?.sourcePath) {
        let deletePath = reportToDelete.sourcePath;
        if (deletePath === 'audits' && reportToDelete.auditType) {
          deletePath = `audits/${reportToDelete.auditType}`;
        }
        await deleteFromCloud(deletePath, id);
      }

      // 2. Aggressive Cloud Cleanup: Try all possible paths just in case
      const possiblePaths = [
        'findings', 
        'reports', 
        'audits/hand-hygiene', 
        'audits/ppe-compliance', 
        'audits/environmental', 
        'audits/equipment', 
        'audits/isolation', 
        'audits/visitors', 
        'audits/education'
      ];
      
      // Run deletions in parallel for speed
      await Promise.all(possiblePaths.map(path => deleteFromCloud(path, id)));

      // 3. Delete locally
      await storageService.deleteReport(id);
      
      // 4. Update UI state immediately
      setAllReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
        setReportWithData(null);
        setIsEditing(false);
      }
      
      showToast("Record Permanently Deleted");
    } catch (err) {
      console.error("Force deletion failed", err);
      showToast("Error during deletion");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput !== designerCode) {
      if (userInput !== null) alert("Unauthorized! Only the Designer can purge the vault.");
      return;
    }

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
    const splitSummary = doc.splitTextToSize(report.summary || report.notes || "No clinical summary available.", 170);
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

  const exportAllToExcel = () => {
    if (allReports.length === 0) {
      showToast("No data to export.");
      return;
    }

    // Format data for Excel
    const data = allReports.map(r => ({
      'ID': r.id,
      'Category': CATEGORIES.find(c => c.id === (r.auditType || r.sourcePath))?.label || r.auditType || 'Uncategorized',
      'Unit/Department': r.unitName || r.department || 'N/A',
      'Auditor': r.auditor || 'N/A',
      'Personnel Audited': r.audienceName || 'N/A',
      'Staff Group': r.staffGroup || 'N/A',
      'Score %': r.totalScore || r.score || 0,
      'Result/Finding': r.isMdroFinding ? r.mdroTransmission : 'Audit',
      'Timestamp': r.timestamp,
      'Summary/Notes': r.summary || r.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clinical Vault Data");

    // Fix column widths
    const wscols = [
      {wch: 25}, // ID
      {wch: 20}, // Category
      {wch: 25}, // Unit
      {wch: 20}, // Auditor
      {wch: 20}, // Personnel
      {wch: 20}, // Staff Group
      {wch: 15}, // Score
      {wch: 25}, // Result
      {wch: 25}, // Timestamp
      {wch: 60}  // Summary
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Clinical_Vault_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Excel Export Successful");
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
            reportDate: analysis.reportDate || "Unknown Date",
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

          // Check for duplicates if it's an MDRO finding
          if (newReport.isMdroFinding) {
            const existing = storageService.getReports().find(r => 
              r.isMdroFinding && 
              r.unitName?.toLowerCase() === newReport.unitName?.toLowerCase() &&
              r.mdroTransmission?.toLowerCase() === newReport.mdroTransmission?.toLowerCase() &&
              r.reportDate === newReport.reportDate
            );

            if (existing) {
              setIsProcessing(false);
              showToast("Duplicate Finding Detected - Skipping");
              return;
            }
          }

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

  const handleEditReport = (report: any) => {
    setEditData({ ...report });
    setSelectedReport(report);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setIsProcessing(true);
    try {
      // 1. Update locally
      if (editData.isMdroFinding) {
        await storageService.updateReport(editData);
      } else {
        // It's an audit
        storageService.updateAudit(editData);
        // Also update the corresponding report in vault if it exists
        const reports = storageService.getReports();
        const vaultReport = reports.find(r => r.id === `audit-${editData.id}` || r.id === editData.id);
        if (vaultReport) {
          const updatedVault = {
            ...vaultReport,
            unitName: editData.department || editData.unitName,
            auditor: editData.auditor,
            audienceName: editData.audienceName,
            staffGroup: editData.staffGroup,
            summary: editData.notes || editData.summary,
            totalScore: editData.totalScore || editData.score
          };
          await storageService.updateReport(updatedVault);
        }
      }

      // 2. Update cloud
      const cloudPath = editData.isMdroFinding ? 'findings' : `audits/${editData.auditType || 'general'}`;
      await sendToCloud(cloudPath, editData);

      showToast("Record Updated Successfully");
      setIsEditing(false);
      setEditData(null);
      setSelectedReport(null);
    } catch (err) {
      console.error("Update failed", err);
      showToast("Update Failed");
    } finally {
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

  const getCategoryCompliance = (catId: CategoryKey) => {
    const reports = allReports.filter(r => r.auditType === catId || r.sourcePath === catId);
    const validReports = reports.filter(r => (r.totalScore !== undefined || r.score !== undefined));
    if (validReports.length === 0) return null;
    
    const sum = validReports.reduce((acc, r) => acc + (r.totalScore || r.score || 0), 0);
    return Math.round(sum / validReports.length);
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
          {isDesigner && (allReports.length > 0 || (selectedCategory && getCategoryCount(selectedCategory) > 0)) && (
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
            const compliance = getCategoryCompliance(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/docs?type=${cat.id}`)}
                className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group text-left relative overflow-hidden"
              >
                {/* خلفية الأيقونة الدائرية */}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-700/50 group-hover:scale-110 transition-transform duration-500 ${cat.color}`}>
                  <cat.icon size={40} />
                </div>

                {/* النصوص الثابتة */}
                <h3 className="text-gray-900 dark:text-gray-100 font-black text-2xl mb-2 uppercase tracking-tighter">
                  {cat.label}
                </h3>
                
                <div className="flex justify-between items-end">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest">
                    {count} RECORDS
                  </p>
                  {compliance !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">Compliance</span>
                      <span className={`text-2xl font-black ${compliance >= 90 ? 'text-emerald-500' : compliance >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                        {compliance}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Decorative Gradient on Hover */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${cat.bgGradient}`} />
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
                    className="relative bg-slate-900/50 backdrop-blur-sm border border-white/5 p-8 pr-32 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-blue-500/30 transition-all duration-500 shadow-xl"
                  >
                    <div 
                      className="flex-1 space-y-3 cursor-pointer w-full"
                      onClick={() => handleOpenReport(report)}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <h4 className="text-white font-black uppercase text-sm tracking-tight truncate max-w-[180px]">
                          {report.department || report.unitName || 'General Unit'}
                          <span className="ml-2 text-[10px] text-slate-300 lowercase font-bold">by {report.auditor || 'N/A'}</span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
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
                    
                    {/* --- بداية كود تنسيق الأزرار الجديد --- */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-2 p-2 bg-gray-900/50 rounded-xl shadow-inner border border-white/5">
                      
                      {/* الزر 1: المعاينة (View) */}
                      <button 
                        onClick={() => handleOpenReport(report)}
                        className="p-3 bg-gray-800 rounded-lg text-amber-400 hover:bg-amber-500 hover:text-white transition-all active:scale-90"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                      
                      {/* الزر 2: التعديل (Edit) */}
                      <button 
                        onClick={() => handleEditReport(report)}
                        className="p-3 bg-blue-900/60 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all active:scale-90"
                        title="Edit Report"
                      >
                        <Edit2 size={20} />
                      </button>
                      
                      {/* الزر 3: المسح (Delete) */}
                      {isDesigner && (
                        <button 
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-3 bg-red-950/80 rounded-lg text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                          title="Delete Report"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                      
                      {/* الزر 4: المشاركة/التنزيل (Share/Download) */}
                      <button 
                        onClick={() => handleShareReport(report, 'whatsapp')}
                        className="p-3 bg-gray-800 rounded-lg text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                        title="Share Report"
                      >
                        <Share2 size={20} />
                      </button>

                    </div>
                    {/* --- نهاية كود التنسيق --- */}
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

      {/* Export All Button */}
      {allReports.length > 0 && (
        <div className="mt-12 flex justify-center">
           <button 
             type="button" 
             onClick={exportAllToExcel}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest flex items-center gap-4 shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer group"
           >
              <FileDown className="w-6 h-6 group-hover:bounce" />
              Export All Vault to Excel
           </button>
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
              
              {isEditing ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit / Department</label>
                      <input 
                        value={editData.unitName || editData.department || ''} 
                        onChange={e => setEditData({...editData, unitName: e.target.value, department: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Auditor Name</label>
                      <input 
                        value={editData.auditor || ''} 
                        onChange={e => setEditData({...editData, auditor: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personnel Audited</label>
                      <input 
                        value={editData.audienceName || ''} 
                        onChange={e => setEditData({...editData, audienceName: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Group</label>
                      <input 
                        value={editData.staffGroup || ''} 
                        onChange={e => setEditData({...editData, staffGroup: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {editData.isMdroFinding && (
                      <div className="space-y-2 col-span-full">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organism Identified</label>
                        <input 
                          value={editData.mdroTransmission || ''} 
                          onChange={e => setEditData({...editData, mdroTransmission: e.target.value})}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance Score (%)</label>
                      <input 
                        type="number"
                        value={editData.totalScore || editData.score || 0} 
                        onChange={e => setEditData({...editData, totalScore: parseInt(e.target.value), score: parseInt(e.target.value)})}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Summary / Clinical Notes</label>
                    <textarea 
                      value={editData.summary || editData.notes || ''} 
                      onChange={e => setEditData({...editData, summary: e.target.value, notes: e.target.value})}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 h-32"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : viewingOriginal && reportWithData?.fileData ? (
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
                      "{selectedReport.summary || selectedReport.notes || 'No clinical summary available for this record.'}"
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
            <div className="p-6 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm">
              {!isEditing && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => setViewingOriginal(!viewingOriginal)}
                    disabled={!reportWithData?.fileData}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-white/5 ${viewingOriginal ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50'}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> {viewingOriginal ? 'Details' : 'Original'}
                  </button>
                  <button 
                    onClick={() => handleEditReport(selectedReport)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-600/10 text-amber-500 border border-amber-500/20 font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDownloadReport(selectedReport)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button 
                    onClick={() => handleShareReport(selectedReport, 'system')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 text-white border border-white/10 font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button 
                    onClick={() => handleShareReport(selectedReport, 'whatsapp')}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  {isDesigner && (
                    <button 
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600/10 text-red-500 border border-red-600/20 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
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
