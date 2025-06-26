'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Clock,
  DollarSign,
  Menu,
  LogOut,
  Home,
  Settings 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para obtener el label del rol
  const getRoleLabel = (role: string) => {
    const roles = {
      admin_general: 'Administrador General',
      solicitante: 'Solicitante',
      aprobador: 'Aprobador',
      pagador_banca: 'Pagador de Banca'
    };
    return roles[role as keyof typeof roles] || role;
  };

  useEffect(() => {
    if (user) {
      switch (user.rol) {
        case 'admin_general':
          router.push('/dashboard/admin');
          break;
        case 'solicitante':
          router.push('/dashboard/solicitante');
          break;
        case 'aprobador':
          router.push('/dashboard/aprobador');
          break;
        case 'pagador_banca':
          router.push('/dashboard/pagador');
          break;
        default:
          router.push('/unauthorized');
      }
    }
  }, [user, router]);

  const dashboardData = {
    description: 'Aquí puedes encontrar un resumen de tu actividad y accesos rápidos a las funciones más importantes.',
    cards: [
      {
        label: 'Usuarios',
        value: '150',
        icon: Users,
        href: '/dashboard/admin'
      },
      {
        label: 'Solicitudes',
        value: '75',
        icon: FileText,
        href: '/dashboard/admin?tab=solicitudes'
      },
      {
        label: 'Aprobadas',
        value: '50',
        icon: CheckCircle,
        href: '/dashboard/aprobador?filter=aprobadas'
      },
      {
        label: 'Rechazadas',
        value: '10',
        icon: AlertCircle,
        href: '/dashboard/aprobador?filter=rechazadas'
      },
      {
        label: 'Pendientes',
        value: '15',
        icon: Clock,
        href: '/dashboard/aprobador?filter=pendientes'
      },
      {
        label: 'Créditos',
        value: '$12,345',
        icon: CreditCard,
        href: '/dashboard/pagador'
      },
      {
        label: 'Ingresos',
        value: '$5,678',
        icon: DollarSign,
        href: '/dashboard/admin'
      },
      {
        label: 'Tendencias',
        value: 'Estable',
        icon: TrendingUp,
        href: '/dashboard/admin'
      }
    ]
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary-blue to-secondary-blue font-montserrat">
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
                  <span className="block text-xs text-white/80">{getRoleLabel(user?.rol || '')}</span>
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
                    <h2 className="text-xl font-bold">Panel {getRoleLabel(user?.rol || '')}</h2>
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
                        <p className="text-sm text-white/80">{getRoleLabel(user?.rol || '')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                  <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard Principal</span>
                  </a>
                  
                  {user?.rol === 'admin_general' && (
                    <>
                      <a href="/dashboard/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Dashboard Admin</span>
                      </a>
                      <a href="/dashboard/admin/usuarios" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Gestión de Usuarios</span>
                      </a>
                      <a href="/dashboard/admin/solicitudes" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Gestión de Solicitudes</span>
                      </a>
                      <a href="/dashboard/admin/reportes" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Reportes</span>
                      </a>
                      <a href="/dashboard/admin/configuracion" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Configuración</span>
                      </a>
                    </>
                  )}

                  {user?.rol === 'solicitante' && (
                    <>
                      <a href="/dashboard/solicitante" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Mi Dashboard</span>
                      </a>
                      <a href="/dashboard/solicitante/solicitudes" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Mis Solicitudes</span>
                      </a>
                    </>
                  )}

                  {user?.rol === 'aprobador' && (
                    <>
                      <a href="/dashboard/aprobador" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Mi Dashboard</span>
                      </a>
                      <a href="/dashboard/aprobador/pendientes" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Solicitudes Pendientes</span>
                      </a>
                      <a href="/dashboard/aprobador/historial" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Historial</span>
                      </a>
                    </>
                  )}

                  {user?.rol === 'pagador_banca' && (
                    <>
                      <a href="/dashboard/pagador" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Mi Dashboard</span>
                      </a>
                      <a href="/dashboard/pagador/pagos" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">Procesar Pagos</span>
                      </a>
                      <a href="/dashboard/pagador/historial" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-medium">Historial de Pagos</span>
                      </a>
                    </>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="text-center lg:text-left mb-6 lg:mb-0">
                <h2 className="text-4xl font-bold text-white mb-2 font-montserrat">
                  ¡Bienvenido, {user?.nombre}!
                </h2>
                <p className="text-xl text-white/80">
                  {dashboardData.description}
                </p>
              </div>
              <div className="bg-white/10 rounded-full p-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {user?.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardData.cards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <a
                  key={index}
                  href={card.href}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">{card.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                    </div>
                    <div className="p-3 rounded-full bg-white/20">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 font-montserrat">
              Acciones Rápidas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.rol === 'solicitante' && (
                <Button 
                  className="h-16 text-lg font-semibold bg-white text-primary-blue hover:bg-gray-50"
                  onClick={() => window.location.href = '/dashboard/solicitante?action=create'}
                >
                  + Nueva Solicitud
                </Button>
              )}
              
              {user?.rol === 'aprobador' && (
                <Button 
                  className="h-16 text-lg font-semibold bg-white text-primary-blue hover:bg-gray-50"
                  onClick={() => window.location.href = '/dashboard/aprobador?filter=pendientes'}
                >
                  Ver Pendientes
                </Button>
              )}
              
              {user?.rol === 'admin_general' && (
                <>
                  <Button 
                    className="h-16 text-lg font-semibold bg-white text-primary-blue hover:bg-gray-50 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/usuarios'}
                  >
                    <Users className="w-6 h-6" />
                    <span>Gestionar Usuarios</span>
                  </Button>
                  <Button 
                    className="h-16 text-lg font-semibold bg-white/20 text-white border border-white/30 hover:bg-white/30 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/usuarios/create'}
                  >
                    <Users className="w-6 h-6" />
                    <span>Crear Usuario</span>
                  </Button>
                  <Button 
                    className="h-16 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/reportes'}
                  >
                    <FileText className="w-6 h-6" />
                    <span>Reportes</span>
                  </Button>
                  <Button 
                    className="h-16 text-lg font-semibold bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/usuarios?export=true'}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span>Exportar Datos</span>
                  </Button>
                  <Button 
                    className="h-16 text-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/configuracion'}
                  >
                    <Settings className="w-6 h-6" />
                    <span>Configuración</span>
                  </Button>
                  <Button 
                    className="h-16 text-lg font-semibold bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center space-x-2"
                    onClick={() => window.location.href = '/dashboard/admin/auditoria'}
                  >
                    <AlertCircle className="w-6 h-6" />
                    <span>Auditoría</span>
                  </Button>
                </>
              )}
              
              {user?.rol === 'pagador_banca' && (
                <Button 
                  className="h-16 text-lg font-semibold bg-white text-primary-blue hover:bg-gray-50"
                  onClick={() => window.location.href = '/dashboard/pagador'}
                >
                  Procesar Pagos
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
