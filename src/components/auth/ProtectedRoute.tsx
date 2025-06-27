'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Home } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute - User:', user, 'Required roles:', requiredRoles);
    
    if (!isLoading) {
      if (!user) {
        console.log('No user, redirecting to login');
        router.push('/login');
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
        console.log(`User role "${user.rol}" not in required roles:`, requiredRoles);
        setShowError(true);
        return;
      }

      setShowError(false);
    }
  }, [user, isLoading, requiredRoles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Se está redirigiendo
  }

  if (showError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" 
           style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">×</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Acceso No Autorizado</h1>
            
            <p className="text-white/80 mb-6">
              No tienes permisos para acceder a esta página. Tu rol actual ({user.rol}) no permite esta acción.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Redirigir según el rol del usuario
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
                      router.push('/login');
                      break;
                  }
                }}
                className="w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ir a mi Dashboard
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="w-full text-white border-white/30 hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir a Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}