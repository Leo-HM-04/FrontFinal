import React from 'react';
import {
  Banknote,
  FileText,
  FileBadge,
  X,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

interface Pago {
  id_solicitud: number;
  monto: number;
  cuenta_destino: string;
  fecha_pago?: string;
  departamento?: string;
  nombre_usuario?: string;
  usuario_nombre?: string;
  concepto?: string;
  folio?: string;
  fecha_creacion?: string;
  aprobador_nombre?: string;
  comentario_aprobador?: string;
  tipo_pago?: string;
}

export interface Comprobante {
  ruta_archivo?: string;
}

interface VerComprobanteModalProps {
  open: boolean;
  pago: Pago;
  comprobante: Comprobante;
  onClose: () => void;
}

export const VerComprobanteModal: React.FC<VerComprobanteModalProps> = ({
  open,
  pago,
  comprobante,
  onClose,
}) => {
  if (!open || !pago) return null;

  // Formatear la fecha de pago
  let fechaPagoProfesional = '-';
  let fechaPagoTooltip = '';
  if (pago.fecha_pago) {
    try {
      const fecha = new Date(pago.fecha_pago);
      fechaPagoProfesional = fecha.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      fechaPagoProfesional =
        fechaPagoProfesional.charAt(0).toUpperCase() + fechaPagoProfesional.slice(1);
      fechaPagoTooltip = fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      const fallbackDate = new Date(pago.fecha_pago);
      fechaPagoProfesional = fallbackDate.toLocaleDateString('es-CO');
      fechaPagoTooltip = fallbackDate.toLocaleString('es-CO');
    }
  }

  // Construir la URL del comprobante
  let comprobanteUrl = '';
  if (comprobante?.ruta_archivo) {
    if (comprobante.ruta_archivo.startsWith('http')) {
      comprobanteUrl = comprobante.ruta_archivo;
    } else {
      const baseUrl = 'http://46.202.177.106:4000';
      const rutaArchivo = comprobante.ruta_archivo.startsWith('/')
        ? comprobante.ruta_archivo
        : `/${comprobante.ruta_archivo}`;
      comprobanteUrl = `${baseUrl}${rutaArchivo}`;
    }
  }

  // Determinar el tipo de archivo
  const fileName = comprobanteUrl.split('/').pop() || '';
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo degradado oscuro/transparente mejorado */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Contenedor con scroll interno */}
        <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
          {/* Botón de cerrar (X) flotante mejorado */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-8 relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Solicitud #{pago.id_solicitud}
                  {pago.folio && (
                    <span className="ml-4 text-base font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">Folio: {pago.folio}</span>
                  )}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <p className="text-blue-100 text-lg">
                    Fecha de pago:
                    <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md ml-2" title={fechaPagoTooltip}>
                      {fechaPagoProfesional}
                    </span>
                  </p>
                  {pago.fecha_creacion && (
                    <p className="text-blue-100 text-lg">
                      Creada el:
                      <span className="font-mono text-blue-200 bg-white/10 px-2 py-1 rounded-md ml-2">
                        {new Date(pago.fecha_creacion).toLocaleDateString('es-CO', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col gap-2 items-end">
                <span className="inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 bg-blue-100 text-blue-800 border-blue-200 backdrop-blur-sm">
                  {pago.departamento ? pago.departamento.toUpperCase() : '-'}
                </span>
                {pago.tipo_pago && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow mt-1">
                    {pago.tipo_pago}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* Información Principal */}
            <div className="grid grid-cols-1 gap-8 mb-8">
              <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <Banknote className="w-6 h-6 text-blue-700" />
                  </div>
                  Información Financiera
                </h3>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-blue-300/50 mb-6 shadow-lg">
                  <span className="text-sm uppercase tracking-wider text-blue-100 font-bold block mb-2">Monto total</span>
                  <p className="text-4xl font-black text-white tracking-tight">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</p>
                  <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
                </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-white p-2 rounded-md">
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta Destino</span>
                <p className="text-blue-900 font-medium">{pago.cuenta_destino}</p>
              </div>
              <div className="bg-white p-2 rounded-md">
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Solicitante</span>
                <p className="text-blue-900 font-medium">{pago.nombre_usuario || pago.usuario_nombre || '-'}</p>
              </div>
              {pago.aprobador_nombre && (
                <div className="bg-white p-2 rounded-md col-span-2">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Aprobado por</span>
                  <p className="text-blue-900 font-medium">{pago.aprobador_nombre}</p>
                </div>
              )}
              {pago.comentario_aprobador && (
                <div className="bg-white p-2 rounded-md col-span-2">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Comentario del aprobador</span>
                  <p className="text-blue-900 font-medium">{pago.comentario_aprobador}</p>
                </div>
              )}
            </div>
                <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80 mb-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Concepto</h4>
                  <p className="text-blue-900 p-2 bg-white rounded-md">{pago.concepto}</p>
                </div>
              </div>
            </div>
            {/* Documentos Adjuntos */}
            <div className="p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <FileBadge className="w-6 h-6 text-purple-700" />
                </div>
                Comprobante de Pago
              </h3>
              {comprobanteUrl ? (
                <div className="space-y-4">
                  {/* Previsualización de comprobante */}
                  {isImage ? (
                    <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                      <span className="text-sm text-blue-700 mb-2 flex items-center font-medium">
                        <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                        Previsualización de comprobante:
                      </span>
                      <div className="relative w-full h-40 group mt-2">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                        <Image
                          src={comprobanteUrl}
                          alt="Comprobante"
                          fill
                          className="rounded-lg border border-blue-200 shadow-sm transition-all duration-300 hover:shadow-md object-contain bg-white/90"
                          onLoadingComplete={(img) => {
                            img.classList.remove('animate-pulse');
                          }}
                          quality={85}
                        />
                        <div 
                          className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                          onClick={() => window.open(comprobanteUrl, '_blank')}
                        />
                      </div>
                    </div>
                  ) : isPdf ? (
                    <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                      <span className="text-sm text-blue-700 mb-2 flex items-center gap-2 font-medium">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Previsualización de comprobante (PDF):
                      </span>
                      <div className="rounded-xl overflow-hidden border-2 border-blue-300 shadow-lg bg-white">
                        <iframe 
                          src={comprobanteUrl} 
                          title="Comprobante PDF" 
                          className="w-full" 
                          style={{height: '400px'}} 
                        />
                      </div>
                      <div className="bg-blue-100/80 text-blue-800 text-xs text-center rounded-b-xl py-2 mt-1 font-semibold tracking-wide">
                        Vista previa limitada. Haz clic en <span className="font-bold">&quot;Ver completo&quot;</span> para abrir el PDF en otra pestaña.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                      <span className="text-sm text-blue-700 mb-2 block font-medium">Archivo adjunto:</span>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">No se puede previsualizar, haz clic en &quot;Ver completo&quot; para abrir</span>
                    </div>
                  )}
                  {/* Botón de ver completo */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <a
                      href={comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 inline-flex items-center gap-2 font-semibold"
                    >
                      <FileText className="w-4 h-4" />
                      Ver completo
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 flex items-center font-medium">
                    <FileText className="w-4 h-4 mr-1.5 text-gray-500" />
                    No hay comprobante disponible
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
