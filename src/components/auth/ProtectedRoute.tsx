'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredRoles, router, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-dark">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || (requiredRoles.length > 0 && !requiredRoles.includes(user.rol))) {
    return null;
  }

  return <>{children}</>;
}
