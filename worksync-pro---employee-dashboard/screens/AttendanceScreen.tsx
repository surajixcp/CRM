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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Matrix Log Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-tight">Personnel presence & geofence archives</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <List className="w-3 h-3" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <MapIcon className="w-3 h-3" /> Map
            </button>
          </div>
          <button
            onClick={handleVerifyLocation}
            disabled={verificationStatus === 'verifying'}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {verificationStatus === 'verifying' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Verify Pin
          </button>
        </div>
      </div>

      {verificationStatus !== 'idle' && verificationStatus !== 'verifying' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg animate-scale-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${verificationStatus === 'verified' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {verificationStatus === 'verified' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-black tracking-tight leading-none text-slate-800 dark:text-white">{verificationStatus === 'verified' ? 'Success' : 'Failed'}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-1">{verificationMsg}</p>
            </div>
          </div>
          <button onClick={() => setVerificationStatus('idle')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
            <h3 className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Spatial Lock</h3>
            {location ? (
              <div className="flex items-center gap-3 p-2.5 bg-blue-50/50 dark:bg-blue-500/10 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-blue-500 dark:text-blue-300 uppercase leading-none mb-1">Point Coordinate</p>
                  <p className="text-xs font-black text-slate-800 dark:text-blue-400 tracking-tight tabular-nums truncate leading-none">
                    {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° W
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-16 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Awaiting Link...</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-sm uppercase">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <div className="flex gap-1">
                <button onClick={() => changeMonth(-1)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors active:scale-90"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => changeMonth(1)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors active:scale-90"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-center text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase">{d}</span>)}
              {Array.from({ length: startOffset }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const status = getDayStatus(day);
                return (
                  <div key={day} className={`h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${statusColors[status] || statusColors.absent}`}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight">Presence Repository</h3>
                <div className="relative flex-1 md:flex-none">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="QUERY LOGS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full md:w-44 pl-8 pr-4 py-1.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400/50 uppercase" />
                </div>
              </div>
              <div className="overflow-x-auto">
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
                      <tr><td colSpan={4} className="p-8 text-center text-slate-600 font-bold text-xs">No logs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[600px] relative transition-all">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
                <h3 className="font-black text-slate-800 dark:text-white text-lg">GIS Spatial Log</h3>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-widest">Live Coordinate Overlay</p>
              </div>
              <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
                <div className="relative w-full h-full p-10 flex items-center justify-center text-center">
                  <div className="animate-scale-in">
                    <MapPin className="w-10 h-10 text-blue-300 dark:text-blue-900 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Map Environment Active</p>
                    <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 mt-2 italic">Coordinate tracking synchronized</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default AttendanceScreen;
