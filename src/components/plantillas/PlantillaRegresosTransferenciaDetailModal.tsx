import React, { useState, useCallback, useEffect } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';
import { X, FileText, ExternalLink, Banknote } from 'lucide-react';

// Ajusta los tipos según tu modelo real de datos
export interface SolicitudRegresosTransferenciaData {
  id_solicitud: number;
  asunto: string;
  beneficiario: string;
  monto: number;
  banco_destino: string;
  numero_cuenta: string;
  estado: string;
  folio?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}

export interface SolicitudArchivo {
  id_archivo: number;
  ruta_archivo: string;
  tipo?: string;
}

interface PlantillaRegresosTransferenciaDetailModalProps {
  solicitud: SolicitudRegresosTransferenciaData;
  isOpen: boolean;
  onClose: () => void;
}

// Utilidades para formato igual que SUA Frenshetsi
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(numAmount);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const InfoField: React.FC<{
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'currency' | 'mono' | 'date';
  className?: string;
}> = ({ label, value, variant = 'default', className = '' }) => {
  let displayValue = value || '-';
  if (variant === 'currency' && value) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      displayValue = formatCurrency(numValue);
    }
  }
  if (variant === 'date' && value) {
    displayValue = formatDate(value.toString());
  }
  return (
    <div className={`bg-white/80 p-3 rounded border border-blue-100 ${className}`}>
      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">{label}</span>
      <p className={`text-blue-900 font-medium text-sm ${variant === 'mono' ? 'font-mono' : ''}`}>{displayValue}</p>
    </div>
  );
};

export const PlantillaRegresosTransferenciaDetailModal: React.FC<PlantillaRegresosTransferenciaDetailModalProps> = ({ solicitud, isOpen, onClose }) => {
  // Simulación de archivos adjuntos (ajusta para tu lógica real)
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);

  // Comprobantes de pago
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && solicitud) {
      setLoadingArchivos(true);
      // Simula fetch de archivos
      setTimeout(() => {
        setArchivos([]); // Reemplaza con fetch real
        setLoadingArchivos(false);
      }, 500);

      // Fetch comprobantes
      setLoadingComprobantes(true);
      setErrorComprobantes(null);
      if (solicitud.id_solicitud) {
        SolicitudesService.getComprobantes(solicitud.id_solicitud)
          .then((data) => setComprobantes(data))
          .catch(() => setErrorComprobantes('Error al cargar comprobantes'))
          .finally(() => setLoadingComprobantes(false));
      } else {
        setComprobantes([]);
        setLoadingComprobantes(false);
      }
    } else {
      setComprobantes([]);
      setLoadingComprobantes(false);
      setErrorComprobantes(null);
    }
  }, [isOpen, solicitud]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-4xl xl:max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-30 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>
        {/* Contenedor con scroll */}
        <div className="overflow-y-auto max-h-[98vh] sm:max-h-[95vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden rounded-xl mb-6">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Banknote className="w-7 h-7 text-white mr-2" />
                  REGRESOS TRANSFERENCIA
                </h2>
                <p className="text-blue-100 text-sm mt-1">Asunto: {solicitud.asunto}</p>
                {solicitud.folio && (
                  <p className="text-blue-100 text-sm mt-1">Folio: {solicitud.folio}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-300`}>
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </div>
          </header>
          {/* Información Principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Asunto" value={solicitud.asunto} />
              <InfoField label="Beneficiario" value={solicitud.beneficiario} />
              <InfoField label="Banco Destino" value={solicitud.banco_destino} />
              <InfoField label="Número de Cuenta" value={solicitud.numero_cuenta} variant="mono" />
              <InfoField label="Monto" value={solicitud.monto} variant="currency" />
            </div>
          </div>
          {/* Archivos Adjuntos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Archivos Adjuntos</h3>
            {loadingArchivos ? (
              <div className="flex items-center justify-center p-6 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="ml-3 text-blue-700 text-sm">Cargando archivos...</p>
              </div>
            ) : archivos.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay archivos adjuntos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {archivos.map((archivo, index) => {
                  const url = archivo.ruta_archivo;
                  const fileName = url.split('/').pop() || 'archivo';
                  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                  const isPdf = /\.pdf$/i.test(fileName);
                  return (
                    <div key={index} className="bg-white/90 rounded-lg border border-blue-200 p-4 shadow-sm">
                      {/* Preview del archivo */}
                      {isImage ? (
                        <div className="relative w-full h-40 rounded border border-blue-200 overflow-hidden bg-white">
                          <Image src={url} alt={fileName} fill className="object-contain" />
                        </div>
                      ) : isPdf ? (
                        <div className="w-full rounded border border-blue-200 overflow-hidden bg-white">
                          <iframe src={url} title={fileName} className="w-full" style={{ height: '200px' }} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                          <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-blue-900 font-medium text-sm">{fileName}</p>
                            <p className="text-xs text-gray-600 mt-1">Tipo: {archivo.tipo || 'Archivo'}</p>
                          </div>
                        </div>
                      )}
                      {/* Botón Ver completo */}
                      <div className="mt-3">
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver completo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Comprobantes de Pago */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Comprobantes de Pago</h3>
            {loadingComprobantes ? (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
                <span className="text-blue-600 text-sm">Cargando comprobantes...</span>
              </div>
            ) : errorComprobantes ? (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{errorComprobantes}</div>
            ) : comprobantes.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">AÚN NO HAY COMPROBANTE</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comprobantes.map((comprobante) => (
                  <div key={comprobante.id_comprobante} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center bg-white/80 px-3 py-1.5 rounded-md w-fit">
                          <span className="text-xs text-blue-800 font-semibold">
                            {comprobante.nombre_usuario || `Usuario ${comprobante.usuario_subio}`}
                          </span>
                        </div>
                        {comprobante.comentario && (
                          <div className="mt-2 bg-white/60 p-2 rounded border-l-3 border-blue-300">
                            <p className="text-xs text-gray-700 italic">&ldquo;{comprobante.comentario}&rdquo;</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => window.open(comprobante.ruta_archivo, '_blank')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 ml-3 text-xs"
                        disabled={!comprobante.ruta_archivo}
                      >
                        Ver completo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información de Auditoría */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} variant="date" />
              <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} variant="date" />
              <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
              <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
