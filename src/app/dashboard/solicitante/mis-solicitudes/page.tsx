"use client";

import React, {
  useState,
  useEffect,
  Suspense,
  useCallback,
  memo,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { ConfirmDeleteSoli } from '@/components/common/ConfirmDeleteSoli';
import { SolicitudesService } from '@/services/solicitudes.service';
import { SolicitudesN09TokaService, SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import { Solicitud } from '@/types';
import { extraerFechaLimiteDesdeplantilla, esSolicitudConFechaLimitePlantilla } from '@/utils/plantillaUtils';
import { toast } from 'react-hot-toast';
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  Search,
  Download,
  Filter,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { ExportModal } from '@/components/modals/ExportModal';
import {
  exportMisSolicitudesCSV,
  exportMisSolicitudesExcel,
  exportMisSolicitudesPDF,
} from '@/utils/exportMisSolicitudes';
import { formatShortDate } from '@/utils/dateUtils';

// ========= Tipos =========
interface EstadisticasSolicitudes {
  total: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  montoTotal: number;
}

type SortField = 'monto' | 'estado' | 'fecha' | 'hora';
type SortOrder = 'asc' | 'desc';

// ========= Constantes =========
const ITEMS_PER_PAGE = 5;
const LOAD_TIMEOUT = 10000;

// Utilidad global para obtener el templateType de una solicitud (comentada porque no se usa)
/*
const getTemplateType = (solicitud: Solicitud): string => {
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      return plantillaData.templateType || '';
    } catch {}
  }
  return '';
};
*/

const ESTADO_ORDEN = {
  pendiente: 1,
  autorizadas: 2,
  autorizada: 2,
  pagada: 3,
  rechazada: 4,
} as const;

const FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'autorizada', label: 'Autorizadas' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'pagada', label: 'Pagada' },
];

const DATE_OPTIONS = [
  { value: '', label: 'Todas las fechas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
];

// Función para detectar si una solicitud es del tipo N09/TOKA
const isN09TokaSolicitud = (solicitud: Solicitud): boolean => {
  console.log('🔍 [DETECCIÓN] Analizando solicitud ID:', solicitud.id_solicitud);
  
  // Detectar y mostrar tipo_plantilla real desde plantilla_datos si existe
  type SolicitudExtendida = Solicitud & {
    tipo_plantilla?: string;
    asunto?: string;
    cliente?: string;
    beneficiario?: string;
  };
  const solicitudExt = solicitud as SolicitudExtendida;
  const tipoPlantillaDetectada = solicitudExt.tipo_plantilla;
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      if (plantillaData.templateType === 'tarjetas-n09-toka' || plantillaData.templateType === 'N09_TOKA') {
        return true;
      }
      if (plantillaData.isN09Toka === true) {
        return true;
      }
    } catch {}
  }
  if (tipoPlantillaDetectada === 'N09_TOKA' || tipoPlantillaDetectada === 'tarjetas-n09-toka') {
    return true;
  }
  return false;
};

// Tipo extendido para solicitudes N09/TOKA
interface SolicitudExtendida extends Omit<Solicitud, 'fecha_limite_pago'> {
  tipo_plantilla?: string;
  asunto?: 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT';
  cliente?: string;
  beneficiario?: string;
  proveedor?: string;
  tipo_cuenta_clabe?: 'CLABE' | 'CUENTA';
  numero_cuenta_clabe?: string;
  banco_destino?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
  fecha_actualizacion?: string;
  fecha_limite_pago?: string;
  tipo_moneda?: 'MXN' | 'USD' | 'EUR';
}

// ========= Utilidades =========
const getEstadoConfig = (estado: string) => {
  const configs = {
    pendiente: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-4 h-4" />,
      bgColor: 'bg-amber-500',
    },
    autorizada: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: 'bg-emerald-500',
    },
    aprobada: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: 'bg-emerald-500',
    },
    rechazada: {
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: <XCircle className="w-4 h-4" />,
      bgColor: 'bg-red-500',
    },
    pagada: {
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: 'bg-blue-500',
    },
  };

  return configs[estado?.toLowerCase() as keyof typeof configs] || {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: 'bg-gray-500',
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};


// ========= Subcomponentes a nivel de módulo (memoizados) =========

const EstadisticasCard = memo(function EstadisticasCard({
  estadisticas,
}: {
  estadisticas: EstadisticasSolicitudes;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
            <p className="text-3xl font-bold text-gray-900">{estadisticas.total}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
            <p className="text-3xl font-bold text-amber-600">{estadisticas.pendientes}</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-xl">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Aprobadas</p>
            <p className="text-3xl font-bold text-emerald-600">{estadisticas.aprobadas}</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
});

const ToolsSection = memo(function ToolsSection({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  onClear,
  total,
  filteredTotal,
  onNew,
  onExportClick,
}: {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  dateFilter: string;
  onDateChange: (v: string) => void;
  onClear: () => void;
  total: number;
  filteredTotal: number;
  onNew: () => void;
  onExportClick: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
      {/* Sección de filtros */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl flex items-center justify-center">
            <Filter className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Filtros</h3>
            <p className="text-sm text-gray-500">Refina tu búsqueda de solicitudes</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          {/* Input de búsqueda */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por folio, concepto..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                autoComplete="off"
                spellCheck="false"
                // autoFocus
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
            <select
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={onClear}
              variant="outline"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
            >
              Limpiar Filtros
            </Button>
            {(searchTerm || statusFilter || dateFilter) && (
              <span className="text-sm text-gray-500">
                Mostrando <span className="font-semibold">{filteredTotal}</span> de{' '}
                <span className="font-semibold">{total}</span> solicitudes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onNew}
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Solicitud
            </Button>
            <Button
              onClick={onExportClick}
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ========= Página =========
function MisSolicitudesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados principales
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeoutError, setTimeoutError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredSolicitudes, setFilteredSolicitudes] = useState<Solicitud[]>([]);

  // Modales
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [solicitudAEliminar, setSolicitudAEliminar] = useState<Solicitud | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  // Exportación
  const [showExportModal, setShowExportModal] = useState(false);

  // Highlight por query param
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Ordenamiento
  const [sortField] = useState<SortField | null>(null);
  const [sortOrder] = useState<SortOrder>('desc');

  // Manejo de parámetros URL para highlighting y modal
  useEffect(() => {
    const highlightParam = searchParams?.get('highlight');
    const openModalParam = searchParams?.get('openModal');
    
    if (highlightParam) {
      const id = parseInt(highlightParam);
      if (!isNaN(id)) {
        setHighlightedId(id);
        
        // Si también viene openModal=true, abrir el modal automáticamente
        if (openModalParam === 'true') {
          // Buscar la solicitud y abrir su modal
          const targetSolicitud = solicitudes.find(s => s.id_solicitud === id);
          if (targetSolicitud) {
            setSelectedSolicitud(targetSolicitud);
            setIsDetailModalOpen(true);
          }
        }
        
        setTimeout(() => {
          setHighlightedId(null);
          const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
          newSearchParams.delete('highlight');
          newSearchParams.delete('openModal');
          router.replace(
            `${window.location.pathname}?${newSearchParams.toString()}`,
            { scroll: false }
          );
        }, 3000);
      }
    }
  }, [searchParams, router, solicitudes]);

  // Cargar solicitudes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setTimeoutError(false);

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setTimeoutError(true);
        setLoading(false);
      }
    }, LOAD_TIMEOUT);

    const fetchSolicitudes = async () => {
      try {
        // Usar endpoint unificado para obtener solicitudes normales + N09/TOKA
        const data = await SolicitudesService.getAllUnified();
        console.log('🔍 Solicitudes unificadas obtenidas:', data);
        
        if (isMounted) {
          const sorted = data.sort(
            (a, b) =>
              new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
          );
          setSolicitudes(sorted);
          setError('');
          
          // Log para debugging
          const n09TokaCount = sorted.filter(s => {
            const solicitudExt = s as Solicitud & { tipo_plantilla?: string };
            return solicitudExt.tipo_plantilla === 'N09_TOKA';
          }).length;
          console.log(`📊 Total solicitudes: ${sorted.length}, N09/TOKA: ${n09TokaCount}`);
        }
      } catch {
        if (isMounted) {
          // console.error('Error al cargar solicitudes');
          setError('Error al cargar las solicitudes');
          setSolicitudes([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSolicitudes();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Filtrado
  useEffect(() => {
    let filtered = [...solicitudes];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((s) =>
        s.concepto?.toLowerCase().includes(q) ||
        s.departamento?.toLowerCase().includes(q) ||
        s.cuenta_destino?.toLowerCase().includes(q) ||
        s.folio?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(
        (s) => s.estado?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date(today);
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter((s) => {
            const d = new Date(s.fecha_creacion);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setTime(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(
            (s) => new Date(s.fecha_creacion) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(
            (s) => new Date(s.fecha_creacion) >= filterDate
          );
          break;
      }
    }
    setFilteredSolicitudes(filtered);
    setCurrentPage(1);
  }, [solicitudes, searchTerm, statusFilter, dateFilter]);

  // Estadísticas
  const estadisticas: EstadisticasSolicitudes = {
    total: solicitudes.length,
    pendientes: solicitudes.filter((s) => s.estado?.toLowerCase() === 'pendiente').length,
    aprobadas: solicitudes.filter((s) =>
      ['autorizada', 'aprobada', 'pagada'].includes(s.estado?.toLowerCase() || '')
    ).length,
    rechazadas: solicitudes.filter((s) => s.estado?.toLowerCase() === 'rechazada').length,
    montoTotal: solicitudes.reduce((sum, s) => sum + (s.monto || 0), 0),
  };

  // Ordenamiento

  const solicitudesOrdenadas = [...filteredSolicitudes].sort((a, b) => {
    if (sortField && sortOrder) {
      let comparison = 0;
      switch (sortField) {
        case 'monto':
          comparison = (a.monto || 0) - (b.monto || 0);
          break;
        case 'estado': {
          const estadoA = (a.estado || '').toLowerCase();
          const estadoB = (b.estado || '').toLowerCase();
          const ordenA = ESTADO_ORDEN[estadoA as keyof typeof ESTADO_ORDEN] ?? 99;
          const ordenB = ESTADO_ORDEN[estadoB as keyof typeof ESTADO_ORDEN] ?? 99;
          comparison = ordenA - ordenB;
          break;
        }
        case 'fecha':
        case 'hora':
          comparison =
            new Date(a.fecha_creacion).getTime() -
            new Date(b.fecha_creacion).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    }

    // Orden por defecto (estado y fecha desc)
    const estadoA = (a.estado || '').toLowerCase();
    const estadoB = (b.estado || '').toLowerCase();
    const ordenA = ESTADO_ORDEN[estadoA as keyof typeof ESTADO_ORDEN] ?? 99;
    const ordenB = ESTADO_ORDEN[estadoB as keyof typeof ESTADO_ORDEN] ?? 99;

    if (ordenA !== ordenB) return ordenA - ordenB;
    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
  });

  // Paginación
  const totalPages = Math.ceil(solicitudesOrdenadas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, solicitudesOrdenadas.length);
  const currentSolicitudes = solicitudesOrdenadas.slice(startIndex, endIndex);
  // Mapear datos para mostrar info de TUKASH si los campos principales están vacíos
  type SolicitudTukashExtendida = Solicitud & {
    cliente?: string;
    beneficiario_tarjeta?: string;
    numero_tarjeta?: string;
    monto_total_cliente?: string | number;
    monto_total_tukash?: string | number;
  };
  const currentSolicitudesMapped: SolicitudTukashExtendida[] = currentSolicitudes.map((s) => {
    type PlantillaDatos = {
      concepto?: string;
      asunto?: string;
      departamento?: string;
      cuenta_destino?: string;
      numero_tarjeta?: string;
      monto?: string | number;
      monto_total_cliente?: string | number;
      monto_total_tukash?: string | number;
      tipo_moneda?: string;
      fecha_limite_pago?: string;
      cliente?: string;
      beneficiario_tarjeta?: string;
    };
    let plantilla: PlantillaDatos = {};
    if (s.plantilla_datos) {
      try {
        plantilla = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
      } catch {}
    }
    let montoVal: number = 0;
    if (typeof s.monto === 'number' && s.monto !== 0) {
      montoVal = s.monto;
    } else if (typeof s.monto === 'string' && s.monto !== '0.00' && s.monto !== '0' && s.monto !== '') {
      montoVal = Number(s.monto);
    } else if (plantilla.monto !== undefined && plantilla.monto !== null && plantilla.monto !== '') {
      montoVal = Number(plantilla.monto);
    } else if (plantilla.monto_total_cliente !== undefined && plantilla.monto_total_cliente !== null && plantilla.monto_total_cliente !== '') {
      montoVal = Number(plantilla.monto_total_cliente);
    }
    // Mapear campos personalizados de TUKASH
    const sExt = s as SolicitudTukashExtendida;
    return {
      ...s,
      concepto: s.concepto || plantilla.concepto || plantilla.asunto || '',
      departamento: s.departamento || plantilla.departamento || '',
      cuenta_destino: s.cuenta_destino || plantilla.cuenta_destino || plantilla.numero_tarjeta || '',
      monto: montoVal,
      tipo_moneda: s.tipo_moneda || plantilla.tipo_moneda || '',
      fecha_limite_pago: s.fecha_limite_pago || plantilla.fecha_limite_pago || '',
      cliente: sExt.cliente || plantilla.cliente || '',
      beneficiario_tarjeta: sExt.beneficiario_tarjeta || plantilla.beneficiario_tarjeta || '',
      numero_tarjeta: sExt.numero_tarjeta || plantilla.numero_tarjeta || '',
      monto_total_cliente: sExt.monto_total_cliente || plantilla.monto_total_cliente || '',
      monto_total_tukash: sExt.monto_total_tukash || plantilla.monto_total_tukash || '',
    };
  });

  // Handlers
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFilter('');
  }, []);

  const handleExport = async (format: string, filter: 'todos' | 'activo' | 'inactivo') => {
    let solicitudesExport = filteredSolicitudes;

    if (filter === 'activo') {
      solicitudesExport = filteredSolicitudes.filter((s) =>
        ['autorizada', 'aprobada', 'pagada'].includes(s.estado?.toLowerCase() || '')
      );
    } else if (filter === 'inactivo') {
      solicitudesExport = filteredSolicitudes.filter((s) =>
        ['pendiente', 'rechazada'].includes(s.estado?.toLowerCase() || '')
      );
    }

    try {
      if (format === 'pdf') {
        await exportMisSolicitudesPDF(solicitudesExport, filter);
      } else if (format === 'excel') {
        exportMisSolicitudesExcel(solicitudesExport, filter);
      } else if (format === 'csv') {
        exportMisSolicitudesCSV(solicitudesExport, filter);
      }
    } catch {
      // console.error('Error al exportar');
      // Aquí podrías mostrar una notificación de error al usuario
    }

    setShowExportModal(false);
  };

  const handleViewDetails = async (solicitud: Solicitud) => {
    console.log('🔍 Verificando solicitud:', solicitud.id_solicitud);
    console.log('🔍 Datos de solicitud:', solicitud);
    
    // Verificar si es una solicitud N09/TOKA
    if (isN09TokaSolicitud(solicitud)) {
      console.log('✅ Es solicitud N09/TOKA, procesando...');
      try {
        // Para todas las solicitudes (incluyendo N09/TOKA), usar el mismo modal
        console.log('📋 Abriendo modal para solicitud:', solicitud);
        setSelectedSolicitud(solicitud);
        setIsDetailModalOpen(true);
        return;
      } catch (error) {
        console.error('❌ Error al obtener solicitud N09/TOKA:', error);
        toast.error('Error al cargar los detalles de la plantilla N09/TOKA');
        // Fallback al modal normal solo en caso de error
        setSelectedSolicitud(solicitud);
        setIsDetailModalOpen(true);
        return; // ¡IMPORTANTE! Salir aquí para no continuar
      }
    } else {
      console.log('ℹ️ Solicitud normal, abriendo modal estándar');
      // Solicitud normal
      setSelectedSolicitud(solicitud);
      setIsDetailModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!solicitudAEliminar) return;
    setDeleting(true);

    try {
      // Detectar si es N09/TOKA y usar el servicio correcto
      if (isN09TokaSolicitud(solicitudAEliminar)) {
        await SolicitudesN09TokaService.eliminar(solicitudAEliminar.id_solicitud);
      } else {
        await SolicitudesService.deleteSolicitante(solicitudAEliminar.id_solicitud);
      }
      const updated = solicitudes.filter(
        (s) => s.id_solicitud !== solicitudAEliminar.id_solicitud
      );
      setSolicitudes(updated);
      setDeleteModalOpen(false);
      setSolicitudAEliminar(null);
      setError('');
      setSuccess('Solicitud eliminada correctamente.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: unknown) {
      let backendMsg = 'Error al eliminar la solicitud';
      if (typeof err === 'object' && err !== null) {
        const e = err as {
          response?: { data?: { error?: string; message?: string } };
          message?: string;
        };
        backendMsg =
          e.response?.data?.error ||
          e.response?.data?.message ||
          e.message ||
          backendMsg;
      }
      setError(backendMsg);
    } finally {
      setDeleting(false);
    }
  };

  const onNew = useCallback(
    () => router.push('/dashboard/solicitante/nueva-solicitud'),
    [router]
  );

  const onExportClick = useCallback(() => setShowExportModal(true), []);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['solicitante']}>
        <SolicitanteLayout>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600">
                  {timeoutError
                    ? 'La carga está tardando demasiado. Por favor, verifica tu conexión o intenta recargar la página.'
                    : 'Cargando solicitudes...'}
                </p>
              </div>
            </div>
          </div>
        </SolicitanteLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Mis Solicitudes</h1>
            <p className="text-white">Administra y controla todas tus solicitudes de pago</p>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Estadísticas */}
          <EstadisticasCard estadisticas={estadisticas} />

          {/* Herramientas */}
          <ToolsSection
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            onClear={clearFilters}
            total={solicitudes.length}
            filteredTotal={filteredSolicitudes.length}
            onNew={onNew}
            onExportClick={onExportClick}
          />

          {/* Tabla de solicitudes - Desktop */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
            {/* Vista de tabla para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-28">Folio</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-40">Departamento</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Concepto</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Monto</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-40">Cuenta Destino</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Estado</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Fecha Límite</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {currentSolicitudesMapped.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-blue-900/80">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                        <p className="text-lg font-semibold">No tienes solicitudes aún</p>
                        <p className="text-sm text-blue-500 mt-1">
                          {searchTerm || statusFilter || dateFilter
                            ? 'No se encontraron solicitudes con los filtros aplicados'
                            : 'Crea tu primer solicitud'}
                        </p>
                      </td>
                    </tr>
                  ) :
                    currentSolicitudesMapped.map((s) => {
                      const estadoConfig = getEstadoConfig(s.estado);
                      const isHighlighted = highlightedId === s.id_solicitud;
                      return (
                        <tr 
                          key={s.id_solicitud} 
                          className={`hover:bg-blue-50/70 transition-colors ${
                            isHighlighted 
                              ? 'bg-yellow-100 border-2 border-yellow-400 animate-pulse' 
                              : ''
                          }`}
                        >
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded">{s.folio || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900 font-medium truncate max-w-[160px]">
                            {s.departamento}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900 truncate max-w-[200px]">{s.concepto}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm font-bold text-blue-900">{formatCurrency(Number(s.monto))}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900/90 font-medium truncate max-w-[160px]">{s.cuenta_destino}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${estadoConfig.color} shadow-sm bg-white/90`}>
                            {estadoConfig.icon}
                            <span className="ml-1 capitalize truncate max-w-[80px]">{s.estado || 'pendiente'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900/80">
                            {formatShortDate(
                              esSolicitudConFechaLimitePlantilla(s) 
                                ? extraerFechaLimiteDesdeplantilla(s.plantilla_datos || null, s.fecha_limite_pago)
                                : s.fecha_limite_pago
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="Ver detalles"
                              className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              onClick={() => handleViewDetails(s)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                              {String(s.estado).toLowerCase() === 'pendiente' && (
                                <>
                                  {/*
                                  <button
                                    title="Editar"
                                    className="inline-flex items-center justify-center p-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                                    onClick={() => {
                                      // Detección por plantilla robusta
                                      const templateType = getTemplateType(s);
                                      if (isN09TokaSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-solicitud-n09-toka/${s.id_solicitud}`);
                                      } else if (isTukashSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-tukash/${s.id_solicitud}`);
                                      } else if (isSuaInternasSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-sua-internas/${s.id_solicitud}`);
                                      } else if (isSuaFrenshetsiSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-sua-frenshetsi/${s.id_solicitud}`);
                                      } else if (isComisionesSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-comisiones/${s.id_solicitud}`);
                                      } else if (isPolizasSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-polizas/${s.id_solicitud}`);
                                      } else if (isRegresosTransferenciaSolicitud(s)) {
                                        router.push(`/dashboard/solicitante/editar-regresos-transferencia/${s.id_solicitud}`);
                                      } else {
                                        router.push(`/dashboard/solicitante/editar-solicitud/${s.id_solicitud}`);
                                      }
                                    }}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>*/}
                                  <button
                                    title="Eliminar"
                                    className="inline-flex items-center justify-center p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                    onClick={() => { setSolicitudAEliminar(s); setDeleteModalOpen(true); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden">
              {currentSolicitudes.length === 0 ? (
                <div className="px-6 py-12 text-center text-blue-900/80">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                  <p className="text-lg font-semibold">No tienes solicitudes aún</p>
                  <p className="text-sm text-blue-500 mt-1">
                    {searchTerm || statusFilter || dateFilter
                      ? 'No se encontraron solicitudes con los filtros aplicados'
                      : 'Crea tu primer solicitud'}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {currentSolicitudes.map((s) => {
                    const estadoConfig = getEstadoConfig(s.estado);
                    const isHighlighted = highlightedId === s.id_solicitud;
                    return (
                      <div 
                        key={s.id_solicitud}
                        className={`border border-blue-200 rounded-lg p-4 bg-white shadow-sm transition-all ${
                          isHighlighted 
                            ? 'bg-yellow-100 border-yellow-400 shadow-lg animate-pulse' 
                            : 'hover:shadow-md hover:border-blue-300'
                        }`}
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-1 rounded w-fit">
                              {s.folio || '-'}
                            </span>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${estadoConfig.color} shadow-sm bg-white/90`}>
                                {estadoConfig.icon}
                                <span className="ml-1 capitalize">{s.estado || 'pendiente'}</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-900 mb-1">
                              {formatCurrency(Number(s.monto))}
                            </div>
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="space-y-2 mb-4">
                          <div>
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Departamento</span>
                            <p className="text-sm text-blue-900 font-medium mt-1">
                              {s.departamento}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Concepto</span>
                            <p className="text-sm text-blue-900 mt-1">{s.concepto}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Cuenta Destino</span>
                            <p className="text-sm text-blue-900/90 font-medium mt-1">{s.cuenta_destino}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Fecha Límite</span>
                            <p className="text-sm text-blue-900/80 mt-1">
                              {formatShortDate(
                                esSolicitudConFechaLimitePlantilla(s) 
                                  ? extraerFechaLimiteDesdeplantilla(s.plantilla_datos || null, s.fecha_limite_pago)
                                  : s.fecha_limite_pago
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-100">
                          <button
                            title="Ver detalles"
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                            onClick={() => handleViewDetails(s)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                            {String(s.estado).toLowerCase() === 'pendiente' && (
                              <>
                                {/*
                                <button
                                  title="Editar"
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm font-medium"
                                  onClick={() => {
                                    // Detección por plantilla robusta
                                    const templateTypeMobile = getTemplateType(s);
                                    const templateType = getTemplateType(s);
                                    if (isN09TokaSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-solicitud-n09-toka/${s.id_solicitud}`);
                                    } else if (isTukashSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-tukash/${s.id_solicitud}`);
                                    } else if (isSuaInternasSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-sua-internas/${s.id_solicitud}`);
                                    } else if (isSuaFrenshetsiSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-sua-frenshetsi/${s.id_solicitud}`);
                                    } else if (isComisionesSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-comisiones/${s.id_solicitud}`);
                                    } else if (isPolizasSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-polizas/${s.id_solicitud}`);
                                    } else if (isRegresosTransferenciaSolicitud(s)) {
                                      router.push(`/dashboard/solicitante/editar-regresos-transferencia/${s.id_solicitud}`);
                                    } else {
                                      router.push(`/dashboard/solicitante/editar-solicitud/${s.id_solicitud}`);
                                    }
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Editar
                                </button>
                                */}
                                <button
                                  title="Eliminar"
                                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium"
                                  onClick={() => { setSolicitudAEliminar(s); setDeleteModalOpen(true); }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </button>
                              </>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paginación responsiva */}
            <div className="border-t border-blue-100 bg-gradient-to-r from-blue-100/60 to-blue-50/80">
              {/* Información de registros */}
              <div className="px-3 sm:px-6 py-3 sm:py-4">
                <div className="text-xs sm:text-sm text-blue-900 font-medium text-center">
                  Mostrando <span className="font-bold text-blue-700">{filteredSolicitudes.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-700">{filteredSolicitudes.length}</span>
                </div>
              </div>

              {totalPages > 1 && (
                <>
                  {/* Paginador Móvil - Diseño VERTICAL */}
                  <div className="flex md:hidden flex-col items-center gap-2 px-2 py-3 border-t border-blue-100">
                    <div className="text-xs font-medium text-blue-700">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded disabled:bg-gray-300 transition-colors"
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded disabled:bg-gray-300 transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>

                  {/* Paginador Desktop */}
                  <div className="hidden md:flex items-center justify-center gap-2 px-6 py-4 border-t border-blue-100">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === 1 ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >Primera</button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === 1 ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >Anterior</button>
                    <span className="text-blue-900 text-base font-semibold px-2">Página <span className="text-blue-700">{currentPage}</span> de <span className="text-blue-700">{totalPages}</span></span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === totalPages ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >Siguiente</button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === totalPages ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >Última</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Modales */}
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

          <ConfirmDeleteSoli
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title="¿Eliminar solicitud?"
            message="Esta acción eliminará la solicitud de forma permanente. No podrás recuperarla."
            itemName={solicitudAEliminar?.concepto || ''}
            loading={deleting}
          />

          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            title="Exportar Mis Solicitudes"
            description="Selecciona el formato y filtro deseado para exportar tus solicitudes"
            onExportPDF={(filter) => handleExport('pdf', filter)}
            onExportExcel={(filter) => handleExport('excel', filter)}
            onExportCSV={(filter) => handleExport('csv', filter)}
          />
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}

// Componente principal con Suspense
export default function MisSolicitudesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MisSolicitudesContent />
    </Suspense>
  );
}
