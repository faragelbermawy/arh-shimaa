
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Database, 
  Info, 
  History, 
  Lock, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { gemini } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { AuditRecord, Visitor, UserProgress } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Welcome! I am your clinical AI assistant. I have loaded all local data (audits, visitor logs, and hand hygiene stats). You can ask me anything about this data or infection control protocols.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appData, setAppData] = useState<{ 
    audits: AuditRecord[], 
    visitors: Visitor[],
    progress: UserProgress | null
  }>({ audits: [], visitors: [], progress: null });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check admin status
    const checkAdmin = () => {
      setIsAdmin(sessionStorage.getItem('is_admin_active') === 'true');
    };
    
    checkAdmin();
    const interval = setInterval(checkAdmin, 1000);

    // Load local data using storageService to ensure correct keys and v2 migration
    const audits = storageService.getAudits();
    const visitors = storageService.getVisitors();
    const progress = storageService.getProgress();
    setAppData({ audits, visitors, progress });

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isAdmin) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const context = `
        SYSTEM CONTEXT - LOCAL DATABASE:
        1. Audits History: ${JSON.stringify(appData.audits.map(a => ({ dept: a.department, auditor: a.auditor, score: a.totalScore, date: a.timestamp })))}
        2. Visitor/Staff Registry: ${JSON.stringify(appData.visitors.map(v => ({ name: v.name, dept: v.department, time: v.timestamp })))}
        3. User Clinical Progress:
           - Total Hand Washes: ${appData.progress?.totalHandWashes || 0}
           - Hand Wash Streak: ${appData.progress?.handWashStreak || 0} days
           - Completed Training Modules: ${appData.progress?.completedModules?.join(', ') || 'None'}
           - Quiz Performance: ${JSON.stringify(appData.progress?.quizScores || {})}

        INSTRUCTIONS:
        - Use the specific names and numbers from the lists above to answer the user.
        - Respond in a professional clinical expert tone.
        - ALWAYS respond in English. Arabic is strictly forbidden in your responses.
      `;
      
      const response = await gemini.askAssistant(`${context}\n\nUSER QUESTION: ${userMsg}`);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, an error occurred while processing your request. Please check your internet connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-[calc(100vh-16rem)] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
        <div className="max-w-md w-full text-center space-y-8 p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
           <div className="relative inline-block">
              <div className="bg-slate-900 w-24 h-24 rounded-[2rem] flex items-center justify-center text-white shadow-2xl animate-bounce-slow">
                <Lock className="w-10 h-10 text-emerald-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg ring-4 ring-white">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
           </div>

           <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                Designer <span className="text-emerald-600">Access Only</span>
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">AI Clinical Assistant Preview</p>
              <div className="h-px w-12 bg-slate-100 mx-auto"></div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The interactive AI Assistant and local data analytics are restricted to authorized personnel. 
                <br/><br/>
                Please use the <strong>Admin Lock</strong> in the sidebar with the Designer PIN to enable clinical chat functions.
              </p>
           </div>

           <div className="pt-4">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4 text-left group hover:bg-slate-100 transition-colors">
                 <div className="bg-white p-2.5 rounded-xl shadow-sm">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feature Spotlight</p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">The Assistant analyzes local audits, hygiene trends, and registry logs to provide facility-wide insights.</p>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-3">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                 <ShieldAlert className="w-3.5 h-3.5" /> Clinical Privacy Protection Active
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col animate-in fade-in duration-500">
      <header className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
            <Bot className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Clinical Expert</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Designer Mode Active <span className="text-slate-200 ml-1">|</span> Authorized</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex bg-emerald-50 px-4 py-2 rounded-2xl items-center gap-3 border border-emerald-100 shadow-sm">
          <Database className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700 uppercase">Secure DB Link</span>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/30">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-100'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-5 rounded-3xl flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse border border-slate-100 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Analyzing Clinical Records...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query audits, visitor trends, or hygiene stats..."
              className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-slate-900 text-white p-4 px-6 rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl active:scale-90 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden md:block font-black text-xs uppercase tracking-widest">Query</span>
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Local Intelligence</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Designer Auth Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
