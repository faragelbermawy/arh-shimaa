
import React, { useState, useEffect } from 'react';
import { 
  CloudSync, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  RefreshCw,
  History,
  MessageSquare,
  HardDriveDownload,
  FileJson,
  Trash2,
  Copy,
  Info,
  ChevronRight,
  Monitor,
  ShieldCheck,
  Star,
  FileText
} from 'lucide-react';
import { syncService, SyncMode } from '../services/syncService';
import { storageService } from '../services/storageService';
import { syncAllData, clearCloudPath } from '../services/firebase';
import { CloudUpload, ShieldAlert } from 'lucide-react';

const SyncHub: React.FC = () => {
  const [syncToken, setSyncToken] = useState('');
  const [importToken, setImportToken] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [localStats, setLocalStats] = useState({ reports: 0, audits: 0, visitors: 0, golden: 0 });
  const [selectedMode, setSelectedMode] = useState<SyncMode>('lite');
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const MAX_WA_LENGTH = 12000; 

  useEffect(() => {
    const saved = localStorage.getItem('mdro_last_global_sync_v2');
    if (saved) setLastSync(saved);
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    refreshLocalStats();
  }, []);

  const refreshLocalStats = async () => {
    setLocalStats({
      reports: storageService.getReports().length,
      audits: storageService.getAudits().length,
      visitors: storageService.getVisitors().length,
      golden: (await storageService.getGoldenFiles()).length
    });
  };

  const handleGenerateKey = async (mode: SyncMode) => {
    setIsProcessing(true);
    setSelectedMode(mode);
    setStatus({ type: 'idle', message: '' });
    setSyncToken('');
    try {
      const token = await syncService.generateSyncToken(mode);
      setSyncToken(token);
      
      try {
        await navigator.clipboard.writeText(token);
        const modeLabel = mode === 'lite' ? 'Metadata (Lite)' : 'Full Intelligence';
        setStatus({ type: 'success', message: `${modeLabel} Key Copied to Clipboard!` });
      } catch (copyErr) {
        setStatus({ type: 'success', message: 'Key Generated. Select and copy below.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Key generation failed. Data volume might be too large for browser memory.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importToken.trim()) return;
    setIsProcessing(true);
    try {
      const result = await syncService.mergeState(importToken);
      if (result.success) {
        setStatus({ type: 'success', message: `${result.message} (${result.count?.reports} Reports merged)` });
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('mdro_last_global_sync_v2', now);
        setImportToken('');
        await refreshLocalStats();
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Critical failure during ingestion. Key may be invalid.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendToWhatsApp = () => {
    if (!syncToken) return;
    if (syncToken.length > MAX_WA_LENGTH) {
      navigator.clipboard.writeText(syncToken);
      alert("Key is too long for a direct WhatsApp link. It has been copied to your clipboard. Please paste it manually in the chat.");
      return;
    }
    const appUrl = window.location.origin;
    const text = `*MDRO HUB SYNC (${selectedMode.toUpperCase()})*\n\nPaste this clinical key:\n\n${syncToken}\n\nPortal: ${appUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFactoryReset = () => {
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput === designerCode) {
      if (window.confirm("CRITICAL: Wipe ALL terminal data? This will clear all progress, reports, and audits permanently.")) {
        storageService.clearAllData();
        window.location.reload();
      }
    } else if (userInput !== null) {
      alert("Unauthorized! Only the Designer can perform a factory reset.");
    }
  };

  const handleCloudReset = async () => {
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput === designerCode) {
      if (window.confirm("⚠️ WARNING: This will permanently delete ALL data from the CLOUD (Firebase). This cannot be undone. Are you sure?")) {
        setIsProcessing(true);
        try {
          const paths = ['audits', 'registries', 'findings', 'reports', 'vaults'];
          await Promise.all(paths.map(path => clearCloudPath(path)));
          setStatus({ type: 'success', message: 'Cloud Database Cleared Successfully.' });
        } catch (e) {
          setStatus({ type: 'error', message: 'Failed to clear cloud database.' });
        } finally {
          setIsProcessing(false);
        }
      }
    } else if (userInput !== null) {
      alert("Unauthorized! Only the Designer can clear the cloud database.");
    }
  };

  const [vaultId, setVaultId] = useState('');
  const [pullId, setPullId] = useState('');

  const handlePushToVault = async (mode: SyncMode) => {
    if (!vaultId.trim()) {
      setStatus({ type: 'error', message: 'Please enter a Vault ID (e.g., your name or unit)' });
      return;
    }
    setIsProcessing(true);
    setSelectedMode(mode);
    try {
      const success = await syncService.pushToServer(vaultId, mode);
      if (success) {
        setStatus({ type: 'success', message: `Data pushed to Vault: ${vaultId}` });
      } else {
        setStatus({ type: 'error', message: 'Failed to push to server.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Server connection error.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullFromVault = async () => {
    if (!pullId.trim()) return;
    setIsProcessing(true);
    try {
      const result = await syncService.pullFromServer(pullId);
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('mdro_last_global_sync_v2', now);
        setPullId('');
        await refreshLocalStats();
      } else {
        setStatus({ type: 'error', message: result.message });
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Server connection error.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualFirebaseSync = async () => {
    setFirebaseSyncStatus('syncing');
    
    const audits = storageService.getAudits();
    const visitors = storageService.getVisitors();
    const findings = storageService.getReports().filter(r => r.isMdroFinding);
    const reports = storageService.getReports().filter(r => !r.isMdroFinding);

    try {
      if (audits.length > 0) await syncAllData('audits', audits);
      if (visitors.length > 0) await syncAllData('registries', visitors);
      if (findings.length > 0) await syncAllData('findings', findings);
      if (reports.length > 0) await syncAllData('reports', reports);
      
      setFirebaseSyncStatus('success');
      setStatus({ type: 'success', message: "✅ Manual Sync to Firebase Successful" });
      setTimeout(() => setFirebaseSyncStatus('idle'), 3000);
    } catch (e) {
      setStatus({ type: 'error', message: "❌ Firebase Sync Failed" });
      setFirebaseSyncStatus('idle');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
        <div className="flex items-center gap-5">
           <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-900/20"><CloudSync className="w-8 h-8 text-white" /></div>
           <div>
              <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sync Hub</h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Multi-Protocol Transmission Center</p>
           </div>
        </div>
        <div className={`p-4 rounded-3xl border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
           <div className="text-center px-4"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Audits</p><p className="text-xl font-black">{localStats.audits}</p></div>
           <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
           <div className="text-center px-4"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-indigo-500">Reports</p><p className="text-xl font-black">{localStats.reports}</p></div>
           <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
           <div className="text-center px-4"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-amber-500">Golden</p><p className="text-xl font-black">{localStats.golden}</p></div>
        </div>
      </header>

      {status.type !== 'idle' && (
        <div className={`p-6 rounded-[2rem] border flex items-center gap-4 animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'bg-red-600 text-white shadow-xl shadow-red-900/20'}`}>
          {status.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <p className="text-[10px] font-black uppercase tracking-widest flex-1 leading-relaxed">{status.message}</p>
          <button onClick={() => setStatus({ type: 'idle', message: '' })} className="p-2 hover:bg-white/10 rounded-lg">✕</button>
        </div>
      )}

      {/* CLOUD VAULT SYNC */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className={`p-10 rounded-[4rem] border shadow-2xl space-y-8 compliance-card ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <CloudSync className="w-6 h-6 text-blue-600" /> Cloud Vault Push
              </h3>
           </div>
           
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter a unique ID for your sync session</p>
              <input 
                type="text" 
                value={vaultId} 
                onChange={(e) => setVaultId(e.target.value)} 
                placeholder="e.g. LTC-UNIT-6" 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handlePushToVault('lite')} 
                disabled={isProcessing}
                className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                Push Lite
              </button>
              <button 
                onClick={() => handlePushToVault('full')} 
                disabled={isProcessing}
                className="bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                Push Full
              </button>
           </div>
        </div>

        <div className={`p-10 rounded-[4rem] border shadow-2xl space-y-8 compliance-card ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Download className="w-6 h-6 text-emerald-600" /> Cloud Vault Pull
              </h3>
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter the ID to pull data from</p>
              <input 
                type="text" 
                value={pullId} 
                onChange={(e) => setPullId(e.target.value)} 
                placeholder="e.g. LTC-UNIT-6" 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
           </div>

           <button 
             onClick={handlePullFromVault} 
             disabled={!pullId.trim() || isProcessing}
             className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
           >
             Pull & Merge
           </button>
        </div>

        <div className={`p-10 rounded-[4rem] border shadow-2xl space-y-8 flex flex-col justify-center items-center text-center compliance-card ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
           <div className="bg-amber-500 p-6 rounded-3xl shadow-xl mb-6">
              <CloudUpload className="w-10 h-10 text-white" />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Manual Firebase Sync</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Force immediate upload of all local records to Firebase Realtime Database.</p>
           <button 
             onClick={handleManualFirebaseSync}
             disabled={firebaseSyncStatus === 'syncing'}
             className="w-full bg-amber-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-900/20 hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-50"
           >
             {firebaseSyncStatus === 'syncing' ? 'SYNCING...' : 'SYNC TO FIREBASE'}
           </button>
           {firebaseSyncStatus === 'success' && <p className="text-emerald-500 text-[10px] font-black uppercase mt-4">Data is now Live on Cloud!</p>}
        </div>
      </section>

      {/* SYNC PROTOCOL OPTIONS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { 
            id: 'lite', 
            label: 'Metadata Only', 
            desc: 'Audits, reports metadata & progress. Excludes source documents for maximum speed.', 
            icon: Zap, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            border: 'border-blue-100' 
          },
          { 
            id: 'full', 
            label: 'Full Clinical Sync', 
            desc: 'Complete records including extracted analysis and audit details.', 
            icon: CloudSync, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50', 
            border: 'border-emerald-100' 
          },
        ].map((mode) => (
          <button 
            key={mode.id}
            onClick={() => handleGenerateKey(mode.id as SyncMode)}
            className={`group p-10 rounded-[4rem] border-2 text-left transition-all hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-full ${selectedMode === mode.id && syncToken ? 'border-slate-900 dark:border-white shadow-xl' : mode.border} ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
          >
            <div className="space-y-6">
               <div className={`${mode.bg} w-20 h-20 rounded-[2.5rem] flex items-center justify-center ${mode.color} shadow-inner`}>
                  <mode.icon className="w-10 h-10" />
               </div>
               <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter">{mode.label}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-3">{mode.desc}</p>
               </div>
            </div>
            
            <div className="mt-10 flex items-center justify-between border-t border-slate-50 dark:border-white/5 pt-8">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Select Protocol</span>
               {isProcessing && selectedMode === mode.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className={`p-10 rounded-[4rem] border shadow-2xl space-y-8 compliance-card ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Upload className="w-6 h-6 text-blue-600" /> Export Results
              </h3>
              {syncToken && (
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] animate-pulse">
                   {selectedMode.toUpperCase()} Ready
                </div>
              )}
           </div>

           {!syncToken ? (
             <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center gap-4">
                <Monitor className="w-12 h-12 text-slate-100" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select a protocol above to generate key</p>
             </div>
           ) : (
             <div className="space-y-6 animate-in fade-in zoom-in-98 duration-500">
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">Encrypted Transmission Token</p>
                   <p className="text-[9px] font-mono break-all line-clamp-4 text-slate-400 italic">"{syncToken}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={sendToWhatsApp} className="bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                      <MessageSquare className="w-5 h-5" /> Share on WhatsApp
                   </button>
                   <button onClick={() => { navigator.clipboard.writeText(syncToken); setStatus({ type: 'success', message: 'Key Copied' }); setTimeout(() => setStatus({type: 'idle', message: ''}), 3000); }} className="bg-slate-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                      <Copy className="w-5 h-5" /> Copy Clinical Key
                   </button>
                </div>
             </div>
           )}
        </section>

        <section className="bg-slate-950 text-white p-10 rounded-[4rem] border border-white/10 shadow-2xl space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Download className="w-6 h-6 text-emerald-400" /> Ingest Keys
              </h3>
              <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                 Awaiting Input
              </div>
           </div>
           
           <textarea 
             value={importToken} 
             onChange={(e) => setImportToken(e.target.value)} 
             placeholder="Paste any protocol key here to begin merging..." 
             className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-xs font-mono outline-none h-40 scrollbar-hide focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700" 
           />
           
           <button 
             onClick={handleImport} 
             disabled={!importToken.trim() || isProcessing} 
             className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-20"
           >
             {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
             MERGE INTELLIGENCE
           </button>
        </section>
      </div>

      <section className={`p-10 rounded-[4rem] border flex flex-col md:flex-row items-center justify-between gap-8 ${isDarkMode ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
         <div className="flex items-center gap-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-xl"><HardDriveDownload className="w-8 h-8 text-white" /></div>
            <div>
               <h4 className="text-xl font-black uppercase tracking-tighter">Enterprise Vault Backup</h4>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full offline JSON recovery for major terminal migrations.</p>
            </div>
         </div>
         <div className="flex flex-col gap-3 w-full md:w-auto">
            <button onClick={() => storageService.exportAllData()} className="bg-white dark:bg-slate-900 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all border border-blue-100 dark:border-white/5">
                <FileJson className="w-5 h-5 text-blue-600" /> DOWNLOAD ARCHIVE
            </button>
            {isAdmin && (
              <div className="flex flex-col gap-2">
                <button onClick={handleFactoryReset} className="text-red-600 font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
                   <Trash2 className="w-3 h-3" /> Factory Reset Terminal
                </button>
                <button onClick={handleCloudReset} className="text-red-500 font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
                   <ShieldAlert className="w-3 h-3" /> Master Cloud Reset (Firebase)
                </button>
              </div>
            )}
         </div>
      </section>

      <footer className={`p-8 rounded-[3.5rem] border flex items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
         <div className="flex items-center gap-5">
            <History className="w-8 h-8 text-slate-400" />
            <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Persistence State</p>
               <p className={`text-sm font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{lastSync || 'Hub Initialized'}</p>
            </div>
         </div>
         <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-full border border-slate-100 dark:border-white/5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-500" />
            <span className="text-[9px] font-black uppercase text-slate-400">Clinical Sync v3 Active</span>
         </div>
      </footer>
    </div>
  );
};

export default SyncHub;
