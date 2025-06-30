'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { FileText, Trash2, Edit, Eye } from 'lucide-react';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { exportSolicitudesToCSV } from '@/utils/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Solicitud } from '@/types';
import { toast } from 'react-hot-toast';

export default function SolicitudesPage() {
  const router = useRouter();
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user, logout } = useAuth();

  const { solicitudes, loading, deleteSolicitud } = useSolicitudes();

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

  const handleDelete = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSolicitud) return;

    setDeleting(true);
    try {
      await deleteSolicitud(selectedSolicitud.id_solicitud);
      setShowDeleteModal(false);
      setSelectedSolicitud(null);
      toast.success('Solicitud eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting solicitud:', error);
      toast.error('Error al eliminar la solicitud');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportSolicitudesToCSV(filteredSolicitudes);
    toast.success(`${filteredSolicitudes.length} solicitudes exportadas`);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      autorizada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Gestión de Solicitudes
                </h2>
                <p className="text-white/80">
                  Total: {totalItems} solicitudes
                </p>
              </div>
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
                  <p className="text-sm font-medium text-white/80">Total</p>
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
                  <p className="text-sm font-medium text-white/80">Pendientes</p>
                  <p className="text-2xl font-bold text-white">
                    {solicitudes.filter(s => s.estado === 'pendiente').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <FileText className="w-8 h-8 text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Autorizadas</p>
                  <p className="text-2xl font-bold text-white">
                    {solicitudes.filter(s => s.estado === 'autorizada').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-500/20">
                  <FileText className="w-8 h-8 text-red-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Rechazadas</p>
                  <p className="text-2xl font-bold text-white">
                    {solicitudes.filter(s => s.estado === 'rechazada').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 mb-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onExport={handleExport}
              onReset={resetFilters}
              type="solicitudes"
            />
          </div>

          {/* Solicitudes Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Lista de Solicitudes
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Cargando solicitudes...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead style={{backgroundColor: '#F0F4FC'}}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
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
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedSolicitudes.map((solicitud) => (
                          <tr key={solicitud.id_solicitud} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{solicitud.id_solicitud}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {solicitud.departamento}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(solicitud.monto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(solicitud.estado)}`}>
                                {solicitud.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/admin/solicitudes/${solicitud.id_solicitud}`)}
                                style={{color: '#3B82F6', borderColor: '#3B82F6'}}
                                className="hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/admin/solicitudes/${solicitud.id_solicitud}/edit`)}
                                style={{color: '#3B82F6', borderColor: '#3B82F6'}}
                                className="hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(solicitud)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Eliminar Solicitud"
            message="¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer."
            itemName={selectedSolicitud ? `Solicitud #${selectedSolicitud.id_solicitud} - ${selectedSolicitud.departamento}` : undefined}
            loading={deleting}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
