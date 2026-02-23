import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  FileUp, 
  Trash2, 
  Search, 
  ArrowLeft, 
  Download, 
  Clock, 
  FileText, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileSearch,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoldenFile } from '../types';
import { storageService } from '../services/storageService';

const GoldenFiles: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<GoldenFile[]>([]);
  const [filter, setFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const loadedFiles = await storageService.getGoldenFiles();
    setFiles(loadedFiles);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_SIZE) {
      alert("Material exceeds the 30MB limit. Please compress the file for the clinical vault.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const newFile: GoldenFile = {
        id: `gold-${Date.now()}`,
        name: file.name,
        type: file.type,
        data: reader.result as string,
        timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      };

      await storageService.saveGoldenFile(newFile);
      await loadFiles();
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
  };

  const dataURLtoBlob = (dataurl: string) => {
    try {
      const arr = dataurl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error("Blob conversion failed", e);
      return null;
    }
  };

  const openInExternalReader = async (file: GoldenFile) => {
    // Hydrate
    const fullFile = await storageService.getGoldenFileWithData(file.id);
    if (!fullFile || !fullFile.data) {
      alert("Failed to retrieve source material.");
      return;
    }
    
    const blob = dataURLtoBlob(fullFile.data);
    if (blob) {
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
    } else {
      alert("Failed to prepare document for external reading.");
    }
  };

  const deleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Purge this clinical material from Golden Files?")) {
      await storageService.deleteGoldenFile(id);
      await loadFiles();
    }
  };

  const downloadFile = async (file: GoldenFile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fullFile = await storageService.getGoldenFileWithData(file.id);
    if (!fullFile || !fullFile.data) return;

    const link = document.createElement('a');
    link.href = fullFile.data;
    link.download = fullFile.name;
    link.click();
  };

  const filtered = files.filter(f => (f.name?.toLowerCase() || '').includes(filter.toLowerCase()));

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-amber-100 dark:border-amber-900/30">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(-1)} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-amber-600 font-black text-[10px] uppercase tracking-[0.4em]">System Persistent Vault</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter flex items-center gap-5">
              <Star className="w-10 h-10 md:w-16 md:h-16 text-amber-500 fill-amber-500 drop-shadow-xl" />
              Golden Files
           </h2>
        </div>
        <div className="flex flex-wrap gap-4">
           <button 
             onClick={() => fileInputRef.current?.click()} 
             disabled={isUploading}
             className="bg-amber-500 text-white px-8 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-amber-900/20 active:scale-95 transition-all disabled:opacity-50"
           >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
              {isUploading ? "UPLOADING..." : "ADD MATERIAL"}
           </button>
           <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleUpload} className="hidden" />
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search clinical vault..." className={`pl-14 pr-8 py-5 rounded-[2rem] border-none outline-none text-sm font-bold w-full md:w-80 ${isDarkMode ? 'bg-slate-900 ring-1 ring-white/5' : 'bg-amber-50/50 ring-1 ring-amber-100 shadow-inner'}`} />
           </div>
        </div>
      </header>

      {files.length === 0 ? (
        <div className="py-40 text-center flex flex-col items-center gap-8 bg-amber-50/30 dark:bg-amber-950/10 rounded-[5rem] border-4 border-dashed border-amber-100 dark:border-amber-900/20">
           <div className="bg-white dark:bg-slate-900 p-10 rounded-full shadow-2xl">
              <Star className="w-20 h-20 text-amber-200" />
           </div>
           <div className="space-y-2">
              <h4 className="text-3xl font-black uppercase tracking-tighter text-amber-300">Vault Empty</h4>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Upload clinical manuals (max 30MB) for direct system-wide access.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filtered.map((file) => (
             <div 
               key={file.id} 
               onClick={() => openInExternalReader(file)}
               className="p-8 rounded-[3.5rem] border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-slate-900 shadow-xl group hover:-translate-y-2 transition-all relative overflow-hidden cursor-pointer"
             >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform pointer-events-none group-hover:text-amber-500">
                  <FileSearch className="w-32 h-32" />
                </div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                   <div className="bg-amber-100 dark:bg-amber-900/40 p-4 rounded-3xl transition-colors group-hover:bg-amber-500">
                      <FileText className={`w-8 h-8 transition-colors ${isDarkMode ? 'text-amber-400' : 'text-amber-600'} group-hover:text-white`} />
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={(e) => deleteFile(file.id, e)}
                        className="p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-90"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <div className="space-y-6 relative z-10">
                   <div className="min-h-[70px]">
                      <h4 className="text-lg font-black uppercase tracking-tight leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors">{file.name}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{file.size}</p>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{file.type.split('/')[1]?.toUpperCase() || 'DOC'}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openInExternalReader(file); }}
                        className="flex-1 mr-2 flex items-center justify-center gap-2 bg-amber-500 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                      >
                         <ExternalLink className="w-4 h-4" /> Open In App
                      </button>
                      <button 
                        onClick={(e) => downloadFile(file, e)}
                        className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-amber-500 transition-all shadow-lg active:scale-95"
                        title="Download File"
                      >
                         <Download className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                      <Clock className="w-3.5 h-3.5" /> Published {file.timestamp}
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      <footer className="pt-20">
         <div className={`p-10 rounded-[4rem] border flex flex-col md:flex-row items-center gap-10 ${isDarkMode ? 'bg-amber-900/10 border-amber-900/20' : 'bg-amber-50 border-amber-100'}`}>
            <div className="bg-amber-500 p-6 rounded-[2rem] shadow-xl"><BookOpen className="w-10 h-10 text-white" /></div>
            <div className="space-y-2 flex-1 text-center md:text-left">
               <h4 className="text-2xl font-black uppercase tracking-tight">Enterprise Intelligence Index</h4>
               <p className="text-xs font-bold text-amber-800/60 dark:text-amber-500/60 leading-relaxed max-w-2xl">
                 Clinical documents now open directly in your system's native PDF reader or a new high-fidelity browser tab. By using IndexedDB for large 30MB manuals, we ensure performance remains high without hitting localStorage limits.
               </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-amber-600 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-amber-100 shadow-sm">
               <ShieldCheck className="w-4 h-4" /> NATIVE VIEWING ENABLED
            </div>
         </div>
      </footer>
    </div>
  );
};

export default GoldenFiles;