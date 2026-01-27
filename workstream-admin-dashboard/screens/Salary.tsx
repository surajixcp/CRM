
import React, { useState, useEffect } from 'react';
import { salaryService } from '../src/api/salaryService';
import { settingService, CompanySettings } from '../src/api/settingService';
import { SalaryRecord } from '../types';
import { X, Edit2, Calendar } from 'lucide-react';

const Salary: React.FC = () => {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    baseSalary: 0,
    deductions: 0,
    status: 'Unpaid'
  });

  // Payroll Settings State
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    monthlyBudget: 0,
    salaryDate: 1
  });

  useEffect(() => {
    fetchSalaries();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingService.getSettings();
      setSettings(data);
      if (data.payroll) {
        setSettingsFormData({
          monthlyBudget: data.payroll.monthlyBudget,
          salaryDate: data.payroll.salaryDate
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchSalaries = async () => {
    try {
      const data = await salaryService.getAllSalaries();
      setSalaries(data);
    } catch (err) {
      console.error('Failed to fetch salaries', err);
    }
  };

  const handleProcessBatch = async () => {
    if (!window.confirm('Process payroll for all employees for the current month?')) return;
    try {
      const now = new Date();
      await salaryService.generateBatch(now.getMonth() + 1, now.getFullYear());
      fetchSalaries();
      alert('Batch payroll generated successfully');
    } catch (err) {
      console.error('Failed to generate batch payroll', err);
      alert('Failed to generate batch payroll');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await salaryService.updateSalary(id, { status: 'Paid' });
      fetchSalaries();
    } catch (err) {
      console.error('Failed to update salary', err);
      alert('Failed to update salary status');
    }
  };

  const openEditModal = (salary: SalaryRecord) => {
    setEditingSalary(salary);
    setEditFormData({
      baseSalary: salary.baseSalary,
      deductions: salary.deductions,
      status: salary.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalary) return;
    try {
      await salaryService.updateSalary(editingSalary.id, editFormData);
      setIsEditModalOpen(false);
      fetchSalaries();
    } catch (err) {
      console.error('Failed to update salary', err);
      alert('Failed to update salary');
    }
  };

  const handleUpdatePayrollSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingService.updateSettings({
        payroll: {
          monthlyBudget: settingsFormData.monthlyBudget,
          salaryDate: settingsFormData.salaryDate
        }
      });
      fetchSettings();
      setIsSettingsModalOpen(false);
      alert('Payroll settings updated successfully');
    } catch (err) {
      console.error('Failed to update payroll settings', err);
      alert('Failed to update payroll settings');
    }
  };

  return (
    <div className="space-y-4">
      {/* Analytics Card */}
      <div className="bg-blue-600 dark:bg-blue-700/80 backdrop-blur-xl p-3 md:p-5 rounded-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 shadow-lg shadow-blue-500/20">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <p className="text-blue-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none mb-1">Payroll Budget</p>
            <div className="flex items-center gap-1.5 md:gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">₹{settings?.payroll?.monthlyBudget.toLocaleString() || '0'}<span className="text-blue-200/50 text-[10px] md:text-sm">.00</span></h2>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1 hover:bg-white/20 rounded-md transition-colors"
              >
                <Edit2 className="w-3 md:w-3.5 h-3 md:h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="flex-1 md:flex-none px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all">Report</button>
          <button
            onClick={handleProcessBatch}
            className="flex-1 md:flex-none px-3 md:px-4 py-1.5 bg-white text-blue-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
          >
            Process
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="p-3 md:p-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <h3 className="font-black text-[12px] md:text-sm text-slate-800 dark:text-white uppercase tracking-tight">Salary Registry</h3>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Records: {salaries.length}</span>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
              <tr className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Pay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {salaries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-600 dark:text-blue-400">
                        {item.employeeName[0]}
                      </div>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-tighter uppercase">{item.month}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] font-black text-slate-700 dark:text-slate-300">₹{item.baseSalary.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] font-black text-rose-500">-₹{item.deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] font-black text-slate-900 dark:text-white">₹{item.netPay.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md ${item.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {item.status === 'Unpaid' ? (
                        <button onClick={() => handlePay(item.id)} className="bg-blue-600 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all active:scale-95">Pay Now</button>
                      ) : (
                        <button className="text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">Receipt</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden p-3 grid grid-cols-2 gap-3">
          {salaries.map((item) => (
            <div key={item.id} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-[9px] font-black text-blue-600 border border-blue-100 dark:border-blue-900/50">
                  {item.employeeName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate uppercase mt-0.5">{item.employeeName}</p>
                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{item.month}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Net Pay</p>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white">₹{item.netPay.toLocaleString()}</span>
                  <span className={`px-1 py-0.5 text-[7px] font-black uppercase rounded-md ${item.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{item.status}</span>
                </div>
              </div>
              <div className="flex gap-1.5 pt-1">
                <button onClick={() => openEditModal(item)} className="flex-1 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                  <Edit2 className="w-3 h-3" />
                </button>
                {item.status === 'Unpaid' ? (
                  <button onClick={() => handlePay(item.id)} className="flex-[2] py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-transform">Pay</button>
                ) : (
                  <button className="flex-[2] py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest">Rec</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Salary Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 scale-90 md:scale-100">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Edit Salary Record</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{editingSalary?.employeeName}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSalary} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Base Salary (₹)</label>
                <input
                  type="number"
                  value={editFormData.baseSalary}
                  onChange={(e) => setEditFormData({ ...editFormData, baseSalary: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Deductions (₹)</label>
                <input
                  type="number"
                  value={editFormData.deductions}
                  onChange={(e) => setEditFormData({ ...editFormData, deductions: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Payment Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 scale-90 md:scale-100">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Payroll Settings</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Global Configuration</p>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayrollSettings} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={settingsFormData.monthlyBudget}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, monthlyBudget: Number(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Salary Release Date (Day 1-31)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={settingsFormData.salaryDate}
                    onChange={(e) => setSettingsFormData({ ...settingsFormData, salaryDate: Number(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight ml-0.5 mt-1">Payroll will be processed on this day of every month.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Save Global Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;
