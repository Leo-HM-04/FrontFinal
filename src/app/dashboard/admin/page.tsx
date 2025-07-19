'use client';

import { Play, HelpCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main Content Mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
            {/* Columna Izquierda - Contenido */}
            <div className="text-white space-y-8">
              {/* Título Principal */}
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
                PLATAFORMA DE PAGOS
              </h1>

              {/* Subtítulo */}
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-200">
                Panel exclusivo para el administrador: controla, supervisa y configura toda la plataforma de pagos.
              </h2>

              {/* Texto descriptivo profesional */}
              <div className="text-lg md:text-xl text-white/90 leading-relaxed max-w-xl text-justify">
                Este es el panel de administración de la plataforma de pagos Bechapra. Como administrador, puedes gestionar de manera centralizada y eficiente todas las operaciones relacionadas con solicitudes, aprobaciones y pagos. Accede a herramientas avanzadas para la administración de plantillas recurrentes, controla el flujo de autorizaciones y mantén un historial detallado de cada transacción. Todo en un entorno seguro, moderno y diseñado para optimizar la experiencia de gestión financiera de tu organización.
              </div>

              {/* Botón de ayuda destacado */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://wa.me/5215555555555', '_blank')}
                className="bg-gradient-to-r from-blue-600/80 to-blue-400/80 text-white border-0 shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3"
              >
                <HelpCircle className="w-6 h-6 mr-2" />
                ¿Necesitas ayuda?
              </Button>
            </div>

            {/* Columna Derecha - Video YouTube mejorado */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-200/60 animate-fade-in">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/8afFGtJuXaI?si=uiPv63ySVzzA2XpQ&autoplay=1&mute=1&controls=1"
                  title="Tutorial Plataforma de Pagos"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-blue-400/30 animate-glow" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
