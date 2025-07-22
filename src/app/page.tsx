'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const roleRoutes: Record<string, string> = {
  admin_general: '/dashboard/admin',
  solicitante: '/dashboard/solicitante',
  aprobador: '/dashboard/aprobador',
  pagador_banca: '/dashboard/pagador',
};

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !redirected.current) {
      redirected.current = true;
      if (user) {
        const route = roleRoutes[user.rol];
        router.push(route || '/login');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
    >
      <div className="text-center text-white" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Redirigiendo...</p>
      </div>
    </div>
  );
}