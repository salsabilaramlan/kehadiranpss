import React from 'react';
import { Award, AlertCircle, XCircle, Trophy, Calendar } from 'lucide-react';
import { AttendanceStatus } from '../types';

interface AgentCardProps {
  name: string;
  totalPresence: number; // Total kehadiran tahun ini
  monthlyCount: number; // Kehadiran bulan ini
  lastSeen: string; // ISO date string or 'Never'
  statusToday: AttendanceStatus | 'ABSENT';
  rank: number;
  onClick?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ name, totalPresence, monthlyCount, lastSeen, statusToday, rank, onClick }) => {
  const isPresent = statusToday !== 'ABSENT' && statusToday !== AttendanceStatus.TIDAK_HADIR;
  const isNeverSeen = lastSeen === 'Never';
  const currentMonthName = new Date().toLocaleString('ms-MY', { month: 'short', timeZone: 'Asia/Kuala_Lumpur' });
  
  // Rank Styling
  let rankBadge = (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-slate-200 bg-white text-slate-500`}>
      {rank}
    </div>
  );

  let borderClass = "border-slate-200";
  let bgClass = "bg-white";

  if (rank === 1) {
    rankBadge = <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400 shadow-md"><Trophy className="w-4 h-4 fill-current" /></div>;
    borderClass = "border-yellow-300";
    bgClass = "bg-yellow-50/30";
  } else if (rank === 2) {
    rankBadge = <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-700 ring-2 ring-slate-400 shadow-md"><Trophy className="w-4 h-4" /></div>;
    borderClass = "border-slate-300";
    bgClass = "bg-slate-50";
  } else if (rank === 3) {
    rankBadge = <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 text-orange-800 ring-2 ring-orange-400 shadow-md"><Trophy className="w-4 h-4" /></div>;
    borderClass = "border-orange-300";
    bgClass = "bg-orange-50/30";
  } else if (isNeverSeen) {
     borderClass = "border-red-300";
     bgClass = "bg-red-50/50";
  }

  // Calculate days since logic (Using Malaysia Time)
  let daysSinceDisplay = "Never";
  if (!isNeverSeen) {
     const nowMY = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
     const seenMY = new Date(new Date(lastSeen).toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
     
     // Reset hours to compare dates only
     nowMY.setHours(0,0,0,0);
     seenMY.setHours(0,0,0,0);
     
     const diffTime = Math.abs(nowMY.getTime() - seenMY.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     
     daysSinceDisplay = diffDays === 0 ? 'Today' : `${diffDays}d ago`;
  }

  return (
    <div 
      onClick={onClick}
      className={`relative group p-4 rounded-xl border ${borderClass} ${bgClass} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-full cursor-pointer hover:ring-2 hover:ring-blue-400/50`}
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          {rankBadge}
          <div className="text-right">
            {isPresent ? (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 animate-pulse">
                BERTUGAS
              </span>
            ) : (
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${isNeverSeen ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                {isNeverSeen ? 'M.I.A' : `Last: ${daysSinceDisplay}`}
              </span>
            )}
          </div>
        </div>
        
        <h4 className="font-bold text-slate-800 text-sm leading-tight mb-3 min-h-[40px] line-clamp-2 group-hover:text-blue-600 transition-colors" title={name}>
          {name}
        </h4>
        
        <div className="flex items-center justify-between bg-slate-100 rounded-lg p-2 mb-2">
            <div className="text-center w-1/2 border-r border-slate-200">
               <p className="text-[10px] uppercase text-slate-500 font-bold">Total</p>
               <p className="text-lg font-bold text-slate-800">{totalPresence}</p>
            </div>
            <div className="text-center w-1/2">
               <p className="text-[10px] uppercase text-blue-500 font-bold">{currentMonthName}</p>
               <p className="text-lg font-bold text-blue-600">{monthlyCount}</p>
            </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex gap-2 text-xs flex-wrap justify-center">
        {rank <= 3 && (
            <div className="flex items-center text-slate-700 font-semibold bg-white border border-slate-200 px-2 py-1 rounded-full shadow-sm">
             <Trophy className="w-3 h-3 mr-1 text-yellow-500" />
             Top {rank}
            </div>
        )}
        {monthlyCount >= 4 && (
          <div className="flex items-center text-green-700 font-semibold bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <Award className="w-3 h-3 mr-1" />
            Rajin
          </div>
        )}
        {isNeverSeen && (
          <div className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100 font-bold">
            <AlertCircle className="w-3 h-3 mr-1" />
            TIADA REKOD
          </div>
        )}
      </div>
    </div>
  );
};