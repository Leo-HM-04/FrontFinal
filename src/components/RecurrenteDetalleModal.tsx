import React from 'react';
import { FileCheck, Building, BadgeDollarSign, Banknote, CreditCard, CalendarDays, StickyNote, Repeat2, X, CircleCheck, CircleX, User2 } from 'lucide-react';

interface RecurrenteDetalleModalProps {
  open: boolean;
  onClose: () => void;
  recurrente: {
    id?: string;
    departamento: string;
    monto: string;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    frecuencia: string;
    siguiente_fecha: string;
    activo: boolean;
    fact_recurrente?: string;
    nombre_usuario?: string;
  } | null;
}


export const RecurrenteDetalleModal: React.FC<RecurrenteDetalleModalProps> = ({ open, onClose, recurrente }) => {
  if (!open || !recurrente) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Construir URL absoluta para la factura si es solo el nombre del archivo
  const getFacturaUrl = (factura?: string) => {
    if (!factura) return undefined;
    if (/^https?:\/\//.test(factura)) return factura;
    // Si ya empieza con /uploads, anteponer el host
    if (factura.startsWith('/uploads')) return `http://localhost:4000${factura}`;
    // Si es solo el nombre del archivo
    return `http://localhost:4000/uploads/RECURRENTE/${factura}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up border border-blue-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Cabecera azul con icono */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-2xl px-8 py-6 flex items-center gap-4">
          <Repeat2 className="w-12 h-12 text-white bg-blue-400/30 rounded-full p-2 shadow" />
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
              Plantilla #{recurrente.id}
              <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${recurrente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                {recurrente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </h2>
            <div className="flex flex-wrap gap-4 items-center text-white/90 text-base font-medium">
              <span className="flex items-center gap-2">
                <User2 className="w-5 h-5" /> Usuario:
                <span className="font-normal">{recurrente.nombre_usuario || '-'}</span>
              </span>
              <span className="flex items-center gap-2">
                <Building className="w-5 h-5" /> Departamento:
                <span className="font-normal">{recurrente.departamento}</span>
              </span>
            </div>
          </div>
        </div>
        {/* Tabla de detalles ordenada */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <BadgeDollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-blue-900">Monto:</span>
              <span className="ml-auto text-lg font-bold text-blue-900">${recurrente.monto}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
              <Banknote className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-blue-900">Cuenta Destino:</span>
              <span className="ml-auto text-blue-900">{recurrente.cuenta_destino}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-900">Tipo de Pago:</span>
              <span className="ml-auto capitalize text-blue-900">{recurrente.tipo_pago}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Repeat2 className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-900">Frecuencia:</span>
              <span className="ml-auto capitalize text-blue-900">{recurrente.frecuencia}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
              <CalendarDays className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-blue-900">Siguiente Fecha:</span>
              <span className="ml-auto text-blue-900">{formatDate(recurrente.siguiente_fecha)}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <span className="font-semibold text-blue-900">Estado:</span>
              <span className="ml-auto flex items-center gap-2">
                {recurrente.activo
                  ? <CircleCheck className="w-4 h-4 text-green-600" />
                  : <CircleX className="w-4 h-4 text-red-500" />}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${recurrente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {recurrente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 md:col-span-2">
              <FileCheck className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-900">Factura:</span>
              <span className="ml-auto">
                {recurrente.fact_recurrente
                  ? <a href={getFacturaUrl(recurrente.fact_recurrente)} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Ver archivo</a>
                  : <span className="italic text-gray-400">No adjunta</span>}
              </span>
            </div>
          </div>
          <div className="mb-2 font-semibold text-blue-900 flex items-center gap-2"><StickyNote className="w-5 h-5 text-pink-500" /> Concepto:</div>
          <div className="text-blue-900 bg-blue-50 rounded-lg p-4 mb-2 break-words shadow-inner border border-blue-100">
            {recurrente.concepto}
          </div>
        </div>
      </div>
    </div>
  );
};
