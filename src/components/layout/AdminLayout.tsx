'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Plus, Edit, Settings, TrendingUp, LogOut, Home, FileText, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
            >
              <Menu className="w-5 h-5 mr-2" />
              Menú
            </Button>

            <h1 className="text-2xl font-bold text-white text-center flex-1 font-montserrat tracking-wide">
              PLATAFORMA DE PAGOS
            </h1>

            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <span className="font-medium">{user?.nombre}</span>
                <span className="block text-xs text-white/80">Administrador</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="text-white p-6" style={{background: 'linear-gradient(135deg, #004AB7 0%, #0057D9 100%)'}}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Panel Admin</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    ×
                  </Button>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">{user?.nombre?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{user?.nombre}</p>
                      <p className="text-sm text-white/80">Administrador General</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-2">
                <a 
                  href="/dashboard/admin" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === '/dashboard/admin' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </a>
                <a 
                  href="/dashboard/admin/usuarios" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/dashboard/admin/usuarios') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Gestión de Usuarios</span>
                </a>
                <a 
                  href="/dashboard/admin/usuarios/create" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === '/dashboard/admin/usuarios/create' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Crear Usuario</span>
                </a>
                <a 
                  href="/dashboard/admin/solicitudes" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/dashboard/admin/solicitudes') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Gestión de Solicitudes</span>
                </a>
                <a 
                  href="/dashboard/admin/reportes" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/dashboard/admin/reportes') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Reportes</span>
                </a>
                <a 
                  href="/dashboard/admin/configuracion" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/dashboard/admin/configuracion') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Configuración</span>
                </a>
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                    window.location.href = '/login';
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}
