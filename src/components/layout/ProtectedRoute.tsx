import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requirePasswordChanged?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requirePasswordChanged = true,
}) => {
  const { user, profile, loading, mustChangePassword, studentAccessBlocked } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to appropriate login based on requested path
  if (!user || !profile) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/teacher')) {
      return <Navigate to="/teacher/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  // Account deactivated check
  if (!profile.is_active) {
    return <Navigate to="/unauthorized" state={{ reason: 'Account deactivated' }} replace />;
  }

  // Student access blocked check
  if (profile.role === 'student' && studentAccessBlocked) {
    return <Navigate to="/unauthorized" state={{ reason: 'Student portal access disabled by administrator' }} replace />;
  }

  // Enforce teacher password change on first login
  if (profile.role === 'teacher' && mustChangePassword && requirePasswordChanged && location.pathname !== '/teacher/change-password') {
    return <Navigate to="/teacher/change-password" replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
