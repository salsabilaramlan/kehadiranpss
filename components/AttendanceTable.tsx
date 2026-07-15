import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceTableProps {
  data: AttendanceRecord[];
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredData = useMemo(() => {
    return data.filter(record => {
      const matchesSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            record.tingkatan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case AttendanceStatus.HADIR: return 'bg-green-100 text-green-700';
      case AttendanceStatus.TIDAK_HADIR: return 'bg-red-100 text-red-700';
      case AttendanceStatus.LEWAT: return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('ms-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Rekod Kehadiran Terkini</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari Nama / Kelas..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
             <select 
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full appearance-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
             >
               <option value="All">Semua Status</option>
               <option value={AttendanceStatus.HADIR}>Hadir</option>
               <option value={AttendanceStatus.LEWAT}>Lewat</option>
               <option value={AttendanceStatus.TIDAK_HADIR}>Tidak Hadir</option>
             </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
              <th className="px-6 py-4">Masa & Tarikh</th>
              <th className="px-6 py-4">Nama Pengawas</th>
              <th className="px-6 py-4">Tingkatan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length > 0 ? (
              filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      {formatDate(record.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{record.nama}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {record.tingkatan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 italic">
                    {record.catatan || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  Tiada rekod ditemui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between">
         <span>Memaparkan {filteredData.length} rekod sah terkini</span>
      </div>
    </div>
  );
};
