import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserX, Activity, AlertCircle, Loader2, Ticket, MessageSquare, Clock } from 'lucide-react';
import { dashboardApi } from '../../lib/api';

export function Dashboard() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminOrCoordinator = user?.role === 'admin' || user?.role === 'coordinator';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#6B7280', '#F59E0B', '#3B82F6', '#10B981', '#8884d8'];

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium">
            Bienvenido, <span className="text-secondary font-bold">{user?.firstName} {user?.lastName}</span>
          </p>
        </div>
        
        {isAdminOrCoordinator && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white border-slate-200">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="90days">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdminOrCoordinator ? (
          <>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users?.active || 0}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Casos</CardTitle>
                <Ticket className="h-4 w-4 text-[#EF4444]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.users?.total_cases || 0}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Casos Activos</CardTitle>
                <Activity className="h-4 w-4 text-[#10B981]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.cases?.active || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total histórico: {stats?.cases?.total || 0}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.cases?.pending || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-slate-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Asignados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.technicianStats?.asignado || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-status-observation">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">En Observación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-status-observation">{stats?.technicianStats?.['en observacion'] || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-status-execution">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">En Ejecución</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-status-execution">{stats?.technicianStats?.['en ejecucion'] || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-status-completed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Finalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-status-completed">{stats?.technicianStats?.finalizado || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isAdminOrCoordinator && (
          <Card>
            <CardHeader>
              <CardTitle>Auditoría de Inicios de Sesión</CardTitle>
              <CardDescription>Seguimiento de actividad global</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <Users className="h-10 w-10 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400">Próximamente</h3>
              <p className="text-sm text-slate-400 text-center mt-2 max-w-[280px]">
                El registro histórico de conexiones se habilitará en una próxima versión.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Estado actual de los casos</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.cases?.distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(stats?.cases?.distribution || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <CardTitle>Observaciones Recientes de Casos</CardTitle>
          </div>
          <CardDescription>Últimas 5 observaciones registradas en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[120px]">Número Caso</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead className="min-w-[200px]">Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.recentObservations || stats?.recentObservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay observaciones recientes registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  stats?.recentObservations.map((obs: any) => (
                    <TableRow key={obs.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-blue-600">{obs.case_number}</TableCell>
                      <TableCell className="font-medium text-slate-700">{obs.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">
                          {obs.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px]">
                          {obs.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock size={12} />
                          {obs.date_time}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[300px] truncate">
                        {obs.comment}
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
  );
}
