import { useEffect, useState, useCallback } from 'react';
import { Shield, Save, Check, ChevronDown, ChevronRight, Folder, FolderOpen, FileText, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type Modulo = {
  id: number;
  nombre: string;
  is_folder: boolean;
  parent_id: number | null;
  codigo: string;
  orden: number;
};

type Rol = { id: number; nombre: string; estado: string };

// Build hierarchical tree from flat list
type ModuloNodo = Modulo & { hijos: ModuloNodo[] };

function buildTree(modulos: Modulo[]): ModuloNodo[] {
  const padres = modulos.filter(m => m.parent_id === null);
  return padres.map(padre => ({
    ...padre,
    hijos: modulos
      .filter(m => m.parent_id === padre.id)
      .sort((a, b) => a.orden - b.orden)
      .map(hijo => ({ ...hijo, hijos: [] })),
  }));
}

export default function Permissions() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [selectedRolNombre, setSelectedRolNombre] = useState('');

  // Set of modulo_ids that are granted access (what's saved in DB for this role)
  const [permisosActivos, setPermisosActivos] = useState<Set<number>>(new Set());
  // Pending UI selection (what admin is choosing before saving)
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());

  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hayCAmbios, setHayCambios] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Detect changes between current selection and saved state
  useEffect(() => {
    const igual =
      seleccion.size === permisosActivos.size &&
      [...seleccion].every(id => permisosActivos.has(id));
    setHayCambios(!igual);
  }, [seleccion, permisosActivos]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resMod, resRoles] = await Promise.all([
        axios.get(`${API_URL}/permissions/modulos`, { headers }),
        axios.get(`${API_URL}/roles/`, { headers }),
      ]);

      setModulos(resMod.data);
      setRoles(resRoles.data.filter((r: Rol) => r.estado === 'ACTIVO'));

      // Expand all folders by default
      const folderIds = resMod.data
        .filter((m: Modulo) => m.is_folder)
        .map((m: Modulo) => m.id);
      setExpandidos(new Set(folderIds));
    } catch {
      toast.error('Error al cargar datos del módulo de permisos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermisosRol = async (rolId: number, rolNombre: string) => {
    setSelectedRol(rolId);
    setSelectedRolNombre(rolNombre);
    setLoadingPermisos(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/permissions/roles/${rolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // The backend returns ALL granted modules (folders + children)
      // For UI, we only show the "meaningful" selection: folders if all children selected,
      // or individual children. We'll just load exactly what the DB says.
      const ids = new Set<number>(res.data.map((p: any) => p.modulo_id));
      setPermisosActivos(new Set(ids));
      setSeleccion(new Set(ids));
    } catch {
      toast.error('Error al cargar permisos del rol');
    } finally {
      setLoadingPermisos(false);
    }
  };

  const getAllChildIds = useCallback((moduloId: number): number[] => {
    return modulos
      .filter(m => m.parent_id === moduloId)
      .map(m => m.id);
  }, [modulos]);

  const toggleModulo = (modulo: Modulo) => {
    setSeleccion(prev => {
      const next = new Set(prev);

      if (modulo.is_folder) {
        const childIds = getAllChildIds(modulo.id);
        const allChildrenSelected = childIds.every(id => next.has(id));

        if (allChildrenSelected && next.has(modulo.id)) {
          // Deselect folder + all children
          next.delete(modulo.id);
          childIds.forEach(id => next.delete(id));
        } else {
          // Select folder + all children
          next.add(modulo.id);
          childIds.forEach(id => next.add(id));
        }
      } else {
        // Toggle individual child
        if (next.has(modulo.id)) {
          next.delete(modulo.id);
          // If no children left selected, deselect parent too
          if (modulo.parent_id) {
            const siblings = getAllChildIds(modulo.parent_id);
            const anySelected = siblings.some(id => id !== modulo.id && next.has(id));
            if (!anySelected) next.delete(modulo.parent_id);
          }
        } else {
          next.add(modulo.id);
          // Auto-select parent folder when a child is selected
          if (modulo.parent_id) next.add(modulo.parent_id);
          // If all siblings now selected, mark folder as fully selected
          if (modulo.parent_id) {
            const siblings = getAllChildIds(modulo.parent_id);
            const allSelected = siblings.every(id => id === modulo.id || next.has(id));
            if (allSelected) next.add(modulo.parent_id);
          }
        }
      }

      return next;
    });
  };

  const isFolderChecked = (folderId: number): boolean => {
    const childIds = getAllChildIds(folderId);
    if (childIds.length === 0) return seleccion.has(folderId);
    return childIds.every(id => seleccion.has(id));
  };

  const isFolderIndeterminate = (folderId: number): boolean => {
    const childIds = getAllChildIds(folderId);
    if (childIds.length === 0) return false;
    const someSelected = childIds.some(id => seleccion.has(id));
    const allSelected = childIds.every(id => seleccion.has(id));
    return someSelected && !allSelected;
  };

  const savePermisos = async () => {
    if (!selectedRol) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      // Send only meaningful selection: folders that are fully selected (backend handles cascade)
      // and individual children that are selected without their folder being fully selected.
      // Actually, simplest: just send all selected leaf modules + selected folders.
      // The backend will cascade folder->children. So send only folder if all children selected,
      // else send individual children.
      const payload: { modulo_id: number }[] = [];
      const tree = buildTree(modulos);

      for (const nodo of tree) {
        if (nodo.hijos.length === 0) {
          // Leaf root module (e.g. Gestión de Casos, Logs)
          if (seleccion.has(nodo.id)) {
            payload.push({ modulo_id: nodo.id });
          }
        } else {
          const allChildrenSelected = nodo.hijos.every(h => seleccion.has(h.id));
          if (allChildrenSelected && seleccion.has(nodo.id)) {
            // Send the folder — backend will expand all children
            payload.push({ modulo_id: nodo.id });
          } else {
            // Send only the selected children individually
            nodo.hijos
              .filter(h => seleccion.has(h.id))
              .forEach(h => payload.push({ modulo_id: h.id }));
          }
        }
      }

      await axios.post(`${API_URL}/permissions/roles/${selectedRol}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reload from server to sync state
      await fetchPermisosRol(selectedRol, selectedRolNombre);
      toast.success('Permisos guardados correctamente');
    } catch {
      toast.error('Error al guardar los permisos');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const tree = buildTree(modulos);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="font-medium">Cargando módulo de permisos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control de Acceso por Roles</h1>
            <p className="text-slate-500 mt-0.5 text-sm">
              Seleccione un rol y defina qué módulos puede acceder.
            </p>
          </div>
        </div>

        {selectedRol && hayCAmbios && (
          <button
            onClick={savePermisos}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        )}
        {selectedRol && !hayCAmbios && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-sm border border-emerald-200">
            <Check className="w-4 h-4" />
            Sin cambios pendientes
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Role selector */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Roles</h2>
          <div className="space-y-1.5">
            {roles.map(rol => (
              <button
                key={rol.id}
                onClick={() => fetchPermisosRol(rol.id, rol.nombre)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-sm flex justify-between items-center gap-2 ${
                  selectedRol === rol.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200'
                }`}
              >
                <span className="truncate">{rol.nombre}</span>
                {selectedRol === rol.id && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
          {!selectedRol ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
              <Shield className="w-16 h-16 mb-4" />
              <p className="font-semibold text-lg text-slate-400">Selecciona un rol para configurar sus permisos</p>
              <p className="text-sm text-slate-400 mt-1">Los cambios se guardan por rol de forma independiente</p>
            </div>
          ) : loadingPermisos ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Cargando permisos del rol...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Permisos de Acceso</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Rol: <span className="font-semibold text-indigo-600">{selectedRolNombre}</span>
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  {seleccion.size} módulo{seleccion.size !== 1 ? 's' : ''} con acceso
                </div>
              </div>

              {/* Info box */}
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 text-xs leading-relaxed">
                <strong>Nota:</strong> Al marcar una <strong>carpeta</strong>, se otorga acceso a todos sus submódulos automáticamente.
                Al marcar un <strong>submódulo</strong> individual, se otorga acceso solo a ese submódulo.
              </div>

              {/* Module tree */}
              <div className="space-y-2">
                {tree.map(nodo => {
                  const esCarpeta = nodo.is_folder && nodo.hijos.length > 0;
                  const expandido = expandidos.has(nodo.id);
                  const checked = esCarpeta ? isFolderChecked(nodo.id) : seleccion.has(nodo.id);
                  const indeterminate = esCarpeta ? isFolderIndeterminate(nodo.id) : false;

                  return (
                    <div key={nodo.id} className="rounded-xl overflow-hidden border border-slate-100">
                      {/* Parent row */}
                      <div
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          checked ? 'bg-indigo-50' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        {/* Checkbox */}
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={checked}
                            ref={el => {
                              if (el) el.indeterminate = indeterminate;
                            }}
                            onChange={() => toggleModulo(nodo)}
                          />
                        </label>

                        {/* Icon + label */}
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => esCarpeta && toggleExpand(nodo.id)}
                        >
                          {esCarpeta ? (
                            expandido
                              ? <FolderOpen className="w-5 h-5 text-amber-500 shrink-0" />
                              : <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                          )}
                          <span className={`font-semibold text-sm ${checked ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {nodo.nombre}
                          </span>
                          {checked && !indeterminate && (
                            <span className="ml-auto text-xs text-indigo-500 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">
                              Acceso total
                            </span>
                          )}
                          {indeterminate && (
                            <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                              Acceso parcial
                            </span>
                          )}
                        </button>

                        {/* Expand toggle */}
                        {esCarpeta && (
                          <button
                            onClick={() => toggleExpand(nodo.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {/* Children rows */}
                      {esCarpeta && expandido && (
                        <div className="border-t border-slate-100">
                          {nodo.hijos.map((hijo, idx) => {
                            const hijoChecked = seleccion.has(hijo.id);
                            return (
                              <div
                                key={hijo.id}
                                className={`flex items-center gap-3 px-4 py-2.5 pl-12 transition-colors ${
                                  idx < nodo.hijos.length - 1 ? 'border-b border-slate-100' : ''
                                } ${hijoChecked ? 'bg-indigo-50/50' : 'bg-white hover:bg-slate-50'}`}
                              >
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={hijoChecked}
                                    onChange={() => toggleModulo(hijo)}
                                  />
                                </label>
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className={`text-sm ${hijoChecked ? 'text-indigo-700 font-medium' : 'text-slate-600'}`}>
                                  {hijo.nombre}
                                </span>
                                {hijoChecked && (
                                  <Check className="w-3.5 h-3.5 text-indigo-500 ml-auto" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save button bottom */}
              {hayCAmbios && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={savePermisos}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all font-semibold shadow-md shadow-indigo-200 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
