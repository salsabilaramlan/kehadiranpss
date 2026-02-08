import React, { useState, useMemo } from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { STUDENT_MASTER_LIST, TOTAL_STUDENTS } from '../constants';
import { Calendar, ChevronLeft, ChevronRight, Trophy, AlertCircle, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { StudentAnalysisModal } from './StudentAnalysisModal';

interface MonthlyAnalysisViewProps {
  data: AttendanceRecord[];
}

export const MonthlyAnalysisView: React.FC<MonthlyAnalysisViewProps> = ({ data }) => {
  // Initialize with current Malaysia time
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const monthName = selectedDate.toLocaleString('ms-MY', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // --- ANALYTICS LOGIC ---
  const monthlyStats = useMemo(() => {
    const targetMonth = selectedDate.getMonth();
    const targetYear = selectedDate.getFullYear();

    // 1. Filter data untuk bulan yang dipilih SAHAJA (Ikut Timezone Malaysia)
    const filteredRecords = data.filter(record => {
      const recordDate = new Date(new Date(record.timestamp).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear;
    });

    // 2. Map kehadiran kepada nama pelajar (Guna Set untuk elak duplicate hari)
    const attendanceMap = new Map<string, Set<string>>();
    const lastSeenMap = new Map<string, string>();

    filteredRecords.forEach(record => {
      // Cari nama dalam master list untuk grouping yang tepat
      const matchedName = STUDENT_MASTER_LIST.find(
        master => record.nama.toLowerCase().includes(master.toLowerCase()) || 
                  master.toLowerCase().includes(record.nama.toLowerCase())
      );
      
      // Jika tak jumpa dalam master list (jarang berlaku), guna nama asal
      const key = matchedName || record.nama;
      
      // Hanya kira jika status HADIR/BERTUGAS/LEWAT
      if (record.status !== AttendanceStatus.TIDAK_HADIR) {
        // Create unique date key (YYYY-MM-DD) in MY timezone
        const dateStr = new Date(record.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
        
        if (!attendanceMap.has(key)) {
            attendanceMap.set(key, new Set());
        }
        attendanceMap.get(key)!.add(dateStr);
        
        // Simpan tarikh terakhir dilihat bulan ini
        const currentLast = lastSeenMap.get(key);
        if (!currentLast || new Date(record.timestamp) > new Date(currentLast)) {
          lastSeenMap.set(key, record.timestamp);
        }
      }
    });

    // 3. Gabungkan dengan Master List untuk dapatkan status '0' kehadiran
    const report = STUDENT_MASTER_LIST.map(student => {
      const count = attendanceMap.get(student)?.size || 0;
      return {
        name: student,
        count: count,
        lastSeen: lastSeenMap.get(student) || null,
        percentage: 0 // Placeholder kalau nak kira peratus
      };
    });

    // 4. Sort: Paling banyak hadir di atas
    report.sort((a, b) => b.count - a.count);

    // Sum of all unique attendances
    const totalAttendanceInMonth = report.reduce((acc, curr) => acc + curr.count, 0);
    const activeStudentsInMonth = report.filter(r => r.count > 0).length;
    const zeroAttendanceStudents = TOTAL_STUDENTS - activeStudentsInMonth;

    return { report, totalAttendanceInMonth, activeStudentsInMonth, zeroAttendanceStudents };
  }, [data, selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
       {/* Modal for AI Analysis */}
      <StudentAnalysisModal 
        isOpen={!!selectedStudent}
        studentName={selectedStudent || ""}
        data={data}
        onClose={() => setSelectedStudent(null)}
      />

      {/* HEADER CONTROLS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Laporan Bulanan</h2>
            <p className="text-slate-500 text-sm">Prestasi kehadiran keseluruhan</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="w-40 text-center font-bold text-slate-800 select-none">
            {monthName}
          </span>
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg shadow-blue-900/20">
          <p className="text-blue-100 text-xs uppercase font-bold tracking-wider">Jumlah Kehadiran</p>
          <p className="text-3xl font-bold mt-1">{monthlyStats.totalAttendanceInMonth}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Pelajar Aktif Bulan Ini</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-800">{monthlyStats.activeStudentsInMonth}</p>
            <span className="text-slate-400 text-sm mb-1">/ {TOTAL_STUDENTS}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tiada Kehadiran (0)</p>
          <p className="text-3xl font-bold text-red-500">{monthlyStats.zeroAttendanceStudents}</p>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Senarai Prestasi {monthName}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4 w-16 text-center">Rank</th>
                <th className="px-6 py-4">Nama Pengawas</th>
                <th className="px-6 py-4 text-center">Jumlah Hari Hadir</th>
                <th className="px-6 py-4">Terakhir Dilihat (Bulan Ini)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyStats.report.map((student, index) => {
                const isTop3 = index < 3 && student.count > 0;
                const isZero = student.count === 0;
                // Identify Top Student Logic: Must be Rank 1 (index 0) and have attendance > 0
                const isTokohBulanIni = index === 0 && student.count > 0;
                
                return (
                  <tr 
                    key={student.name} 
                    onClick={() => setSelectedStudent(student.name)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${isZero ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-6 py-4 text-center">
                      {isTop3 ? (
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ring-2 shadow-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700 ring-yellow-400' :
                          index === 1 ? 'bg-slate-200 text-slate-700 ring-slate-400' :
                          'bg-orange-100 text-orange-800 ring-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-sm">#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="font-medium text-slate-800 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        {student.name}
                        {isTokohBulanIni && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm animate-pulse">
                              <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-600" />
                              TOKOH BULAN INI
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        student.count > 4 ? 'bg-green-100 text-green-700' :
                        student.count > 0 ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {student.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {student.lastSeen ? (
                        new Date(student.lastSeen).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isZero ? (
                        <span className="inline-flex items-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Tiada
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Aktif
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};