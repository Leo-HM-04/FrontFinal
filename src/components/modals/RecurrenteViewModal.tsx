import React from 'react';
import { PlantillaRecurrente } from '@/types';
import { Button } from '../ui/Button';
import { FileText, User, Building2, CreditCard, Banknote, ClipboardList, Calendar, BadgeCheck, Repeat, CheckCircle, XCircle } from 'lucide-react';

interface RecurrenteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurrente: PlantillaRecurrente | null;
}

export const RecurrenteViewModal: React.FC<RecurrenteViewModalProps> = ({ isOpen, onClose, recurrente }) => {
  if (!isOpen || !recurrente) return null;

  // Utilidades visuales
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ejemplo: 17 JULIO 2025
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  };
  const toUpper = (str: string | undefined) => (str ? str.toUpperCase() : '');
  const badge = (text: string, color: string) => (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>{text}</span>
  );
  const estadoColor = (estado: string) => {
    switch ((estado || '').toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'aprobada': return 'bg-green-100 text-green-800 border-green-300';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  const activaColor = (activo: boolean) => activo
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300';

  // Usar el campo correcto para la factura
  const facturaFile = recurrente.fact_recurrente;
  // Si la ruta ya es absoluta (empieza con http), úsala tal cual. Si es relativa, prepende el backend
  const facturaUrl = facturaFile
    ? (facturaFile.startsWith('http') ? facturaFile : `http://localhost:4000${facturaFile}`)
    : null;

  // Handler to close modal when clicking outside the modal content
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="bg-white/90 rounded-3xl shadow-2xl max-w-3xl w-full p-0 relative animate-fade-in border border-blue-500 overflow-hidden">
        <div className="relative bg-gradient-to-r from-blue-600/90 to-blue-400/80 px-10 py-4 flex items-center gap-4 mb-6 border-b border-blue-500 shadow">
          <div className="flex items-center justify-center bg-white rounded-full shadow-lg w-16 h-16">
            <FileText className="w-9 h-9 text-blue-700" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow">Detalle de Plantilla Recurrente</h2>
            <p className="text-blue-100 text-sm mt-1">Consulta la información y factura asociada</p>
          </div>
          <button
            className="absolute top-4 right-6 text-white/70 hover:text-white text-3xl font-bold transition"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="px-10 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800 text-base">
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="ID de la plantilla"><BadgeCheck className="w-5 h-5 text-blue-500" /><span className="font-semibold">ID:</span> #{recurrente.id_recurrente}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Usuario solicitante"><User className="w-5 h-5 text-blue-500" /><span className="font-semibold">Usuario:</span> {recurrente.nombre_usuario || `Usuario ${recurrente.id_usuario}`}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Departamento"><Building2 className="w-5 h-5 text-blue-500" /><span className="font-semibold">Departamento:</span> {toUpper(recurrente.departamento)}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Monto"><Banknote className="w-5 h-5 text-blue-500" /><span className="font-semibold">Monto:</span> {formatCurrency(recurrente.monto)}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Cuenta destino"><CreditCard className="w-5 h-5 text-blue-500" /><span className="font-semibold">Cuenta Destino:</span> {recurrente.cuenta_destino}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Concepto"><ClipboardList className="w-5 h-5 text-blue-500" /><span className="font-semibold">Concepto:</span> {recurrente.concepto}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Tipo de pago"><Repeat className="w-5 h-5 text-blue-500" /><span className="font-semibold">Tipo de Pago:</span> {recurrente.tipo_pago}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Frecuencia"><Calendar className="w-5 h-5 text-blue-500" /><span className="font-semibold">Frecuencia:</span> {toUpper(recurrente.frecuencia)}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Estado"><BadgeCheck className="w-5 h-5 text-blue-500" /><span className="font-semibold">Estado:</span> {badge(toUpper(recurrente.estado), estadoColor(recurrente.estado))}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="¿Está activa?">{recurrente.activo ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}<span className="font-semibold">Activa:</span> {badge(recurrente.activo ? 'SÍ' : 'NO', activaColor(!!recurrente.activo))}</div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2" title="Siguiente fecha de ejecución"><Calendar className="w-5 h-5 text-blue-500" /><span className="font-semibold">Siguiente Fecha:</span> {formatDate(recurrente.siguiente_fecha)}</div>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-full md:w-3/5">
              <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 border border-blue-200 shadow-inner">
                <div className="mb-2 text-blue-700 font-semibold flex items-center gap-2 text-lg">
                  <FileText className="w-6 h-6" /> Factura asociada
                </div>
                {facturaUrl ? (
                  <>
                    <a
                      href={facturaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2 border border-blue-500 text-blue-700 rounded-lg hover:bg-blue-100 transition font-semibold text-base bg-white shadow-sm mt-2"
                    >
                      <FileText className="w-5 h-5" /> Ver Factura
                    </a>
                    <span className="text-xs text-gray-500 mt-1">(Se abrirá en una nueva pestaña)</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-400 rounded-lg bg-gray-50 cursor-not-allowed font-semibold text-base mt-2">
                    <FileText className="w-5 h-5" /> Factura no existente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Botón de cerrar removido, solo se puede cerrar con la X o clic fuera del modal */}
      </div>
    </div>
  );
};
