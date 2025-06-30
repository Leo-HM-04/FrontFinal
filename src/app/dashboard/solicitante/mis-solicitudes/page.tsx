'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
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
      return <CheckCircle className="w-4 h-4" />;
    case 'rechazada':
      return <XCircle className="w-4 h-4" />;
    case 'pagada':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function MisSolicitudesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Cargar solicitudes con timeout de seguridad
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    setLoading(true);
    setTimeoutError(false);

    const fetchSolicitudes = async () => {
      try {
        const data = await SolicitudesService.getMySolicitudes();
        setSolicitudes(data);
        setError('');
      } catch (err) {
        setError('Error al cargar las solicitudes');
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();

    // Timeout de 10 segundos para mostrar mensaje si tarda mucho
    timeoutId = setTimeout(() => {
      if (loading) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

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

  // Paginación
  const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Fecha</th>
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
                            <td className="px-6 py-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(solicitud)}
                                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/10 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredSolicitudes.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
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
            </>
          )}
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}