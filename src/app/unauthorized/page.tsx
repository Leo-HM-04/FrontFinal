'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <ShieldX className="w-24 h-24 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-primary-dark mb-4">
            Acceso No Autorizado
          </h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página. Tu rol actual no permite esta acción.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            Ir a Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
