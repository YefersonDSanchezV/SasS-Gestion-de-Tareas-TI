import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { RequestAccess } from './pages/RequestAccess';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';
import { UserForm } from './pages/UserForm';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { Logs } from './pages/Logs';
import Roles from './pages/Settings/Roles';
import Themes from './pages/Settings/Themes';
import CaseReports from './pages/Reports/CaseReports';
import UserReports from './pages/Reports/UserReports';
import SqlConsole from './pages/Reports/SqlConsole';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/request-access',
    element: <RequestAccess />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <Navigate to="/dashboard" replace />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/cases',
    element: (
      <ProtectedRoute>
        <Layout>
          <Cases />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/cases/:id',
    element: (
      <ProtectedRoute>
        <Layout>
          <CaseDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Users mode="list" />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/requests',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Users mode="requests" />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/blocked',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Users mode="blocked" />
        </Layout>
      </ProtectedRoute>
    ),
  },

  {
    path: '/users/new',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <UserForm />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <UserDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <UserForm />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/logs',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Logs />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/roles',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Roles />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/theme',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <Themes />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/cases',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <CaseReports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/users',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
        <Layout>
          <UserReports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/sql',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <SqlConsole />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
