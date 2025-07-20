'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { ConfirmDeleteSoli } from '@/components/common/ConfirmDeleteSoli';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Solicitud } from '@/types';
import { 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  Search
} from 'lucide-react';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';

const getEstadoColor = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'aprobada':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rechazada':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pagada':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getEstadoIcon = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'pendiente':
      return <Clock className="w-4 h-4" />;
    case 'aprobada':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'rechazada':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'pagada':
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function MisSolicitudesPage() {
  //nst { user, logout } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [solicitudAEliminar, setSolicitudAEliminar] = useState<Solicitud | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Cargar solicitudes con timeout de seguridad
  useEffect(() => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      if (loading) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, 10000);

    setLoading(true);
    setTimeoutError(false);

    const fetchSolicitudes = async () => {
      try {
        const data = await SolicitudesService.getMySolicitudes();
        // Ordenar por fecha_creacion descendente (más reciente primero)
        const sorted = data.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
        setSolicitudes(sorted);
        setError('');
      } catch {
        setError('Error al cargar las solicitudes');
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();

    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    const filterSolicitudes = () => {
      let filtered = [...solicitudes];

      // Filtro por texto
      if (searchTerm) {
        filtered = filtered.filter(solicitud => 
          solicitud.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          solicitud.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          solicitud.cuenta_destino?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filtro por estado
      if (statusFilter) {
        filtered = filtered.filter(solicitud => 
          solicitud.estado?.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      // Filtro por fecha
      if (dateFilter) {
        const today = new Date();
        const filterDate = new Date(today);
        
        switch (dateFilter) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(solicitud => {
              const solicitudDate = new Date(solicitud.fecha_creacion);
              solicitudDate.setHours(0, 0, 0, 0);
              return solicitudDate.getTime() === filterDate.getTime();
            });
            break;
          case 'week':
            filterDate.setDate(today.getDate() - 7);
            filtered = filtered.filter(solicitud => 
              new Date(solicitud.fecha_creacion) >= filterDate
            );
            break;
          case 'month':
            filterDate.setMonth(today.getMonth() - 1);
            filtered = filtered.filter(solicitud => 
              new Date(solicitud.fecha_creacion) >= filterDate
            );
            break;
        }
      }

      setFilteredSolicitudes(filtered);
      setCurrentPage(1); // Reset page when filtering
    };

    filterSolicitudes();
  }, [solicitudes, searchTerm, statusFilter, dateFilter]);

  const handleViewDetails = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsDetailModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (!solicitudAEliminar) return;
    setDeleting(true);
    try {
      await SolicitudesService.deleteSolicitante(solicitudAEliminar.id_solicitud);
      setSolicitudes(prev => prev.filter(s => s.id_solicitud !== solicitudAEliminar.id_solicitud));
      setDeleteModalOpen(false);
      setSolicitudAEliminar(null);
      setError('');
      setSuccess('Solicitud eliminada correctamente.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: unknown) {
      let backendMsg = 'Error al eliminar la solicitud';
      if (typeof err === 'object' && err !== null) {
        const errorObj = err as { response?: { data?: { error?: string; message?: string } }, message?: string };
        backendMsg = errorObj.response?.data?.error || errorObj.response?.data?.message || errorObj.message || backendMsg;
      }
      setError(backendMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSolicitudes.length);
  const currentSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

  const filterOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'pagada', label: 'Pagada' }
  ];

  const dateOptions = [
    { value: '', label: 'Todas las fechas' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' }
  ];

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-blue-700 text-xl">
                {timeoutError
                  ? 'La carga está tardando demasiado. Por favor, verifica tu conexión o intenta recargar la página.'
                  : 'Cargando solicitudes...'}
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                  {success}
                </div>
              )}

              {/* Filtros */}
              <div className="mb-8">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Buscar por concepto, departamento o cuenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/15 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>

                    {/* Filtro por estado */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      {filterOptions.map(option => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Filtro por fecha */}
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-white/15 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      {dateOptions.map(option => (
                        <option key={option.value} value={option.value} className="text-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Total Solicitudes</p>
                        <p className="text-2xl font-bold text-white">{solicitudes.length}</p>
                      </div>
                      <FileText className="w-8 h-8 text-white/60" />
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Pendientes</p>
                        <p className="text-2xl font-bold text-white">
                          {solicitudes.filter(s => s.estado?.toLowerCase() === 'pendiente').length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-300" />
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Aprobadas</p>
                        <p className="text-2xl font-bold text-white">
                          {solicitudes.filter(s => s.estado?.toLowerCase() === 'aprobada').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-300" />
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm">Pagadas</p>
                        <p className="text-2xl font-bold text-white">
                          {solicitudes.filter(s => s.estado?.toLowerCase() === 'pagada').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-300" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end md:justify-center mt-4 md:mt-0">
                  <Button
                    onClick={() => router.push('/dashboard/solicitante/nueva-solicitud')}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Nueva Solicitud
                  </Button>
                </div>
              </div>

              {/* Tabla de solicitudes */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Concepto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Monto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Cuenta Destino</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Estado</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Fecha Creación</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Fecha Límite</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-white">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {currentSolicitudes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-white/80">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-white/40" />
                            <p className="text-lg">No tienes solicitudes aún</p>
                            <p className="text-sm text-white/60 mt-1">
                              {searchTerm || statusFilter || dateFilter 
                                ? 'No se encontraron solicitudes con los filtros aplicados'
                                : 'Crea tu primera solicitud de pago'
                              }
                            </p>
                          </td>
                        </tr>
                      ) : 
                        currentSolicitudes.map((solicitud) => (
                          <tr key={solicitud.id_solicitud} className="hover:bg-white/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-white font-medium">{solicitud.concepto}</div>
                              <div className="text-white/70 text-sm mt-1">
                                {solicitud.departamento}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white font-semibold">
                                {formatCurrency(solicitud.monto)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white">{solicitud.cuenta_destino}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado)}`}>
                                {getEstadoIcon(solicitud.estado)}
                                <span className="ml-1 capitalize">{solicitud.estado}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white/90 text-sm">
                                {formatDate(solicitud.fecha_creacion)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white/90 text-sm">
                                {solicitud.fecha_limite_pago ? formatDate(solicitud.fecha_limite_pago) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(solicitud)}
                                  className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                                {solicitud.estado?.toLowerCase() === 'pendiente' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/dashboard/solicitante/editar-solicitud/${solicitud.id_solicitud}`)}
                                      className="bg-yellow-500/20 text-yellow-200 border border-yellow-400/40 hover:bg-yellow-500/40 transition-all duration-300"
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => { setSolicitudAEliminar(solicitud); setDeleteModalOpen(true); }}
                                      className="bg-red-500/20 text-red-200 border border-red-400/40 hover:bg-red-500/40 transition-all duration-300"
                                    >
                                      Eliminar
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Mejoras de paginación visual */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-6 border-t border-white/10 gap-6 bg-gradient-to-r from-blue-900/30 to-blue-700/20">
                  <div className="text-white/90 text-base font-medium">
                    Mostrando <span className="font-bold text-blue-200">{filteredSolicitudes.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-200">{filteredSolicitudes.length}</span>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-400/40 shadow-sm ${currentPage === 1 ? 'bg-gray-400/30 text-white/40 cursor-not-allowed' : 'bg-blue-700/80 text-white hover:bg-blue-800/90'}`}
                      >Primera</button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-400/40 shadow-sm ${currentPage === 1 ? 'bg-gray-400/30 text-white/40 cursor-not-allowed' : 'bg-blue-700/80 text-white hover:bg-blue-800/90'}`}
                      >Anterior</button>
                      <span className="text-white/90 text-base font-semibold px-2">Página <span className="text-blue-200">{currentPage}</span> de <span className="text-blue-200">{totalPages}</span></span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-400/40 shadow-sm ${currentPage === totalPages ? 'bg-gray-400/30 text-white/40 cursor-not-allowed' : 'bg-blue-700/80 text-white hover:bg-blue-800/90'}`}
                      >Siguiente</button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-400/40 shadow-sm ${currentPage === totalPages ? 'bg-gray-400/30 text-white/40 cursor-not-allowed' : 'bg-blue-700/80 text-white hover:bg-blue-800/90'}`}
                      >Última</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal de detalles */}
              {selectedSolicitud && (
                <SolicitudDetailModal
                  solicitud={selectedSolicitud}
                  isOpen={isDetailModalOpen}
                  onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSolicitud(null);
                  }}
                />
              )}

              {/* Modal de confirmación de eliminar */}
              <ConfirmDeleteSoli
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="¿Eliminar solicitud?"
                message="Esta acción eliminará la solicitud de forma permanente. No podrás recuperarla."
                itemName={solicitudAEliminar?.concepto || ''}
                loading={deleting}
              />
            </>
          )}
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}