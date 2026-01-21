import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { employeeService } from '../src/api/employeeService';

interface EmployeeOverviewProps {
    userId: string;
    onBack: () => void;
}

const EmployeeOverview: React.FC<EmployeeOverviewProps> = ({ userId, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState<any>(null);

    useEffect(() => {
        const fetchOverview = async () => {
            setLoading(true);
            try {
                const data = await employeeService.getEmployeeOverview(userId);
                setOverviewData(data);
            } catch (err) {
                console.error('Failed to fetch overview', err);
                alert('Failed to fetch employee overview');
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
            </div>
        );
    }

    if (!overviewData) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500 uppercase font-black tracking-widest">No intelligence found for this identifier.</p>
                <button onClick={onBack} className="mt-4 text-blue-500 uppercase font-black text-[10px] tracking-widest hover:underline">Back to Personnel Inventory</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 transition-all active:scale-95 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Personnel Intelligence</h3>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-0.5">Comprehensive Performance Overview</p>
                    </div>
                </div>
            </div>

            {/* Profile Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] gap-8 shadow-xl shadow-slate-100/50 dark:shadow-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <img
                        src={overviewData.profile.image || `https://ui-avatars.com/api/?name=${overviewData.profile.name}`}
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl"
                        alt={overviewData.profile.name}
                    />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{overviewData.profile.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${overviewData.profile.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                {overviewData.profile.status}
                            </span>
                        </div>
                        <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.15em]">{overviewData.profile.designation}</p>
                        <div className="flex items-center gap-3 mt-3">
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                <Icons.Attendance className="w-3 h-3 opacity-50" />
                                Joined {new Date(overviewData.profile.joiningDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric', day: 'numeric' })}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                <Icons.Dashboard className="w-3 h-3 opacity-50" />
                                ID: #{overviewData.profile._id.substring(overviewData.profile._id.length - 6).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Scale</p>
                        <span className="text-lg font-black text-slate-900 dark:text-white uppercase">₹{Number(overviewData.profile.salary).toLocaleString()}</span>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Employment</p>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase">FULL-TIME</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                {[
                    { label: 'Present', value: overviewData.attendanceStats.present, color: 'emerald', Icon: Icons.Check },
                    { label: 'Absent', value: overviewData.attendanceStats.absent, color: 'rose', Icon: Icons.EyeOff },
                    { label: 'Late', value: overviewData.attendanceStats.late, color: 'amber', Icon: Icons.Bell },
                    { label: 'Leaves', value: overviewData.attendanceStats.leave, color: 'blue', Icon: Icons.Leaves },
                    { label: 'Holidays', value: overviewData.attendanceStats.holiday, color: 'purple', Icon: Icons.Holidays },
                    { label: 'Weekends', value: overviewData.attendanceStats.weekend, color: 'slate', Icon: Icons.ArrowRight },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100/30 dark:shadow-none transition-all hover:scale-105 hover:border-${stat.color}-500 group-hover:z-20`}>
                        <div className="flex justify-between items-start mb-4">
                            <p className={`text-[10px] font-black text-${stat.color}-600 dark:text-${stat.color}-400 uppercase tracking-widest`}>{stat.label}</p>
                            <div className={`text-${stat.color}-500 opacity-30 group-hover:opacity-100 transition-opacity`}>
                                <stat.Icon className="w-4 h-4" />
                            </div>
                        </div>
                        <p className={`text-3xl font-black text-slate-900 dark:text-white`}>{stat.value}</p>
                        <div className="mt-4 h-1 w-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-${stat.color}-500`} style={{ width: '40%' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leave Distribution */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Leave Analytics</h5>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Annualized Balance</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6 shadow-xl shadow-slate-100/50 dark:shadow-none">
                        {Object.keys(overviewData.leaveBreakdown).length > 0 ? Object.entries(overviewData.leaveBreakdown).map(([type, count]: [any, any]) => (
                            <div key={type} className="space-y-3">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {type}
                                    </span>
                                    <span>{count} Days Used</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min((count / 15) * 100, 100)}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                                    <Icons.Leaves className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No leave data discovered in this cycle</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Projects */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Project Deployment</h5>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{overviewData.projects.length} Assigned</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar shadow-xl shadow-slate-100/50 dark:shadow-none">
                        {overviewData.projects.length > 0 ? overviewData.projects.map((proj: any) => (
                            <div key={proj._id} className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-blue-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="leading-tight">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{proj.name}</p>
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1.5">{proj.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{proj.progress}%</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${proj.progress}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                                    <Icons.Projects className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No project assignments discovered</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Salary Snapshot */}
            <div className="relative overflow-hidden p-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                    <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-1 bg-blue-500 rounded-full"></div>
                            <h5 className="text-[12px] font-black uppercase tracking-[0.3em] opacity-80">Compensation Snapshot</h5>
                        </div>

                        {overviewData.recentSalary ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Latest Payout</p>
                                    <p className="text-2xl font-black uppercase tracking-widest">{overviewData.recentSalary.month}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Net Remittance</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-black opacity-50">₹</span>
                                        <p className="text-4xl font-black tabular-nums">{parseFloat(overviewData.recentSalary.totalPayable).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Remittance status</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl border border-emerald-500/30">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[11px] font-black uppercase tracking-tight text-emerald-300">{overviewData.recentSalary.status}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4">
                                <p className="text-sm font-bold uppercase italic opacity-40 tracking-wider">No persistent financial records discovered for this cycle</p>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0">
                        <div className="w-24 h-24 rounded-[2rem] bg-white/5 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Icons.Salary className="w-10 h-10 text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeOverview;
