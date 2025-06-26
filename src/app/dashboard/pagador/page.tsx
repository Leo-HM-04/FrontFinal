'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { 
  CreditCard, 
  DollarSign,
  CheckCircle,
  Menu,
  Bell,
  Play,
  HelpCircle,
  Settings,
  Home,
  Clock,
  TrendingUp,
  Building,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

export default function PagadorDashboard() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #004AB7 0%, #0057D9 100%)'}}>
        {/* Header exacto al Figma */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              {/* Botón Menú */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-4 py-2 rounded-xl font-medium"
              >
                <Menu className="w-4 h-4 mr-2" />
                Menú
              </Button>

              {/* Título Central */}
              <h1 className="text-3xl font-bold text-white text-center flex-1 font-montserrat tracking-wide">
                PLATAFORMA DE PAGOS
              </h1>

              {/* Botón Notificaciones */}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-4 py-2 rounded-xl font-medium"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </Button>
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
                    <h2 className="text-xl font-bold font-montserrat">Panel Pagador</h2>
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
                        <p className="text-sm text-white/80">Pagador Banca</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                  <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </a>
                  <a href="/dashboard/pagador" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-light-bg text-primary-blue">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Procesar Pagos</span>
                  </a>
                  <a href="/dashboard/pagador/autorizados" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Pagos Autorizados</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
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
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Columna Izquierda */}
            <div className="text-white space-y-8">
              <h1 className="text-5xl font-bold font-montserrat leading-tight">
                Procesa pagos de manera segura y eficiente.
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed">
                Gestiona transferencias bancarias, valida información y ejecuta pagos con los más altos estándares de seguridad. Tu rol es crucial en el flujo financiero.
              </p>

              <Button 
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                ¿Necesitas ayuda?
              </Button>
            </div>

            {/* Columna Derecha - Video Tutorial de Pagos */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <div className="bg-gray-200 rounded-3xl overflow-hidden shadow-2xl aspect-video relative border-2 border-gray-300">
                  
                  {/* Header del Video */}
                  <div className="absolute top-0 left-0 right-0 bg-gray-300 p-3 border-b border-gray-400">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 text-sm font-semibold">Pagos Tutorial</span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido del Video - Interfaz de Pagos */}
                  <div className="absolute inset-0 mt-12 bg-white">
                    
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-purple-600 flex items-center px-4">
                      <div className="text-white text-sm font-semibold">Sistema de Pagos Bancarios</div>
                      <div className="ml-auto flex space-x-2">
                        <Building className="w-5 h-5 text-white/80" />
                      </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="mt-12 p-4 h-full bg-gray-50">
                      
                      {/* Interfaz de pago simulada */}
                      <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-400 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-bold text-gray-800">Transferencia Bancaria</div>
                          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Listo para procesar</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Beneficiario:</span>
                            <div className="w-16 h-2 bg-gray-300 rounded"></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Monto:</span>
                            <div className="w-20 h-2 bg-green-300 rounded"></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Cuenta:</span>
                            <div className="w-24 h-2 bg-blue-300 rounded"></div>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <div className="flex-1 bg-green-500 text-white text-xs py-2 rounded text-center">Procesar</div>
                          <div className="flex-1 bg-gray-300 text-gray-600 text-xs py-2 rounded text-center">Cancelar</div>
                        </div>
                      </div>

                      {/* Lista de pagos */}
                      <div className="space-y-2">
                        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <div className="w-16 h-2 bg-gray-300 rounded"></div>
                          </div>
                          <div className="w-12 h-2 bg-green-200 rounded"></div>
                        </div>
                        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <div className="w-20 h-2 bg-gray-300 rounded"></div>
                          </div>
                          <div className="w-16 h-2 bg-orange-200 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Play centrado */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-gray-700 ml-1" />
                      </button>
                    </div>

                    {/* Atribución */}
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-xs font-medium">tutorial_pagos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elementos decorativos */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/30 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/40 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Cards de acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <a href="/dashboard/pagador/autorizados" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Procesar</p>
                  <p className="text-2xl font-bold text-white mt-1">Autorizados</p>
                  <p className="text-sm text-white/60 mt-2">Pagos listos para transferir</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>

            <a href="/dashboard/pagador/historial" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Ver</p>
                  <p className="text-2xl font-bold text-white mt-1">Historial</p>
                  <p className="text-sm text-white/60 mt-2">Pagos procesados</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>

            <a href="#" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Ver</p>
                  <p className="text-2xl font-bold text-white mt-1">Reportes</p>
                  <p className="text-sm text-white/60 mt-2">Métricas financieras</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
