'use client';



import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Eye } from 'lucide-react';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';


export default function HistorialPagosPage() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px]">
            <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">Pagos Autorizados</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6 flex-1 justify-end">
            {/* Filtro Estado */}
            <div className="bg-white/80 rounded-xl shadow border border-blue-200 flex flex-col items-start px-6 py-4 min-w-[240px]">
              <label className="font-bold text-blue-700 text-base mb-2">Filtrar por estado</label>
              <div className="relative w-full">
                <select
                  value={estadoFiltro}
                  onChange={e => { setEstadoFiltro(e.target.value as 'todas' | 'pagada' | 'autorizada'); setPagina(1); }}
                  className="w-full border border-blue-300 rounded-xl px-4 py-2 text-blue-900 font-semibold bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
                >
                  <option value="todas">Todas</option>
                  <option value="pagada">Pagadas</option>
                  <option value="autorizada">Autorizadas</option>
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-400">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
                </span>
              </div>
            </div>
            {/* Filtro Departamento */}
            <div className="bg-white/80 rounded-xl shadow border border-blue-200 flex flex-col items-start px-6 py-4 min-w-[240px]">
              <label className="font-bold text-blue-700 text-base mb-2">Filtrar por departamento</label>
              <div className="relative w-full">
                <select
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="w-full border border-blue-300 rounded-xl px-4 py-2 text-blue-900 font-semibold bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150"
                >
                  <option value="todos">Todos</option>
                  {/* Opciones dinámicas de departamento */}
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-blue-400">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
                </span>
              </div>
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Concepto</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Tipo de Cuenta/Tarjeta</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Banco Destino</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Fecha Límite</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Fecha Pago</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Aprobador</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Comentario</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 divide-y divide-blue-50">
                    {pagosPaginados.map((pago, idx) => (
                      <tr
                        key={pago.id_solicitud}
                        className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-blue-50/60' : 'bg-white/40'} hover:bg-blue-100/80 group`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">#{pago.id_solicitud}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.usuario_nombre ? pago.usuario_nombre : (pago.nombre_usuario ? pago.nombre_usuario : '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-bold rounded-lg shadow-sm" style={{background: 'linear-gradient(90deg, #e0e7ff 0%, #bae6fd 100%)', color: '#2563eb'}}>{pago.departamento || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.cuenta_destino}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 max-w-xs truncate" title={pago.concepto}>{pago.concepto}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.tipo_pago}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.tipo_cuenta_destino ? pago.tipo_cuenta_destino : ''}{pago.tipo_tarjeta ? ` / ${pago.tipo_tarjeta}` : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.banco_destino || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow ${pago.estado === 'pagada' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>{pago.estado === 'pagada' ? 'Pagada' : 'Autorizada'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{pago.fecha_limite_pago ? new Date(pago.fecha_limite_pago).toLocaleDateString('es-CO') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-CO') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{typeof pago.aprobador_nombre === 'string' && pago.aprobador_nombre ? pago.aprobador_nombre : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.comentario_aprobador || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 border-2 border-blue-500 !bg-transparent !text-blue-600 font-bold hover:!bg-blue-50 hover:!text-blue-800 hover:!border-blue-700 focus:!bg-blue-50 focus:!text-blue-800 focus:!border-blue-700 active:!bg-blue-100 active:!text-blue-800 focus:ring-2 focus:ring-blue-300 shadow-sm transition-all duration-150"
                            style={{ boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)' }}
                            onClick={() => { setSelectedPago(pago); setShowDetailModal(true); }}
                            type="button"
                          >
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                        </td>
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
            </>
          )}
        </div>
        {/* Modal de detalle */}
        <PagoDetailModal
          isOpen={showDetailModal}
          pago={selectedPago}
          onClose={() => setShowDetailModal(false)}
        />
      </PagadorLayout>
    </ProtectedRoute>
  );
}