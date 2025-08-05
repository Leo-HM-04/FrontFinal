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
import {
  exportMisSolicitudesCSV,
  exportMisSolicitudesExcel,
  exportMisSolicitudesPDF
} from '@/utils/exportMisSolicitudes';

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
    case 'autorizada':
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
  // Estado para el formato y rango de exportación
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRango, setExportRango] = useState('total');

  // Función para exportar
  const handleExport = () => {
    const solicitudesExport = filteredSolicitudes;
    if (exportFormat === 'pdf') {
      exportMisSolicitudesPDF(solicitudesExport, exportRango);
    } else if (exportFormat === 'excel') {
      exportMisSolicitudesExcel(solicitudesExport, exportRango);
    } else if (exportFormat === 'csv') {
      exportMisSolicitudesCSV(solicitudesExport, exportRango);
    }
  };
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
    let isMounted = true;
    setLoading(true);
    setTimeoutError(false);
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      if (isMounted) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, 10000);

    const fetchSolicitudes = async () => {
      try {
        const data = await SolicitudesService.getMySolicitudes();
        if (isMounted) {
          // Ordenar por fecha_creacion descendente (más reciente primero)
          const sorted = data.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
          setSolicitudes(sorted);
          setFilteredSolicitudes(sorted);
          setError('');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error al cargar solicitudes:', error);
          setError('Error al cargar las solicitudes');
          setSolicitudes([]);
          setFilteredSolicitudes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSolicitudes();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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

  const handleDelete = async () => {
    if (!solicitudAEliminar) return;
    setDeleting(true);
    try {
      await SolicitudesService.deleteSolicitante(solicitudAEliminar.id_solicitud);
      const updatedSolicitudes = solicitudes.filter(s => s.id_solicitud !== solicitudAEliminar.id_solicitud);
      setSolicitudes(updatedSolicitudes);
      setFilteredSolicitudes(prev => prev.filter(s => s.id_solicitud !== solicitudAEliminar.id_solicitud));
      setDeleteModalOpen(false);
      setSolicitudAEliminar(null);
      setError('');
      setSuccess('Solicitud eliminada correctamente.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: unknown) {
      console.error('Error al eliminar solicitud:', err);
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

  // Ordenar por estado: pendientes, aprobadas/autorizadas, pagadas, rechazadas, otros
  const estadoOrden = {
    'pendiente': 1,
    'autorizadas': 2,
    'autorizada': 2,
    'pagada': 3,
    'rechazada': 4
  };
  const solicitudesOrdenadas = [...filteredSolicitudes].sort((a, b) => {
    const estadoA = (a.estado || '').toLowerCase();
    const estadoB = (b.estado || '').toLowerCase();
    const ordenA = estadoOrden[estadoA as keyof typeof estadoOrden] ?? 99;
    const ordenB = estadoOrden[estadoB as keyof typeof estadoOrden] ?? 99;
    if (ordenA !== ordenB) return ordenA - ordenB;
    // Si tienen el mismo estado, ordenar por fecha de creación descendente
    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
  });
  // Paginación
  const totalPages = Math.ceil(solicitudesOrdenadas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, solicitudesOrdenadas.length);
  const currentSolicitudes = solicitudesOrdenadas.slice(startIndex, endIndex);

  const filterOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'autorizada', label: 'Autorizadas' },
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

              {/* Controles de exportación */}
              <div className="bg-gradient-to-r from-blue-400/30 to-blue-700/30 backdrop-blur-xl rounded-xl p-4 border border-blue-300/30 shadow-lg mb-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-white text-base font-semibold mb-1">Formato</label>
                      <select
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                        className="w-full bg-white border border-blue-300/30 rounded-xl px-5 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                      >
                        <option value="pdf" className="text-gray-800">PDF</option>
                        <option value="excel" className="text-gray-800">Excel</option>
                        <option value="csv" className="text-gray-800">CSV</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-white text-base font-semibold mb-1">Periodo</label>
                      <select
                        value={exportRango}
                        onChange={e => setExportRango(e.target.value)}
                        className="w-full bg-white border border-blue-300/30 rounded-xl px-5 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                      >
                        <option value="dia" className="text-gray-800">Día</option>
                        <option value="semana" className="text-gray-800">Semana</option>
                        <option value="mes" className="text-gray-800">Mes</option>
                        <option value="año" className="text-gray-800">Año</option>
                        <option value="total" className="text-gray-800">Total</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    onClick={handleExport}
                    className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-3 text-lg transition-all duration-200"
                  >
                    <FileText className="w-6 h-6" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-400/30 to-blue-700/30 backdrop-blur-xl rounded-2xl p-8 border border-blue-300/30 shadow-xl flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Filtro de búsqueda */}
                    <div className="flex flex-col gap-2">
                      <label className="block text-white text-base font-semibold">Buscar</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full h-[50px] bg-white border border-blue-300/30 rounded-xl pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-md transition-all duration-200 hover:border-blue-400/60"
                          placeholder="Buscar por concepto, departamento o cuenta..."
                        />
                      </div>
                    </div>
                    {/* Filtro de estado */}
                    <div className="flex flex-col gap-2">
                      <label className="block text-white text-base font-semibold">Estado</label>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full bg-white border border-blue-300/30 rounded-xl px-5 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                      >
                        {filterOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Filtro de fecha */}
                    <div className="flex flex-col gap-2">
                      <label className="block text-white text-base font-semibold">Fecha</label>
                      <select
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="w-full bg-white border border-blue-300/30 rounded-xl px-5 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                      >
                        {dateOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-gray-800">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end md:justify-center">
                    <Button
                      onClick={() => router.push('/dashboard/solicitante/nueva-solicitud')}
                      className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 rounded-xl font-bold shadow-2xl flex items-center gap-3 text-lg transition-all duration-200"
                    >
                      <Plus className="w-6 h-6" />
                      Nueva Solicitud
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabla de solicitudes */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Folio</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white min-w-[200px]">Concepto</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Monto</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white min-w-[150px]">Cuenta Destino</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Tipo Cuenta</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white min-w-[120px]">Banco</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Estado</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Creación</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">Límite</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-white whitespace-nowrap w-[180px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {currentSolicitudes.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-white/80">
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
                            <td className="px-4 py-3">
                              <div className="text-white font-bold text-sm">{solicitud.folio || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white font-medium text-sm truncate max-w-[200px]">{solicitud.concepto}</div>
                              <div className="text-white/70 text-xs mt-0.5 truncate">
                                {solicitud.departamento}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white font-semibold text-sm">
                                {formatCurrency(solicitud.monto)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm truncate max-w-[150px]">{solicitud.cuenta_destino}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm">
                                {solicitud.tipo_cuenta_destino === 'Tarjeta'
                                  ? solicitud.tipo_tarjeta || 'Tarjeta'
                                  : solicitud.tipo_cuenta_destino || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm truncate">{solicitud.banco_destino || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado)}`}>
                                {getEstadoIcon(solicitud.estado)}
                                <span className="ml-1 capitalize">{solicitud.estado}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white/90 text-sm whitespace-nowrap">
                                {formatDate(solicitud.fecha_creacion)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white/90 text-sm whitespace-nowrap">
                                {solicitud.fecha_limite_pago ? formatDate(solicitud.fecha_limite_pago) : '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
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