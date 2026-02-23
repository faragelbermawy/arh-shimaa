import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck as ShieldIcon,
  Trees as TreesIcon,
  Hand as HandIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Database as DatabaseIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Activity as ActivityIcon,
  Sparkles as SparklesIcon,
  ArrowRight as ArrowRightIcon,
  PlusCircle as PlusCircleIcon,
  TrendingUp as TrendingUpIcon,
  Monitor as MonitorIcon,
  PlayCircle as PlayCircleIcon,
  Calendar as CalendarIcon,
  CloudSync as CloudSyncIcon,
  Dna as DnaIcon,
  HardDrive,
  Building2,
  AlertTriangle,
  Microscope,
  FileText,
  Users,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { UserProgress, AuditRecord, ClinicalReport, Visitor } from '../types';
import { storageService } from '../services/storageService';
import { db } from '../services/firebase';
import { ref, onValue } from "firebase/database";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null);
  const [reports, setReports] = useState<ClinicalReport[]>(storageService.getReports());
  const [visitors, setVisitors] = useState<Visitor[]>(storageService.getVisitors());
  const [audits, setAudits] = useState<AuditRecord[]>(storageService.getAudits());

  const loadAllData = () => {
    setReports(storageService.getReports());
    setVisitors(storageService.getVisitors());
    setAudits(storageService.getAudits());
    setLastGlobalSync(localStorage.getItem('mdro_last_global_sync_v2'));
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  };

  useEffect(() => {
    loadAllData();
    
    // Real-time listeners for global sync
    const auditsRef = ref(db, 'audits');
    const unsubscribeAudits = onValue(auditsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setAudits(prev => {
          const combined = [...prev];
          list.forEach(item => {
            if (!combined.find(c => c.id === item.id)) combined.push(item);
          });
          return combined;
        });
      }
    });

    const registriesRef = ref(db, 'registries');
    const unsubscribeRegistries = onValue(registriesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setVisitors(prev => {
          const combined = [...prev];
          list.forEach(item => {
            if (!combined.find(c => c.id === item.id)) combined.push(item);
          });
          return combined;
        });
      }
    });

    const findingsRef = ref(db, 'findings');
    const unsubscribeFindings = onValue(findingsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key], isMdroFinding: true }));
        setReports(prev => {
          const combined = [...prev];
          list.forEach(item => {
            if (!combined.find(c => c.id === item.id)) combined.push(item);
          });
          return combined;
        });
      }
    });

    const reportsRef = ref(db, 'reports');
    const unsubscribeReports = onValue(reportsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        setReports(prev => {
          const combined = [...prev];
          list.forEach(item => {
            if (!combined.find(c => c.id === item.id)) combined.push(item);
          });
          return combined;
        });
      }
    });

    const interval = setInterval(loadAllData, 5000);
    return () => {
      clearInterval(interval);
      unsubscribeAudits();
      unsubscribeRegistries();
      unsubscribeFindings();
      unsubscribeReports();
    };
  }, []);

  const { mdroReports, latestMdroFinding, sortedUnits, sortedPathogens } = React.useMemo(() => {
    const filtered = reports.filter(r => r.isMdroFinding);
    const latest = filtered[0];
    
    const unitStats: Record<string, number> = {};
    const pathogenStats: Record<string, number> = {};

    filtered.forEach(r => {
      const units = r.unitName?.split(',').map(u => u.trim()) || [];
      const pathogens = r.mdroTransmission?.split(',').map(p => p.trim()) || [];
      units.forEach(u => { if(u) unitStats[u] = (unitStats[u] || 0) + 1; });
      pathogens.forEach(p => { if(p) pathogenStats[p] = (pathogenStats[p] || 0) + 1; });
    });

    const units = Object.entries(unitStats).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const pathogens = Object.entries(pathogenStats).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return { mdroReports: filtered, latestMdroFinding: latest, sortedUnits: units, sortedPathogens: pathogens };
  }, [reports]);

  const auditStats = React.useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekAudits = audits.filter(a => {
      const auditDate = new Date(a.timestamp);
      return !isNaN(auditDate.getTime()) ? auditDate >= oneWeekAgo : true; // Fallback if date parsing fails for some reason
    });

    const typeCounts: Record<string, number> = {};
    let totalCompliance = 0;
    
    weekAudits.forEach(a => {
      const type = a.auditType || 'General';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      totalCompliance += a.totalScore;
    });

    const chartData = Object.entries(typeCounts).map(([name, value]) => ({
      name: name.replace('-', ' ').toUpperCase(),
      value
    }));

    const avgCompliance = weekAudits.length > 0 ? Math.round(totalCompliance / weekAudits.length) : 0;

    return { chartData, avgCompliance, weekCount: weekAudits.length };
  }, [audits]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* System Status Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-1">
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" /> Clinical Node Secured
          </p>
        </div>
        {lastGlobalSync && (
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <CloudSyncIcon className="w-3 h-3" /> Updated: {lastGlobalSync}
          </p>
        )}
      </div>

      {/* Main Hero Section */}
      <section className={`relative overflow-hidden rounded-[3rem] p-8 md:p-12 lg:p-14 text-white shadow-2xl transition-all duration-700 border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-950 border-slate-800'}`}>
        <div className="relative z-10 flex flex-col items-center lg:items-start gap-8">
          <div className="space-y-6 text-center lg:text-left w-full">
            <div className="space-y-1 animate-in slide-in-from-bottom-2 duration-700">
              <p className="font-black text-[9px] md:text-[10px] tracking-[0.4em] text-green-400 uppercase drop-shadow-glow">
                DESIGNED BY FARAG ELBERMAWY LTC
              </p>
              <div className="h-0.5 w-12 bg-green-500 mx-auto lg:mx-0"></div>
            </div>
            
            <div className="flex flex-row items-center justify-center lg:justify-start gap-4 md:gap-8 lg:gap-12 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black leading-[0.85] tracking-tighter uppercase flex-none">
                <span className="text-emerald-500">ARH-LTC</span> <br/> 
                MDRO <span className="text-green-500">HUB</span>
              </h1>
              
              {/* Logo beside title - utilizing empty space */}
              <div className="flex-none animate-in fade-in zoom-in duration-1000 delay-300">
                <div className="bg-white/5 backdrop-blur-md p-3 sm:p-4 md:p-6 lg:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl relative group">
                  <TreesIcon className="w-12 h-12 sm:w-16 sm:h-16 md:w-32 md:h-32 lg:w-44 lg:h-44 text-emerald-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute -inset-4 bg-emerald-500/10 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
            
            <div className="w-full h-12 md:h-16 flex items-center overflow-hidden py-2 opacity-40">
               <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                  <path 
                    d="M 0 50 L 50 50 L 65 45 L 75 55 L 85 50 L 120 50 L 130 50 L 135 10 L 145 90 L 150 50 L 170 50 L 190 40 L 210 60 L 225 50 L 300 50 L 315 45 L 325 55 L 335 50 L 370 50 L 380 50 L 385 10 L 395 90 L 400 50 L 420 50 L 440 40 L 460 60 L 475 50 L 550 50 L 565 45 L 575 55 L 585 50 L 620 50 L 630 50 L 635 10 L 645 90 L 650 50 L 670 50 L 690 40 L 710 60 L 725 50 L 800 50 L 815 45 L 825 55 L 835 50 L 870 50 L 880 50 L 885 10 L 895 90 L 900 50 L 920 50 L 940 40 L 960 60 L 975 50 L 1000 50"
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="3" 
                    className="animate-ecg shadow-glow"
                  />
               </svg>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <button onClick={() => navigate('/learning')} className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"><PlayCircleIcon className="w-5 h-5" /> Training Modules</button>
              <button onClick={() => navigate('/mdro-archive')} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"><DnaIcon className="w-5 h-5" /> Active Findings</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grids */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all duration-500 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg"><Building2 className="w-6 h-6 text-white" /></div>
            <h3 className="font-black text-sm uppercase tracking-tight">Transmission Areas</h3>
          </div>
          <div className="space-y-5">
            {sortedUnits.length > 0 ? sortedUnits.map(([unit, count]) => (
              <div key={unit} className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{unit}</span>
                  <span className="text-blue-600">{count} Records</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (count / (reports.length || 1)) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center italic">No localized data indexed</p>
            )}
          </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all duration-500 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-red-600 p-3 rounded-xl shadow-lg"><Microscope className="w-6 h-6 text-white" /></div>
            <h3 className="font-black text-sm uppercase tracking-tight">Organism Analytics</h3>
          </div>
          <div className="space-y-5">
            {sortedPathogens.length > 0 ? sortedPathogens.map(([organism, count]) => (
              <div key={organism} className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{organism}</span>
                  <span className="text-red-600">{count} Cases</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-red-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (count / (reports.length || 1)) * 100)}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-xs font-bold text-slate-400 py-4 text-center italic">Vault clear</p>
            )}
          </div>
        </div>

        <div 
          onClick={() => navigate('/mdro-archive')}
          className={`p-8 rounded-[2.5rem] border shadow-xl hover:scale-[1.02] transition-all duration-500 cursor-pointer relative overflow-hidden group ${isDarkMode ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}
        >
          <DnaIcon className="absolute -right-8 -top-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-4">
               <div className="bg-red-600 p-3 rounded-xl shadow-lg"><AlertTriangle className="w-6 h-6 text-white" /></div>
               <div>
                  <h3 className="text-lg font-black uppercase text-red-600 leading-none">Last Alert</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Node</p>
               </div>
            </div>
            
            {latestMdroFinding ? (
              <div className="space-y-4 pt-8">
                 <div>
                    <p className="text-3xl font-black text-red-700 dark:text-red-400 uppercase leading-none tracking-tighter">{latestMdroFinding.mdroTransmission}</p>
                    <p className={`text-[9px] font-black uppercase mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Identified in {latestMdroFinding.unitName}</p>
                 </div>
                 <div className="flex items-center justify-between pt-4 border-t border-red-200 dark:border-red-900/30">
                    <span className="text-[8px] font-black text-slate-400 uppercase">{latestMdroFinding.reportDate}</span>
                    <div className="bg-red-600 p-2 rounded-lg text-white group-hover:translate-x-1.5 transition-transform duration-500">
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                 </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400 text-center py-10 uppercase tracking-widest">Archive Clear</p>
            )}
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { l: 'REGISTRY', c: visitors.length, i: DatabaseIcon, color: 'bg-blue-600', p: '/registry' },
            { l: 'AUDITS', c: audits.length, i: ClipboardCheckIcon, color: 'bg-emerald-600', p: '/audit' },
            { l: 'VAULT', c: reports.length, i: MonitorIcon, color: 'bg-indigo-600', p: '/docs' },
            { l: 'CLOUD', c: lastGlobalSync ? 'Active' : 'Ready', i: CloudSyncIcon, color: 'bg-amber-600', p: '/sync' }
          ].map((s, idx) => (
            <button key={idx} onClick={() => navigate(s.p)} className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col gap-4 text-left group ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
               <div className={`${s.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105 duration-500`}><s.i className="w-5 h-5" /></div>
               <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.l}</p>
                  <p className={`text-xl font-black uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.c}</p>
               </div>
            </button>
          ))}
      </section>

      {/* Audit Analytics Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-8 rounded-[3rem] border shadow-sm transition-all duration-500 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-xl shadow-lg"><BarChart3 className="w-6 h-6 text-white" /></div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight">Weekly Audit Distribution</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last 7 Days Activity</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-600">{auditStats.weekCount}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Audits</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditStats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {auditStats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-8 rounded-[3rem] border shadow-xl transition-all duration-500 flex flex-col justify-between relative overflow-hidden group ${isDarkMode ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
          <TrendingUpIcon className="absolute -right-8 -top-8 w-40 h-40 opacity-5 group-hover:scale-110 transition-transform duration-700 text-emerald-600" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-emerald-600 p-3 rounded-xl shadow-lg"><ShieldIcon className="w-6 h-6 text-white" /></div>
              <div>
                <h3 className="text-lg font-black uppercase text-emerald-600 leading-none">Compliance</h3>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Weekly Average</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative">
                <svg className="w-44 h-44 transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-emerald-200 dark:text-emerald-900/30"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * auditStats.avgCompliance) / 100}
                    strokeLinecap="round"
                    className="text-emerald-600 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">{auditStats.avgCompliance}%</span>
                  <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Score</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Performance Status</p>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${auditStats.avgCompliance >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {auditStats.avgCompliance >= 90 ? 'Optimal' : 'Review Needed'}
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;