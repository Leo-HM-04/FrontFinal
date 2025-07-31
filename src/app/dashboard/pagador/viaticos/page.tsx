"use client";
import { useEffect, useState } from "react";
import { ViaticosService } from "@/services/viaticos.service";
import type { Viatico as BaseViatico } from "@/services/viaticos.service";
import { FaFilePdf } from "react-icons/fa";
import { FileText } from "lucide-react";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';

// Puedes personalizar el layout y estilos después
export default function ViaticosPagadorPage() {
  const [viaticos, setViaticos] = useState<BaseViatico[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");

  useEffect(() => {
    ViaticosService.getAll()
      .then((data) => {
        setViaticos(data);
        setError("");
        // Selecciona el primer usuario por defecto
        if (data && data.length > 0) {
          const firstUser = data[0].usuario_nombre || 'Sin usuario';
          setUsuarioSeleccionado(firstUser);
        }
      })
      .catch(() => setError("Error al cargar viáticos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-lg">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Filtrar usuarios por búsqueda
  const usuariosUnicos = Array.from(new Set(viaticos.map((v: any) => v.usuario_nombre || 'Sin usuario')));
  const usuariosFiltrados = busquedaUsuario.trim().length > 0
    ? usuariosUnicos.filter(u => u.toLowerCase().includes(busquedaUsuario.trim().toLowerCase()))
    : usuariosUnicos;

  // Filtrar viáticos por usuario seleccionado
  const viaticosFiltrados = usuarioSeleccionado
    ? viaticos.filter((v: any) => (v.usuario_nombre || 'Sin usuario') === usuarioSeleccionado)
    : viaticos;

  // Selección múltiple solo para los viáticos mostrados
  const allIds = viaticosFiltrados.map((v: any) => v.id_viatico || v.id);
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
      setViaticos(data);
    } catch (e) {
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
        <div className="max-w-6xl mx-auto px-2 sm:px-6 py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-blue-900 flex items-center gap-3">
            <span className="inline-flex items-center justify-center bg-blue rounded-full p-2">
              <FaFilePdf className="text-white w-7 h-7" />
            </span>
            Viáticos para pagar <span className="hidden sm:inline">(Pagador)</span>
          </h1>

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
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  ¿Marcar viáticos seleccionados como pagados?
                </h3>
                <p className="text-blue-800 mb-6 text-center">
                  Se marcarán <b>{selected.length}</b> viáticos como pagados. ¿Estás seguro?
                </p>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 rounded font-semibold bg-blue-200 hover:bg-blue-300 text-blue-900"
                    onClick={() => setShowConfirm(false)}
                    aria-label="Cancelar confirmación"
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 rounded font-semibold bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleMarkAsPaid}
                    aria-label="Confirmar marcar como pagados"
                    autoFocus
                  >
                    Sí, marcar como pagados
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Buscador y menú de usuarios mejorado visualmente */}
          <div className="mb-8 flex flex-col items-center">
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busquedaUsuario}
              onChange={e => setBusquedaUsuario(e.target.value)}
              className="mb-4 w-full max-w-md px-5 py-3 border-2 border-blue-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 text-lg font-semibold bg-white placeholder-blue-300"
              style={{ textAlign: 'center' }}
            />
            <div className="w-full max-w-3xl bg-blue-50 rounded-xl shadow-inner px-2 py-3 flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50 border border-blue-100 justify-center">
              {usuariosFiltrados.length === 0 ? (
                <span className="text-blue-700 px-2 py-1">Sin usuarios</span>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <button
                    key={usuario}
                    className={`min-w-[160px] px-6 py-3 rounded-full font-extrabold text-base border-2 transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${usuarioSeleccionado === usuario ? 'bg-blue-900 text-white border-blue-900 scale-105 shadow-lg' : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-200 hover:border-blue-400'}`}
                    onClick={() => { setUsuarioSeleccionado(usuario); setSelected([]); }}
                    aria-pressed={usuarioSeleccionado === usuario}
                  >
                    {usuario}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-blue-200 shadow-lg overflow-x-auto">
            {viaticosFiltrados.length === 0 ? (
              <div className="px-6 py-16 text-center text-blue-900/80 bg-blue-50">
                <FileText className="w-14 h-14 mx-auto mb-4 text-blue-200" />
                <p className="text-lg font-semibold">No hay viáticos para mostrar</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-2 py-4 text-center">
                      <input
                        type="checkbox"
                        className="accent-blue-600 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                        checked={isAllSelected}
                        ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                        onChange={toggleAll}
                        aria-label="Seleccionar todos los viáticos"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">ID</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Folio</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Usuario</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Departamento</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Concepto</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Monto</th>
                    <th className="px-4 py-4 text-left text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Cuenta Destino</th>
                    <th className="px-4 py-4 text-center text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Archivo</th>
                    <th className="px-4 py-4 text-center text-xs sm:text-sm font-bold text-blue-900 tracking-wide uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {viaticosFiltrados.map((v: any) => {
                    const id = v.id_viatico || v.id;
                    const checked = selected.includes(id);
                    return (
                      <tr
                        key={id}
                        className={checked ? 'bg-blue-50/60' : ''}
                      >
                        <td className="px-2 py-4 text-center">
                          <input
                            type="checkbox"
                            className="accent-blue-600 w-5 h-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                            checked={checked}
                            onChange={() => toggleOne(id)}
                            aria-label={`Seleccionar viático ${id}`}
                          />
                        </td>
                        <td className="px-4 py-4 text-blue-900 font-bold text-xs sm:text-sm whitespace-nowrap">{id}</td>
                        <td className="px-4 py-4 text-blue-900 font-mono text-xs sm:text-sm whitespace-nowrap">{v.folio || '-'}</td>
                        <td className="px-4 py-4 text-blue-900 font-medium text-xs sm:text-sm whitespace-nowrap">{v.usuario_nombre || '-'}</td>
                        <td className="px-4 py-4 text-blue-900 font-medium text-xs sm:text-sm whitespace-nowrap">{v.departamento}</td>
                        <td className="px-4 py-4 text-blue-900 uppercase tracking-wide text-xs sm:text-sm whitespace-nowrap">{v.concepto}</td>
                        <td className="px-4 py-4 text-blue-900 font-extrabold text-xs sm:text-sm whitespace-nowrap">{Number(v.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                        <td className="px-4 py-4 text-blue-900 text-xs sm:text-sm whitespace-nowrap">{v.cuenta_destino}</td>
                        <td className="px-4 py-4 text-center">
                          {v.viatico_url ? (
                            <a
                              href={`http://localhost:4000/uploads/viaticos/${v.viatico_url.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold hover:text-blue-900"
                            >
                              <FaFilePdf className="text-red-600" /> <span className="hidden sm:inline">Ver</span>
                            </a>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold border
                              ${v.estado === 'pagado' ? 'bg-green-100 text-green-700 border-green-200' :
                                v.estado === 'autorizada' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-white text-blue-900 border-blue-200'}`}
                          >
                            {v.estado || 'autorizada'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
