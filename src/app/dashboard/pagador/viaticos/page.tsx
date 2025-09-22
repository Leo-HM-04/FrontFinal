"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ViaticosService } from "@/services/viaticos.service";
import type { Viatico as BaseViatico } from "@/services/viaticos.service";
import { 
  FileText, 
  Eye, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Check, 
  X, 
  Filter, 
  Download, 
  User, 
  CreditCard,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from "lucide-react";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ViaticoDetailModal } from '@/components/viaticos/ViaticoDetailModal';
import { 
  exportMisViaticosCSV, 
  exportMisViaticosExcel, 
  exportMisViaticosPDF 
} from '@/utils/exportMisViaticos';

// Tipos mejorados
type Viatico = BaseViatico & {
  usuario_nombre?: string;
  id?: number;
  fecha_limite?: string;
  cuenta_destino?: string;
  banco?: string;
  [key: string]: string | number | boolean | undefined | null;
}

type ViaticoGrouped = {
  usuario: string;
  viaticos: Viatico[];
  totalMonto: number;
  cuentaDestino?: string;
  banco?: string;
}

type NotificationType = 'success' | 'error' | 'info';

type FilterState = {
  usuario: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  banco: string;
}

interface Notification {
  type: NotificationType;
  message: string;
  id: string;
}

// Hook personalizado para notificaciones
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { type, message, id }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, addNotification, removeNotification };
};

// Componente de notificación
const NotificationToast = ({ notification, onRemove }: { 
  notification: Notification; 
  onRemove: (id: string) => void; 
}) => {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[notification.type];

  const Icon = {
    success: Check,
    error: AlertCircle,
    info: AlertCircle
  }[notification.type];

  return (
    <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between min-w-96 max-w-md animate-in slide-in-from-right duration-300`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{notification.message}</span>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="ml-4 text-white/80 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Componente principal
export default function ViaticosPagadorPage() {
  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Estados del modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState<Viatico | null>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState<FilterState>({
    usuario: '',
    estado: 'autorizada',
    fechaDesde: '',
    fechaHasta: '',
    banco: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hook de notificaciones
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Función para cargar viáticos
  const loadViaticos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ViaticosService.getAll();
      setViaticos(data as Viatico[]);
      
      setSelected(new Set());
      setSelectedGroups(new Set());
      
      addNotification('info', `${data.length} viáticos cargados`);
    } catch (error) {
  // console.error('Error cargando viáticos:', error);
      addNotification('error', 'Error al cargar viáticos');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadViaticos();
  }, [loadViaticos]);

  // Cerrar modal de exportación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportModal) {
        const target = event.target as Element;
        if (!target.closest('.export-modal') && !target.closest('.export-modal-content')) {
          setShowExportModal(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportModal]);

  // Viáticos filtrados
  const viaticosFiltrados = useMemo(() => {
    const filtered = viaticos.filter(v => {
      // Filtro por estado
      if (filters.estado && v.estado?.toLowerCase() !== filters.estado.toLowerCase()) {
        return false;
      }
      
      // Filtro por usuario
      if (filters.usuario && !v.usuario_nombre?.toLowerCase().includes(filters.usuario.toLowerCase())) {
        return false;
      }
      
      // Filtro por banco
      if (filters.banco && !v.banco_destino?.toLowerCase().includes(filters.banco.toLowerCase())) {
        return false;
      }
      
      // Filtro por búsqueda general
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          v.folio?.toLowerCase().includes(searchLower) ||
          v.usuario_nombre?.toLowerCase().includes(searchLower) ||
          v.nombre_persona?.toLowerCase().includes(searchLower) ||
          v.departamento?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    return filtered;
  }, [viaticos, filters, searchTerm]);

  // Agrupar viáticos por usuario
  const viaticosAgrupados = useMemo(() => {
    const grupos: { [key: string]: ViaticoGrouped } = {};
    
    viaticosFiltrados.forEach(viatico => {
      const usuario = viatico.usuario_nombre || 'Sin usuario';
      
      if (!grupos[usuario]) {
        grupos[usuario] = {
          usuario,
          viaticos: [],
          totalMonto: 0,
          cuentaDestino: viatico.cuenta_destino,
          banco: viatico.banco_destino
        };
      }
      
      grupos[usuario].viaticos.push(viatico);
      grupos[usuario].totalMonto += Number(viatico.monto) || 0;
    });
    
    return Object.values(grupos);
  }, [viaticosFiltrados]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = viaticosFiltrados.length;
    const seleccionados = selected.size;
    const montoTotal = viaticosFiltrados
      .filter(v => selected.has(v.id_viatico || v.id || 0))
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    
    const totalUsuarios = viaticosAgrupados.length;
    const gruposSeleccionados = selectedGroups.size;

    return { total, seleccionados, montoTotal, totalUsuarios, gruposSeleccionados };
  }, [viaticosFiltrados, selected, viaticosAgrupados, selectedGroups]);

  // Funciones de selección por grupos
  const toggleGroup = useCallback((usuario: string) => {
    const grupo = viaticosAgrupados.find(g => g.usuario === usuario);
    if (!grupo) return;
    
    const grupoIds = grupo.viaticos.map(v => v.id_viatico || v.id || 0);
    const todoSeleccionado = grupoIds.every(id => selected.has(id));
    
    setSelected(prev => {
      const newSet = new Set(prev);
      if (todoSeleccionado) {
        grupoIds.forEach(id => newSet.delete(id));
        setSelectedGroups(prev => {
          const newGroupSet = new Set(prev);
          newGroupSet.delete(usuario);
          return newGroupSet;
        });
      } else {
        grupoIds.forEach(id => newSet.add(id));
        setSelectedGroups(prev => new Set([...prev, usuario]));
      }
      return newSet;
    });
  }, [viaticosAgrupados, selected]);

  const toggleExpanded = useCallback((usuario: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(usuario)) {
        newSet.delete(usuario);
      } else {
        newSet.add(usuario);
      }
      return newSet;
    });
  }, []);

  const toggleOne = useCallback((id: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Función para marcar como pagados
  const handleMarkAsPaid = useCallback(async () => {
    if (selected.size === 0) return;

    setProcessing(true);
    try {
      const selectedIds = Array.from(selected);
      await Promise.all(selectedIds.map(id => ViaticosService.marcarComoPagado(id)));
      
      addNotification('success', `${selected.size} viáticos marcados como pagados`);
      setSelected(new Set());
      setSelectedGroups(new Set());
      await loadViaticos();
    } catch (error) {
  // console.error('Error marcando como pagados:', error);
      addNotification('error', 'Error al marcar como pagados');
    } finally {
      setProcessing(false);
      setShowConfirm(false);
    }
  }, [selected, addNotification, loadViaticos]);

  // Función para ver detalles
  const handleViewDetails = useCallback((viatico: Viatico) => {
    setSelectedViatico(viatico);
    setShowDetailModal(true);
  }, []);

  // Funciones para exportar en diferentes formatos
  const handleExportCSV = useCallback(async () => {
    try {
      setProcessing(true);
      const viaticosParaExportar = viaticosFiltrados.map(v => ({
        ...v,
        monto: Number(v.monto) || 0
      }));
      
      exportMisViaticosCSV(viaticosParaExportar, 'filtrados');
      addNotification('success', 'Archivo CSV exportado correctamente');
    } catch (error) {
  // console.error('Error exportando CSV:', error);
      addNotification('error', 'Error al exportar CSV');
    } finally {
      setProcessing(false);
      setShowExportModal(false);
    }
  }, [viaticosFiltrados, addNotification]);

  const handleExportExcel = useCallback(async () => {
    try {
      setProcessing(true);
      const viaticosParaExportar = viaticosFiltrados.map(v => ({
        ...v,
        monto: Number(v.monto) || 0
      }));
      
      await exportMisViaticosExcel(viaticosParaExportar, 'filtrados');
      addNotification('success', 'Archivo Excel exportado correctamente');
    } catch (error) {
  // console.error('Error exportando Excel:', error);
      addNotification('error', 'Error al exportar Excel');
    } finally {
      setProcessing(false);
      setShowExportModal(false);
    }
  }, [viaticosFiltrados, addNotification]);

  const handleExportPDF = useCallback(async () => {
    try {
      setProcessing(true);
      const viaticosParaExportar = viaticosFiltrados.map(v => ({
        ...v,
        monto: Number(v.monto) || 0
      }));
      
      await exportMisViaticosPDF(viaticosParaExportar, 'filtrados');
      addNotification('success', 'Archivo PDF exportado correctamente');
    } catch (error) {
  // console.error('Error exportando PDF:', error);
      addNotification('error', 'Error al exportar PDF');
    } finally {
      setProcessing(false);
      setShowExportModal(false);
    }
  }, [viaticosFiltrados, addNotification]);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-xl font-medium">Cargando viáticos...</p>
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        {/* Notificaciones flotantes */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header mejorado */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Viáticos Autorizados</h1>
                <p className="text-blue-100 text-lg">
                  Gestiona y procesa los pagos de viáticos agrupados por usuario
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/30"
                >
                  <Filter className="w-5 h-5" />
                  Filtros
                </button>
                
                {/* Botón de exportación */}
                <button
                  onClick={() => setShowExportModal(!showExportModal)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg disabled:opacity-60"
                >
                  <Download className="w-5 h-5" />
                  Exportar
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalUsuarios}</p>
                    <p className="text-blue-100 text-sm">Usuarios</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-blue-100 text-sm">Viáticos</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.seleccionados}</p>
                    <p className="text-blue-100 text-sm">Seleccionados</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-blue-100 text-sm">Monto Total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 animate-in slide-in-from-top duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de búsqueda
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Usuario</label>
                  <input
                    type="text"
                    value={filters.usuario}
                    onChange={(e) => setFilters(prev => ({ ...prev, usuario: e.target.value }))}
                    placeholder="Buscar por nombre de usuario..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Estado</label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="autorizada">Autorizada</option>
                    <option value="pagada">Pagada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Banco</label>
                  <input
                    type="text"
                    value={filters.banco}
                    onChange={(e) => setFilters(prev => ({ ...prev, banco: e.target.value }))}
                    placeholder="Filtrar por banco..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Búsqueda general (folio, usuario, beneficiario, departamento)..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setFilters({
                      usuario: '',
                      estado: 'autorizada',
                      fechaDesde: '',
                      fechaHasta: '',
                      banco: ''
                    });
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Panel de acciones flotante */}
          {selected.size > 0 && (
            <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right duration-300">
              <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 p-6 w-80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Procesar Pagos</h3>
                      <p className="text-xs text-gray-600">{selected.size} seleccionados</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelected(new Set())}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">Monto Total</p>
                    <p className="text-xl font-bold text-blue-700">
                      ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Marcar como Pagados
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Viáticos agrupados */}
          <div className="space-y-4">
            {viaticosAgrupados.map((grupo) => {
              const isExpanded = expandedGroups.has(grupo.usuario);
              const grupoIds = grupo.viaticos.map(v => v.id_viatico || v.id || 0);
              const todoSeleccionado = grupoIds.length > 0 && grupoIds.every(id => selected.has(id));
              const parcialmenteSeleccionado = grupoIds.some(id => selected.has(id)) && !todoSeleccionado;
              
              return (
                <div key={grupo.usuario} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Header del grupo */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleGroup(grupo.usuario)}
                          className="flex items-center justify-center"
                          title={todoSeleccionado ? "Deseleccionar grupo" : "Seleccionar grupo"}
                        >
                          {todoSeleccionado ? (
                            <CheckSquare className="w-6 h-6 text-blue-600" />
                          ) : parcialmenteSeleccionado ? (
                            <div className="w-6 h-6 bg-blue-600 rounded border-2 border-blue-600 relative">
                              <div className="absolute inset-1 bg-white rounded-sm"></div>
                            </div>
                          ) : (
                            <Square className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                          )}
                        </button>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{grupo.usuario}</h3>
                            <p className="text-sm text-gray-600">
                              {grupo.viaticos.length} viático{grupo.viaticos.length !== 1 ? 's' : ''} • 
                              Total: ${grupo.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {grupo.cuentaDestino && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {grupo.cuentaDestino}
                            </p>
                            <p className="text-xs text-gray-600">{grupo.banco}</p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => toggleExpanded(grupo.usuario)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detalles del grupo (expandible) */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-center">
                              <span className="sr-only">Seleccionar</span>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Folio</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Beneficiario</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Banco</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Límite</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cuenta Destino</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Departamento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Monto</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Archivo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {grupo.viaticos.map((viatico) => {
                            const id = viatico.id_viatico || viatico.id || 0;
                            const checked = selected.has(id);
                            
                            return (
                              <tr key={id} className={`${checked ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => toggleOne(id)}
                                    className="flex items-center justify-center"
                                  >
                                    {checked ? (
                                      <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                                    )}
                                  </button>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-700">
                                  {viatico.folio || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {viatico.nombre_persona || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {viatico.banco_destino || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {viatico.fecha_limite_pago 
                                    ? new Date(viatico.fecha_limite_pago).toLocaleDateString('es-MX') 
                                    : '-'
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                                  {viatico.cuenta_destino || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                                  {viatico.departamento || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-green-700">
                                  ${Number(viatico.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {viatico.viatico_url ? (
                                    <a
                                      href={`/uploads/viaticos/${viatico.viatico_url.split('/').pop()}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleViewDetails(viatico)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mensaje cuando no hay datos */}
          {viaticosAgrupados.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No se encontraron viáticos</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) || searchTerm
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay viáticos disponibles en este momento'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal de confirmación */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar pago</h3>
                <p className="text-gray-600 mb-2">
                  Estás a punto de marcar como pagados <strong>{selected.size}</strong> viáticos
                </p>
                <p className="text-lg font-bold text-blue-600 mb-6">
                  Total: ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showDetailModal && selectedViatico && (
          <ViaticoDetailModal
            viatico={selectedViatico}
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedViatico(null);
            }}
          />
        )}

        {/* Modal de exportación */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 export-modal">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 export-modal-content">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-gray-800 to-blue-900 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Exportar Viáticos</h2>
                      <p className="text-gray-300 text-sm">Selecciona el formato para exportar {viaticosFiltrados.length} viáticos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-6 h-6" />
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
                      onClick={handleExportPDF}
                      disabled={processing}
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
                      onClick={handleExportExcel}
                      disabled={processing}
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
                      onClick={handleExportCSV}
                      disabled={processing}
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
                      Los archivos exportados incluirán toda la información disponible de los viáticos
                    </p>
                  </div>
                </div>

                {processing && (
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
      </PagadorLayout>
    </ProtectedRoute>
  );
}