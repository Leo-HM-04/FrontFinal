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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Historial de Pagos</h1>
              <p className="text-blue-100 text-sm">
                Consulta el historial completo de pagos autorizados y procesados
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 lg:flex-shrink-0">
              <p className="text-white/90 text-sm font-medium">
                Total: <span className="text-white font-semibold">{pagos.length}</span> pagos
              </p>
            </div>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro Estado */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Filtrar por estado</label>
              <div className="relative">
                <select
                  value={estadoFiltro}
                  onChange={e => { 
                    setEstadoFiltro(e.target.value as 'todas' | 'pagada' | 'autorizada'); 
                    setPagina(1); 
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todas">Todas</option>
                  <option value="pagada">Pagadas</option>
                  <option value="autorizada">Autorizadas</option>
                </select>
              </div>
            </div>
            {/* Filtro Departamento */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Filtrar por departamento</label>
              <div className="relative">
                <select
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todos">Todos</option>
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{backgroundColor: '#F0F4FC'}}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Solicitante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Beneficiario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Departamento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Concepto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-blue-700 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagosPaginados.map((pago) => (
                        <tr
                          key={pago.id_solicitud}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{pago.id_solicitud}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.usuario_nombre || pago.nombre_usuario || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.nombre_persona || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {pago.departamento || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Intl.NumberFormat('es-CO', { 
                              style: 'currency', 
                              currency: 'COP', 
                              minimumFractionDigits: 0 
                            }).format(pago.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={pago.cuenta_destino}>
                              {pago.cuenta_destino}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={pago.concepto}>
                              {pago.concepto}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              pago.estado === 'pagada' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {pago.estado === 'pagada' ? 'Pagada' : 'Autorizada'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-2 focus:ring-blue-300"
                              onClick={() => { 
                                setSelectedPago(pago); 
                                setShowDetailModal(true); 
                              }}
                              type="button"
                            >
                              <Eye className="w-4 h-4 mr-1" /> 
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Paginador con mejor diseño */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagina - 1) * pagosPorPagina) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagina * pagosPorPagina, pagosFiltrados.length)}
                    </span> de{' '}
                    <span className="font-medium">{pagosFiltrados.length}</span> resultados
                  </div>
                  <Pagination
                    currentPage={pagina}
                    totalPages={totalPaginas}
                    totalItems={pagosFiltrados.length}
                    itemsPerPage={pagosPorPagina}
                    onPageChange={setPagina}
                  />
                </div>
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