import { useEffect, useState } from 'react';
import { Shield, Save, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type Modulo = {
  id: number;
  nombre: string;
  is_folder: boolean;
  parent_id: number | null;
};
type Permiso = { id: number; nombre: string };
type Rol = { id: number; nombre: string; estado: string };
type RolModuloPermiso = { modulo_id: number; permiso_id: number };

export default function Permissions() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [tiposPermiso, setTiposPermiso] = useState<Permiso[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [permisosRol, setPermisosRol] = useState<RolModuloPermiso[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resMod, resTipos, resRoles] = await Promise.all([
        axios.get(`${API_URL}/permissions/modulos`, { headers }),
        axios.get(`${API_URL}/permissions/tipos`, { headers }),
        axios.get(`${API_URL}/roles/`, { headers })
      ]);
      
      setModulos(resMod.data);
      setTiposPermiso(resTipos.data);
      setRoles(resRoles.data.filter((r: Rol) => r.estado === 'ACTIVO'));
    } catch (error) {
      toast.error('Error al cargar datos del módulo de permisos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisosRol = async (rolId: number) => {
    setSelectedRol(rolId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/permissions/roles/${rolId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // response comes as list of {rol_id, modulo_id, permiso_id}
      setPermisosRol(res.data.map((p: any) => ({ modulo_id: p.modulo_id, permiso_id: p.permiso_id })));
    } catch (error) {
      toast.error('Error al cargar permisos del rol');
    }
  };

  const handleTogglePermiso = (moduloId: number, permisoId: number) => {
    setPermisosRol(prev => {
      const exists = prev.find(p => p.modulo_id === moduloId && p.permiso_id === permisoId);
      if (exists) {
        return prev.filter(p => !(p.modulo_id === moduloId && p.permiso_id === permisoId));
      } else {
        return [...prev, { modulo_id: moduloId, permiso_id: permisoId }];
      }
    });
  };

  const savePermisos = async () => {
    if (!selectedRol) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/permissions/roles/${selectedRol}`, permisosRol, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Permisos guardados correctamente');
    } catch (error) {
      toast.error('Error al guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Cargando módulo de permisos...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo de Permisos</h1>
            <p className="text-slate-500 mt-1">Gestión de accesos y configuración de seguridad por roles.</p>
          </div>
        </div>
        {selectedRol && (
          <button 
            onClick={savePermisos} 
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Seleccionar Rol</h2>
          <div className="space-y-2">
            {roles.map(rol => (
              <button
                key={rol.id}
                onClick={() => fetchPermisosRol(rol.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center ${
                  selectedRol === rol.id 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                    : 'bg-slate-50 text-slate-700 border border-transparent hover:bg-slate-100'
                }`}
              >
                {rol.nombre}
                {selectedRol === rol.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {!selectedRol ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
              <Shield className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-lg">Selecciona un rol para ver y editar sus permisos</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                Matriz de Permisos
                <span className="text-sm font-normal text-slate-500 ml-2 px-2.5 py-0.5 bg-slate-100 rounded-full">
                  {roles.find(r => r.id === selectedRol)?.nombre}
                </span>
              </h2>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-semibold text-slate-700">Módulo</th>
                      {tiposPermiso.map(p => (
                        <th key={p.id} className="p-4 font-semibold text-slate-700 text-center">{p.nombre}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modulos.map((modulo, idx) => {
                      const indent = (() => {
                        let level = 0;
                        let parent = modulo.parent_id;
                        while (parent) {
                          const parentMod = modulos.find(m => m.id === parent);
                          if (parentMod) {
                            level++;
                            parent = parentMod.parent_id;
                          } else break;
                        }
                        return level;
                      })();
                      return (
                        <tr key={modulo.id} className={idx !== modulos.length - 1 ? 'border-b border-slate-100' : ''}>
                          <td className="p-4 font-medium text-slate-700" style={{ paddingLeft: `${1 + indent * 1.5}rem` }}>
                            {modulo.is_folder ? (<strong>{modulo.nombre}</strong>) : modulo.nombre}
                          </td>
                          {tiposPermiso.map(permiso => {
                            const isChecked = permisosRol.some(p => p.modulo_id === modulo.id && p.permiso_id === permiso.id);
                            const handleChange = () => {
                              if (modulo.is_folder) {
                                const descendantIds = modulos
                                  .filter(m => {
                                    let cur = m.parent_id;
                                    while (cur) {
                                      if (cur === modulo.id) return true;
                                      const parentMod = modulos.find(pm => pm.id === cur);
                                      cur = parentMod?.parent_id ?? null;
                                    }
                                    return false;
                                  })
                                  .map(m => m.id);
                                descendantIds.forEach(id => handleTogglePermiso(id, permiso.id));
                              } else {
                                handleTogglePermiso(modulo.id, permiso.id);
                              }
                            };
                            return (
                              <td key={permiso.id} className="p-4 text-center">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                    checked={isChecked}
                                    onChange={handleChange}
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-amber-800 text-sm font-medium">
                  ⚠️ Nota: Los roles con acceso Administrador no necesitan permisos explícitos aquí, pero puedes configurarlos para mayor granularidad. Los módulos "Dashboard", "Casos" y "Temas" son accesibles por todos los usuarios por defecto.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
