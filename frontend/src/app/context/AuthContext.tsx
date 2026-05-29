import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi, usersApi } from '../../lib/api';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función auxiliar para mapear el ID del rol al string esperado por el frontend
const mapRole = (rol_id: number): UserRole => {
  if (rol_id === 1) return 'admin';
  if (rol_id === 2) return 'coordinator';
  return 'technician';
};

// Función auxiliar para mapear el usuario del backend al del frontend
const mapBackendUserToFrontend = (backendUser: any): User => {
  return {
    id: backendUser.id,
    identificationType: backendUser.tipo_identificacion || 'CC',
    identificationNumber: backendUser.numero_identificacion || '',
    firstName: backendUser.primer_nombre,
    lastName: backendUser.primer_apellido,
    phone: backendUser.celular || '',
    personalEmail: backendUser.correo_personal || '',
    institutionalEmail: backendUser.correo_institucional,
    username: backendUser.username,
    role: mapRole(backendUser.rol_id),
    rolNombre: backendUser.rol_nombre || 'Sin Rol',
    status: backendUser.estado.toLowerCase() as any,
    createdAt: backendUser.created_at,
  };
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Al cargar la app, revisar si hay un token válido y cargar el usuario
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const backendUser = await usersApi.getMe();
          if (backendUser.estado === 'INACTIVO') {
            toast.error('Tu cuenta está inactiva o pendiente de aprobación.');
            authApi.logout();
            setUser(null);
          } else {
            setUser(mapBackendUserToFrontend(backendUser));
          }
        } catch (error) {
          console.error("Error validando token", error);
          authApi.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // 1. Obtener Token
      await authApi.login(username, password);
      
      // 2. Obtener datos del usuario
      const backendUser = await usersApi.getMe();
      
      // 3. Validar si está activo
      if (backendUser.estado === 'INACTIVO') {
        toast.error('Tu cuenta aún no ha sido aprobada por un administrador.');
        authApi.logout();
        return false;
      }
      
      setUser(mapBackendUserToFrontend(backendUser));
      return true;
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        toast.error('Credenciales inválidas');
      } else {
        toast.error('Error al intentar iniciar sesión');
      }
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
