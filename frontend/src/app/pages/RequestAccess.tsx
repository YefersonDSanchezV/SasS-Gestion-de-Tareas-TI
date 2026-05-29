import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Send, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export function RequestAccess() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    tipo_identificacion: '',
    numero_identificacion: '',
    correo_personal: '',
    correo_institucional: '',
    celular: '',
    cargo_solicitado: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.primer_nombre || !formData.primer_apellido || !formData.numero_identificacion || !formData.correo_institucional) {
      toast.error("Por favor complete los campos obligatorios");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Solicitud enviada correctamente");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Error al enviar la solicitud");
      }
    } catch (error: any) {
      toast.error(error.message || "Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 shadow-2xl border-none">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 mb-2">¡Solicitud Enviada!</CardTitle>
          <CardDescription className="text-slate-500 text-lg">
            Hemos recibido tu solicitud de acceso correctamente. Un administrador revisará tus datos y se pondrá en contacto contigo a través de tu correo institucional.
          </CardDescription>
          <Button 
            className="mt-8 bg-[#1e3a8a] hover:bg-[#1e40af] w-full py-6 text-lg font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
            onClick={() => navigate('/login')}
          >
            Volver al Inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-3 mb-8 text-white">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solicitud de Acceso</h1>
            <p className="text-blue-100 font-medium">Completa tus datos para solicitar una cuenta en la plataforma</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl border-none overflow-hidden rounded-3xl">
            <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-800">Información del Solicitante</CardTitle>
                  <CardDescription>Los campos marcados con * son obligatorios</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Volver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombres */}
                <div className="space-y-2">
                  <Label htmlFor="primer_nombre" className="text-slate-700 font-bold">Primer Nombre *</Label>
                  <Input id="primer_nombre" value={formData.primer_nombre} onChange={handleChange} placeholder="Ej: Juan" className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segundo_nombre" className="text-slate-700 font-bold">Segundo Nombre</Label>
                  <Input id="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} placeholder="Ej: Alberto" className="bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primer_apellido" className="text-slate-700 font-bold">Primer Apellido *</Label>
                  <Input id="primer_apellido" value={formData.primer_apellido} onChange={handleChange} placeholder="Ej: Pérez" className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segundo_apellido" className="text-slate-700 font-bold">Segundo Apellido</Label>
                  <Input id="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange} placeholder="Ej: López" className="bg-slate-50 border-slate-200" />
                </div>

                {/* Identificación */}
                <div className="space-y-2">
                  <Label htmlFor="tipo_identificacion" className="text-slate-700 font-bold">Tipo Identificación *</Label>
                  <Select onValueChange={(v) => handleSelectChange('tipo_identificacion', v)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_identificacion" className="text-slate-700 font-bold">Número Identificación *</Label>
                  <Input id="numero_identificacion" value={formData.numero_identificacion} onChange={handleChange} placeholder="Ej: 1020304050" className="bg-slate-50 border-slate-200" required />
                </div>

                {/* Contacto */}
                <div className="space-y-2">
                  <Label htmlFor="correo_personal" className="text-slate-700 font-bold">Correo Personal *</Label>
                  <Input id="correo_personal" type="email" value={formData.correo_personal} onChange={handleChange} placeholder="ejemplo@gmail.com" className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="correo_institucional" className="text-slate-700 font-bold">Correo Institucional *</Label>
                  <Input id="correo_institucional" type="email" value={formData.correo_institucional} onChange={handleChange} placeholder="usuario@icvc.co" className="bg-slate-50 border-slate-200" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="celular" className="text-slate-700 font-bold">Celular *</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center justify-center px-3 bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-500">+57</span>
                    <Input id="celular" value={formData.celular} onChange={handleChange} placeholder="3001234567" className="bg-slate-50 border-slate-200" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo_solicitado" className="text-slate-700 font-bold">Cargo / Área</Label>
                  <Input id="cargo_solicitado" value={formData.cargo_solicitado} onChange={handleChange} placeholder="Ej: Sistemas / Soporte" className="bg-slate-50 border-slate-200" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/80 p-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <Button 
                type="submit" 
                className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white py-6 text-lg font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Enviar Solicitud de Acceso
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>

        <p className="text-center mt-8 text-blue-200 font-medium">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-white font-bold hover:underline">
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}
