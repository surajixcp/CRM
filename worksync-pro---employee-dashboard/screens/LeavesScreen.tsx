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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Time Off Hub Registry</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-tight">Personnel leave allocations & status flow</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      {/* Leave Balance Cards refined */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {leaveBalances.map((balance, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className={`absolute top-0 left-0 w-1 h-full ${balance.bar} opacity-60`} />
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{balance.type} Quota</h3>
                  <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5 tracking-tight">{Math.max(0, balance.total - balance.used)} Days</p>
                </div>
                <div className={`w-8 h-8 rounded-xl ${balance.bg} ${balance.accent} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <Calendar className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[7px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">CONSUMED: {balance.used}</span>
                  <span className="text-slate-800 dark:text-slate-300">LIMIT: {balance.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800/50">
                  <div
                    className={`h-full ${balance.bar} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`}
                    style={{ width: `${Math.min(100, (balance.used / balance.total) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applied Leaves Table refined */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-800 dark:text-white tracking-tight text-base uppercase">Personnel Requests</h3>
            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Lifecycle Tracking</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 group focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
            <Search className="w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="FILTER LOGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold text-slate-700 dark:text-slate-200 focus:ring-0 placeholder:text-slate-400 w-full sm:w-44 outline-none uppercase"
            />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
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
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
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
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-xs">No leave requests found</td></tr>
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
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in">
            <div className="px-6 h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Leave Application</h3>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">HR Internal Gateway</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleApply}>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Maternity/Paternity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || minDate}
                    disabled={formData.isHalfDay}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none ${formData.isHalfDay ? 'opacity-50 grayscale' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Verification Reason</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Details for approval..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                />
              </div>

              {policy?.enableHalfDay && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Half-Day Leave</span>
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
                    className={`w-9 h-5 rounded-full transition-all relative ${formData.isHalfDay ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isHalfDay ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-xl flex gap-3 text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg h-fit shadow-sm">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">Compliance Notice</p>
                  <p className="text-[10px] font-bold leading-relaxed opacity-80">
                    Requests are subject to department load and policy verification. Approval typically takes <span className="text-blue-600 dark:text-blue-400">24-48 hours</span>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] font-black text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesScreen;
