import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
        if (s === 'blocked') return 'Blocked';
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
      status: formData.status || 'Active',
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

  const handleStatusToggle = async (emp: Employee) => {
    const newStatus: 'Active' | 'Blocked' = emp.status === 'Blocked' ? 'Active' : 'Blocked' as any;
    const confirmMsg = emp.status === 'Blocked'
      ? `Are you sure you want to restore access for ${emp.name}?`
      : `Are you sure you want to BLOCK ${emp.name}? They will lose all access immediately.`;

    if (window.confirm(confirmMsg)) {
      try {
        await employeeService.updateEmployee(emp.id, { status: newStatus });
        fetchEmployees();
      } catch (err) {
        console.error('Failed to toggle status', err);
        alert('Failed to update employee status');
      }
    }
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
                {['All', 'Active', 'On Leave', 'Blocked', 'Terminated'].map(status => (
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
                        emp.status === 'On Leave' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          emp.status === 'Blocked' ? 'bg-slate-900 dark:bg-slate-800 text-white' :
                            'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                        {emp.status}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter ml-0.5">{emp.workMode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-1 flex items-center justify-end">
                    <button
                      onClick={() => handleStatusToggle(emp)}
                      className={`p-1.5 rounded-lg transition-all active:scale-90 ${emp.status === 'Blocked' ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-400/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10'}`}
                      title={emp.status === 'Blocked' ? 'Unblock User' : 'Block User'}
                    >
                      {emp.status === 'Blocked' ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 11V7a4 4 0 118 0m4 4V7a4 4 0 00-8 0v4h8z"></path></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      )}
                    </button>
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
      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-[8px] flex items-center justify-center z-[9999] p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.5)] w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-400 border border-slate-200 dark:border-slate-800 relative">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingEmployee ? 'Update Identity' : 'Register Staff'}</h3>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Authentication & Profile</p>
              </div>
              <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[85vh] custom-scrollbar" onSubmit={handleSubmit}>
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5 flex items-center">
                  <span className="w-1 h-3 bg-blue-600 rounded-full mr-2"></span>
                  Personnel Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="E.G. ALEXANDER PIERCE"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Electronic Mail</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="MAIL@WORKSTREAM.IO"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Compensation</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <select
                      value={formData.salaryType || 'monthly'}
                      onChange={(e) => setFormData({ ...formData, salaryType: e.target.value as any })}
                      className="w-24 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl px-2 text-[10px] font-black text-slate-900 dark:text-white uppercase focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="monthly">MONTHLY</option>
                      <option value="annual">ANNUAL</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Contact Sync</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Base Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="E.G. NEW YORK, USA"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Work Paradigm</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <select
                      value={formData.workMode || 'WFO'}
                      onChange={(e) => setFormData({ ...formData, workMode: e.target.value as any })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="WFO">OFFICE-BASED</option>
                      <option value="WFH">REMOTE-FIRST</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Engage Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">{editingEmployee ? 'Reset Security Key' : 'Security Key'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder={editingEmployee ? "LEAVE EMPTY TO KEEP CURRENT" : "••••••••"}
                    required={!editingEmployee}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Organizational Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <select
                      value={selectedRole}
                      onChange={handleRoleChange}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="Developer">DEVELOPER</option>
                      <option value="Designer">DESIGNER</option>
                      <option value="Manager">MANAGER</option>
                      <option value="Marketing">MARKETING</option>
                      <option value="CUSTOM_TRIGGER">+ SPECIAL ROLE</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-0.5">Deployment Status</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-black text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="Active">OPERATIONAL</option>
                      <option value="On Leave">STANDBY</option>
                      <option value="Blocked">RESTRICTED</option>
                      <option value="Terminated">DECOMMISSIONED</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
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
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {deletingId && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default Employees;
