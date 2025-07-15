'use client';


import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { ShieldCheck, Sparkles } from 'lucide-react';

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
        <div className="max-w-5xl mx-auto mt-12 bg-white/80 rounded-xl shadow-lg p-10 border border-blue-200">
          <h2 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Historial de Pagos Realizados</h2>
          {/* Filtros */}
          <div className="flex flex-wrap justify-end gap-4 mb-6">
            <div>
              <label className="mr-2 font-bold text-blue-700">Filtrar por estado:</label>
              <select
                value={estadoFiltro}
                onChange={e => { setEstadoFiltro(e.target.value as 'todas' | 'pagada' | 'autorizada'); setPagina(1); }}
                className="border border-blue-300 rounded-lg px-3 py-2 text-blue-900 font-semibold bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="todas">Todas</option>
                <option value="pagada">Pagadas</option>
                <option value="autorizada">Autorizadas</option>
              </select>
            </div>
            <div>
              <label className="mr-2 font-bold text-blue-700">Filtrar por departamento:</label>
              <select
                value={departamentoFiltro}
                onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                className="border border-blue-300 rounded-lg px-3 py-2 text-blue-900 font-semibold bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="todos">Todos</option>
                {/* Opciones dinámicas de departamento */}
                {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
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
            <div className="overflow-x-auto">
              <table className="w-full rounded-[2rem] shadow-2xl border-2 border-blue-300 bg-white">
                <thead className="bg-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">ID</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Solicitante</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Departamento</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Monto</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Cuenta Destino</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Concepto</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Tipo Pago</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Estado</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Fecha Límite</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Fecha Pago</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Aprobador</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosPaginados.map((pago, idx) => (
                    <tr
                      key={pago.id_solicitud}
                      className={
                        `transition-colors ` +
                        (pago.estado === 'pagada'
                          ? 'bg-blue-50 hover:bg-blue-200'
                          : 'bg-blue-100 hover:bg-blue-200')
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 font-extrabold border-b border-blue-100 rounded-l-2xl">#{pago.id_solicitud}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.nombre_usuario || pago.usuario_nombre || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.departamento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-700 font-extrabold border-b border-blue-100">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-700 font-extrabold border-b border-blue-100">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.cuenta_destino}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.concepto}</td>
                      <td className={
                        `px-6 py-4 whitespace-nowrap text-base font-extrabold border-b border-blue-100 flex items-center gap-2 rounded-xl shadow ` +
                        (pago.estado === 'pagada'
                          ? 'text-white bg-blue-700'
                          : 'text-blue-900 bg-blue-300 border border-blue-400')
                      }>
                        <span title={pago.estado === 'pagada' ? 'Pago realizado' : 'Autorización pendiente'}>
                          {pago.estado === 'pagada' ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-blue-700" />
                          )}
                        </span>
                        {pago.estado === 'pagada' ? 'Pagada' : 'Autorizada'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.fecha_limite_pago ? new Date(pago.fecha_limite_pago).toLocaleDateString('es-CO') : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-CO') : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.aprobador_nombre || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100 rounded-r-2xl">{pago.comentario_aprobador || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Paginación */}
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
            </div>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}

