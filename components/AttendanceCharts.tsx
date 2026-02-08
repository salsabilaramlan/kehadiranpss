import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceChartsProps {
  data: AttendanceRecord[];
}

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({ data }) => {
  // Process data for chart: Count by Form (Tingkatan)
  const formCounts = data.reduce((acc, curr) => {
    const form = curr.tingkatan || "Lain-lain";
    acc[form] = (acc[form] || 0) + (curr.status === AttendanceStatus.HADIR ? 1 : 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(formCounts)
    .map(key => ({ name: key, hadir: formCounts[key] }))
    .sort((a, b) => b.hadir - a.hadir)
    .slice(0, 7); // Top 7 forms

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistik Kehadiran Mengikut Kelas</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
            <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="hadir" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};