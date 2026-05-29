import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { authApi, usersApi } from '../../lib/api';
import { Eye, Search, Plus, RefreshCw, UserCheck, UserX, ShieldAlert, History, Loader2, Users as UsersIcon, Mail, IdCard } from 'lucide-react';



import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';


interface UsersProps {
  mode?: 'list' | 'requests' | 'blocked';
}

export function Users({ mode = 'list' }: UsersProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData, requestsData, blockedData] = await Promise.all([
        usersApi.getAll(),
        usersApi.getRoles(),
        authApi.getRequests(),
        authApi.getBlocked()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setBlocked(Array.isArray(blockedData) ? blockedData : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("No se pudieron cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: string, type: 'deny' | 'unblock' } | null>(null);

  const handleDeny = async (id: string) => {
    setPendingAction({ id, type: 'deny' });
    setIsConfirmOpen(true);
  };

  const handleUnblock = async (id: string) => {
    setPendingAction({ id, type: 'unblock' });
    setIsConfirmOpen(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    
    try {
      if (pendingAction.type === 'deny') {
        await authApi.denyRequest(pendingAction.id);
        toast.success("Solicitud denegada y usuario bloqueado");
      } else {
        await authApi.unblock(pendingAction.id);
        toast.success("Usuario desbloqueado");
      }
      fetchData();
    } catch (error) {
      toast.error("Error al procesar la acción");
    } finally {
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };


  const handleGrant = (request: any) => {
    // Redirigir al formulario de nuevo usuario con los datos pre-cargados
    navigate('/users/new', { state: { prefilled: request } });
  };


  const getRoleName = (rolId: number | null) => {
    const role = roles.find(r => r.id === rolId);
    return role ? role.nombre : 'Sin Rol';
  };

  const getRoleColor = (rolId: number | null) => {
    switch (rolId) {
      case 1: return 'bg-[#1E3A8A] text-white';
      case 2: return 'bg-[#3B82F6] text-white';
      default: return 'bg-white text-slate-600 border border-slate-200';
    }
  };


  const filteredUsers = users.filter(
    user =>
      (user.primer_nombre + ' ' + user.primer_apellido).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo_institucional.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTitle = () => {
    switch(mode) {
      case 'requests': return 'Solicitudes de Acceso';
      case 'blocked': return 'Usuarios Bloqueados';
      default: return 'Directorio de Usuarios';
    }
  };

  const getIcon = () => {
    switch(mode) {
      case 'requests': return <History size={28} />;
      case 'blocked': return <ShieldAlert size={28} />;
      default: return <UsersIcon size={28} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">{getTitle()}</h1>
          <p className="text-slate-500 font-medium">Administra los usuarios del sistema</p>
        </div>
        {mode === 'list' && (
          <Button onClick={() => navigate('/users/new')} className="bg-primary hover:bg-sidebar-accent h-10 px-6 rounded-lg font-bold shadow-md">
            <Plus size={18} className="mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      <div className="w-full">
        <Card className="border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="py-6">
            <div className="space-y-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  {mode === 'requests' ? 'Solicitudes' : mode === 'blocked' ? 'Acceso Denegado' : 'Usuarios'}
                </CardTitle>
                <CardDescription>
                  {mode === 'requests' 
                    ? 'Lista de solicitudes de acceso pendientes' 
                    : mode === 'blocked' 
                    ? 'Lista de usuarios con acceso denegado' 
                    : 'Lista de todos los usuarios registrados'}
                </CardDescription>
              </div>
              
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o usuario..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 rounded-lg h-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="pl-6 font-bold text-slate-700">Nombre Completo</TableHead>
                    {mode === 'list' && <TableHead className="font-bold text-slate-700">Usuario</TableHead>}
                    <TableHead className="font-bold text-slate-700">
                      {mode === 'requests' ? 'Cargo / Área' : 'Correo Institucional'}
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">
                      {mode === 'blocked' ? 'Motivo' : 'Rol'}
                    </TableHead>
                    <TableHead className="font-bold text-slate-700">Estado</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-blue-500" /></TableCell></TableRow>
                  ) : mode === 'list' ? (
                    filteredUsers.map(u => (
                      <TableRow key={u.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6 font-bold text-slate-800">{u.primer_nombre} {u.primer_apellido}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{u.username}</TableCell>
                        <TableCell className="text-slate-600">{u.correo_institucional}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(u.rol_id)} border-none px-3 py-1 rounded-md text-[11px] font-bold`}>
                            {getRoleName(u.rol_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${u.estado === 'ACTIVO' ? 'bg-[#1E3A8A]' : 'bg-slate-400'} border-none px-3 py-1 rounded-md text-[11px] font-bold uppercase`}>
                            {u.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/users/${u.id}`)} className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg">
                            <Eye size={16} className="mr-2" /> Ver
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/users/${u.id}/edit`)} className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg">
                            <RefreshCw size={16} className="mr-2" /> Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : mode === 'requests' ? (
                    requests.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="pl-6 font-bold text-slate-800">{r.primer_nombre} {r.primer_apellido}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{r.cargo_solicitado}</TableCell>
                        <TableCell className="text-slate-600">{r.correo_institucional}</TableCell>
                        <TableCell><Badge className="bg-amber-100 text-amber-800 border-none px-3 py-1 rounded-md font-bold">Pendiente</Badge></TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                          <Button size="sm" onClick={() => handleGrant(r)} className="bg-green-600 hover:bg-green-700 rounded-lg">
                            <UserCheck size={16} className="mr-2" /> Conceder
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeny(r.id)} className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg">
                            <UserX size={16} className="mr-2" /> Denegar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    blocked.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="pl-6 font-bold text-slate-800">{b.primer_nombre} {b.primer_apellido}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{b.tipo_identificacion} {b.numero_identificacion}</TableCell>
                        <TableCell className="text-red-500 text-xs font-bold italic">{b.motivo}</TableCell>
                        <TableCell><Badge className="bg-red-100 text-red-800 border-none px-3 py-1 rounded-md font-bold text-[10px]">Bloqueado</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          <Button size="sm" onClick={() => handleGrant(b)} className="bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-lg">
                            <UserCheck size={16} className="mr-2" /> Autorizar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E3A8A] font-bold text-xl flex items-center gap-2">
              <ShieldAlert className="text-red-500" /> Confirmar Acción
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium">
              {pendingAction?.type === 'deny' 
                ? "¿Está seguro de denegar el acceso a este usuario? Será bloqueado permanentemente del sistema."
                : "¿Desea eliminar la restricción de acceso para este usuario?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction}
              className={`${pendingAction?.type === 'deny' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1E3A8A] hover:bg-[#1E40AF]'} text-white rounded-xl font-bold px-6`}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}




