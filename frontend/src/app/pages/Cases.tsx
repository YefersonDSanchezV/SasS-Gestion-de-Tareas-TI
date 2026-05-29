import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { casesApi } from '../../lib/api';
import { Eye, Search, Loader2, RefreshCw, Plus } from 'lucide-react';
import { CaseStatus } from '../types';

// Función para mapear el estado_id de la DB a CaseStatus
const mapStatus = (estado_id: number | null): CaseStatus => {
  // Asumiendo los IDs: 1: Asignado, 2: Observación, 3: Ejecución, 4: Finalizado
  if (estado_id === 1) return 'assigned';
  if (estado_id === 2) return 'observation';
  if (estado_id === 3) return 'execution';
  if (estado_id === 4) return 'completed';
  return 'assigned'; // Default
};

export function Cases() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [cases, setCases] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchCases = async () => {
    try {
      const data = await casesApi.getAll();
      setCases(data);
    } catch (error) {
      console.error("Error cargando casos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    
    // Polling cada 20 segundos para ver nuevos casos simultáneamente
    const interval = setInterval(fetchCases, 20000);
    return () => clearInterval(interval);

  }, []);

  const getStatusColor = (nombre: string) => {
    const n = nombre?.toLowerCase() || '';
    if (n === 'asignado') return 'bg-status-assigned text-white';
    if (n === 'en observacion' || n === 'en observación') return 'bg-status-observation text-white';
    if (n === 'en ejecucion' || n === 'en ejecución') return 'bg-status-execution text-white';
    if (n === 'finalizado') return 'bg-status-completed text-white';
    return 'bg-slate-400 text-white';
  };

  const getPriorityColor = (nombre: string) => {
    const n = nombre?.toLowerCase() || '';
    if (n === 'alta') return 'text-red-600 bg-red-50 border-red-100';
    if (n === 'media') return 'text-amber-600 bg-amber-50 border-amber-100';
    if (n === 'baja') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch =
      (caseItem.numero_caso?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (caseItem.titulo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.estado_nombre === statusFilter;
    const matchesPriority = priorityFilter === 'all' || caseItem.prioridad_nombre === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });



  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestión de Casos</h1>
          <p className="text-muted-foreground">Administra todos los casos del sistema</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por número de caso o título..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50/50"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-slate-50/50">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ASIGNADO">Asignado</SelectItem>
                  <SelectItem value="EN OBSERVACION">En Observación</SelectItem>
                  <SelectItem value="EN EJECUCION">En Ejecución</SelectItem>
                  <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-slate-50/50">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[120px]">Número</TableHead>
                  <TableHead className="min-w-[200px]">Título</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-slate-500 font-medium">Cargando casos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <p className="text-slate-400">No se encontraron casos con los filtros aplicados</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map(item => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-blue-600 text-xs sm:text-sm">
                        {item.numero_caso}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-sm sm:text-base">{item.titulo}</span>
                          <span className="text-[10px] sm:text-xs text-slate-400">Creado {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.asignado_a_nombre || 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(item.estado_nombre)} text-[10px] sm:text-xs px-2 py-0.5 border-none shadow-none`}>
                          {item.estado_nombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getPriorityColor(item.prioridad_nombre)} text-[10px] sm:text-xs border-2`}>
                          {item.prioridad_nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/cases/${item.id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={16} className="sm:mr-2" />
                          <span className="hidden sm:inline">Detalles</span>
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
  );
}
