'use client'; 

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  LogOut, Home, FileText, CreditCard, Menu, User, Bell, Repeat 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface PagadorLayoutProps {
  children: React.ReactNode;
}

export function PagadorLayout({ children }: PagadorLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Datos de ejemplo para notificaciones
  const notificationsData = [
    { 
      id: 1, 
      title: 'Nuevo pago pendiente', 
      message: 'Tienes un nuevo pago pendiente para procesar', 
      time: 'Hace 5 minutos',
      isRead: false
    },
    { 
      id: 2, 
      title: 'Recordatorio', 
      message: 'Pago pendiente para Proyecto ABC', 
      time: 'Hace 3 horas',
      isRead: true
    },
    { 
      id: 3, 
      title: 'Sistema actualizado', 
      message: 'Se han actualizado los formatos de pago', 
      time: 'Hace 1 día',
      isRead: true
    }
  ];

  return (
    <div className="min-h-screen font-sans" style={{background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)'}}>
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

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm" 
                onClick={() => setShowNotifications(!showNotifications)}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium relative"
              >
                Notificaciones
                <Bell className="w-4 h-4 ml-2" />
                {notificationsData.some(n => !n.isRead) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              </div>
          </div>
        </div>
      </header>

      {/* Panel de Notificaciones */}
      {showNotifications && (
        <div className="fixed right-4 top-24 w-80 bg-white rounded-xl shadow-2xl z-50 animate-fade-in">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationsData.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No tienes notificaciones
              </div>
            ) : (
              <div>
                {notificationsData.map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${notification.isRead ? '' : 'bg-blue-50'}`}
                  >
                    <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <span className="text-gray-400 text-xs mt-2 block">{notification.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 text-center border-t border-gray-100">
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              <div className="text-white p-6" style={{background: 'linear-gradient(135deg, #0057D9 0%, #004AB7 100%)'}}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Panel Pagador</h2>
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
                      <p className="font-semibold">{user?.nombre}</p>
                      <p className="text-sm text-white/90">Pagador Bechapra</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                <Link 
                  href="/dashboard/pagador" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname === '/dashboard/pagador' 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Inicio</span>
                </Link>
                <Link 
                  href="/dashboard/pagador/pagos/pendientes" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/pagador/pagos/pendientes') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <CreditCard className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Pagos Pendientes</span>
                </Link>
                                <Link 
                  href="/dashboard/pagador/recurrentes" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/pagador/recurrentes') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Repeat className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Pagos Recurrentes</span>
                </Link>
                <Link 
                  href="/dashboard/pagador/pagos/historial" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/pagador/pagos/historial') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Historial de Pagos</span>
                </Link>
                <Link 
                  href="/dashboard/pagador/pagos/subir-comprobante" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/pagador/pagos/subir-comprobante') 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">Subir Comprobante</span>
                </Link>
                <Link 
                  href="/dashboard/pagador/perfil" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    pathname.startsWith('/dashboard/pagador/perfil') 
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowLogoutConfirm(true);
                    setIsMenuOpen(false);
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
            onClick={() => setShowLogoutConfirm(false)}
            aria-hidden="true"
          />
          <div 
            className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 z-[10000] animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-500" 
              onClick={() => setShowLogoutConfirm(false)}
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <LogOut className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center" id="modal-title">Confirmar cierre de sesión</h3>
            <p className="text-gray-600 mb-6 text-center">¿Estás seguro de que deseas cerrar tu sesión en la plataforma?</p>
            
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowLogoutConfirm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-5"
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={async () => {
                  try {
                    setShowLogoutConfirm(false);
                    setIsMenuOpen(false);
                    router.push('/login');
                    setTimeout(() => {
                      logout();
                    }, 100);
                  } catch (error) {
                    console.error("Error durante el cierre de sesión:", error);
                    router.push('/login');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-5"
              >
                Sí, cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}