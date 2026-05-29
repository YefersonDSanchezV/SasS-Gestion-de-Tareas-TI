import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Download, UserCheck, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function UserReports() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Reportes de Usuarios</h1>
          <p className="text-slate-500 text-sm">Análisis de actividad, roles y acceso de personal</p>
        </div>
        <Button className="bg-primary hover:bg-sidebar-accent shadow-md">
          <Download size={18} className="mr-2" /> Descargar Listado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Usuarios Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">48</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Nuevos este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">+5</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Roles Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-500">12</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="text-green-500" size={20} /> Distribución por Rol
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center text-slate-400 italic">
            Visualización de distribución de personal en construcción...
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-amber-500" size={20} /> Auditoría de Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center text-slate-400 italic">
            Módulo de auditoría de permisos en construcción...
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
