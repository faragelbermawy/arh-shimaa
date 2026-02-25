import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  BookOpen, 
  MessageSquare, 
  ClipboardList,
  Trees,
  CheckCircle,
  ShieldCheck,
  ClipboardCheck,
  Lock,
  Unlock,
  ShieldAlert,
  Moon,
  Sun,
  Maximize,
  Minimize,
  CloudSync,
  FileText,
  Plus,
  Share2,
  Dna,
  UserPlus,
  GripHorizontal
} from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef<HTMLElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [showFABMenu, setShowFABMenu] = useState(false);

  // Dragging logic for mobile dock
  const [dockY, setDockY] = useState(24); // default bottom offset
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startDockY = useRef(0);

  const ADMIN_PIN = "55131";

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  useEffect(() => {
    const adminStatus = sessionStorage.getItem('is_admin_active') === 'true';
    setIsAdmin(adminStatus);
    
    const savedTheme = localStorage.getItem('mdro_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleFullScreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mdro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mdro_theme', 'light');
    }
  };

  const toggleFullScreen = () => {
    const doc = document.documentElement as any;
    const docExit = document as any;

    if (!docExit.fullscreenElement && !docExit.webkitFullscreenElement && !docExit.mozFullScreenElement && !docExit.msFullscreenElement) {
      const request = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
      if (request) {
        request.call(doc).catch((err: any) => {
          showToast(`Fullscreen error: ${err.message}`);
        });
      } else {
        showToast("Fullscreen is only supported in Standalone (Add to Home Screen) on iOS.");
      }
    } else {
      const exit = docExit.exitFullscreen || docExit.webkitExitFullscreen || docExit.mozCancelFullScreen || docExit.msExitFullscreen;
      if (exit) {
        exit.call(docExit);
      }
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'HOME', color: 'slate' },
    { path: '/learning', icon: BookOpen, label: 'LEARN', color: 'blue' },
    { path: '/assistant', icon: MessageSquare, label: 'ASSISTANT', color: 'purple' },
    { path: '/audit', icon: ClipboardCheck, label: 'AUDIT', color: 'emerald' },
    { path: '/registry', icon: ClipboardList, label: 'REGISTRY', color: 'indigo' },
    { path: '/docs', icon: FileText, label: 'VAULT', color: 'rose' },
    { path: '/sync', icon: CloudSync, label: 'SYNC', color: 'amber' },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800';
    const mappings: Record<string, string> = {
      slate: 'bg-slate-900 text-white md:bg-slate-900/10 md:text-slate-900 dark:md:text-slate-300',
      blue: 'bg-blue-800 text-white md:bg-blue-800/10 md:text-blue-800 dark:md:text-blue-400',
      purple: 'bg-purple-800 text-white md:bg-purple-800/10 md:text-purple-800 dark:md:text-purple-400',
      emerald: 'bg-emerald-800 text-white md:bg-emerald-800/10 md:text-emerald-800 dark:md:text-emerald-400',
      indigo: 'bg-indigo-800 text-white md:bg-indigo-800/10 md:text-indigo-800 dark:md:text-indigo-400',
      rose: 'bg-rose-800 text-white md:bg-rose-800/10 md:text-rose-800 dark:md:text-rose-400',
      amber: 'bg-amber-800 text-white md:bg-amber-800/10 md:text-amber-800 dark:md:text-amber-400',
    };
    return mappings[color] || 'bg-slate-800 text-white';
  };

  const handleAdminAuth = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      sessionStorage.setItem('is_admin_active', 'true');
      setShowPinModal(false);
      setPinInput('');
      showToast('Authorized');
    } else {
      showToast('Invalid PIN');
      setPinInput('');
    }
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  // Touch Handlers for movable dock
  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startDockY.current = dockY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.touches[0].clientY;
    // Limit range within screen safely
    const newY = Math.max(16, Math.min(window.innerHeight - 150, startDockY.current + deltaY));
    setDockY(newY);
  };

  const onTouchEnd = () => {
    isDragging.current = false;
  };

  return (
    <div className={`h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header handles its own safe-area-top padding if needed */}
      <header 
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        className={`fixed top-0 left-0 right-0 z-[500] h-[calc(4rem+env(safe-area-inset-top))] md:h-20 px-6 flex items-center justify-between border-b backdrop-blur-xl ${isDarkMode ? 'bg-slate-950/80 border-white/5' : 'bg-white/80 border-slate-200'}`}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <Trees className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase text-emerald-600 dark:text-emerald-500 leading-none">ARH-LTC</h1>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Clinical Hub</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={() => {
              const appUrl = window.location.origin;
              if (navigator.share) {
                navigator.share({
                  title: 'ARH-LTC MDRO Hub',
                  text: 'Access the official MDRO prevention and clinical intelligence hub.',
                  url: appUrl
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(appUrl);
                showToast('Link Copied');
              }
            }}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isDarkMode ? 'hover:bg-white/5 text-blue-400' : 'hover:bg-slate-100 text-blue-600'}`}
            title="Share App"
          >
            <Share2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1 hidden md:block" />

          <button 
            onClick={toggleFullScreen} 
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 md:h-6" /> : <Maximize className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          
          <button 
            onClick={toggleTheme} 
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isDarkMode ? 'hover:bg-white/5 text-amber-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
          </button>

          <button 
            onClick={isAdmin ? () => { setIsAdmin(false); sessionStorage.removeItem('is_admin_active'); } : () => setShowPinModal(true)} 
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${isAdmin ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            title={isAdmin ? "Admin Active" : "Admin Login"}
          >
            {isAdmin ? <Unlock className="w-5 h-5 md:w-6 md:h-6" /> : <Lock className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
        </div>
      </header>

      {/* Navigation - Draggable Floating Island for Mobile, Side Bar for Desktop */}
      <nav 
        style={{ 
          bottom: window.innerWidth < 768 ? `calc(${dockY}px + env(safe-area-inset-bottom))` : '0' 
        }}
        className={`
          fixed z-[450] transition-[left,right,width,border-radius,background-color] duration-500
          left-1/2 -translate-x-1/2 w-[92%] max-w-sm rounded-[2.5rem] md:rounded-none
          md:bottom-0 md:left-0 md:translate-x-0 md:top-20 md:w-24 lg:w-64 
          border shadow-2xl md:shadow-none md:border-t-0 md:border-r 
          ${isDarkMode ? 'bg-slate-900/90 md:bg-slate-950 border-white/10' : 'bg-white/90 md:bg-white border-slate-200'}
          backdrop-blur-xl md:backdrop-blur-none touch-none md:touch-auto
        `}
      >
        {/* Mobile Handle Visual - Draggable Area */}
        <div 
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="md:hidden absolute top-0 left-0 right-0 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1 bg-slate-400/30 rounded-full" />
        </div>

        <ul className={`
          flex items-center gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pb-4 pt-8 md:py-8
          md:flex-col md:overflow-visible md:px-3 md:snap-none md:gap-4
        `}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <li key={item.path} className="flex-none md:flex-1 snap-center">
                <Link to={item.path} className={`
                  flex flex-col lg:flex-row items-center gap-3 p-4 md:p-3 rounded-[2rem] transition-all 
                  ${getColorClasses(item.color, isActive)}
                  w-24 md:w-auto active:scale-95 md:active:scale-100
                `}>
                  <Icon className="w-6 h-6 pointer-events-none" />
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-wider leading-none text-center lg:text-left pointer-events-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Main content scroll area with dynamic height adjustment */}
      <main 
        ref={mainContentRef} 
        className="flex-1 mt-[calc(4rem+env(safe-area-inset-top))] md:mt-20 md:pl-24 lg:pl-64 overflow-y-auto overflow-x-hidden scrollbar-hide"
      >
        <div className="max-w-7xl mx-auto p-4 md:p-10 pb-[120px]">
          {children}
        </div>
        
        <footer className="py-24 text-center border-t border-slate-200 dark:border-white/5 opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">DESIGNED BY FARAG ELBERMAWY LTC</p>
          <p className="text-[8px] font-bold uppercase tracking-widest mb-4">ARH-LTC Clinical Intelligence Hub</p>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Version: 1.0.9 — Build: 2026-02-25
          </div>
        </footer>
      </main>

      {/* Floating Action Button */}
      {showFABMenu && (
        <div 
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] z-[550] animate-in fade-in duration-300" 
          onClick={() => setShowFABMenu(false)}
        />
      )}
      
      <div 
        style={{ bottom: `calc(130px + env(safe-area-inset-bottom))` }}
        className="fixed right-6 md:bottom-10 md:right-10 z-[600] flex flex-col items-end gap-3"
      >
        {showFABMenu && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
            {[
              { icon: ClipboardCheck, label: 'New Audit', path: '/audit', color: 'bg-blue-600' },
              { icon: UserPlus, label: 'Log Visitor', path: '/registry', color: 'bg-indigo-600' },
              { icon: Dna, label: 'New Finding', path: '/mdro-archive', color: 'bg-red-600' },
              { icon: CloudSync, label: 'Sync Hub', path: '/sync', color: 'bg-amber-600' }
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => { navigate(item.path); setShowFABMenu(false); }}
                className="flex items-center gap-3 group"
              >
                <div className="hidden group-hover:block bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
                <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95`}>
                  <item.icon className="w-6 h-6" />
                </div>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowFABMenu(!showFABMenu)}
          className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-90 ${showFABMenu ? 'bg-slate-900 rotate-45' : 'bg-emerald-600 shadow-emerald-600/20'}`}
        >
          <Plus className={`w-8 h-8 transition-transform duration-300`} />
        </button>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 w-full max-w-sm text-center space-y-6">
              <ShieldAlert className="w-12 h-12 mx-auto text-red-500" />
              <h3 className="text-xl font-black uppercase tracking-tight">Authorization Required</h3>
              <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="•••••" className="w-full text-center text-3xl font-black bg-slate-100 dark:bg-slate-800 rounded-xl py-4 outline-none" />
              <button onClick={handleAdminAuth} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Unlock Node</button>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400 text-[10px] font-bold uppercase underline">Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;