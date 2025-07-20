"use client";
import { useEffect, useState, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

// Tipo para datos crudos del backend
type NotificacionRaw = {
  id_notificacion?: number;
  id?: number;
  mensaje: string;
  leida: boolean;
  fecha?: string;
  fecha_creacion?: string;
}

interface AdminNotificationsProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminNotifications({ open, onClose }: AdminNotificationsProps) {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  // Cargar notificaciones al abrir
  // Utilidad para obtener el token
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

  // Cargar notificaciones
  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      const normalizadas = Array.isArray(data)
        ? data.map((n: NotificacionRaw) => ({
            ...n,
            id: n.id_notificacion ?? n.id ?? 0,
            fecha: n.fecha ?? n.fecha_creacion ?? ''
          }))
        : [];
      setNotificaciones(normalizadas);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    fetchNotificaciones();
  }, [open, user, fetchNotificaciones]);

  // Marcar todas como leídas
  const handleMarcarTodas = async () => {
    setMarcandoTodas(true);
    const token = getToken();
    try {
      const noLeidas = notificaciones.filter(n => !n.leida);
      await Promise.all(noLeidas.map(n =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones/${n.id}/marcar-leida`, {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        })
      ));
      // Refrescar lista
      await fetchNotificaciones();
    } finally {
      setMarcandoTodas(false);
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-blue-200 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-6 h-6 text-blue-600" />
                <Dialog.Title className="text-lg font-bold text-blue-800">Notificaciones</Dialog.Title>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-blue-700">Historial</span>
                {notificaciones.some(n => !n.leida) && (
                  <button
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 shadow-sm border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 ${marcandoTodas ? 'opacity-60 pointer-events-none' : ''}`}
                    onClick={handleMarcarTodas}
                    disabled={marcandoTodas}
                  >
                    {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
                  </button>
                )}
              </div>
              {loading ? (
                <div className="text-center text-blue-600 py-8 text-lg font-semibold animate-pulse">Cargando notificaciones...</div>
              ) : notificaciones.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No hay notificaciones.</div>
              ) : (
                <ul className="divide-y divide-blue-100 max-h-80 overflow-y-auto custom-scrollbar">
                  {notificaciones.map((n) => {
                    const fechaObj = n.fecha ? new Date(n.fecha) : null;
                    const fechaStr = fechaObj && !isNaN(fechaObj.getTime())
                      ? fechaObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '';
                    const horaStr = fechaObj && !isNaN(fechaObj.getTime())
                      ? fechaObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '';
                    return (
                      <li
                        key={n.id}
                        className={`py-3 px-4 rounded-lg mb-2 shadow-sm border border-blue-100 flex flex-col gap-1 transition-all duration-150 ${n.leida ? 'bg-white' : 'bg-blue-50 border-blue-300'}`}
                        style={{ opacity: n.leida ? 0.7 : 1 }}
                      >
                        <div className="flex items-center gap-2">
                          {!n.leida && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="No leída"></span>}
                          <span className="text-sm text-blue-900 font-medium">{n.mensaje}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>{fechaStr}</span>
                          <span className="mx-1">•</span>
                          <span>{horaStr}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                className="mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                onClick={onClose}
              >Cerrar</button>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
