'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const path = useMemo(() => {
    if (isLoading) return null;
    if (!user) return '/login';

    switch (user.rol) {
      case 'admin_general': return '/dashboard/admin';
      case 'solicitante': return '/dashboard/solicitante';
      case 'aprobador': return '/dashboard/aprobador';
      case 'pagador_banca': return '/dashboard/pagador';
      default: return '/login';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (path) router.replace(path);
  }, [path, router]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}>
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  );
}
