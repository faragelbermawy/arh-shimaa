
import React, { useState } from 'react';
import { Lock, Fingerprint, LogIn } from 'lucide-react';

interface AppLockProps {
  onUnlock: () => void;
}

const AppLock: React.FC<AppLockProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const CORRECT_PIN = "2021";

  const checkPin = () => {
    if (pin === CORRECT_PIN) {
      onUnlock();
    } else {
      alert("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkPin();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-slate-900 w-full max-w-md p-10 rounded-[3rem] border border-emerald-500/20 shadow-2xl text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
            <Lock className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-white text-3xl font-black uppercase tracking-tighter">System Protected</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Please enter access pin to proceed</p>
        </div>

        <div className="space-y-6">
          <input 
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl p-6 text-center text-white text-4xl tracking-[1em] font-black outline-none transition-all placeholder:text-slate-800"
            placeholder="••••"
            maxLength={4}
            autoFocus
          />

          <button 
            onClick={checkPin}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
          >
            <LogIn className="w-5 h-5" /> Login
          </button>
        </div>

        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">ARH-LTC Clinical Intelligence Hub</p>
      </div>
    </div>
  );
};

export default AppLock;
