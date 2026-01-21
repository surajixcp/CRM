import React, { useEffect, useState } from 'react';
import { ScreenType } from '../types';
import { Icons } from '../constants';
import { settingService } from '../src/api/settingService';

interface SidebarProps {
  activeScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, isOpen, onToggle, onLogout }) => {
  const [companySettings, setCompanySettings] = useState({
    name: 'WorkStream',
    logo: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingService.getSettings();
        setCompanySettings({
          name: data.companyName || 'WorkStream',
          logo: data.companyLogo || ''
        });
      } catch (err) {
        console.error('Failed to fetch sidebar settings', err);
      }
    };
    fetchSettings();
  }, []);

  const menuItems: { id: ScreenType; label: string; icon: React.FC }[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'Employees', label: 'Employees', icon: Icons.Employees },
    { id: 'Attendance', label: 'Attendance', icon: Icons.Attendance },
    { id: 'Leaves', label: 'Leaves', icon: Icons.Leaves },
    { id: 'Projects', label: 'Projects', icon: Icons.Projects },
    { id: 'Salary', label: 'Salary', icon: Icons.Salary },
    { id: 'Holidays', label: 'Holidays', icon: Icons.Holidays },
    { id: 'Meetings', label: 'Meetings', icon: Icons.Meetings },
    { id: 'Settings', label: 'Settings', icon: Icons.Settings }
  ];

  return (
    <aside
      className={`bg-white dark:bg-slate-900 shadow-xl dark:shadow-none border-r border-slate-200 dark:border-slate-800/50 transition-all duration-300 ease-in-out flex flex-col z-50
        ${isOpen ? 'w-56' : 'w-16'} fixed inset-y-0 left-0 lg:static transition-colors`}
    >
      <div className="flex items-center justify-between h-12 px-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className={`flex items-center space-x-2 overflow-hidden transition-all duration-300 ${!isOpen && 'lg:scale-0 lg:hidden'}`}>
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-900/10 overflow-hidden shrink-0">
            {companySettings.logo ? (
              <img src={companySettings.logo} alt="L" className="w-full h-full object-cover" />
            ) : companySettings.name[0]}
          </div>
          {isOpen && <span className="text-sm font-black tracking-tight text-slate-800 dark:text-white truncate uppercase">{companySettings.name}</span>}
        </div>
        {!isOpen && (
          <div className="w-full flex justify-center lg:hidden">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-md overflow-hidden">
              {companySettings.logo ? (
                <img src={companySettings.logo} alt="L" className="w-full h-full object-cover" />
              ) : companySettings.name[0]}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'} transition-colors`}>
                <Icon />
              </div>
              {isOpen && (
                <span className={`ml-3 text-[11px] font-bold tracking-tight transition-all ${isActive ? 'translate-x-0' : 'translate-x-0'}`}>
                  {item.label}
                </span>
              )}
              {!isOpen && (
                <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-2 z-50 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2 text-rose-500 dark:text-rose-400 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-lg transition-all group relative"
        >
          <Icons.Logout />
          {isOpen && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;