
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { holidayService } from '../src/api/holidayService';
import { Holiday } from '../types';

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState<Partial<Holiday>>({
    name: '',
    date: '',
    type: 'Public'
  });

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const data = await holidayService.getAllHolidays();
      const mapped = Array.isArray(data) ? data.map((h: any) => ({
        ...h,
        id: h._id
      })) : [];
      setHolidays(mapped);
    } catch (err) {
      console.error('Failed to fetch holidays', err);
    }
  };

  const handleSaveHoliday = async () => {
    try {
      if (editingHoliday) {
        await holidayService.updateHoliday(editingHoliday.id, formData);
      } else {
        // @ts-ignore
        await holidayService.createHoliday(formData);
      }
      fetchHolidays();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save holiday', err);
      alert('Failed to save holiday');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidayService.deleteHoliday(id);
      fetchHolidays();
    } catch (err) {
      console.error('Failed to delete holiday', err);
      alert('Failed to delete holiday');
    }
  };

  const handleOpenEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.split('T')[0],
      type: holiday.type
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingHoliday(null);
    setFormData({ name: '', date: '', type: 'Public' });
  };

  // Calendar Logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Company Holidays</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">Scheduled events for {currentMonth.getFullYear()}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 flex items-center shadow-lg shadow-blue-500/10 transition-all active:scale-95"
        >
          <Icons.Plus className="w-3.5 h-3.5" />
          <span className="ml-1.5">Add Holiday</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar View */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
              {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
            </h3>
            <div className="flex space-x-2">
              <button onClick={prevMonth} className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">&larr;</button>
              <button onClick={nextMonth} className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">&rarr;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 md:h-20 bg-slate-50/30 dark:bg-slate-950/30 rounded-lg opacity-30"></div>
            ))}
            {Array.from({ length: daysInMonth(currentMonth) }, (_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);

              return (
                <div key={i} className={`h-16 md:h-20 border border-slate-100 dark:border-slate-800 rounded-lg p-2 flex flex-col transition-all group hover:border-blue-500 dark:hover:border-blue-500/50 ${holiday ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-900/50'}`}>
                  <span className={`text-xs font-black ${holiday ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>{dayNum}</span>
                  {holiday && (
                    <div className="mt-1 text-white text-[7px] font-black overflow-hidden truncate leading-tight uppercase tracking-tighter">
                      {holiday.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* List View */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50 p-4 flex flex-col">
          <h3 className="font-black text-xs text-slate-900 dark:text-white mb-4 uppercase tracking-widest">Upcoming List</h3>
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
            {holidays.length > 0 ? holidays.map((holiday) => (
              <div key={holiday.id} className="group flex items-center p-2 rounded-lg border border-slate-50 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center rounded-lg mr-3 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <span className="text-[7px] font-black uppercase leading-none">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-sm font-black leading-none">{new Date(holiday.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate tracking-tight uppercase">{holiday.name}</p>
                  <p className="text-[8px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tighter">{holiday.type}</p>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  {new Date(holiday.date).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) ? (
                    <>
                      <button
                        onClick={() => handleOpenEdit(holiday)}
                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Edit Holiday"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Holiday"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </>
                  ) : (
                    <span className="p-1 text-slate-300 dark:text-slate-700 cursor-not-allowed" title="Past holidays cannot be modified">
                      <Icons.Search className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            )) : <p className="text-center text-slate-500 text-[10px] font-bold py-10 uppercase tracking-widest">No listings</p>}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Title</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Foundation Day"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-0.5">Type</label>
                  <select
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Public">Public</option>
                    <option value="Company">Company</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleCloseModal} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button onClick={handleSaveHoliday} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  {editingHoliday ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
