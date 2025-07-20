'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CheckCircle, XCircle, Download, Search } from 'lucide-react';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { exportSolicitudesToCSV, exportSolicitudesToExcel, exportSolicitudesToPDF } from '@/utils/exportUtils';
import { toast } from 'react-hot-toast';
import { SolicitudesService } from '@/services/solicitudes.service';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { ExportOptionsModal } from '@/components/solicitudes/ExportOptionsModal';
import Modal from '../../../../../components/ui/Modal';
import { Solicitud } from '@/types';

export default function SolicitudesPendientesPage() {
  
  const { solicitudes: allSolicitudes, loading, fetchSolicitudes } = useSolicitudes();
  // Filtrar solo las solicitudes pendientes
  const solicitudes = allSolicitudes.filter(s => s.estado === 'pendiente');

  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; solicitud: Solicitud | null; action: 'approve' | 'reject' | null }>({ open: false, solicitud: null, action: null });

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
    goToPage,
  } = usePagination({ data: filteredSolicitudes, initialItemsPerPage: 5 });

  // Ordenar todas por urgencia y fecha límite de pago (más urgentes y próximas primero)
  const tresDiasDespues = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000);
  const todasOrdenadas = filteredSolicitudes
    .slice()
    .sort((a, b) => {
      const fechaA = new Date(a.fecha_limite_pago).getTime();
      const fechaB = new Date(b.fecha_limite_pago).getTime();
      const esUrgenteA = fechaA < tresDiasDespues.getTime();
      const esUrgenteB = fechaB < tresDiasDespues.getTime();
      if (esUrgenteA && !esUrgenteB) return -1;
      if (!esUrgenteA && esUrgenteB) return 1;
      return fechaA - fechaB;
    });

  // Aplicar paginación después de ordenar
  const paginadas = todasOrdenadas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewDetail = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowDetailModal(true);
  };

  const openExportModal = () => {
    setShowExportModal(true);
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

  const handleApprove = async (id: number, comentario?: string) => {
    try {
      setActionLoading(true);
      await SolicitudesService.updateEstado(id, {
        estado: 'autorizada',
        comentario_aprobador: comentario || 'Solicitud aprobada'
      });
      toast.success('La solicitud ha sido aprobada correctamente');
      setShowDetailModal(false);
      fetchSolicitudes();
    } catch (error) {
      console.error('Error al aprobar la solicitud:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number, comentario?: string) => {
    try {
      setActionLoading(true);
      await SolicitudesService.updateEstado(id, {
        estado: 'rechazada',
        comentario_aprobador: comentario || 'Solicitud rechazada'
      });
      toast.success('La solicitud ha sido rechazada');
      setShowDetailModal(false);
      fetchSolicitudes();
    } catch (error) {
      console.error('Error al rechazar la solicitud:', error);
      toast.error('Error al rechazar la solicitud');
    } finally {
      setActionLoading(false);
    }
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

  // Nuevo: abrir modal de confirmación
  const openConfirmModal = (solicitud: Solicitud, action: 'approve' | 'reject') => {
    setConfirmModal({ open: true, solicitud, action });
  };

  // Nuevo: cerrar modal de confirmación
  const closeConfirmModal = () => {
    setConfirmModal({ open: false, solicitud: null, action: null });
  };

  // Nuevo: confirmar acción
  const confirmAction = async () => {
    if (!confirmModal.solicitud || !confirmModal.action) return;
    if (confirmModal.action === 'approve') {
      await handleApprove(confirmModal.solicitud.id_solicitud);
    } else {
      await handleReject(confirmModal.solicitud.id_solicitud);
    }
    closeConfirmModal();
  };

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Solicitudes Pendientes
                </h2>
                <p className="text-white/80">
                  Total: {totalItems} solicitudes por revisar
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-end md:items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o departamento..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <Search className="absolute left-2 top-2.5 w-5 h-5 text-white/60" />
                </div>
                <Button
                  onClick={openExportModal}
                  className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25"
                >
                  <Download className="w-4 h-4 mr-2" /> Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros activos */}
          {Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).map(([key, value]) => (
                value ? (
                  <span key={key} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs flex items-center">
                    {key}: {String(value)}
                    <button
                      className="ml-2 text-blue-600 hover:text-blue-900"
                      onClick={() => updateFilters({ ...filters, [key as keyof typeof filters]: '' })}
                    >
                      ×
                    </button>
                  </span>
                ) : null
              ))}
              <button
                className="ml-2 text-red-600 hover:text-red-900 text-xs underline"
                onClick={resetFilters}
              >
                Limpiar todos
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-white/20">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Pendientes</p>
                  <p className="text-2xl font-bold text-white">{solicitudes.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <FileText className="w-8 h-8 text-yellow-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Urgentes</p>
                  <p className="text-2xl font-bold text-white">
                    {solicitudes.filter(s => new Date(s.fecha_limite_pago) < new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Procesadas Hoy</p>
                  <p className="text-2xl font-bold text-white">
                    {allSolicitudes.filter(s => 
                      s.fecha_revision && 
                      new Date(s.fecha_revision).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
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
                Lista de Solicitudes Pendientes (más urgentes y próximas primero)
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Cargando solicitudes...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  {todasOrdenadas.length === 0 ? (
                    <div className="py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay solicitudes pendientes</p>
                      <p className="text-gray-400">Todas las solicitudes han sido procesadas</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead style={{backgroundColor: '#F0F4FC'}}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Límite</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginadas.map((solicitud) => {
                            const isUrgent = new Date(solicitud.fecha_limite_pago) < tresDiasDespues;
                            return (
                              <tr key={solicitud.id_solicitud} className={`hover:bg-gray-50 transition-colors ${isUrgent ? 'border-l-4 border-red-500 bg-red-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {solicitud.usuario_nombre || `${solicitud.id_usuario}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getDepartmentColorClass(solicitud.departamento)}>
                                    {solicitud.departamento}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(solicitud.monto)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isUrgent ? 'text-red-600 font-bold' : 'text-gray-900'}`}> 
                                  {new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-CO')}
                                  {isUrgent && <span className="text-xs font-bold text-red-600 ml-2">¡Urgente!</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleViewDetail(solicitud)} style={{ color: '#3B82F6', borderColor: '#3B82F6' }} className="hover:bg-blue-50"><Eye className="w-4 h-4 mr-1" /> Ver</Button>
                                    <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => openConfirmModal(solicitud, 'approve')} style={{ color: '#16A34A', borderColor: '#16A34A' }} className="hover:bg-green-50 flex items-center">{actionLoading ? (<span className="loader border-green-500 mr-2"></span>) : (<CheckCircle className="w-4 h-4 mr-1" />)}Aprobar</Button>
                                    <Button variant="outline" size="sm" disabled={actionLoading} onClick={() => openConfirmModal(solicitud, 'reject')} style={{ color: '#DC2626', borderColor: '#DC2626' }} className="hover:bg-red-50 flex items-center">{actionLoading ? (<span className="loader border-red-500 mr-2"></span>) : (<XCircle className="w-4 h-4 mr-1" />)}Rechazar</Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="w-full flex justify-center items-center py-4 bg-white/90 border-t border-gray-200">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          itemsPerPage={itemsPerPage}
                          onPageChange={goToPage}
                          showPageSizeSelector={false} // Oculta el selector de cantidad por página
                        />
                      </div>
                    </div>
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
          showActions={true}
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

        {/* Modal de confirmación para aprobar/rechazar */}
        {confirmModal.open && confirmModal.solicitud && (
          <Modal
            isOpen={confirmModal.open}
            title={confirmModal.action === 'approve' ? '¿Confirmar aprobación?' : '¿Confirmar rechazo?'}
            message={confirmModal.action === 'approve'
              ? 'Esta acción autorizará la solicitud y notificará al solicitante.'
              : 'Esta acción rechazará la solicitud y notificará al solicitante.'}
            warning={confirmModal.action === 'reject' ? 'Advertencia: Esta acción no se puede deshacer.' : undefined}
            confirmText={confirmModal.action === 'approve' ? 'Aprobar' : 'Rechazar'}
            cancelText="Cancelar"
            onConfirm={confirmAction}
            onCancel={closeConfirmModal}
          />
        )}
      </AprobadorLayout>
    </ProtectedRoute>
  );
}

// Si no existe Modal, crea un componente básico en src/components/ui/Modal.tsx:
// import React from 'react';
// export const Modal = ({ isOpen, onClose, children }) => isOpen ? (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//     <div className="bg-white rounded-xl shadow-lg p-6 min-w-[320px] relative">
//       <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={onClose}>×</button>
//       {children}
//     </div>
//   </div>
// ) : null;
