import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Briefcase,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Clock,
  Briefcase as ProjectIcon,
  Calendar,
  Settings,
  HelpCircle,
  Star
} from 'lucide-react';
import { Screen, UserProfile, AppNotification } from './types';
import { authService } from './services/authService';
import { settingService } from './services/settingService';
import { ThemeToggle } from './components/ThemeToggle';

// Screen Components
import DashboardScreen from './screens/DashboardScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import LeavesScreen from './screens/LeavesScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import MeetingsScreen from './screens/MeetingsScreen';
import HolidaysScreen from './screens/HolidaysScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import MobileNav from './components/MobileNav';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    name: 'WorkSync',
    logo: ''
  });

  // Derived state for unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Check auth on mount
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      // Optionally fetch fresh profile
      authService.getProfile().then(u => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      }).catch(() => {
        // Token might be invalid
        // setIsAuthenticated(false);
      });
    }

    // Fetch Global Settings if token exists
    if (token) {
      settingService.getSettings().then(data => {
        setCompanySettings({
          name: data.companyName || 'WorkSync',
          logo: data.companyLogo || ''
        });
      }).catch(err => console.error("Setting fetch error", err));
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentScreen('Dashboard');
    setUser(null);
  };

  const handleScreenChange = (screen: Screen) => {
    if (screen === currentScreen) return;
    setIsTransitioning(true);
    // Scroll to top on screen change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    }, 200);
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Attendance', icon: CalendarCheck, label: 'Attendance' },
    { id: 'Leaves', icon: FileText, label: 'Leaves' },
    { id: 'Projects', icon: Briefcase, label: 'Projects' },
    { id: 'Meetings', icon: Users, label: 'Meetings' },
    { id: 'Holidays', icon: Star, label: 'Holidays' },
    { id: 'Profile', icon: User, label: 'Profile' },
  ];

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Dashboard': return <DashboardScreen onNavigate={handleScreenChange} />;
      case 'Attendance': return <AttendanceScreen />;
      case 'Leaves': return <LeavesScreen />;
      case 'Projects': return <ProjectsScreen />;
      case 'Meetings': return <MeetingsScreen />;
      case 'Holidays': return <HolidaysScreen />;
      case 'Profile': return user ? <ProfileScreen user={user} /> : null;
      default: return <DashboardScreen onNavigate={handleScreenChange} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] flex text-slate-900 dark:text-slate-100 transition-colors duration-300 font-inter overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/40 z-[60] backdrop-blur-[2px] animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-52 lg:w-64 bg-white dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/50 transform transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 h-11 lg:h-16 flex items-center gap-2 shrink-0 border-b border-slate-100 dark:border-slate-800/50">
            <div className="w-5 h-5 lg:w-8 lg:h-8 bg-indigo-600 rounded-md lg:rounded-xl flex items-center justify-center text-white font-black text-[10px] lg:text-base shadow-lg shadow-indigo-500/20 group cursor-pointer active:scale-95 transition-all overflow-hidden shrink-0">
              {companySettings.logo ? (
                <img src={companySettings.logo} alt="L" className="w-full h-full object-cover" />
              ) : (
                <span className="group-hover:rotate-12 transition-transform">{companySettings.name[0]}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] lg:text-sm font-black tracking-tight text-slate-800 dark:text-white leading-none truncate">{companySettings.name}</span>
              <span className="text-[6px] lg:text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Enterprise</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 px-2 lg:px-4 space-y-0.5 lg:space-y-1 overflow-y-auto mt-3 lg:mt-6 scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScreenChange(item.id as Screen)}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-1 lg:py-2.5 rounded-md lg:rounded-xl text-[9px] lg:text-sm font-bold transition-all relative active:scale-[0.98] group ${currentScreen === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-white'
                  }`}
              >
                <item.icon className={`w-3 h-3 lg:w-5 lg:h-5 transition-transform ${currentScreen === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-2 lg:p-4 mt-auto space-y-1 shrink-0 border-t border-slate-100 dark:border-slate-800/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-1.5 lg:gap-3 px-2 lg:px-4 py-1 lg:py-3 rounded-md lg:rounded-xl text-[9px] lg:text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95 group"
            >
              <LogOut className="w-3 h-3 lg:w-5 lg:h-5 transition-transform group-hover:-translate-x-1" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="h-8.5 lg:h-16 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/50 sticky top-0 z-50 px-2 lg:px-6 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors active:scale-95"
            >
              {isSidebarOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
            </button>
            <div className="flex flex-col">
              <h1 className="text-[11px] lg:text-xl font-black text-slate-800 dark:text-white tracking-tight transition-all truncate max-w-[90px] md:max-w-none leading-none">
                {currentScreen}
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[6px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{companySettings.name}</span>
                <span className="hidden md:inline w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="hidden md:inline text-[6px] lg:text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">v2.4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden sm:flex items-center relative group">
              <Search className="w-2.5 h-2.5 absolute left-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-7 pr-3 py-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-[9px] font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 w-32 md:w-48 transition-all outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>

            <ThemeToggle />

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileMenuOpen(false);
                }}
                className={`p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-all active:scale-95 ${isNotificationsOpen ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : ''}`}
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-1 h-1 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 sm:w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[90] animate-scale-in">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[11px] tracking-tight">Activity Center</h3>
                        <p className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Updates & Tasks</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg active:scale-95 transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3 border-b border-slate-100 dark:border-slate-800 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${n.type === 'meeting' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              n.type === 'leave' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              }`}>
                              {n.type === 'meeting' ? <Clock className="w-3.5 h-3.5" /> :
                                n.type === 'leave' ? <Calendar className="w-3.5 h-3.5" /> :
                                  <ProjectIcon className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                <h4 className={`text-[11px] font-bold truncate tracking-tight ${!n.read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</h4>
                                <span className="text-[8px] font-bold text-slate-400 whitespace-nowrap ml-2 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{n.time}</span>
                              </div>
                              <p className={`text-[10px] leading-normal font-medium ${!n.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>{n.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 flex flex-col items-center justify-center text-center px-8">
                          <Bell className="w-6 h-6 text-slate-200 dark:text-slate-800 mb-2" />
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className={`flex items-center gap-2 p-1 rounded-xl md:pl-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent active:scale-95 ${isProfileMenuOpen ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl' : ''}`}
              >
                <div className="text-right hidden md:block">
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-none">{user?.name || 'User'}</p>
                  <p className="text-[8px] font-bold text-indigo-500 mt-1 uppercase tracking-widest leading-none">{user?.department || 'Employee'}</p>
                </div>
                <div className="relative">
                  <img
                    src={user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.name || 'User')}
                    alt="Profile"
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full" />
                </div>
                <ChevronDown className={`hidden md:block w-3 h-3 text-slate-400 transition-transform duration-500 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[80]" onClick={() => setIsProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-[90] animate-scale-in">
                    <button className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold group">
                      <Settings className="w-3 h-3 text-slate-400 group-hover:rotate-45 transition-transform" />
                      Settings
                    </button>
                    <button className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold group">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      Support
                    </button>
                    <hr className="my-1 border-slate-100 dark:border-slate-800 mx-1.5" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-black transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header >

        {/* Dynamic Content */}
        < main className={`flex-1 p-3 md:p-5 pb-24 lg:pb-5 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
          <div className="max-w-[1600px] mx-auto">
            {renderScreen()}
          </div>
        </main >

        <MobileNav currentScreen={currentScreen} onNavigate={handleScreenChange} />
      </div >
    </div >
  );
};

export default App;
