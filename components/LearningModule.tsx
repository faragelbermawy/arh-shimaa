import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Info, 
  CheckCircle, 
  BrainCircuit, 
  ShieldCheck, 
  AlertCircle,
  BookOpen,
  MonitorSmartphone,
  ChevronRight,
  Heart,
  Zap,
  Clock,
  Hand,
  ExternalLink,
  Youtube,
  Check,
  Library,
  ScrollText,
  Bookmark,
  FileDown,
  Image as ImageIcon,
  Loader2,
  Trees,
  Printer,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { MODULES, PPE_DATA, MODULE_STEPS, WHO_5_MOMENTS, BICSL_MANUAL_2025 } from '../constants';
import { ModuleId } from '../types';

const LearningModule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'steps' | 'video'>('steps');
  const [ppeMode, setPpeMode] = useState<'donning' | 'doffing'>('donning');
  const [selectedManualSection, setSelectedManualSection] = useState(BICSL_MANUAL_2025.sections[0].id);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const captureRef = useRef<HTMLDivElement>(null);
  const module = MODULES.find(m => m.id === id);

  if (!module) return <div className="p-8 text-center text-slate-500 font-bold">Module not found</div>;

  const downloadAsPhoto = async () => {
    if (!captureRef.current) return;
    
    setIsCapturing(true);
    // Give state change a moment to settle
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#ffffff',
        logging: false,
        windowWidth: captureRef.current.scrollWidth,
        windowHeight: captureRef.current.scrollHeight,
      });
      
      const link = document.createElement('a');
      link.download = `ARH_LTC_${module.title.replace(/\s+/g, '_')}_Safety_Poster.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Failed to capture photo:', error);
      alert('Failed to generate photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const renderSteps = () => {
    // SPECIAL: General Learning / BICSL Manual View
    if (id === ModuleId.GENERAL_LEARNING) {
      const activeSection = BICSL_MANUAL_2025.sections.find(s => s.id === selectedManualSection) || BICSL_MANUAL_2025.sections[0];
      return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-700">
           <div className={`lg:w-72 space-y-2 ${isCapturing ? 'hidden' : ''}`}>
              <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Table of Contents</h4>
              {BICSL_MANUAL_2025.sections.map((section) => (
                <button 
                  key={section.id}
                  onClick={() => setSelectedManualSection(section.id)}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase transition-all flex items-center justify-between group ${selectedManualSection === section.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedManualSection === section.id ? 'translate-x-1' : 'opacity-20'}`} />
                </button>
              ))}
           </div>

           <div className="flex-1 bg-white p-10 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-12 relative overflow-hidden dark:bg-slate-900 dark:border-white/5">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                 <ScrollText className="w-64 h-64 text-slate-900 dark:text-white" />
              </div>
              <header className="space-y-6 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
                       <Bookmark className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Official Protocol Section</p>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mt-1">{activeSection.title}</h3>
                    </div>
                 </div>
                 <div className="h-0.5 w-24 bg-slate-900 dark:bg-white" />
              </header>
              <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
                 <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-slate-900 dark:first-letter:text-white">
                    {activeSection.content}
                 </p>
              </div>
              <footer className="pt-10 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Permanent Application Resource V3.1</span>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Updated Feb 2025</p>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white">ARH-LTC Official Manual</p>
                 </div>
              </footer>
           </div>
        </div>
      );
    }

    // Default Procedures Tab (Modified for Visitor Education)
    const steps = MODULE_STEPS[id] || [];
    const isVisitorModule = id === ModuleId.VISITOR_EDUCATION;

    if (isVisitorModule) {
      return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 ${isCapturing ? 'hidden' : ''}`}>
             <div className="flex items-center gap-3">
               <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  <Check className="w-6 h-6 text-emerald-700 dark:text-emerald-400" strokeWidth={3} />
               </div>
               <div>
                  <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Visitor Protocol | خطوات الزائرين</h4>
               </div>
             </div>
             <div className="flex flex-wrap gap-3">
               <button 
                 onClick={downloadAsPhoto}
                 disabled={isCapturing}
                 className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
               >
                  {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Download Photo
               </button>
             </div>
          </div>

          {/* VISITOR SAFETY POSTER (The "Downloaded Photo" view) */}
          <div 
            ref={captureRef}
            className={`bg-white dark:bg-slate-950 rounded-[3.5rem] p-8 md:p-12 border-4 border-emerald-600/20 shadow-2xl relative overflow-hidden transition-all duration-700 ${isCapturing ? 'p-16 border-emerald-600' : ''}`}
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
               <Trees className="w-64 h-64 text-emerald-600" />
            </div>

            <div className="relative z-10 space-y-12">
               {/* Poster Header */}
               <div className="flex flex-col items-center text-center space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-xl">
                        <Trees className="w-8 h-8 text-white" />
                     </div>
                     <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-emerald-600">ARH-LTC</h1>
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Family & Visitor Guide</h2>
                     <h2 className="text-xl md:text-3xl font-black text-emerald-600 font-arabic">إرشادات السلامة للزوار والعائلات</h2>
                  </div>
                  <div className="h-1.5 w-32 bg-emerald-600 rounded-full" />
               </div>

               {/* Poster Content Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                  {steps.map((step, i) => {
                     const StepIcon = step.icon || ShieldCheck;
                     // Distinct colors for each step sign
                     const stepColors = [
                       'bg-blue-600 shadow-blue-900/20',
                       'bg-emerald-600 shadow-emerald-900/20',
                       'bg-amber-600 shadow-amber-900/20',
                       'bg-purple-600 shadow-purple-900/20'
                     ];
                     const colorClass = stepColors[i % stepColors.length];
                     
                     return (
                        <div 
                          key={i} 
                          className="flex gap-6 items-start p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/10 group"
                        >
                           <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] ${colorClass} flex items-center justify-center text-white shrink-0 shadow-xl group-hover:scale-110 transition-transform`}>
                              <StepIcon className="w-8 h-8 md:w-10 md:h-10" />
                              {/* Step Number Badge */}
                              <div className="absolute -top-3 -left-3 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-white/10">
                                 <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{i + 1}</span>
                              </div>
                           </div>
                           <div className="flex-1 space-y-4">
                              <div className="space-y-1">
                                 <h4 className="font-black text-slate-900 dark:text-white text-base md:text-lg uppercase tracking-tight">{step.en}</h4>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">{step.descEn}</p>
                              </div>
                              <div className="text-right font-arabic pt-2 border-t border-slate-100 dark:border-white/5" dir="rtl">
                                 <h4 className="font-black text-slate-900 dark:text-white text-base md:text-lg">{step.ar}</h4>
                                 <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">{step.descAr}</p>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Message to Families Section */}
               <div className="mt-12 p-8 rounded-[3.5rem] bg-emerald-600/5 border border-emerald-600/10 text-center space-y-6 relative overflow-hidden">
                  <div className="flex flex-col items-center gap-2">
                     <Heart className="w-10 h-10 text-emerald-600 animate-pulse" />
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">A Message to Families</h3>
                     <h3 className="text-xl font-black text-emerald-600 font-arabic">رسالة للعائلات</h3>
                  </div>
                  <div className="space-y-4 max-w-2xl mx-auto">
                     <p className="text-sm md:text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                        Following these protocols is the highest form of love for your family's safety.
                     </p>
                     <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 font-arabic leading-relaxed" dir="rtl">
                        اتباع هذه الإجراءات هو أسمى صور الحب والحرص على سلامة عائلتك.
                     </p>
                  </div>
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600/20" />
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600/20" />
               </div>

               {/* Poster Footer */}
               <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="w-5 h-5 text-emerald-600" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Safety Protocol • Clinical Hub</p>
                  </div>
                  <div className="text-center md:text-right">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-1">DESIGNED BY FARAG ELBERMAWY LTC</p>
                     <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ARH-LTC Operational Intel Hub V3.1</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      );
    }

    if (id === ModuleId.PPE_PROTOCOLS) {
      const donningSteps = steps.filter(step => (step.en?.toLowerCase() || '').includes('donning'));
      const doffingSteps = steps.filter(step => (step.en?.toLowerCase() || '').includes('doffing'));
      const signsSteps = steps.filter(step => !(step.en?.toLowerCase() || '').includes('donning') && !(step.en?.toLowerCase() || '').includes('doffing'));

      const renderStepCategory = (title: string, categorySteps: typeof steps) => (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase mb-6">{title}</h4>
          <div className="grid grid-cols-1 gap-4">
            {categorySteps.map((step, i) => (
              <div key={i} className="p-5 rounded-[1.8rem] border border-slate-100 dark:border-white/5 flex gap-5 items-center">
                {step.icon && (
                  <div className={`w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 shadow-md group overflow-hidden relative`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 opacity-30" />
                    <step.icon className={`w-8 h-8 ${step.iconColor || 'text-slate-300'} relative z-10`} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight">{step.en.replace(/Donning: |Doffing: /g, '')}</h5>
                    <h5 className="font-black text-slate-800 dark:text-white text-base font-arabic" dir="rtl">{step.ar.replace(/الارتداء: |الخلع: /g, '')}</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">{step.descEn}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed font-arabic text-right" dir="rtl">{step.descAr}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      return (
        <div className="space-y-8 animate-in fade-in duration-500">
          {renderStepCategory('Donning (Entry)', donningSteps)}
          {renderStepCategory('Doffing (Exit)', doffingSteps)}
          {signsSteps.length > 0 && renderStepCategory('Simple Signs of Failure', signsSteps)}
        </div>
      );
    }

    // Default Procedures View for other modules
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 gap-4 md:gap-5">
          {steps.map((step, i) => (
            <div 
              key={i} 
              className="p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-5 items-center group hover:shadow-xl transition-all border-l-4 bg-white dark:bg-slate-900 border-l-slate-200"
            >
              {step.img ? (
                <div className="w-full md:w-40 h-24 md:h-32 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/5">
                   <img src={step.img} className="w-full h-full object-cover" alt={step.en} />
                </div>
              ) : step.icon && (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 shadow-md group overflow-hidden relative`}>
                   <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 opacity-30" />
                   <step.icon className={`w-7 h-7 md:w-8 md:h-8 ${step.iconColor || 'text-slate-300'} group-hover:scale-110 transition-all duration-500 relative z-10 drop-shadow-sm`} />
                </div>
              )}
              <div className="flex-1 space-y-4 w-full">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-1">
                      <h5 className="font-black text-slate-800 dark:text-white text-sm md:text-base uppercase tracking-tight">{step.en}</h5>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-semibold leading-relaxed">{step.descEn}</p>
                    </div>
                    <div className="text-right font-arabic space-y-1" dir="rtl">
                      <h5 className="font-black text-slate-800 dark:text-white text-sm md:text-base">{step.ar}</h5>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-semibold leading-relaxed">{step.descAr}</p>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
           <div className={`${module.color} w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-xl`}>
              <module.icon className="w-6 h-6 md:w-9 md:h-9" />
           </div>
           <div>
              <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">{module.title}</h2>
              <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Clinical Excellence Path</p>
           </div>
        </div>
        <button 
          onClick={() => navigate(`/quiz/${module.id}`)} 
          className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
        >
          <BrainCircuit className="w-5 h-5" /> TAKE EXAM
        </button>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 md:p-1.5 rounded-xl md:rounded-full shadow-inner">
        {[
          { id: 'info', label: 'Info', icon: Info }, 
          { id: 'steps', label: id === ModuleId.GENERAL_LEARNING ? 'Manual' : 'Procedures', icon: id === ModuleId.GENERAL_LEARNING ? Library : CheckCircle }, 
          { id: 'video', label: 'Video', icon: Play }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg md:rounded-full font-black text-[10px] md:text-xs transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'steps' && renderSteps()}
        {activeTab === 'info' && (
          <div className="animate-in fade-in duration-500">
             <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex items-start gap-6">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                      <Info className="w-6 h-6 text-blue-600" />
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Clinical Standards</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg font-medium leading-relaxed">Evidence-based protocols following WHO and GDIPC guidelines for MDRO prevention in healthcare facilities. This module ensures all personnel and visitors maintain the highest levels of safety and transmission control.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                         <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> GDIPC V3.1 Compliant
                         </div>
                         <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                            <Clock className="w-4 h-4 text-blue-500" /> Updated Feb 2025
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {activeTab === 'video' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            {module.videoUrl ? (
              <div className="space-y-8">
                <div className="relative aspect-video w-full overflow-hidden rounded-[3rem] shadow-2xl bg-black border-4 border-slate-100 dark:border-white/5">
                   <iframe 
                      src={module.videoUrl} 
                      title="Training Video"
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                   ></iframe>
                </div>
                {module.displayVideoUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">External Media Player</p>
                    <a 
                      href={module.displayVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-4 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95"
                    >
                      <Youtube className="w-6 h-6" />
                      Open Full Experience
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 md:py-40 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-white/10">
                 <Play className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                 <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs md:text-sm">Cinematic Modules Pending</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningModule;