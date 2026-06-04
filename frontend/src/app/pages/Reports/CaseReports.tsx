import { useEffect, useState } from 'react';
import { Download, Briefcase, Clock, Activity, FileText, FileSpreadsheet, File } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function CaseReports() {
  const [metrics, setMetrics] = useState({
    total_casos: 0,
    eficiencia_operativa: 0,
    promedio_respuesta: "0 hrs"
  });

  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(['Numero', 'Titulo', 'Estado', 'Prioridad', 'Asignado A']);
  const [cases, setCases] = useState<any[]>([]);

  const allColumns = ['Numero', 'Titulo', 'Estado', 'Prioridad', 'Fecha de Creacion', 'Ultima Actualizacion', 'Descripcion', 'Asignado A', 'Asignado Por'];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/cases/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(response.data);

      const casesResponse = await axios.get(`${API_URL}/cases/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(casesResponse.data);
    } catch (error) {
      toast.error('Error al cargar métricas de casos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleColumn = (col: string) => {
    setColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleExport = async (format: string) => {
    try {
      if (columns.length === 0) {
        toast.warning('Selecciona al menos una columna');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/cases/export?format=${format}&columns=${columns.join(',')}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `casos_reporte.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
    } catch (error) {
      toast.error('Error al exportar el reporte de casos');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Cargando reporte...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reporte de Casos</h1>
          <p className="text-slate-500 mt-1">Análisis de eficiencia operativa y estado de tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Casos</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.total_casos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Eficiencia Operativa</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.eficiencia_operativa}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Promedio de Respuesta</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.promedio_respuesta}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Vista Previa y Exportación</h2>
        
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Selecciona las columnas a exportar:</p>
          <div className="flex flex-wrap gap-3">
            {allColumns.map(col => (
              <label key={col} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${columns.includes(col) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <input type="checkbox" className="hidden" checked={columns.includes(col)} onChange={() => handleToggleColumn(col)} />
                <span className="font-medium text-sm">{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col} className="p-4 font-semibold text-slate-700">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-500 italic">
                    No hay casos disponibles
                  </td>
                </tr>
              ) : (
                cases.slice(0, 10).map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {columns.map(col => {
                      let val = "N/A";
                      if (col === "Numero") val = c.numero_caso;
                      if (col === "Titulo") val = c.titulo;
                      if (col === "Estado") val = c.estado_nombre || "N/A";
                      if (col === "Prioridad") val = c.prioridad_nombre || "N/A";
                      if (col === "Fecha de Creacion") val = new Date(c.created_at).toLocaleString();
                      if (col === "Ultima Actualizacion") val = new Date(c.updated_at || c.created_at).toLocaleString();
                      if (col === "Descripcion") val = c.descripcion;
                      if (col === "Asignado A") val = c.asignado_a_nombre || "N/A";
                      if (col === "Asignado Por") val = c.asignado_por_nombre || "N/A";
                      
                      return (
                        <td key={col} className="p-4 text-slate-600 truncate max-w-xs" title={val}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
              {cases.length > 10 && (
                <tr>
                  <td colSpan={columns.length} className="p-4 text-center text-slate-500 italic text-xs">
                    Mostrando 10 de {cases.length} casos. Descarga el reporte para ver todos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-end border-t pt-6 border-slate-100">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
            <FileText className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">
            <File className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
