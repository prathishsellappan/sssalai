import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { StudentLayout } from '@/components/layout/StudentLayout';
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Public & Error Pages
import { LandingPage } from '@/pages/LandingPage';
import { StudentLogin } from '@/pages/student/StudentLogin';
import { TeacherLogin } from '@/pages/teacher/TeacherLogin';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { StudentMaterialsPage } from '@/pages/student/StudentMaterialsPage';
import { StudentFormsPage } from '@/pages/student/StudentFormsPage';

// Teacher Pages
import { TeacherDashboard } from '@/pages/teacher/TeacherDashboard';
import { TeacherMaterialsPage } from '@/pages/teacher/TeacherMaterialsPage';
import { TeacherUploadPage } from '@/pages/teacher/TeacherUploadPage';
import { TeacherFormsPage } from '@/pages/teacher/TeacherFormsPage';
import { TeacherSettingsPage } from '@/pages/teacher/TeacherSettingsPage';
import { TeacherChangePasswordPage } from '@/pages/teacher/TeacherChangePasswordPage';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminTeachersPage } from '@/pages/admin/AdminTeachersPage';
import { AdminAcademicPage } from '@/pages/admin/AdminAcademicPage';
import { AdminMaterialsPage } from '@/pages/admin/AdminMaterialsPage';
import { AdminFormsPage } from '@/pages/admin/AdminFormsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';

export const router = createBrowserRouter([
  // Public Paths
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/student/login',
    element: <StudentLogin />,
  },
  {
    path: '/teacher/login',
    element: <TeacherLogin />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Teacher Force Password Change Page
  {
    path: '/teacher/change-password',
    element: (
      <ProtectedRoute allowedRoles={['teacher']} requirePasswordChanged={false}>
        <TeacherChangePasswordPage />
      </ProtectedRoute>
    ),
  },

  // Student Protected Portal
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/student/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'materials',
        element: <StudentMaterialsPage />,
      },
      {
        path: 'forms',
        element: <StudentFormsPage />,
      },
    ],
  },

  // Teacher Protected Portal
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <TeacherLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/teacher/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <TeacherDashboard />,
      },
      {
        path: 'materials',
        element: <TeacherMaterialsPage />,
      },
      {
        path: 'materials/upload',
        element: <TeacherUploadPage />,
      },
      {
        path: 'forms',
        element: <TeacherFormsPage />,
      },
      {
        path: 'forms/create',
        element: <TeacherFormsPage />,
      },
      {
        path: 'settings',
        element: <TeacherSettingsPage />,
      },
    ],
  },

  // Admin Protected Portal
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'teachers',
        element: <AdminTeachersPage />,
      },
      {
        path: 'teachers/create',
        element: <AdminTeachersPage />,
      },
      {
        path: 'classes',
        element: <AdminAcademicPage />,
      },
      {
        path: 'subjects',
        element: <AdminAcademicPage />,
      },
      {
        path: 'materials',
        element: <AdminMaterialsPage />,
      },
      {
        path: 'forms',
        element: <AdminFormsPage />,
      },
      {
        path: 'settings',
        element: <AdminSettingsPage />,
      },
      {
        path: 'audit-logs',
        element: <AdminAuditLogsPage />,
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
