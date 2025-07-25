"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bell, X, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, Transition } from "@headlessui/react";

interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
  tipo?: 'info' | 'success' | 'warning' | 'error';
}

type NotificacionRaw = {
  id_notificacion?: number;
  id?: number;
  mensaje: string;
  leida: boolean;
  fecha?: string;
  fecha_creacion?: string;
  tipo?: 'info' | 'success' | 'warning' | 'error';
}

interface AprobadorNotificationsProps {
  open: boolean;
  onClose: () => void;
}

export default function AprobadorNotifications({ open, onClose }: AprobadorNotificationsProps) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [marcandoTodas, setMarcarTodas] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');
  const [pagina, setPagina] = useState(1);
  const [cargandoMas, setCargandoMas] = useState(false);
  const porPagina = 5;
  const prevNotiIds = useRef<Set<number>>(new Set());

  const getToken = () => {
    let token = undefined;
    try {
      token = localStorage.getItem('auth_token') || undefined;
    } catch {}
    if (!token) {
      try {
        token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
      } catch {}
    }
    return token;
  };

  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data: NotificacionRaw[] = await res.json();
      const normalizadas = Array.isArray(data)
        ? data.map((n) => ({
            ...n,
            id: n.id_notificacion ?? n.id ?? 0,
            fecha: n.fecha ?? n.fecha_creacion ?? '',
            tipo: n.tipo ?? 'info',
          }))
        : [];
      // Toast para nuevas no leídas
      const nuevosNoLeidos = normalizadas.filter(n => !n.leida && !prevNotiIds.current.has(n.id));
      if (nuevosNoLeidos.length > 0) {
        const ultimaNotificacion = nuevosNoLeidos[0];
        toast(
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
              {ultimaNotificacion.tipo === 'success' ? <Check className="w-5 h-5 text-white" /> :
               ultimaNotificacion.tipo === 'warning' ? <AlertCircle className="w-5 h-5 text-white" /> :
               ultimaNotificacion.tipo === 'error' ? <X className="w-5 h-5 text-white" /> :
               <Bell className="w-5 h-5 text-white" />}
            </span>
            <div className="flex-1 min-w-0">
              <h6 className="font-semibold text-blue-700 text-base mb-0.5">¡Nueva notificación!</h6>
              <p className="text-gray-700 text-sm leading-snug line-clamp-2">{ultimaNotificacion.mensaje}</p>
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
            progress: undefined,
            className: "!bg-white !shadow-xl !shadow-blue-500/10 !border !border-blue-100 !rounded-2xl !p-4"
          }
        );
      }
      prevNotiIds.current = new Set(normalizadas.map(n => n.id));
      setNotificaciones(normalizadas);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotificaciones();
    setPagina(1); // Reinicia paginación al abrir
  }, [open, user, fetchNotificaciones]);

  useEffect(() => {
    setPagina(1); // Reinicia paginación al cambiar filtro
  }, [filtro]);

  const handleMarcarTodas = async () => {
    setMarcarTodas(true);
    const token = getToken();
    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(noLeidas.map(n =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })
      ));
      await fetchNotificaciones();
      toast.success("Todas las notificaciones marcadas como leídas");
    } finally {
      setMarcarTodas(false);
    }
  };

  let notificacionesFiltradas = notificaciones.filter(n =>
    filtro === 'todas' ? true : !n.leida
  );
  // Ordenar: no leídas primero, luego leídas
  notificacionesFiltradas = [
    ...notificacionesFiltradas.filter(n => !n.leida),
    ...notificacionesFiltradas.filter(n => n.leida)
  ];
  const notificacionesPaginadas = notificacionesFiltradas.slice(0, pagina * porPagina);
  const puedeCargarMas = notificacionesPaginadas.length < notificacionesFiltradas.length;

  return (
    <>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-blue-100 max-h-[90vh]">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-6 h-6 text-white" />
                      <Dialog.Title className="text-lg font-bold text-white">Notificaciones</Dialog.Title>
                    </div>
                    <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                      {notificaciones.filter(n => !n.leida).length} nuevas
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'todas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      onClick={() => setFiltro('todas')}
                    >Todas</button>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === 'no_leidas' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                      onClick={() => setFiltro('no_leidas')}
                    >No leídas</button>
                    {notificaciones.some(n => !n.leida) && (
                      <button
                        className={`ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/20 text-white hover:bg-white/30 ${marcandoTodas ? 'opacity-60 pointer-events-none' : ''}`}
                        onClick={handleMarcarTodas}
                        disabled={marcandoTodas}
                      >
                        {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando notificaciones...
                    </div>
                  </div>
                ) : notificacionesFiltradas.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
                    <Bell className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-center font-medium">No hay notificaciones {filtro === 'no_leidas' ? 'sin leer' : ''}.</p>
                  </div>
                ) : (
                  <div>
                    <div
                      className="overflow-y-auto divide-y divide-gray-100 max-h-[400px]"
                      onScroll={async e => {
                        const target = e.currentTarget;
                        if (
                          !cargandoMas &&
                          puedeCargarMas &&
                          target.scrollTop + target.clientHeight >= target.scrollHeight - 10
                        ) {
                          setCargandoMas(true);
                          // Simula carga (puedes quitar el timeout si la carga es real)
                          setTimeout(() => {
                            setPagina(p => p + 1);
                            setCargandoMas(false);
                          }, 700);
                        }
                      }}
                    >
                      {notificacionesPaginadas.map((n) => {
                        const fechaObj = n.fecha ? new Date(n.fecha) : null;
                        const fechaStr = fechaObj && !isNaN(fechaObj.getTime())
                          ? fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '';
                        const horaStr = fechaObj && !isNaN(fechaObj.getTime())
                          ? fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                          : '';
                        return (
                          <div
                            key={n.id}
                            className={`p-4 transition-all duration-200 hover:bg-gray-50 ${n.leida ? '' : 'bg-blue-50/50'}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!n.leida ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {n.tipo === 'success' ? <Check className="w-4 h-4" /> :
                                 n.tipo === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                 n.tipo === 'error' ? <X className="w-4 h-4" /> :
                                 <Bell className="w-4 h-4" />}
                                {!n.leida && (
                                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.leida ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>{n.mensaje}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span>{fechaStr}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span>{horaStr}</span>
                                </div>
                              </div>
                              {!n.leida && (
                                <button
                                  onClick={async () => {
                                    const token = getToken();
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
                                      method: "POST",
                                      headers: { Authorization: token ? `Bearer ${token}` : '' }
                                    });
                                    await fetchNotificaciones();
                                  }}
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
                      {cargandoMas && (
                        <div className="flex items-center justify-center py-4 text-blue-600 text-sm font-medium">
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Cargando...
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
    </>
  );
}
