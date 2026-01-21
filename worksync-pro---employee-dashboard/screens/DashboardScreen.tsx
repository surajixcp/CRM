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
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkInLoc, setCheckInLoc] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [user, setUser] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);

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

  const fetchDashboardData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : null;
      const userId = userData?.id || userData?._id;

      if (!userId) return;

      // 1. Check Attendance Status (Daily)
      try {
        const daily = await attendanceService.getDailyAttendance(userId);
        if (daily && daily.checkIn && !daily.checkOut) {
          setIsCheckedIn(true);
          setCheckInTime(new Date(daily.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setIsCheckedIn(false);
          setCheckInTime(null);
        }
      } catch (e) {
        // No record found likely means not checked in
        setIsCheckedIn(false);
      }

      // 2. Weekly Activity (Fetching monthly for now and filtering)
      const date = new Date();
      const logs = await attendanceService.getMonthlyAttendance(userId, date.getMonth() + 1, date.getFullYear());
      // Process logs for chart (last 7 days or current week)
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

      // 3. Meetings
      const myMeetings = await meetingService.getMyMeetings();
      setMeetings(Array.isArray(myMeetings) ? myMeetings.map((m: any) => ({ ...m, id: m._id })) : []);

      // 4. Projects
      const myProjects = await projectService.getMyProjects();
      setProjects(Array.isArray(myProjects) ? myProjects : []);

      // 5. Leaves
      const myLeaves = await leaveService.getMyLeaves();
      setLeaves(Array.isArray(myLeaves) ? myLeaves : []);

      // 6. Holidays
      const allHolidays = await holidayService.getAllHolidays();
      setHolidays(Array.isArray(allHolidays) ? allHolidays.map((h: any) => ({ ...h, id: h._id })) : []);

    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  const handleCheckInOut = async () => {
    try {
      if (!isCheckedIn) {
        await attendanceService.checkIn();
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            setCheckInLoc(`${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
          });
        }
      } else {
        await attendanceService.checkOut();
        setIsCheckedIn(false);
        setCheckInTime(null);
        setCheckInLoc(null);
      }
      // Refresh data
      // fetchDashboardData(); 
    } catch (error) {
      console.error("Check-in/out failed", error);
      alert("Action failed. Please try again.");
    }
  };

  // Derived stats
  const activeProjects = projects.filter(p => p.status === 'Active');
  const firstProject = activeProjects[0];
  const leavesTaken = leaves.filter(l => l.status === 'Approved').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Welcome Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-700">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Productivity Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">{user?.name?.split(' ')[0] || 'Employee'}'s Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 flex items-center gap-2 uppercase tracking-tight">
            Weekly Sync Status: <span className="text-blue-600 dark:text-blue-400 font-black">85% COMPLETE</span>
          </p>
        </div>

        <div className="flex items-center gap-2 animate-in slide-in-from-right duration-700">
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl w-full lg:w-auto px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-3 shadow-lg dark:shadow-2xl">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/20">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-right flex-1 lg:flex-none">
              <p className="font-black text-slate-700 dark:text-slate-100 text-[11px] tracking-tight">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p className="text-blue-600 dark:text-blue-400 font-black text-[10px] tabular-nums">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Check-in Widget */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all active:scale-[0.99]">
              <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.07] transition-all pointer-events-none">
                <Clock className="w-24 h-24 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Time Registry</h3>
                  {isCheckedIn && (
                    <span className="flex items-center gap-1 text-[7px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums uppercase">{isCheckedIn ? 'Personnel In' : 'Personnel Out'}</p>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-[8px] uppercase tracking-widest mt-0.5">
                    {isCheckedIn ? `LOGGED: ${checkInTime}` : 'SHIFT INACTIVE'}
                  </p>
                </div>
                {companySettings && (
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-center text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <span>Protocol Shift</span>
                      <span className="text-blue-600 dark:text-blue-400 font-black tracking-tight">{companySettings.workingHours.checkIn} - {companySettings.workingHours.checkOut}</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleCheckInOut}
                  className={`w-full py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm ${isCheckedIn
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10'
                    }`}
                >
                  {isCheckedIn ? 'Execute Exit' : 'Initialize Entry'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xl dark:shadow-2xl group transition-all">
              <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-6">Stats Radar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-all group-hover:bg-emerald-500 group-hover:text-white border border-emerald-100 dark:border-emerald-500/20">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Growth</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">+12.4%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white border border-blue-100 dark:border-blue-500/20">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accuracy</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">98.2%</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">
                  <Navigation className="w-3 h-3" />
                  {checkInLoc ? `${checkInLoc}` : 'Geofence Active'}
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Chart Section */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Productivity Registry</h3>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Operational Flow</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="flex-1 sm:flex-none px-3 py-1 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm">Cycle</button>
                <button className="flex-1 sm:flex-none px-3 py-1 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Phase</button>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 900 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                  <Bar dataKey="hours" radius={[4, 4, 4, 4]} barSize={16}>
                    {weeklyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.hours > 0 ? '#3b82f6' : (document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9')} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (4 units) */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          {/* Quick Pulse */}
          <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl dark:shadow-2xl text-white relative overflow-hidden group">
            <Target className="absolute -top-10 -right-10 w-32 h-32 opacity-10 group-hover:scale-125 transition-all duration-700" />
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">Velocity</h3>
            <div className="space-y-3">
              <div className="bg-white/5 backdrop-blur-xl p-3 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span className="text-[11px] font-black">{firstProject ? firstProject.name : 'No Active Projects'}</span>
                <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">{firstProject ? firstProject.progress : 0}%</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-3 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span className="text-[11px] font-black">Leaves Taken</span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">{leavesTaken} Days</span>
              </div>
            </div>
          </div>

          {/* Meetings List */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Agenda</h3>
              <button onClick={() => onNavigate('Meetings')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">All <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-3">
              {meetings.length > 0 ? meetings.slice(0, 2).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <span className="text-[7px] font-bold text-blue-500 dark:text-blue-300 group-hover:text-blue-100 uppercase">{new Date(m.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-sm font-black text-blue-600 dark:text-white group-hover:text-white leading-none">{new Date(m.date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate tracking-tight">{m.title}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">{m.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-bold py-4">No upcoming meetings</p>
              )}
            </div>
          </div>

          {/* Holidays List */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Holidays</h3>
              <button onClick={() => onNavigate('Holidays')} className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">List <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-3">
              {holidays
                .filter(h => h.date && new Date(h.date) >= new Date())
                .slice(0, 2)
                .map((h) => (
                  <div key={h.id} className="flex items-center gap-3 p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="text-[7px] font-bold uppercase">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-black leading-none">{new Date(h.date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-700 dark:text-white truncate tracking-tight">{h.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{h.type}</p>
                    </div>
                  </div>
                ))}
              {holidays.filter(h => h.date && new Date(h.date) >= new Date()).length === 0 && (
                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-bold py-4">No upcoming holidays</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
