"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AprobadorNotifications from "@/components/aprobador/AprobadorNotifications";
import {
  LogOut,
  Home,
  FileText,
  CheckCircle,
  Menu,
  User,
  Bell,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

interface AprobadorLayoutProps {
  children: React.ReactNode;
}

export function AprobadorLayout({ children }: AprobadorLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Cargar cantidad de notificaciones no leídas
  const fetchUnread = useCallback(() => {
    if (!user) return;
    let token = undefined;
    try {
      token = localStorage.getItem('auth_token') || undefined;
    } catch {}
    if (!token) {
      try {
        token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
      } catch {}
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/notificaciones`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    })
      .then(async (res) => {
        const data: { leida: boolean }[] = await res.json();
        setUnreadCount(Array.isArray(data) ? data.filter((n) => !n.leida).length : 0);
      });
  }, [user]);

  useEffect(() => {
    fetchUnread();
  }, [user, showNotifications, fetchUnread]);

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)' }}>
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

            <button
              onClick={() => setShowNotifications(true)}
              aria-label="Ver notificaciones"
              className="relative w-12 h-12 flex items-center justify-center rounded-full bg-transparent hover:bg-white/20 transition-colors duration-200 text-white focus:outline-none shadow-none border-none mr-2"
              style={{border: 'none', boxShadow: 'none', outline: 'none'}}>
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

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="sidebar absolute left-0 top-0 h-full w-80 bg-white/80 shadow-2xl flex flex-col backdrop-blur-xl border-r border-blue-100"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
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
                  <span className="font-bold text-blue-800 text-base leading-tight">{user?.nombre || 'Aprobador'}</span>
                  <span className="text-xs text-blue-600/90">Aprobador Bechapra</span>
                </div>
              </div>
            </div>
            {/* Navegación */}
            <nav className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto bg-white rounded-xl mx-4 mb-4 shadow">
              {[
                { href: '/dashboard/aprobador', label: 'Inicio', icon: Home },
                { href: '/dashboard/aprobador/solicitudes/pendientes', label: 'Solicitudes Pendientes', icon: FileText },
                { href: '/dashboard/aprobador/solicitudes/historial', label: 'Historial de Aprobaciones', icon: CheckCircle },
                { href: '/dashboard/aprobador/recurrentes', label: 'Solicitudes Recurrentes', icon: Repeat },
                { href: '/dashboard/aprobador/viaticos', label: 'Viáticos', icon: FileText },
                { href: '/dashboard/aprobador/perfil', label: 'Mi Perfil', icon: User },
              ].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-base font-medium select-none
                      ${isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
                    `}
                    onClick={() => setIsMenuOpen(false)}
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
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-red-200 text-red-600 font-semibold shadow-sm hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-all duration-200 w-full group"
                style={{ fontWeight: 600 }}
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-700 transition-transform group-hover:scale-110" />
                <span className="font-medium tracking-wide">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      <AprobadorNotifications open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)} />
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl border border-red-200 flex flex-col items-center relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
              onClick={() => setShowLogoutConfirm(false)}
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <LogOut className="w-10 h-10 text-red-500 mb-2" />
            <h3 className="text-lg font-bold text-red-700 mb-1 text-center">¿Cerrar sesión?</h3>
            <p className="text-gray-700 text-sm mb-4 text-center">¿Seguro que deseas cerrar tu sesión como aprobador?<br />Esta acción cerrará tu acceso a la plataforma.</p>
            <div className="flex gap-3 w-full mt-2">
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout(); // Espera que el backend marque como inactivo
                  router.push('/login'); // Redirige después de cerrar sesión
                }}
              >Cerrar sesión</button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                onClick={() => setShowLogoutConfirm(false)}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
