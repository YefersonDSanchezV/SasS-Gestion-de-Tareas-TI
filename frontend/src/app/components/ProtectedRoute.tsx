import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';
import { ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  allowedModule?: string;
}

function NoAccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-in fade-in duration-500">
      <div className="p-5 bg-red-50 rounded-full mb-6 ring-8 ring-red-100">
        <ShieldX className="w-16 h-16 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Acceso Restringido
      </h1>
      <p className="text-slate-500 text-base max-w-md leading-relaxed">
        No tiene acceso a este módulo. Si lo necesita, comuníquese con el
        administrador del sistema.
      </p>
      <div className="mt-8 px-6 py-3 bg-slate-100 rounded-xl text-slate-600 text-sm font-medium border border-slate-200">
        🔒 Módulo sin permiso asignado a su rol
      </div>
    </div>
  );
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
    return <NoAccessPage />;
  }

  // Validación dinámica por módulo (sistema de permisos por roles)
  if (allowedModule && user) {
    const tieneAcceso = user.accessibleModules?.includes(allowedModule);
    if (!tieneAcceso) {
      return <NoAccessPage />;
    }
  }

  return <>{children}</>;
}
