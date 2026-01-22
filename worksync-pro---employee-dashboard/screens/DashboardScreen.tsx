import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Navigation,
  ExternalLink,
  Zap,
  TrendingUp,
  Target,
  Star
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Screen, ProjectStatus, Meeting, AttendanceLog, Project, LeaveRequest, Holiday } from '../types';
import { holidayService } from '../services/holidayService';
import { attendanceService } from '../services/attendanceService';
import { meetingService } from '../services/meetingService';
import { projectService } from '../services/projectService';
import { leaveService } from '../services/leaveService';
import { authService } from '../services/authService';
import { settingService } from '../services/settingService';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [user, setUser] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [phaseData, setPhaseData] = useState<any[]>([]);
  const [registryView, setRegistryView] = useState<'cycle' | 'phase'>('cycle');
  const [companySettings, setCompanySettings] = useState<any>(null);

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isHalfShiftPassed, setIsHalfShiftPassed] = useState(false);
  const [dailyRecord, setDailyRecord] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Load User
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    fetchDashboardData();
    fetchCompanySettings();

    return () => clearInterval(timer);
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const data = await settingService.getSettings();
      setCompanySettings(data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    if (isCheckedIn && dailyRecord && companySettings?.workingHours) {
      const checkProtocol = () => {
        const checkInDate = new Date(dailyRecord.checkIn);
        const now = new Date();
        const diffHrs = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);

        const [inH, inM] = companySettings.workingHours.checkIn.split(':').map(Number);
        const [outH, outM] = companySettings.workingHours.checkOut.split(':').map(Number);
        let shiftLen = (outH + outM / 60) - (inH + inM / 60);
        if (shiftLen < 0) shiftLen += 24;

        setIsHalfShiftPassed(diffHrs >= (shiftLen / 2));
      };
      checkProtocol();
      const i = setInterval(checkProtocol, 60000);
      return () => clearInterval(i);
    }
  }, [isCheckedIn, dailyRecord, companySettings]);

  const fetchDashboardData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const userId = userData?.id || userData?._id;

      if (!userId) return;

      // 1. Check Attendance Status (Daily)
      try {
        const daily = await attendanceService.getDailyAttendance(userId);
        setDailyRecord(daily);
        if (daily && daily.checkIn) {
          setIsCheckedIn(true);
          setCheckInTime(new Date(daily.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          if (daily.checkOut) {
            setIsCheckedOut(true);
          }
        } else {
          setIsCheckedIn(false);
          setIsCheckedOut(false);
          setCheckInTime(null);
        }
      } catch (e) {
        setIsCheckedIn(false);
        setIsCheckedOut(false);
      }
      // ... rest of fetch calls ...
      // (Lines 99-133 omitted for brevity, keeping existing logic)
      const date = new Date();
      const logs = await attendanceService.getMonthlyAttendance(userId, date.getMonth() + 1, date.getFullYear());
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData = days.map(day => ({ name: day, hours: 0 }));
      if (Array.isArray(logs)) {
        logs.forEach((log: any) => {
          const logDate = new Date(log.date);
          const dayIndex = logDate.getDay();
          const hours = parseFloat(log.workingHours || '0');
          chartData[dayIndex].hours += hours;
        });
      }
      setWeeklyData(chartData);

      // Phase Data (Weekly aggregation for the month)
      const phaseWeeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
      const phaseChartData = phaseWeeks.map(name => ({ name, hours: 0 }));

      if (Array.isArray(logs)) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        logs.forEach((log: any) => {
          const logDate = new Date(log.date);

          // Only aggregate for current month/year
          if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            const dayOfMonth = logDate.getDate();
            const weekIndex = Math.floor((dayOfMonth - 1) / 7);
            const hours = parseFloat(log.workingHours || '0');
            if (phaseChartData[weekIndex]) {
              phaseChartData[weekIndex].hours += hours;
            }
          }
        });
      }
      setPhaseData(phaseChartData);

      // Refine Cycle Data (Strictly current week)
      if (Array.isArray(logs)) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0-6
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const refinedCycleData = days.map(day => ({ name: day, hours: 0 }));
        logs.forEach((log: any) => {
          const logDate = new Date(log.date);
          if (logDate >= startOfWeek && logDate <= endOfWeek) {
            const di = logDate.getDay();
            refinedCycleData[di].hours += parseFloat(log.workingHours || '0');
          }
        });
        setWeeklyData(refinedCycleData);
      }

      const myMeetings = await meetingService.getMyMeetings();
      setMeetings(Array.isArray(myMeetings) ? myMeetings.map((m: any) => ({ ...m, id: m._id })) : []);

      const myProjects = await projectService.getMyProjects();
      setProjects(Array.isArray(myProjects) ? myProjects : []);

      const myLeaves = await leaveService.getMyLeaves();
      setLeaves(Array.isArray(myLeaves) ? myLeaves : []);

      const allHolidays = await holidayService.getAllHolidays();
      setHolidays(Array.isArray(allHolidays) ? allHolidays.map((h: any) => ({ ...h, id: h._id })) : []);

    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      setNotification({ type: 'info', message: 'Detecting live location...' });
      const loc = await getLocation();
      await attendanceService.checkIn(loc);
      setNotification({ type: 'success', message: 'Check-in Synchronized Successfully!' });
      fetchDashboardData();
    } catch (error: any) {
      console.error("Check-in failed", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || "Check-in failed. Ensure location is enabled."
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      setNotification({ type: 'info', message: 'Detecting live location...' });
      const loc = await getLocation();
      await attendanceService.checkOut(loc);
      setNotification({ type: 'success', message: 'Check-out Synchronized Successfully!' });
      fetchDashboardData();
    } catch (error: any) {
      console.error("Check-out failed", error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || "Check-out failed. Ensure location is enabled."
      });
    }
  };

  // Derived stats
  const activeProjects = projects.filter(p => {
    const status = (typeof p.status === 'string' ? p.status : '').toLowerCase();
    return status !== 'completed' && status !== '';
  });
  const leavesTaken = leaves.filter(l => l.status === 'Approved').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Welcome Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap className="w-2 h-2 text-amber-500 fill-amber-500" />
            <span className="text-[6px] font-black text-amber-500 uppercase tracking-widest leading-none">Productivity Engine</span>
          </div>
          <h2 className="text-[15px] lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">{user?.name?.split(' ')[0] || 'Employee'}'s Portal</h2>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-1.5 lg:mt-2">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[7px] lg:text-[11px] flex items-center gap-1 uppercase tracking-tight leading-none">
              Weekly Sync: <span className="text-blue-600 dark:text-blue-400 font-black">85%</span>
            </p>
            {dailyRecord?.status === 'late' && (
              <span className="flex items-center gap-1 text-[6px] lg:text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 lg:px-2.5 py-0.5 lg:py-1 rounded-md lg:rounded-lg border border-rose-100 dark:border-rose-500/20 uppercase tracking-widest leading-none">
                <Clock className="w-1.5 h-1.5 lg:w-3 lg:h-3" />
                LATE
              </span>
            )}
          </div>
        </div>

        {notification && (
          <div className={`fixed top-4 right-4 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 px-3 py-2 rounded-md border shadow-2xl backdrop-blur-xl flex items-center gap-2 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
            notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}>
            <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-emerald-500 text-white' :
              notification.type === 'error' ? 'bg-rose-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-tight">{notification.message}</p>
          </div>
        )}

        <div className="flex items-center gap-1.5 animate-in slide-in-from-right duration-700 w-full lg:w-auto">
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl w-full lg:w-auto px-2 lg:px-4 py-1 lg:py-2.5 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-1.5 lg:gap-3 shadow-sm lg:shadow-xl lg:shadow-slate-200/20">
            <div className="w-5 h-5 lg:w-10 lg:h-10 bg-blue-500/10 rounded-sm lg:rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
              <Calendar className="w-2.5 h-2.5 lg:w-5 lg:h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-right flex-1 lg:flex-none">
              <p className="font-black text-slate-700 dark:text-slate-100 text-[8.5px] lg:text-sm tracking-tight leading-none">{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              <p className="text-blue-600 dark:text-blue-400 font-black text-[7.5px] lg:text-base tabular-nums leading-none mt-0.5 lg:mt-1">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-6">
            {/* Check-in Widget */}
            <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-2.5 lg:p-6 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/10 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.99] lg:min-h-[220px]">
              <div className="absolute -top-3 -right-3 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.07] transition-all pointer-events-none">
                <Clock className="w-14 h-14 lg:w-32 lg:h-32 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2 lg:space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[6.5px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Time Registry</h3>
                  {isCheckedIn && (
                    <span className="flex items-center gap-1 text-[6.5px] lg:text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1 lg:px-2 py-0.5 lg:py-1 rounded-sm lg:rounded-lg border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest leading-none">
                      <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-base lg:text-4xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums uppercase leading-none">{isCheckedIn ? 'In Shift' : 'Off Shift'}</p>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-[6.5px] lg:text-[10px] uppercase tracking-widest mt-1 lg:mt-2 leading-none">
                    {isCheckedIn ? `LOGGED: ${checkInTime}` : 'SHIFT INACTIVE'}
                  </p>
                </div>
                {companySettings && (
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-1 lg:p-2.5 rounded-sm lg:rounded-xl border border-slate-100 dark:border-slate-800/50 lg:mt-4">
                    <div className="flex justify-between items-center text-[6.5px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                      <span>Shift</span>
                      <span className="text-blue-600 dark:text-blue-400 font-black tracking-tight">{companySettings.workingHours.checkIn} - {companySettings.workingHours.checkOut}</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5 lg:gap-4 lg:mt-6">
                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckedIn}
                    className={`w-full py-1.5 lg:py-3.5 rounded-md lg:rounded-xl font-black text-[7.5px] lg:text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 lg:gap-2 active:scale-95 shadow-sm ${isCheckedIn
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700 font-bold'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/10'
                      }`}
                  >
                    Check In
                    <ArrowRight className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-white" />
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={!isCheckedIn || isCheckedOut || !isHalfShiftPassed}
                    className={`w-full py-1.5 lg:py-3.5 rounded-md lg:rounded-xl font-black text-[7.5px] lg:text-[11px] tracking-widest uppercase transition-all flex items-center justify-center gap-1 lg:gap-2 active:scale-95 shadow-sm ${(!isCheckedIn || isCheckedOut || !isHalfShiftPassed)
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700 font-bold'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/10'
                      }`}
                  >
                    Check Out
                    <ArrowRight className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-2.5 lg:p-6 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm transition-all lg:shadow-xl lg:shadow-slate-200/10">
              <h3 className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2.5 lg:mb-5 leading-none underline underline-offset-4 decoration-indigo-500/30">Stats Radar</h3>
              <div className="grid grid-cols-2 gap-2 lg:gap-6">
                <div className="space-y-1 lg:space-y-3">
                  <div className="w-5 h-5 lg:w-11 lg:h-11 rounded-md lg:rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-all border border-emerald-100 dark:border-emerald-500/20">
                    <TrendingUp className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[6.5px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Growth</p>
                    <p className="text-[10px] lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5 lg:mt-1.5 leading-none truncate">+12.4%</p>
                  </div>
                </div>
                <div className="space-y-1 lg:space-y-3">
                  <div className="w-5 h-5 lg:w-11 lg:h-11 rounded-md lg:rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-all border border-blue-100 dark:border-blue-500/20">
                    <Target className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[6.5px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Accuracy</p>
                    <p className="text-[10px] lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5 lg:mt-1.5 leading-none truncate">98.2%</p>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 lg:mt-8 pt-2 lg:pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[6.5px] lg:text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                  <Navigation className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
                  {dailyRecord?.location?.checkIn ? `${dailyRecord.location.checkIn.lat.toFixed(4)}, ${dailyRecord.location.checkIn.lng.toFixed(4)}` : 'Enterprise Geofence Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Chart Section */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-2.5 lg:p-8 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-10">
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="w-5 h-5 lg:w-12 lg:h-12 bg-blue-50 dark:bg-blue-500/10 rounded-sm lg:rounded-xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                  <TrendingUp className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[9px] lg:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Flow Registry</h3>
                  <p className="text-[6.5px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Personnel Output Metrics</p>
                </div>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-sm lg:rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                <button
                  onClick={() => setRegistryView('cycle')}
                  className={`flex-1 sm:flex-none px-3 lg:px-6 py-1 lg:py-2 rounded-sm lg:rounded-lg text-[6.5px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${registryView === 'cycle' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Cycle
                </button>
                <button
                  onClick={() => setRegistryView('phase')}
                  className={`flex-1 sm:flex-none px-3 lg:px-6 py-1 lg:py-2 rounded-sm lg:rounded-lg text-[6.5px] lg:text-[10px] font-bold uppercase tracking-widest transition-all ${registryView === 'phase' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Phase
                </button>
              </div>
            </div>
            <div className="h-24 lg:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registryView === 'cycle' ? weeklyData : phaseData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 6, fill: '#94a3b8', fontWeight: 900 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff', borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '6px', fontWeight: '900', textTransform: 'uppercase' }} />
                  <Bar dataKey="hours" radius={[1, 1, 0, 0]} barSize={registryView === 'cycle' ? 8 : 16}>
                    {(registryView === 'cycle' ? weeklyData : phaseData).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.hours > 0 ? '#6366f1' : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9')} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 units) */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          {/* Quick Pulse */}
          <div className="bg-slate-900 border border-slate-800 p-3 lg:p-6 rounded-xl shadow-xl text-white relative overflow-hidden group">
            <Target className="absolute -top-10 -right-10 w-20 h-20 lg:w-32 lg:h-32 opacity-10 group-hover:scale-125 transition-all duration-700" />
            <h3 className="text-[7px] lg:text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Velocity</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar lg:pr-1">
              {activeProjects.length > 0 ? activeProjects.map((project) => (
                <div key={project.id || project._id} className="bg-white/5 backdrop-blur-xl p-2 rounded-lg border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                  <span className="text-[9px] lg:text-[11px] font-black truncate flex-1 pr-2">{project.name}</span>
                  <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded leading-none">{project.progress}%</span>
                </div>
              )) : (
                <div className="bg-white/5 backdrop-blur-xl p-2 rounded-lg border border-white/10 flex items-center justify-between col-span-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No Projects</span>
                  <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-400/50 px-1.5 py-0.5 rounded">0%</span>
                </div>
              )}
              <div className="bg-white/5 backdrop-blur-xl p-2 rounded-lg border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors col-span-2 lg:col-span-1">
                <span className="text-[9px] lg:text-[11px] font-black">Leaves</span>
                <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded leading-none">{leavesTaken} Days</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
            {/* Meetings List */}
            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-3 lg:p-6 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[7px] lg:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Agenda</h3>
                <button onClick={() => onNavigate('Meetings')} className="text-indigo-600 dark:text-indigo-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition-colors">All <ChevronRight className="w-2 h-2" /></button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {meetings.length > 0 ? meetings.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 p-1.5 lg:p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 min-w-0">
                    <div className="w-7 h-7 lg:w-10 lg:h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-lg flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <span className="text-[5px] font-bold text-indigo-500 dark:text-indigo-300 group-hover:text-indigo-100 uppercase leading-none">{new Date(m.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-[10px] lg:text-sm font-black text-indigo-600 dark:white group-hover:text-white leading-none mt-0.5">{new Date(m.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] lg:text-[11px] font-black text-slate-700 dark:text-slate-200 truncate tracking-tight">{m.title}</p>
                      <p className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none mt-0.5">{m.time}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[8px] text-center text-slate-400 dark:text-slate-500 font-bold py-3 col-span-2">None Found</p>
                )}
              </div>
            </div>

            {/* Holidays List */}
            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-3 lg:p-6 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[7px] lg:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Holidays</h3>
                <button onClick={() => onNavigate('Holidays')} className="text-indigo-600 dark:text-indigo-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition-colors">List <ChevronRight className="w-2" /></button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {holidays
                  .filter(h => h.date && new Date(h.date) >= new Date())
                  .slice(0, 2)
                  .map((h) => (
                    <div key={h.id} className="flex items-center gap-2 p-1.5 lg:p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-700/50 min-w-0">
                      <div className="w-7 h-7 lg:w-10 lg:h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-[5px] font-bold uppercase leading-none text-emerald-500">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-[10px] lg:text-sm font-black leading-none mt-0.5 text-emerald-600">{new Date(h.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] lg:text-[11px] font-black text-slate-700 dark:text-white truncate tracking-tight">{h.name}</p>
                        <p className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">{h.type}</p>
                      </div>
                    </div>
                  ))}
                {holidays.filter(h => h.date && new Date(h.date) >= new Date()).length === 0 && (
                  <p className="text-[8px] text-center text-slate-400 dark:text-slate-500 font-bold py-3 col-span-2">None Found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
