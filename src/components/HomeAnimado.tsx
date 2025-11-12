"use client";

import React, { useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle, Globe, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/utils/auth';

export default function HomeAnimado() {
  const email = "automatizaciones@bechapra.com.mx";
  const router = useRouter();

  // Redirigir a /home si hay token en la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('token')) {
        router.replace('/home');
      }
    }
  }, [router]);

  // Función para redirigir según el rol
  const handleDashboardRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    const user = getAuthUser();
    let dashboard = '/dashboard';
    if (user && user.rol) {
      switch (user.rol) {
        case 'admin':
          dashboard = '/dashboard/admin';
          break;
        case 'aprobador':
          dashboard = '/dashboard/aprobador';
          break;
        case 'pagador':
          dashboard = '/dashboard/pagador';
          break;
        case 'solicitante':
          dashboard = '/dashboard/solicitante';
          break;
        default:
          dashboard = '/dashboard';
      }
    }
    router.push(dashboard);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden font-sans">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-64 -right-64 w-96 h-96 bg-linear-to-br from-blue-100/40 to-indigo-100/60 rounded-full opacity-70 blur-3xl animate-drift-slow"></div>
        <div className="absolute top-1/3 -left-48 w-80 h-80 bg-linear-to-tr from-blue-200/30 to-slate-200/40 rounded-full opacity-60 blur-2xl animate-drift-reverse"></div>
        <div className="absolute bottom-32 right-1/3 w-40 h-40 bg-linear-to-bl from-indigo-200/50 to-blue-300/40 rounded-full opacity-50 blur-xl animate-float-gentle"></div>
        <div className="absolute top-20 left-1/4 w-24 h-24 bg-blue-200/20 rounded-full blur-lg animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 left-1/5 w-16 h-16 bg-indigo-300/25 rounded-full blur-md animate-drift-tiny"></div>
      </div>

      {/* Header */}
      <header className="relative w-full flex flex-col lg:flex-row items-center justify-between px-3 sm:px-4 md:px-8 lg:px-12 py-3 sm:py-4 md:py-6 bg-white/96 z-50 border-b-4 border-blue-700 shadow-sm min-h-[84px]">
        {/* Logo */}
        <div className="flex items-center justify-center lg:justify-end order-1 lg:order-2 mb-3 lg:mb-0 ml-0 lg:ml-8">
          <Image
            src="/assets/images/bechapra-logo.png"
            alt="Logo BECHAPRA"
            width={128}
            height={128}
            className="object-contain select-none drop-shadow-md w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="relative flex items-center order-2 lg:order-1 flex-1 justify-center w-full lg:w-auto">
          <div className="nav-pill flex flex-col sm:flex-row items-center gap-3 sm:gap-3 md:gap-4 px-4 sm:px-3 py-4 sm:py-3 rounded-2xl sm:rounded-full bg-gray-50 shadow-2xl border-2 border-blue-400 mx-auto max-w-[95vw] sm:max-w-[1100px] w-full lg:w-auto backdrop-blur-md">
            <a
              href="#"
              onClick={handleDashboardRedirect}
              className="nav-item nav-cta group flex items-center gap-2 sm:gap-3 font-extrabold px-3 sm:px-4 md:px-6 py-3 sm:py-2 md:py-3 rounded-xl sm:rounded-full transition-all duration-200 text-sm sm:text-base md:text-lg lg:text-xl focus:outline-none focus:ring-4 focus:ring-blue-200 w-full sm:w-auto justify-center sm:justify-start bg-white border-2 border-blue-500 hover:bg-blue-700 hover:text-white text-blue-800 shadow-lg"
              aria-current="page"
              style={{ letterSpacing: '0.01em' }}
            >
              <span className="icon-wrap inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-blue-100 shadow-sm shrink-0 group-hover:bg-blue-200">
                <ArrowRight className="icon text-blue-700 group-hover:text-blue-800" size={16} />
              </span>
              <span className="text-center sm:text-left font-extrabold">Sistema de Solicitudes y Gestión de Pagos</span>
            </a>

            <a
              href="https://bechapra.com.mx/envio-xml/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item nav-cta group flex items-center gap-2 sm:gap-3 font-extrabold px-3 sm:px-4 md:px-6 py-3 sm:py-2 md:py-3 rounded-xl sm:rounded-full transition-all duration-200 text-sm sm:text-base md:text-lg lg:text-xl focus:outline-none focus:ring-4 focus:ring-blue-200 w-full sm:w-auto justify-center sm:justify-start bg-white border-2 border-blue-500 hover:bg-blue-700 hover:text-white text-blue-800 shadow-lg"
              style={{ letterSpacing: '0.01em' }}
            >
              <span className="icon-wrap inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-blue-100 shadow-sm shrink-0 group-hover:bg-blue-200">
                <Mail className="icon text-blue-700 group-hover:text-blue-800" size={16} />
              </span>
              <span className="text-center sm:text-left font-extrabold">Envio Masivo de XML</span>
            </a>

            <a
              href="https://bechapra.com.mx/panel/extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item nav-cta group flex items-center gap-2 sm:gap-3 font-extrabold px-3 sm:px-4 md:px-6 py-3 sm:py-2 md:py-3 rounded-xl sm:rounded-full transition-all duration-200 text-sm sm:text-base md:text-lg lg:text-xl focus:outline-none focus:ring-4 focus:ring-blue-200 w-full sm:w-auto justify-center sm:justify-start bg-white border-2 border-blue-500 hover:bg-blue-700 hover:text-white text-blue-800 shadow-lg"
              style={{ letterSpacing: '0.01em' }}
            >
              <span className="icon-wrap inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-blue-100 shadow-sm shrink-0 group-hover:bg-blue-200">
                <Mail className="icon text-blue-700 group-hover:text-blue-800" size={16} />
              </span>
              <span className="text-center sm:text-left font-extrabold">Extractor de Estados de Cuenta</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col xl:flex-row items-center justify-between px-3 sm:px-4 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8 lg:py-12 xl:py-16 gap-6 sm:gap-8 xl:gap-12">
        {/* Texto */}
        <div className="w-full xl:w-1/2 z-20 order-2 xl:order-1 max-w-xl mx-auto xl:mx-0">
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 animate-fade-in justify-center xl:justify-start">
                <Shield className="text-blue-700 drop-shadow-md shrink-0" size={32} />
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-800 leading-tight tracking-tight drop-shadow-md text-center xl:text-left">
                  Bienvenido a <span className="bg-linear-to-r from-blue-700 via-blue-500 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">BECHAPRA</span>
                </h1>
              </div>
              <div className="inline-block px-4 sm:px-6 py-3 rounded-xl bg-linear-to-r from-blue-50 via-white to-blue-100 border border-blue-100 shadow-md animate-fade-in delay-200 w-full max-w-none">
                <p className="text-blue-800 text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold tracking-wide text-center xl:text-left">
                  Panel de accesos exclusivo para personal autorizado
                </p>
                <p className="text-blue-500 text-sm sm:text-base lg:text-lg mt-1 text-center xl:text-left">
                  Seleccione el sistema al que desea ingresar. Acceso restringido únicamente a colaboradores de BECHAPRA.
                </p>
                <div className="mt-3 sm:mt-4 flex flex-col gap-2 text-blue-700 text-sm sm:text-base lg:text-lg">
                  <div className="flex items-start gap-2 justify-center xl:justify-start">
                    <CheckCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <span className="text-center xl:text-left">Acceso seguro y validado para el personal de BECHAPRA.</span>
                  </div>
                  <div className="flex items-start gap-2 justify-center xl:justify-start">
                    <Shield className="text-blue-600 shrink-0 mt-0.5" size={16} />
                    <span className="text-center xl:text-left">Confidencialidad y protección de la información institucional.</span>
                  </div>
                  <div className="flex items-start gap-2 justify-center xl:justify-start">
                    <Mail className="text-blue-400 shrink-0 mt-0.5" size={16} />
                    <span className="text-center xl:text-left">
                      Soporte personalizado:{' '}
                      <a
                        href={`mailto:${email}?subject=Soporte%20BECHAPRA&body=Hola%2C%20necesito%20ayuda%20con%20el%20acceso%20a%20los%20sistemas.`}
                        className="underline hover:text-blue-900 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {email}
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ilustración */}
        <div className="w-full xl:w-1/2 flex justify-center items-center relative order-1 xl:order-2">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-md lg:max-w-lg xl:max-w-xl h-48 sm:h-60 md:h-80 lg:h-96 xl:h-112 flex items-center justify-center perspective-distant">
            <div className="relative z-10 transform-gpu rotate-x-12 rotate-y-12 transition-all duration-1000 ease-in-out">
              <div className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-24 sm:h-28 md:h-32 lg:h-40 xl:h-44 bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden transform-gpu transition-all duration-700 ease-in-out group border-2 border-blue-200/60">
                <div className="absolute inset-1.5 sm:inset-2 md:inset-3 lg:inset-4 bg-linear-to-br from-blue-100/80 via-white/70 to-blue-200/80 rounded-xl sm:rounded-2xl backdrop-blur-xl border border-blue-200/80 shadow-inner ring-2 ring-blue-100/40">
                  <div className="w-full h-full bg-linear-to-tr from-transparent via-white/30 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-2 sm:p-3 md:p-4 lg:p-6 bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-lg shadow-lg ring-2 ring-blue-200/40">
                        <Globe className="text-blue-700 drop-shadow-[0_0_16px_rgba(37,99,235,0.25)]" size={24} />
                      </div>
                    </div>
                    <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400/70 rounded-full animate-ping"></div>
                    <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-blue-300/70 rounded-full animate-ping animation-delay-1000"></div>
                    <div className="absolute top-1/3 right-4 sm:right-6 md:right-8 w-0.5 sm:w-1 h-0.5 sm:h-1 bg-blue-200/70 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-linear-to-r from-blue-400/40 via-blue-500/50 to-blue-600/40 rounded-2xl sm:rounded-3xl opacity-80 blur-2xl transition-opacity duration-1000 ease-in-out -z-10"></div>
              </div>

              <div className="absolute -top-3 sm:-top-4 md:-top-6 -left-3 sm:-left-4 md:-left-6 w-8 sm:w-10 md:w-12 lg:w-14 h-8 sm:h-10 md:h-12 lg:h-14 bg-linear-to-br from-blue-400 to-blue-500 rounded-lg sm:rounded-xl shadow-xl animate-float-smooth transform-gpu transition-transform duration-700 ease-in-out">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-3 sm:w-4 md:w-5 lg:w-6 h-3 sm:h-4 md:h-5 lg:h-6 bg-white/40 rounded-md sm:rounded-lg backdrop-blur-sm"></div>
                </div>
              </div>
              <div className="absolute -top-1 sm:-top-2 -right-6 sm:-right-8 md:-right-10 w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 bg-linear-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl shadow-xl animate-float-smooth animation-delay-500 transform-gpu transition-transform duration-700 ease-in-out">
                <div className="w-full h-full flex items-center justify-center">
                  <CheckCircle className="text-white" size={18} />
                </div>
              </div>
              <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 -left-6 sm:-left-8 md:-left-10 lg:-left-12 w-12 sm:w-16 md:w-18 lg:w-20 h-8 sm:h-10 md:h-11 lg:h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-xl animate-float-smooth animation-delay-1000 transform-gpu transition-transform duration-700 ease-in-out">
                <div className="w-full h-full flex items-center justify-center">
                  <Zap className="text-white" size={16} />
                </div>
              </div>
              <div className="absolute -bottom-3 sm:-bottom-4 md:-bottom-6 -right-3 sm:-right-4 md:-right-6 w-8 sm:w-10 md:w-12 lg:w-14 h-8 sm:h-10 md:h-12 lg:h-14 bg-linear-to-br from-blue-600 to-blue-700 rounded-full shadow-xl animate-float-smooth animation-delay-700 transform-gpu transition-transform duration-700 ease-in-out">
                <div className="w-full h-full flex items-center justify-center">
                  <Shield className="text-white" size={14} />
                </div>
              </div>

              <div className="absolute top-12 -left-16 w-10 h-10 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg animate-bounce-gentle transform-gpu"></div>
              <div className="absolute bottom-8 -right-16 w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg animate-bounce-gentle animation-delay-1500 transform-gpu"></div>
              <div className="absolute top-4 right-20 w-6 h-6 bg-linear-to-br from-blue-400 to-blue-500 rounded shadow-lg animate-pulse-soft transform-gpu"></div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d="M200 200 L120 120" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="8,4" className="animate-dash-smooth" filter="url(#glow)" />
              <path d="M200 200 L300 140" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="8,4" className="animate-dash-smooth animation-delay-300" filter="url(#glow)" />
              <path d="M200 200 L140 280" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="8,4" className="animate-dash-smooth animation-delay-600" filter="url(#glow)" />
              <path d="M200 200 L280 300" stroke="url(#connectionGradient)" strokeWidth="2" strokeDasharray="8,4" className="animate-dash-smooth animation-delay-900" filter="url(#glow)" />
            </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full flex justify-center py-5 sm:py-7 bg-linear-to-t from-blue-50 via-white/60 to-transparent border-t-2 border-blue-200/60 backdrop-blur-md shadow-inner z-40">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 w-full max-w-4xl px-2 sm:px-4 justify-between">
          <span className="text-blue-500 text-xs sm:text-sm font-medium text-center md:text-left select-none">
            © {new Date().getFullYear()} BECHAPRA. Todos los derechos reservados.
          </span>
        </div>
      </footer>

      {/* CSS */}
      <style jsx global>{`
        /* Animaciones de entrada */
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(40px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Fondo */
        @keyframes drift-slow { 0%,100%{transform:translate(0,0) rotate(0deg);} 33%{transform:translate(20px,-20px) rotate(2deg);} 66%{transform:translate(-15px,15px) rotate(-1deg);} }
        @keyframes drift-reverse { 0%,100%{transform:translate(0,0) rotate(0deg);} 50%{transform:translate(-25px,20px) rotate(-2deg);} }
        @keyframes drift-tiny { 0%,100%{transform:translate(0,0);} 50%{transform:translate(8px,-8px);} }

        /* Float/Pulse */
        @keyframes float-gentle { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-8px) scale(1.02);} }
        @keyframes float-smooth { 0%,100%{transform:translateY(0) translateX(0) rotate(0);} 33%{transform:translateY(-8px) translateX(2px) rotate(1deg);} 66%{transform:translateY(-4px) translateX(-2px) rotate(-0.5deg);} }
        @keyframes bounce-gentle { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-6px) scale(1.05);} }
        @keyframes pulse-soft { 0%,100%{opacity:.6; transform:scale(1);} 50%{opacity:.9; transform:scale(1.1);} }
        @keyframes dash-smooth { 0%{stroke-dashoffset:0; opacity:.8;} 50%{opacity:1;} 100%{stroke-dashoffset:24; opacity:.8;} }

        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-drift-slow { animation: drift-slow 20s ease-in-out infinite; }
        .animate-drift-reverse { animation: drift-reverse 25s ease-in-out infinite reverse; }
        .animate-drift-tiny { animation: drift-tiny 15s ease-in-out infinite; }
        .animate-float-gentle { animation: float-gentle 4s ease-in-out infinite; }
        .animate-float-smooth { animation: float-smooth 6s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 5s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
        .animate-dash-smooth { animation: dash-smooth 3s linear infinite; }

        /* Delays */
        .animation-delay-200 { animation-delay: .2s; }
        .animation-delay-300 { animation-delay: .3s; }
        .animation-delay-400 { animation-delay: .4s; }
        .animation-delay-500 { animation-delay: .5s; }
        .animation-delay-600 { animation-delay: .6s; }
        .animation-delay-700 { animation-delay: .7s; }
        .animation-delay-900 { animation-delay: .9s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1500 { animation-delay: 1.5s; }

        /* Utilidades 3D */
        .perspective-distant { perspective: 1200px; }

        /* Tipografía */
        .font-sans {
          font-family: 'Inter','Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;
          font-feature-settings: 'cv02','cv03','cv04','cv11';
        }

        /* Sombras + nav styles */
        .shadow-3xl { box-shadow: 0 35px 60px -12px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.05); }

        .nav-pill { transition: box-shadow 200ms ease, transform 200ms ease; transform-origin: left center; margin-top: 6px; }
        .nav-pill:hover { transform: translateY(-2px); box-shadow: 0 18px 40px -18px rgba(59,130,246,.45); }

        .nav-item { background: transparent; }
        .nav-item:hover { background: linear-gradient(90deg,#1565d8 0%,#1e3a8a 100%); color: #fff; transform: translateY(-1px); }
        .nav-cta { background: linear-gradient(90deg,#e6f0ff 0%,#ffffff 100%); }
        .nav-cta:hover { transform: scale(1.03); box-shadow: 0 20px 45px -20px rgba(30,64,175,.35); }
        .nav-cta .icon { transition: transform 220ms cubic-bezier(.2,.9,.3,1); }
        .nav-cta:hover .icon { transform: translateX(6px) rotate(6deg); color: #fff; }
        .nav-cta .icon-wrap { transition: background 180ms ease, transform 220ms ease; }
        .nav-cta:hover .icon-wrap { transform: translateX(4px); background: linear-gradient(90deg,#fff 0%,#dbeafe 100%); }
        .nav-item-disabled { opacity: .9; background: transparent; }

        /* --- CORRECCIÓN: No ocultar textos en móvil --- */
        @media (max-width: 768px) {
          .nav-pill { gap: 8px; padding: 8px; margin-top: 0; box-shadow: 0 10px 30px -12px rgba(59,130,246,.25); }
          .nav-pill { max-width: 96vw; }

          /* Permite que el texto se vea y haga salto de línea */
          .nav-item { white-space: normal; }
          .nav-item .text-center { line-height: 1.15; }
        }
      `}</style>
    </div>
  );
}

