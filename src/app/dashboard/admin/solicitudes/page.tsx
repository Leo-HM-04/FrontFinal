'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { ConfirmDeleteSoli } from '@/components/common/ConfirmDeleteSoli';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { PlantillaN09TokaDetailModal } from '@/components/plantillas/PlantillaN09TokaDetailModal';
import { PlantillaTukashDetailModal } from '@/components/plantillas/PlantillaTukashDetailModal';
import { FileText, Trash2, Eye, Download } from 'lucide-react';
import { exportSolicitudesPDF, exportSolicitudesExcel, exportSolicitudesCSV } from '@/utils/exportSolicitudes';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { SolicitudesN09TokaService, SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import { SolicitudTukashData } from '@/types/plantillaTukash';

// Tipo extendido para solicitudes que pueden incluir datos N09/TOKA
interface SolicitudUnificada extends Omit<Solicitud, 'monto'> {
  tipo_plantilla?: string;
  // Campos específicos de N09/TOKA que pueden estar presentes
  asunto?: 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT';
  cliente?: string;
  beneficiario?: string;
  proveedor?: string;
  tipo_cuenta_clabe?: 'CLABE' | 'CUENTA';
  numero_cuenta_clabe?: string;
  banco_destino?: string;
  monto?: number | string;
  tipo_moneda?: 'MXN' | 'USD' | 'EUR';
  folio?: string;
  tiene_archivos?: boolean;
  id_aprobador?: number;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}
import { ExportOptions } from '@/components/common/ExportOptions';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useAuth } from '@/contexts/AuthContext';
import { Solicitud } from '@/types';
import { toast } from 'react-hot-toast';

// Función para detectar si una solicitud es del tipo N09/TOKA
const isN09TokaSolicitud = (solicitud: Solicitud): boolean => {
  const solicitudExtendida = solicitud as Solicitud & {
    tipo_plantilla?: string;
    asunto?: string;
    cliente?: string;
    beneficiario?: string;
  };
  
  // Verificar si tiene el campo tipo_plantilla específico
  if (solicitudExtendida.tipo_plantilla === 'N09_TOKA') {
    return true;
  }
  
  // Detectar basándose en los campos específicos de plantilla_datos
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = JSON.parse(solicitud.plantilla_datos);
      return plantillaData.templateType === 'tarjetas-n09-toka' || 
             plantillaData.isN09Toka === true ||
             plantillaData.beneficiario || 
             plantillaData.numero_cuenta_clabe || 
             plantillaData.tipo_cuenta_clabe;
    } catch {
      return false;
    }
  }
  return false;
};

// Función para detectar si una solicitud es del tipo TUKASH
const isTukashSolicitud = (solicitud: Solicitud): boolean => {
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] Analizando solicitud ID: ${solicitud.id_solicitud}`);
  
  const solicitudExtendida = solicitud as Solicitud & {
    tipo_plantilla?: string;
    asunto?: string;
    cliente?: string;
    beneficiario_tarjeta?: string;
  };
  
  // 1. Verificar si tiene el campo tipo_plantilla específico
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] tipo_plantilla: ${solicitudExtendida.tipo_plantilla}`);
  if (solicitudExtendida.tipo_plantilla === 'TUKASH') {
    console.log('✅ [ADMIN TUKASH DETECCIÓN] Detectada por tipo_plantilla = TUKASH');
    return true;
  }
  
  // 2. Detectar basándose en los campos específicos de plantilla_datos
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] plantilla_datos existe: ${!!solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = JSON.parse(solicitud.plantilla_datos);
      console.log(`🔍 [ADMIN TUKASH DETECCIÓN] plantilla_datos contenido:`, plantillaData);
      console.log(`🔍 [ADMIN TUKASH DETECCIÓN] asunto:`, plantillaData.asunto);
      console.log(`🔍 [ADMIN TUKASH DETECCIÓN] cliente:`, plantillaData.cliente);
      console.log(`🔍 [ADMIN TUKASH DETECCIÓN] beneficiario_tarjeta:`, plantillaData.beneficiario_tarjeta);
      const esTukash = plantillaData.templateType === 'tarjetas-tukash' || 
             plantillaData.isTukash === true ||
             (plantillaData.numero_tarjeta && plantillaData.beneficiario_tarjeta) ||
             (plantillaData.monto_total_cliente && plantillaData.monto_total_tukash) ||
             (plantillaData.asunto === 'TUKASH');
      if (esTukash) {
        console.log('✅ [ADMIN TUKASH DETECCIÓN] Detectada por datos de plantilla');
        return true;
      }
    } catch {
      console.log('❌ [ADMIN TUKASH DETECCIÓN] Error parseando plantilla_datos');
      return false;
    }
  }
  
  // 3. Detección adicional por tipo_pago_descripcion
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && solicitud.tipo_pago_descripcion.includes('tarjetas-tukash')) {
    console.log('✅ [ADMIN TUKASH DETECCIÓN] Detectada por tipo_pago_descripcion contiene tarjetas-tukash');
    return true;
  }
  
  // 4. Detección por concepto que contenga TUKASH
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && solicitud.concepto.toUpperCase().includes('TUKASH')) {
    console.log('✅ [ADMIN TUKASH DETECCIÓN] Detectada por concepto contiene TUKASH');
    return true;
  }
  
  // 5. Detección por nombre_persona o empresa_a_pagar que contenga TUKASH
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] nombre_persona: ${solicitud.nombre_persona}`);
  console.log(`🔍 [ADMIN TUKASH DETECCIÓN] empresa_a_pagar: ${solicitud.empresa_a_pagar}`);
  if ((solicitud.nombre_persona && solicitud.nombre_persona.toUpperCase().includes('TUKASH')) ||
      (solicitud.empresa_a_pagar && solicitud.empresa_a_pagar.toUpperCase().includes('TUKASH'))) {
    console.log('✅ [ADMIN TUKASH DETECCIÓN] Detectada por nombre_persona o empresa_a_pagar contiene TUKASH');
    return true;
  }
  
  console.log('❌ [ADMIN TUKASH DETECCIÓN] No detectada como TUKASH');
  return false;
};

export default function SolicitudesPage() {
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedN09TokaSolicitud, setSelectedN09TokaSolicitud] = useState<SolicitudN09TokaData | null>(null);
  const [selectedTukashSolicitud, setSelectedTukashSolicitud] = useState<SolicitudTukashData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { } = useAuth();

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
  } = usePagination({ data: filteredSolicitudes, initialItemsPerPage: 5 });

  const handleDelete = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setSelectedN09TokaSolicitud(null);
    setSelectedTukashSolicitud(null);
    setShowDeleteModal(true);
  };

  const handleViewSolicitud = async (solicitud: Solicitud) => {
    // Verificar si es una solicitud N09/TOKA
    if (isN09TokaSolicitud(solicitud)) {
      try {
        // Para solicitudes N09/TOKA transformadas, ya tenemos los datos en plantilla_datos
        const solicitudUnificada = solicitud as SolicitudUnificada;
        if (solicitudUnificada.tipo_plantilla === 'N09_TOKA') {
          // Convertir los datos de la solicitud al formato esperado por el modal
          const solicitudN09Toka: SolicitudN09TokaData = {
            id_solicitud: solicitud.id_solicitud,
            asunto: (solicitudUnificada.asunto as 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT') || 'PAGO_PROVEEDOR_N09',
            cliente: solicitudUnificada.cliente || '',
            beneficiario: solicitudUnificada.beneficiario || '',
            proveedor: solicitudUnificada.proveedor,
            tipo_cuenta_clabe: (solicitudUnificada.tipo_cuenta_clabe as 'CLABE' | 'CUENTA') || 'CLABE',
            numero_cuenta_clabe: solicitudUnificada.numero_cuenta_clabe || '',
            banco_destino: solicitudUnificada.banco_destino || '',
            monto: parseFloat(solicitudUnificada.monto?.toString() || '0'),
            tipo_moneda: (solicitudUnificada.tipo_moneda as 'MXN' | 'USD' | 'EUR') || 'MXN',
            estado: solicitudUnificada.estado || '',
            fecha_creacion: solicitudUnificada.fecha_creacion,
            fecha_actualizacion: (solicitudUnificada as unknown as Record<string, unknown>).fecha_actualizacion as string,
            fecha_limite_pago: solicitudUnificada.fecha_limite_pago,
            usuario_creacion: solicitudUnificada.usuario_creacion,
            usuario_actualizacion: solicitudUnificada.usuario_actualizacion
          };
          setSelectedN09TokaSolicitud(solicitudN09Toka);
        } else {
          // Fallback: intentar obtener desde el servicio
          const response = await SolicitudesN09TokaService.obtenerPorSolicitudPrincipal(solicitud.id_solicitud);
          if (response.success && response.data) {
            setSelectedN09TokaSolicitud(response.data);
          } else {
            toast.error('No se encontraron datos de la plantilla N09/TOKA');
            setSelectedSolicitud(solicitud);
          }
        }
      } catch (error) {
        console.error('Error al obtener solicitud N09/TOKA:', error);
        toast.error('Error al cargar los detalles de la plantilla N09/TOKA');
        // Fallback al modal normal
        setSelectedSolicitud(solicitud);
      }
    } else if (isTukashSolicitud(solicitud)) {
      // Verificar si es una solicitud TUKASH
      try {
        let solicitudTukash: SolicitudTukashData | null = null;
        
        // Intentar obtener datos de plantilla_datos primero
        if (solicitud.plantilla_datos) {
          const plantillaData = JSON.parse(solicitud.plantilla_datos);
          solicitudTukash = {
            id_solicitud: solicitud.id_solicitud,
            asunto: plantillaData.asunto || 'TUKASH',
            cliente: plantillaData.cliente || '',
            beneficiario_tarjeta: plantillaData.beneficiario_tarjeta || '',
            numero_tarjeta: plantillaData.numero_tarjeta || '',
            monto_total_cliente: plantillaData.monto_total_cliente || 0,
            monto_total_tukash: plantillaData.monto_total_tukash || 0,
            estado: (solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
            fecha_creacion: solicitud.fecha_creacion,
            fecha_actualizacion: solicitud.updated_at || '',
            usuario_creacion: solicitud.usuario_nombre || '',
            usuario_actualizacion: '',
          };
        }
        
        // Si no hay plantilla_datos, construir desde campos básicos de la solicitud
        if (!solicitudTukash) {
          console.log('🔧 [ADMIN TUKASH] Construyendo datos desde campos básicos de la solicitud');
          
          // Extraer información de TUKASH desde campos básicos
          const asunto = solicitud.concepto?.includes('TUKASH') ? 'TUKASH' : 'TUKASH';
          const cliente = solicitud.empresa_a_pagar || '';
          const beneficiario_tarjeta = solicitud.nombre_persona || '';
          const numero_tarjeta = solicitud.cuenta_destino || solicitud.cuenta || ''; // Usar cuenta_destino o cuenta como número de tarjeta
          const monto_total_cliente = Number(solicitud.monto) || 0;
          const monto_total_tukash = Number(solicitud.monto) || 0; // Usar el mismo monto si no hay específico
          
          solicitudTukash = {
            id_solicitud: solicitud.id_solicitud,
            asunto,
            cliente,
            beneficiario_tarjeta,
            numero_tarjeta,
            monto_total_cliente,
            monto_total_tukash,
            estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
            fecha_creacion: solicitud.fecha_creacion,
            fecha_actualizacion: solicitud.updated_at || '',
            usuario_creacion: solicitud.usuario_nombre || '',
            usuario_actualizacion: '',
            // Campos adicionales
            folio: solicitud.folio || '',
          };
          
          console.log('🔧 [ADMIN TUKASH] Datos construidos:', solicitudTukash);
        }
        
        if (solicitudTukash) {
          console.log('✅ [ADMIN TUKASH] Configurando modal TUKASH con datos:', solicitudTukash);
          setSelectedTukashSolicitud(solicitudTukash);
        } else {
          toast.error('No se pudieron procesar los datos de la plantilla TUKASH');
          setSelectedSolicitud(solicitud);
        }
      } catch (error) {
        console.error('Error al procesar solicitud TUKASH:', error);
        toast.error('Error al cargar los detalles de la plantilla TUKASH');
        setSelectedSolicitud(solicitud);
      }
    } else {
      // Solicitud normal
      setSelectedSolicitud(solicitud);
    }
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



  // Badge color y estilo para estado
  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-200 text-yellow-900 border-yellow-400',
      autorizada: 'bg-emerald-200 text-emerald-900 border-emerald-400',
      rechazada: 'bg-rose-200 text-rose-900 border-rose-400',
      procesada: 'bg-blue-200 text-blue-900 border-blue-400',
      cancelada: 'bg-gray-200 text-gray-700 border-gray-400',
      revisada: 'bg-indigo-200 text-indigo-900 border-indigo-400',
      pagada: 'bg-green-200 text-green-900 border-green-400',
      vencida: 'bg-orange-200 text-orange-900 border-orange-400',
    };
    return colors[estado?.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Badge color para departamento (mapeo robusto y normalización)
  const getDepartamentoColor = (departamento: string) => {
    if (!departamento) return 'bg-gray-100 text-gray-800 border-gray-300';
    const dep = departamento.trim().toLowerCase();
    const map: Record<string, string> = {
      finanzas: 'bg-blue-100 text-blue-800 border-blue-300',
      compras: 'bg-green-100 text-green-800 border-green-300',
      recursos: 'bg-purple-100 text-purple-800 border-purple-300',
      it: 'bg-pink-100 text-pink-800 border-pink-300',
      legal: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      operaciones: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      marketing: 'bg-orange-100 text-orange-800 border-orange-300',
      logistica: 'bg-lime-100 text-lime-800 border-lime-300',
      talento: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
      ventas: 'bg-amber-100 text-amber-800 border-amber-300',
      soporte: 'bg-sky-100 text-sky-800 border-sky-300',
      calidad: 'bg-rose-100 text-rose-800 border-rose-300',
      proyectos: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      cobranza: 'bg-blue-200 text-blue-900 border-blue-400',
      automatizaciones: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      vinculacion: 'bg-teal-100 text-teal-800 border-teal-300',
      // Puedes agregar más departamentos personalizados aquí
    };
    // Si el nombre contiene automatizacion, usar el color de automatizaciones
    if (dep.includes('automatiz')) return map['automatizaciones'];
    if (dep.includes('cobranza')) return map['cobranza'];
    if (dep.includes('vincul')) return map['vinculacion'];
    return map[dep] || 'bg-gray-100 text-gray-800 border-gray-300';
  };


  // Formatea el monto con abreviatura visual de escala
  const formatMontoVisual = (amount: number) => {
    if (amount == null || isNaN(amount)) return '-';
    let value = amount;
    let suffix = '';
    let color = 'bg-gray-100 text-gray-800 border-gray-300';
    if (amount >= 1_000_000_000_000) {
      value = amount / 1_000_000_000_000;
      suffix = 'B';
      color = 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300'; // Billones
    } else if (amount >= 1_000_000_000) {
      value = amount / 1_000_000_000;
      suffix = 'MM';
      color = 'bg-indigo-100 text-indigo-800 border-indigo-300'; // Miles de millones
    } else if (amount >= 1_000_000) {
      value = amount / 1_000_000;
      suffix = 'M';
      color = 'bg-green-100 text-green-800 border-green-300'; // Millones
    } else if (amount >= 1_000) {
      value = amount / 1_000;
      suffix = 'K';
      color = 'bg-blue-100 text-blue-800 border-blue-300'; // Miles
    } else {
      suffix = '';
      color = 'bg-gray-100 text-gray-800 border-gray-300'; // Pesos
    }
    // Redondeo visual y formato en pesos mexicanos
    const display = value % 1 === 0
      ? value.toLocaleString('es-MX', { maximumFractionDigits: 0 })
      : value.toLocaleString('es-MX', { maximumFractionDigits: 2 });
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full border font-bold text-xs tracking-wide shadow-sm ${color}`} style={{minWidth: 80, justifyContent: 'center'}}>
        ${display}{suffix && <span className="ml-1 font-semibold">{suffix}</span>}
      </span>
    );
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
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards Mejorados */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {/* Total */}
            <div className="bg-blue-100/80 rounded-xl p-6 border border-blue-200 shadow-lg flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-200 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900/90">Total</p>
                <p className="text-2xl font-extrabold text-blue-900">{solicitudes.length}</p>
              </div>
            </div>
            {/* Pendientes */}
            <div className="bg-yellow-100/80 rounded-xl p-6 border border-yellow-200 shadow-lg flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2m8-2a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-900/90">Pendientes</p>
                <p className="text-2xl font-extrabold text-yellow-900">{solicitudes.filter(s => s.estado === 'pendiente').length}</p>
              </div>
            </div>
            {/* Autorizadas */}
            <div className="bg-green-100/80 rounded-xl p-6 border border-green-200 shadow-lg flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900/90">Autorizadas</p>
                <p className="text-2xl font-extrabold text-green-900">{solicitudes.filter(s => s.estado === 'autorizada').length}</p>
              </div>
            </div>
            {/* Rechazadas */}
            <div className="bg-red-100/80 rounded-xl p-6 border border-red-200 shadow-lg flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900/90">Rechazadas</p>
                <p className="text-2xl font-extrabold text-red-900">{solicitudes.filter(s => s.estado === 'rechazada').length}</p>
              </div>
            </div>
            {/* Pagadas */}
            <div className="bg-indigo-100/80 rounded-xl p-6 border border-indigo-200 shadow-lg flex items-center gap-4">
              <div className="p-3 rounded-full bg-indigo-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2m4-6a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900/90">Pagadas</p>
                <p className="text-2xl font-extrabold text-indigo-900">{solicitudes.filter(s => s.estado === 'pagada').length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
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
                    <table className="min-w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
                      <thead className="sticky top-0 z-10" style={{backgroundColor: '#F0F4FC'}}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Folio</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Solicitante</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Departamento</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Tipo de Cuenta/Tarjeta</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Banco Destino</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Monto</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedSolicitudes.map((solicitud) => (
                          <tr key={solicitud.id_solicitud} className="group transition-all hover:bg-blue-50/80 hover:shadow-md">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{solicitud.id_solicitud}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{solicitud.folio || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{solicitud.usuario_nombre || `${solicitud.id_usuario}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full border font-bold text-xs uppercase tracking-wide shadow-sm ${getDepartamentoColor(solicitud.departamento)}`} style={{minWidth: 90, justifyContent: 'center'}}>
                                {solicitud.departamento?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {solicitud.tipo_cuenta_destino === 'Tarjeta'
                                ? `Tarjeta${solicitud.tipo_tarjeta ? ' - ' + solicitud.tipo_tarjeta : ''}`
                                : solicitud.tipo_cuenta_destino || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {solicitud.banco_destino || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-base font-semibold">
                              {formatMontoVisual(solicitud.monto)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full border font-bold text-xs uppercase tracking-wide shadow-sm ${getEstadoColor(solicitud.estado)}`}
                                style={{ minWidth: 90, justifyContent: 'center', letterSpacing: 1 }}
                              >
                                {solicitud.estado?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {new Date(solicitud.fecha_creacion).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewSolicitud(solicitud)}
                                className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-900 hover:text-blue-900 transition"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(solicitud)}
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-red-900 transition"
                                title="Eliminar solicitud"
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


          {/* Modal de Detalle de Solicitud */}
          {selectedSolicitud && (
            <SolicitudDetailModal
              solicitud={selectedSolicitud}
              isOpen={!!selectedSolicitud}
              onClose={() => setSelectedSolicitud(null)}
              userRole="admin"
              showActions={false}
            />
          )}

          {/* Modal de Detalle de Plantilla N09/TOKA */}
          {selectedN09TokaSolicitud && (
            <PlantillaN09TokaDetailModal
              solicitud={selectedN09TokaSolicitud}
              isOpen={!!selectedN09TokaSolicitud}
              onClose={() => setSelectedN09TokaSolicitud(null)}
            />
          )}

          {/* Modal de Detalle de Plantilla TUKASH */}
          {selectedTukashSolicitud && (
            <PlantillaTukashDetailModal
              solicitud={selectedTukashSolicitud}
              isOpen={!!selectedTukashSolicitud}
              onClose={() => setSelectedTukashSolicitud(null)}
            />
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmDeleteSoli
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Eliminar Solicitud"
            message="¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer."
            itemName={selectedSolicitud ? `Solicitud #${selectedSolicitud.id_solicitud} - ${selectedSolicitud.departamento}` : undefined}
            loading={deleting}
          />

          {/* Export Options Modal */}
          <ExportOptions
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={(format, rango, estado) => {
              const solicitudesFiltradas = estado 
                ? solicitudes.filter(s => s.estado === estado)
                : solicitudes;

              switch (format) {
                case 'pdf':
                  exportSolicitudesPDF(solicitudesFiltradas, rango);
                  break;
                case 'excel':
                  exportSolicitudesExcel(solicitudesFiltradas, rango);
                  break;
                case 'csv':
                  exportSolicitudesCSV(solicitudesFiltradas, rango);
                  break;
              }
            }}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}