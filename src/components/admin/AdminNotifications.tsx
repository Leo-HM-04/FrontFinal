"use client";

import { 
  useEffect, 
  useState, 
  useCallback, 
  useRef, 
  createContext, 
  useContext,
  useMemo 
} from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Fragment } from "react";
import { Bell, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, Transition } from "@headlessui/react";
import { getAuthToken } from "@/utils/auth";

// ========================================
// TIPOS Y INTERFACES
// ========================================

interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
  tipo: NotificationType;
}

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificacionRaw {
  id_notificacion?: number;
  id?: number;
  mensaje: string;
  leida: boolean;
  fecha?: string;
  fecha_creacion?: string;
  tipo?: NotificationType;
}

interface AdminNotificationsProps {
  open: boolean;
  onClose: () => void;
}

interface NotiContextType {
  refreshNotificaciones: () => Promise<void>;
  notificaciones: Notificacion[];
  unreadCount: number;
}

type FiltroType = 'todas' | 'no_leidas';

// ========================================
// CONSTANTES
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000";
const ITEMS_PER_PAGE = 7;
const SCROLL_THRESHOLD = 10;
const LOAD_MORE_DELAY = 300;

// ========================================
// CONTEXTO
// ========================================

const NotiContext = createContext<NotiContextType | undefined>(undefined);

export function useNotiContext() {
  const context = useContext(NotiContext);
  if (!context) {
    throw new Error('useNotiContext debe usarse dentro de un NotiContext.Provider');
  }
  return context;
}

// ========================================
// UTILIDADES
// ========================================

class NotificationFormatter {
  private static readonly PATTERNS = [
    {
      regex: /cre[oó] usuario.*Nombre: ([^,\n]+),?/i,
      format: (match: RegExpMatchArray) => `Nuevo usuario agregado: ${match[1].trim()}`
    },
    {
      regex: /elimin[oó] usuario.*Nombre: ([^,\n]+),?/i,
      format: (match: RegExpMatchArray) => `Usuario eliminado: ${match[1].trim()}`
    },
    {
      regex: /actualiz[oó] usuario.*Nombre: ([^,\n]+),?/i,
      format: (match: RegExpMatchArray) => `Usuario actualizado: ${match[1].trim()}`
    },
    {
      regex: /El usuario ([^ ]+) \(([^)]+)\) cre[oó] solicitud/i,
      format: (match: RegExpMatchArray) => {
        const [, nombre, rol] = match;
        const rolFormatted = rol.toLowerCase().includes('solicitante') 
          ? 'Solicitante' 
          : rol.toLowerCase().includes('admin') 
            ? 'Administrador' 
            : rol.charAt(0).toUpperCase() + rol.slice(1);
        return `${rolFormatted} ${nombre} creó una solicitud`;
      }
    }
  ];

  static format(mensaje: string): string {
    for (const pattern of this.PATTERNS) {
      const match = mensaje.match(pattern.regex);
      if (match) {
        return pattern.format(match);
      }
    }

    // Patrones generales
    if (/cre[oó] solicitud/i.test(mensaje)) return 'Nueva solicitud creada';
    if (/actualiz[oó] solicitud/i.test(mensaje)) return 'Solicitud actualizada';
    if (/elimin[oó] solicitud/i.test(mensaje)) return 'Solicitud eliminada';
    if (/usuario/i.test(mensaje)) return 'Acción realizada sobre usuario';
    if (/solicitud/i.test(mensaje)) return 'Acción realizada sobre solicitud';
    
    return 'Nueva notificación';
  }
}

class NotificationService {
  private static getHeaders() {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  static async fetchNotifications(): Promise<Notificacion[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notificaciones`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return Array.isArray(data)
        ? data
            .filter((n: NotificacionRaw) => !n.mensaje.includes('temporizador'))
            .map((n: NotificacionRaw) => ({
              id: n.id_notificacion ?? n.id ?? 0,
              mensaje: n.mensaje,
              leida: n.leida,
              fecha: n.fecha ?? n.fecha_creacion ?? '',
              tipo: n.tipo ?? 'info' as NotificationType
            }))
        : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notificaciones/${notificationId}/marcar-leida`,
        {
          method: 'POST',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(notificationIds: number[]): Promise<void> {
    try {
      await Promise.all(
        notificationIds.map(id => this.markAsRead(id))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

// ========================================
// COMPONENTES
// ========================================

const LoadingSpinner = ({ size = 5 }: { size?: number }) => (
  <Loader2 className={`w-${size} h-${size} animate-spin`} />
);

const NotificationIcon = ({ tipo }: { tipo: NotificationType }) => {
  const iconClass = "w-4 h-4";
  
  switch (tipo) {
    case 'success': return <Check className={iconClass} />;
    case 'warning': return <AlertCircle className={iconClass} />;
    case 'error': return <X className={iconClass} />;
    default: return <Bell className={iconClass} />;
  }
};

const EmptyState = ({ filtro }: { filtro: FiltroType }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
    <Bell className="w-12 h-12 text-gray-400 mb-3" />
    <p className="text-center font-medium">
      No hay notificaciones {filtro === 'no_leidas' ? 'sin leer' : ''}.
    </p>
  </div>
);

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notificacion;
  onMarkAsRead: (id: number) => Promise<void>;
}) => {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.leida || isMarking) return;
    
    setIsMarking(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarking(false);
    }
  };

  const { fechaStr, horaStr } = useMemo(() => {
    const fechaObj = notification.fecha ? new Date(notification.fecha) : null;
    const isValidDate = fechaObj && !isNaN(fechaObj.getTime());
    
    return {
      fechaStr: isValidDate 
        ? fechaObj.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })
        : '',
      horaStr: isValidDate 
        ? fechaObj.toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : ''
    };
  }, [notification.fecha]);

  const mensajeFormateado = useMemo(
    () => NotificationFormatter.format(notification.mensaje),
    [notification.mensaje]
  );

  return (
    <div
      className={`p-4 transition-all duration-200 hover:bg-gray-50 border-l-4 ${
        !notification.leida 
          ? 'bg-blue-50/50 border-l-blue-500' 
          : 'border-l-transparent'
      }`}
      role="listitem"
    >
      <div className="flex items-start gap-3">
        <span 
          className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            !notification.leida 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <NotificationIcon tipo={notification.tipo} />
          {!notification.leida && (
            <span 
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
              aria-label="No leída"
            />
          )}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-5 ${
            !notification.leida 
              ? 'text-blue-900 font-medium' 
              : 'text-gray-700'
          }`}>
            {mensajeFormateado}
          </p>
          
          {(fechaStr || horaStr) && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              {fechaStr && <span>{fechaStr}</span>}
              {fechaStr && horaStr && (
                <span className="w-1 h-1 rounded-full bg-gray-300" />
              )}
              {horaStr && <span>{horaStr}</span>}
            </div>
          )}
        </div>
        
        {!notification.leida && (
          <button
            onClick={handleMarkAsRead}
            disabled={isMarking}
            className="ml-2 px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title="Marcar como leída"
            aria-label="Marcar notificación como leída"
          >
            {isMarking ? (
              <LoadingSpinner size={3} />
            ) : (
              'Marcar como leída'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function AdminNotifications({ open, onClose }: AdminNotificationsProps) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filtro, setFiltro] = useState<FiltroType>('todas');
  const [pagina, setPagina] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const prevNotiIds = useRef<Set<number>>(new Set());

  // ========================================
  // FUNCIONES
  // ========================================

  const fetchNotificaciones = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const nuevasNotificaciones = await NotificationService.fetchNotifications();
      
      // Detectar nuevas notificaciones no leídas
      const nuevasNoLeidas = nuevasNotificaciones.filter(
        n => !n.leida && !prevNotiIds.current.has(n.id)
      );
      
      if (nuevasNoLeidas.length > 0 && prevNotiIds.current.size > 0) {
        handleNewNotifications(nuevasNoLeidas);
      }
      
      prevNotiIds.current = new Set(nuevasNotificaciones.map(n => n.id));
      setNotificaciones(nuevasNotificaciones);
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleNewNotifications = (nuevasNotificaciones: Notificacion[]) => {
    const ultimaNotificacion = nuevasNotificaciones[0];
    
    // Reproducir sonido
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Silently handle audio play errors (user interaction required)
      });
    }
    
    // Mostrar toast
    toast(
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
          <NotificationIcon tipo={ultimaNotificacion.tipo} />
        </span>
        <div className="flex-1 min-w-0">
          <h6 className="font-semibold text-blue-700 text-base mb-0.5">
            ¡Nueva notificación!
          </h6>
          <p className="text-gray-700 text-sm leading-snug line-clamp-2">
            {NotificationFormatter.format(ultimaNotificacion.mensaje)}
          </p>
        </div>
      </div>,
      {
        toastId: `noti-${ultimaNotificacion.id}`,
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        className: "!bg-white !shadow-xl !shadow-blue-500/10 !border !border-blue-100 !rounded-2xl !p-4"
      }
    );
  };

  const handleMarkAsRead = useCallback(async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await fetchNotificaciones();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [fetchNotificaciones]);

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notificaciones.filter(n => !n.leida);
    if (unreadNotifications.length === 0) return;

    setMarkingAll(true);
    try {
      const unreadIds = unreadNotifications.map(n => n.id);
      await NotificationService.markAllAsRead(unreadIds);
      await fetchNotificaciones();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };


  // ========================================
  // DATOS COMPUTADOS
  // ========================================

  const notificacionesOrdenadas = useMemo(() => 
    [...notificaciones].sort((a, b) => {
      if (a.leida === b.leida) {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      }
      return a.leida ? 1 : -1;
    }),
    [notificaciones]
  );

  const notificacionesFiltradas = useMemo(() =>
    notificacionesOrdenadas.filter(n =>
      filtro === 'todas' ? true : !n.leida
    ),
    [notificacionesOrdenadas, filtro]
  );

  const notificacionesPaginadas = useMemo(() =>
    notificacionesFiltradas.slice(0, pagina * ITEMS_PER_PAGE),
    [notificacionesFiltradas, pagina]
  );

  const unreadCount = useMemo(() =>
    notificaciones.filter(n => !n.leida).length,
    [notificaciones]
  );

  // ========================================
  // EFECTOS
  // ========================================

  useEffect(() => {
    if (!open || !user) return;
    fetchNotificaciones();
  }, [open, user, fetchNotificaciones]);

  useEffect(() => {
    const handleScroll = () => {
      const el = listaRef.current;
      if (!el || loadingMore) return;
      
      const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD;
      const hasMoreItems = notificacionesFiltradas.length > pagina * ITEMS_PER_PAGE;
      
      if (isNearBottom && hasMoreItems) {
        setLoadingMore(true);
        setTimeout(() => {
          setPagina(p => p + 1);
          setLoadingMore(false);
        }, LOAD_MORE_DELAY);
      }
    };

    const el = listaRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [pagina, loadingMore, notificacionesFiltradas.length]);

  // ========================================
  // CONTEXTO PROVIDER VALUE
  // ========================================

  const contextValue = useMemo<NotiContextType>(() => ({
    refreshNotificaciones: fetchNotificaciones,
    notificaciones,
    unreadCount
  }), [fetchNotificaciones, notificaciones, unreadCount]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <NotiContext.Provider value={contextValue}>
      <audio 
        ref={audioRef} 
        src="/assets/audio/bell-notification.mp3" 
        preload="auto" 
        aria-hidden="true"
      />
      
      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        theme="light"
        className="!z-[9999]"
      />

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-[60] flex items-start justify-end p-4 sm:p-6 lg:p-8">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-blue-100 flex flex-col max-h-[90vh]">
                {/* HEADER */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-white" />
                      <Dialog.Title className="text-lg font-bold text-white">
                        Notificaciones
                      </Dialog.Title>
                    </div>
                    <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                      {unreadCount} nuevas
                    </span>
                  </div>

                  {/* FILTROS Y ACCIONES */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        filtro === 'todas' 
                          ? 'bg-white text-blue-600' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      onClick={() => setFiltro('todas')}
                      aria-pressed={filtro === 'todas'}
                    >
                      Todas
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        filtro === 'no_leidas' 
                          ? 'bg-white text-blue-600' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      onClick={() => setFiltro('no_leidas')}
                      aria-pressed={filtro === 'no_leidas'}
                    >
                      No leídas
                    </button>
                    
                    {unreadCount > 0 && (
                      <button
                        className={`ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 disabled:cursor-not-allowed`}
                        onClick={handleMarkAllAsRead}
                        disabled={markingAll}
                        aria-label="Marcar todas las notificaciones como leídas"
                      >
                        {markingAll ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size={3} />
                            Marcando...
                          </div>
                        ) : (
                          'Marcar todas como leídas'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* CONTENIDO */}
                {error ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-red-600 text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">{error}</p>
                      <button 
                        onClick={fetchNotificaciones}
                        className="mt-2 text-blue-600 hover:underline text-sm"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex items-center gap-3 text-blue-600 font-medium">
                      <LoadingSpinner />
                      Cargando notificaciones...
                    </div>
                  </div>
                ) : notificacionesFiltradas.length === 0 ? (
                  <EmptyState filtro={filtro} />
                ) : (
                  <div>
                    <div 
                      ref={listaRef} 
                      className="overflow-y-auto max-h-[60vh] divide-y divide-gray-100"
                      role="list"
                      aria-label="Lista de notificaciones"
                    >
                      {notificacionesPaginadas.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                        />
                      ))}
                      
                      {loadingMore && (
                        <div className="flex items-center justify-center py-4 gap-3 text-blue-600 font-medium">
                          <LoadingSpinner />
                          Cargando más notificaciones...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </NotiContext.Provider>
  );
}