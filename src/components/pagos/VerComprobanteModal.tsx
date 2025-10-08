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

  // Construir la URL del comprobante
  let comprobanteUrl = '';
  if (comprobante?.ruta_archivo) {
    if (comprobante.ruta_archivo.startsWith('http')) {
      comprobanteUrl = comprobante.ruta_archivo;
    } else {
      const rutaArchivo = comprobante.ruta_archivo.startsWith('/')
        ? comprobante.ruta_archivo
        : `/${comprobante.ruta_archivo}`;
      comprobanteUrl = rutaArchivo;
    }
  }

  // Determinar el tipo de archivo
  const fileName = comprobanteUrl.split('/').pop() || '';
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  // --- Nuevo diseño igual al modal de TUKASH ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        <button onClick={onClose} className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Cerrar modal">
          <span className="sr-only">Cerrar</span>
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: Información */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <FileBadge className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>COMPROBANTE DE PAGO #{pago.id_solicitud}</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Folio: {pago.folio || '-'}</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                {pago.departamento ? pago.departamento.toUpperCase() : '-'}
              </span>
            </header>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Monto: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(pago.monto)}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Cuenta destino: {pago.cuenta_destino}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Solicitante: {pago.nombre_usuario || pago.usuario_nombre || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Aprobador: {pago.aprobador_nombre || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Concepto: {pago.concepto || '-'}</div>
              </div>
            </div>
          </div>
          {/* Columna derecha: Previsualización del archivo */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-start">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 w-full">Comprobante de Pago</h3>
            <div className="w-full flex flex-col items-center justify-center">
              {comprobanteUrl ? (
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
                  <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                    {isImage ? (
                      <img
                        src={comprobanteUrl}
                        alt="Comprobante de Pago"
                        className="object-contain w-full h-full rounded-lg shadow-sm"
                        style={{ maxHeight: '420px', width: '100%' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : isPdf ? (
                      <iframe
                        src={comprobanteUrl}
                        title="Comprobante PDF"
                        className="w-full h-full rounded-lg border border-blue-200"
                        style={{ minHeight: '420px', height: '420px' }}
                      />
                    ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No se puede previsualizar este archivo</p>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex justify-end">
                    <button
                      onClick={() => window.open(comprobanteUrl, '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs"
                    >
                      Ver completo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No hay comprobante disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};