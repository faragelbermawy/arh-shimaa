
import React, { useState, useEffect } from 'react';
import { Timer, Hand, CheckCircle, Bell, History, PartyPopper } from 'lucide-react';
import { UserProgress } from '../types';

const Reminders: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      handleWashComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const handleWashComplete = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    
    setHistory(prev => [timeStr, ...prev].slice(0, 5));
    setTotalToday(t => t + 1);

    const saved = localStorage.getItem('mdro_user_progress');
    // Fix: Ensure all UserProgress fields are initialized correctly
    let progress: UserProgress = saved ? JSON.parse(saved) : {
      completedModules: [],
      quizScores: {},
      handWashStreak: 0,
      lastHandWash: '',
      totalHandWashes: 0,
      ppeDonningCount: 0,
      ppeDoffingCount: 0
    };

    progress.totalHandWashes = (progress.totalHandWashes || 0) + 1;

    const lastWash = progress.lastHandWash;
    if (lastWash !== dateStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastWash === yesterdayStr) progress.handWashStreak += 1;
      else progress.handWashStreak = 1;
      
      progress.lastHandWash = dateStr;
    }

    localStorage.setItem('mdro_user_progress', JSON.stringify(progress));
  };

  const startWashing = () => {
    setSeconds(20);
    setIsActive(true);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Timer className="text-blue-600 w-6 h-6" />
            </div>
            Hygiene Tracker
          </h2>
          <p className="text-slate-500">Track and log your hand hygiene moments.</p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 border border-green-200">
          <PartyPopper className="w-4 h-4" /> {totalToday} Today
        </div>
      </header>

      <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 text-center space-y-10">
        <div className="relative inline-block">
          <div className={`w-56 h-56 rounded-full border-8 transition-all duration-500 flex items-center justify-center ${isActive ? 'border-blue-600 animate-pulse shadow-2xl shadow-blue-100' : 'border-slate-50 shadow-inner'}`}>
            {isActive ? (
              <div className="text-6xl font-black text-blue-600">{seconds}s</div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-full">
                <Hand className="w-20 h-20 text-slate-200" />
              </div>
            )}
          </div>
          {isActive && (
             <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-4 rounded-full shadow-xl">
                <PartyPopper className="w-6 h-6 animate-bounce" />
             </div>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <h3 className="text-3xl font-black text-slate-800 mb-3">Hand Washing Timer</h3>
          <p className="text-slate-400 font-medium leading-relaxed">Ensuring a full 20-second wash is critical for killing hospital-acquired pathogens and protecting patients.</p>
        </div>

        <button
          onClick={startWashing}
          disabled={isActive}
          className="w-full max-w-sm mx-auto bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-95 group"
        >
          {isActive ? 'Washing in Progress...' : 'Start 20s Wash'}
          {!isActive && <Hand className="w-7 h-7 group-hover:rotate-12 transition-transform" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-orange-100 p-2.5 rounded-2xl">
               <Bell className="text-orange-600 w-5 h-5" />
             </div>
             <h4 className="font-black text-slate-800">Smart Reminders</h4>
          </div>
          <div className="space-y-4 text-sm font-bold">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-600">Pre-shift Check</span> 
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">Active</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-600">Post-Patient Care</span> 
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">Active</span>
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-blue-100 p-2.5 rounded-2xl">
               <History className="text-blue-600 w-5 h-5" />
             </div>
             <h4 className="font-black text-slate-800">Recent Sessions</h4>
          </div>
          <div className="space-y-3">
            {history.length > 0 ? history.map((time, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-blue-50/30 rounded-2xl border border-blue-50 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Verified Wash</p>
                  <p className="text-[10px] text-slate-400 font-bold">{time}</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
