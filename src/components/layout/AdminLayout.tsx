'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Users, LogOut, Home, FileText, Menu, User, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Memoizar estilos de fondo para evitar recalcular en cada render
  const backgroundGradient = useMemo(
    () => ({ background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)' }),
    []
  );

  // Definir elementos de navegación en un arreglo para reducir código repetitivo
  const navItems = [
    { href: '/dashboard/admin', label: 'Inicio', icon: Home },
    { href: '/dashboard/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
    { href: '/dashboard/admin/solicitudes', label: 'Gestión de Solicitudes', icon: FileText },
    { href: '/dashboard/admin/recurrentes', label: 'Solicitudes Recurrentes', icon: FileText },
    { href: '/dashboard/admin/perfil', label: 'Mi Perfil', icon: User },
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

  // Manejar cierre de sesión con pantalla de transición
  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    logout();
    setTimeout(() => {
      setIsLoggingOut(false);
      router.push('/login');
    }, 1000); // Mostrar pantalla de "Cerrando Sesión" por 1 segundo
  }, [logout, router]);

  // Pantalla de "Cerrando Sesión"
  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundGradient}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Cerrando Sesión...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={backgroundGradient}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium"
              aria-label="Abrir menú"
              aria-expanded={isMenuOpen}
            >
              <Menu className="w-4 h-4 mr-2" />
              Menú
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Placeholder para un sistema de notificaciones
                console.log('Abrir notificaciones');
                // Opcional: Implementar con react-hot-toast o similar
              }}
              className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium"
              aria-label="Ver notificaciones"
            >
              Notificaciones
              <Bell className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 backdrop-blur-sm bg-black/30 transition-opacity duration-300"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="sidebar absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              <div className="text-white p-6" style={backgroundGradient}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Panel Administrador</h2>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center ring-2 ring-white/30 overflow-hidden">
                      <img
                        src="/assets/images/Logo_1x1_Azul@2x.png"
                        alt="Foto de perfil Bechapra"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{user?.nombre || 'Usuario'}</p>
                      <p className="text-sm text-white/90">Administrador Bechapra</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      pathname === item.href || pathname.startsWith(item.href)
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    onClick={closeMenu}
                  >
                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 w-full group"
                >
                  <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}