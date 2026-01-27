import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';
import { Icons } from '../constants';
import { attendanceService } from '../src/api/attendanceService';
import { leaveService, LeaveRequest } from '../src/api/leaveService';
import { holidayService } from '../src/api/holidayService';
import { meetingService } from '../src/api/meetingService';
import { Holiday, Meeting, ScreenType } from '../types';

interface DashboardProps {
  onNavigate?: (screen: ScreenType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [metric, setMetric] = useState<'actual' | 'overtime'>('actual');

  // Real Data State
  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    onLeave: 0,
    halfDay: 0
  });
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Chart Data State
  const [attendanceChartData, setAttendanceChartData] = useState<any[]>([
    { name: 'Mon', actual: 0, overtime: 0 },
    { name: 'Tue', actual: 0, overtime: 0 },
    { name: 'Wed', actual: 0, overtime: 0 },
    { name: 'Thu', actual: 0, overtime: 0 },
    { name: 'Fri', actual: 0, overtime: 0 },
    { name: 'Sat', actual: 0, overtime: 0 },
    { name: 'Sun', actual: 0, overtime: 0 }
  ]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Summary Stats
      const summary = await attendanceService.getSummary(); // { totalEmployees, present, absent, halfDay }

      // 2. Fetch Recently Pending Leaves
      const allLeaves: any[] = await leaveService.getAllLeaves();
      const pendingLeaves = allLeaves.filter(l => l.status === 'pending').slice(0, 3);

      // Calculate "On Leave" today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const onLeaveCount = allLeaves.filter(l => {
        if (l.status !== 'approved') return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      }).length;

      setStats({
        totalEmployees: summary.totalEmployees,
        present: summary.present,
        absent: summary.absent,
        onLeave: typeof summary.onLeave === 'number' ? summary.onLeave : onLeaveCount,
        halfDay: summary.halfDay
      });
      setLeaves(pendingLeaves);

      // 3. Fetch Upcoming Holidays
      const allHolidays: any[] = await holidayService.getAllHolidays();
      setHolidays((Array.isArray(allHolidays) ? allHolidays : [])
        .map((h: any) => ({ ...h, id: h._id }))
        .filter((h: Holiday) => new Date(h.date) >= new Date())
        .sort((a: Holiday, b: Holiday) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3));

      // 4. Fetch Meetings
      const allMeetings = await meetingService.getAllMeetings();
      setMeetings(Array.isArray(allMeetings) ? allMeetings.map((m: any) => ({ ...m, id: m._id })).slice(0, 3) : []);

      // 5. Populate Chart Data (Mocking logic for now based on 'present')
      // Ideally we fetch weekly logs. For now, let's just show 'Today' data on the chart or leave placeholders.
      // Or we can try to fetch logs for the week if we had a range endpoint.
      // We will leave the chart strictly static or randomized based on 'present' to avoid breaking UI if no historical data.
      // Let's update at least one bar with today's real data?
      const dayIndex = new Date().getDay(); // 0-6
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayName = names[dayIndex];

      const newChartData = attendanceChartData.map(d => {
        if (d.name === todayName && summary.totalEmployees > 0) {
          return {
            ...d,
            actual: Math.round((summary.present / summary.totalEmployees) * 100)
          };
        }
        return d;
      });
      setAttendanceChartData(newChartData);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  };

  const pieData = [
    { name: 'Present', value: stats.present, color: '#3b82f6' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
    { name: 'On Leave', value: stats.onLeave, color: '#f59e0b' }
  ];

  // Calculate percentage of active
  const activePercentage = stats.totalEmployees > 0
    ? Math.round((stats.present / stats.totalEmployees) * 100)
    : 0;

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Total Workforce', value: stats.totalEmployees, sub: 'Active', color: 'from-blue-600 to-indigo-700', icon: <Icons.Employees className="w-4 h-4" /> },
          { label: 'Present Today', value: stats.present, sub: `${activePercentage}% Rate`, color: 'from-emerald-500 to-teal-600', icon: <Icons.Check className="w-4 h-4" /> },
          { label: 'Half Day', value: stats.halfDay, sub: '0.5 Day Shift', color: 'from-violet-500 to-purple-600', icon: <Icons.Attendance className="w-4 h-4" /> },
          { label: 'Absent Today', value: stats.absent, sub: 'Needs Review', color: 'from-rose-500 to-pink-600', icon: <Icons.EyeOff className="w-4 h-4" /> },
          { label: 'On Leave Today', value: stats.onLeave, sub: 'Planned', color: 'from-amber-500 to-orange-600', icon: <Icons.Leaves className="w-4 h-4" /> }
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-3 md:p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 transition-all group overflow-hidden relative md:aspect-square flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br opacity-[0.03] dark:opacity-[0.07] rounded-bl-full transform translate-x-2 -translate-y-2 group-hover:scale-150 transition-transform duration-500 from-blue-500 to-indigo-600"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-1.5 md:p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg shadow-blue-500/10`}>
                {stat.icon}
              </div>
            </div>
            <div className="space-y-0.5 relative z-10 mt-2 md:mt-0">
              <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tighter">{stat.value}</h3>
              <p className="text-[7px] md:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Workforce Analytics</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Performance tracking & trends</p>
            </div>
            <div className="flex bg-slate-50 dark:bg-slate-950/40 p-1 rounded-lg border border-slate-100 dark:border-slate-800/50">
              <button
                onClick={() => setMetric('actual')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${metric === 'actual' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              >
                Attendance
              </button>
              <button
                onClick={() => setMetric('overtime')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${metric === 'overtime' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
              >
                Overtime
              </button>
            </div>
          </div>

          <div className="h-[200px] sm:h-[220px] md:h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/50" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }}
                  dx={-5}
                />
                <Tooltip
                  cursor={{ fill: 'currentColor', className: 'text-slate-50/50 dark:text-slate-800/20' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '8px'
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}
                  labelStyle={{ fontSize: '9px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.05em' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}
                />

                {metric === 'actual' ? (
                  <>
                    <Bar
                      dataKey="actual"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={24}
                      name="Attendance Rate (%)"
                    />
                    <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" />
                  </>
                ) : (
                  <Bar
                    dataKey="overtime"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                    name="OT Hours"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Staff Distribution</h3>
          <div className="h-[180px] md:h-[220px] relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={6} wrapperStyle={{ color: '#64748b', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{activePercentage}%</p>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Urgent Approvals</h3>
              <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-0.5">{leaves.length} Requires Action</p>
            </div>
            <button
              onClick={() => onNavigate?.('Leaves')}
              className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all border border-blue-100 dark:border-blue-500/20 shadow-sm"
            >
              Review Queue
            </button>
          </div>
          <div className="space-y-2">
            {leaves.length > 0 ? leaves.map((leave) => (
              <div key={leave._id} onClick={() => onNavigate?.('Leaves')} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 transition-all group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center font-black text-[10px] text-blue-600 dark:text-blue-400 shadow-sm group-hover:scale-105 transition-transform border border-slate-100 dark:border-slate-800 overflow-hidden uppercase">
                    {(leave.user?.name || '?')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">{leave.user?.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase">{leave.leaveType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${leave.status === 'pending' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' : 'text-slate-400 bg-slate-100'}`}>
                    {leave.status}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Search className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Inbox is clear</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Holidays */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-5">Upcoming Break</h3>
            <div className="space-y-3">
              {holidays.length > 0 ? holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center space-x-3 group cursor-pointer p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all border border-indigo-100 dark:border-indigo-500/20 shadow-sm shrink-0">
                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-70">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-sm font-black leading-none">{new Date(holiday.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{holiday.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{holiday.type}</p>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No holidays soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Meetings */}
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-5">Team Sync</h3>
            <div className="space-y-3">
              {meetings.length > 0 ? meetings.map((meeting) => (
                <div key={meeting.id} className="relative pl-4 border-l-2 border-blue-500 group cursor-pointer hover:bg-slate-50 dark:hover:bg-blue-500/10 py-2.5 px-3 rounded-r-xl transition-all">
                  <p className="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{meeting.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest">{meeting.time} • {meeting.attendees?.length || 0} Members</p>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Schedule is open</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;