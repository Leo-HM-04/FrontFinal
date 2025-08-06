import React from 'react';
import {
  Banknote,
  User2,
  FileText,
  FileBadge,
  X,
  CalendarDays,
} from 'lucide-react';

interface Pago {
  id_solicitud: number;
  monto: number;
  cuenta_destino: string;
  fecha_pago?: string;
  departamento?: string;
  nombre_usuario?: string;
  usuario_nombre?: string;
  concepto?: string;
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

 const comprobanteUrl = comprobante?.ruta_archivo
  ? new URL(comprobante.ruta_archivo, 'http://localhost:4000').toString()
  : '';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full relative border border-blue-200 flex flex-col"
        style={{ boxShadow: '0 8px 32px rgba(30,64,175,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 rounded-t-3xl bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400">
          <h2 className="text-2xl font-extrabold text-white tracking-wide">
            Solicitud #{pago.id_solicitud}
          </h2>
          <button
            className="text-white bg-blue-300 hover:bg-red-500 hover:text-white rounded-full p-2 text-xl font-bold transition"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información financiera y organizacional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 py-6">
          {/* Información financiera */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex-1">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
              <Banknote className="w-5 h-5" />
              Información Financiera
            </div>
            <div className="mb-2">
              <span className="font-bold text-blue-700">Monto:</span>{' '}
              <span className="text-blue-900 font-extrabold text-xl">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(pago.monto)}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-bold text-blue-700">Cuenta Destino:</span>{' '}
              <span className="text-blue-900">{pago.cuenta_destino}</span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-bold text-blue-700">Fecha de Pago:</span>
              <span
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded border border-blue-200"
                title={fechaPagoTooltip}
              >
                <CalendarDays className="w-4 h-4 text-blue-700 animate-pulse" />
                <span className="text-blue-900 font-semibold">
                  {fechaPagoProfesional}
                </span>
              </span>
            </div>
          </div>

          {/* Información organizacional */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex-1">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
              <User2 className="w-5 h-5" />
              Información Organizacional
            </div>
            <div className="mb-2">
              <span className="font-bold text-blue-700">Departamento:</span>{' '}
              <span className="text-blue-900">
                {pago.departamento ? pago.departamento.toUpperCase() : '-'}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-bold text-blue-700">Solicitante:</span>{' '}
              <span className="text-blue-900">
                {pago.nombre_usuario || pago.usuario_nombre || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Concepto */}
        <div className="px-8 pb-2">
          <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-700" />
            <div>
              <div className="font-bold text-blue-700">Concepto</div>
              <div className="text-blue-900">{pago.concepto}</div>
            </div>
          </div>
        </div>

        {/* Documentos adjuntos */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
            <FileBadge className="w-5 h-5 text-blue-700" />
            <div>
              <div className="font-bold text-blue-700 mb-2">
                Documentos Adjuntos
              </div>
              {comprobante?.ruta_archivo ? (
              <a
                href={comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg shadow hover:bg-blue-100 font-bold transition"
              >
                <FileText className="w-4 h-4" />
                Ver Comprobante
              </a>
              ) : (
                <span className="text-blue-900">No hay comprobante disponible</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
