import React from "react";
import { PlantillaRecurrente } from '@/types';
import { FaUser, FaBuilding, FaMoneyBillWave, FaCreditCard, FaRedo, FaCheckCircle, FaRegCalendarAlt, FaUserCheck, FaUserTie, FaCommentDots, FaTimesCircle, FaFileAlt, FaDollarSign } from 'react-icons/fa';

interface SolicitudModalProps {
  solicitud: PlantillaRecurrente;
  open: boolean;
  onClose: () => void;
}

export const SolicitudModal: React.FC<SolicitudModalProps> = ({ solicitud, open, onClose }) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const estadoColor = solicitud && solicitud.estado === 'aprobada' ? 'bg-green-100 text-green-700 border-green-300' :
    solicitud && solicitud.estado === 'rechazada' ? 'bg-red-100 text-red-700 border-red-300' :
    'bg-yellow-100 text-yellow-700 border-yellow-300';


  // Cerrar modal solo si se da clic en el fondo, no en el cuadro
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open || !solicitud) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-[95vw] md:w-[900px] max-h-[90vh] overflow-y-auto relative animate-fade-in border border-blue-300 text-gray-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="rounded-t-3xl px-8 pt-7 pb-5 bg-gradient-to-r from-blue-600 to-blue-400 relative">
          <button
            className="absolute top-5 right-6 text-gray-100 hover:text-red-200 text-2xl font-bold transition"
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
          >
            <FaTimesCircle />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Solicitud #{solicitud.id_recurrente}
              </h2>
            </div>
            <div className={`px-4 py-1 rounded-full border text-sm font-bold shadow-sm ${estadoColor}`}>{solicitud.estado?.toUpperCase()}</div>
          </div>
        </div>
        {/* Cuerpo más horizontal */}
        <div className="p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Información Financiera */}
            <div className="flex-1 bg-white rounded-2xl border border-blue-100 shadow p-8 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-base">
                <FaDollarSign className="text-blue-500 text-lg" /> Información Financiera
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-blue-600 font-medium">Monto:</span>
                <span className="text-xl font-bold text-blue-700 mb-1">${solicitud.monto?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                <span className="text-blue-600 font-medium">Cuenta Destino:</span>
                <span className="mb-1">{solicitud.cuenta_destino}</span>
                <span className="text-blue-600 font-medium">Fecha Límite:</span>
                <span className="mb-1">{solicitud.siguiente_fecha ? new Date(solicitud.siguiente_fecha).toLocaleDateString('es-MX') : '-'}</span>
              </div>
            </div>
            {/* Información Organizacional */}
            <div className="flex-1 bg-white rounded-2xl border border-blue-100 shadow p-8 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-base">
                <FaBuilding className="text-blue-500 text-lg" /> Información Organizacional
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-blue-600 font-medium">Departamento:</span>
                <span className="mb-1">{solicitud.departamento}</span>
                <span className="text-blue-600 font-medium">Solicitante:</span>
                <span>{solicitud.nombre_usuario || '-'}</span>
              </div>
            </div>
          </div>
          {/* Concepto */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow p-6">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-base">
              <FaFileAlt className="text-blue-500 text-lg" /> Concepto
            </div>
            <div className="text-gray-700 text-base">{solicitud.concepto || '-'}</div>
          </div>
          {/* Documentos Adjuntos */}
          {solicitud.fact_recurrente && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow p-6">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-base">
                <FaRegCalendarAlt className="text-blue-500 text-lg" /> Documentos Adjuntos
              </div>
              <a
                href={solicitud.fact_recurrente.startsWith('http') ? solicitud.fact_recurrente : `http://localhost:4000${solicitud.fact_recurrente}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1 border border-blue-400 rounded-lg text-blue-700 font-medium hover:bg-blue-50 transition text-sm"
              >
                <FaFileAlt className="text-blue-500" /> Ver Factura <FaRegCalendarAlt className="text-blue-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};