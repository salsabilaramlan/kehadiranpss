import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  RefreshCw,
  Menu,
  AlertTriangle,
  Zap,
  CalendarDays
} from 'lucide-react';
import { DashboardView } from './components/DashboardView'; 
import { MonthlyAnalysisView } from './components/MonthlyAnalysisView';
import { fetchAttendanceData } from './services/api';
import { AttendanceRecord } from './types';
import { APP_NAME, SCHOOL_NAME, TOTAL_STUDENTS } from './constants';

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monthly'>('dashboard');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await fetchAttendanceData();
      setData(records);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungi pelayan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Helper to get Header Title
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Operasi';
      case 'monthly': return 'Analisis Bulanan';
      default: return 'Sistem PSS';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-700">
            <Zap className="w-5 h-5 text-cyan-400 mr-2" />
            <div>
              <span className="font-bold text-lg tracking-wider">e-PSS NFC</span>
              <p className="text-[9px] text-cyan-300 uppercase tracking-[0.22em]">Smart Attendance</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Papan Pemuka
            </button>

            <button
              onClick={() => { setActiveTab('monthly'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'monthly' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarDays className="w-5 h-5 mr-3" />
              Analisis Bulanan
            </button>
          </nav>

          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="rounded-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">UNIT</p>
              <p className="text-sm font-medium text-white truncate">{SCHOOL_NAME}</p>
              <div className="mt-2 flex items-center text-xs text-slate-400">
                <Users className="w-3 h-3 mr-1" /> 
                {TOTAL_STUDENTS} Pengawas Berdaftar
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 mr-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="hidden sm:inline text-slate-400 font-normal">e-PSS NFC /</span>
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {lastRefreshed && (
              <span className="hidden sm:inline text-xs font-mono text-slate-500">
                KEMAS KINI: {lastRefreshed.toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute:'2-digit' })}
              </span>
            )}
            <button 
              onClick={loadData}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors focus:outline-none"
              title="Muat semula data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Connection Failure</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {loading && data.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-200 rounded-full"></div>
                    <div className="w-12 h-12 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
                  </div>
                  <p className="text-slate-500 font-medium mt-4 tracking-wider animate-pulse">MENYAMBUNG DATA NFC...</p>
               </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <DashboardView data={data} />}
                {activeTab === 'monthly' && <MonthlyAnalysisView data={data} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
