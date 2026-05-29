import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { usersApi } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Datos precargados de solicitud si existen
  const prefilled = location.state?.prefilled;

  const [formData, setFormData] = useState({
    primer_nombre: prefilled?.primer_nombre || '',
    segundo_nombre: prefilled?.segundo_nombre || '',
    primer_apellido: prefilled?.primer_apellido || '',
    segundo_apellido: prefilled?.segundo_apellido || '',
    tipo_identificacion: prefilled?.tipo_identificacion || 'CC',
    numero_identificacion: prefilled?.numero_identificacion || '',
    celular: prefilled?.celular || '+57',
    correo_personal: prefilled?.correo_personal || '',
    correo_institucional: prefilled?.correo_institucional || '',
    username: '',
    rol_id: '',
    estado: 'ACTIVO',
    password: '',
  });


  // Auto-generar username y asegurar +57
  useEffect(() => {
    if (!isEdit) {
      const pNombre = formData.primer_nombre.trim().toLowerCase().split(' ')[0];
      const pApellido = formData.primer_apellido.trim().toLowerCase().split(' ')[0];
      if (pNombre && pApellido) {
        setFormData(prev => ({ ...prev, username: `${pNombre}.${pApellido}` }));
      }
    }
  }, [formData.primer_nombre, formData.primer_apellido, isEdit]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const rolesData = await usersApi.getRoles();
        setRoles(rolesData);

        if (isEdit) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const user = await response.json();
          setFormData({
            primer_nombre: user.primer_nombre || '',
            segundo_nombre: user.segundo_nombre || '',
            primer_apellido: user.primer_apellido || '',
            segundo_apellido: user.segundo_apellido || '',
            tipo_identificacion: user.tipo_identificacion || 'CC',
            numero_identificacion: user.numero_identificacion || '',
            celular: user.celular || '+57',
            correo_personal: user.correo_personal || '',
            correo_institucional: user.correo_institucional || '',
            username: user.username || '',
            rol_id: user.rol_id?.toString() || '',
            estado: user.estado || 'ACTIVO',
            password: '',
          });
        }
      } catch (error) {
        toast.error("Error cargando datos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const payload = { ...formData, rol_id: parseInt(formData.rol_id) };
      
      if (isEdit) {
        await usersApi.update(id!, payload);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Creación directa desde admin
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/?rol_id=${payload.rol_id}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            primer_nombre: formData.primer_nombre,
            segundo_nombre: formData.segundo_nombre,
            primer_apellido: formData.primer_apellido,
            segundo_apellido: formData.segundo_apellido,
            tipo_identificacion: formData.tipo_identificacion,
            numero_identificacion: formData.numero_identificacion,
            celular: formData.celular,
            correo_personal: formData.correo_personal,
            correo_institucional: formData.correo_institucional,
            username: formData.username,
            password: formData.password
          })
        });

        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Error al crear usuario');
        }
        
        toast.success('Usuario creado y activado exitosamente');
      }
      navigate('/users');

    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || "Error al guardar";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading && isEdit) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/users')}>
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Actualiza la información del usuario' : 'Completa los datos del nuevo usuario'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Los campos con * son obligatorios</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Identificación *</Label>
                <Select
                  value={formData.tipo_identificacion}
                  onValueChange={value => handleChange('tipo_identificacion', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="PP">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de Identificación *</Label>
                <Input
                  value={formData.numero_identificacion}
                  onChange={e => handleChange('numero_identificacion', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Primer Nombre *</Label>
                <Input
                  value={formData.primer_nombre}
                  onChange={e => handleChange('primer_nombre', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Segundo Nombre</Label>
                <Input
                  value={formData.segundo_nombre}
                  onChange={e => handleChange('segundo_nombre', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Primer Apellido *</Label>
                <Input
                  value={formData.primer_apellido}
                  onChange={e => handleChange('primer_apellido', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Segundo Apellido</Label>
                <Input
                  value={formData.segundo_apellido}
                  onChange={e => handleChange('segundo_apellido', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Celular</Label>
                <Input
                  type="tel"
                  value={formData.celular}
                  onChange={e => handleChange('celular', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Correo Personal</Label>
                <Input
                  type="email"
                  value={formData.correo_personal}
                  onChange={e => handleChange('correo_personal', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Correo Institucional *</Label>
                <Input
                  type="email"
                  value={formData.correo_institucional}
                  onChange={e => handleChange('correo_institucional', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Usuario (Username) *</Label>
                <Input
                  value={formData.username}
                  onChange={e => handleChange('username', e.target.value)}
                  required
                />
              </div>

              {!isEdit && (
                <div className="space-y-2">
                  <Label>Contraseña *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    required={!isEdit}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={formData.rol_id}
                  onValueChange={value => handleChange('rol_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(rol => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={value => handleChange('estado', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isEdit ? 'Actualizar' : 'Crear'} Usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

