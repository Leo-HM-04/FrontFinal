'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  const getRoleLabel = (role: string) => {
    const roles = {
      admin_general: 'Administrador General',
      solicitante: 'Solicitante',
      aprobador: 'Aprobador',
      pagador_banca: 'Pagador Banca'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-blue">
              Plataforma de Pagos 
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="font-medium">{user?.nombre}</span>
              <span className="text-xs px-2 py-1 bg-primary-blue text-white rounded-full">
                {getRoleLabel(user?.rol || '')}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                window.location.replace('/login');
              }}
              className="flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
