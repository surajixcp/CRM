import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { holidayService } from '../services/holidayService';
import { Holiday } from '../types';

const HolidaysScreen: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
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

    // Calendar Logic
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    return (
        <div className="space-y-4 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Holiday Calendar Registry</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] mt-1.5 uppercase tracking-tight">Personnel synchronisation archives & schedule flow</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft p-5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white tracking-tight uppercase">
                            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                        </h3>
                        <div className="flex gap-1.5">
                            <button
                                onClick={prevMonth}
                                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-90"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-90"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-20 md:h-24"></div>
                        ))}
                        {Array.from({ length: daysInMonth(currentMonth) }, (_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);

                            return (
                                <div key={dateStr} className={`h-20 md:h-24 border border-slate-50 dark:border-slate-800/50 rounded-xl p-2.5 flex flex-col transition-all group hover:border-indigo-100 dark:hover:border-indigo-500/30 ${holiday ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900/30'}`}>
                                    <span className={`text-xs font-bold ${holiday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>{dayNum}</span>
                                    {holiday && (
                                        <div className="mt-1.5 bg-indigo-600 dark:bg-indigo-500 text-white text-[8px] p-1.5 rounded-lg font-bold overflow-hidden truncate shadow-sm animate-scale-in">
                                            {holiday.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* List View */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-900 dark:bg-slate-800/50 p-5 rounded-2xl shadow-premium text-white relative overflow-hidden group border border-slate-800/50">
                        <Star className="absolute -top-6 -right-6 w-20 h-20 opacity-10 group-hover:scale-125 transition-transform" />
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Upcoming Events</h3>
                        <div className="space-y-3">
                            {holidays
                                .filter(h => new Date(h.date) >= new Date())
                                .slice(0, 4)
                                .map((holiday) => (
                                    <div key={holiday.id} className="bg-white/5 backdrop-blur-xl p-3 rounded-xl border border-white/10 flex items-center gap-3 group/item hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex flex-col items-center justify-center shrink-0 border border-white/10 group-hover/item:bg-indigo-600 transition-colors">
                                            <span className="text-[8px] font-black uppercase text-indigo-300 group-hover/item:text-indigo-100">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-sm font-black leading-none">{new Date(holiday.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold truncate tracking-tight">{holiday.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{holiday.type}</p>
                                        </div>
                                    </div>
                                ))}
                            {holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                                <p className="text-[10px] text-slate-400 font-bold py-4 text-center">No upcoming holidays scheduled.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-soft">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Summary</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500 dark:text-slate-400">Total Holidays</span>
                                <span className="text-slate-900 dark:text-white font-black">{holidays.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500 dark:text-slate-400">Public Holidays</span>
                                <span className="text-slate-900 dark:text-white font-black">{holidays.filter(h => h.type === 'Public').length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-500 dark:text-slate-400">Company Events</span>
                                <span className="text-slate-900 dark:text-white font-black">{holidays.filter(h => h.type === 'Company').length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidaysScreen;
