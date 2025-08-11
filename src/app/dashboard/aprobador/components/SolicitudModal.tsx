import React from "react";
import Image from "next/image";
import { PlantillaRecurrente } from '@/types';
import { FaBuilding, FaRegCalendarAlt, FaTimesCircle, FaFileAlt, FaDollarSign } from 'react-icons/fa';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-[98vw] md:w-[1100px] max-h-[85vh] overflow-y-auto relative animate-fade-in border border-blue-300 text-gray-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="rounded-t-3xl px-10 pt-6 pb-4 bg-gradient-to-r from-blue-700 to-blue-400 relative">
          <button
            className="absolute top-4 right-8 text-gray-100 hover:text-red-200 text-2xl font-bold transition"
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
          >
            <FaTimesCircle />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Solicitud #{solicitud.id_recurrente}
              </h2>
            </div>
            <div className={`px-5 py-1 rounded-full border text-base font-bold shadow-sm ${estadoColor}`}>{solicitud.estado?.toUpperCase()}</div>
          </div>
        </div>
        {/* Cuerpo más horizontal y compacto */}
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Información Financiera */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
                <FaDollarSign className="text-blue-500 text-xl" /> <span>Financiera</span>
              </div>
              <div className="flex flex-col gap-1 text-base">
                <span><span className="text-blue-600 font-semibold">Monto:</span> <span className="font-bold text-blue-800">{solicitud.monto?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></span>
                <span><span className="text-blue-600 font-semibold">Cuenta Destino:</span> {solicitud.cuenta_destino}</span>
                <span><span className="text-blue-600 font-semibold">Fecha Límite:</span> {solicitud.siguiente_fecha ? new Date(solicitud.siguiente_fecha).toLocaleDateString('es-MX') : '-'}</span>
              </div>
            </div>
            {/* Información Organizacional */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
                <FaBuilding className="text-blue-500 text-xl" /> <span>Organizacional</span>
              </div>
              <div className="flex flex-col gap-1 text-base">
                <span><span className="text-blue-600 font-semibold">Departamento:</span> {solicitud.departamento}</span>
                <span><span className="text-blue-600 font-semibold">Solicitante:</span> {solicitud.nombre_usuario || '-'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Concepto */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
                <FaFileAlt className="text-blue-500 text-xl" /> <span>Concepto</span>
              </div>
              <div className="text-gray-700 text-base whitespace-pre-line">{solicitud.concepto || '-'}</div>
            </div>
            {/* Documentos Adjuntos y Previsualización */}
            {solicitud.fact_recurrente && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold text-lg">
                  <FaRegCalendarAlt className="text-blue-500 text-xl" /> <span>Documento Adjunto</span>
                </div>
                <a
                  href={solicitud.fact_recurrente.startsWith('http') ? solicitud.fact_recurrente : `http://46.202.177.106:4000${solicitud.fact_recurrente}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1 border border-blue-400 rounded-lg text-blue-700 font-medium hover:bg-blue-50 transition text-sm mb-3"
                >
                  <FaFileAlt className="text-blue-500" /> Ver archivo completo
                </a>
                {/* Previsualización */}
                <div className="rounded-lg border border-blue-100 bg-gray-50 flex items-center justify-center overflow-hidden min-h-[180px] max-h-[350px]">
                  {(() => {
                    const url = solicitud.fact_recurrente.startsWith('http') ? solicitud.fact_recurrente : `http://46.202.177.106:4000${solicitud.fact_recurrente}`;
                    const ext = url.split('.').pop()?.toLowerCase();
                    if (ext === 'pdf') {
                      return (
                        <iframe
                          src={url}
                          title="Previsualización PDF"
                          className="w-full h-[340px] border-0 rounded-lg"
                          style={{ minHeight: 180 }}
                        />
                      );
                    } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext || '')) {
                      return (
                        <Image
                          src={url}
                          alt="Previsualización adjunto"
                          width={600}
                          height={340}
                          className="object-contain max-h-[340px] w-auto mx-auto"
                          style={{ maxHeight: 340, width: 'auto', marginLeft: 'auto', marginRight: 'auto' }}
                          unoptimized
                        />
                      );
                    } else {
                      return (
                        <span className="text-gray-400 text-sm">No disponible previsualización</span>
                      );
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};