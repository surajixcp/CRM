
import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../constants';
import { leaveService, LeaveRequest } from '../src/api/leaveService';
import { settingService } from '../src/api/settingService';

const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [policy, setPolicy] = useState({
    casualLeave: 12,
    sickLeave: 10,
    annualLeave: 18,
    maternityLeave: 12,
    requireApproval: true,
    notifyStaff: true,
    enableHalfDay: false
  });
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Fetch leaves on mount and when filter changes
  useEffect(() => {
    fetchLeaves();
    fetchPolicy();
  }, [statusFilter]);

  const fetchPolicy = async () => {
    try {
      const settings = await settingService.getSettings();
      if (settings.leavePolicy) {
        setPolicy(settings.leavePolicy);
      }
    } catch (err) {
      console.error("Failed to fetch policy", err);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      await settingService.updateSettings({ leavePolicy: policy });
      setShowPolicyModal(false);
    } catch (err) {
      alert("Failed to update policy");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const data = await leaveService.getAllLeaves(statusFilter);
      // Backend returns _id, map to id if needed for older components of just use _id
      setLeaves(data);
    } catch (error) {
      console.error('Failed to fetch leaves', error);
    }
  };

  // Internal Filtering Logic for search (status is handled by API now, but we can double filter or just use API)
  // Let's keep search client side for now as it is powerful enough for small lists
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const userName = leave.user?.name || 'Unknown';
      const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchQuery.toLowerCase());
      // Status filter already applied by API, but if we did 'All' in API and filter locally:
      // const matchesStatus = statusFilter === 'All' || leave.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch;
    });
  }, [leaves, searchQuery]);

  const handleApprove = async (id: string) => {
    try {
      await leaveService.approveLeave(id);
      fetchLeaves(); // Refresh
    } catch (error) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await leaveService.rejectLeave(id);
      fetchLeaves(); // Refresh
    } catch (error) {
      alert('Failed to reject');
    }
  };

  const inputClasses = "w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400";
  const labelClasses = "text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5 mb-1 block";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Leave Board</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">Review and manage staff absence requests</p>
        </div>
        <button
          onClick={() => setShowPolicyModal(true)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 flex items-center shadow-sm"
        >
          <Icons.Settings className="w-3.5 h-3.5" />
          <span className="ml-1.5">Policy Configuration</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900/40 backdrop-blur-xl p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icons.Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search employees or reasons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-slate-200"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                : 'bg-white dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
              <tr className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Timeline</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Reasoning</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredLeaves.length > 0 ? filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400">
                        {(leave.user?.name || '?')[0]}
                      </div>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{leave.user?.name || 'Anonymous Staff'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-500/20 uppercase tracking-widest">{leave.leaveType}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
                    {new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-black text-slate-600 dark:text-slate-400">
                    {leave.leaveDuration === 0.5 ? '0.5 Day' :
                      leave.leaveDuration > 1 ? `${leave.leaveDuration} Days` : '1 Day'}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold italic truncate">"{leave.reason}"</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md ${leave.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                      leave.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {leave.status === 'pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="px-2 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave._id)}
                          className="px-2 py-1 bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-rose-700 shadow-lg shadow-rose-500/10 transition-all active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all">
                        <Icons.Search className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center border-dashed border-2 border-slate-50 dark:border-slate-800/50 m-4 rounded-xl">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4">
                        <Icons.Leaves className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No requests found</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tight mt-1">Clear filters to see more listings</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Settings Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 scale-90 md:scale-100">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Leave Policy</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Global parameters</p>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar" onSubmit={handleUpdatePolicy}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
                  <h4 className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">Allowance Configuration</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Casual (Days)</label>
                    <input
                      type="number"
                      value={policy.casualLeave}
                      onChange={(e) => setPolicy({ ...policy, casualLeave: parseInt(e.target.value) })}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Sick (Days)</label>
                    <input
                      type="number"
                      value={policy.sickLeave}
                      onChange={(e) => setPolicy({ ...policy, sickLeave: parseInt(e.target.value) })}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Annual (Days)</label>
                    <input
                      type="number"
                      value={policy.annualLeave}
                      onChange={(e) => setPolicy({ ...policy, annualLeave: parseInt(e.target.value) })}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Maternity (Weeks)</label>
                    <input
                      type="number"
                      value={policy.maternityLeave}
                      onChange={(e) => setPolicy({ ...policy, maternityLeave: parseInt(e.target.value) })}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-600 rounded-full"></div>
                  <h4 className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">Operational Flow</h4>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Require Manager Approval', key: 'requireApproval' },
                    { label: 'Automated Email Alerts', key: 'notifyStaff' },
                    { label: 'Half-Day System', key: 'enableHalfDay' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 transition-all">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{item.label}</span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={(policy as any)[item.key]}
                          onChange={(e) => setPolicy({ ...policy, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPolicyModal(false)} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Discard</button>
                <button
                  type="submit"
                  disabled={isSavingPolicy}
                  className="flex-[1.5] px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingPolicy ? 'Syncing...' : 'Update Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
