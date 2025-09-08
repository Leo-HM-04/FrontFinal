'use client';

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
import { Solicitud } from '@/types';
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
  Edit,
  Trash2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
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

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// ========= Subcomponentes a nivel de módulo (memoizados) =========
const SortableHeader = memo(function SortableHeader({
  field,
  children,
  className = 'px-6 py-4 text-left text-sm font-semibold text-gray-900',
  sortField,
  sortOrder,
  onSort,
}: {
  field?: SortField;
  children: React.ReactNode;
  className?: string;
  sortField?: SortField | null;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}) {
  if (!field) {
    return <th className={className}>{children}</th>;
  }
  const handleClick = () => onSort && onSort(field);

  return (
    <th
      className={`${className} cursor-pointer hover:bg-gray-100 transition-colors select-none`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 ${
              sortField === field && sortOrder === 'asc'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 ${
              sortField === field && sortOrder === 'desc'
                ? 'text-blue-600'
                : 'text-gray-400'
            }`}
          />
        </div>
      </div>
    </th>
  );
});

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
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
        const data = await SolicitudesService.getMySolicitudes();
        if (isMounted) {
          const sorted = data.sort(
            (a, b) =>
              new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
          );
          setSolicitudes(sorted);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error al cargar solicitudes:', err);
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
  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return prevField;
      } else {
        setSortOrder('desc');
        return field;
      }
    });
  }, []);

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
    } catch (error) {
      console.error('Error al exportar:', error);
      // Aquí podrías mostrar una notificación de error al usuario
    }

    setShowExportModal(false);
  };

  const handleViewDetails = (solicitud: Solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async () => {
    if (!solicitudAEliminar) return;
    setDeleting(true);

    try {
      await SolicitudesService.deleteSolicitante(solicitudAEliminar.id_solicitud);
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
      console.error('Error al eliminar solicitud:', err);
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

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortableHeader>Folio</SortableHeader>
                    <SortableHeader
                      field="hora"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Hora de envío
                    </SortableHeader>
                    <SortableHeader>Concepto</SortableHeader>
                    <SortableHeader
                      field="monto"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Monto
                    </SortableHeader>
                    <SortableHeader>Cuenta</SortableHeader>
                    <SortableHeader
                      field="estado"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    >
                      Estado
                    </SortableHeader>
                    <SortableHeader
                      field="fecha"
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                    >
                      Fecha
                    </SortableHeader>
                    <SortableHeader className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Acciones
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentSolicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {searchTerm || statusFilter || dateFilter
                              ? 'No se encontraron solicitudes'
                              : 'No tienes solicitudes aún'}
                          </h3>
                          <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter || dateFilter
                              ? 'Intenta ajustar los filtros de búsqueda'
                              : 'Crea tu primera solicitud de pago'}
                          </p>
                          {!searchTerm && !statusFilter && !dateFilter && (
                            <Button
                              onClick={() =>
                                router.push('/dashboard/solicitante/nueva-solicitud')
                              }
                              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Nueva Solicitud
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentSolicitudes.map((solicitud) => {
                      const estadoConfig = getEstadoConfig(solicitud.estado);
                      const isHighlighted = highlightedId === solicitud.id_solicitud;
                      return (
                        <tr
                          key={solicitud.id_solicitud}
                          className={`hover:bg-gray-50 transition-colors ${
                            isHighlighted
                              ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset animate-pulse'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm font-semibold text-gray-900">
                              {solicitud.folio || '-'}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatTime(solicitud.fecha_creacion)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatShortDate(solicitud.fecha_creacion)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="font-medium text-gray-900 truncate">
                                {solicitud.concepto}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {solicitud.departamento}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(solicitud.monto)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono">
                              {solicitud.cuenta_destino}
                            </div>
                            <div className="text-xs text-gray-500">
                              {solicitud.banco_destino}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${estadoConfig.color}`}
                            >
                              {estadoConfig.icon}
                              <span className="ml-1.5 capitalize">{solicitud.estado}</span>
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatShortDate(solicitud.fecha_creacion)}
                            </div>
                            {solicitud.fecha_limite_pago && (
                              <div className="text-xs text-gray-500">
                                Límite:{' '}
                                {formatShortDate(solicitud.fecha_limite_pago)}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(solicitud)}
                                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver
                              </Button>

                              {solicitud.estado?.toLowerCase() === 'pendiente' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/solicitante/editar-solicitud/${solicitud.id_solicitud}`
                                      )
                                    }
                                    className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSolicitudAEliminar(solicitud);
                                      setDeleteModalOpen(true);
                                    }}
                                    className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Eliminar
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando{' '}
                    <span className="font-semibold text-gray-900">
                      {filteredSolicitudes.length === 0 ? 0 : startIndex + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-semibold text-gray-900">{endIndex}</span> de{' '}
                    <span className="font-semibold text-gray-900">
                      {filteredSolicitudes.length}
                    </span>{' '}
                    resultados
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                        ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        }`}
                    >
                      ⏮ Primera
                    </button>

                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                        ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        }`}
                    >
                      ← Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum =
                          Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 min-w-[44px]
                              ${
                                pageNum === currentPage
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                        ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        }`}
                    >
                      Siguiente →
                    </button>

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                        ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                        }`}
                    >
                      Última ⏭
                    </button>
                  </div>
                </div>
              </div>
            )}
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
