
import React, { useState, useEffect } from 'react';
import { ScreenType } from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardScreen from './screens/Dashboard';
import EmployeesScreen from './screens/Employees';
import AttendanceScreen from './screens/Attendance';
import LeavesScreen from './screens/Leaves';
import ProjectsScreen from './screens/Projects';
import SalaryScreen from './screens/Salary';
import ReportsScreen from './screens/ReportsScreen';
import HolidaysScreen from './screens/Holidays';
import MeetingsScreen from './screens/Meetings';
import SettingsScreen from './screens/Settings';
import ProfileScreen from './screens/Profile';
import LoginScreen from './screens/Login';
import EmployeeOverviewScreen from './screens/EmployeeOverview';
import MobileNav from './components/MobileNav';

const AUTH_KEY = 'workstream_auth_session';

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  const [activeScreen, setActiveScreen] = useState<ScreenType>('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [screenKey, setScreenKey] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Trigger animation on screen change
  const handleNavigate = (screen: ScreenType, employeeId: string | null = null) => {
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
    setActiveScreen(screen);
    setScreenKey(prev => prev + 1);
  };

  const handleLogin = (status: boolean, remember: boolean) => {
    if (status) {
      if (remember) {
        localStorage.setItem(AUTH_KEY, 'true');
      } else {
        sessionStorage.setItem(AUTH_KEY, 'true');
      }
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Simulate session clear with a brief delay for a better UX feeling
    setTimeout(() => {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      setIsAuthenticated(false);
      setIsLoggingOut(false);
      setActiveScreen('Dashboard');
    }, 800);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated || isLoggingOut) {
    return (
      <div className={isLoggingOut ? "animate-pulse" : ""}>
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard': return <DashboardScreen onNavigate={handleNavigate} />;
      case 'Employees': return <EmployeesScreen onNavigate={handleNavigate} />;
      case 'Attendance': return <AttendanceScreen />;
      case 'Leaves': return <LeavesScreen />;
      case 'Projects': return <ProjectsScreen />;
      case 'Salary': return <SalaryScreen />;
      case 'Reports': return <ReportsScreen />;
      case 'Holidays': return <HolidaysScreen />;
      case 'Meetings': return <MeetingsScreen />;
      case 'Settings': return <SettingsScreen />;
      case 'Profile': return <ProfileScreen />;
      case 'EmployeeOverview':
        return selectedEmployeeId ? (
          <EmployeeOverviewScreen
            userId={selectedEmployeeId}
            onBack={() => handleNavigate('Employees')}
          />
        ) : <EmployeesScreen onNavigate={handleNavigate} />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-[#020617] transition-colors duration-300 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[55] animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 min-w-0 bg-slate-50/50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
        <Navbar
          title={activeScreen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-2 pb-20 md:p-4 lg:p-5 scroll-smooth custom-scrollbar">
          <div key={screenKey} className="max-w-[1600px] mx-auto animate-fade-scale">
            {renderScreen()}
          </div>
        </main>

        <MobileNav activeScreen={activeScreen} onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

export default App;
