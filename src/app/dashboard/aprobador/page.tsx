'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { CheckCircle, FileText, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AprobadorDashboard() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl font-bold text-white text-center flex-1 font-montserrat tracking-wide">
                DASHBOARD APROBADOR
              </h1>
              <div className="flex items-center space-x-4">
                <div className="text-white text-sm">
                  <span className="font-medium">{user?.nombre}</span>
                  <span className="block text-xs text-white/80">Aprobador</span>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bienvenido, {user?.nombre}
            </h2>
            <p className="text-xl text-white/80">
              Panel de Aprobador - Revisa y aprueba solicitudes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Solicitudes Pendientes</h4>
              <p className="text-white/80 text-sm">Revisar solicitudes por aprobar</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Solicitudes Aprobadas</h4>
              <p className="text-white/80 text-sm">Ver historial de aprobaciones</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Mi Perfil</h4>
              <p className="text-white/80 text-sm">Actualizar información personal</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}