'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CheckCircle, CreditCard, AlertCircle, Download } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { toast } from 'react-hot-toast';
import { exportSolicitudesToCSV, exportSolicitudesToExcel, exportSolicitudesToPDF } from '@/utils/exportUtils';
import { ExportOptionsModal } from '@/components/solicitudes/ExportOptionsModal';

// Datos de ejemplo para pagos pendientes
const pagosPendientes = [
  {
    id_pago: 1001,
    id_solicitud: 501,
    solicitante: 'Carlos López',
    departamento: 'Finanzas',
    monto: 2500000,
    concepto: 'Pago a proveedores',
    fecha_aprobacion: '2025-06-25',
    estado: 'pendiente',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '1234567890'
  },
  {
    id_pago: 1002,
    id_solicitud: 502,
    solicitante: 'Ana Martínez',
    departamento: 'Marketing',
    monto: 1800000,
    concepto: 'Campaña publicitaria',
    fecha_aprobacion: '2025-06-24',
    estado: 'pendiente',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Davivienda',
    cuenta_destino: '0987654321'
  },
  {
    id_pago: 1003,
    id_solicitud: 503,
    solicitante: 'Juan Gómez',
    departamento: 'Tecnología',
    monto: 3250000,
    concepto: 'Equipos informáticos',
    fecha_aprobacion: '2025-06-23',
    estado: 'pendiente',
    urgencia: 'baja',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Bogotá',
    cuenta_destino: '5678901234'
  }
];

export default function PagosPendientesPage() {
  const [selectedPago, setSelectedPago] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(null);

  const {
    filters,
    filteredData: filteredPagos,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(pagosPendientes, 'pagos');

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedPagos,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredPagos, initialItemsPerPage: 10 });

  const handleViewDetail = (pago) => {
    setSelectedPago(pago);
    setShowDetailModal(true);
  };

  const handleProcesarPago = (pago) => {
    setProcesandoPago(pago.id_pago);
    
    // Simulamos un procesamiento
    setTimeout(() => {
      toast.success(`Pago #${pago.id_pago} procesado correctamente`);
      setProcesandoPago(null);
    }, 1500);
  };

  const handleExport = (format) => {
    switch(format) {
      case 'csv':
        exportSolicitudesToCSV(filteredPagos);
        toast.success(`${filteredPagos.length} pagos exportados a CSV`);
        break;
      case 'excel':
        exportSolicitudesToExcel(filteredPagos);
        toast.success(`${filteredPagos.length} pagos exportados a Excel`);
        break;
      case 'pdf':
        exportSolicitudesToPDF(filteredPagos);
        toast.success(`${filteredPagos.length} pagos exportados a PDF`);
        break;
    }
  };

  const getUrgenciaColor = (urgencia) => {
    const colors = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800'
    };
    return colors[urgencia] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentColorClass = (departamento) => {
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
    
    return departamentosColores[departamento] || 'px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openExportModal = () => {
    setShowExportModal(true);
  };

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Pagos Pendientes
                </h2>
                <p className="text-white/80">
                  {filteredPagos.length} pagos pendientes de procesamiento
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <AlertCircle className="w-8 h-8 text-yellow-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Urgencia Alta</p>
                  <p className="text-2xl font-bold text-white">1</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <CreditCard className="w-8 h-8 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Pendiente</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(pagosPendientes.reduce((sum, p) => sum + p.monto, 0))}
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
                  <p className="text-sm font-medium text-white/80">Pagos Realizados</p>
                  <p className="text-2xl font-bold text-white">53</p>
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
              type="pagos"
            />
          </div>

          {/* Pagos Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Pagos Pendientes de Procesamiento
              </h3>
              
              <div className="bg-white rounded-xl overflow-hidden">
                {paginatedPagos.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay pagos pendientes</p>
                    <p className="text-gray-400">Todos los pagos han sido procesados</p>
                  </div>
                ) : (
                  <>
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
                              Fecha Aprobación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Urgencia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedPagos.map((pago) => (
                            <tr key={pago.id_pago} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{pago.id_pago}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pago.solicitante}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getDepartmentColorClass(pago.departamento)}>
                                  {pago.departamento}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(pago.monto)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(pago.fecha_aprobacion).toLocaleDateString('es-CO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgenciaColor(pago.urgencia)}`}>
                                  {pago.urgencia.charAt(0).toUpperCase() + pago.urgencia.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewDetail(pago)}
                                    style={{color: '#3B82F6', borderColor: '#3B82F6'}}
                                    className="hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleProcesarPago(pago)}
                                    disabled={procesandoPago === pago.id_pago}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {procesandoPago === pago.id_pago ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Procesando...
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="w-4 h-4 mr-1" /> Procesar
                                      </>
                                    )}
                                  </Button>
                                </div>
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
            </div>
          </div>
        </div>

        {/* Export Options Modal */}
        <ExportOptionsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          itemCount={filteredPagos.length}
        />
      </PagadorLayout>
    </ProtectedRoute>
  );
}
