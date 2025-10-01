'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, Building2 } from 'lucide-react';
import { PlantillaSuaInternasModalProps, LoadingStateSuaInternas, ErrorStateSuaInternas } from '@/types/plantillaSuaInternas';
import { SolicitudSuaInternasData } from '@/types/plantillaSuaInternas';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Tipo extendido para solicitudes SUA INTERNAS que incluye campos adicionales
interface SolicitudSuaInternasExtended extends SolicitudSuaInternasData {
  folio?: string;
  tiene_archivos?: boolean | number;
  id_aprobador?: number;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
}

// Función para formatear moneda en pesos mexicanos
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00 MXN';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(numAmount);
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función para obtener colores del estado
const getEstadoColor = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'aprobada':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'rechazada':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'pagada':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

// Función para construir URL de archivos
const buildFileUrl = (rutaArchivo: string): string => {
  const baseUrl = 'https://bechapra.com.mx';
  if (rutaArchivo.startsWith('http')) return rutaArchivo;
  return rutaArchivo.startsWith('/') ? `${baseUrl}${rutaArchivo}` : `${baseUrl}/${rutaArchivo}`;
};

// Hook para manejo de errores
const useErrorHandler = () => {
  const handleError = useCallback((error: unknown): string => {
    console.error('Error en PlantillaSuaInternasDetailModal:', error);
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ha ocurrido un error inesperado';
  }, []);

  return { handleError };
};

// Componente de loading
const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-blue-50/50 rounded-lg border border-blue-100">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    {message && <p className="mt-2 text-blue-700 text-sm">{message}</p>}
  </div>
);

// Componente de error
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
    {message}
  </div>
);

// Componente para campos de información
const InfoField: React.FC<{
  label: string;
  value: string | null | undefined;
  variant?: 'default' | 'mono' | 'currency';
  className?: string;
}> = ({ label, value, variant = 'default', className = '' }) => {
  let displayValue = value || '-';
  
  if (variant === 'currency' && value) {
    const numValue = parseFloat(value);
    displayValue = isNaN(numValue) ? value : formatCurrency(numValue);
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50 ${className}`}>
      <div className="text-blue-700 text-sm font-medium mb-2">{label}</div>
      <div className={`text-gray-900 ${variant === 'mono' ? 'font-mono text-sm' : ''} ${variant === 'currency' ? 'font-semibold text-blue-800' : ''}`}>
        {displayValue}
      </div>
    </div>
  );
};

// Componente para preview de archivos

// Función para obtener archivos de solicitud
const obtenerArchivosSolicitud = async (idSolicitud: number): Promise<SolicitudArchivo[]> => {
  try {
    console.log('📁 [SUA INTERNAS ARCHIVOS] Obteniendo archivos para solicitud:', idSolicitud);
    const data = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
    console.log('✅ [SUA INTERNAS ARCHIVOS] Archivos obtenidos exitosamente:', data.length);
    return data;
  } catch (error) {
    console.error('❌ [SUA INTERNAS ARCHIVOS] Error al obtener archivos:', error);
    throw error;
  }
};

export function PlantillaSuaInternasDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: PlantillaSuaInternasModalProps) {
  // Comprobante de pago
  const [comprobantes, setComprobantes] = useState<import('@/types').Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  // Cast de la solicitud para acceder a campos adicionales
  const solicitudExtended = solicitud as SolicitudSuaInternasExtended;

  // Función para obtener comprobantes de pago
  const fetchComprobantes = useCallback(async () => {
    setLoadingComprobantes(true);
    setErrorComprobantes(null);
    try {
      const id = typeof solicitud.id_solicitud === 'number' ? solicitud.id_solicitud : 0;
      const data = await import('@/services/solicitudes.service').then(mod => mod.SolicitudesService.getComprobantes(id));
      setComprobantes(data);
    } catch (error) {
      let msg = 'Error al cargar comprobantes';
      if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        msg = (error as { message: string }).message;
      }
      setErrorComprobantes(msg);
    } finally {
      setLoadingComprobantes(false);
    }
  }, [solicitud.id_solicitud]);

  useEffect(() => {
    if (isOpen && solicitud?.estado === 'pagada') {
      fetchComprobantes();
    } else {
      setComprobantes([]);
    }
  }, [isOpen, solicitud?.estado, fetchComprobantes]);

  // ...existing code...

  // Función para manejar teclas de escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !solicitud) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4">
      {/* Overlay similar al modal de solicitudes */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container similar a solicitudes */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-4xl xl:max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-30 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>
        {/* Contenido con scroll */}
        <div className="overflow-y-auto max-h-[98vh] sm:max-h-[95vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400 p-6">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden rounded-xl mb-6">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-100" />
                <div>
                  <h2 className="text-xl font-bold">Plantilla SUA INTERNAS</h2>
                  <p className="text-blue-100 text-sm mt-1">Asunto: {solicitud.asunto}</p>
                  {solicitudExtended.folio && (
                    <p className="text-blue-100 text-sm mt-1">Folio: {solicitudExtended.folio}</p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado || 'pendiente')}`}>
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </div>
          </header>
          
          {/* Información Principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Asunto" value={solicitud.asunto} />
              <InfoField label="Empresa (Se paga por)" value={solicitud.empresa} />
              <InfoField label="Monto Total" value={solicitud.monto?.toString()} variant="currency" />
              <InfoField label="Línea de Captura IMSS" value={solicitud.linea_captura} variant="mono" />
            </div>
          </div>

          {/* Información de Fechas */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Fechas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Fecha Límite de Pago" value={solicitud.fecha_limite ? formatDate(solicitud.fecha_limite) : ''} />
              <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion ? formatDate(solicitud.fecha_creacion) : ''} />
            </div>
          </div>
          
          {/* Información de Aprobación */}
          {(solicitudExtended.id_aprobador || solicitudExtended.fecha_aprobacion || solicitudExtended.comentarios_aprobacion) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Aprobación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="ID Aprobador" value={solicitudExtended.id_aprobador?.toString()} />
                <InfoField label="Fecha de Aprobación" value={solicitudExtended.fecha_aprobacion ? formatDate(solicitudExtended.fecha_aprobacion) : ''} />
                <div className="md:col-span-2">
                  <InfoField label="Comentarios de Aprobación" value={solicitudExtended.comentarios_aprobacion} />
                </div>
              </div>
            </div>
          )}
          
          {/* Información de Seguimiento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Seguimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
              <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion ? formatDate(solicitud.fecha_creacion) : ''} />
              <InfoField label="Última Actualización" value={solicitud.fecha_actualizacion ? formatDate(solicitud.fecha_actualizacion) : ''} />
            </div>
          </div>
          
          {/* Comprobante de Pago */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Comprobante de Pago</h3>
            {loadingComprobantes ? (
              <LoadingSpinner message="Cargando comprobante..." />
            ) : errorComprobantes ? (
              <ErrorMessage message={errorComprobantes} />
            ) : comprobantes.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">AÚN NO HAY COMPROBANTE</p>
              </div>
            ) : (
              (() => {
                const comprobante = comprobantes[0];
                if (!comprobante) return null;
                const url = comprobante.ruta_archivo;
                const fileName = url.split('/').pop() || 'comprobante';
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                const isPdf = /\.pdf$/i.test(fileName);
                return (
                  <div className="bg-white/90 rounded-lg border border-blue-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 mb-3">
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
                      <div className="w-full flex justify-center">
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
                                  <p className="text-xs text-gray-600 mt-1">Tipo: Comprobante</p>
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
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}