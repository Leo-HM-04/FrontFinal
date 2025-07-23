'use client';


import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';
import { CheckCircle, Sparkles, Laptop2, Banknote, Bot } from 'lucide-react';
import { SubirFacturaModal } from '@/components/pagos/SubirFacturaModal';
import { VerComprobanteModal } from '@/components/pagos/VerComprobanteModal';
import type { Comprobante } from '@/components/pagos/VerComprobanteModal';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function HistorialPagosPage() {
  // Iconos por departamento
  const getDepartamentoIcon = (dep: string) => {
    switch (dep?.toLowerCase()) {
      case 'ti':
        return <Laptop2 className="inline-block mr-2 w-5 h-5 text-blue-500 align-middle" />;
      case 'cobranza':
        return <Banknote className="inline-block mr-2 w-5 h-5 text-green-500 align-middle" />;
      case 'automatizaciones':
        return <Bot className="inline-block mr-2 w-5 h-5 text-purple-500 align-middle" />;
      default:
        return null;
    }
  };
  // Estado para modal de subir factura
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudIdFactura, setSolicitudIdFactura] = useState<number | null>(null);
  const [pagos, setPagos] = useState<Solicitud[]>([]);
  const [comprobantes, setComprobantes] = useState<{ [id: number]: Comprobante | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; pago: Solicitud | null }>({ open: false, pago: null });
  // Solo mostrar pagadas
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPagosYComprobantes = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No hay token de autenticación');
        const { SolicitudesService } = await import('@/services/solicitudes.service');
        const { ComprobantesService } = await import('@/services/comprobantes.service');
        const data = await SolicitudesService.getAutorizadasYPagadas(token);
        const pagosFiltrados = data.filter((p) => p.estado === 'pagada' || p.estado === 'autorizada');
        pagosFiltrados.sort((a, b) => {
          const fechaA = new Date(a.fecha_pago || a.fecha_limite_pago || 0).getTime();
          const fechaB = new Date(b.fecha_pago || b.fecha_limite_pago || 0).getTime();
          return fechaB - fechaA;
        });
        setPagos(pagosFiltrados);
        // Consultar comprobantes para cada solicitud pagada
        const comprobantesObj: { [id: number]: null } = {};
        await Promise.all(
          pagosFiltrados.map(async (pago) => {
            if (pago.estado === 'pagada') {
              try {
                const comprobantes = await ComprobantesService.getBySolicitud(pago.id_solicitud, token);
                if (comprobantes && comprobantes.length > 0) {
                  comprobantesObj[pago.id_solicitud] = comprobantes[0];
                }
              } catch {}
            }
          })
        );
        setComprobantes(comprobantesObj);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchPagosYComprobantes();
  }, []);

  // Filtrar los pagos según el estado seleccionado
  // Filtrar por estado y departamento
  // Solo mostrar pagos con estado 'pagada'
  const pagosFiltradosPorEstado = pagos.filter((p) => p.estado === 'pagada');
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
          <h2 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Comprobantes y Pagos</h2>
          {/* Filtros */}
          <div className="flex flex-wrap justify-end gap-4 mb-6">
            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-xl shadow border border-blue-200">
              <label className="font-bold text-blue-700 text-lg">Departamento:</label>
              <div className="relative">
                <select
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="w-56 border border-blue-300 rounded-xl px-4 py-3 text-blue-900 font-semibold bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
                >
                  <option value="todos" className="py-2">TODOS</option>
                  {/* Opciones dinámicas de departamento con iconos */}
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep} className="py-2">
                      {/* Los iconos no se muestran en los option nativos, pero se pueden mostrar en el select personalizado si se implementa */}
                      {dep.toUpperCase()}
                    </option>
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
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Tipo de Cuenta/Tarjeta</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Banco Destino</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Estado</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Fecha Límite</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Fecha Pago</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Aprobador</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Comentario</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-white uppercase border-b border-blue-400 tracking-wide">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosPaginados.map((pago) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100 flex items-center gap-2">
                        {getDepartamentoIcon(pago.departamento)}
                        <span>{pago.departamento ? pago.departamento.toUpperCase() : '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-700 font-extrabold border-b border-blue-100">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-700 font-extrabold border-b border-blue-100">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.cuenta_destino}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.concepto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.tipo_cuenta_destino ? pago.tipo_cuenta_destino : ''}{pago.tipo_tarjeta ? ` / ${pago.tipo_tarjeta}` : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100">{pago.banco_destino || ''}</td>
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
                      {/* Columna de acción: Ver comprobante/Subir factura */}
                      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 border-b border-blue-100 text-center">
                        {pago.estado === 'pagada' && (
                          comprobantes[pago.id_solicitud] ? (
                            <button
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-bold"
                              onClick={() => setVerComprobante({ open: true, pago })}
                            >
                              Ver comprobante
                            </button>
                          ) : (
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-bold"
                              onClick={() => {
                                setSolicitudIdFactura(pago.id_solicitud);
                                setModalOpen(true);
                              }}
                            >
                              Subir Comprobante
                            </button>
                          )
                        )}
                      </td>
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
              {/* Modal para ver comprobante fuera de la tabla para evitar error de hidratación */}
              {verComprobante.open && verComprobante.pago && comprobantes[verComprobante.pago.id_solicitud] && (
                <VerComprobanteModal
                  open={verComprobante.open}
                  pago={verComprobante.pago}
                  comprobante={comprobantes[verComprobante.pago.id_solicitud]!}
                  onClose={() => setVerComprobante({ open: false, pago: null })}
                />
              )}
              {/* Modal para subir factura */}
              <SubirFacturaModal
                open={modalOpen}
                solicitudId={solicitudIdFactura}
                onClose={() => setModalOpen(false)}
                onSubmit={async (file, id) => {
                  try {
                    const token = localStorage.getItem('auth_token');
                    if (!token || !id) throw new Error('No hay token o id de solicitud');
                    await SolicitudesService.subirFactura(id, file, token);
                    // Opcional: recargar pagos o mostrar mensaje de éxito
                  } catch {
                    alert('Error al subir la factura');
                  } finally {
                    setModalOpen(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}

