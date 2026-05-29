import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { usersApi } from '../../lib/api';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [userData, rolesData] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }).then(res => res.json()),
          usersApi.getRoles()
        ]);
        setUser(userData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Error cargando detalle:", error);
        toast.error("Error al cargar información del usuario");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#1E3A8A]" /></div>;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/users')}><ArrowLeft size={16} className="mr-2" />Volver</Button>
        <Card><CardContent className="p-6 text-center">Usuario no encontrado</CardContent></Card>
      </div>
    );
  }

  const getRoleName = (rolId: number | null) => {
    const role = roles.find(r => r.id === rolId);
    return role ? role.nombre : 'Sin Rol';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/users')} className="bg-white border-[#e2e8f0] text-foreground hover:bg-slate-50 w-fit">
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {user.primer_nombre} {user.primer_apellido}
            </h1>
            <p className="text-base text-slate-500 font-medium">Información del usuario</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate(`/users/${id}/edit`)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 shadow-sm rounded-md transition-all w-fit"
        >
          <Edit size={16} className="mr-2" />
          Editar
        </Button>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Información Personal */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-[#1e293b]">Información Personal</CardTitle>
            <CardDescription>Datos personales del usuario</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Tipo de Identificación</p>
                <p className="font-bold text-[#1e293b]">{user.tipo_identificacion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Número de Identificación</p>
                <p className="font-bold text-[#1e293b]">{user.numero_identificacion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Nombres</p>
                <p className="font-bold text-[#1e293b]">{user.primer_nombre} {user.segundo_nombre || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Apellidos</p>
                <p className="font-bold text-[#1e293b]">{user.primer_apellido} {user.segundo_apellido || ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Teléfono</p>
                <p className="font-bold text-[#1e293b]">{user.celular || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Información de Cuenta */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-[#1e293b]">Información de Cuenta</CardTitle>
            <CardDescription>Datos de acceso y permisos</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Correo Personal</p>
                <p className="font-bold text-[#1e293b]">{user.correo_personal || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Correo Institucional</p>
                <p className="font-bold text-[#1e293b]">{user.correo_institucional}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Usuario</p>
                <p className="font-bold text-[#1e293b]">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Rol</p>
                <Badge className="bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]">
                  {getRoleName(user.rol_id)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Estado</p>
                <Badge className={user.estado === 'ACTIVO' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'}>
                  {user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Fecha de Creación</p>
                <p className="font-bold text-[#1e293b]">
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

