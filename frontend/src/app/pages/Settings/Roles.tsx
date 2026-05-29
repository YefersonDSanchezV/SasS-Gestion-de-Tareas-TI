import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Shield, ShieldAlert, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Roles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRol, setSelectedRol] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    estado: 'ACTIVO'
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/roles/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error("No se pudieron cargar los roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      toast.error("Error al cargar roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (rol: any) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      estado: rol.estado
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedRol(null);
    setFormData({ nombre: '', descripcion: '', estado: 'ACTIVO' });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const url = selectedRol 
        ? `${import.meta.env.VITE_API_URL || '/api'}/roles/${selectedRol.id}`
        : `${import.meta.env.VITE_API_URL || '/api'}/roles/`;
      
      const response = await fetch(url, {
        method: selectedRol ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error al guardar");
      }

      toast.success(selectedRol ? "Rol actualizado" : "Rol creado");
      setIsEditing(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (rol: any) => {
    const newStatus = rol.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/roles/${rol.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...rol, estado: newStatus })
      });

      if (!response.ok) throw new Error("No se pudo cambiar el estado");
      
      toast.success(`Rol ${newStatus === 'ACTIVO' ? 'activado' : 'desactivado'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Configuración de Roles</h1>
          <p className="text-slate-500 text-sm">Administra los roles y permisos del sistema</p>
        </div>
        {!isEditing && (
          <Button onClick={handleCreate} className="bg-[#1E3A8A] hover:bg-[#1E40AF] h-10 px-6 rounded-lg font-bold shadow-md">
            <Plus size={18} className="mr-2" /> Nuevo Rol
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-[#1E3A8A] text-white py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Shield size={24} /> {selectedRol ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </CardTitle>
            <CardDescription className="text-blue-100">
              Define las propiedades básicas del rol
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Nombre del Rol *</Label>
                  <Input 
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Administrador"
                    className="rounded-lg border-slate-200 focus:ring-[#3B82F6]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-bold">Estado</Label>
                  <div className="flex items-center gap-3">
                    <Button 
                      type="button"
                      variant={formData.estado === 'ACTIVO' ? 'default' : 'outline'}
                      onClick={() => setFormData({...formData, estado: 'ACTIVO'})}
                      className={formData.estado === 'ACTIVO' ? 'bg-green-600 hover:bg-green-700 rounded-lg' : 'rounded-lg'}
                    >
                      Activo
                    </Button>
                    <Button 
                      type="button"
                      variant={formData.estado === 'INACTIVO' ? 'destructive' : 'outline'}
                      onClick={() => setFormData({...formData, estado: 'INACTIVO'})}
                      className={formData.estado === 'INACTIVO' ? 'bg-red-600 hover:bg-red-700 rounded-lg' : 'rounded-lg'}
                    >
                      Inactivo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Descripción</Label>
                <Input 
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Describe las funciones de este rol..."
                  className="rounded-lg border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-lg font-bold">
                  <X size={18} className="mr-2" /> Cancelar
                </Button>
                <Button type="submit" className="bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-lg font-bold px-8 shadow-lg shadow-blue-100">
                  <Save size={18} className="mr-2" /> Guardar Cambios
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="py-6 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-800">
              Listado de Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6 font-bold text-slate-700 uppercase text-[11px] tracking-wider">Nombre</TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Descripción</TableHead>
                  <TableHead className="font-bold text-slate-700 uppercase text-[11px] tracking-wider text-center">Estado</TableHead>
                  <TableHead className="pr-6 text-right font-bold text-slate-700 uppercase text-[11px] tracking-wider">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(rol => (
                  <TableRow key={rol.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 font-bold text-slate-800">{rol.nombre}</TableCell>
                    <TableCell className="text-slate-500 italic text-sm">{rol.descripcion || 'Sin descripción'}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${rol.estado === 'ACTIVO' ? 'bg-green-100 text-green-700 border-none' : 'bg-red-100 text-red-700 border-none'} font-bold px-3 py-1 rounded-md`}>
                        {rol.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => toggleStatus(rol)}
                        className={`${rol.estado === 'ACTIVO' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'} rounded-lg font-bold`}
                        title={rol.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      >
                        {rol.estado === 'ACTIVO' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(rol)} className="text-[#1E3A8A] border-blue-100 hover:bg-blue-50 rounded-lg font-bold">
                        <Edit size={16} className="mr-2" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
