'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

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
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" 
         style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
}
