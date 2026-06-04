import { useEffect, useState } from 'react';
import { Download, Users, UserPlus, ShieldAlert, FileText, FileSpreadsheet, File } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// Usa la URL base de tu backend o el proxy configurado
const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function UserReports() {
  const [metrics, setMetrics] = useState({
    total_usuarios: 0,
    nuevos_mes: 0,
    roles_activos: 0,
    distribucion: [] as {rol: string, cantidad: number}[]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/users/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(response.data);
    } catch (error) {
      toast.error('Error al cargar métricas de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/users/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `usuarios_reporte.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Reporte ${format.toUpperCase()} descargado exitosamente`);
    } catch (error) {
      toast.error('Error al exportar el reporte');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Cargando reporte...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reporte de Usuarios</h1>
          <p className="text-slate-500 mt-1">Métricas y distribución de usuarios en el sistema.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium">
            <FileText className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium">
            <File className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Usuarios</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.total_usuarios}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Nuevos (Mes)</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.nuevos_mes}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Roles Activos</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.roles_activos}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Distribución por Rol</h2>
          <div className="space-y-4">
            {metrics.distribucion.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-700">{item.rol || 'Sin Rol'}</span>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-slate-200">{item.cantidad} usuarios</span>
              </div>
            ))}
            {metrics.distribucion.length === 0 && <p className="text-slate-500 text-center py-4">No hay datos</p>}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Auditoría de Permisos (Info)</h2>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            Esta sección es de sólo consulta. Para editar permisos diríjase al módulo de Permisos. Aquí puede observar qué roles tienen acceso a qué módulos de manera resumida.
          </p>
          <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
            <p className="text-blue-800 font-medium text-sm">
              ℹ️ Administradores tienen acceso a todo el sistema. Los usuarios estándar tienen acceso a Dashboard, Casos y Temas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
