import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { LeaveRequest, LeaveStatus } from '../types';
import { leaveService } from '../services/leaveService';
import { settingService } from '../services/settingService';

const LeavesScreen: React.FC = () => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [policy, setPolicy] = useState<any>(null);
  const [weekendPolicy, setWeekendPolicy] = useState<string[]>(['Sat', 'Sun']);

  // Form State
  const [formData, setFormData] = useState({
    leaveType: 'Sick Leave',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date Logic
  const minDate = useMemo(() => {
    const d = new Date();
    // For half day, allow today. For full day, require tomorrow.
    if (!formData.isHalfDay) {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  }, [formData.isHalfDay]);

  useEffect(() => {
    fetchLeaves();
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const settings = await settingService.getSettings();
      if (settings.leavePolicy) {
        setPolicy(settings.leavePolicy);
      }
      if (settings.weekendPolicy) {
        setWeekendPolicy(settings.weekendPolicy);
      }
    } catch (err) {
      console.error("Failed to fetch policy", err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const data = await leaveService.getMyLeaves();
      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await leaveService.applyLeave({
        ...formData,
        leaveDuration: formData.isHalfDay ? 0.5 : 1
      });
      setIsApplyModalOpen(false);
      setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', isHalfDay: false });
      fetchLeaves();
    } catch (error) {
      console.error("Failed to apply leave", error);
      alert("Failed to apply leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkingDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      if (!weekendPolicy.includes(dayName)) {
        count++;
      }
    }
    return count;
  };

  const calculateUsed = (type: string) => {
    return leaves
      .filter(l => l.status?.toLowerCase() === 'approved' && l.leaveType?.toLowerCase().includes(type.toLowerCase()))
      .reduce((total, leave) => {
        if (leave.leaveDuration) return total + leave.leaveDuration;
        return total + getWorkingDays(leave.startDate, leave.endDate);
      }, 0);
  };

  const leaveBalances = useMemo(() => {
    if (!policy) return [];
    return [
      { type: 'Annual', used: calculateUsed('Annual'), total: policy.annualLeave, color: 'blue', accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', bar: 'bg-blue-500' },
      { type: 'Sick', used: calculateUsed('Sick'), total: policy.sickLeave, color: 'emerald', accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', bar: 'bg-emerald-500' },
      { type: 'Personal', used: calculateUsed('Casual'), total: policy.casualLeave, color: 'amber', accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', bar: 'bg-amber-500' },
    ].filter(b => b.total > 0);
  }, [policy, leaves]);

  const filteredLeaves = leaves.filter(l =>
    (l.leaveType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 lg:gap-4">
        <div>
          <h2 className="text-[14px] md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Time Off Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[7.5px] lg:text-[11px] mt-1 lg:mt-2 uppercase tracking-tight">Personnel leave archives</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-8 py-1 lg:py-4 bg-indigo-600 text-white rounded-md lg:rounded-2xl text-[8.5px] lg:text-xs font-black tracking-widest uppercase hover:bg-indigo-700 shadow-sm lg:shadow-xl lg:shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus className="w-2.5 h-2.5 lg:w-4 lg:h-4" />
          Request Leave
        </button>
      </div>

      {/* Leave Balance Cards refined */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-8">
        {leaveBalances.map((balance, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-2 lg:p-8 rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className={`absolute top-0 left-0 w-0.5 lg:w-1.5 h-full ${balance.bar} opacity-60`} />
            <div className="space-y-1.5 lg:space-y-6">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none underline underline-offset-4 decoration-slate-200 dark:decoration-slate-800">Quota</h3>
                  <p className="text-[10px] lg:text-2xl font-black text-slate-800 dark:text-white mt-1 lg:mt-2 tracking-tight truncate leading-none">{balance.type}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-[9px] lg:text-3xl leading-none mt-1 lg:mt-3 tracking-tighter">{Math.max(0, balance.total - balance.used)}<span className="text-[6px] lg:text-sm uppercase tracking-widest ml-1 font-bold">Days Left</span></p>
                </div>
                <div className={`w-5 h-5 lg:w-14 lg:h-14 rounded-sm lg:rounded-xl ${balance.bg} ${balance.accent} flex items-center justify-center shrink-0 shadow-sm lg:shadow-xl transition-transform group-hover:rotate-6`}>
                  <Calendar className="w-2.5 h-2.5 lg:w-6 lg:h-6" />
                </div>
              </div>

              <div className="space-y-1 lg:space-y-2.5">
                <div className="flex justify-between text-[6.5px] lg:text-[10px] font-black uppercase tracking-widest leading-none">
                  <span className="text-slate-400 dark:text-slate-500">Utilization: {balance.used}</span>
                  <span className="text-slate-800 dark:text-slate-300">Target: {balance.total}</span>
                </div>
                <div className="w-full h-0.5 lg:h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${balance.bar} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(100, (balance.used / balance.total) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applied Leaves Table refined */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-md lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 overflow-hidden">
        <div className="p-2.5 lg:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-[10px] lg:text-xl uppercase leading-none">History</h3>
            <p className="text-[6.5px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 lg:mt-2">Personnel records</p>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-3 bg-slate-50/50 dark:bg-slate-950/50 px-2 lg:px-4 py-0.5 lg:py-2 rounded-sm lg:rounded-xl border border-slate-100 dark:border-slate-800 group focus-within:bg-white dark:focus-within:bg-slate-900 transition-all lg:shadow-inner">
            <Search className="w-2.5 h-2.5 lg:w-4 lg:h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH ARCHIVES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[8px] lg:text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:ring-0 placeholder:text-slate-400 w-full md:w-56 outline-none uppercase tracking-widest"
            />
          </div>
        </div>
        {/* Mobile Card Grid */}
        <div className="md:hidden grid grid-cols-2 gap-2 p-2">
          {filteredLeaves.length > 0 ? filteredLeaves.map((request) => (
            <div key={request.id || request._id} className="bg-slate-50/50 dark:bg-slate-950/40 p-2 rounded-md border border-slate-100 dark:border-slate-800 group transition-all flex flex-col min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">{request.leaveType}</span>
                <div className={`w-1 h-1 rounded-full ${(request.status || '').toLowerCase() === 'approved' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : (request.status || '').toLowerCase() === 'pending' ? 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]'}`} />
              </div>
              <div className="flex flex-col gap-0.5 mb-1 min-w-0">
                <span className="text-[8.5px] font-black text-slate-700 dark:text-slate-200 tracking-tight leading-none">{new Date(request.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-2 h-2 text-slate-300" />
                  <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-tight leading-none">{new Date(request.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <span className={`block text-center py-0.5 rounded-sm text-[6.5px] font-black uppercase tracking-widest ${(request.status || '').toLowerCase() === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50' :
                  (request.status || '').toLowerCase() === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50' :
                    'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50'
                  }`}>
                  {request.status}
                </span>
              </div>
            </div>
          )) : (
            <div className="col-span-2 py-6 text-center text-slate-400 font-bold text-[9px] uppercase tracking-widest">No entries</div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-950/40">
              <tr>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Application Type</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Period</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary</th>
                <th className="px-6 py-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaves.length > 0 ? filteredLeaves.map((request) => (
                <tr key={request.id || request._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-100 tracking-tight">{request.leaveType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 tracking-tight">{new Date(request.startDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600" />
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{new Date(request.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{request.reason}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${(request.status || '').toLowerCase() === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                      (request.status || '').toLowerCase() === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' :
                        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}>
                      {(request.status || '').toLowerCase() === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                      {(request.status || '').toLowerCase() === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                      {(request.status || '').toLowerCase() === 'rejected' && <XCircle className="w-3 h-3" />}
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No trace found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal refined */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-500"
            onClick={() => setIsApplyModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm lg:max-w-xl rounded-t-xl md:rounded-md lg:rounded-3xl shadow-2xl border-t md:border border-slate-100 dark:border-slate-800 overflow-hidden animate-slide-up md:animate-scale-in mt-auto md:mt-0 lg:shadow-indigo-500/10">
            <div className="px-3.5 lg:px-8 h-12 lg:h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-[13px] lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Request leave</h3>
                <p className="text-[7px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 lg:mt-2">Corporate HR Gateway</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 lg:p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-sm lg:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-4 h-4 lg:w-6 lg:h-6" />
              </button>
            </div>
            <form className="p-3.5 lg:p-8 space-y-3 lg:space-y-6" onSubmit={handleApply}>
              <div className="space-y-1 lg:space-y-2">
                <label className="text-[7.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 leading-none underline underline-offset-4 decoration-slate-200 dark:decoration-slate-800">Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md lg:rounded-xl px-3 lg:px-5 py-1.5 lg:py-4 text-[9px] lg:text-sm font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer lg:shadow-inner"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Maternity/Paternity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:gap-4">
                <div className="space-y-1 lg:space-y-2">
                  <label className="text-[7.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 leading-none underline underline-offset-4 decoration-slate-200 dark:decoration-slate-800">Start</label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={formData.startDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData({
                        ...formData,
                        startDate: newDate,
                        endDate: formData.isHalfDay ? newDate : formData.endDate
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md lg:rounded-xl px-3 lg:px-5 py-1.5 lg:py-4 text-[9px] lg:text-sm font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none lg:shadow-inner"
                  />
                </div>
                <div className="space-y-1 lg:space-y-2">
                  <label className="text-[7.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 leading-none underline underline-offset-4 decoration-slate-200 dark:decoration-slate-800">End</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || minDate}
                    disabled={formData.isHalfDay}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md lg:rounded-xl px-3 lg:px-5 py-1.5 lg:py-4 text-[9px] lg:text-sm font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none lg:shadow-inner ${formData.isHalfDay ? 'opacity-50 grayscale' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-1 lg:space-y-2">
                <label className="text-[7.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 leading-none underline underline-offset-4 decoration-slate-200 dark:decoration-slate-800">Reasoning</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Personnel reasoning..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md lg:rounded-xl px-3 lg:px-5 py-1.5 lg:py-4 text-[9px] lg:text-sm font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 outline-none resize-none lg:shadow-inner lg:min-h-[100px]"
                />
              </div>

              {policy?.enableHalfDay && (
                <div className="flex items-center justify-between p-2 lg:p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-md lg:rounded-xl">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <Clock className="w-3 h-3 lg:w-5 lg:h-5 text-indigo-500" />
                    <span className="text-[8px] lg:text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Half-Day Shift</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIsHalf = !formData.isHalfDay;
                      setFormData({
                        ...formData,
                        isHalfDay: nextIsHalf,
                        endDate: nextIsHalf ? formData.startDate : formData.endDate
                      });
                    }}
                    className={`w-7 lg:w-12 h-3.5 lg:h-6 rounded-full transition-all relative ${formData.isHalfDay ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 lg:top-1 w-2.5 lg:w-4 lg:h-4 rounded-full bg-white transition-all ${formData.isHalfDay ? 'left-[14px] lg:left-[30px]' : 'left-0.5 lg:left-1'}`} />
                  </button>
                </div>
              )}

              <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-2 lg:p-4 rounded-md lg:rounded-xl flex gap-2 lg:gap-4 text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                <AlertCircle className="w-3 h-3 lg:w-6 lg:h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[7.5px] lg:text-[11px] font-black uppercase tracking-widest leading-none underline underline-offset-4 decoration-indigo-200 dark:decoration-indigo-800">Compliance Audit</p>
                  <p className="text-[8px] lg:text-xs font-bold leading-tight lg:leading-normal opacity-80 mt-1 lg:mt-2">
                    Personnel requests are processed in <span className="text-indigo-600 dark:text-indigo-400 font-black italic">48 Operational Hours</span>.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 lg:py-5 bg-indigo-600 text-white rounded-md lg:rounded-xl text-[9px] lg:text-sm font-black tracking-widest uppercase hover:bg-indigo-700 shadow-sm lg:shadow-xl lg:shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'PROCESSING...' : 'Submit Personnel application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesScreen;
