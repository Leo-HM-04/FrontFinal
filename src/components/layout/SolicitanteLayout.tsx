'use client';


import React, { useState, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import SolicitanteNotifications from '@/components/solicitante/SolicitanteNotifications';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { LogOut, Home, FileText, Plus, User, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

// SidebarLink: componente profesional para los links del sidebar
// SidebarLink: igual que admin pero adaptado a solicitante
interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, label, icon, active, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-base font-medium select-none
        ${active ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-blue-600" style={{boxShadow: '0 0 6px #2563eb55'}}></span>
      )}
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

interface SolicitanteLayoutProps {
    children: React.ReactNode;
}

export function SolicitanteLayout({ children }: SolicitanteLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Paleta y fondo
  const backgroundGradient = useMemo(() => ({ background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)' }), []);

  // Opciones de menú para solicitante
  const navItems = [
    { href: '/dashboard/solicitante', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { href: '/dashboard/solicitante/nueva-solicitud', label: 'Nueva Solicitud', icon: <Plus className="w-5 h-5" /> },
    { href: '/dashboard/solicitante/mis-solicitudes', label: 'Mis Solicitudes', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/solicitante/mis-recurrentes', label: 'Solicitudes Recurrentes', icon: <FileText className="w-5 h-5" /> },
    { href: '/dashboard/solicitante/perfil', label: 'Mi Perfil', icon: <User className="w-5 h-5" /> },
  ];

  // Cerrar menú
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Responsive: detectar si es móvil
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Feedback logout
  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout(); // Espera que el backend marque como inactivo
    toast.success('Sesión cerrada correctamente', { position: 'top-center', autoClose: 2000 });
    setTimeout(() => router.push('/login'), 800);
  };

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-x-hidden" style={backgroundGradient}>
      {/* Header */}
      <header style={{background: 'transparent', borderBottom: 'none', boxShadow: 'none', padding: 0}}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/20 transition-colors duration-200 text-white focus:outline-none shadow-none border-none"
              style={{border: 'none', boxShadow: 'none', outline: 'none'}}>
              <Menu className="w-7 h-7" />
            </button>
            {/* Notificaciones del solicitante */}
            <SolicitanteNotifications open={false} onClose={() => {}} />
          </div>
        </div>
      </header>

      {/* Sidebar animado y modal logout */}
      {/* Overlay glassmorphism clickeable para cerrar menú */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-md transition-all duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex pointer-events-none">
            {/* Sidebar drawer, pointer-events-auto para permitir interacción */}
            <motion.aside
              className="sidebar fixed md:absolute left-0 top-0 h-full w-80 max-w-full bg-white/80 shadow-2xl flex flex-col backdrop-blur-xl border-r border-blue-100 pointer-events-auto"
              style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
              initial={{ x: isMobile ? '-100%' : -32, opacity: 0, clipPath: 'inset(0 40% 0 0)' }}
              animate={{ x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)', boxShadow: '0 16px 48px 0 rgba(31,38,135,0.25)' }}
              exit={{
                x: isMobile ? '-100%' : -32,
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
              {/* Card usuario */}
              <div className="flex flex-col items-start gap-2 pt-8 pb-2 px-8" style={{background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)'}}>
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
                    <span className="font-bold text-blue-800 text-base leading-tight">{user?.nombre || 'Solicitante'}</span>
                    <span className="text-xs text-blue-600/90">Solicitante Bechapra</span>
                  </div>
                </div>
              </div>
              {/* Navegación */}
              <nav className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto bg-white rounded-xl mx-4 mb-4 shadow">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard/solicitante/perfil' && pathname.startsWith(item.href));
                  return (
                    <SidebarLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive}
                      onClick={closeMenu}
                    />
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
                          <p className="text-red-900/90 text-base mb-4 text-center">¿Estás seguro de que deseas cerrar tu sesión?<br />Se cerrará tu acceso como solicitante.</p>
                          <div className="flex gap-4 w-full mt-2">
                            <button
                              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                              onClick={handleLogout}
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
  );
}