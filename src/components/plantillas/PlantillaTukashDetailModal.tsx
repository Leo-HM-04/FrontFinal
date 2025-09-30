'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';
import { X, FileText, ExternalLink } from 'lucide-react';
import { PlantillaTukashModalProps, LoadingStateTukash, ErrorStateTukash } from '@/types/plantillaTukash';
import { SolicitudTukashData } from '@/types/plantillaTukash';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Tipo extendido para solicitudes TUKASH que incluye campos adicionales
interface SolicitudTukashExtended extends SolicitudTukashData {
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
  // Para archivos de solicitud, usar la URL base correcta sin puerto ni /api
  const baseUrl = 'https://bechapra.com.mx';
  if (rutaArchivo.startsWith('http')) return rutaArchivo;
  return rutaArchivo.startsWith('/') ? `${baseUrl}${rutaArchivo}` : `${baseUrl}/${rutaArchivo}`;
};

// Hook para manejo de errores
const useErrorHandler = () => {
  const handleError = useCallback((error: unknown): string => {
    console.error('Error en PlantillaTukashDetailModal:', error);
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
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      displayValue = formatCurrency(numValue);
    }
  }

  return (
    <div className={`bg-white/80 p-3 rounded border border-blue-100 ${className}`}>
      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">
        {label}
      </span>
      <p className={`text-blue-900 font-medium text-sm ${
        variant === 'mono' ? 'font-mono' : 
        variant === 'currency' ? 'text-blue-700 font-semibold' : ''
      }`}>
        {displayValue}
      </p>
    </div>
  );
};

// Componente para previsualización de archivos
const FilePreview: React.FC<{
  archivo: SolicitudArchivo;
}> = ({ archivo }) => {
  const url = buildFileUrl(archivo.archivo_url);
  const fileName = archivo.archivo_url.split('/').pop() || 'archivo';
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  if (isImage) {
    return (
      <div className="relative w-full h-40 group overflow-hidden rounded border border-blue-200 shadow-sm bg-white/90">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
        <Image
          src={url}
          alt={fileName}
          fill
          className="object-cover transition-opacity duration-300 opacity-0"
          onLoad={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.opacity = '1';
            const loadingBg = target.parentElement?.querySelector('div');
            if (loadingBg) loadingBg.classList.add('opacity-0');
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-blue-900/90 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="truncate font-medium">{fileName}</p>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
        <iframe 
          src={url} 
          title={fileName}
          className="w-full" 
          style={{ height: '200px' }} 
        />
        <div className="bg-blue-50/80 p-2 text-xs text-center text-blue-700">
          Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-blue-900 font-medium text-sm break-words">
          Archivo: {fileName}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Tipo: {archivo.tipo || 'Desconocido'}
        </p>
      </div>
    </div>
  );
};

// Servicio para obtener archivos
const obtenerArchivosSolicitud = async (idSolicitud: number): Promise<SolicitudArchivo[]> => {
  try {
    console.log(`🔍 [TUKASH ARCHIVOS] Obteniendo archivos para solicitud ID: ${idSolicitud}`);
    const archivos = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
    console.log(`✅ [TUKASH ARCHIVOS] Archivos obtenidos:`, archivos);
    return archivos;
  } catch (error) {
    console.error('❌ [TUKASH ARCHIVOS] Error al obtener archivos:', error);
    throw error;
  }
};

export function PlantillaTukashDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: PlantillaTukashModalProps) {

  // Estados
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loading, setLoading] = useState<LoadingStateTukash>({ archivos: false, general: false });
  const [errors, setErrors] = useState<ErrorStateTukash>({ archivos: null, general: null });

  // Comprobantes de pago
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  // Hooks personalizados
  const { handleError } = useErrorHandler();

  // Cast extendido para campos adicionales
  const solicitudExtended = solicitud as SolicitudTukashExtended;

  // Función para obtener archivos
  const fetchArchivos = useCallback(async () => {
    if (!solicitud) return;
    setLoading(prev => ({ ...prev, archivos: true }));
    setErrors(prev => ({ ...prev, archivos: null }));
    try {
      const data = await obtenerArchivosSolicitud(solicitud.id_solicitud || 0);
      setArchivos(data);
    } catch (error) {
      const errorMessage = handleError(error);
      setErrors(prev => ({ ...prev, archivos: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, archivos: false }));
    }
  }, [solicitud, handleError]);

  // Efectos para cargar archivos y comprobantes al abrir
  useEffect(() => {
    if (isOpen && solicitud) {
      fetchArchivos();
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
  }, [isOpen, solicitud, fetchArchivos]);

  // Resetear estados al cerrar
  useEffect(() => {
    if (!isOpen) {
      setArchivos([]);
      setLoading({ archivos: false, general: false });
      setErrors({ archivos: null, general: null });
    }
  }, [isOpen]);

  // Escape para cerrar
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
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-4xl xl:max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-30 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>
        <div className="overflow-y-auto max-h-[98vh] sm:max-h-[95vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400 p-6">
          <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden rounded-xl mb-6">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Plantilla Tarjetas TUKASH</h2>
                <p className="text-blue-100 text-sm mt-1">Asunto: {solicitud.asunto}</p>
                {solicitudExtended.folio && (
                  <p className="text-blue-100 text-sm mt-1">Folio: {solicitudExtended.folio}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado || 'pendiente')}`}>{solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}</span>
            </div>
          </header>
          {/* Información Principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Asunto" value={solicitud.asunto} />
              <InfoField label="Cliente" value={solicitud.cliente} />
              <InfoField label="Beneficiario de Tarjeta" value={solicitud.beneficiario_tarjeta} />
              <InfoField label="Número de Tarjeta" value={solicitud.numero_tarjeta} variant="mono" />
            </div>
          </div>
          {/* Información de Montos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Monto Total Cliente" value={solicitud.monto_total_cliente?.toString()} variant="currency" />
              <InfoField label="Monto Total TUKASH" value={solicitud.monto_total_tukash?.toString()} variant="currency" />
            </div>
          </div>
          {/* Información de Seguimiento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Seguimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion ? formatDate(solicitud.fecha_creacion) : ''} />
              <InfoField label="Última Actualización" value={solicitud.fecha_actualizacion ? formatDate(solicitud.fecha_actualizacion) : ''} />
              <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
              <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
            </div>
          </div>
          {/* Archivos Adjuntos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Archivos Adjuntos</h3>
            {loading.archivos && (<LoadingSpinner message="Cargando archivos..." />)}
            {errors.archivos && (<ErrorMessage message={errors.archivos} />)}
            {!loading.archivos && !errors.archivos && (
              <div className="space-y-4">
                {archivos.length === 0 ? (
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No hay archivos adjuntos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archivos.map((archivo) => (
                      <div key={archivo.id} className="bg-white/90 rounded-lg border border-blue-200 p-4 shadow-sm">
                        <FilePreview archivo={archivo} />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => window.open(buildFileUrl(archivo.archivo_url), '_blank')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver completo
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
        </div>
      </div>
    </div>
  );
}