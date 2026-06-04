import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Ticket,
  ScrollText,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus,
  UserX,
  User as UserIcon,
  IdCard,
  Briefcase,
  Mail,
  Settings,
  Shield,
  ListTodo,
  Key,
  Palette,
  BarChart3,
  FileText,
  Database,
} from 'lucide-react';

import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(true);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['admin', 'coordinator', 'technician'],
    },
    {
      icon: Ticket,
      label: 'Casos',
      path: '/cases',
      roles: ['admin', 'coordinator', 'technician'],
    },
    {
      icon: Users,
      label: 'Usuarios',
      path: '/users',
      roles: ['admin', 'coordinator'],
      subItems: [
        { label: 'Directorio', path: '/users', icon: Users },
        { label: 'Solicitudes', path: '/users/requests', icon: UserPlus },
        { label: 'Acceso Denegado', path: '/users/blocked', icon: UserX },
      ]
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      path: '/reports',
      roles: ['admin', 'coordinator'],
      subItems: [
        { label: 'Reportes de Casos', path: '/reports/cases', icon: FileText },
        { label: 'Reportes de Usuarios', path: '/reports/users', icon: Users },
        { label: 'Consultas PostgreSQL', path: '/reports/sql', icon: Database },
      ]
    },
    {
      icon: ScrollText,
      label: 'Logs',
      path: '/logs',
      roles: ['admin', 'coordinator'],
    },
    {
      icon: Settings,
      label: 'Configuraciones',
      path: '/settings',
      roles: ['admin', 'coordinator'],
      subItems: [
        { label: 'Roles', path: '/settings/roles', icon: Shield },
        { label: 'Permisos', path: '/settings/permissions', icon: Key },
        { label: 'Tema', path: '/settings/theme', icon: Palette },
      ]
    },
  ];



  const filteredMenuItems = menuItems.filter(item => {
    // Si el usuario es admin, por ahora le damos acceso a todo (o usar su lista si la tiene completa)
    if (user?.role === 'admin') return true;
    
    // Si no es admin, filtramos basado en la lista dinámica de módulos accesibles
    if (user?.accessibleModules) {
      // El dashboard lo dejamos abierto a todos por defecto
      if (item.label === 'Dashboard') return true;
      
      return user.accessibleModules.includes(item.label);
    }
    
    return false;
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative z-50 bg-sidebar text-white h-full transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-accent">
          {(sidebarOpen || isMobileMenuOpen) && (
            <h1 className="font-semibold text-lg">Sistema Casos</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isUsers = item.label === 'Usuarios';
            const isConfig = item.label === 'Configuraciones';
            const isReports = item.label === 'Reportes';
            
            const isSubMenuOpen = isUsers ? isUsersMenuOpen : isConfig ? isConfigMenuOpen : isReports ? isReportsMenuOpen : false;
            const setIsSubMenuOpen = isUsers ? setIsUsersMenuOpen : isConfig ? setIsConfigMenuOpen : isReports ? setIsReportsMenuOpen : () => {};

            const isActive = hasSubItems 
              ? location.pathname.startsWith(item.path) 
              : location.pathname.startsWith(item.path);

            if (hasSubItems && (sidebarOpen || isMobileMenuOpen)) {
              return (
                <div key={`${item.label}-menu-group`} className="space-y-1">
                  <button
                    onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-primary/20 text-white' : 'text-white/80 hover:bg-sidebar-accent hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    {isSubMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  {isSubMenuOpen && (
                    <div className="ml-4 space-y-1 border-l border-white/10 pl-2 animate-in slide-in-from-top-1 duration-200">
                      {item.subItems?.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? 'bg-primary text-white shadow-md'
                                : 'text-white/60 hover:bg-sidebar-accent hover:text-white'
                            }`}
                          >
                            <SubIcon size={16} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }


            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/80 hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <Icon size={20} />
                {(sidebarOpen || isMobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>


        {/* User Profile Section with Dropdown */}
        <div className="mt-auto border-t border-sidebar-accent relative">
          {(sidebarOpen || isMobileMenuOpen) ? (
            <div className="p-4">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all duration-200 border-2 ${
                  isUserDropdownOpen ? 'bg-white/10 border-white/20' : 'hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 min-w-[40px] rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className="font-semibold text-sm truncate">{user?.firstName}</div>
                    <div className="text-xs text-blue-200 capitalize truncate">{user?.role}</div>
                  </div>
                </div>
                <ChevronDown size={16} className={`text-blue-200 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white rounded-2xl shadow-2xl p-5 text-slate-800 z-[60] border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100 bg-sidebar/5 -mx-5 -mt-5 p-5 rounded-t-2xl">
                    <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-lg leading-tight truncate text-primary">{user?.firstName} {user?.lastName}</div>
                      <div className="text-primary font-semibold text-sm">{user?.rolNombre}</div>
                    </div>
                  </div>


                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sidebar/10 rounded-lg text-sidebar">
                        <IdCard size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identificación</div>
                        <div className="text-sm font-semibold text-slate-700">{user?.identificationNumber || 'No registrada'}</div>
                      </div>
                    </div>


                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sidebar/10 rounded-lg text-sidebar">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargo</div>
                        <div className="text-sm font-semibold text-slate-700">{user?.rolNombre}</div>
                      </div>
                    </div>


                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sidebar/10 rounded-lg text-sidebar">
                        <Mail size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Correo</div>
                        <div className="text-sm font-semibold text-slate-700 truncate">{user?.institutionalEmail}</div>
                      </div>
                    </div>

                  </div>

                  <Button 
                    variant="destructive" 
                    className="w-full bg-[#D12D2D] hover:bg-[#B92626] text-white py-6 rounded-xl font-bold gap-3 shadow-lg shadow-red-100 transition-all"
                    onClick={handleLogout}
                  >
                    <LogOut size={20} />
                    CERRAR SESIÓN
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 flex justify-center">
               <button 
                onClick={() => setSidebarOpen(true)}
                className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg"
              >
                {user?.firstName?.[0]}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-border px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg lg:text-xl font-bold text-primary truncate">
                <span className="hidden sm:inline">Sistema de Gestión de Casos - Soporte Sistemas</span>
                <span className="sm:hidden">Soporte ICVC</span>
              </h2>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">
                Bienvenid@ <span className="text-secondary font-bold">{user?.firstName} {user?.lastName}</span>, a su plataforma de Gestión de Casos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <footer className="bg-white border-t border-border px-6 py-3 text-sm text-muted-foreground hidden sm:block">
          Versión 1.0.0 | © 2026 Sistema de Gestión de Casos
        </footer>
      </div>
    </div>
  );
}

