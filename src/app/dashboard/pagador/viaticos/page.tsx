"use client";
import { useEffect, useState } from "react";
import { ViaticosService } from "@/services/viaticos.service";
import type { Viatico as BaseViatico } from "@/services/viaticos.service";
import { FileText } from "lucide-react";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';

// Extendemos la interfaz BaseViatico 
type Viatico = BaseViatico & {
  usuario_nombre?: string;
  // Aseguramos que siempre tenemos un id para identificar el viático
  id?: number; // ID alternativo (algunas APIs devuelven id en lugar de id_viatico)
  // Índice de firma para propiedades dinámicas con tipos más específicos
  [key: string]: string | number | boolean | undefined | null;
}

// Puedes personalizar el layout y estilos después
export default function ViaticosPagadorPage() {
  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  useEffect(() => {
    ViaticosService.getAll()
      .then((data) => {
        setViaticos(data as Viatico[]);
        setError("");
        // Selecciona el primer usuario por defecto
        if (data && data.length > 0) {
          const firstUser = (data[0].usuario_nombre || 'Sin usuario').toString();
          setUsuarioSeleccionado(firstUser);
        }
      })
      .catch(() => setError("Error al cargar viáticos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-lg">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Filtrar usuarios por búsqueda
  const usuariosUnicos = Array.from(new Set(viaticos.map((v: Viatico) => v.usuario_nombre || 'Sin usuario')));
  const usuariosFiltrados = busquedaUsuario.trim().length > 0
    ? usuariosUnicos.filter(u => u.toLowerCase().includes(busquedaUsuario.trim().toLowerCase()))
    : usuariosUnicos;

  // Filtrar viáticos por usuario seleccionado
  const viaticosFiltrados = usuarioSeleccionado
    ? viaticos.filter((v: Viatico) => (v.usuario_nombre || 'Sin usuario') === usuarioSeleccionado)
    : viaticos;

  // Selección múltiple solo para los viáticos mostrados
  const allIds = viaticosFiltrados.map((v: Viatico) => v.id_viatico || v.id).filter((id): id is number => id !== undefined);
  const isAllSelected = allIds.length > 0 && selected.length === allIds.length;
  const isIndeterminate = selected.length > 0 && selected.length < allIds.length;

  const toggleAll = () => {
    if (isAllSelected) setSelected([]);
    else setSelected(allIds);
  };
  const toggleOne = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  // Tabla plana: no agrupar por usuario

  // Acción masiva: marcar como pagados
  const handleMarkAsPaid = async () => {
    setProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Llama al endpoint backend para marcar como pagados
      await Promise.all(selected.map(id => ViaticosService.marcarComoPagado(id)));
      setSuccessMsg('¡Viáticos marcados como pagados!');
      setSelected([]);
      // Refresca la lista
      const data = await ViaticosService.getAll();
      setViaticos(data as Viatico[]);
    } catch {
      // Capturamos el error pero no lo utilizamos
      setErrorMsg('Error al marcar como pagados.');
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  };

  const hasSelection = selected.length > 0;

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 flex flex-col items-start sm:items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans mb-1 text-center w-full">
              Viáticos para pagar <span className="hidden sm:inline">(Pagador)</span>
            </h2>
            <div className="text-white/80 text-base font-medium text-center w-full">
              {viaticosFiltrados.length} viáticos por usuario, para procesar el pago.
            </div>
          </div>

          {/* Barra de acciones masivas */}
          {hasSelection && (
            <div className="fixed left-0 right-0 bottom-0 z-40 bg-blue-900 text-white px-8 py-6 flex items-center gap-8 shadow-2xl justify-center border-t-4 border-blue-400">
              <span className="font-extrabold text-lg tracking-wide">
                Seleccionados: <span className="text-yellow-300 text-2xl font-black">{selected.length}</span>
              </span>
              <button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-extrabold text-xl shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-60 border-2 border-white/30"
                aria-label={`Marcar como pagados ${selected.length} viáticos`}
                onClick={() => setShowConfirm(true)}
                disabled={processing}
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {processing ? 'Procesando...' : 'Marcar como pagados'}
              </button>
              {successMsg && (
                <span className="ml-6 text-green-200 font-extrabold text-lg">{successMsg}</span>
              )}
              {errorMsg && (
                <span className="ml-6 text-red-200 font-extrabold text-lg">{errorMsg}</span>
              )}
            </div>
          )}

          {/* Modal de confirmación */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Confirmar acción</h3>
                <p className="text-center text-gray-600 mb-6">
                  ¿Estás seguro que deseas marcar como pagados los {selected.length} viáticos seleccionados?
                </p>
                <div className="flex justify-center gap-4 w-full">
                  <button 
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    onClick={handleMarkAsPaid}
                    disabled={processing}
                  >
                    {processing ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Viáticos por usuario</h2>
              <div className="bg-white rounded-xl border border-blue-100 shadow-sm flex items-center px-3 py-2 w-full sm:w-80">
                <svg className="text-blue-500 mr-2" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  className="border-0 outline-none focus:ring-0 bg-transparent w-full text-blue-900 placeholder-blue-400 text-sm"
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {usuariosFiltrados.map(usuario => (
                <button
                  key={usuario}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
                    usuario === usuarioSeleccionado
                      ? 'bg-blue-600 text-white border-blue-700 shadow'
                      : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setUsuarioSeleccionado(usuario)}
                >
                  {usuario}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          className="accent-blue-600 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                          checked={isAllSelected}
                          ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                          onChange={toggleAll}
                          aria-label="Seleccionar todos los viáticos"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Folio</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Departamento</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Cuenta Destino</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-900 uppercase tracking-wide">Archivo</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-blue-900 uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {viaticosFiltrados.map((v: Viatico) => {
                      const id = (v.id_viatico || v.id || 0) as number;
                      const checked = selected.includes(id);
                      return (
                        <tr
                          key={id}
                          className={`${checked ? 'bg-blue-50' : 'hover:bg-blue-50'} transition-colors`}
                        >
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              className="accent-blue-600 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                              checked={checked}
                              onChange={() => toggleOne(id)}
                              aria-label={checked ? `Deseleccionar viático ${id}` : `Seleccionar viático ${id}`}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900">
                            {id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700 font-mono">
                            {v.folio || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-800">
                            {v.usuario_nombre || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700 capitalize">
                            {v.departamento || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700 max-w-xs truncate">
                            {v.concepto || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-base font-extrabold text-green-700">
                            {v.monto !== undefined ? `$${Number(v.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700">
                            {v.cuenta_destino || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {v.viatico_url ? (
                              <a
                                href={`http://46.202.177.106:4000/uploads/viaticos/${v.viatico_url.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 font-bold"
                              >
                                <FileText size={16} />
                                <span>Ver</span>
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {v.estado ? (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold shadow border uppercase tracking-wide 
                                  ${v.estado.toLowerCase() === 'autorizada'
                                    ? 'bg-blue-200 text-blue-900 border-blue-300'
                                    : v.estado.toLowerCase() === 'pendiente'
                                    ? 'bg-yellow-200 text-yellow-900 border-yellow-300'
                                    : v.estado.toLowerCase() === 'rechazada'
                                    ? 'bg-red-200 text-red-800 border-red-300'
                                    : 'bg-gray-200 text-gray-800 border-gray-300'}
                                `}
                              >
                                {v.estado.charAt(0).toUpperCase() + v.estado.slice(1)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-xs font-extrabold shadow border border-gray-300 uppercase tracking-wide">
                                Sin estado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
