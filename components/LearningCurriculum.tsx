import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  LayoutGrid,
  TrendingUp,
  Award
} from 'lucide-react';
import { MODULES } from '../constants';
import { UserProgress } from '../types';
import { storageService } from '../services/storageService';

const LearningCurriculum: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress>(storageService.getProgress());

  useEffect(() => {
    const load = () => setProgress(storageService.getProgress());
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalModules = MODULES.length;
  const completedCount = progress.completedModules.length;
  const completionRate = Math.round((completedCount / totalModules) * 100);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-10">
        <div className="space-y-2">
          <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em]">Clinical Academy</span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Learning Path</h1>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-white/5" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * completionRate) / 100} className="text-emerald-500" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-emerald-600">{completionRate}%</div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Progress</p>
            <p className="text-2xl font-black">{completedCount} / {totalModules} Modules</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isCompleted = progress.completedModules.includes(mod.id);
          const score = progress.quizScores[mod.id];
          
          return (
            <button 
              key={mod.id} 
              onClick={() => navigate(`/learning/${mod.id}`)} 
              className={`group p-8 rounded-[3rem] border text-left transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between h-full ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-white/5'}`}
            >
              <div className="space-y-6">
                <div className={`${mod.color} w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-110`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter leading-tight group-hover:text-emerald-600 transition-colors">{mod.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{mod.shortDesc}</p>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                {isCompleted ? (
                   <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                      <CheckCircle2 className="w-4 h-4" /> Certified
                   </div>
                ) : (
                   <span className="text-[10px] font-black text-slate-300 uppercase">Not Started</span>
                )}
                {score !== undefined && (
                   <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">{score}% Score</div>
                )}
              </div>
            </button>
          );
        })}
      </section>

      <section className="bg-emerald-600 p-10 md:p-14 rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-emerald-900/20">
         <div className="bg-white/20 p-6 rounded-[2rem] backdrop-blur-md">
            <Award className="w-12 h-12" />
         </div>
         <div className="flex-1 text-center md:text-left space-y-4">
            <h4 className="text-3xl font-black uppercase tracking-tighter">Advanced Certification</h4>
            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-2xl">Complete all modules with an aggregate score above 85% to receive the official ARH-LTC MDRO Node Mastery Accreditation.</p>
         </div>
         <button className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">My Rewards</button>
      </section>
    </div>
  );
};

export default LearningCurriculum;