
import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../constants';
import { Employee, ScreenType } from '../types';
import { employeeService } from '../src/api/employeeService';

const ITEMS_PER_PAGE = 8;

interface EmployeesProps {
  onNavigate: (screen: ScreenType, id?: string | null) => void;
}

const Employees: React.FC<EmployeesProps> = ({ onNavigate }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees();
      // Map backend data to frontend model if necessary
      // Backend returns: { _id, name, email, role, designation, status, ... }
      // Frontend expects: { id, name, email, role, designation, status, salary, image... }
      const formatStatus = (s: string) => {
        if (s === 'active') return 'Active';
        if (s === 'on_leave') return 'On Leave';
        if (s === 'terminated') return 'Terminated';
        return s.charAt(0).toUpperCase() + s.slice(1);
      };

      const mapped = data.map((u: any) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role === 'admin' ? 'Admin' : (u.role === 'sub-admin' ? 'Manager' : 'Employee'),
        designation: u.designation || 'N/A',
        status: formatStatus(u.status || 'active'),
        salary: u.salary || 0,
        image: u.image || `https://ui-avatars.com/api/?name=${u.name}`,
        phone: u.phone || 'N/A',
        location: u.location || 'N/A',
        workMode: u.workMode || 'WFO'
      }));
      setEmployees(mapped);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtering & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Form States
  const [roleType, setRoleType] = useState<'preset' | 'custom'>('preset');
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [customRole, setCustomRole] = useState('');
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Memoized Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All' || emp.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, filterStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      salary: '', // Changed to empty string for input type="number"
      salaryType: 'monthly', // Added
      status: 'Active',
      password: '',
      location: '',
      workMode: 'WFO',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setRoleType('preset');
    setSelectedRole('Developer');
    setCustomRole('');
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      ...emp,
      password: '',
      salary: emp.salary, // Ensure salary is passed as number or string
      status: emp.status,
      phone: emp.phone,
      location: emp.location,
      workMode: emp.workMode || 'WFO',
      salaryType: (emp as any).salaryType || 'monthly',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }); // Don't show hash or old password
    const isPreset = ['Developer', 'Designer', 'Manager', 'Marketing'].includes(emp.role);
    if (isPreset) {
      setRoleType('preset');
      setSelectedRole(emp.role);
    } else {
      setRoleType('custom');
      setCustomRole(emp.role);
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CUSTOM_TRIGGER') {
      setRoleType('custom');
    } else {
      setSelectedRole(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = roleType === 'custom' ? customRole : selectedRole;

    // Construct payload
    // We are putting frontend 'role' into designation for now or valid field? 
    // Wait, earlier I decided to put it in valid fields.
    // If I map `finalRole` to `role` in the object sent to `createEmployee`, 
    // my `employeeService` ignores it or tries to send it.
    // Let's send it.

    const employeeData = {
      ...formData,
      role: finalRole,
      salary: Number(formData.salary),
      salaryType: formData.salaryType || 'monthly', // Added salaryType to payload
      status: formData.status?.toLowerCase() || 'active',
      phone: formData.phone,
      location: formData.location,
      workMode: formData.workMode,
      joiningDate: formData.joiningDate
    };

    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, employeeData);
        // Optimistically update or refetch
        fetchEmployees();
      } else {
        await employeeService.createEmployee(employeeData);
        fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to save employee', err);
      alert('Failed to save employee');
    }

    resetForm();
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await employeeService.deleteEmployee(deletingId);
        setEmployees(employees.filter(emp => emp.id !== deletingId));
      } catch (err) {
        console.error('Failed to delete', err);
        alert('Failed to delete employee');
      }
      setDeletingId(null);
      if (paginatedEmployees.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    }
  };

  const handleViewOverview = (userId: string) => {
    onNavigate('EmployeeOverview', userId);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Icons.Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-[11px] font-bold rounded-lg focus:ring-2 focus:ring-blue-500/50 block pl-9 p-2 w-full md:w-64 shadow-sm outline-none placeholder:text-slate-400 dark:text-slate-200 transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-2 border rounded-lg shadow-sm transition-all active:scale-95 ${filterStatus !== 'All' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <Icons.Filter className="w-4 h-4" />
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full mt-2 right-0 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest p-2 mb-1">Status Filter</p>
                {['All', 'Active', 'On Leave', 'Terminated'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setShowFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all ${filterStatus === status ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all active:scale-95"
        >
          <Icons.Plus className="w-3.5 h-3.5 mr-1.5" />
          <span>Register Staff</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
              <tr className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <th className="px-4 py-3">Identity</th>
                <th className="px-4 py-3">Role & Office</th>
                <th className="px-4 py-3">Communication</th>
                <th className="px-4 py-3">Employment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="relative">
                        <img className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm object-cover group-hover:scale-105 transition-transform" src={emp.image} alt="" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-900 ${emp.status === 'Active' ? 'bg-emerald-500' : emp.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                      </div>
                      <div className="ml-3 leading-tight">
                        <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{emp.name}</div>
                        <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">ID: {emp.id.substring(emp.id.length - 6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{emp.role}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{emp.designation}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-tight">{emp.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{emp.phone !== 'N/A' ? emp.phone : 'NO CONTACT'}</span>
                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">{emp.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md ${emp.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        emp.status === 'On Leave' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                        {emp.status}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter ml-0.5">{emp.workMode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                    <button
                      onClick={() => handleViewOverview(emp.id)}
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 p-1.5 rounded-lg transition-all active:scale-90"
                      title="View Overview"
                    >
                      <Icons.Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(emp)}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 p-1.5 rounded-lg transition-all active:scale-90"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button
                      onClick={() => setDeletingId(emp.id)}
                      className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 p-1.5 rounded-lg transition-all active:scale-90"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center border-2 border-dashed border-slate-50 dark:border-slate-800/50 m-4 rounded-xl">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 mb-3">
                        <Icons.Search className="w-5 h-5" />
                      </div>
                      <p className="text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest">No staff records discovered</p>
                      <p className="text-slate-400 text-[10px] uppercase font-bold mt-1">Refine your search parameters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50/50 dark:bg-slate-950/30 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {totalPages > 0 ? `BATCH ${currentPage} / ${totalPages}` : 'NO DATA'}
            <span className="ml-2.5 opacity-50">[{filteredEmployees.length} TOTAL]</span>
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || totalPages === 0}
              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded transition-all ${currentPage === 1 || totalPages === 0 ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shadow-sm active:scale-95'}`}
            >
              Back
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded transition-all ${currentPage === totalPages || totalPages === 0 ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shadow-sm active:scale-95'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[6px] flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingEmployee ? 'Update Identity' : 'Register Staff'}</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Authentication & Profile</p>
              </div>
              <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Personnel Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Electronic Mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Compensation</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="flex-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-2 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-slate-100"
                      required
                    />
                    <select
                      value={formData.salaryType || 'monthly'}
                      onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as any })}
                      className="w-20 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-2 text-[9px] font-black uppercase focus:bg-white outline-none dark:text-slate-300 dark:bg-slate-900"
                    >
                      <option value="monthly">MO</option>
                      <option value="annual">YR</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Contact Sync</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Base Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Work Paradigm</label>
                  <select
                    value={formData.workMode || 'WFO'}
                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value as any })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest outline-none dark:text-slate-200 dark:bg-slate-900"
                  >
                    <option value="WFO">Office-Based</option>
                    <option value="WFH">Remote-First</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Engage Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-1.5 text-[11px] font-bold outline-none dark:text-slate-200 dark:bg-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">{editingEmployee ? 'Reset Security Key' : 'Security Key'}</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-bold focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-slate-100"
                  placeholder={editingEmployee ? "UNTOUCHED" : "••••••••"}
                  required={!editingEmployee}
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Organizational Role</label>
                  <select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest outline-none dark:text-slate-200 dark:bg-slate-900"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="Marketing">Marketing</option>
                    <option value="CUSTOM_TRIGGER">+ Special</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Deployment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest outline-none dark:text-slate-200 dark:bg-slate-900"
                  >
                    <option value="Active">Operational</option>
                    <option value="On Leave">Standby</option>
                    <option value="Terminated">Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">Discard</button>
                <button type="submit" className="flex-[1.5] px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                  {editingEmployee ? 'Sync Changes' : 'Execute Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-sm font-black text-center text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Decommission Personnel?</h3>
            <p className="text-center text-slate-500 dark:text-slate-400 text-[10px] font-bold mb-6 uppercase tracking-tight leading-relaxed">Warning: This operation is final. All associated data will be purged from the central database.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-rose-600 text-white font-black text-[10px] uppercase rounded-lg shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
