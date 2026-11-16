import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Layers, 
  Settings, 
  ShieldAlert, 
  FileText, 
  LogOut, 
  Shield 
} from 'lucide-react';
import { Button } from '@/components/common/Button';

export const AdminLayout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/teachers', label: 'Teachers', icon: Users },
    { to: '/admin/classes', label: 'Classes & Subjects', icon: Layers },
    { to: '/admin/materials', label: 'All Materials', icon: BookOpen },
    { to: '/admin/forms', label: 'All Forms', icon: FileText },
    { to: '/admin/settings', label: 'Portal Settings', icon: Settings },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-bold text-white block leading-tight">School Administration</span>
              <span className="text-xs text-emerald-400 font-medium">Administrator: {profile?.display_name || 'Admin'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="text-white border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-1 text-slate-400" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sub-navigation bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
