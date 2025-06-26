'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-montserrat">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-montserrat">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-blue-600 font-montserrat mb-6">
          Plataforma de Pagos
        </h1>
        <p className="text-xl text-gray-700 mb-8 font-medium">
          Sistema de gestión de solicitudes de pago con autenticación y autorización por roles
        </p>
        <div className="space-y-4">
          <Button 
            size="lg" 
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto font-semibold"
          >
            Iniciar Sesión
          </Button>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 font-montserrat">
              Usuarios de Prueba (API: localhost:4000)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-montserrat">
              <div className="text-center">
                <p className="font-semibold text-blue-600">Administrador</p>
                <p className="text-gray-600">admin@bechapra.com</p>
                <p className="text-gray-600">admin123</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-blue-500">Solicitante</p>
                <p className="text-gray-600">[nombre]@bechapra.com</p>
                <p className="text-gray-600">solicitante123</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-600">Aprobador</p>
                <p className="text-gray-600">[nombre]@bechapra.com</p>
                <p className="text-gray-600">aprobador123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}