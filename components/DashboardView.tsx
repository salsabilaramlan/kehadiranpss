import React, { useMemo, useState } from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { SCHOOL_NAME, TOTAL_STUDENTS, STUDENT_MASTER_LIST } from '../constants';
import { AgentCard } from './AgentCard';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Share2, Zap, User, Search, Calendar, Nfc, Database, ShieldCheck, Radio, CheckCircle2 } from 'lucide-react';
import { StudentAnalysisModal } from './StudentAnalysisModal';
import { AttendanceTable } from './AttendanceTable';

interface DashboardViewProps {
  data: AttendanceRecord[];
}

// Helper untuk dapatkan tarikh string Malaysia (dd/mm/yyyy) untuk perbandingan mudah
const getMYDateString = (dateInput: Date | string) => {
  return new Date(dateInput).toLocaleDateString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Helper untuk dapatkan unique date key (YYYY-MM-DD)
const getUniqueDateKey = (dateInput: Date | string) => {
    return new Date(dateInput).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kuala_Lumpur'
    });
};

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toUpperCase();

export const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  // Masa Semasa di Malaysia
  const now = new Date();
  const todayStr = getMYDateString(now); // Contoh: "24/02/2025"

  // Dapatkan Bulan & Tahun Malaysia
  // Kita buat objek Date yang "shifted" ke waktu Malaysia untuk guna getMonth() standard
  const myTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const currentMonth = myTime.getMonth(); 
  const currentYear = myTime.getFullYear();
  const currentMonthName = myTime.toLocaleString('ms-MY', { month: 'long' });

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'MIA'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // --- ANALYTICS LOGIC ---
  const analytics = useMemo(() => {
    // 1. Map data sebenar kepada nama pelajar
    const dataByName = new Map<string, AttendanceRecord[]>();
    
    data.forEach(record => {
      const matchedMasterName = STUDENT_MASTER_LIST.find(
        master => normalizeName(master) === normalizeName(record.nama)
      );
      const key = matchedMasterName || record.nama;
      
      if (!dataByName.has(key)) {
        dataByName.set(key, []);
      }
      dataByName.get(key)?.push(record);
    });

    // 2. Bina Profil Ejen
    const agents = STUDENT_MASTER_LIST.map((masterName) => {
      const records = dataByName.get(masterName) || [];
      
      // Analisis Bulanan (Bulan Semasa - ikut Waktu Malaysia)
      const thisMonthRecords = records.filter(r => {
        // Convert rekod timestamp ke masa Malaysia sebelum check bulan
        const d = new Date(new Date(r.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      // Kira Kehadiran Unik (Hari) - Sepanjang Masa
      const uniqueDaysTotal = new Set<string>();
      records.forEach(r => {
          if (r.status !== AttendanceStatus.TIDAK_HADIR) {
             uniqueDaysTotal.add(getUniqueDateKey(r.timestamp));
          }
      });

      // Kira Kehadiran Unik (Hari) - Bulan Ini
      const uniqueDaysMonth = new Set<string>();
      thisMonthRecords.forEach(r => {
          if (r.status !== AttendanceStatus.TIDAK_HADIR) {
             uniqueDaysMonth.add(getUniqueDateKey(r.timestamp));
          }
      });

      // Cari rekod terakhir & Status Hari Ini
      let lastSeen = 'Never';
      let statusToday: AttendanceStatus | 'ABSENT' = 'ABSENT';
      
      if (records.length > 0) {
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        lastSeen = records[0].timestamp;
        const latestRecord = records[0];
        
        // Check status hari ini dengan tepat (Compare String Date Malaysia)
        const recordDate = getMYDateString(latestRecord.timestamp);
        if (recordDate === todayStr) {
          statusToday = latestRecord.status;
        }
      }

      return {
        name: masterName,
        totalPresence: uniqueDaysTotal.size, // Menggunakan bilangan hari unik
        monthlyCount: uniqueDaysMonth.size, // Menggunakan bilangan hari unik
        lastSeen,
        statusToday,
        rank: 0
      };
    });

    // 3. RANKING SYSTEM (Berdasarkan Total Kehadiran Terkumpul)
    agents.sort((a, b) => {
      if (b.totalPresence !== a.totalPresence) {
        return b.totalPresence - a.totalPresence;
      }
      return b.monthlyCount - a.monthlyCount; // Tie breaker: Bulan ini
    });
    
    agents.forEach((a, i) => a.rank = i + 1);

    const activeCount = agents.filter(a => a.statusToday !== 'ABSENT').length;
    const miaAgents = agents.filter(a => a.lastSeen === 'Never');
    const activeAgents = agents.filter(a => a.lastSeen !== 'Never');

    // Kira kehadiran bulan ini secara keseluruhan (Sum of unique daily attendances)
    const totalMonthPresence = agents.reduce((acc, curr) => acc + curr.monthlyCount, 0);

    return { agents, activeCount, miaAgents, activeAgents, totalMonthPresence };
  }, [data, todayStr, currentMonth, currentYear]);

  // --- UI HELPERS ---
  const displayedAgents = useMemo(() => {
    if (filter === 'ACTIVE') return analytics.activeAgents;
    if (filter === 'MIA') return analytics.miaAgents;
    return analytics.agents;
  }, [analytics, filter]);

  const copyReport = () => {
    // Tarikh Laporan Format Malaysia (e.g., Isnin, 24 Februari 2025)
    const reportDate = new Date().toLocaleDateString('ms-MY', { 
      timeZone: 'Asia/Kuala_Lumpur',
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const online = analytics.agents.filter(a => a.statusToday !== 'ABSENT').map(a => `✅ ${a.name}`);
    const report = `*LAPORAN HARIAN PSS* 
📅 ${reportDate}
📊 Bertugas Hari Ini: ${analytics.activeCount}

*SENARAI NAMA:*
${online.length > 0 ? online.join('\n') : '(Tiada murid bertugas setakat ini)'}

_Generated by e-PSS System_`;
    navigator.clipboard.writeText(report);
    alert("Laporan disalin! Boleh paste di WhatsApp.");
  };

  const pieData = [
    { name: 'Hadir', value: analytics.activeCount, color: '#3b82f6' },
    { name: 'Tidak Hadir', value: TOTAL_STUDENTS - analytics.activeCount, color: '#e2e8f0' }
  ];

  const recentData = useMemo(
    () => [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
    [data]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Rekod individu */}
      <StudentAnalysisModal 
        isOpen={!!selectedStudent}
        studentName={selectedStudent || ""}
        data={data}
        onClose={() => setSelectedStudent(null)}
      />

      {/* INNOVATION HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 text-white shadow-2xl shadow-blue-950/20">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative p-6 md:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-300/20 text-cyan-200 text-xs font-bold uppercase tracking-[0.2em]">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Sistem Inovasi PSS
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight">e-PSS NFC</h1>
            <p className="mt-2 text-cyan-100 font-semibold">Sistem Kehadiran Pengawas PSS Berasaskan NFC</p>
            <p className="mt-3 text-sm text-slate-300 max-w-2xl leading-relaxed">{SCHOOL_NAME} mengubah rekod kehadiran manual kepada pemantauan digital masa nyata yang pantas, telus dan berasaskan data sebenar.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Sentuh NFC', 'Rekod Automatik', 'Analitik Masa Nyata'].map(label => (
                <span key={label} className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" /> {label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Nfc, label: 'NFC', value: 'Sentuh' },
              { icon: Database, label: 'Sumber', value: 'Apps Script' },
              { icon: ShieldCheck, label: 'Integriti', value: 'Disahkan' }
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                <item.icon className="w-6 h-6 text-cyan-300 mx-auto" />
                <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="text-xs font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 1: METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* OPERATIONAL STATUS (DAILY) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2 relative z-10">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Harian</h3>
             <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{todayStr}</span>
          </div>
          
          <div className="flex items-center gap-6 mt-2">
            <div className="w-24 h-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={35}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{analytics.activeCount}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pengawas Bertugas</p>
              <button 
                onClick={copyReport}
                className="mt-3 flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Share2 className="w-3 h-3 mr-1.5" />
                Salin
              </button>
            </div>
          </div>
        </div>

        {/* MONTHLY STATS */}
        <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
          <div className="absolute right-0 top-0 p-4 opacity-10">
             <Calendar className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-yellow-400 font-mono text-xs uppercase mb-1 flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Analitik Masa Nyata
                </h3>
                <h2 className="text-2xl font-bold text-white">Bulan {currentMonthName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              
              <div className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Jumlah Kehadiran</p>
                <p className="text-2xl font-bold text-blue-400">
                  {analytics.totalMonthPresence}
                </p>
              </div>

              <div className="bg-yellow-900/20 backdrop-blur-sm p-3 rounded-xl border border-yellow-500/30">
                <p className="text-xs text-yellow-300 uppercase tracking-wider mb-1">Kehadiran Tertinggi</p>
                <p className="text-sm font-bold text-yellow-400 truncate" title={analytics.agents[0]?.name}>
                  {analytics.agents[0]?.name.split(' ').slice(0, 2).join(' ')}
                </p>
              </div>

              <div className="bg-red-900/20 backdrop-blur-sm p-3 rounded-xl border border-red-500/30">
                <p className="text-xs text-red-300 uppercase tracking-wider mb-1">Belum Direkod</p>
                <p className="text-xl font-bold text-red-400">{analytics.miaAgents.length}</p>
              </div>
              
               <div className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pernah Hadir</p>
                <p className="text-xl font-bold text-white">
                  {analytics.activeAgents.length} <span className="text-sm text-slate-500">/ {TOTAL_STUDENTS}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE SQUADRON (GRID) */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <User className="w-5 h-5 mr-2 text-slate-500" />
            Prestasi Kehadiran Pengawas
          </h3>
          
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'ALL' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => setFilter('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'ACTIVE' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Aktif
            </button>
            <button 
              onClick={() => setFilter('MIA')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'MIA' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Belum Direkod
            </button>
          </div>
        </div>
        
        {displayedAgents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100 border-dashed">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Tiada ejen dalam kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedAgents.map((agent) => (
              <AgentCard 
                key={agent.name}
                {...agent}
                onClick={() => setSelectedStudent(agent.name)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Jejak Kehadiran NFC Terkini</h3>
            <p className="text-sm text-slate-500">10 rekod sah terbaharu daripada Apps Script.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> DATA LANGSUNG
          </span>
        </div>
        <AttendanceTable data={recentData} />
      </div>

    </div>
  );
};
