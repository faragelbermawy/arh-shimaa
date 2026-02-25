import React, { useEffect, useState } from 'react';
import { Trees, ShieldCheck, Activity, ChevronRight, Fingerprint } from 'lucide-react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stages = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1500),
      setTimeout(() => setStage(4), 2500),
      setTimeout(onComplete, 4000)
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 100);

    return () => {
      stages.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div 
      onClick={handleSkip}
      onKeyDown={(e) => e.key === 'Enter' && handleSkip()}
      tabIndex={0}
      role="button"
      aria-label="Skip splash screen"
      className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none touch-none"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-900/10 rounded-full blur-[120px] animate-pulse-slow" />
      
      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo Container */}
        <div className={`transition-all duration-1000 ease-out transform ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="bg-green-700 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(21,128,61,0.3)] border border-green-500/20 relative group">
            <Trees className="w-20 h-20 text-white animate-pulse" />
            <div className="absolute -inset-2 bg-green-500/20 rounded-[3.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className={`text-4xl md:text-6xl font-black text-emerald-500 tracking-tighter transition-all duration-1000 delay-300 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            ARH-LTC
          </h1>
          <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-slate-500 transition-all duration-1000 delay-500 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            Operational Intel Hub
          </p>
        </div>

        {/* Progress Bar */}
        <div className={`w-64 h-1 bg-white/5 rounded-full overflow-hidden transition-all duration-1000 delay-700 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <div 
            className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Manual Dismiss Prompt (Stage 4) */}
      <div className={`absolute bottom-40 transition-all duration-1000 flex flex-col items-center gap-4 ${stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
         <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-full flex items-center gap-4">
            <Fingerprint className="w-5 h-5 text-green-500" />
            <span className="text-[10px] font-black uppercase text-white tracking-[0.3em]">Tap screen to proceed</span>
         </div>
      </div>

      {/* Designer Credit Footer */}
      <div className={`absolute bottom-20 flex flex-col items-center gap-4 transition-all duration-1000 delay-700 ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center gap-4 w-48 opacity-20">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500" />
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500" />
        </div>
        <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.5em] drop-shadow-sm">
          DESIGNED BY FARAG ELBERMAWY LTC
        </p>
      </div>

      {/* ECG Line (matching dashboard theme) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path 
            d="M 0 50 L 200 50 L 220 50 L 230 10 L 245 90 L 255 50 L 300 50 L 500 50 L 520 50 L 530 10 L 545 90 L 555 50 L 600 50 L 800 50 L 820 50 L 830 10 L 845 90 L 855 50 L 1000 50"
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="2" 
            className="animate-ecg"
          />
        </svg>
      </div>
    </div>
  );
};

export default SplashScreen;
