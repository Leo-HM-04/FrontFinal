"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ViaticosService } from "@/services/viaticos.service";
import type { Viatico as BaseViatico } from "@/services/viaticos.service";
import { FileText, Eye, Search, CheckSquare, Square, AlertCircle, Check, X } from "lucide-react";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ViaticoDetailModal } from '@/components/viaticos/ViaticoDetailModal';

// Tipos mejorados
type Viatico = BaseViatico & {
  usuario_nombre?: string;
  id?: number;
  [key: string]: string | number | boolean | undefined | null;
}

type NotificationType = 'success' | 'error' | 'info';

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
    
    // Auto-remover después de 5 segundos
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

// Componente principal mejorado
export default function ViaticosPagadorPage() {
  // Estados principales
  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Estados de filtrado y búsqueda
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('todos');
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [busquedaGeneral, setBusquedaGeneral] = useState("");
  
  // Estados del modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState<Viatico | null>(null);
  
  // Hook de notificaciones
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Función para cargar viáticos
  const loadViaticos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ViaticosService.getAll();
      setViaticos(data as Viatico[]);
      
      // Limpiar selección al recargar
      setSelected(new Set());
      
      addNotification('info', `${data.length} viáticos cargados`);
    } catch (error) {
      console.error('Error cargando viáticos:', error);
      addNotification('error', 'Error al cargar viáticos');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Cargar datos iniciales
  useEffect(() => {
    loadViaticos();
  }, [loadViaticos]);

  // Usuarios únicos memoizados
  const usuariosUnicos = useMemo(() => {
    return Array.from(new Set(viaticos.map(v => v.usuario_nombre || 'Sin usuario')));
  }, [viaticos]);

  // Usuarios filtrados por búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!busquedaUsuario.trim()) return usuariosUnicos;
    return usuariosUnicos.filter(u => 
      u.toLowerCase().includes(busquedaUsuario.trim().toLowerCase())
    );
  }, [usuariosUnicos, busquedaUsuario]);

  // Viáticos filtrados
  const viaticosFiltrados = useMemo(() => {
    let filtered = viaticos;

    // Filtrar por usuario
    if (usuarioSeleccionado !== 'todos') {
      filtered = filtered.filter(v => 
        (v.usuario_nombre || 'Sin usuario') === usuarioSeleccionado
      );
    }

    // Filtrar por búsqueda general
    if (busquedaGeneral.trim()) {
      const searchTerm = busquedaGeneral.trim().toLowerCase();
      filtered = filtered.filter(v =>
        (v.folio?.toString() || '').toLowerCase().includes(searchTerm) ||
        (v.nombre_persona || '').toLowerCase().includes(searchTerm) ||
        (v.banco_destino || '').toLowerCase().includes(searchTerm) ||
        (v.departamento || '').toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [viaticos, usuarioSeleccionado, busquedaGeneral]);

  // Estadísticas memoizadas
  const stats = useMemo(() => {
    const total = viaticosFiltrados.length;
    const seleccionados = selected.size;
    const montoTotal = viaticosFiltrados
      .filter(v => selected.has(v.id_viatico || v.id || 0))
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);

    return { total, seleccionados, montoTotal };
  }, [viaticosFiltrados, selected]);

  // Funciones de selección optimizadas
  const toggleAll = useCallback(() => {
    const allIds = viaticosFiltrados.map(v => v.id_viatico || v.id || 0);
    const allSelected = allIds.every(id => selected.has(id));
    
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  }, [viaticosFiltrados, selected]);

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
      await loadViaticos();
    } catch (error) {
      console.error('Error marcando como pagados:', error);
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

  // Estado de selección para el checkbox principal
  const allIds = viaticosFiltrados.map(v => v.id_viatico || v.id || 0);
  const isAllSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const isIndeterminate = selected.size > 0 && !isAllSelected;

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-xl font-medium">Cargando viáticos...</p>
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
          {/* Header mejorado con estadísticas */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-3xl font-extrabold text-white font-sans mb-4 text-center">
              Viáticos para pagar <span className="hidden sm:inline">(Pagador)</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-white/80 text-sm">Total viáticos</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-300">{stats.seleccionados}</div>
                <div className="text-white/80 text-sm">Seleccionados</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-300">
                  ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-white/80 text-sm">Monto seleccionado</div>
              </div>
            </div>
          </div>

          {/* Controles de filtrado mejorados */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Búsqueda de usuarios */}
              <div>
                <label className="block text-white font-medium mb-2">Buscar usuario</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-blue-900 placeholder-blue-400"
                    value={busquedaUsuario}
                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                  />
                </div>
              </div>

              {/* Búsqueda general */}
              <div>
                <label className="block text-white font-medium mb-2">Búsqueda general</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por folio, beneficiario, banco..."
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-blue-900 placeholder-blue-400"
                    value={busquedaGeneral}
                    onChange={(e) => setBusquedaGeneral(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filtros de usuario */}
            <div className="mt-6">
              <label className="block text-white font-medium mb-3">Filtrar por usuario</label>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    usuarioSeleccionado === 'todos'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/80 text-blue-800 hover:bg-white'
                  }`}
                  onClick={() => setUsuarioSeleccionado('todos')}
                >
                  Todos ({viaticos.length})
                </button>
                {usuariosFiltrados.map(usuario => {
                  const count = viaticos.filter(v => 
                    (v.usuario_nombre || 'Sin usuario') === usuario
                  ).length;
                  
                  return (
                    <button
                      key={usuario}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        usuario === usuarioSeleccionado
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white/80 text-blue-800 hover:bg-white'
                      }`}
                      onClick={() => setUsuarioSeleccionado(usuario)}
                    >
                      {usuario} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabla mejorada */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <button
                        onClick={toggleAll}
                        className="flex items-center justify-center w-full"
                        title={isAllSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : isIndeterminate ? (
                          <div className="w-5 h-5 bg-blue-600 rounded border-2 border-blue-600 relative">
                            <div className="absolute inset-1 bg-white rounded-sm"></div>
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Folio</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Usuario</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Beneficiario</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Banco</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Fecha límite</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Tipo cuenta</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Departamento</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Monto</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wide">Cuenta Destino</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wide">Archivo</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {viaticosFiltrados.map((v: Viatico) => {
                    const id = (v.id_viatico || v.id || 0) as number;
                    const checked = selected.has(id);
                    
                    return (
                      <tr
                        key={id}
                        className={`transition-colors duration-150 ${
                          checked ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleOne(id)}
                            className="flex items-center justify-center w-full"
                            title={checked ? `Deseleccionar viático ${id}` : `Seleccionar viático ${id}`}
                          >
                            {checked ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-700 font-mono font-bold">
                          {v.folio || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-800 font-medium">
                          {v.usuario_nombre || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {v.nombre_persona || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {v.banco_destino || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {v.fecha_limite_pago 
                            ? new Date(v.fecha_limite_pago).toLocaleDateString('es-MX') 
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {[v.tipo_cuenta_destino, v.tipo_tarjeta].filter(Boolean).join(' / ') || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {v.departamento || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-base font-bold text-green-700">
                          {v.monto !== undefined 
                            ? `$${Number(v.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {v.cuenta_destino || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {v.viatico_url ? (
                            <a
                              href={`/uploads/viaticos/${v.viatico_url.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              v.estado?.toLowerCase() === 'autorizada'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : v.estado?.toLowerCase() === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : v.estado?.toLowerCase() === 'rechazada'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}
                          >
                            {v.estado || 'Sin estado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewDetails(v)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
                            title="Ver detalles del viático"
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
          </div>

          {/* Mensaje cuando no hay datos */}
          {viaticosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No se encontraron viáticos</h3>
              <p className="text-white/70">
                {busquedaGeneral || usuarioSeleccionado !== 'todos' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay viáticos disponibles en este momento'
                }
              </p>
            </div>
          )}
        </div>

        {/* Barra de acciones flotante mejorada */}
        {selected.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-2xl border-t-4 border-blue-400">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-yellow-300">{selected.size}</div>
                    <div className="text-sm text-white/80">Seleccionados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-300">
                      ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-white/80">Total a pagar</div>
                  </div>
                </div>
                
                <button
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 border-2 border-white/30"
                  onClick={() => setShowConfirm(true)}
                  disabled={processing}
                >
                  <Check className="w-6 h-6" />
                  {processing ? 'Procesando...' : 'Marcar como pagados'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación mejorado */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar pago</h3>
                <p className="text-gray-600 mb-2">
                  Estás a punto de marcar como pagados <strong>{selected.size}</strong> viáticos
                </p>
                <p className="text-lg font-bold text-green-600 mb-6">
                  Total: ${stats.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Esta acción no se puede deshacer
                </p>
                
                <div className="flex gap-4">
                  <button
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    onClick={() => setShowConfirm(false)}
                    disabled={processing}
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                    onClick={handleMarkAsPaid}
                    disabled={processing}
                  >
                    {processing ? 'Procesando...' : 'Confirmar pago'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        <ViaticoDetailModal
          isOpen={showDetailModal}
          viatico={selectedViatico}
          onClose={() => setShowDetailModal(false)}
        />
      </PagadorLayout>
    </ProtectedRoute>
  );
}