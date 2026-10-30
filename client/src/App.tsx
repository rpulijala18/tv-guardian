import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { ScreenTime } from './pages/ScreenTime';
import { Schedules } from './pages/Schedules';
import { Analytics } from './pages/Analytics';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

// Protected layout wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Authenticating Guardian Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get current page title
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Parental Overview', subtitle: 'Real-time television status, daily limits & quick controls' };
      case '/devices':
        return { title: 'My Television', subtitle: 'Sony Bravia Smart TV management & LAN discovery' };
      case '/screen-time':
        return { title: 'Screen Time Limits', subtitle: 'Configure permitted daily hours & bedtime locks' };
      case '/schedules':
        return { title: 'Automated Schedules', subtitle: 'Weekly timetable for morning, evening & bedtime restriction' };
      case '/analytics':
        return { title: 'Usage Analytics & Audits', subtitle: 'Viewing trends, limit violations & hardware logs' };
      case '/notifications':
        return { title: 'Security Alerts', subtitle: 'Hardware restriction events & network controller telemetry' };
      case '/settings':
        return { title: 'System Settings', subtitle: 'Router hardware adapters, timezone & security tokens' };
      default:
        return { title: 'TV Guardian', subtitle: 'Smart Screen Time. Safer Childhood.' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-[#070a13] flex text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar agentOnline={true} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          unreadNotifications={2}
        />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/devices" element={<AppLayout><Devices /></AppLayout>} />
          <Route path="/screen-time" element={<AppLayout><ScreenTime /></AppLayout>} />
          <Route path="/schedules" element={<AppLayout><Schedules /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

