'use client';


import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Plus, User, Play, HelpCircle } from 'lucide-react';

export default function SolicitanteDashboard() {
  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
            {/* Columna Izquierda - Contenido específico para Solicitante */}
            <div className="text-white space-y-8">
              {/* Título Principal */}
              <h1 className="text-5xl font-bold leading-tight">
                SOLICITUDES DE PAGO
              </h1>
              {/* Subtítulo */}
              <h2 className="text-2xl font-semibold">
                Gestiona tus solicitudes de manera eficiente.
              </h2>
              {/* Texto descriptivo */}
              <p className="text-lg text-white leading-relaxed max-w-md">
                Desde aquí puedes crear nuevas solicitudes de pago, hacer seguimiento a tus solicitudes existentes y gestionar toda tu información personal de manera segura y eficiente.
              </p>
              {/* Botón de ayuda */}
              <Button 
                variant="outline"
                size="lg"
                onClick={() => alert('Ayuda para Solicitantes')}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-8 py-4 rounded-xl font-medium text-lg"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                ¿Necesitas ayuda?
              </Button>
            </div>
            {/* Columna Derecha - Tutorial adaptado para Solicitante */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-2xl relative border border-gray-300" style={{aspectRatio: '16/10'}}>
                  <div className="absolute top-0 left-0 right-0 bg-gray-200 p-4 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 text-sm font-semibold">Tutorial Solicitudes</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 mt-14 bg-white">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200">
                      <div className="flex flex-col space-y-1 p-1 pt-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </div>
                    <div className="ml-12 h-full bg-gray-100 relative overflow-hidden">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-3xl font-bold text-gray-800 mb-1">Solicitudes</div>
                        <div className="text-2xl font-semibold text-gray-600">de Pago</div>
                      </div>
                      <div className="absolute top-6 left-8 w-16 h-12 bg-green-200 rounded-lg opacity-60"></div>
                      <div className="absolute top-8 right-8 w-12 h-12 bg-blue-200 rounded-full opacity-50"></div>
                      <div className="absolute bottom-12 left-6 w-20 h-8 bg-yellow-200 rounded-lg opacity-60"></div>
                      <div className="absolute bottom-20 right-12 w-14 h-14 bg-purple-200 rounded-full opacity-50"></div>
                      <div className="absolute top-20 left-1/3 w-10 h-16 bg-orange-200 rounded-lg opacity-40"></div>
                      <div className="absolute inset-0 opacity-5">
                        <div className="w-full h-full" style={{
                          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                          backgroundSize: '20px 20px'
                        }}></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 border border-gray-200">
                        <Play className="w-10 h-10 text-gray-700 ml-1" fill="currentColor" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                        <span className="text-white text-xs font-medium">Tutorial Solicitante</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}

