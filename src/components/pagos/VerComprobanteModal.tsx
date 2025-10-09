import React from 'react';
import {
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  FileBadge,
  X,
} from 'lucide-react';
// import Image from 'next/image';

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
  soporte_url?: string;
}

export interface Comprobante {
  ruta_archivo?: string;
  nombre_archivo?: string;
  fecha_subida?: string;
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

  // Construir la URL del comprobante (priorizar soporte_url de la tabla solicitudes_pago)
  let comprobanteUrl = '';
  const rutaArchivo = pago.soporte_url || comprobante?.ruta_archivo;
  
  if (rutaArchivo) {
    if (rutaArchivo.startsWith('http')) {
      comprobanteUrl = rutaArchivo;
    } else {
      const rutaNormalizada = rutaArchivo.startsWith('/')
        ? rutaArchivo
        : `/${rutaArchivo}`;
      comprobanteUrl = `https://bechapra.com.mx${rutaNormalizada}`;
    }
  }

  // Determinar el tipo de archivo
  const fileName = comprobanteUrl.split('/').pop() || '';
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  // --- Nuevo diseño igual al modal de TUKASH pero RESPONSIVE ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-blue-900/60 backdrop-blur-sm overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] flex flex-col border border-blue-100">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-1.5 sm:p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Cerrar modal">
          <span className="sr-only">Cerrar</span>
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Columna izquierda: Información */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-md">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                <FileBadge className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>COMPROBANTE DE PAGO #{pago.id_solicitud}</span>
                </h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-xs sm:text-sm"><FileText className="w-3 h-3 sm:w-4 sm:h-4" />Folio: {pago.folio || '-'}</span>
                </div>
              </div>
              <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto`}>
                {pago.departamento ? pago.departamento.toUpperCase() : '-'}
              </span>
            </header>
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-black text-sm">
                  <span className="font-semibold">Monto:</span> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-black text-sm truncate">
                  <span className="font-semibold">Cuenta:</span> {pago.cuenta_destino}
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-black text-sm truncate">
                  <span className="font-semibold">Solicitante:</span> {pago.nombre_usuario || pago.usuario_nombre || '-'}
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-black text-sm truncate">
                  <span className="font-semibold">Aprobador:</span> {pago.aprobador_nombre || '-'}
                </div>
                <div className="bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm text-black text-sm sm:col-span-2 line-clamp-2">
                  <span className="font-semibold">Concepto:</span> {pago.concepto || '-'}
                </div>
              </div>
            </div>
          </div>
          {/* Columna derecha: Previsualización del archivo */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-start lg:w-[380px] xl:w-[420px]">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 w-full">Comprobante de Pago</h3>
            <div className="w-full flex flex-col items-center justify-center">
              {comprobanteUrl ? (
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
                  <div className="relative h-[300px] sm:h-[350px] md:h-[420px] bg-gray-50 flex items-center justify-center">
                    {isImage ? (
                      <img
                        src={comprobanteUrl}
                        alt="Comprobante de Pago"
                        className="object-contain w-full h-full rounded-lg shadow-sm p-2"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : isPdf ? (
                      <iframe
                        src={comprobanteUrl}
                        title="Comprobante PDF"
                        className="w-full h-full rounded-lg border border-blue-200"
                      />
                    ) : (
                      <div className="text-center p-4 sm:p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full m-4">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium text-sm">No se puede previsualizar este archivo</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-5 flex justify-end">
                    <button
                      onClick={() => window.open(comprobanteUrl, '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm"
                    >
                      Ver completo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 sm:p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium text-sm">No hay comprobante disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};