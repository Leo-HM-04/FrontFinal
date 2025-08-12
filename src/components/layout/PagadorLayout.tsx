'use client';

import { useState, useCallback, useEffect, useMemo, Fragment, useRef } from 'react';
import PagadorNotifications from '@/components/pagador/PagadorNotifications';
import { Dialog, Transition } from '@headlessui/react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, FileText, Menu, User, Bell, Repeat, CreditCard, FileCheck2 } from 'lucide-react';

interface PagadorLayoutProps {
  children: React.ReactNode;
}

export function PagadorLayout({ children }: PagadorLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Guardar el último contador para detectar nuevas notificaciones
  const prevUnreadCount = useRef<number>(0);

  // Ref para el audio de notificación
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Desbloquear el audio en la primera interacción del usuario
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

  // Memoizar estilos de fondo para evitar recalcular en cada render
  const backgroundGradient = useMemo(
    () => ({ background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)' }),
    []
  );

  // Definir elementos de navegación en un arreglo para reducir código repetitivo
  const navItems = [
    { href: '/dashboard/pagador', label: 'Inicio', icon: Home },
    { href: '/dashboard/pagador/viaticos', label: 'Viáticos a Pagar', icon: CreditCard },
    { href: '/dashboard/pagador/pagos/pendientes', label: 'Pagos Pendientes', icon: CreditCard },
    { href: '/dashboard/pagador/recurrentes', label: 'Pagos Recurrentes', icon: Repeat },
    { href: '/dashboard/pagador/pagos/historial', label: 'Historial de Pagos', icon: FileText },
    { href: '/dashboard/pagador/pagos/subir-comprobante', label: 'Subir Comprobante', icon: FileText },
    { href: '/dashboard/pagador/pagos/subir-comprobante-recurrente', label: 'Subir Comprobante Recurrente', icon: FileCheck2 },
    { href: '/dashboard/pagador/comprobantes-viaticos', label: 'Comprobantes de Viáticos', icon: FileCheck2 },
    { href: '/dashboard/pagador/graficas', label: 'Gráficas', icon: FileText },
    { href: '/dashboard/pagador/perfil', label: 'Mi Perfil', icon: User },
  ];

  // Manejador para cerrar el menú
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Manejar clics fuera del menú lateral
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.contains(event.target as Node)) {
      closeMenu();
    }
  }, [closeMenu]);

  // Manejar tecla Escape para cerrar el menú
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }, [closeMenu]);

  // Configurar y limpiar event listeners
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleClickOutside, handleEscapeKey]);

  // Polling para detectar nuevas notificaciones no leídas y reproducir sonido
  useEffect(() => {
    if (!user) return;
    const fetchAndCheck = async () => {
      let token = undefined;
      try {
        token = localStorage.getItem('auth_token') || undefined;
      } catch {}
      if (!token) {
        try {
          token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        } catch {}
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/notificaciones`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      type Notificacion = { leida: boolean };
      const data: Notificacion[] = await res.json();
      const count = Array.isArray(data) ? data.filter((n) => !n.leida).length : 0;
      setUnreadCount(count);
      if (count > prevUnreadCount.current) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
      prevUnreadCount.current = count;
    };
    fetchAndCheck();
    const interval = setInterval(fetchAndCheck, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, [user]);

  // Manejar cierre de sesión con pantalla de transición
  const handleLogout = useCallback(async () => {
    await logout(); // Espera que el backend marque como inactivo
    window.location.replace('/login'); // Redirige después de cerrar sesión
  }, [logout]);

  return (
    <>
      {/* Audio global para notificaciones */}
      <audio ref={audioRef} src="/assets/audio/bell-notification.mp3" preload="auto" />
      <div className="min-h-screen font-sans flex flex-col" style={backgroundGradient}>
      {/* Header */}
      <header style={{background: 'transparent', borderBottom: 'none', boxShadow: 'none', padding: 0}}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/20 transition-colors duration-200 text-white focus:outline-none shadow-none border-none"
              style={{border: 'none', boxShadow: 'none', outline: 'none'}}
            >
              <Menu className="w-7 h-7" />
            </button>

            <button
              onClick={() => setShowNotifications(true)}
              aria-label="Ver notificaciones"
              className="relative w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/20 transition-colors duration-200 text-white focus:outline-none shadow-none border-none mr-2"
              style={{border: 'none', boxShadow: 'none', outline: 'none'}}
            >
              <Bell className="w-7 h-7" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-bold shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Panel de Notificaciones */}
      <PagadorNotifications open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              className="absolute inset-0 backdrop-blur-sm bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={closeMenu}
              aria-hidden="true"
            />
            <motion.aside
              className="sidebar absolute left-0 top-0 h-full w-80 bg-white/80 shadow-2xl flex flex-col backdrop-blur-xl border-r border-blue-100"
              style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
              initial={{ x: -32, opacity: 0, clipPath: 'inset(0 40% 0 0)' }}
              animate={{ x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)', boxShadow: '0 16px 48px 0 rgba(31,38,135,0.25)' }}
              exit={{
                x: -32,
                opacity: 0,
                clipPath: [
                  'inset(0 0% 0 0)',
                  'inset(0 20% 0 0) round 0 40px 0 0',
                  'inset(0 40% 0 0) round 0 80px 0 0'
                ]
              }}
              transition={{
                x: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.28, ease: 'easeInOut' },
                clipPath: { duration: 0.32, ease: [0.65, 0, 0.35, 1] }
              }}
            >
            {/* Logo y encabezado */}
            <div className="flex flex-col items-start gap-2 pt-8 pb-2 px-8" style={{background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)'}}>
              {/* Card usuario */}
              <div className="w-full bg-white/90 rounded-xl border border-blue-200 flex items-center gap-4 px-4 py-3 mb-4 shadow-sm">
                <Image
                  src="/assets/images/Logo_1x1_Azul@2x.png"
                  alt="Logo Bechapra"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border border-blue-300"
                  priority
                />
                <div className="flex flex-col items-start justify-center">
                  <span className="font-bold text-blue-800 text-base leading-tight">{user?.nombre || 'Pagador'}</span>
                  <span className="text-xs text-blue-600/90">Pagador Bechapra</span>
                </div>
              </div>
            </div>
            {/* Navegación */}
            <nav className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto bg-white rounded-xl mx-4 mb-4 shadow">
              {navItems.map((item) => {
                // Solo resalta la opción exacta
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-base font-medium select-none
                      ${isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
                    `}
                    onClick={closeMenu}
                  >
                    {/* Indicador visual de activo */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-blue-600" style={{boxShadow: '0 0 6px #2563eb55'}}></span>
                    )}
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-700' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            {/* Cerrar sesión */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-red-200 text-red-600 font-semibold shadow-sm hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 w-full group"
                style={{ fontWeight: 600 }}
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-700 transition-transform group-hover:scale-110" />
                <span className="font-medium tracking-wide">Cerrar Sesión</span>
              </button>
              {/* Modal de confirmación de cierre de sesión */}
              <Transition.Root show={showLogoutModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setShowLogoutModal}>
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
                      <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl border border-red-200 flex flex-col items-center">
                        <LogOut className="w-10 h-10 text-red-500 mb-2" />
                        <Dialog.Title className="text-xl font-bold text-red-700 mb-2">¿Cerrar sesión?</Dialog.Title>
                        <p className="text-red-900/90 text-base mb-4 text-center">¿Estás seguro de que deseas cerrar tu sesión?<br />Se cerrará tu acceso como pagador.</p>
                        <div className="flex gap-4 w-full mt-2">
                          <button
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                            onClick={() => {
                              setShowLogoutModal(false);
                              handleLogout();
                            }}
                          >Cerrar sesión</button>
                          <button
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                            onClick={() => setShowLogoutModal(false)}
                          >Cancelar</button>
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </Dialog>
              </Transition.Root>
            </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      </div>
    </>
  );
}