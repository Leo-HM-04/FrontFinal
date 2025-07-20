'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { HelpCircle, Mail, FileText, User, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function PagadorDashboardNew() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSendingHelp, setIsSendingHelp] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Función para enviar correo al administrador solicitando ayuda
  const handleRequestHelp = async () => {
    setIsSendingHelp(true);
    try {
      // Simulamos el envío del correo (esto se conectaría a una API real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En un entorno real, aquí se enviaría el correo utilizando una API
      // await fetch('/api/contact', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     from: user?.email,
      //     subject: 'Solicitud de ayuda - Módulo Pagador',
      //     message: `El usuario ${user?.nombre} (${user?.email}) ha solicitado ayuda con el módulo de pagador.`
      //   })
      // });
      
      // Mostrar confirmación
      setShowHelpModal(true);
      toast.success('Solicitud de ayuda enviada al administrador');
    } catch (error) {
      console.error('Error al enviar la solicitud de ayuda:', error);
      toast.error('No se pudo enviar la solicitud. Intente nuevamente.');
    } finally {
      setIsSendingHelp(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h1 className="text-2xl font-bold text-white font-sans">
              Bienvenido a la Plataforma de Pagos
            </h1>
            <p className="text-white/80">
              Panel de pagador de Bechapra
            </p>
          </div>

          {/* Main Content - Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-12">
            {/* Left Column - Welcome Content */}
            <div className="text-white space-y-8">
              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                ÁREA DE PAGADOR
              </h2>
              {/* Subtitle */}
              <h3 className="text-xl sm:text-2xl font-semibold">
                Bienvenido, {user?.nombre}
              </h3>
              {/* Description */}
              <p className="text-base sm:text-lg text-white leading-relaxed max-w-md">
                En esta plataforma podrás procesar pagos de solicitudes aprobadas, consultar el historial de pagos realizados y gestionar tus datos personales.
              </p>
              {/* Help Button */}
              <Button 
                variant="outline"
                size="lg"
                onClick={handleRequestHelp}
                disabled={isSendingHelp}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium text-base sm:text-lg w-full sm:w-auto"
              >
                {isSendingHelp ? (
                  <>
                    <Mail className="w-5 h-5 mr-3 animate-pulse" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-5 h-5 mr-3" />
                    Contactar al administrador
                  </>
                )}
              </Button>
            </div>
            {/* Right Column - Quick Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer flex flex-col justify-center"
                onClick={() => router.push('/dashboard/pagador/pagos/pendientes')}
              >
                <div className="flex flex-col items-center text-center">
                  <CreditCard className="w-10 h-10 text-yellow-300 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Pagos Pendientes</h4>
                  <p className="text-white/80 text-sm">Procesar pagos aprobados</p>
                </div>
              </div>
              <div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer flex flex-col justify-center"
                onClick={() => router.push('/dashboard/pagador/pagos/historial')}
              >
                <div className="flex flex-col items-center text-center">
                  <FileText className="w-10 h-10 text-green-300 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Historial de Pagos</h4>
                  <p className="text-white/80 text-sm">Ver pagos procesados</p>
                </div>
              </div>
              <div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer flex flex-col justify-center sm:col-span-2"
                onClick={() => router.push('/dashboard/pagador/perfil')}
              >
                <div className="flex flex-col items-center text-center">
                  <User className="w-10 h-10 text-blue-300 mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Mi Perfil</h4>
                  <p className="text-white/80 text-sm">Ver información personal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de confirmación de ayuda */}
        {showHelpModal && (
          <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
              onClick={() => setShowHelpModal(false)}
              aria-hidden="true"
            />
            <div 
              className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg m-4 z-[10000] animate-slide-up flex flex-col items-center"
              role="dialog"
              aria-modal="true"
            >
              <Mail className="h-16 w-16 text-blue-600 mb-4" />
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Solicitud Enviada</h3>
              
              <p className="text-gray-600 text-center mb-6">
                Tu solicitud de ayuda ha sido enviada al administrador. Te contactarán a la brevedad posible a través de tu correo registrado ({user?.email}).
              </p>
              
              <div className="border-t border-gray-200 w-full my-4 pt-4 text-center text-gray-500">
                <p className="mb-2">Si es urgente, también puedes comunicarte al:</p>
                <p className="font-medium text-blue-600">ti@bechapra.com</p>
              </div>
              
              <Button 
                onClick={() => setShowHelpModal(false)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </PagadorLayout>
    </ProtectedRoute>
  );
}
