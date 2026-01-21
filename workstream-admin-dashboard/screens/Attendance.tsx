import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { attendanceService } from '../src/api/attendanceService';
// import { AttendanceRecord } from '../types'; // Adjust imports if needed

// Interface for API response might differ slightly or we map it
interface AttendanceLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: number;
  status: string;
}

const Attendance: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLogs();
  }, [startDate]); // Fetch on mount and date change. Maybe add debounce or explicit button.

  const fetchLogs = async () => {
    try {
      const data = await attendanceService.getAllAttendance({ startDate, endDate });
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch attendance logs', error);
    }
  };

  const handleExport = () => {
    alert('Export functionality coming soon!');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900/40 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800/50 backdrop-blur-xl shrink-0">
            <div className="flex items-center px-1">
              <input
                type="date"
                className="bg-transparent text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer uppercase tracking-tight"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-px h-3 bg-slate-100 dark:bg-slate-800"></div>
            <div className="flex items-center px-1">
              <input
                type="date"
                className="bg-transparent text-[10px] font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer uppercase tracking-tight"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              onClick={fetchLogs}
              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all active:scale-90"
              title="Refresh Registry"
            >
              <Icons.Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center justify-center bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm transition-all active:scale-95 group shrink-0"
          >
            <Icons.Download className="w-3 h-3 mr-1.5 group-hover:-translate-y-0.5 transition-transform" />
            <span>Export Registry</span>
          </button>
        </div>

        <div className="hidden lg:block text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Status</p>
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">Real-time Synchronization Active</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
              <tr className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <th className="px-5 py-3.5">Staff Identity</th>
                <th className="px-5 py-3.5">Temporal Marker</th>
                <th className="px-5 py-3.5 text-center">Inbound</th>
                <th className="px-5 py-3.5 text-center">Outbound</th>
                <th className="px-5 py-3.5 text-center">Utilization</th>
                <th className="px-5 py-3.5 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {logs.length > 0 ? logs.map((record) => (
                <tr key={record._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {record.user?.name || 'Incomplete Identity'}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        {record.user?.email || 'AUTH.NULL'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-tighter">
                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                      {record.workingHours || 0} hrs
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md ${record.status === 'present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                          record.status === 'absent' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' :
                            record.status === 'leave' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' :
                              record.status === 'unpaid_leave' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20' :
                                'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'
                        }`}>
                        {record.status}
                      </span>
                      {(record.status === 'leave' || record.status === 'unpaid_leave') && record.leaveType && (
                        <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                          {record.leaveType}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 mb-3">
                        <Icons.Search className="w-5 h-5" />
                      </div>
                      <p className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest">No registry data discovered</p>
                      <p className="text-slate-400 text-[10px] uppercase font-bold mt-1">Adjust search parameters to initialize scan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50/30 dark:bg-slate-950/20 px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Monitoring Active</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
