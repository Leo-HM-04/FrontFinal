'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { CheckCircle, FileText, User, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AprobadorDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h1 className="text-2xl font-bold text-white font-sans">
              Bienvenido a la Plataforma de Pagos
            </h1>
            <p className="text-white/80">
              Panel de aprobador de Bechapra
            </p>
          </div>

          {/* Main Content - Welcome Section + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
            {/* Left Column - Welcome Content */}
            <div className="text-white space-y-8">
              {/* Title */}
              <h2 className="text-4xl font-bold leading-tight">
                ÁREA DE APROBADOR
              </h2>
              
              {/* Subtitle */}
              <h3 className="text-2xl font-semibold">
                Bienvenido, {user?.nombre}
              </h3>
              
              {/* Description */}
              <p className="text-lg text-white leading-relaxed max-w-md">
                En esta plataforma podrás revisar, aprobar o rechazar solicitudes de pago, así como consultar el historial de solicitudes previamente procesadas.
              </p>

              {/* Help Button */}
              <Button 
                variant="outline"
                size="lg"
                onClick={() => alert('Ayuda para aprobadores')}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-8 py-4 rounded-xl font-medium text-lg"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                ¿Necesitas ayuda?
              </Button>
            </div>
          </div>
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}