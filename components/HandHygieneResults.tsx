import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { FileText, Calendar, Share2, Activity, Trash2, Loader2, TrendingUp, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HandHygieneResults: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('hand_hygiene_reports') || '[]');
    setReports(saved);
  }, []);

  const momentLabels = [
    'Before Patient',
    'Before Aseptic',
    'After Fluid',
    'After Patient',
    'After Surround'
  ];

  // حساب متوسط الأداء الكلي لكل لحظة عبر جميع التقارير
  const aggregateData = [
    { name: 'M1', rate: reports.reduce((acc, r) => acc + (r.stats?.[0]?.rate || 0), 0) / (reports.length || 1) },
    { name: 'M2', rate: reports.reduce((acc, r) => acc + (r.stats?.[1]?.rate || 0), 0) / (reports.length || 1) },
    { name: 'M3', rate: reports.reduce((acc, r) => acc + (r.stats?.[2]?.rate || 0), 0) / (reports.length || 1) },
    { name: 'M4', rate: reports.reduce((acc, r) => acc + (r.stats?.[3]?.rate || 0), 0) / (reports.length || 1) },
    { name: 'M5', rate: reports.reduce((acc, r) => acc + (r.stats?.[4]?.rate || 0), 0) / (reports.length || 1) },
  ];

  const downloadPDF = async (report: any) => {
    setExportingId(report.id);
    try {
      const doc = new jsPDF();

      // عنوان التقرير
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // اللون الزمردي
      doc.text("HAND HYGIENE COMPLIANCE REPORT", 105, 20, { align: "center" });

      // تفاصيل التقرير
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Report ID: ${report.id}`, 20, 40);
      doc.text(`Date: ${report.date}`, 20, 50);
      doc.text(`Overall Compliance: ${report.overall}%`, 20, 60);

      // جدول اللحظات الخمس (5 Moments)
      autoTable(doc, {
        startY: 70,
        head: [['Moment', 'Description', 'Compliance Rate']],
        body: [
          ['Moment 1', 'Before touching a patient', `${report.stats?.[0]?.rate || 0}%`],
          ['Moment 2', 'Before clean/aseptic procedures', `${report.stats?.[1]?.rate || 0}%`],
          ['Moment 3', 'After body fluid exposure risk', `${report.stats?.[2]?.rate || 0}%`],
          ['Moment 4', 'After touching a patient', `${report.stats?.[3]?.rate || 0}%`],
          ['Moment 5', 'After touching patient surroundings', `${report.stats?.[4]?.rate || 0}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      // حفظ الملف
      doc.save(`Hand_Hygiene_Report_${report.id}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingId(null);
    }
  };

  const deleteReport = (reportId: string) => {
    const designerCode = "2231994"; // الكود السري الموحد الخاص بك كمصمم
    const userInput = prompt("Designer Authorization Required. Enter Access Code:");

    if (userInput === designerCode) {
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('hand_hygiene_reports', JSON.stringify(updatedReports));
      alert("Report deleted successfully by Designer.");
    } else if (userInput !== null) {
      alert("Unauthorized! Only the Designer can delete reports.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6 pb-24 rounded-[2.5rem] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 bg-white/5 p-4 rounded-3xl border border-white/10">
        <FileText className="text-emerald-400" />
        <h1 className="text-xl font-bold uppercase tracking-tight">Compliance Dashboard</h1>
      </div>

      {/* 1. Global Performance Trend */}
      {reports.length > 0 && (
        <div className="bg-[#161d31] rounded-[2.5rem] p-6 border border-white/5 mb-10 shadow-2xl">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" /> GLOBAL COMPLIANCE TREND
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px'}}
                  itemStyle={{color: '#10b981'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#161d31'}} 
                  activeDot={{r: 8, strokeWidth: 0}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 text-center uppercase font-bold tracking-widest">
            Average performance across all {reports.length} audits
          </p>
        </div>
      )}

      {/* 2. Individual Audit Archive */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Individual Audit Archive</h2>
        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-bold">
          {reports.length} TOTAL
        </span>
      </div>

      <div className="space-y-8">
        {reports.length === 0 ? (
          <div className="bg-[#161d31] rounded-[2rem] p-10 border border-white/5 text-center">
            <p className="text-gray-500 italic">No reports found. Complete an audit first.</p>
          </div>
        ) : (
          reports.map((rep) => {
            const chartData = rep.stats.map((s: any, i: number) => ({
              name: `M${i + 1}`,
              full: momentLabels[i],
              rate: s.rate
            }));

            return (
              <div 
                key={rep.id} 
                id={rep.id}
                className="bg-[#161d31] rounded-[2rem] p-6 border border-white/5 shadow-2xl relative"
              >
                <button 
                  onClick={() => deleteReport(rep.id)}
                  className="absolute top-6 right-6 bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white p-3 rounded-2xl border border-rose-500/20 transition-all active:scale-95 group"
                  title="Designer Only"
                >
                  <Trash2 size={18} className="group-hover:animate-pulse" />
                </button>

                <div className="flex justify-between items-start mb-8 pr-10">
                  <div>
                    <p className="text-emerald-400 text-[10px] font-black mb-1 flex items-center gap-2">
                      <Calendar size={12} /> {rep.date} | {rep.time} | {rep.id}
                    </p>
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Summary Report</h2>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-black ${rep.overall >= 80 ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {rep.overall}%
                    </span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Compliance Rate</p>
                  </div>
                </div>

                {/* Individual Chart Section */}
                <div className="h-48 w-full mb-8 bg-black/20 rounded-3xl p-4 border border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 mb-4 flex items-center gap-2">
                    <Activity size={12} /> PERFORMANCE BREAKDOWN
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        cursor={{fill: '#ffffff05'}}
                        contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px'}}
                      />
                      <Bar dataKey="rate" radius={[4, 4, 4, 4]} barSize={24}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.rate >= 80 ? '#10b981' : entry.rate > 0 ? '#f59e0b' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Five Moments Details */}
                <div className="space-y-2 mb-8">
                  {chartData.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-500">{m.name}</span>
                        <span className="text-xs font-bold text-gray-200">{m.full}</span>
                      </div>
                      <span className={`text-xs font-black ${m.rate >= 80 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {m.rate}%
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => downloadPDF(rep)}
                  disabled={exportingId === rep.id}
                  className="w-full bg-white/5 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 group"
                >
                  {exportingId === rep.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                  )}
                  {exportingId === rep.id ? 'GENERATING PDF...' : 'DOWNLOAD PDF REPORT'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HandHygieneResults;
