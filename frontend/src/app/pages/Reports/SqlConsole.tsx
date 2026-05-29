import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Database, Play, Trash2, AlertCircle, CheckCircle2, Loader2, Table as TableIcon, Book, X, Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SqlConsole() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryData, setDictionaryData] = useState<any>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error('Por favor, ingresa una consulta SQL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Ejecutando consulta SQL:', query);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sql: query })
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Error al ejecutar la consulta');
      }

      setResults(data);
      
      if (data.type === 'select') {
        toast.success(`Consulta ejecutada con éxito: ${data.row_count} filas encontradas`);
      } else {
        toast.success(data.message);
      }
    } catch (err: any) {
      console.error('Error ejecutando SQL:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDictionary = async () => {
    setDictLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/database/dictionary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDictionaryData(data);
        setShowDictionary(true);
      } else {
        toast.error("No se pudo cargar el diccionario de datos");
      }
    } catch (err) {
      toast.error("Error de conexión al cargar el diccionario");
    } finally {
      setDictLoading(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  const downloadCsv = () => {
    if (!results || !results.rows || results.rows.length === 0) return;
    
    const headers = results.columns.join(',');
    const rows = results.rows.map((row: any) => 
      results.columns.map((col: string) => {
        const val = row[col];
        if (val === null) return '';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_results_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTables = dictionaryData ? Object.keys(dictionaryData).filter(table => 
    table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dictionaryData[table].some((col: any) => col.column.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Database /> Consultas PostgreSQL
          </h1>
          <p className="text-slate-500 text-sm">Consola de administración para ejecutar consultas SQL directas</p>
        </div>
        <Button 
          onClick={fetchDictionary}
          disabled={dictLoading}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 font-bold"
        >
          {dictLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Book className="mr-2 h-4 w-4" />}
          Diccionario de Datos
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4">
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Play size={18} className="text-green-400" /> Editor SQL
          </CardTitle>
          <CardDescription className="text-slate-400">Ejecuta comandos DDL o DML con precaución</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM usuarios LIMIT 10;"
            className="w-full h-48 p-6 font-mono text-sm bg-slate-950 text-green-400 border-none focus:ring-0 resize-none outline-none"
          />
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
            <Button 
              variant="ghost" 
              onClick={clearQuery}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <Trash2 size={18} className="mr-2" /> Limpiar
            </Button>
            <Button 
              onClick={handleExecute}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 rounded-lg shadow-lg shadow-green-900/20"
            >
              {isLoading ? (
                <><Loader2 size={18} className="mr-2 animate-spin" /> Ejecutando...</>
              ) : (
                <><Play size={18} className="mr-2" /> Ejecutar Consulta</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal del Diccionario de Datos */}
      {showDictionary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <Book size={24} />
                <div>
                  <h2 className="text-xl font-bold">Diccionario de Datos</h2>
                  <p className="text-xs text-white/70">Esquema público de la base de datos</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDictionary(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar tablas o columnas..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {filteredTables.length > 0 ? (
                filteredTables.map(tableName => {
                  const isExpanded = expandedTables[tableName];
                  return (
                    <div key={tableName} className="space-y-3 bg-slate-50/50 rounded-xl border border-slate-100 p-4 transition-all">
                      <div 
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleTable(tableName)}
                      >
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={20} className="text-primary" /> : <ChevronRight size={20} className="text-slate-400 group-hover:text-primary" />}
                          <TableIcon className="text-primary/60" size={18} />
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-sm shadow-sm">{tableName}</span>
                          <span className="text-xs font-normal text-slate-400">({dictionaryData[tableName].length} columnas)</span>
                        </h3>
                        {!isExpanded && (
                          <div className="flex gap-1">
                            {dictionaryData[tableName].slice(0, 3).map((c: any) => (
                              <span key={c.column} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">{c.column}</span>
                            ))}
                            {dictionaryData[tableName].length > 3 && <span className="text-[10px] text-slate-400">...</span>}
                          </div>
                        )}
                      </div>
                      
                      {isExpanded && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner animate-in slide-in-from-top-2 duration-300">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-2 text-left font-bold text-slate-600">Columna</th>
                                <th className="px-4 py-2 text-left font-bold text-slate-600">Tipo</th>
                                <th className="px-4 py-2 text-left font-bold text-slate-600">Nulo</th>
                                <th className="px-4 py-2 text-left font-bold text-slate-600">Default</th>
                                <th className="px-4 py-2 text-left font-bold text-slate-600">Descripción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {dictionaryData[tableName].map((col: any) => (
                                <tr key={col.column} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-2 font-mono text-primary">{col.column}</td>
                                  <td className="px-4 py-2 text-slate-500">{col.type}</td>
                                  <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.nullable === 'YES' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                      {col.nullable === 'YES' ? 'NULO' : 'NOT NULL'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-slate-400 font-mono text-xs">{col.default || '-'}</td>
                                  <td className="px-4 py-2 text-slate-500 text-xs italic">{col.comment || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 italic">
                  No se encontraron tablas que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-none bg-red-50 text-red-800 shadow-md">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-lg mb-1">Error en la consulta</h3>
              <p className="font-mono text-sm whitespace-pre-wrap">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-slate-500 animate-pulse font-medium">Procesando consulta SQL...</p>
        </div>
      )}

      {results && (
        <Card className="border-none shadow-xl rounded-xl overflow-hidden animate-in slide-in-from-bottom duration-500">
          <CardHeader className="border-b border-slate-100 py-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TableIcon className="text-primary" size={20} /> Resultados
              </CardTitle>
              <CardDescription>
                {results.type === 'select' 
                  ? `Se encontraron ${results.row_count} registros` 
                  : results.message}
              </CardDescription>
            </div>
            {results.type === 'select' && results.rows?.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadCsv}>
                <Download size={16} className="mr-2" /> Exportar CSV
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {results.type === 'select' && results.rows && results.rows.length > 0 ? (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {results.columns.map((col: string) => (
                        <th key={col} className="px-4 py-3 font-bold text-slate-700 uppercase text-[11px] tracking-wider border-b border-slate-200 bg-slate-50">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-primary/5 transition-colors group">
                        {results.columns.map((col: string) => {
                          const value = row[col];
                          const isNull = value === null;
                          const displayValue = isNull ? 'null' : String(value);
                          
                          return (
                            <td 
                              key={`${i}-${col}`} 
                              className={`px-4 py-3 font-mono text-xs max-w-[300px] truncate ${isNull ? 'text-slate-300 italic' : 'text-slate-600'}`}
                              title={displayValue}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : results.type === 'select' ? (
              <div className="p-12 text-center text-slate-400 italic">
                La consulta se ejecutó pero no devolvió ninguna fila.
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <CheckCircle2 className="text-green-500" size={48} />
                <p className="font-bold text-slate-700">{results.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
