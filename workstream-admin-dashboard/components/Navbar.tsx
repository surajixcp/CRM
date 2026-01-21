
import React, { useState } from 'react';
import { Icons } from '../constants';
import { ScreenType } from '../types';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  title: string;
  onToggleSidebar: () => void;
  onNavigate: (screen: ScreenType) => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar, onNavigate }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 lg:px-5 shrink-0 z-40 transition-all duration-300">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 mr-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h1 className="text-sm font-black text-slate-800 dark:text-white hidden sm:block tracking-tight uppercase">{title}</h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
            <Icons.Search />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-40 lg:w-56 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-[11px] font-bold rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-8 py-1.5 text-slate-700 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <ThemeToggle />

        <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors">
          <Icons.Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <img
              src="https://picsum.photos/seed/admin/100/100"
              alt="Admin"
              className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700"
            />
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">Admin User</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Super Admin</p>
            </div>
            <svg className={`w-3 h-3 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-fade-scale origin-top-right overflow-hidden">
              <button
                onClick={() => { onNavigate('Profile'); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Your Profile
              </button>
              <button
                onClick={() => { onNavigate('Settings'); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Account Settings
              </button>
              <hr className="my-1 border-slate-100 dark:border-slate-800" />
              <button className="w-full text-left px-4 py-2 text-[11px] font-black text-rose-500 hover:bg-rose-500/10 transition-colors uppercase tracking-widest">Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
