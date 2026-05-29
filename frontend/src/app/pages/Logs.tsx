import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';

export function Logs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACCESO');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/logs/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        toast.error("Error al cargar los logs");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredLogs = (modulo: string) => {
    return logs.filter(log => {
      const matchModulo = log.modulo === modulo;
      const matchSearch = searchTerm === '' || 
        log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchModulo && matchSearch;
    });
  };

  const getCount = (modulo: string) => logs.filter(log => log.modulo === modulo).length;

  const LogTable = ({ modulo }: { modulo: string }) => {
    const filteredLogs = getFilteredLogs(modulo);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[150px]">Usuario</TableHead>
              <TableHead className="w-[200px]">Acción</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="w-[200px]">Fecha y Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? 'No se encontraron registros para esta búsqueda' : 'No hay registros en esta categoría'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map(log => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-slate-700">{log.usuario}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                      {log.accion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{log.descripcion}</TableCell>
                  <TableCell className="text-slate-500 text-xs font-medium">
                    {new Date(log.created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
          <History size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Logs del Sistema</h1>
          <p className="text-slate-500 font-medium">Registro de actividades y eventos del sistema</p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-8">
          <CardTitle className="text-xl font-bold text-slate-800">Historial de Actividades</CardTitle>
          <CardDescription className="text-slate-500">Consulta todos los eventos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-[#3B82F6] transition-colors" />
              <Input
                placeholder="Buscar en los registros (usuario, acción, detalle)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 transition-all text-slate-700"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-slate-500 font-bold">Cargando historial...</p>
            </div>
          ) : (
            <Tabs defaultValue="ACCESO" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8">
                {[
                  { id: 'ACCESO', label: 'Inicios de Sesión' },
                  { id: 'SOLICITUDES', label: 'Solicitudes de Acceso' },
                  { id: 'USUARIOS', label: 'Gestión de Usuarios' },
                  { id: 'CASOS', label: 'Gestión de Casos' }
                ].map(tab => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="flex-1 min-w-[180px] h-12 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white bg-slate-100 text-slate-500 font-bold transition-all hover:bg-slate-200"
                  >
                    {tab.label}
                    <Badge className="ml-2 bg-secondary text-white border-none h-6 w-6 flex items-center justify-center p-0 rounded-full text-[10px]">
                      {getCount(tab.id)}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-white">
                <TabsContent value="ACCESO" className="m-0 focus-visible:ring-0">
                  <LogTable modulo="ACCESO" />
                </TabsContent>
                <TabsContent value="SOLICITUDES" className="m-0 focus-visible:ring-0">
                  <LogTable modulo="SOLICITUDES" />
                </TabsContent>
                <TabsContent value="USUARIOS" className="m-0 focus-visible:ring-0">
                  <LogTable modulo="USUARIOS" />
                </TabsContent>
                <TabsContent value="CASOS" className="m-0 focus-visible:ring-0">
                  <LogTable modulo="CASOS" />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

