"use client";

import { 
  useEffect, 
  useState, 
  Fragment, 
  useCallback, 
  useRef, 
  useMemo,
  createContext,
  useContext
} from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bell, BellRing, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, Transition } from "@headlessui/react";
import { redirectToEntity, markNotificationAsRead, NotificacionWithRedirect } from "@/utils/notificationRedirect";

// ========================================
// TIPOS Y INTERFACES
// ========================================

interface Notificacion extends NotificacionWithRedirect {
  id_notificacion: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  tipo: NotificationType;
  entidad?: string;
  entidad_id?: number;
  rol?: string;
  accion?: string;
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

interface SolicitanteNotificationsProps {
  open: boolean;
  onClose: () => void;
}

interface SolicitanteNotiContextType {
  refreshNotifications: () => Promise<void>;
  notificaciones: Notificacion[];
  unreadCount: number;
  isLoading: boolean;
}

type FiltroType = 'todas' | 'no_leidas';

// ========================================
// CONSTANTES Y CONFIGURACIÓN
// ========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const ITEMS_PER_PAGE = 10;
const NOTIFICATION_SOUND_PATH = "/assets/audio/elchido.mp3";

// ========================================
// CONTEXTO
// ========================================

const SolicitanteNotiContext = createContext<SolicitanteNotiContextType | undefined>(undefined);

export function useSolicitanteNotiContext() {
  const context = useContext(SolicitanteNotiContext);
  if (!context) {
    throw new Error('useSolicitanteNotiContext debe usarse dentro de un SolicitanteNotiContext.Provider');
  }
  return context;
}

// ========================================
// SERVICIOS Y UTILIDADES
// ========================================

class AuthService {
  static getToken(): string | undefined {
    // Intentar obtener token de localStorage primero
    try {
      const token = localStorage.getItem('auth_token');
      if (token) return token;
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
    }

    // Fallback a cookies
    try {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      return cookieToken;
    } catch (error) {
      console.warn('Error accessing cookies:', error);
      return undefined;
    }
  }

  static getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Cache-Control': 'no-cache'
    };
  }
}

class SolicitanteNotificationService {
  static async fetchNotifications(): Promise<Notificacion[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificaciones/solicitante`,
        { headers: AuthService.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NotificacionRaw[] = await response.json();
      
      console.log('🔍 Frontend recibió datos:', {
        dataLength: data?.length,
        firstItem: data?.[0],
        isArray: Array.isArray(data)
      });
      
      return Array.isArray(data)
        ? data.map((n) => ({
            id_notificacion: n.id_notificacion || n.id || 0,
            mensaje: n.mensaje,
            leida: !!n.leida,
            fecha_creacion: n.fecha_creacion || n.fecha || new Date().toISOString(),
            tipo: n.tipo || 'info' as NotificationType,
          }))
        : [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  static async markAsRead(notificationId: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notificaciones/${notificationId}/marcar-leida`,
        {
          method: 'POST',
          headers: AuthService.getHeaders()
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

  static async markMultipleAsRead(notificationIds: number[]): Promise<void> {
    try {
      await Promise.all(
        notificationIds.map(id => this.markAsRead(id))
      );
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  }
}

class NotificationSoundManager {
  private static instance: NotificationSoundManager;
  private audioRef: HTMLAudioElement | null = null;
  private isUnlocked = false;

  static getInstance(): NotificationSoundManager {
    if (!this.instance) {
      this.instance = new NotificationSoundManager();
    }
    return this.instance;
  }

  initialize(audioElement: HTMLAudioElement | null) {
    this.audioRef = audioElement;
    this.setupAudioUnlock();
  }

  private setupAudioUnlock() {
    if (this.isUnlocked) return;

    const unlockAudio = () => {
      if (this.audioRef && !this.isUnlocked) {
        this.audioRef.play()
          .then(() => {
            this.audioRef!.pause();
            this.audioRef!.currentTime = 0;
            this.isUnlocked = true;
          })
          .catch(() => {
            // Silently handle errors
          });
      }
      
      if (this.isUnlocked) {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }
    };

    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
  }

  async playNotificationSound(): Promise<void> {
    if (!this.audioRef || !this.isUnlocked) return;

    try {
      this.audioRef.currentTime = 0;
      await this.audioRef.play();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }
}

// ========================================
// HOOKS PERSONALIZADOS
// ========================================

function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundManager = useMemo(() => NotificationSoundManager.getInstance(), []);

  useEffect(() => {
    soundManager.initialize(audioRef.current);
  }, [soundManager]);

  const playSound = useCallback(() => {
    soundManager.playNotificationSound();
  }, [soundManager]);

  return { audioRef, playSound };
}

function useGlobalEvents(onOpenModal: () => void, onRefreshCount: () => void) {
  useEffect(() => {
    const handleOpenNotifications = () => onOpenModal();
    const handleRefreshCount = () => onRefreshCount();

    window.addEventListener('openSolicitanteNotifications', handleOpenNotifications);
    window.addEventListener('refreshSolicitanteNotificationsCount', handleRefreshCount);

    return () => {
      window.removeEventListener('openSolicitanteNotifications', handleOpenNotifications);
      window.removeEventListener('refreshSolicitanteNotificationsCount', handleRefreshCount);
    };
  }, [onOpenModal, onRefreshCount]);
}

// ========================================
// COMPONENTES
// ========================================

const LoadingSpinner = ({ size = 5, className = "" }: { size?: number; className?: string }) => (
  <Loader2 className={`w-${size} h-${size} animate-spin ${className}`} />
);

const NotificationIcon = ({ 
  notification, 
  className = "w-4 h-4" 
}: { 
  notification: Notificacion;
  className?: string;
}) => {
  if (!notification.leida) {
    return <BellRing className={`${className} text-blue-600`} />;
  }
  return <Bell className={`${className} text-gray-500`} />;
};

const EmptyNotificationsState = ({ filtro }: { filtro: FiltroType }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
    <Bell className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-600 mb-2">
      No hay notificaciones
    </h3>
    <p className="text-center text-gray-500">
      {filtro === 'no_leidas' 
        ? 'Todas tus notificaciones están marcadas como leídas.' 
        : 'Cuando recibas notificaciones aparecerán aquí.'}
    </p>
  </div>
);

const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  onNotificationClick 
}: { 
  notification: Notificacion;
  onMarkAsRead: (id: number) => Promise<void>;
  onNotificationClick: (notification: Notificacion) => void;
}) => {
  const [isMarking, setIsMarking] = useState(false);

  const { fechaStr, horaStr } = useMemo(() => {
    const fechaObj = notification.fecha_creacion 
      ? new Date(notification.fecha_creacion) 
      : null;
    
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
  }, [notification.fecha_creacion]);

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se dispare el onClick del contenedor
    if (notification.leida || isMarking) return;
    
    setIsMarking(true);
    try {
      await onMarkAsRead(notification.id_notificacion);
    } finally {
      setIsMarking(false);
    }
  };

  const handleNotificationClick = () => {
    onNotificationClick(notification);
  };

  // Determinar si la notificación es clickeable (tiene información para redirigir)
  const isClickable = notification.entidad && notification.entidad_id;

  return (
    <div
      className={`p-4 transition-all duration-200 border-l-4 ${
        !notification.leida 
          ? 'bg-blue-50/50 border-l-blue-500' 
          : 'border-l-transparent'
      } ${isClickable ? 'hover:bg-gray-50 cursor-pointer' : 'hover:bg-gray-25'}`}
      role="listitem"
      onClick={isClickable ? handleNotificationClick : undefined}
      title={isClickable ? 'Hacer clic para ir al elemento' : undefined}
    >
      <div className="flex items-start gap-3">
        <span 
          className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            !notification.leida 
              ? 'bg-blue-100' 
              : 'bg-gray-100'
          }`}
        >
          <NotificationIcon notification={notification} />
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
            {notification.mensaje}
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
        
        {/* Indicador visual de que es clickeable */}
        {isClickable && (
          <div className="ml-2 flex items-center text-blue-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

const LoadMoreButton = ({ 
  onClick, 
  isLoading = false 
}: { 
  onClick: () => void;
  isLoading?: boolean;
}) => (
  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
    <button
      className="w-full px-4 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={4} />
          Cargando...
        </>
      ) : (
        <>
          <ChevronDown className="w-4 h-4" />
          Cargar más notificaciones
        </>
      )}
    </button>
  </div>
);

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function SolicitanteNotifications({ 
  open, 
  onClose 
}: SolicitanteNotificationsProps) {
  useAuth();
  const router = useRouter();

  // Estados
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filtro, setFiltro] = useState<FiltroType>('todas');
  const [pagina, setPagina] = useState(1);
  const [openModal, setOpenModal] = useState(open);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Referencias y hooks personalizados
  const { audioRef, playSound } = useNotificationSound();
  const prevUnreadCount = useRef(0);

  // ========================================
  // FUNCIONES PRINCIPALES
  // ========================================

  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const nuevasNotificaciones = await SolicitanteNotificationService.fetchNotifications();
      
      console.log('🔍 Notificaciones obtenidas:', {
        count: nuevasNotificaciones.length,
        first: nuevasNotificaciones[0],
        unread: nuevasNotificaciones.filter(n => !n.leida).length
      });
      
      // Solo detectar nuevas notificaciones cuando el modal NO está abierto
      // para evitar sonar cuando el usuario está revisando las notificaciones
      if (!openModal) {
        const currentUnreadCount = nuevasNotificaciones.filter(n => !n.leida).length;
        if (currentUnreadCount > prevUnreadCount.current && prevUnreadCount.current > 0) {
          playSound();
          showNewNotificationToast();
        }
        prevUnreadCount.current = currentUnreadCount;
      }
      
      setNotificaciones(nuevasNotificaciones);
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [playSound, openModal]);

  const showNewNotificationToast = () => {
    toast(
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400">
          <BellRing className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h6 className="font-semibold text-blue-700 text-base mb-0.5">
            ¡Nueva notificación!
          </h6>
          <p className="text-gray-700 text-sm">
            Tienes nuevas notificaciones disponibles
          </p>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 5000,
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
      await SolicitanteNotificationService.markAsRead(notificationId);
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
      const unreadIds = unreadNotifications.map(n => n.id_notificacion);
      await SolicitanteNotificationService.markMultipleAsRead(unreadIds);
      await fetchNotificaciones();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Función para manejar el clic en una notificación y redirigir
  const handleNotificationClick = useCallback(async (notification: Notificacion) => {
    try {
      // Marcar como leída si no lo está
      if (!notification.leida) {
        await markNotificationAsRead(notification.id_notificacion);
        await fetchNotificaciones();
      }

      // Redirigir usando el servicio centralizado
      redirectToEntity(
        {
          ...notification,
          rol: 'solicitante' // Asegurar que el rol esté establecido
        },
        router,
        onClose
      );
    } catch (error) {
      console.error('Error al procesar clic en notificación:', error);
    }
  }, [router, onClose, fetchNotificaciones]);

  const handleClose = () => {
    setOpenModal(false);
    window.dispatchEvent(new CustomEvent('refreshSolicitanteNotificationsCount'));
    if (onClose) onClose();
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    // Simular delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setPagina(p => p + 1);
    setLoadingMore(false);
  };

  // ========================================
  // EFECTOS
  // ========================================

  useEffect(() => {
    setOpenModal(open);
  }, [open]);

  useEffect(() => {
    if (openModal) {
      fetchNotificaciones();
    }
  }, [openModal, fetchNotificaciones]);

  // Eventos globales
  useGlobalEvents(
    () => setOpenModal(true),
    fetchNotificaciones
  );

  // ========================================
  // DATOS COMPUTADOS
  // ========================================

  const unreadCount = useMemo(
    () => notificaciones.filter(n => !n.leida).length,
    [notificaciones]
  );

  const notificacionesFiltradas = useMemo(
    () => filtro === 'todas' 
      ? notificaciones 
      : notificaciones.filter(n => !n.leida),
    [notificaciones, filtro]
  );

  const notificacionesPaginadas = useMemo(() => {
    const result = notificacionesFiltradas.slice(0, pagina * ITEMS_PER_PAGE);
    console.log('🔍 Notificaciones paginadas:', {
      total: notificaciones.length,
      filtradas: notificacionesFiltradas.length,
      paginadas: result.length,
      pagina,
      itemsPerPage: ITEMS_PER_PAGE,
      filtro
    });
    return result;
  }, [notificacionesFiltradas, pagina, notificaciones.length, filtro]);

  const hasMoreNotifications = notificacionesFiltradas.length > pagina * ITEMS_PER_PAGE;

  const contextValue = useMemo<SolicitanteNotiContextType>(() => ({
    refreshNotifications: fetchNotificaciones,
    notificaciones,
    unreadCount,
    isLoading: loading
  }), [fetchNotificaciones, notificaciones, unreadCount, loading]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <SolicitanteNotiContext.Provider value={contextValue}>
      <audio 
        ref={audioRef} 
        src={NOTIFICATION_SOUND_PATH} 
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

      <Transition.Root show={openModal} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-blue-100 flex flex-col h-[calc(100vh-4rem)]">
                
                {/* HEADER */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6 flex-shrink-0">
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
                      onClick={() => { setFiltro('todas'); setPagina(1); }}
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
                      onClick={() => { setFiltro('no_leidas'); setPagina(1); }}
                      aria-pressed={filtro === 'no_leidas'}
                    >
                      No leídas
                    </button>
                    
                    {unreadCount > 0 && (
                      <button
                        className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                      <h3 className="font-medium text-lg mb-2">Error al cargar</h3>
                      <p className="text-sm text-gray-600 mb-4">{error}</p>
                      <button 
                        onClick={fetchNotificaciones}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                  <EmptyNotificationsState filtro={filtro} />
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div 
                      className="overflow-y-auto flex-1 divide-y divide-gray-100"
                      role="list"
                      aria-label="Lista de notificaciones"
                    >
                      {notificacionesPaginadas.map((notification) => (
                        <NotificationItem
                          key={notification.id_notificacion}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onNotificationClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                    
                    {hasMoreNotifications && (
                      <LoadMoreButton
                        onClick={handleLoadMore}
                        isLoading={loadingMore}
                      />
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </SolicitanteNotiContext.Provider>
  );
}