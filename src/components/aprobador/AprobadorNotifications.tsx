'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bell, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, Transition } from "@headlessui/react";

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: number;
  message: string;
  read: boolean;
  date: string;
  type?: NotificationType;
}

type RawNotification = {
  id_notificacion?: number;
  id?: number;
  mensaje: string;
  leida: boolean;
  fecha?: string;
  fecha_creacion?: string;
  tipo?: NotificationType;
}

interface NotificationsProps {
  open: boolean;
  onClose: () => void;
}

const NotificationIcon = ({ type, className }: { type?: NotificationType, className?: string }) => {
  switch (type) {
    case 'success':
      return <Check className={className} />;
    case 'warning':
      return <AlertCircle className={className} />;
    case 'error':
      return <X className={className} />;
    default:
      return <Bell className={className} />;
  }
};

const NotificationBadge = ({ count }: { count: number }) => (
  <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
    {count} nueva{count !== 1 ? 's' : ''}
  </span>
);

const FilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode 
}) => (
  <button
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-white text-blue-600 shadow-sm' : 'bg-white/20 text-white hover:bg-white/30'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

export default function Notifications({ open, onClose }: NotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const perPage = 10;
  const prevNotificationIds = useRef<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio and setup event listeners
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const getAuthToken = useCallback(() => {
    try {
      return localStorage.getItem('auth_token') || undefined;
    } catch {
      try {
        return document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
      } catch {
        return undefined;
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/notificaciones`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      
      const data: RawNotification[] = await response.json();
      
      const normalizedNotifications = Array.isArray(data)
        ? data.map((n) => ({
            id: n.id_notificacion ?? n.id ?? 0,
            message: n.mensaje,
            read: n.leida,
            date: n.fecha ?? n.fecha_creacion ?? '',
            type: n.tipo ?? 'info',
          }))
        : [];

      // Show toast for new unread notifications
      const newUnread = normalizedNotifications.filter(n => !n.read && !prevNotificationIds.current.has(n.id));
      if (newUnread.length > 0) {
        const latestNotification = newUnread[0];
        
        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        
        toast(
          <div className="flex items-center gap-3">
            <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full shadow-lg ${
              latestNotification.type === 'success' ? 'bg-green-500 shadow-green-500/30' :
              latestNotification.type === 'warning' ? 'bg-yellow-500 shadow-yellow-500/30' :
              latestNotification.type === 'error' ? 'bg-red-500 shadow-red-500/30' :
              'bg-blue-500 shadow-blue-500/30'
            }`}>
              <NotificationIcon type={latestNotification.type} className="w-5 h-5 text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <h6 className="font-semibold text-gray-800 text-base mb-0.5">¡Nueva notificación!</h6>
              <p className="text-gray-600 text-sm leading-snug line-clamp-2">{latestNotification.message}</p>
            </div>
          </div>,
          {
            toastId: `noti-${latestNotification.id}`,
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: "!bg-white !shadow-xl !shadow-gray-500/10 !border !border-gray-200 !rounded-2xl !p-4"
          }
        );
      }
      
      prevNotificationIds.current = new Set(normalizedNotifications.map(n => n.id));
      setNotifications(normalizedNotifications);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotifications();
    setPage(1);
  }, [open, user, fetchNotifications]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const token = getAuthToken();
    
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/notificaciones/${n.id}/marcar-leida`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })
      ));
      
      await fetchNotifications();
      toast.success("Todas las notificaciones marcadas como leídas");
    } finally {
      setMarkingAll(false);
    }
  };

  const markAsRead = async (id: number) => {
    const token = getAuthToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/notificaciones/${id}/marcar-leida`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    });
    await fetchNotifications();
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.read
  ).sort((a, b) => (a.read === b.read) ? 0 : a.read ? 1 : -1);

  const paginatedNotifications = filteredNotifications.slice(0, page * perPage);
  const canLoadMore = paginatedNotifications.length < filteredNotifications.length;

  const formatDate = (dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    if (!date || isNaN(date.getTime())) return { dateStr: '', timeStr: '' };
    
    return {
      dateStr: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <>
      <audio ref={audioRef} src="/assets/audio/bell-notification.mp3" preload="auto" />
      
      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all border border-gray-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-white" />
                      <Dialog.Title className="text-lg font-bold text-white">Notificaciones</Dialog.Title>
                    </div>
                    <NotificationBadge count={notifications.filter(n => !n.read).length} />
                  </div>

                  {/* Filters */}
                  <div className="flex items-center gap-2 mt-4">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                      Todas
                    </FilterButton>
                    <FilterButton active={filter === 'unread'} onClick={() => setFilter('unread')}>
                      No leídas
                    </FilterButton>
                    {notifications.some(n => !n.read) && (
                      <button
                        className={`ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/20 text-white hover:bg-white/30 ${
                          markingAll ? 'opacity-60 pointer-events-none' : ''
                        }`}
                        onClick={markAllAsRead}
                        disabled={markingAll}
                      >
                        {markingAll ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Marcando...
                          </span>
                        ) : (
                          'Marcar todas como leídas'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cargando notificaciones...
                      </div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                      <Bell className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-center font-medium">
                        No hay notificaciones {filter === 'unread' ? 'sin leer' : ''}.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="overflow-y-auto divide-y divide-gray-100 flex-1"
                        onScroll={async e => {
                          const target = e.currentTarget;
                          if (
                            !loadingMore &&
                            canLoadMore &&
                            target.scrollTop + target.clientHeight >= target.scrollHeight - 20
                          ) {
                            setLoadingMore(true);
                            setTimeout(() => {
                              setPage(p => p + 1);
                              setLoadingMore(false);
                            }, 500);
                          }
                        }}
                      >
                        {paginatedNotifications.map((notification) => {
                          const { dateStr, timeStr } = formatDate(notification.date);
                          
                          return (
                            <div
                              key={notification.id}
                              className={`p-4 transition-colors duration-200 hover:bg-gray-50 ${
                                notification.read ? '' : 'bg-blue-50/50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  <NotificationIcon 
                                    type={notification.type} 
                                    className="w-4 h-4" 
                                  />
                                  {!notification.read && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${
                                    !notification.read ? 'text-blue-900 font-medium' : 'text-gray-700'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    {dateStr && (
                                      <>
                                        <span>{dateStr}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span>{timeStr}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                                    title="Marcar como leída"
                                  >
                                    Marcar como leída
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {loadingMore && (
                        <div className="flex items-center justify-center py-4 text-blue-600 text-sm font-medium border-t border-gray-100">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Cargando más notificaciones...
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}