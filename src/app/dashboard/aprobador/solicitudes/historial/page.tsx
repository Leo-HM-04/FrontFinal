'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { exportSolicitudesToCSV, exportSolicitudesToExcel, exportSolicitudesToPDF } from '@/utils/exportUtils';
import { toast } from 'react-hot-toast';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { ExportOptionsModal } from '@/components/solicitudes/ExportOptionsModal';
import { Solicitud } from '@/types';

export default function HistorialSolicitudesPage() {
  const { solicitudes: allSolicitudes, loading } = useSolicitudes();
  // Filtrar solo las solicitudes procesadas (autorizadas, pagadas o rechazadas)
  const solicitudes = allSolicitudes.filter(s => s.estado !== 'pendiente');

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Funciones para ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string): { date: string; time: string } => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    return {
      date: date.toLocaleDateString('es-MX', dateOptions),
      time: date.toLocaleTimeString('es-MX', timeOptions)
    };
  };

  const {
    filters,
    filteredData: filteredSolicitudes,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(solicitudes, 'solicitudes');

  // Aplicar ordenamiento a las solicitudes filtradas
  const solicitudesOrdenadas = [...filteredSolicitudes].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal, bVal;
    switch (sortField) {
      case 'folio':
        aVal = a.folio || '';
        bVal = b.folio || '';
        break;
      case 'usuario':
        aVal = a.usuario_nombre || '';
        bVal = b.usuario_nombre || '';
        break;
      case 'departamento':
        aVal = a.departamento || '';
        bVal = b.departamento || '';
        break;
      case 'monto':
        aVal = a.monto || 0;
        bVal = b.monto || 0;
        break;
      case 'estado':
        aVal = a.estado || '';
        bVal = b.estado || '';
        break;
      case 'fecha_revision':
        aVal = new Date(a.fecha_revision || 0).getTime();
        bVal = new Date(b.fecha_revision || 0).getTime();
        break;
      case 'fecha_creacion':
        aVal = new Date(a.fecha_creacion || 0).getTime();
        bVal = new Date(b.fecha_creacion || 0).getTime();
        break;
      case 'tipo_pago':
        aVal = a.tipo_pago || '';
        bVal = b.tipo_pago || '';
        break;
      case 'banco_destino':
        aVal = a.banco_destino || '';
        bVal = b.banco_destino || '';
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: solicitudesOrdenadas, initialItemsPerPage: 5 });

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowDetailModal(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    switch(format) {
      case 'csv':
        exportSolicitudesToCSV(solicitudesOrdenadas);
        toast.success(`${solicitudesOrdenadas.length} solicitudes exportadas a CSV`);
        break;
      case 'excel':
        exportSolicitudesToExcel(solicitudesOrdenadas);
        toast.success(`${solicitudesOrdenadas.length} solicitudes exportadas a Excel`);
        break;
      case 'pdf':
        exportSolicitudesToPDF(solicitudesOrdenadas);
        toast.success(`${solicitudesOrdenadas.length} solicitudes exportadas a PDF`);
        break;
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      autorizada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
      pagada: 'bg-blue-100 text-blue-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentColorClass = (departamento: string) => {
    const departamentosColores = {
      'Finanzas': 'px-3 py-1 text-sm font-medium rounded-lg bg-blue-100 text-blue-800',
      'Recursos Humanos': 'px-3 py-1 text-sm font-medium rounded-lg bg-purple-100 text-purple-800',
      'Marketing': 'px-3 py-1 text-sm font-medium rounded-lg bg-green-100 text-green-800',
      'Ventas': 'px-3 py-1 text-sm font-medium rounded-lg bg-orange-100 text-orange-800',
      'Operaciones': 'px-3 py-1 text-sm font-medium rounded-lg bg-teal-100 text-teal-800',
      'Tecnología': 'px-3 py-1 text-sm font-medium rounded-lg bg-indigo-100 text-indigo-800',
      'Administración': 'px-3 py-1 text-sm font-medium rounded-lg bg-pink-100 text-pink-800',
      'Logística': 'px-3 py-1 text-sm font-medium rounded-lg bg-amber-100 text-amber-800',
      'Proyectos': 'px-3 py-1 text-sm font-medium rounded-lg bg-cyan-100 text-cyan-800',
      'Legal': 'px-3 py-1 text-sm font-medium rounded-lg bg-red-100 text-red-800'
    };
    
    return departamentosColores[departamento as keyof typeof departamentosColores] || 'px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-Mx', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openExportModal = () => {
    setShowExportModal(true);
  };

  // Estadísticas
  const autorizadas = solicitudes.filter(s => s.estado === 'autorizada');
  const rechazadas = solicitudes.filter(s => s.estado === 'rechazada');
  //const totalAprobado = autorizadas.reduce((sum, s) => sum + s.monto, 0);
  //const totalRechazado = rechazadas.reduce((sum, s) => sum + s.monto, 0);

  // Nuevo: búsqueda rápida
  const [search] = useState('');
  const quickFilteredSolicitudes = solicitudesOrdenadas.filter(s =>
    s.usuario_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    s.departamento?.toLowerCase().includes(search.toLowerCase()) ||
    s.estado?.toLowerCase().includes(search.toLowerCase())
  );

  // Nuevo: filtrar por rango de fechas
  // ...puedes agregar un filtro avanzado con datepicker si lo deseas...

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Historial de Solicitudes
                </h2>
                <p className="text-white/80">
                  Total: {totalItems} solicitudes procesadas
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 w-full">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 flex items-center min-w-0">
              <div className="p-3 rounded-full bg-white/20 flex-shrink-0">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">Total Procesadas</p>
                <p className="text-2xl font-bold text-white truncate">{solicitudes.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 flex items-center min-w-0">
              <div className="p-3 rounded-full bg-green-500/20 flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-300" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">Aprobadas</p>
                <p className="text-2xl font-bold text-white truncate">{autorizadas.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 flex items-center min-w-0">
              <div className="p-3 rounded-full bg-red-500/20 flex-shrink-0">
                <XCircle className="w-8 h-8 text-red-300" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">Rechazadas</p>
                <p className="text-2xl font-bold text-white truncate">{rechazadas.length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/15 rounded-xl p-4 mb-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onExport={() => openExportModal()}
              onReset={resetFilters}
              type="solicitudes"
            />
          </div>

          {/* Solicitudes Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Solicitudes Procesadas
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Cargando solicitudes...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  {quickFilteredSolicitudes.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay solicitudes procesadas</p>
                      <p className="text-gray-400">Aún no has procesado ninguna solicitud</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="sticky top-0 z-10" style={{backgroundColor: '#F0F4FC'}}>
                            <tr>
                              <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Hora Envío</th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('fecha_creacion')}
                              >
                                <div className="flex items-center gap-2">
                                  Fecha Envío
                                  {getSortIcon('fecha_creacion')}
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('folio')}
                              >
                                <div className="flex items-center gap-2">
                                  Folio
                                  {getSortIcon('folio')}
                                </div>
                              </th>
                              <th 
                                className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('usuario')}
                              >
                                <div className="flex items-center gap-2">
                                  Usuario
                                  {getSortIcon('usuario')}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('departamento')}
                              >
                                <div className="flex items-center gap-2">
                                  Departamento
                                  {getSortIcon('departamento')}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('monto')}
                              >
                                <div className="flex items-center gap-2">
                                  Monto
                                  {getSortIcon('monto')}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('estado')}
                              >
                                <div className="flex items-center gap-2">
                                  Estado
                                  {getSortIcon('estado')}
                                </div>
                              </th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('fecha_revision')}
                              >
                                <div className="flex items-center gap-2">
                                  Fecha Revisión
                                  {getSortIcon('fecha_revision')}
                                </div>
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Hora Revisión</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Tipo de Cuenta/Tarjeta</th>
                              <th 
                                className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => handleSort('banco_destino')}
                              >
                                <div className="flex items-center gap-2">
                                  Banco Destino
                                  {getSortIcon('banco_destino')}
                                </div>
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Detalles</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quickFilteredSolicitudes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((solicitud) => {
                              let estadoLabel = '';
                              let estadoIcon = null;
                              let rowClass = '';
                              if (solicitud.estado === 'autorizada') {
                                estadoLabel = 'Aprobada';
                                estadoIcon = <CheckCircle className="w-4 h-4 mr-1 text-green-500 inline" />;
                                rowClass = 'border-l-4 border-green-500 bg-green-50/10';
                              } else if (solicitud.estado === 'rechazada') {
                                estadoLabel = 'Rechazada';
                                estadoIcon = <XCircle className="w-4 h-4 mr-1 text-red-500 inline" />;
                                rowClass = 'border-l-4 border-red-500 bg-red-50/10';
                              } else if (solicitud.estado === 'pagada') {
                                estadoLabel = 'Pagada';
                                estadoIcon = <CheckCircle className="w-4 h-4 mr-1 text-blue-500 inline" />;
                                rowClass = 'border-l-4 border-blue-500 bg-blue-50/10';
                              }
                              return (
                                <tr key={solicitud.id_solicitud} className={`hover:bg-gray-50 transition-colors ${rowClass}`}>
                                  <td className="px-4 py-3 font-mono text-black text-sm">
                                    {solicitud.id_solicitud}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {solicitud.fecha_creacion ? formatDateTime(solicitud.fecha_creacion).time : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {solicitud.fecha_creacion ? formatDateTime(solicitud.fecha_creacion).date : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-black text-sm">
                                    {solicitud.folio || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-black text-sm">
                                    {solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={getDepartmentColorClass(solicitud.departamento)}>
                                      {solicitud.departamento}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(solicitud.monto)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(solicitud.estado)} mr-2`}>
                                      {estadoIcon}
                                      {estadoLabel}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {solicitud.fecha_revision ? formatDateTime(solicitud.fecha_revision).date : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {solicitud.fecha_revision ? formatDateTime(solicitud.fecha_revision).time : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {solicitud.tipo_cuenta_destino ? solicitud.tipo_cuenta_destino : ''}
                                    {solicitud.tipo_tarjeta ? ` / ${solicitud.tipo_tarjeta}` : ''}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {solicitud.banco_destino || ''}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewDetail(solicitud)}
                                      style={{color: '#3B82F6', borderColor: '#3B82F6'}}
                                      className="hover:bg-blue-50"
                                    >
                                      <Eye className="w-4 h-4 mr-2" /> Ver
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{backgroundColor: '#F0F4FC'}} className="px-6 py-4">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={quickFilteredSolicitudes.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={goToPage}
                          onItemsPerPageChange={changeItemsPerPage}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedSolicitud && (
          <SolicitudDetailModal
            solicitud={selectedSolicitud}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            showActions={false}
            userRole="aprobador"
          />
        )}

        {/* Export Options Modal */}
        <ExportOptionsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          itemCount={filteredSolicitudes.length}
        />
      </AprobadorLayout>
    </ProtectedRoute>
  );
}
