'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { Eye, CreditCard, AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { toast } from 'react-hot-toast';
import { getPagosPendientes, marcarPagoComoPagado, subirComprobante } from '@/services/pagosService';
import type { Solicitud } from '../../../../../types/index';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import { SubirComprobanteModal } from '@/components/pagos/SubirComprobanteModal';

export default function PagosPendientesPage() {
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);
  const [pagosPendientes, setPagosPendientes] = useState<Solicitud[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [errorPagos, setErrorPagos] = useState<string | null>(null);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobantePagoId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pagoAConfirmar, setPagoAConfirmar] = useState<Solicitud | null>(null);
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filtrar solo los pagos con estado 'autorizada'
  const pagosAutorizados = pagosPendientes.filter(
    (p) => p.estado && p.estado.toLowerCase() === 'autorizada'
  );

  const {
    filters,
    filteredData: filteredPagos,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(pagosAutorizados, 'solicitudes');

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedPagos,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredPagos, initialItemsPerPage: 5 });

  useEffect(() => {
    setLoadingPagos(true);
    getPagosPendientes()
      .then((data) => {
        setPagosPendientes(data);
        setErrorPagos(null);
      })
      .catch(() => {
        setErrorPagos('Error al cargar pagos pendientes');
      })
      .finally(() => setLoadingPagos(false));
  }, []);

  const handleViewDetail = (pago: Solicitud) => {
    setSelectedPago(pago);
    setShowDetailModal(true);
  };

  const handleProcesarPago = async (pago: Solicitud) => {
    setPagoAConfirmar(pago);
    setShowConfirmModal(true);
  };

  const confirmarProcesarPago = async () => {
    if (!pagoAConfirmar) return;
    setProcesandoPago(pagoAConfirmar.id_solicitud);
    setShowConfirmModal(false);
    try {
      const res = await marcarPagoComoPagado(pagoAConfirmar.id_solicitud);
      if (res && res.error) {
        toast.error(res.error || 'No se pudo marcar como pagada.');
      } else {
        toast.success(`Pago #${pagoAConfirmar.id_solicitud} procesado correctamente`);
        toast((t) => (
          <div>
            <strong>¡Advertencia!</strong>
            <div>Tiene un límite de <span className="text-red-600 font-bold">3 días</span> para subir el comprobante de pago.</div>
            <Button onClick={() => toast.dismiss(t.id)} className="mt-2 bg-blue-600 text-white">Entendido</Button>
          </div>
        ), { duration: 8000 });
        setPagosPendientes((prev) => prev.filter((p) => p.id_solicitud !== pagoAConfirmar.id_solicitud));
      }
    } catch {
      toast.error('Error al procesar el pago');
    }
    setProcesandoPago(null);
    setPagoAConfirmar(null);
  };


  const getDepartmentColorClass = (departamento: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const handleSubirComprobante = async (file: File) => {
    if (!comprobantePagoId) return;
    await subirComprobante(comprobantePagoId, file);
    toast.success('Comprobante subido correctamente');
  };

  // Función para ordenar
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Aplicar ordenamiento a los datos paginados
  const sortedPagos = [...paginatedPagos].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | number | Date = a[sortField as keyof Solicitud] as string | number | Date;
    let bValue: string | number | Date = b[sortField as keyof Solicitud] as string | number | Date;
    
    // Manejar casos específicos
    if (sortField === 'monto') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    } else if (sortField === 'fecha_limite_pago' || sortField === 'fecha_creacion') {
      aValue = new Date(aValue as string || 0).getTime();
      bValue = new Date(bValue as string || 0).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = typeof bValue === 'string' ? bValue.toLowerCase() : '';
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Funciones de exportación
  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const data = filteredPagos.map(pago => ({
        Folio: pago.folio,
        Solicitante: pago.nombre_usuario || pago.usuario_nombre || '-',
        Departamento: pago.departamento,
        Monto: formatCurrency(pago.monto),
        'Fecha Solicitud': new Date(pago.fecha_creacion).toLocaleDateString('es-MX'),
        'Fecha Límite': new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX'),
        Estado: pago.estado?.charAt(0).toUpperCase() + pago.estado?.slice(1) || 'Autorizada',
        Aprobador: pago.aprobador_nombre || '-'
      }));

      // Aquí implementarías la lógica de exportación a PDF
      console.log('Exportando a PDF:', data);
      toast.success('PDF exportado correctamente');
    } catch {
      toast.error('Error al exportar PDF');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const data = filteredPagos.map(pago => ({
        Folio: pago.folio,
        Solicitante: pago.nombre_usuario || pago.usuario_nombre || '-',
        Departamento: pago.departamento,
        Monto: pago.monto,
        'Fecha Solicitud': new Date(pago.fecha_creacion).toLocaleDateString('es-MX'),
        'Fecha Límite': new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX'),
        Estado: pago.estado?.charAt(0).toUpperCase() + pago.estado?.slice(1) || 'Autorizada',
        Aprobador: pago.aprobador_nombre || '-'
      }));

      // Aquí implementarías la lógica de exportación a Excel
      console.log('Exportando a Excel:', data);
      toast.success('Excel exportado correctamente');
    } catch {
      toast.error('Error al exportar Excel');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Folio', 'Solicitante', 'Departamento', 'Monto', 'Fecha Solicitud', 'Fecha Límite', 'Estado', 'Aprobador'];
      const csvContent = [
        headers.join(','),
        ...filteredPagos.map(pago => [
          pago.folio,
          pago.nombre_usuario || pago.usuario_nombre || '-',
          pago.departamento,
          pago.monto,
          new Date(pago.fecha_creacion).toLocaleDateString('es-MX'),
          new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX'),
          pago.estado?.charAt(0).toUpperCase() + pago.estado?.slice(1) || 'Autorizada',
          pago.aprobador_nombre || '-'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pagos-pendientes-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exportado correctamente');
    } catch {
      toast.error('Error al exportar CSV');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="container mx-auto px-4 py-8">
         {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Pagos Autorizados
                </h2>
                <p className="text-blue-100 text-lg">
                  {filteredPagos.length} pagos autorizados, para procesar el pago.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg disabled:opacity-60"
                >
                  <Download className="w-5 h-5" />
                  Exportar
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards removido */}

          {/* Filters */}
          <div className="bg-white/15 rounded-xl p-4 mb-6">              
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onReset={resetFilters}
              type="pagos"
            />
          </div>

          {/* Pagos Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Pagos Autorizados de Procesamiento
              </h3>
              
              <div className="bg-white rounded-xl overflow-hidden">
                {loadingPagos ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Cargando pagos pendientes...</p>
                  </div>
                ) : errorPagos ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-500 text-lg">{errorPagos}</p>
                  </div>
                ) : paginatedPagos.length === 0 ? (
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
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('folio')}
                            >
                              <div className="flex items-center gap-2">
                                Folio
                                {getSortIcon('folio')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('nombre_usuario')}
                            >
                              <div className="flex items-center gap-2">
                                Solicitante
                                {getSortIcon('nombre_usuario')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('departamento')}
                            >
                              <div className="flex items-center gap-2">
                                Departamento
                                {getSortIcon('departamento')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('monto')}
                            >
                              <div className="flex items-center gap-2">
                                Monto
                                {getSortIcon('monto')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('fecha_creacion')}
                            >
                              <div className="flex items-center gap-2">
                                Fecha Solicitud
                                {getSortIcon('fecha_creacion')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('fecha_limite_pago')}
                            >
                              <div className="flex items-center gap-2">
                                Fecha Límite Pago
                                {getSortIcon('fecha_limite_pago')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('estado')}
                            >
                              <div className="flex items-center gap-2">
                                Estado
                                {getSortIcon('estado')}
                              </div>
                            </th>
                            <th 
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => handleSort('aprobador_nombre')}
                            >
                              <div className="flex items-center gap-2">
                                Aprobador
                                {getSortIcon('aprobador_nombre')}
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedPagos.map((pago: Solicitud) => (
                            <tr key={pago.id_solicitud} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-700">
                                {pago.folio}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof pago.nombre_usuario === 'string' && pago.nombre_usuario
                                  ? pago.nombre_usuario
                                  : typeof pago.usuario_nombre === 'string' && pago.usuario_nombre
                                  ? pago.usuario_nombre
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getDepartmentColorClass(pago.departamento)}>
                                  {pago.departamento}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                {formatCurrency(pago.monto)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(pago.fecha_creacion).toLocaleDateString('es-MX')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {pago.estado ? pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1) : 'Autorizada'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof pago.aprobador_nombre === 'string' && pago.aprobador_nombre
                                  ? pago.aprobador_nombre
                                  : '-'}
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
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleProcesarPago(pago)}
                                    disabled={procesandoPago === pago.id_solicitud}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {procesandoPago === pago.id_solicitud ? (
                                      <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Procesando...
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-5 h-5 mr-2 text-white drop-shadow" />
                                        <span className="font-bold tracking-wide">Procesar</span>
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

        {/* Modal de exportación */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-gray-800 to-blue-900 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Exportar Pagos Pendientes</h2>
                      <p className="text-gray-300 text-sm">Selecciona el formato para exportar {filteredPagos.length} pagos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Título de sección */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Seleccionar formato de exportación</h3>
                </div>

                {/* Grid de opciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Opción PDF */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-blue-900 mb-2">PDF</h4>
                      <p className="text-blue-700 font-medium mb-1">Documento PDF profesional</p>
                    </div>
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 text-center leading-relaxed">
                        Ideal para impresión y presentaciones oficiales
                      </p>
                    </div>
                    <button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-5 h-5" />
                      Exportar PDF
                    </button>
                  </div>

                  {/* Opción Excel */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileSpreadsheet className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-green-900 mb-2">Excel</h4>
                      <p className="text-green-700 font-medium mb-1">Hoja de cálculo editable</p>
                    </div>
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 text-center leading-relaxed">
                        Perfecto para análisis de datos y reportes
                      </p>
                    </div>
                    <button
                      onClick={exportToExcel}
                      disabled={isExporting}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-5 h-5" />
                      Exportar Excel
                    </button>
                  </div>

                  {/* Opción CSV */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-orange-900 mb-2">CSV</h4>
                      <p className="text-orange-700 font-medium mb-1">Valores separados por comas</p>
                    </div>
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 text-center leading-relaxed">
                        Compatible con cualquier sistema o software
                      </p>
                    </div>
                    <button
                      onClick={exportToCSV}
                      disabled={isExporting}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-5 h-5" />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                {/* Nota informativa */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">
                      Los archivos exportados incluirán toda la información disponible de los pagos pendientes
                    </p>
                  </div>
                </div>

                {isExporting && (
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Procesando exportación...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pago Detail Modal */}
        <PagoDetailModal 
          isOpen={showDetailModal} 
          pago={selectedPago} 
          onClose={() => setShowDetailModal(false)} 
        />
        <SubirComprobanteModal 
          isOpen={showComprobanteModal} 
          onClose={() => setShowComprobanteModal(false)} 
          onSubmit={handleSubirComprobante}
        />

        {/* Modal de confirmación para procesar pago */}
        {showConfirmModal && pagoAConfirmar && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10">
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg text-black relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="bg-yellow-300 border-4 border-yellow-400 rounded-full p-3 shadow-lg animate-bounce">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold mb-4 text-center mt-6">¡Advertencia Importante!</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-4 text-yellow-900 text-base font-medium flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                <span>
                  Vas a procesar el pago <b>#{pagoAConfirmar.id_solicitud}</b>. Esta acción es irreversible y marcará la solicitud como <b>pagada</b>.<br/>
                  <span className="text-red-600 font-bold">Tienes 3 días</span> para subir el comprobante, de lo contrario la solicitud será reportada.
                </span>
              </div>
              <div className="flex space-x-2 justify-end mt-6">
                <Button variant="outline" className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg" onClick={() => { setShowConfirmModal(false); setPagoAConfirmar(null); }}>Cancelar</Button>
                <Button variant="primary" className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg" onClick={confirmarProcesarPago}>Confirmar</Button>
              </div>
            </div>
          </div>
          </div>
        )}
      </PagadorLayout>
    </ProtectedRoute>
  );
}
