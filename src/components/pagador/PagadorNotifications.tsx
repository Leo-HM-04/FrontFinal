'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
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

interface RawNotification {
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

const formatNotificationMessage = (message: string): string => {
  // Primero, verificar si el mensaje ya tiene formato detallado
  if (
    message.includes('💰') || 
    message.includes('📄') || 
    message.includes('✅') || 
    message.includes('❌') || 
    message.includes('📋') || 
    message.includes('💸') ||
    message.includes('<b>') ||
    message.includes('Nueva solicitud autorizada') ||
    message.includes('subió el comprobante') ||
    message.includes('ha sido pagada')
  ) {
    // Si ya tiene formato detallado, solo limpiar HTML y devolver
    return message.replace(/<[^>]*>/g, '').trim();
  }

  // Si es un mensaje genérico, intentar formatearlo
  const cleanMessage = message.replace(/<[^>]*>/g, '').trim();
  
  const patterns = [
    // Patrones específicos para mensajes que pueden venir genéricos
    { 
      regex: /Un usuario realizó una acción sobre una solicitud/i, 
      template: () => `Se realizó una acción sobre una solicitud`
    },
    { 
      regex: /El usuario ([^ ]+) \(([^)]+)\) cre[oó] solicitud/i, 
      template: (match: RegExpMatchArray) => {
        const nombre = match[1];
        const rol = match[2];
        if (rol.toLowerCase().includes('solicitante')) return `El solicitante ${nombre} creó una nueva solicitud`;
        if (rol.toLowerCase().includes('admin')) return `El administrador ${nombre} creó una nueva solicitud`;
        return `${rol.charAt(0).toUpperCase() + rol.slice(1)} ${nombre} creó una nueva solicitud`;
      }
    },
    { 
      regex: /El usuario ([^ ]+) \(([^)]+)\) actualiz[oó] solicitud/i, 
      template: (match: RegExpMatchArray) => {
        const nombre = match[1];
        const rol = match[2];
        if (rol.toLowerCase().includes('aprobador')) return `El aprobador ${nombre} actualizó una solicitud`;
        if (rol.toLowerCase().includes('pagador')) return `El pagador ${nombre} procesó una solicitud`;
        return `${rol.charAt(0).toUpperCase() + rol.slice(1)} ${nombre} actualizó una solicitud`;
      }
    },
    { 
      regex: /cre[oó] usuario.*Nombre: ([^,\n]+),?/i, 
      template: (match: RegExpMatchArray) => `El administrador agregó un nuevo usuario: ${match[1].trim()}`
    },
    { 
      regex: /elimin[oó] usuario.*Nombre: ([^,\n]+),?/i, 
      template: (match: RegExpMatchArray) => `El administrador eliminó al usuario: ${match[1].trim()}`
    },
    { 
      regex: /actualiz[oó] usuario.*Nombre: ([^,\n]+),?/i, 
      template: (match: RegExpMatchArray) => `El administrador actualizó los datos de: ${match[1].trim()}`
    },
    { 
      regex: /cre[oó] solicitud.*Nombre: ([^,\n]+),?/i, 
      template: (match: RegExpMatchArray) => `El usuario ${match[1].trim()} creó una nueva solicitud`
    },
    { 
      regex: /actualiz[oó] solicitud.*Nombre: ([^,\n]+),?/i, 
      template: (match: RegExpMatchArray) => `El usuario ${match[1].trim()} actualizó una solicitud`
    },
    { 
      regex: /cre[oó] solicitud/i, 
      template: () => `Un usuario creó una nueva solicitud`
    },
    { 
      regex: /actualiz[oó] solicitud/i, 
      template: () => `Un usuario actualizó una solicitud`
    },
    { 
      regex: /solicitud/i, 
      template: () => `Se realizó una acción sobre una solicitud`
    }
  ];

  for (const pattern of patterns) {
    const match = cleanMessage.match(pattern.regex);
    if (match) return pattern.template(match);
  }

  // Si no coincide con ningún patrón, devolver el mensaje original limpio
  return cleanMessage;
};

export default function Notifications({ open, onClose }: NotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const perPage = 10;
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevNotificationIds = useRef<Set<number>>(new Set());

  // Initialize audio
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

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (!el) return;
      
      const sortedNotifications = [...notifications].sort((a, b) => 
        a.read === b.read ? 0 : a.read ? 1 : -1
      );
      
      const filtered = sortedNotifications.filter(n => 
        filter === 'all' ? true : !n.read
      );
      
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
        filtered.length > page * perPage && 
        !loadingMore
      ) {
        setLoadingMore(true);
        setTimeout(() => {
          setPage(p => p + 1);
          setLoadingMore(false);
        }, 500);
      }
    };
    
    const el = listRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, [notifications, filter, page, perPage, loadingMore]);

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
    if (!user) return;
    
    setLoading(true);
    const token = getAuthToken();
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones`, 
        { headers: { Authorization: token ? `Bearer ${token}` : '' } }
      );
      
      const data: RawNotification[] = await response.json();
      
      const normalized = Array.isArray(data)
        ? data
            .filter(n => !n.mensaje.includes('temporizador'))
            .map(n => ({
              id: n.id_notificacion ?? n.id ?? 0,
              message: n.mensaje,
              read: n.leida,
              date: n.fecha ?? n.fecha_creacion ?? '',
              type: n.tipo ?? 'info'
            }))
        : [];

      // Play sound for new unread notifications
      const newUnread = normalized.filter(n => !n.read && !prevNotificationIds.current.has(n.id));
      if (newUnread.length > 0 && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      prevNotificationIds.current = new Set(normalized.map(n => n.id));
      setNotifications(normalized);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotifications();
    setPage(1);
  }, [open, user, fetchNotifications]);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const token = getAuthToken();
    
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones/${n.id}/marcar-leida`, 
          { 
            method: "POST",
            headers: { Authorization: token ? `Bearer ${token}` : '' }
          }
        )
      ));
      
      await fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const markAsRead = async (id: number) => {
    const token = getAuthToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/notificaciones/${id}/marcar-leida`, 
      { 
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      }
    );
    await fetchNotifications();
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'all' ? true : !n.read)
    .sort((a, b) => (a.read === b.read) ? 0 : a.read ? 1 : -1);

  const paginatedNotifications = filteredNotifications.slice(0, page * perPage);

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all border border-gray-200 flex flex-col max-h-[90vh]">
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
                        ref={listRef}
                        className="overflow-y-auto divide-y divide-gray-100 flex-1"
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
                                  <div 
                                    className={`text-sm ${
                                      !notification.read ? 'text-blue-900 font-medium' : 'text-gray-700'
                                    }`}
                                  >
                                    {notification.message || 'Notificación sin contenido'}
                                  </div>
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