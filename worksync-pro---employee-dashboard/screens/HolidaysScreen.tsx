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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4 md:mb-6">
                <div>
                    <h2 className="text-[14px] md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Holiday Calendar</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-[7.5px] lg:text-[11px] mt-1 lg:mt-2 uppercase tracking-tight">Personnel synchronisation archives</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Calendar View */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 rounded-md lg:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:shadow-xl lg:shadow-slate-200/5 p-2.5 lg:p-8">
                    <div className="flex justify-between items-center mb-2.5 lg:mb-10">
                        <h3 className="font-black text-[10px] lg:text-2xl text-slate-800 dark:text-white tracking-tight uppercase">
                            {currentMonth.toLocaleString('default', { month: 'long' })} <span className="text-indigo-600 underline underline-offset-8 decoration-indigo-200 dark:decoration-indigo-900">{currentMonth.getFullYear()}</span>
                        </h3>
                        <div className="flex gap-1 lg:gap-3">
                            <button
                                onClick={prevMonth}
                                className="p-1 lg:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-90"
                            >
                                <ChevronLeft className="w-2.5 h-2.5 lg:w-5 lg:h-5" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1 lg:p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-sm lg:rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-90"
                            >
                                <ChevronRight className="w-2.5 h-2.5 lg:w-5 lg:h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-3 lg:mb-6">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 md:gap-2">
                        {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8 lg:h-32"></div>
                        ))}
                        {Array.from({ length: daysInMonth(currentMonth) }, (_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const holiday = holidays.find(h => h.date.split('T')[0] === dateStr);

                            return (
                                <div key={dateStr} className={`h-8 lg:h-32 border border-slate-50 dark:border-slate-800/50 rounded-sm lg:rounded-xl p-0.5 lg:p-4 flex flex-col transition-all group lg:shadow-sm hover:border-indigo-500/50 ${holiday ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-900/30'}`}>
                                    <span className={`text-[7.5px] lg:text-sm font-black leading-none ${holiday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>{dayNum}</span>
                                    {holiday && (
                                        <div className="mt-1 lg:mt-3 bg-indigo-600 dark:bg-indigo-500 text-white text-[5px] lg:text-[10px] p-0.5 lg:p-2 rounded-sm lg:rounded-md font-black overflow-hidden lg:overflow-visible lg:whitespace-normal break-words shadow-sm lg:shadow-indigo-500/20 animate-scale-in leading-tight">
                                            {holiday.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* List View */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 dark:bg-slate-800/50 p-2.5 lg:p-8 rounded-md lg:rounded-3xl shadow-sm lg:shadow-xl lg:shadow-slate-900/10 text-white relative overflow-hidden group border border-slate-800/50">
                        <Star className="absolute -top-6 lg:-top-10 -right-6 lg:-right-10 w-12 lg:w-32 h-12 lg:h-32 opacity-10 transition-transform group-hover:rotate-12" />
                        <h3 className="text-[6.5px] lg:text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2 lg:mb-8 leading-none text-center lg:text-left underline underline-offset-8 decoration-slate-800">Upcoming Archives</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4">
                            {holidays
                                .filter(h => new Date(h.date) >= new Date())
                                .slice(0, 4)
                                .map((holiday) => (
                                    <div key={holiday.id} className="bg-white/5 backdrop-blur-xl p-1 lg:p-4 rounded-sm lg:rounded-2xl border border-white/10 flex items-center gap-2 lg:gap-5 group/item transition-all hover:bg-white/10 hover:-translate-y-1">
                                        <div className="w-6 h-6 lg:w-16 lg:h-16 bg-white/10 rounded-sm lg:rounded-xl flex flex-col items-center justify-center shrink-0 border border-white/10 transition-all group-hover/item:border-indigo-500/50 group-hover/item:scale-110">
                                            <span className="text-[6px] lg:text-[11px] font-black uppercase text-indigo-300 leading-none">{new Date(holiday.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                            <span className="text-[9px] lg:text-2xl font-black leading-none mt-0.5 lg:mt-1.5">{new Date(holiday.date).getDate()}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[7.5px] lg:text-base font-black truncate tracking-tight uppercase leading-none mb-1 lg:mb-2">{holiday.name}</p>
                                            <p className="text-[6px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] truncate mt-0.5 leading-none">{holiday.type}</p>
                                        </div>
                                    </div>
                                ))}
                            {holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                                <p className="col-span-2 lg:col-span-1 text-[8px] lg:text-xs text-slate-400 font-black py-8 lg:py-12 text-center uppercase tracking-[0.3em]">Zero Trace.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2.5 lg:p-8 rounded-md lg:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:shadow-xl lg:shadow-slate-200/5">
                        <div className="flex items-center gap-1.5 lg:gap-4 mb-2 lg:mb-8">
                            <div className="p-1 lg:p-3.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-sm lg:rounded-2xl shadow-sm lg:shadow-indigo-500/10">
                                <CalendarIcon className="w-2.5 h-2.5 lg:w-6 lg:h-6" />
                            </div>
                            <h3 className="text-[6.5px] lg:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none underline underline-offset-4 decoration-slate-100 dark:decoration-slate-800">Personnel Metrics</h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 lg:gap-6">
                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-1 bg-slate-50 dark:bg-slate-800/50 rounded-sm lg:rounded-xl border border-slate-100 dark:border-slate-800 lg:px-4 lg:py-3 text-center lg:text-left transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm">
                                <span className="text-[7.5px] lg:text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none">Total Registry</span>
                                <span className="text-[9px] lg:text-xl text-slate-900 dark:text-white font-black leading-none mt-1 lg:mt-0 tabular-nums">{holidays.length}</span>
                            </div>
                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-1 bg-slate-50 dark:bg-slate-800/50 rounded-sm lg:rounded-xl border border-slate-100 dark:border-slate-800 lg:px-4 lg:py-3 text-center lg:text-left transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm">
                                <span className="text-[7.5px] lg:text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-none">Public Events</span>
                                <span className="text-[9px] lg:text-xl text-indigo-600 dark:text-indigo-400 font-black leading-none mt-1 lg:mt-0 tabular-nums">{holidays.filter(h => h.type === 'Public').length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidaysScreen;
