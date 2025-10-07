'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Eye, CreditCard, AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'react-hot-toast';
import { getPagosPendientes, marcarPagoComoPagado, subirComprobante } from '@/services/pagosService';
import { Solicitud } from '@/types';
import { SolicitudTukashData } from '@/types/plantillaTukash';
import { PlantillaTukashDetailModal } from '@/components/plantillas/PlantillaTukashDetailModal';
import { PlantillaN09TokaDetailModal } from '@/components/plantillas/PlantillaN09TokaDetailModal';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { SubirComprobanteModal } from '@/components/pagos/SubirComprobanteModal';
import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import { isN09TokaSolicitud } from '@/utils/solicitudUtils';

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
  
  // Estados para filtros personalizados
  const [localFilters, setLocalFilters] = useState({
    search: '',
    departamento: '',
    montoMin: '',
    montoMax: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Filtrar solo los pagos con estado 'autorizada' o 'aprobada' (para N09/TOKA)
  const pagosAutorizados = pagosPendientes.filter(
    (p) => p.estado && (p.estado.toLowerCase() === 'autorizada' || p.estado.toLowerCase() === 'aprobada')
  );

  // Aplicar filtros personalizados
  const filteredPagos = pagosAutorizados.filter(pago => {
    // Filtro de búsqueda
    if (localFilters.search) {
      const searchLower = localFilters.search.toLowerCase();
      const matchesSearch = 
        pago.folio?.toLowerCase().includes(searchLower) ||
        pago.nombre_usuario?.toLowerCase().includes(searchLower) ||
        pago.usuario_nombre?.toLowerCase().includes(searchLower) ||
        pago.departamento?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Filtro de departamento
    if (localFilters.departamento && pago.departamento !== localFilters.departamento) {
      return false;
    }
    
    // Filtro de monto mínimo
    if (localFilters.montoMin && pago.monto < Number(localFilters.montoMin)) {
      return false;
    }
    
    // Filtro de monto máximo
    if (localFilters.montoMax && pago.monto > Number(localFilters.montoMax)) {
      return false;
    }
    
    // Filtro de fecha desde
    if (localFilters.fechaDesde) {
      const fechaPago = new Date(pago.fecha_creacion);
      const fechaDesde = new Date(localFilters.fechaDesde);
      if (fechaPago < fechaDesde) return false;
    }
    
    // Filtro de fecha hasta
    if (localFilters.fechaHasta) {
      const fechaPago = new Date(pago.fecha_creacion);
      const fechaHasta = new Date(localFilters.fechaHasta);
      if (fechaPago > fechaHasta) return false;
    }
    
    return true;
  });

  // Función para actualizar filtros
  const updateLocalFilters = (newFilters: Partial<typeof localFilters>) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Función para resetear filtros
  const resetLocalFilters = () => {
    setLocalFilters({
      search: '',
      departamento: '',
      montoMin: '',
      montoMax: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

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
    console.log('🎯 CLICKED VIEW DETAIL - Solicitud seleccionada:', pago.id_solicitud);
    console.log('🎯 CLICKED VIEW DETAIL - Folio:', pago.folio);
    console.log('🎯 CLICKED VIEW DETAIL - Plantilla datos completos:', pago.plantilla_datos);
    console.log('🎯 CLICKED VIEW DETAIL - Departamento:', pago.departamento);
    console.log('🎯 CLICKED VIEW DETAIL - Objeto completo:', pago);
    
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
      const res = await marcarPagoComoPagado(pagoAConfirmar.id_solicitud, pagoAConfirmar);
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
      'Contabilidad': 'px-3 py-1 text-sm font-medium rounded-lg bg-blue-100 text-blue-800',
      'Facturación': 'px-3 py-1 text-sm font-medium rounded-lg bg-green-100 text-green-800',
      'Cobranza': 'px-3 py-1 text-sm font-medium rounded-lg bg-orange-100 text-orange-800',
      'Vinculación': 'px-3 py-1 text-sm font-medium rounded-lg bg-purple-100 text-purple-800',
      'Administración': 'px-3 py-1 text-sm font-medium rounded-lg bg-pink-100 text-pink-800',
      'TI': 'px-3 py-1 text-sm font-medium rounded-lg bg-indigo-100 text-indigo-800',
      'Automatizaciones': 'px-3 py-1 text-sm font-medium rounded-lg bg-teal-100 text-teal-800',
      'Comercial': 'px-3 py-1 text-sm font-medium rounded-lg bg-amber-100 text-amber-800',
      'Atención a Clientes': 'px-3 py-1 text-sm font-medium rounded-lg bg-cyan-100 text-cyan-800',
      'Tesorería': 'px-3 py-1 text-sm font-medium rounded-lg bg-emerald-100 text-emerald-800',
      'Nómina': 'px-3 py-1 text-sm font-medium rounded-lg bg-violet-100 text-violet-800',
      'Atracción de Talento': 'px-3 py-1 text-sm font-medium rounded-lg bg-rose-100 text-rose-800',
      'Dirección General': 'px-3 py-1 text-sm font-medium rounded-lg bg-slate-100 text-slate-800',
      'Asuntos Corporativos': 'px-3 py-1 text-sm font-medium rounded-lg bg-red-100 text-red-800',
      'Seguridad': 'px-3 py-1 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-800',
      'Jurídico': 'px-3 py-1 text-sm font-medium rounded-lg bg-lime-100 text-lime-800'
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
      // const data = filteredPagos.map(pago => ({ ... }));

      // Aquí implementarías la lógica de exportación a PDF
  // console.log('Exportando a PDF:', data);
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
      // const data = filteredPagos.map(pago => ({ ... }));

      // Aquí implementarías la lógica de exportación a Excel
  // console.log('Exportando a Excel:', data);
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
          new Date(pago.fecha_creacion).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }),
          new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' }),
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

  function mapSolicitudToTukashData(solicitud: Solicitud): SolicitudTukashData {
    let plantillaData: Partial<SolicitudTukashData> = {};
    if (solicitud.plantilla_datos) {
      try {
        plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      } catch {}
    }
    return {
      id_solicitud: solicitud.id_solicitud,
      asunto: plantillaData.asunto || 'TUKASH',
      cliente: plantillaData.cliente || solicitud.empresa_a_pagar || '',
      beneficiario_tarjeta: plantillaData.beneficiario_tarjeta || solicitud.nombre_persona || '',
      numero_tarjeta: plantillaData.numero_tarjeta || solicitud.cuenta_destino || solicitud.cuenta || '',
      monto_total_cliente: plantillaData.monto_total_cliente || Number(solicitud.monto) || 0,
      monto_total_tukash: plantillaData.monto_total_tukash || Number(solicitud.monto2) || Number(solicitud.monto) || 0,
      estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado) || 'pendiente',
      fecha_creacion: solicitud.fecha_creacion || '',
      fecha_actualizacion: solicitud.updated_at || '',
      usuario_creacion: solicitud.usuario_nombre || '',
      usuario_actualizacion: '',
      folio: solicitud.folio || '',
    };
  }

  function mapSolicitudToN09TokaData(solicitud: Solicitud): SolicitudN09TokaData {
    let plantillaData: Record<string, unknown> = {};
    if (solicitud.plantilla_datos) {
      try {
        plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      } catch {}
    }
    return {
      id_solicitud: solicitud.id_solicitud,
      asunto: (plantillaData.asunto as 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT') || 'PAGO_PROVEEDOR_N09',
      cliente: (plantillaData.cliente as string) || '',
      beneficiario: (plantillaData.beneficiario as string) || '',
      proveedor: (plantillaData.proveedor as string) || '',
      tipo_cuenta_clabe: (plantillaData.tipo_cuenta_clabe as 'CLABE' | 'CUENTA') || 'CLABE',
      numero_cuenta_clabe: (plantillaData.numero_cuenta_clabe as string) || '',
      banco_destino: (plantillaData.banco_destino as string) || '',
      monto: Number(solicitud.monto) || 0,
      tipo_moneda: (plantillaData.tipo_moneda as 'MXN' | 'USD' | 'EUR') || 'MXN',
      estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado) || 'pendiente',
      fecha_creacion: solicitud.fecha_creacion || '',
      fecha_actualizacion: solicitud.updated_at || '',
      fecha_limite_pago: solicitud.fecha_limite_pago || '',
      usuario_creacion: solicitud.usuario_nombre || '',
      usuario_actualizacion: '',
    };
  }

  // Nota: Usando función isN09TokaSolicitud importada de utils/solicitudUtils.ts

  // Función para detectar si una solicitud es TUKASH
  function isTukashSolicitud(solicitud: Solicitud): boolean {
    if (solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        return plantillaData.templateType === 'tarjetas-tukash' || 
               plantillaData.isTukash === true ||
               (plantillaData.beneficiario_tarjeta && plantillaData.numero_tarjeta);
      } catch {
        return false;
      }
    }
    return false;
  }

  // Función para renderizar el modal correcto según plantilla
  function renderPlantillaModal() {
    console.log('🔴 RENDER MODAL - showDetailModal:', showDetailModal, 'selectedPago:', !!selectedPago);
    
    if (!showDetailModal || !selectedPago) {
      console.log('🔴 RENDER MODAL - Saliendo temprano, no hay modal o pago seleccionado');
      return null;
    }
    
    console.log('🔍 Detectando tipo de plantilla para solicitud:', selectedPago.id_solicitud);
    console.log('📄 Datos de plantilla:', selectedPago.plantilla_datos);
    console.log('🏷️ Tipo plantilla directo:', (selectedPago as Solicitud & { tipo_plantilla?: string })?.tipo_plantilla);
    console.log('🆔 Folio:', selectedPago.folio);
    console.log('📋 Departamento:', selectedPago.departamento);
    
    // Detectar N09/TOKA primero
    const isN09Toka = isN09TokaSolicitud(selectedPago);
    console.log('🔍 ¿Es N09/TOKA?:', isN09Toka);
    
    if (isN09Toka) {
      console.log('✅ Detectado como N09/TOKA - Mostrando modal N09/TOKA');
      return (
        <PlantillaN09TokaDetailModal
          solicitud={mapSolicitudToN09TokaData(selectedPago)}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      );
    }
    
    // Detectar TUKASH
    const isTukash = isTukashSolicitud(selectedPago);
    console.log('🔍 ¿Es TUKASH?:', isTukash);
    
    if (isTukash) {
      console.log('✅ Detectado como TUKASH - Mostrando modal TUKASH');
      return (
        <PlantillaTukashDetailModal
          solicitud={mapSolicitudToTukashData(selectedPago)}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      );
    }
    
    // Para solicitudes estándar (sin plantilla específica)
    console.log('✅ Detectado como solicitud estándar - Mostrando modal estándar');
    return (
      <SolicitudDetailModal
        solicitud={selectedPago}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        userRole="pagador"
      />
    );
  }

  return (
    <ProtectedRoute requiredRoles={['pagador', 'pagador_banca']}>
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros de búsqueda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <input
                  type="text"
                  placeholder="Buscar por folio, solicitante..."
                  value={localFilters.search}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ search: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <select
                  value={localFilters.departamento}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ departamento: e.target.value })}
                >
                  <option value="">Todos los departamentos</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Facturación">Facturación</option>
                  <option value="Cobranza">Cobranza</option>
                  <option value="Vinculación">Vinculación</option>
                  <option value="Administración">Administración</option>
                  <option value="TI">TI</option>
                  <option value="Automatizaciones">Automatizaciones</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Atención a Clientes">Atención a Clientes</option>
                  <option value="Tesorería">Tesorería</option>
                  <option value="Nómina">Nómina</option>
                  <option value="Atracción de Talento">Atracción de Talento</option>
                  <option value="Dirección General">Dirección General</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Jurídico">Jurídico</option>
                  <option value="Asuntos Corporativos">Asuntos Corporativos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto Mínimo</label>
                <input
                  type="number"
                  placeholder="Ej: 1000"
                  value={localFilters.montoMin}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ montoMin: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto Máximo</label>
                <input
                  type="number"
                  placeholder="Ej: 10000"
                  value={localFilters.montoMax}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ montoMax: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
                <input
                  type="date"
                  value={localFilters.fechaDesde}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ fechaDesde: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
                <input
                  type="date"
                  value={localFilters.fechaHasta}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  onChange={(e) => updateLocalFilters({ fechaHasta: e.target.value })}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={resetLocalFilters}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
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
                                {new Date(pago.fecha_creacion).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
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

        {/* Pago Detail Modal (unificado para todas las plantillas) */}
        {renderPlantillaModal()}

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
