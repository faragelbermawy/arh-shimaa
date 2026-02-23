
import { FileDown, ArrowLeft, CheckCircle, ShieldCheck, Eye, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { MODULE_STEPS } from '../constants';
import { ModuleId } from '../types';

const VisitorPdfViewer: React.FC = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);

  /**
   * Simple English text wrapping.
   */
  const wrapText = (text: string, maxChars: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = "";

    words.forEach(word => {
      if ((currentLine + word).length > maxChars) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  };

  /**
   * Adds a step card.
   */
  const addStep = (doc: jsPDF, enTitle: string, enDesc: string, y: number) => {
    const cardWidth = 180;
    const cardX = 15;
    const padding = 10;

    const enLines = doc.splitTextToSize(enDesc, cardWidth - (padding * 2));
    const textHeight = (enLines.length * 5) + 8; 
    const cardHeight = textHeight + 15;

    if (y + cardHeight > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 3, 3, 'FD');

    // English Side
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(enTitle, cardX + padding, y + padding + 1);
    
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFontSize(8.5); 
    doc.setFont('helvetica', 'normal');
    doc.text(enLines, cardX + padding, y + padding + 8, { lineHeightFactor: 1.15 });

    return y + cardHeight + 4; 
  };

  const generatePDF = (mode: 'download' | 'open' = 'download') => {
    const doc = new jsPDF();
    const steps = MODULE_STEPS[ModuleId.VISITOR_EDUCATION] || [];

    // Header
    doc.setFillColor(22, 101, 52); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ARH-LTC MDRO HUB', 15, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('MANDATORY VISITOR SAFETY PROTOCOLS', 15, 27);

    // Subheader
    let y = 55;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Safety Guidelines', 15, y);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 5, 195, y + 5);

    y += 12;
    steps.forEach((step, i) => {
      y = addStep(doc, `${i + 1}. ${step.en}`, step.descEn, y);
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Clinical Persistence Resource - Almoosa Health Group. Generated via Digital Intelligence Node.', 15, 290);
    doc.text(`Doc ID: ${Date.now().toString().slice(-10)}`, 195, 290, { align: 'right' });

    if (mode === 'download') {
      doc.save('ARH_Visitor_Safety_Guide.pdf');
    } else {
      const string = doc.output('bloburl');
      window.open(string, '_blank');
    }
    
    setIsGenerating(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => generatePDF('download'), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-1000 px-6">
      <div className="relative group">
        <div className={`w-44 h-44 rounded-[4rem] border-8 border-emerald-500/10 border-t-emerald-600 transition-all duration-1000 ${isGenerating ? 'animate-spin' : 'rotate-12 shadow-2xl shadow-emerald-500/20'}`} />
        {!isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-700">
            <div className="bg-emerald-600 p-8 rounded-[3.5rem] shadow-2xl">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-emerald-500 animate-pulse" />
          </div>
        )}
      </div>

      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
          {isGenerating ? 'Symmetrizing Guide' : 'Guide Verified'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-xl leading-relaxed">
          {isGenerating 
            ? 'Aligning Arabic and English typography for identical optical scaling and symmetrical spacing...' 
            : 'Your high-fidelity bilingual safety protocols are ready for official distribution.'}
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => generatePDF('download')}
            className="bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-700 transition-all active:scale-95 border-b-4 border-emerald-800"
          >
            <FileDown className="w-5 h-5" />
            Download
          </button>
          <button 
            onClick={() => generatePDF('open')}
            className="bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95 border-b-4 border-black"
          >
            <Eye className="w-5 h-5" />
            Open View
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-6 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Hub Dashboard
        </button>
      </div>

      <div className="pt-6 flex flex-col items-center gap-4 opacity-40">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Clinical Protocol Balance v3.2</span>
        </div>
      </div>
    </div>
  );
};

export default VisitorPdfViewer;
