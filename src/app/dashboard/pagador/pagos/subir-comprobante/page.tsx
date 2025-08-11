'use client';

import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';
import { SubirFacturaModal } from '@/components/pagos/SubirFacturaModal';
import { VerComprobanteModal } from '@/components/pagos/VerComprobanteModal';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import type { Comprobante } from '@/components/pagos/VerComprobanteModal';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Pagination } from '@/components/ui/Pagination';

export default function HistorialPagosPage() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
  // Estado para modal de subir factura
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudIdFactura, setSolicitudIdFactura] = useState<number | null>(null);
  const [pagos, setPagos] = useState<Solicitud[]>([]);
  const [comprobantes, setComprobantes] = useState<{ [id: number]: Comprobante | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; pago: Solicitud | null }>({ open: false, pago: null });
  // Estado para mostrar mensaje de éxito
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Solo mostrar pagadas
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para recargar pagos y comprobantes
  // Ocultar mensaje de éxito automáticamente después de 3 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);
  const fetchPagosYComprobantes = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchPagosYComprobantes();
  }, []);

  // Filtrar los pagos según el estado seleccionado
  // Filtrar por estado y departamento
  // Mostrar pagos con estado 'pagada' (y permitir subir comprobante para cualquiera)
  const pagosFiltradosPorEstado = pagos.filter((p) => p.estado === 'pagada');
  const pagosFiltrados = departamentoFiltro === 'todos'
    ? pagosFiltradosPorEstado
    : pagosFiltradosPorEstado.filter((p) => p.departamento === departamentoFiltro);

  // El botón 'Subir Comprobante' ya está disponible para todas las solicitudes pagadas
  // Si el backend acepta la subida para cualquier solicitud pagada, no se requiere cambio adicional aquí
  // Paginado
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
  // Ordenar: primero los que NO tienen comprobante, luego los que SÍ tienen
  const pagosOrdenados = [...pagosFiltrados].sort((a, b) => {
    const tieneComprobanteA = !!comprobantes[a.id_solicitud];
    const tieneComprobanteB = !!comprobantes[b.id_solicitud];
    if (tieneComprobanteA === tieneComprobanteB) return 0;
    return tieneComprobanteA ? 1 : -1;
  });
  const pagosPaginados = pagosOrdenados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Mensaje de éxito */}
          {successMsg && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-semibold text-lg">{successMsg}</span>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px]">
            <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">Subir Comprobante</h2>
          </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px]">

            {/* Filtros */}
            <div className="flex justify-end w-full mb-4">
              <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-1 border border-blue-200">
                <label htmlFor="departamentoFiltro" className="text-blue-700 text-sm font-medium">Departamento:</label>
                <select
                  id="departamentoFiltro"
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="min-w-[90px] bg-white border border-blue-200 rounded-md px-2 py-1 text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
                >
                  <option value="todos">Todos</option>
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep.toUpperCase()}</option>
                  ))}
                </select>
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
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-x-auto p-0 w-full max-w-7xl mx-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead style={{backgroundColor: '#F0F4FC'}}>
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Tipo de Cuenta/Tarjeta</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Banco Destino</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha Límite</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha Pago</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Aprobador</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Comentario</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 divide-y divide-blue-50">
                    {pagosPaginados.map((pago, idx) => (
                      <tr
                        key={pago.id_solicitud}
                        className={`transition-colors rounded-xl ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{pago.id_solicitud}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.nombre_usuario || pago.usuario_nombre || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">{pago.departamento ? pago.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.cuenta_destino}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.concepto}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.tipo_pago ? pago.tipo_pago.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.tipo_cuenta_destino ? pago.tipo_cuenta_destino : ''}{pago.tipo_tarjeta ? ` / ${pago.tipo_tarjeta}` : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.banco_destino || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-blue-300 text-blue-900 shadow">Pagada</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{pago.fecha_limite_pago ? new Date(pago.fecha_limite_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{typeof pago.aprobador_nombre === 'string' && pago.aprobador_nombre ? pago.aprobador_nombre : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.comentario_aprobador || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              className="min-w-[120px] py-1.5 text-xs bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 mb-0.5"
                              onClick={() => { setSelectedPago(pago); setShowDetailModal(true); }}
                            >
                              Ver
                            </button>
                            {pago.estado === 'pagada' && (
                              comprobantes[pago.id_solicitud] ? (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  onClick={() => setVerComprobante({ open: true, pago })}
                                >
                                  Ver comprobante
                                </button>
                              ) : (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                                  onClick={() => {
                                    setSolicitudIdFactura(pago.id_solicitud);
                                    setModalOpen(true);
                                  }}
                                >
                                  Subir Comprobante
                                </button>
                              )
                            )}
                          </div>
                        </td>
                        {/* Modal para ver detalles de la solicitud (fuera de la tabla para evitar error de hidratación) */}
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginador reutilizado */}
              <div className="px-6 py-4" style={{backgroundColor: '#F0F4FC'}}>
                <Pagination
                  currentPage={pagina}
                  totalPages={totalPaginas}
                  totalItems={pagosFiltrados.length}
                  itemsPerPage={pagosPorPagina}
                  onPageChange={setPagina}
                />
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
                <PagoDetailModal
                  isOpen={showDetailModal}
                  pago={selectedPago}
                  onClose={() => setShowDetailModal(false)}
                />
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
                    await fetchPagosYComprobantes(); // Recargar datos tras subir comprobante
                    setSuccessMsg('¡Comprobante subido exitosamente!');
                  } catch {
                    alert('Error al subir la factura');
                  } finally {
                    setModalOpen(false);
                  }
                }}
              />
              {/* Mensaje de éxito */}
              {successMsg && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-semibold text-lg">{successMsg}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}