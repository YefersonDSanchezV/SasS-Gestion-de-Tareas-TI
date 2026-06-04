import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedModule?: string; // Nombre del módulo en BD (ej: "Directorio de Usuarios")
}

export function ProtectedRoute({ children, allowedRoles, allowedModule }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin siempre tiene acceso total
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  // Validación legacy por rol estático
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validación dinámica por módulo (nuevo sistema)
  if (allowedModule && user) {
    const tieneAcceso = user.accessibleModules?.includes(allowedModule);
    if (!tieneAcceso) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
