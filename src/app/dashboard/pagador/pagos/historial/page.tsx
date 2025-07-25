'use client';


import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';


export default function HistorialPagosPage() {
  const [pagos, setPagos] = useState<Solicitud[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<'todas' | 'pagada' | 'autorizada'>('todas');
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No hay token de autenticación');
        const { SolicitudesService } = await import('@/services/solicitudes.service');
        const data = await SolicitudesService.getAutorizadasYPagadas(token);
        // Ordenar por fecha_pago (pagada) o fecha_limite_pago (autorizada), de más reciente a más antigua
        const pagosFiltrados = data.filter((p) => p.estado === 'pagada' || p.estado === 'autorizada');
        pagosFiltrados.sort((a, b) => {
          // Usar fecha_pago si existe, si no usar fecha_limite_pago
          const fechaA = new Date(a.fecha_pago || a.fecha_limite_pago || 0).getTime();
          const fechaB = new Date(b.fecha_pago || b.fecha_limite_pago || 0).getTime();
          return fechaB - fechaA; // Más reciente primero
        });
        setPagos(pagosFiltrados);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchPagos();
  }, []);

  // Filtrar los pagos según el estado seleccionado
  // Filtrar por estado y departamento
  const pagosFiltradosPorEstado = estadoFiltro === 'todas'
    ? pagos
    : pagos.filter((p) => p.estado === estadoFiltro);
  const pagosFiltrados = departamentoFiltro === 'todos'
    ? pagosFiltradosPorEstado
    : pagosFiltradosPorEstado.filter((p) => p.departamento === departamentoFiltro);
  // Paginado
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
  const pagosPaginados = pagosFiltrados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="w-full max-w-7xl mx-auto mt-12 bg-white rounded-3xl shadow-2xl p-12 border-t-4 border-b-4 border-blue-200">
          <h2 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Historial de Pagos Realizados</h2>
          {/* Filtros */}
          <div className="flex flex-wrap justify-end gap-4 mb-6">
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl shadow border border-blue-200">
              <label className="font-bold text-blue-700 text-lg">Filtrar por estado:</label>
              <div className="relative">
                <select
                  value={estadoFiltro}
                  onChange={e => { setEstadoFiltro(e.target.value as 'todas' | 'pagada' | 'autorizada'); setPagina(1); }}
                  className="w-56 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 font-semibold bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
                >
                  <option value="todas" className="py-2">Todas</option>
                  <option value="pagada" className="py-2">Pagadas</option>
                  <option value="autorizada" className="py-2">Autorizadas</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-400">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl shadow border border-blue-200">
              <label className="font-bold text-blue-700 text-lg">Filtrar por departamento:</label>
              <div className="relative">
                <select
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="w-56 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 font-semibold bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
                >
                  <option value="todos" className="py-2">Todos</option>
                  {/* Opciones dinámicas de departamento */}
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep} className="py-2">{dep}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-400">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
                </span>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-green-400 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <p className="text-lg text-red-600">{error}</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
              <p className="text-lg text-gray-700">No hay pagos realizados aún.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl shadow-2xl border-t-4 border-b-4 border-blue-200 overflow-x-auto p-10 w-full max-w-7xl mx-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead style={{backgroundColor: '#F0F4FC'}}>
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">ID</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Solicitante</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Tipo de Cuenta/Tarjeta</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Banco Destino</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Estado</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha Límite</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha Pago</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Aprobador</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Comentario</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pagosPaginados.map((pago, idx) => (
                      <tr
                        key={pago.id_solicitud}
                        className={`transition-colors rounded-xl ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100`}
                      >
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900 font-bold">#{pago.id_solicitud}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.usuario_nombre ? pago.usuario_nombre : (pago.nombre_usuario ? pago.nombre_usuario : '-')}</td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">{pago.departamento || '-'}</span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.cuenta_destino}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.concepto}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.tipo_pago}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.tipo_cuenta_destino ? pago.tipo_cuenta_destino : ''}{pago.tipo_tarjeta ? ` / ${pago.tipo_tarjeta}` : ''}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.banco_destino || ''}</td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-blue-300 text-blue-900 shadow">{pago.estado === 'pagada' ? 'Pagada' : 'Autorizada'}</span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-700">{pago.fecha_limite_pago ? new Date(pago.fecha_limite_pago).toLocaleDateString('es-CO') : '-'}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-700">{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-CO') : '-'}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{typeof pago.aprobador_nombre === 'string' && pago.aprobador_nombre ? pago.aprobador_nombre : '-'}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{pago.comentario_aprobador || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación fija debajo de la tabla */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-200 text-blue-700 font-bold border border-blue-400 shadow hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1 || totalPaginas === 0}
                  aria-label="Página anterior"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  <span>Anterior</span>
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      className={`w-8 h-8 rounded-full font-bold border transition flex items-center justify-center ${
                        num === pagina
                          ? 'bg-blue-700 text-white border-blue-700 shadow-lg'
                          : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-100'
                      }`}
                      onClick={() => setPagina(num)}
                      disabled={num === pagina}
                      aria-label={`Ir a la página ${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-200 text-blue-700 font-bold border border-blue-400 shadow hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas || totalPaginas === 0}
                  aria-label="Página siguiente"
                >
                  <span>Siguiente</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}

