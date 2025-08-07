'use client';

import { Button } from '@/components/ui/Button';
import type { Solicitud } from '@/types/index';
import { CreditCard, FileText, Building, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface PagoDetailModalProps {
  isOpen: boolean;
  pago: Solicitud | null;
  onClose: () => void;
}

export function PagoDetailModal({ isOpen, pago, onClose }: PagoDetailModalProps) {
  if (!isOpen || !pago) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo degradado y blur */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Scroll interno */}
        <div className="overflow-y-auto max-h-[92vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400 px-2 md:px-6 pb-8 pt-2">
          {/* Botón cerrar flotante */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            aria-label="Cerrar"
          >
            ×
          </button>
          {/* Header con gradiente y estado */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white px-8 py-6 md:py-8 rounded-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">
                  Pago #{pago.id_solicitud}
                </h2>
                <p className="text-blue-100 text-lg">
                  Monto: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{formatCurrency(pago.monto)}</span>
                </p>
                <p className="text-blue-200 mt-2">
                  Creado el {formatDate(pago.fecha_creacion)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 bg-green-100 text-green-800 border-green-200 backdrop-blur-sm">
                  {pago.estado.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="px-0 md:px-2 space-y-8">
            {/* Información Principal */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
              <div className="xl:col-span-2">
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-xl mr-3">
                      <CreditCard className="w-6 h-6 text-blue-700" />
                    </div>
                    Información de Pago
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3">
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Solicitante</span>
                      <p className="text-blue-900 font-medium">{typeof pago.nombre_usuario === 'string' && pago.nombre_usuario
                        ? pago.nombre_usuario
                        : typeof pago.usuario_nombre === 'string' && pago.usuario_nombre
                        ? pago.usuario_nombre
                        : '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Departamento</span>
                      <p className="text-blue-900 font-medium">{pago.departamento ? pago.departamento.charAt(0).toUpperCase() + pago.departamento.slice(1).toLowerCase() : '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de pago</span>
                      <p className="text-blue-900 font-medium">{pago.tipo_pago ? pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1).toLowerCase() : '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta destino</span>
                      <p className="font-mono text-blue-900 font-medium">{pago.cuenta_destino}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50/30 rounded-md p-2 md:p-3 border border-blue-100/80 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Banco y detalles</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Banco</span>
                        <p className="text-blue-900 font-medium">{pago.banco_destino || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de cuenta</span>
                        <p className="text-blue-900 font-medium">{pago.tipo_cuenta_destino || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Concepto</span>
                    <p className="text-blue-900 p-2 md:p-3 bg-white rounded-md">{pago.concepto || '-'}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                      <Building className="w-6 h-6 text-indigo-700" />
                    </div>
                    Información Organizacional
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado actual</span>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-3 bg-green-400 shadow-lg"></div>
                      <p className="font-black text-2xl text-white tracking-tight">{pago.estado.toUpperCase()}</p>
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-20"></div>
                  </div>
                  <div className="bg-blue-50/30 rounded-md p-2 md:p-3 border border-blue-100/80 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Aprobador</h4>
                    <p className="text-blue-900 font-medium">{pago.aprobador_nombre || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Archivos y comprobantes + comentario alineados y mejorados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
              {/* Documentos Adjuntos */}
              <div className="lg:col-span-3 p-5 md:p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <FileText className="w-6 h-6 text-green-700" />
                  </div>
                  Documentos Adjuntos
                </h3>
                <div className="space-y-4">
                  {/* Previsualización de factura */}
                  {pago.factura_url ? (() => {
                    let facturaUrl = '';
                    if (pago.factura_url.startsWith('http')) {
                      facturaUrl = pago.factura_url;
                    } else {
                      const baseUrl = 'http://localhost:4000';
                      const rutaArchivo = pago.factura_url.startsWith('/') 
                        ? pago.factura_url 
                        : `/${pago.factura_url}`;
                      facturaUrl = `${baseUrl}${rutaArchivo}`;
                    }
                    const fileName = facturaUrl.split('/').pop();
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(facturaUrl);
                    const isPdf = /\.pdf$/i.test(facturaUrl);
                    if (isImage) {
                      return (
                        <div className="bg-blue-50/30 p-2 md:p-3 rounded-lg border border-blue-100">
                          <span className="text-sm text-blue-700 mb-2 flex items-center font-medium">
                            <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                            Previsualización de factura:
                          </span>
                          <div className="relative w-full h-40 group mt-2">
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                            <Image
                              src={facturaUrl}
                              alt="Factura"
                              fill
                              className="rounded-lg border border-blue-200 shadow-sm transition-all duration-300 hover:shadow-md object-contain bg-white/90"
                              onLoadingComplete={(img) => {
                                img.classList.remove('animate-pulse');
                              }}
                              quality={85}
                            />
                            <div 
                              className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                              onClick={() => window.open(facturaUrl, '_blank')}
                            />
                          </div>
                        </div>
                      );
                    } else if (isPdf) {
                      return (
                        <div className="bg-white p-0 md:p-0 rounded-xl border border-blue-200 shadow-lg flex flex-col items-center">
                          <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                            <span className="text-sm text-blue-700 font-semibold flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-blue-600" />
                              Previsualización de factura (PDF)
                            </span>
                            <button
                              onClick={() => window.open(facturaUrl, '_blank')}
                              className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition"
                            >
                              Abrir en nueva pestaña <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                          <iframe
                            src={facturaUrl}
                            title={"Factura PDF"}
                            className="w-full rounded-b-xl bg-white border-0"
                            style={{ minHeight: '540px', height: '540px', maxHeight: '70vh' }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-blue-50/30 p-2 md:p-3 rounded-lg border border-blue-100">
                          <span className="text-sm text-blue-700 mb-2 block font-medium">Archivo adjunto:</span>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-700" />
                            <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">No se puede previsualizar, haz clic en &quot;Ver Factura&quot; para abrir</span>
                        </div>
                      );
                    }
                  })() : (
                    <span className="text-blue-400">No hay factura adjunta</span>
                  )}
                  {/* Botón para ver factura */}
                  {pago.factura_url && (
                    <button
                      onClick={() => {
                        let facturaUrl = '';
                        if (pago.factura_url.startsWith('http')) {
                          facturaUrl = pago.factura_url;
                        } else {
                          const baseUrl = 'http://localhost:4000';
                          const rutaArchivo = pago.factura_url.startsWith('/') 
                            ? pago.factura_url 
                            : `/${pago.factura_url}`;
                          facturaUrl = `${baseUrl}${rutaArchivo}`;
                        }
                        window.open(facturaUrl, '_blank');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Factura
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Botones de Acción */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8 border-t border-blue-100">
              <Button
                onClick={onClose}
                className="bg-blue-600 text-white font-bold px-10 py-3 text-lg rounded-xl shadow hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all border-none"
                style={{ boxShadow: '0 2px 8px 0 rgba(30, 64, 175, 0.10)' }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
