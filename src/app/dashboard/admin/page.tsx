'use client';


import { useState, useRef, useEffect } from 'react';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HelpCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const [showVideo] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [openModal, setOpenModal] = useState(false);

  // Listener para saber si el video terminó
  useEffect(() => {
    if (!showVideo) return;
    function handleMessage(event: MessageEvent) {
      // Solo aceptar mensajes de YouTube
      if (typeof event.data === 'string' && event.data.indexOf('"event":"onStateChange"') !== -1) {
        try {
          const data = JSON.parse(event.data);
          // 0 = ended
          if (data.event === 'onStateChange' && data.info === 0) {
            // Reiniciar el video usando la API de YouTube
            if (iframeRef.current) {
              iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
                '*'
              );
              iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                '*'
              );
            }
          }
        } catch {}
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showVideo]);

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main Content Mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
            {/* Título Principal ocupa ambas columnas */}
            <h1 className="col-span-1 lg:col-span-2 text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg text-white mb-4 text-center lg:text-left">
              PLATAFORMA DE PAGOS
            </h1>
            {/* Columna Izquierda - Contenido */}
            <div className="text-white space-y-8">
              {/* Subtítulo */}
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-200">
                Panel exclusivo para el administrador: controla, supervisa y configura toda la plataforma de pagos.
              </h2>

              {/* Texto descriptivo profesional */}
              <div className="text-lg md:text-xl text-white/90 leading-relaxed max-w-xl text-justify">
                Este es el panel de administración de la plataforma de pagos Bechapra. Como administrador, puedes gestionar de manera centralizada y eficiente todas las operaciones relacionadas con solicitudes, aprobaciones y pagos. Accede a herramientas avanzadas para la administración de plantillas recurrentes, controla el flujo de autorizaciones y mantén un historial detallado de cada transacción. Todo en un entorno seguro, moderno y diseñado para optimizar la experiencia de gestión financiera de tu organización.
              </div>

              {/* Botón de ayuda destacado */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setOpenModal(true)}
                className="bg-white border-2 border-blue-400 text-blue-700 font-semibold shadow-md hover:bg-blue-50 hover:border-blue-500 focus:text-blue-700 active:text-blue-700 hover:text-blue-600 transition-all duration-200 px-8 py-4 rounded-xl text-lg flex items-center gap-3 group"
              >
                <HelpCircle className="w-7 h-7 text-blue-500 group-hover:text-blue-600 transition-colors duration-200 mr-2" />
                <span className="tracking-wide group-hover:text-blue-600 group-focus:text-blue-700 group-active:text-blue-700">¿Necesitas ayuda?</span>
              </Button>

              {/* Modal de aviso de correo */}
              <Transition.Root show={openModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={setOpenModal}>
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
                  </Transition.Child>
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                      <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-blue-200 flex flex-col items-center">
                        <div className="flex items-center gap-3 mb-4">
                          <HelpCircle className="w-8 h-8 text-blue-500" />
                          <Dialog.Title className="text-xl font-bold text-blue-900">Abriendo gestor de correo</Dialog.Title>
                        </div>
                        <p className="text-blue-900/90 text-base mb-4 text-center">Se abrirá tu gestor de correo para contactar a soporte. Puedes copiar y personalizar el siguiente ejemplo:</p>
                        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 font-mono mb-4 select-all">
                          Asunto: Solicitud de soporte plataforma Bechapra

                          Hola equipo de soporte,

                          Tengo el siguiente problema o duda:
                          [Describe aquí tu situación de forma clara y breve]

                          Gracias de antemano.
                        </div>
                        <button
                          className="mt-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                          onClick={() => {
                            setOpenModal(false);
                            window.open('mailto:automatizaciones@bechapra.com.mx?subject=Solicitud%20de%20soporte%20plataforma%20Bechapra&body=Hola%20equipo%20de%20soporte%2C%0A%0ATengo%20el%20siguiente%20problema%20o%20duda%3A%0A%5BDescribe%20aqu%C3%AD%20tu%20situaci%C3%B3n%20de%20forma%20clara%20y%20breve%5D%0A%0AGracias%20de%20antemano.', '_blank');
                          }}
                        >Contactar soporte</button>
                        <button
                          className="mt-2 px-4 py-1 text-blue-500 hover:underline text-sm"
                          onClick={() => setOpenModal(false)}
                        >Cancelar</button>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </Dialog>
              </Transition.Root>
            </div>

            {/* Columna Derecha - Video YouTube mejorado */}
            <div className="flex justify-center lg:justify-end">
              {showVideo && (
                <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-blue-200/60 animate-fade-in">
                  <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/8afFGtJuXaI?si=uiPv63ySVzzA2XpQ&autoplay=1&mute=1&controls=1&enablejsapi=1"
                    title="Tutorial Plataforma de Pagos"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                  <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-blue-400/30 animate-glow" />
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
