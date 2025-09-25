'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, Factory } from 'lucide-react';
import { SolicitudSuaFrenshetsiData } from '@/types/plantillaSuaFrenshetsi';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Interfaz para props del modal
interface PlantillaSuaFrenshetsiDetailModalProps {
  solicitud: SolicitudSuaFrenshetsiData;
  isOpen: boolean;
  onClose: () => void;
}

// Estados de loading y error
interface LoadingStateSuaFrenshetsi {
  archivos: boolean;
  general: boolean;
}

interface ErrorStateSuaFrenshetsi {
  archivos: string | null;
  general: string | null;
}

// Tipo extendido para solicitudes SUA FRENSHETSI que incluye campos adicionales
interface SolicitudSuaFrenshetsiExtended extends SolicitudSuaFrenshetsiData {
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

// Función para obtener colores del estado
const getEstadoColor = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'aprobada':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rechazada':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'pagada':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
};

// Función auxiliar para construir URLs de archivos
// Unificado con otros modales: siempre usa la URL de producción
const buildFileUrl = (rutaArchivo: string): string => {
  const baseUrl = 'https://bechapra.com.mx';
  if (rutaArchivo.startsWith('http')) return rutaArchivo;
  return rutaArchivo.startsWith('/') ? `${baseUrl}${rutaArchivo}` : `${baseUrl}/${rutaArchivo}`;
};

// Hook personalizado para manejo de errores
const useErrorHandler = () => {
  const handleError = useCallback((error: unknown): string => {
    console.error('Error:', error);
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ha ocurrido un error inesperado';
  }, []);

  return { handleError };
};

// Componente InfoField mejorado
interface InfoFieldProps {
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'currency' | 'mono' | 'date';
  className?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({ 
  label, 
  value, 
  variant = 'default',
  className = ''
}) => {
  const formatValue = () => {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }

    switch (variant) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value.toString());
      case 'mono':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getValueClassName = () => {
    let baseClass = "text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200";
    
    if (variant === 'mono') {
      baseClass += " font-mono text-sm";
    }
    if (variant === 'currency') {
      baseClass += " font-semibold text-green-700";
    }
    
    return baseClass;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-blue-800">{label}</label>
      <div className={getValueClassName()}>
        {formatValue()}
      </div>
    </div>
  );
};

// Componente para preview de archivos mejorado
const FilePreview: React.FC<{ archivo: SolicitudArchivo }> = ({ archivo }) => {
  const [imageError, setImageError] = useState(false);
  
  console.log('🖼️ [SUA FRENSHETSI ARCHIVOS] Renderizando preview para archivo ID:', archivo.id);
  
  if (!archivo.archivo_url) {
    console.log('⚠️ [SUA FRENSHETSI ARCHIVOS] No hay URL de archivo');
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Archivo no disponible</p>
      </div>
    );
  }

  const fileUrl = buildFileUrl(archivo.archivo_url);
  console.log('🔗 [SUA FRENSHETSI ARCHIVOS] URL construida:', fileUrl);

  const extension = archivo.archivo_url?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  const isPdf = extension === 'pdf';

  // Función para obtener el nombre del archivo desde la URL
  const getFileName = () => {
    const urlParts = archivo.archivo_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName || `Archivo ${archivo.id}`;
  };

  if (isPdf) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* PDF Preview simplificado */}
        <div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
          <iframe 
            src={fileUrl} 
            title={getFileName()}
            className="w-full" 
            style={{ height: '200px' }} 
          />
          <div className="bg-blue-50/80 p-2 text-xs text-center text-blue-700">
            Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
          </div>
        </div>
        
        {/* File info and actions */}
        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900 truncate mb-1">
            {getFileName()}
          </p>
          <p className="text-xs text-gray-500 mb-3">Documento PDF</p>
          
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <ExternalLink className="w-4 h-4" />
            Ver completo
          </a>
        </div>
      </div>
    );
  }

  // Para otros tipos de archivo (imágenes, etc.)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Preview area */}
      <div className="relative h-40 bg-gray-50 flex items-center justify-center">
        {isImage && !imageError ? (
          <Image
            src={fileUrl}
            alt="Preview del archivo"
            width={150}
            height={150}
            className="object-contain max-h-full max-w-full rounded"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {isPdf ? 'PDF' : isImage ? 'Imagen' : 'Archivo'}
            </p>
          </div>
        )}
      </div>
      
      {/* File info */}
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 truncate mb-1">
          {getFileName()}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {archivo.tipo || 'Archivo'}
        </p>
        
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-4 h-4" />
          Ver completo
        </a>
      </div>
    </div>
  );
};

// Función para obtener archivos de solicitud
const obtenerArchivosSolicitud = async (idSolicitud: number): Promise<SolicitudArchivo[]> => {
  console.log('📁 [SUA FRENSHETSI ARCHIVOS] Obteniendo archivos para solicitud:', idSolicitud);
  
  try {
    const archivos = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
    console.log('✅ [SUA FRENSHETSI ARCHIVOS] Archivos obtenidos exitosamente:', archivos);
    return archivos || [];
  } catch (error) {
    console.error('❌ [SUA FRENSHETSI ARCHIVOS] Error al obtener archivos:', error);
    throw error;
  }
};

export function PlantillaSuaFrenshetsiDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: PlantillaSuaFrenshetsiDetailModalProps) {
  // Estados
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  
  const [loading, setLoading] = useState<LoadingStateSuaFrenshetsi>({
    archivos: false,
    general: false,
  });
  
  const [errors, setErrors] = useState<ErrorStateSuaFrenshetsi>({
    archivos: null,
    general: null,
  });

  // Hooks personalizados
  const { handleError } = useErrorHandler();

  // Cast de la solicitud para acceder a campos adicionales
  const solicitudExtended = solicitud as SolicitudSuaFrenshetsiExtended;

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

  // Efectos
  useEffect(() => {
    if (isOpen && solicitud) {
      fetchArchivos();
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
            <div className="absolute inset-0 bg-white/10 transform -skew-y-1"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Factory className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">PAGO SUA FRENSHETSI</h2>
                  <p className="text-blue-100 text-sm mt-1">Solicitud #{solicitud.id_solicitud}</p>
                  {solicitudExtended.folio && (
                    <p className="text-blue-100 text-sm mt-1">Folio: {solicitudExtended.folio}</p>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getEstadoColor(solicitud.estado || 'pendiente')}`}>
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </div>
          </header>
          
          {/* Información Principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Asunto" value={solicitud.asunto} className="md:col-span-2" />
              <InfoField label="Se paga por" value={solicitud.empresa} />
              <InfoField label="Cliente" value={solicitud.cliente} />
              <InfoField label="Monto Total" value={solicitud.monto} variant="currency" />
              <InfoField label="Fecha Límite" value={solicitud.fecha_limite} variant="date" />
            </div>
          </div>

          {/* Línea de Captura */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Línea de Captura IMSS</h3>
            <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 rounded-xl border border-blue-200">
              <InfoField 
                label="Línea de Captura" 
                value={solicitud.linea_captura} 
                variant="mono"
                className="bg-white/50 p-4 rounded-lg"
              />
            </div>
          </div>
          
          {/* Información de Aprobación */}
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

          {/* Archivos Adjuntos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Archivos Adjuntos</h3>
            
            {loading.archivos && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando archivos...</p>
              </div>
            )}

            {errors.archivos && (
              <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.archivos}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading.archivos && !errors.archivos && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivos && archivos.length > 0 ? (
                  archivos.map((archivo) => (
                    <FilePreview key={archivo.id} archivo={archivo} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">No hay archivos adjuntos disponibles</p>
                    <p className="text-gray-500 text-sm mt-2">Los documentos aparecerán aquí cuando sean cargados</p>
                  </div>
                )}
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
}

export default PlantillaSuaFrenshetsiDetailModal;