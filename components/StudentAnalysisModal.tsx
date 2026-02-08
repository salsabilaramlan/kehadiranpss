import React, { useMemo } from 'react';
import { X, Sparkles, Calendar, TrendingUp, Clock, Award } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  data: AttendanceRecord[];
}

export const StudentAnalysisModal: React.FC<StudentAnalysisModalProps> = ({ isOpen, onClose, studentName, data }) => {
  if (!isOpen) return null;

  // --- ANALYTICS LOGIC ---
  const stats = useMemo(() => {
    // Filter records for this student
    const records = data.filter(r => 
      r.nama.toLowerCase().includes(studentName.toLowerCase()) || 
      studentName.toLowerCase().includes(r.nama.toLowerCase())
    );

    // Sort by date desc
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 1. Total Attendance (Unique Days)
    const uniqueDays = new Set(
        records
        .filter(r => r.status !== AttendanceStatus.TIDAK_HADIR)
        .map(r => new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }))
    );
    const totalDays = uniqueDays.size;

    // 2. Monthly Distribution
    const monthlyCounts: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize
    months.forEach(m => monthlyCounts[m] = 0);

    records.forEach(r => {
        if (r.status !== AttendanceStatus.TIDAK_HADIR) {
            const date = new Date(new Date(r.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
            const monthIdx = date.getMonth();
            const key = months[monthIdx];
            // Simple count for chart (not de-duped per day for chart smoothness, or can be if strictly needed)
            monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        }
    });

    const chartData = months.map(m => ({ name: m, hadir: monthlyCounts[m] }));

    // 3. AI Insight Generation
    let aiInsight = "";
    const reliability = totalDays;
    
    if (reliability > 30) {
        aiInsight = "🌟 Prestasi Luar Biasa! Pelajar ini adalah aset utama PSS dengan rekod kehadiran yang sangat konsisten. Berpotensi dicalonkan untuk Anugerah Tokoh Nilam.";
    } else if (reliability > 15) {
        aiInsight = "✨ Sangat Baik. Menunjukkan komitmen yang tinggi dalam menjalankan tugas. Teruskan momentum ini.";
    } else if (reliability > 5) {
        aiInsight = "👍 Prestasi Sederhana. Hadir bertugas tetapi boleh ditingkatkan lagi kekerapan untuk menjadi lebih mahir.";
    } else {
        aiInsight = "⚠️ Perlu Perhatian. Kehadiran agak rendah. Disarankan untuk diberi motivasi atau peringatan jadual bertugas.";
    }

    // Check Recency
    if (records.length > 0) {
        const lastRec = new Date(records[0].timestamp);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - lastRec.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 30) aiInsight += " Analisis mengesan tiada rekod kehadiran dalam 30 hari terakhir (MIA).";
        else if (diffDays < 3) aiInsight += " Baru sahaja bertugas minggu ini. Aktif.";
    }

    return { totalDays, chartData, aiInsight, recentRecords: records.slice(0, 5) };
  }, [studentName, data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg"><TrendingUp className="w-5 h-5" /></span>
                    Analisis Prestasi
                </h2>
                <p className="text-slate-500 text-sm mt-1">Laporan terperinci untuk <span className="font-bold text-slate-700">{studentName}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* AI Insight Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles className="w-24 h-24 text-indigo-600" /></div>
                <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> AI Summary
                </h3>
                <p className="text-slate-700 leading-relaxed font-medium relative z-10">
                    "{stats.aiInsight}"
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase">Jumlah Hari Hadir</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalDays}</p>
                </div>
                 <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-slate-400 text-xs font-bold uppercase">Ketepatan Masa</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">---%</p>
                </div>
            </div>

            {/* Monthly Chart */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Tren Tahunan
                </h4>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                             <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                             <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                cursor={{fill: '#f1f5f9'}}
                             />
                             <Bar dataKey="hadir" radius={[4, 4, 0, 0]}>
                                {stats.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.hadir > 0 ? '#4f46e5' : '#e2e8f0'} />
                                ))}
                             </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent History */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" /> Log Terkini
                </h4>
                <div className="space-y-2">
                    {stats.recentRecords.length > 0 ? (
                        stats.recentRecords.map((rec) => (
                            <div key={rec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${rec.status === AttendanceStatus.HADIR ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <span className="font-medium text-slate-700">
                                        {new Date(rec.timestamp).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <span className="text-slate-500 text-xs">
                                    {new Date(rec.timestamp).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 italic text-sm">Tiada rekod dijumpai.</p>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
