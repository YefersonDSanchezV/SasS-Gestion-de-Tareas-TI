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
import Permissions from './pages/Permissions';
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
  // ── CASOS ─────────────────────────────────────────────────────────────────
  {
    path: '/cases',
    element: (
      <ProtectedRoute allowedModule="Gestión de Casos">
        <Layout>
          <Cases />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/cases/:id',
    element: (
      <ProtectedRoute allowedModule="Gestión de Casos">
        <Layout>
          <CaseDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  // ── USUARIOS ──────────────────────────────────────────────────────────────
  {
    path: '/users',
    element: (
      <ProtectedRoute allowedModule="Directorio de Usuarios">
        <Layout>
          <Users mode="list" />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/requests',
    element: (
      <ProtectedRoute allowedModule="Solicitudes de Acceso">
        <Layout>
          <Users mode="requests" />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/blocked',
    element: (
      <ProtectedRoute allowedModule="Acceso Denegado">
        <Layout>
          <Users mode="blocked" />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/new',
    element: (
      <ProtectedRoute allowedModule="Directorio de Usuarios">
        <Layout>
          <UserForm />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id',
    element: (
      <ProtectedRoute allowedModule="Directorio de Usuarios">
        <Layout>
          <UserDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users/:id/edit',
    element: (
      <ProtectedRoute allowedModule="Directorio de Usuarios">
        <Layout>
          <UserForm />
        </Layout>
      </ProtectedRoute>
    ),
  },
  // ── LOGS ──────────────────────────────────────────────────────────────────
  {
    path: '/logs',
    element: (
      <ProtectedRoute allowedModule="Logs del Sistema">
        <Layout>
          <Logs />
        </Layout>
      </ProtectedRoute>
    ),
  },
  // ── CONFIGURACIONES ───────────────────────────────────────────────────────
  {
    path: '/settings/roles',
    element: (
      <ProtectedRoute allowedModule="Gestión de Roles">
        <Layout>
          <Roles />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/permissions',
    element: (
      <ProtectedRoute allowedModule="Gestión de Permisos">
        <Layout>
          <Permissions />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/theme',
    element: (
      // Tema disponible para todos por defecto
      <ProtectedRoute>
        <Layout>
          <Themes />
        </Layout>
      </ProtectedRoute>
    ),
  },
  // ── REPORTES ──────────────────────────────────────────────────────────────
  {
    path: '/reports/cases',
    element: (
      <ProtectedRoute allowedModule="Reportes de Casos">
        <Layout>
          <CaseReports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/users',
    element: (
      <ProtectedRoute allowedModule="Reportes de Usuarios">
        <Layout>
          <UserReports />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/sql',
    element: (
      <ProtectedRoute allowedModule="Consultas SQL">
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
