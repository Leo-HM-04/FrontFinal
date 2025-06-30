'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
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
  // Filtrar solo las solicitudes procesadas (autorizadas o rechazadas)
  const solicitudes = allSolicitudes.filter(s => s.estado !== 'pendiente');

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    filters,
    filteredData: filteredSolicitudes,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(solicitudes, 'solicitudes');

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedSolicitudes,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredSolicitudes, initialItemsPerPage: 10 });

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowDetailModal(true);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    switch(format) {
      case 'csv':
        exportSolicitudesToCSV(filteredSolicitudes);
        toast.success(`${filteredSolicitudes.length} solicitudes exportadas a CSV`);
        break;
      case 'excel':
        exportSolicitudesToExcel(filteredSolicitudes);
        toast.success(`${filteredSolicitudes.length} solicitudes exportadas a Excel`);
        break;
      case 'pdf':
        exportSolicitudesToPDF(filteredSolicitudes);
        toast.success(`${filteredSolicitudes.length} solicitudes exportadas a PDF`);
        break;
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      autorizada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openExportModal = () => {
    setShowExportModal(true);
  };

  // Estadísticas
  const autorizadas = solicitudes.filter(s => s.estado === 'autorizada');
  const rechazadas = solicitudes.filter(s => s.estado === 'rechazada');
  const totalAprobado = autorizadas.reduce((sum, s) => sum + s.monto, 0);

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Historial de Solicitudes
                </h2>
                <p className="text-white/80">
                  Total: {totalItems} solicitudes procesadas
                </p>
              </div>
              <Button
                onClick={openExportModal}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25"
              >
                <FileText className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/20">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Procesadas</p>
                  <p className="text-2xl font-bold text-white">{solicitudes.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Aprobadas</p>
                  <p className="text-2xl font-bold text-white">
                    {autorizadas.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-500/20">
                  <XCircle className="w-8 h-8 text-red-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Rechazadas</p>
                  <p className="text-2xl font-bold text-white">
                    {rechazadas.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <BarChart2 className="w-8 h-8 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Aprobado</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalAprobado)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/15 rounded-xl p-4 mb-6">              <AdvancedFilters
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
                  {paginatedSolicitudes.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay solicitudes procesadas</p>
                      <p className="text-gray-400">Aún no has procesado ninguna solicitud</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead style={{backgroundColor: '#F0F4FC'}}>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Solicitante
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Departamento
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Revisión
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Detalles
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedSolicitudes.map((solicitud) => (
                              <tr key={solicitud.id_solicitud} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(solicitud.estado)}`}>
                                    {solicitud.estado === 'autorizada' ? 'Aprobada' : 'Rechazada'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {solicitud.fecha_revision ? new Date(solicitud.fecha_revision).toLocaleDateString('es-CO') : '-'}
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{backgroundColor: '#F0F4FC'}} className="px-6 py-4">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
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
