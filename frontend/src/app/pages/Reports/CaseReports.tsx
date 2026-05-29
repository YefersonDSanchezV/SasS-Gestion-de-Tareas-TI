import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { FileText, Download, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function CaseReports() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Reportes de Casos</h1>
          <p className="text-slate-500 text-sm">Genera y exporta informes detallados de la gestión de casos</p>
        </div>
        <Button className="bg-primary hover:bg-sidebar-accent shadow-md">
          <Download size={18} className="mr-2" /> Exportar a Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">124</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Eficiencia Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">92%</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tiempo de Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">4.2h</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-primary" size={20} /> Vista Previa del Reporte
              </CardTitle>
              <CardDescription>Muestra los datos según los filtros seleccionados</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg">
              <Filter size={14} className="mr-2" /> Filtros Avanzados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-6 bg-slate-100 rounded-full text-slate-400">
              <BarChart3 size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-600">Gráficos y Tablas Detalladas</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Estamos trabajando en la integración de visualizaciones avanzadas. 
              Pronto podrás generar gráficos de barras, líneas y tablas dinámicas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';
