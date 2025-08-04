'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'}}>
      <div className="text-center max-w-md bg-white/20 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-2xl">
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-white rounded-xl shadow-lg p-2 mb-2">
              <Image
                src="/assets/images/Logo_horizontal_Bechapra.png"
                alt="Logo Bechapra"
                width={192}
                height={64}
                className="w-48 h-auto"
                priority
              />
            </div>
            <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 shadow-lg">
              <ShieldX className="w-16 h-16 text-red-500" />
            </span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-4 drop-shadow">
            Acceso No Autorizado
          </h1>
          <p className="text-blue-800 mb-6">
            No tienes permisos para acceder a esta página.<br />
            Si crees que esto es un error, contacta al administrador.
          </p>
        </div>
        <div className="space-y-4">
          <Button 
            onClick={() => router.push('/login')}
            className="flex items-center space-x-2 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Ir a Login</span>
          </Button>
          <div className="pt-2">
            <p className="text-xs text-blue-700">¿Necesitas ayuda? <a href="mailto:automatizaciones@bechapra.com.mx" className="underline">Contacta al administrador</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
