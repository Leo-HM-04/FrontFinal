'use client'; 

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
// Importamos los iconos individualmente para evitar problemas de HMR
import { Users } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Home } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Menu } from 'lucide-react';
import { User } from 'lucide-react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(true)}
              className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium"
            >
              <Menu className="w-4 h-4 mr-2" />
              Menú
            </Button>

            <Button
              variant="outline"
              size="sm" 
              onClick={() => alert('Notificaciones')}
              className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium"
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
            className="absolute inset-0 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              <div className="text-white p-6" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Panel Adminis</h2>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center ring-2 ring-white/30">
                      <span className="text-lg font-bold">{user?.nombre?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{user?.nombre}</p>
                      <p className="text-sm text-white/90">Administrador Bechapra</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                <Link 
                  href="/dashboard/admin" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname === '/dashboard/admin' 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Inicio</span>
                </Link>
                <Link 
                  href="/dashboard/admin/usuarios" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/admin/usuarios') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Gestión de Usuarios</span>
                </Link>
                <Link 
                  href="/dashboard/admin/solicitudes" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/admin/solicitudes') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Gestión de Solicitudes</span>
                </Link>
                <Link 
                  href="/dashboard/admin/perfil" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/admin/perfil') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Mi Perfil</span>
                </Link>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                    router.push('/login');
                  }}
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
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}