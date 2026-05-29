import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { casesApi } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, Mail, CheckCircle2, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { CaseStatus } from '../types';

export function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseItem, setCaseItem] = useState<any>(null);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newObservation, setNewObservation] = useState('');
  const [sendByEmail, setSendByEmail] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Roles permitidos para cambiar prioridad
  const canChangePriority = [
    'ADMINISTRADOR',
    'COORDINADOR DE SISTEMAS',
    'INGENIERO DE SISTEMAS PROFESIONAL',
    'TECNICO DE SISTEMAS PROFESIONAL'
  ].includes(user?.rolNombre?.toUpperCase() || '');


  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [caseData, prioritiesData] = await Promise.all([
        casesApi.getById(id),
        casesApi.getPriorities()
      ]);
      setCaseItem(caseData);
      setPriorities(prioritiesData);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      toast.error("Error al cargar el detalle del caso");
    } finally {
      setIsLoading(false);
    }
  };


  const mapStatus = (nombre: string): CaseStatus => {
    const n = nombre?.toLowerCase() || '';
    if (n === 'asignado') return 'assigned';
    if (n === 'en observacion' || n === 'en observación') return 'observation';
    if (n === 'en ejecucion' || n === 'en ejecución') return 'execution';
    if (n === 'finalizado') return 'completed';
    return 'assigned';
  };

  const getStatusBadge = (statusName: string) => {
    const status = mapStatus(statusName);
    const config: Record<
      CaseStatus,
      { label: string; className: string }
    > = {
      assigned: { label: 'Asignado', className: 'bg-[#6B7280] text-white hover:bg-[#6B7280]' },
      observation: { label: 'En Observación', className: 'bg-[#F59E0B] text-white hover:bg-[#F59E0B]' },
      execution: { label: 'En Ejecución', className: 'bg-[#3B82F6] text-white hover:bg-[#3B82F6]' },
      completed: { label: 'Finalizado', className: 'bg-[#10B981] text-white hover:bg-[#10B981]' },
    };
    return config[status] || config.assigned;
  };

  const handleSaveObservation = async () => {
    if (!newObservation.trim()) {
      toast.error('Debe ingresar una observación');
      return;
    }

    try {
      setIsActionLoading(true);
      await casesApi.addObservation({
        caso_id: id!,
        comentario: newObservation,
        enviar_correo: sendByEmail
      });
      
      toast.success(sendByEmail ? 'Observación guardada y enviada' : 'Observación guardada');
      setNewObservation('');
      fetchCaseDetail(); // Recargar historial
    } catch (error) {
      toast.error('Error al guardar observación');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteCase = async () => {
    if (!newObservation.trim()) {
      toast.error('Debe agregar un comentario final antes de finalizar el caso');
      return;
    }

    try {
      setIsActionLoading(true);
      // Al finalizar, el envío de correo al asignador es obligatorio
      await casesApi.finalizeCase(id!, newObservation, true);
      toast.success('Caso finalizado exitosamente. Notificación enviada al asignador.');
      setNewObservation('');
      fetchCaseDetail();
    } catch (error) {
      toast.error('Error al finalizar caso');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdatePriority = async (priorityId: string) => {

    try {
      setIsActionLoading(true);
      await casesApi.updatePriority(id!, parseInt(priorityId));
      toast.success('Prioridad actualizada y notificación enviada');
      fetchCaseDetail();
    } catch (error) {
      toast.error('Error al actualizar la prioridad');
    } finally {
      setIsActionLoading(false);
    }
  };



  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando caso...</span>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/cases')}>
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
        <Card><CardContent className="p-6 text-center">Caso no encontrado</CardContent></Card>
      </div>
    );
  }

  const statusConfig = getStatusBadge(caseItem.estado_nombre || 'Asignado');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/cases')} className="w-fit">
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{caseItem.numero_caso}</h1>
            <p className="text-base md:text-lg text-slate-500 font-medium">{caseItem.titulo}</p>
          </div>
        </div>
        <Badge className={`${statusConfig.className} w-fit text-sm px-4 py-1 rounded-full shadow-sm`}>
          {statusConfig.label}
        </Badge>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Caso</CardTitle>
              <CardDescription>Detalles generales del caso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número de Caso</p>
                  <p className="font-medium">{caseItem.numero_caso}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cola</p>
                  <Badge variant="outline">{caseItem.cola_nombre || 'Sistemas'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asignado a</p>
                  <p className="font-medium">{caseItem.asignado_a_nombre || 'N/A'}</p>
                </div>
                 <div>
                  <p className="text-sm text-muted-foreground">Asignado por</p>
                  <p className="font-medium">{caseItem.asignado_por_nombre || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prioridad</p>
                  {canChangePriority ? (
                    <Select 
                      defaultValue={caseItem.prioridad_id?.toString()} 
                      onValueChange={handleUpdatePriority}
                      disabled={isActionLoading}
                    >
                      <SelectTrigger className="w-full h-8 bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{caseItem.prioridad_nombre}</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Descripción del Caso</p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{caseItem.descripcion}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">
                    {new Date(caseItem.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última Actualización</p>
                  <p className="font-medium">
                    {caseItem.updated_at ? new Date(caseItem.updated_at).toLocaleString('es-ES') : new Date(caseItem.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} />
                Observaciones
              </CardTitle>
              <CardDescription>Historial de comentarios y actualizaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {!caseItem.observaciones || caseItem.observaciones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay observaciones registradas
                </p>
              ) : (
                <div className="space-y-4">
                  {caseItem.observaciones.slice().reverse().map((obs: any) => (
                    <div key={obs.id} className="relative pl-8 pb-6 border-l-2 border-muted last:border-0 last:pb-0">
                      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#1e3a8a] border-2 border-background" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{obs.usuario_nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(obs.created_at).toLocaleString('es-ES')}
                            </p>
                          </div>
                          {obs.enviado_por_correo && (
                            <Badge variant="outline" className="text-xs">
                              <Mail size={12} className="mr-1" />
                              Enviado por correo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{obs.comentario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {mapStatus(caseItem.estado_nombre) !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
                <CardDescription>Gestiona el caso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="observation">Nueva Observación</Label>
                  <Textarea
                    id="observation"
                    placeholder="Escribe un comentario sobre el caso..."
                    value={newObservation}
                    onChange={e => setNewObservation(e.target.value)}
                    rows={5}
                    disabled={isActionLoading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendByEmail}
                    onCheckedChange={checked => setSendByEmail(checked as boolean)}
                    disabled={isActionLoading}
                  />
                  <label
                    htmlFor="sendEmail"
                    className="text-sm cursor-pointer"
                  >
                    Enviar por correo electrónico
                  </label>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                    onClick={handleSaveObservation}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <MessageSquare size={16} className="mr-2" />}
                    Guardar Observación
                  </Button>

                  <Button
                    className="w-full bg-[#10B981] hover:bg-[#059669]"
                    onClick={handleCompleteCase}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle2 size={16} className="mr-2" />}
                    Finalizar Caso
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de observaciones</span>
                <Badge className="bg-blue-600">{caseItem.observaciones?.length || 0}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notificaciones enviadas</span>
                <Badge className="bg-blue-600">{caseItem.total_notificaciones || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

