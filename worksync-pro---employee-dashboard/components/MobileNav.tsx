import React from 'react';
import {
    LayoutDashboard,
    CalendarCheck,
    FileText,
    MoreHorizontal,
    Briefcase,
    Users,
    Star,
    User,
    X
} from 'lucide-react';
import { Screen } from '../types';

interface MobileNavProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentScreen, onNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const mainItems = [
        { id: 'Dashboard', label: 'Dash', icon: LayoutDashboard },
        { id: 'Attendance', label: 'Logs', icon: CalendarCheck },
        { id: 'Leaves', label: 'Leaves', icon: FileText },
    ];

    const allPages = [
        { id: 'Dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'Attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'Leaves', label: 'Leaves', icon: FileText },
        { id: 'Projects', label: 'Projects', icon: Briefcase },
        { id: 'Meetings', label: 'Meetings', icon: Users },
        { id: 'Holidays', label: 'Holidays', icon: Star },
        { id: 'Profile', label: 'Profile', icon: User },
    ];

    const handleNavigate = (id: Screen) => {
        onNavigate(id);
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* All Pages Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-xl border-t border-slate-200 dark:border-slate-800 p-3 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Employee Portal</h3>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {allPages.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentScreen === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigate(item.id as Screen)}
                                        className="flex flex-col items-center gap-1 group transition-all"
                                    >
                                        <div className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${isActive
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:text-indigo-500 transition-all'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-tight text-center truncate w-full ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                            <div className="w-10 h-0.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/50 z-[101] px-2 py-1 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as Screen)}
                            className={`flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 ${isActive
                                ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                                : 'text-slate-400 dark:text-slate-500'
                                }`}
                        >
                            <div className={`p-0.5 rounded-md transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                                }`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[6.5px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* More Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-300 flex-1 ${isMenuOpen
                        ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                        : 'text-slate-400 dark:text-slate-500'
                        }`}
                >
                    <div className={`p-0.5 rounded-md transition-all ${isMenuOpen ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                        }`}>
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[6.5px] font-black uppercase tracking-widest ${isMenuOpen ? 'opacity-100' : 'opacity-60'
                        }`}>
                        More
                    </span>
                </button>
            </div>
        </>
    );
};

export default MobileNav;
