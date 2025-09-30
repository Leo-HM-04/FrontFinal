import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container: horizontal layout */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Layout horizontal: info+comprobantes left, archivos right */}
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: info principal, auditoría, comprobantes */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Banknote className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>REGRESOS TRANSFERENCIA</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitud.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Folio: {solicitud.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                <FileText className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            {/* Información Principal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} />
                <InfoField label="Beneficiario" value={solicitud.beneficiario} />
                <InfoField label="Banco Destino" value={solicitud.banco_destino} />
                <InfoField label="Número de Cuenta" value={solicitud.numero_cuenta} variant="mono" />
                <InfoField label="Monto" value={solicitud.monto} variant="currency" />
              </div>
            </div>
            {/* Comprobantes de Pago */}
            <div className="mb-6 w-full">
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
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3">
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
                        <div className="w-full md:w-auto flex justify-end">
                          <button
                            onClick={() => window.open(comprobante.ruta_archivo, '_blank')}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs w-full md:w-auto"
                            disabled={!comprobante.ruta_archivo}
                          >
                            Ver completo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Información de Auditoría */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información de Auditoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} variant="date" />
                <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} variant="date" />
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              </div>
            </div>
          </div>
          {/* Columna derecha: archivos adjuntos */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Archivos Adjuntos</h3>
              {loadingArchivos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando archivos...</p>
                </div>
              ) : archivos.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay archivos adjuntos disponibles</p>
                  <p className="text-gray-500 text-sm mt-2">Los documentos aparecerán aquí cuando sean cargados</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  {archivos.map((archivo, index) => {
                    const url = archivo.ruta_archivo;
                    const fileName = url.split('/').pop() || 'archivo';
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                    const isPdf = /\.pdf$/i.test(fileName);
                    return (
                      <div key={index} className="w-full flex justify-center">
                        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                          <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                            {isImage ? (
                              <Image src={url} alt={fileName} fill className="object-contain" />
                            ) : isPdf ? (
                              <iframe src={url} title={fileName} className="w-full" style={{ height: '200px' }} />
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-blue-900 font-medium text-sm">{fileName}</p>
                                  <p className="text-xs text-gray-600 mt-1">Tipo: {archivo.tipo || 'Archivo'}</p>
                                </div>
                              </div>
                            )}
                          </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
