import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FolderGit2, 
  FileText, 
  Settings, 
  LogOut, 
  GraduationCap 
} from 'lucide-react';
import { Button } from '@/components/common/Button';

export const TeacherLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/teacher/login');
  };

  const navItems = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/materials', label: 'My Materials', icon: FolderGit2 },
    { to: '/teacher/materials/upload', label: 'Upload Material', icon: UploadCloud },
    { to: '/teacher/forms', label: 'Google Forms', icon: FileText },
    { to: '/teacher/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-900 text-xs px-4 py-1.5 font-semibold text-center tracking-wide">
          ⚠️ OFFLINE DEMO MODE (Local Storage Only): Changes are saved only on this device. Connect Supabase in Vercel to sync across all devices.
        </div>
      )}
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">Faculty Portal</span>
              <span className="text-xs text-indigo-700 font-medium">Logged in as {profile?.display_name || 'Teacher'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-1 border-slate-300">
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/teacher/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
