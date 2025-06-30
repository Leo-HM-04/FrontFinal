'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CheckCircle, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'react-hot-toast';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import { ComprobanteViewModal } from '@/components/pagos/ComprobanteViewModal';
import { PagoProcesado, exportPagosToCSV, exportPagosToExcel, exportPagosToPDF } from '@/utils/exportUtils';
import { usePagosProcesados } from '@/hooks/usePagos';
import { descargarComprobante } from '@/services/pagos.service';

export default function HistorialPagosPage() {
  // Estado para modales
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoProcesado | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Obtener datos de pagos procesados
  const { pagos: pagosHistorial, loading } = usePagosProcesados();

  // Estado para filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    departamento: '',
    fechaDesde: '',
    fechaHasta: '',
    montoMin: undefined as number | undefined,
    montoMax: undefined as number | undefined,
  });

  // Filtrar pagos según los criterios
  const filteredPagos = pagosHistorial.filter((pago) => {
    // Filtro de búsqueda general
    const searchFilter = !filters.search || 
      pago.solicitante.toLowerCase().includes(filters.search.toLowerCase()) ||
      pago.concepto.toLowerCase().includes(filters.search.toLowerCase()) ||
      pago.departamento.toLowerCase().includes(filters.search.toLowerCase());
    
    // Filtro de departamento
    const departamentoFilter = !filters.departamento || 
      pago.departamento === filters.departamento;
    
    // Filtros de fechas
    const fechaDesdeFilter = !filters.fechaDesde || 
      new Date(pago.fecha_pago) >= new Date(filters.fechaDesde);
    
    const fechaHastaFilter = !filters.fechaHasta || 
      new Date(pago.fecha_pago) <= new Date(filters.fechaHasta);
    
    // Filtros de monto
    const montoMinFilter = !filters.montoMin || 
      pago.monto >= filters.montoMin;
    
    const montoMaxFilter = !filters.montoMax || 
      pago.monto <= filters.montoMax;
    
    return searchFilter && departamentoFilter && fechaDesdeFilter && 
      fechaHastaFilter && montoMinFilter && montoMaxFilter;
  });

  // Configuración de paginación
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedPagos,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredPagos, initialItemsPerPage: 10 });

  // Handlers para modales y acciones
  const handleViewDetail = (pago: PagoProcesado) => {
    setSelectedPago(pago);
    setShowDetailModal(true);
  };

  const handleViewComprobante = (pago: PagoProcesado) => {
    // Verificar que el pago tenga un comprobante
    if (!pago.comprobante_id) {
      toast.error('Este pago no tiene un comprobante disponible.');
      return;
    }
    setSelectedPago(pago);
    setShowComprobanteModal(true);
  };
  
  const handleDownloadComprobante = async (pago: PagoProcesado) => {
    if (!pago.comprobante_id) {
      toast.error('Este pago no tiene un comprobante disponible.');
      return;
    }
    
    try {
      setIsLoading(true);
      const resultado = await descargarComprobante(pago);
      if (resultado) {
        toast.success('Comprobante descargado correctamente');
      } else {
        toast.error('No se pudo descargar el comprobante');
      }
    } catch (error) {
      console.error('Error descargando comprobante:', error);
      toast.error('Error al descargar el comprobante');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      estado: '',
      departamento: '',
      fechaDesde: '',
      fechaHasta: '',
      montoMin: undefined,
      montoMax: undefined,
    });
  };

  const handleExport = async (format: string) => {
    setIsLoading(true);
    try {
      // Agregar un retraso mínimo para mejor UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Realizar la exportación según el formato seleccionado
      switch(format) {
        case 'csv':
          exportPagosToCSV(filteredPagos);
          break;
        case 'excel':
          exportPagosToExcel(filteredPagos);
          break;
        case 'pdf':
          exportPagosToPDF(filteredPagos);
          break;
      }
      
      toast.success(`${filteredPagos.length} pagos exportados a ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al exportar pagos');
      console.error('Error exportando pagos:', error);
    } finally {
      setShowExportModal(false);
      setIsLoading(false);
    }
  };

  // Función para asignar colores a los departamentos
  const getDepartmentColorClass = (departamento: string): string => {
    const departamentosColores: Record<string, string> = {
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

  // Formatear moneda colombiana
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Abrir modal de exportación
  const openExportModal = () => {
    setShowExportModal(true);
  };

  // Calcular estadísticas para las tarjetas
  const totalPagado = pagosHistorial.reduce((sum, p) => sum + p.monto, 0);
  const pagosPorDepartamento: Record<string, number> = pagosHistorial.reduce((acc: Record<string, number>, p) => {
    acc[p.departamento] = (acc[p.departamento] || 0) + 1;
    return acc;
  }, {});
  const departamentoMasPagos = Object.entries(pagosPorDepartamento).length > 0 
    ? Object.entries(pagosPorDepartamento).sort((a, b) => b[1] - a[1])[0] 
    : ['N/A', 0];

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Historial de Pagos
                </h2>
                <p className="text-white/80">
                  Registro de {filteredPagos.length} pagos procesados
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
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Pagos Realizados</p>
                  <p className="text-2xl font-bold text-white">{pagosHistorial.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Calendar className="w-8 h-8 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Pagado</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(totalPagado)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Clock className="w-8 h-8 text-purple-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Departamento con más pagos</p>
                  <p className="text-2xl font-bold text-white">
                    {departamentoMasPagos?.[0]}
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
              type="pagosHistorial"
            />
          </div>

          {/* Pagos Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Historial de Pagos Procesados
              </h3>
              
              <div className="bg-white rounded-xl overflow-hidden">
                {paginatedPagos.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay pagos procesados que coincidan con los filtros</p>
                    <Button 
                      onClick={resetFilters}
                      className="mt-4 bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead style={{backgroundColor: '#F0F4FC'}}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID Pago
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Solicitante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Departamento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Concepto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Pago
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
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
                                {pago.concepto.length > 25 ? `${pago.concepto.substring(0, 25)}...` : pago.concepto}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(pago.monto)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(pago.fecha_pago).toLocaleDateString('es-CO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Completado
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
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewComprobante(pago)}
                                    style={{color: '#10B981', borderColor: '#10B981'}}
                                    className="hover:bg-green-50"
                                    disabled={!pago.comprobante_id}
                                  >
                                    {!pago.comprobante_id ? (
                                      <>
                                        <AlertCircle className="w-4 h-4 mr-1" /> No disponible
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-4 h-4 mr-1" /> Comprobante
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

        {/* Modal de opciones de exportación */}
        {showExportModal && (
          <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setShowExportModal(false)}
              aria-hidden="true"
            />
            <div 
              className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 z-[10000] animate-slide-up"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <button 
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-500" 
                onClick={() => setShowExportModal(false)}
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <FileText className="h-10 w-10 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center" id="modal-title">Exportar datos</h3>
              <p className="text-gray-600 mb-6 text-center">Exportar {filteredPagos.length} pagos encontrados</p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => handleExport('csv')}
                  disabled={isLoading}
                  className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>Exportar a CSV</>
                  )}
                </Button>
                
                <Button 
                  onClick={() => handleExport('excel')}
                  disabled={isLoading}
                  className="w-full justify-center bg-green-50 text-green-600 hover:bg-green-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>Exportar a Excel</>
                  )}
                </Button>
                
                <Button 
                  onClick={() => handleExport('pdf')}
                  disabled={isLoading}
                  className="w-full justify-center bg-red-50 text-red-600 hover:bg-red-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>Exportar a PDF</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modales para visualización de detalles y comprobantes */}
        <PagoDetailModal 
          isOpen={showDetailModal}
          pago={selectedPago}
          onClose={() => setShowDetailModal(false)}
        />
        
        <ComprobanteViewModal 
          isOpen={showComprobanteModal}
          pago={selectedPago}
          onClose={() => setShowComprobanteModal(false)}
        />
      </PagadorLayout>
    </ProtectedRoute>
  );
}
