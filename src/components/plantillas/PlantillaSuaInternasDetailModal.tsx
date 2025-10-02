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
type InfoFieldProps = {
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'mono' | 'currency' | 'date';
  className?: string;
  icon?: React.ReactNode;
};
const InfoField: React.FC<InfoFieldProps> = ({ label, value, variant = 'default', className = '', icon }) => {
  let displayValue: string = '-';
  if (value !== null && value !== undefined && value !== '') {
    if (variant === 'currency') {
      displayValue = formatCurrency(value);
    } else if (variant === 'date') {
      displayValue = formatDate(value.toString());
    } else {
      displayValue = value.toString();
    }
  }
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200/50 ${className}`}>
      <div className="text-blue-700 text-sm font-medium mb-2 flex items-center gap-2">{icon}{label}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        <button onClick={onClose} className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Cerrar modal">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PLANTILLA SUA INTERNAS</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitudExtended.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><Building2 className="w-4 h-4" />Folio: {solicitudExtended.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                <Building2 className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} icon={<FileText className="w-4 h-4 text-blue-500" />} />
                <InfoField label="Empresa (Se paga por)" value={solicitud.empresa} icon={<Building2 className="w-4 h-4 text-emerald-600" />} />
                <InfoField label="Monto Total" value={solicitud.monto?.toString()} variant="currency" icon={<FileText className="w-4 h-4 text-blue-700" />} />
                <InfoField label="Línea de Captura IMSS" value={solicitud.linea_captura} variant="mono" icon={<FileText className="w-4 h-4 text-indigo-600" />} />
              </div>
            </div>
            {(solicitudExtended.id_aprobador || solicitudExtended.fecha_aprobacion || solicitudExtended.comentarios_aprobacion) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Aprobación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="ID Aprobador" value={solicitudExtended.id_aprobador?.toString()} />
                  <InfoField label="Fecha de Aprobación" value={solicitudExtended.fecha_aprobacion} variant="date" />
                  <div className="md:col-span-2">
                    <InfoField label="Comentarios de Aprobación" value={solicitudExtended.comentarios_aprobacion} />
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información de Auditoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} variant="date" />
                <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} variant="date" />
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              </div>
            </div>
            <div className="mb-6 w-full">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Comprobantes de Pago</h3>
              <div className="flex flex-col items-center justify-center w-full">
                {loadingComprobantes ? (
                  <LoadingSpinner message="Cargando comprobante..." />
                ) : errorComprobantes ? (
                  <ErrorMessage message={errorComprobantes} />
                ) : comprobantes.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
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
                      <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
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
                    );
                  })()
                )}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Archivos Adjuntos</h3>
              {/* Aquí puedes agregar loading y error de archivos si lo necesitas */}
              <div className="flex flex-col items-center justify-center w-full">
                {/* Aquí puedes mapear archivos adjuntos si existen */}
                {/* Si no hay archivos, muestra mensaje igual que TUKASH */}
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay archivos adjuntos disponibles</p>
                  <p className="text-gray-500 text-sm mt-2">Los documentos aparecerán aquí cuando sean cargados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}