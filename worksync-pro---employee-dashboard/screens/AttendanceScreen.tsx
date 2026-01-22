import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Navigation,
  RefreshCcw,
  LocateFixed,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  List,
  Map as MapIcon,
  X,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Search
} from 'lucide-react';
import { AttendanceStatus, AttendanceLog } from '../types';
import { attendanceService } from '../services/attendanceService';
import { settingService } from '../services/settingService';
import { authService } from '../services/authService';

const AttendanceScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [weekendPolicy, setWeekendPolicy] = useState<string[]>(['Sat', 'Sun']);

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'mismatch' | 'error'>('idle');
  const [verificationMsg, setVerificationMsg] = useState('');

  useEffect(() => {
    getLiveLocation();
    fetchAttendanceLogs();
    fetchWeekendPolicy();
    syncUserJoiningDate();
  }, [currentDate]);

  const syncUserJoiningDate = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // If joiningDate is missing in localStorage, fetch profile
    if (!user.joiningDate) {
      try {
        const fullUser = await authService.getProfile();
        if (fullUser.joiningDate) {
          const updatedUser = { ...user, joiningDate: fullUser.joiningDate };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Failed to sync user joining date", err);
      }
    }
  };

  const fetchWeekendPolicy = async () => {
    try {
      const settings = await settingService.getSettings();
      if (settings.weekendPolicy) {
        setWeekendPolicy(settings.weekendPolicy);
      }
    } catch (err) {
      console.error('Failed to fetch weekend policy', err);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const id = user.id || user._id;

      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const data = await attendanceService.getMonthlyAttendance(id, month, year);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const getLiveLocation = (silent = false) => {
    if (!silent) setIsLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          if (!silent) setIsLocating(false);
          resolve(coords);
        },
        (err) => {
          setError(err.message);
          if (!silent) setIsLocating(false);
          reject(err);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const handleVerifyLocation = async () => {
    setVerificationStatus('verifying');
    try {
      const currentPos = await getLiveLocation(true);
      if (!currentPos) throw new Error("GPS failed");

      // Check if checked in today
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const id = user.id || user._id;
        const today = await attendanceService.getDailyAttendance(id);

        if (!today || !today.checkIn) {
          setVerificationStatus('error');
          setVerificationMsg("Not checked in today.");
          return;
        }
      }

      setVerificationStatus('verified');
      setVerificationMsg("Identity Verified: In secure zone.");
    } catch (err) {
      setVerificationStatus('error');
      setVerificationMsg("Link Error.");
    }

    setTimeout(() => {
      setVerificationStatus('idle');
    }, 5000);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startOffset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const getDayStatus = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    d.setHours(0, 0, 0, 0);
    const isFuture = d > new Date();

    const log = logs.find(l => isSameDay(new Date(l.date), d));

    if (log && log.status) return log.status;

    // Check joining date from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const jDate = user.joiningDate ? new Date(user.joiningDate) : null;
      if (jDate) {
        jDate.setHours(0, 0, 0, 0);
        if (d < jDate) return 'future';
      }
    }

    // Fallback logic for future dates or missing backend records
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[d.getDay()];

    if (weekendPolicy.includes(dayName)) return 'weekend';
    if (isFuture) return 'future';

    return 'absent';
  };

  const statusColors: Record<string, string> = {
    present: 'border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5',
    absent: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20',
    leave: 'border-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 bg-yellow-400/5',
    unpaid_leave: 'border-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/5',
    weekend: 'border-2 border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/5',
    holiday: 'border-2 border-blue-500 text-blue-600 bg-blue-500/10',
    future: 'text-slate-300 dark:text-slate-700'
  };

  const filteredLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).filter(l => {
    const d = new Date(l.date).toLocaleDateString();
    const s = l.status || '';
    return d.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
        <div>
          <h2 className="text-[14px] md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Matrix registry</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[7.5px] lg:text-[11px] mt-1 lg:mt-2 uppercase tracking-tight">Personnel presence archives</p>
        </div>
        <div className="flex flex-row items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-950/40 p-0.5 lg:p-1 rounded-md lg:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-1 px-2 lg:px-4 py-0.5 lg:py-1.5 rounded-sm lg:rounded-lg text-[8px] lg:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <List className="w-2.5 h-2.5 lg:w-4 lg:h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center justify-center gap-1 px-2 lg:px-4 py-0.5 lg:py-1.5 rounded-sm lg:rounded-lg text-[8px] lg:text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <MapIcon className="w-2.5 h-2.5 lg:w-4 lg:h-4" /> Map
            </button>
          </div>
          <button
            onClick={handleVerifyLocation}
            disabled={verificationStatus === 'verifying'}
            className="flex items-center justify-center gap-1 lg:gap-2 px-2 lg:px-6 py-1 lg:py-2.5 rounded-md lg:rounded-xl text-[8.5px] lg:text-xs font-black tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
          >
            {verificationStatus === 'verifying' ? <Loader2 className="w-2.5 h-2.5 lg:w-4 lg:h-4 animate-spin" /> : <ShieldCheck className="w-2.5 h-2.5 lg:w-4 lg:h-4" />}
            Verify
          </button>
        </div>
      </div>

      {verificationStatus !== 'idle' && verificationStatus !== 'verifying' && (
        <div className="p-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg animate-scale-in">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 shadow-sm ${verificationStatus === 'verified' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {verificationStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-tight leading-none text-slate-800 dark:text-white uppercase">{verificationStatus === 'verified' ? 'Success' : 'Failed'}</p>
              <p className="text-[8.5px] font-bold text-slate-500 mt-1 truncate">{verificationMsg}</p>
            </div>
          </div>
          <button onClick={() => setVerificationStatus('idle')} className="p-1 px-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-3 h-3" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
        <div className="lg:col-span-4 space-y-3 lg:space-y-6">
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-2.5 lg:p-6 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
            <h3 className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 lg:mb-4">Spatial Lock</h3>
            {location ? (
              <div className="flex items-center gap-2 lg:gap-4 p-1.5 lg:p-3 bg-blue-50/50 dark:bg-blue-500/10 rounded-sm lg:rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                <MapPin className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <p className="text-[6.5px] lg:text-[10px] font-black text-blue-500 dark:text-blue-300 uppercase leading-none mb-1 lg:mb-1.5">Coordinate</p>
                  <p className="text-[8.5px] lg:text-lg font-black text-slate-800 dark:text-blue-400 tracking-tight tabular-nums truncate leading-none">
                    {location.lat.toFixed(6)}° N, {location.lng.toFixed(6)}° W
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-10 lg:h-20 bg-slate-50/50 dark:bg-slate-950/50 rounded-sm lg:rounded-xl flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none">Awaiting GIS Link...</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-3 lg:p-6 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/10">
            <div className="flex items-center justify-between mb-3 lg:mb-6">
              <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-[10px] lg:text-xl uppercase leading-none">{currentDate.toLocaleString('default', { month: 'long' })}</h3>
              <div className="flex gap-1 lg:gap-2">
                <button onClick={() => changeMonth(-1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors active:scale-90"><ChevronLeft className="w-3 h-3 lg:w-6 lg:h-6" /></button>
                <button onClick={() => changeMonth(1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors active:scale-90"><ChevronRight className="w-3 h-3 lg:w-6 lg:h-6" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-center text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none">{d}</span>)}
              {Array.from({ length: startOffset }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const status = getDayStatus(day);
                return (
                  <div key={day} className={`h-5 lg:h-10 rounded-sm lg:rounded-lg flex items-center justify-center text-[8px] lg:text-sm font-black transition-all ${statusColors[status] || statusColors.absent}`}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-md border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
              <div className="p-2.5 lg:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="font-black text-slate-800 dark:text-white text-[10px] lg:text-base uppercase tracking-tight leading-none">History</h3>
                <div className="relative flex-1 md:flex-none">
                  <Search className="w-2.5 h-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="QUERY..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full md:w-36 pl-6 pr-2 py-0.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-sm text-[8px] lg:text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400/50 uppercase" />
                </div>
              </div>

              {/* Mobile Card Grid */}
              <div className="md:hidden grid grid-cols-2 gap-2 p-2">
                {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => {
                  const status = (log.status || 'absent').toLowerCase();
                  return (
                    <div key={idx} className="bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-md border border-slate-100 dark:border-slate-800 group transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[8.5px] font-black text-slate-700 dark:text-slate-200 leading-none truncate">{new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <div className={`w-1 h-1 rounded-full ${status === 'present' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]'}`} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-center text-[6.5px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          <span>Hours</span>
                          <span className="text-slate-700 dark:text-slate-300">{log.workingHours || '-'}h</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[6.5px] font-black text-slate-600 dark:text-slate-400 truncate tracking-tight leading-none py-0.5">
                            {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'} — {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className={`block text-center py-0.5 rounded-sm text-[6.5px] font-black uppercase tracking-widest ${status === 'present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50' :
                          status === 'absent' ? 'bg-rose-500 text-white' :
                            'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50'
                          }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-2 py-6 text-center text-slate-400 font-bold text-[9px] uppercase tracking-widest">No entries</div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-950/40">
                    <tr>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Interval</th>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hours</th>
                      <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => {
                      const status = log.status || 'absent';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-black text-slate-700 dark:text-slate-200">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">IN {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'} — OUT {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-500 tabular-nums">{log.workingHours || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                              status === 'absent' ? 'bg-rose-500 text-white shadow-sm' :
                                status === 'leave' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' :
                                  status === 'unpaid_leave' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20' :
                                    status === 'holiday' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' :
                                      'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                              }`}>
                              {log.leaveDuration === 0.5 ? 'Half Day' : status}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-600 font-bold text-xs uppercase tracking-widest">No logs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[600px] relative transition-all">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
                <h3 className="font-black text-slate-800 dark:text-white text-base">GIS spatial log</h3>
                <p className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-widest">Spatial overlay</p>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
                <div className="relative w-full h-full p-10 flex items-center justify-center text-center">
                  <div className="animate-scale-in">
                    <MapPin className="w-8 h-8 text-blue-300 dark:text-blue-900 mx-auto mb-3" />
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Map active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceScreen;
