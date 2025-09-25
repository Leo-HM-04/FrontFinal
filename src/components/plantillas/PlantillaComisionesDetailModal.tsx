'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, CreditCard, Building2, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { SolicitudComisionesData } from '@/types/plantillaComisiones';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Interfaz para props del modal
interface PlantillaComisionesDetailModalProps {
  solicitud: SolicitudComisionesData;
  isOpen: boolean;
  onClose: () => void;
}

// Estados de loading y error
interface LoadingStateComisiones {
  archivos: boolean;
  general: boolean;
}

interface ErrorStateComisiones {
  archivos: string | null;
  general: string | null;
}

// Tipo extendido para solicitudes COMISIONES que incluye campos adicionales
interface SolicitudComisionesExtended extends SolicitudComisionesData {
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

// Función para formatear porcentaje
const formatPercentage = (percentage: number | undefined): string => {
  if (percentage === undefined || percentage === null) return 'No especificado';
  return `${percentage}%`;
};

// Función para obtener colores del estado
const getEstadoColor = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'aprobada':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'rechazada':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'pagada':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    default:
      return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
};

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

// Componente InfoField mejorado con estilo BECHAPRA
interface InfoFieldProps {
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'currency' | 'mono' | 'date' | 'percentage';
  className?: string;
  icon?: React.ReactNode;
}

const InfoField: React.FC<InfoFieldProps> = ({ 
  label, 
  value, 
  variant = 'default',
  className = '',
  icon
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
      case 'percentage':
        return formatPercentage(Number(value));
      case 'mono':
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getValueClassName = () => {
    let baseClass = "text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md";
    
    if (variant === 'mono') {
      baseClass += " font-mono text-sm";
    }
    if (variant === 'currency') {
      baseClass += " font-bold text-emerald-600";
    }
    if (variant === 'percentage') {
      baseClass += " font-semibold text-blue-600";
    }
    
    return baseClass;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        {icon}
        {label}
      </label>
      <div className={getValueClassName()}>
        {formatValue()}
      </div>
    </div>
  );
};

// Componente para preview de archivos con estilo BECHAPRA
const FilePreview: React.FC<{ archivo: SolicitudArchivo }> = ({ archivo }) => {
  const [imageError, setImageError] = useState(false);
  
  console.log('🖼️ [COMISIONES ARCHIVOS] Renderizando preview para archivo ID:', archivo.id);
  
  if (!archivo.archivo_url) {
    console.log('⚠️ [COMISIONES ARCHIVOS] No hay URL de archivo');
    return (
      <div className="text-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Archivo no disponible</p>
      </div>
    );
  }

  const fileUrl = buildFileUrl(archivo.archivo_url);
  console.log('🔗 [COMISIONES ARCHIVOS] URL construida:', fileUrl);

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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* PDF Preview mejorado */}
        <div className="w-full rounded-t-2xl border-b border-slate-200 overflow-hidden bg-white">
          <iframe 
            src={fileUrl} 
            title={getFileName()}
            className="w-full border-0" 
            style={{ height: '220px' }} 
          />
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-xs text-center text-blue-700 font-medium border-t border-blue-100">
            Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
          </div>
        </div>
        
        {/* File info and actions */}
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {getFileName()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Documento PDF</p>
            </div>
          </div>
          
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Preview area */}
      <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-200">
        {isImage && !imageError ? (
          <Image
            src={fileUrl}
            alt="Preview del archivo"
            width={180}
            height={180}
            className="object-contain max-h-full max-w-full rounded-lg shadow-sm"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 font-semibold">
              {isPdf ? 'PDF' : isImage ? 'Imagen' : 'Archivo'}
            </p>
          </div>
        )}
      </div>
      
      {/* File info */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {getFileName()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {archivo.tipo || 'Archivo'}
            </p>
          </div>
        </div>
        
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
  console.log('📁 [COMISIONES ARCHIVOS] Obteniendo archivos para solicitud:', idSolicitud);
  
  try {
    const archivos = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
    console.log('✅ [COMISIONES ARCHIVOS] Archivos obtenidos exitosamente:', archivos);
    return archivos || [];
  } catch (error) {
    console.error('❌ [COMISIONES ARCHIVOS] Error al obtener archivos:', error);
    throw error;
  }
};

export function PlantillaComisionesDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: PlantillaComisionesDetailModalProps) {
  // Estados
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  
  const [loading, setLoading] = useState<LoadingStateComisiones>({
    archivos: false,
    general: false,
  });
  
  const [errors, setErrors] = useState<ErrorStateComisiones>({
    archivos: null,
    general: null,
  });

  // Hooks personalizados
  const { handleError } = useErrorHandler();

  // Cast de la solicitud para acceder a campos adicionales
  const solicitudExtended = solicitud as SolicitudComisionesExtended;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Overlay mejorado */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-indigo-900/85 backdrop-blur-sm transition-all duration-500"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      
      {/* Modal container mejorado */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-5xl xl:max-w-6xl max-h-[95vh] overflow-hidden border border-slate-200">
        {/* Botón de cerrar mejorado */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-slate-200 hover:border-red-200"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Contenido con scroll mejorado */}
        <div className="overflow-y-auto max-h-[95vh] scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-blue-400 hover:scrollbar-thumb-blue-500">
          
          {/* Header BECHAPRA mejorado */}
          <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-8 relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                  <CreditCard className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">PAGO COMISIONES</h1>
                  <div className="flex items-center gap-4 text-blue-100">
                    <span className="text-lg font-semibold">Solicitud #{solicitud.id_solicitud}</span>
                    {solicitudExtended.folio && (
                      <>
                        <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                        <span>Folio: {solicitudExtended.folio}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-2xl text-base font-bold shadow-lg ${getEstadoColor(solicitud.estado || 'pendiente')}`}>
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </div>
            </div>
          </header>
          
          <div className="p-8">
            {/* Información Principal mejorada */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Información Principal</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
                <InfoField 
                  label="Asunto" 
                  value={solicitud.asunto} 
                  className="md:col-span-2" 
                  icon={<FileText className="w-4 h-4 text-slate-500" />}
                />
                <InfoField 
                  label="Empresa" 
                  value={solicitud.empresa} 
                  icon={<Building2 className="w-4 h-4 text-slate-500" />}
                />
                <InfoField 
                  label="Cliente/Concepto" 
                  value={solicitud.cliente} 
                  icon={<User className="w-4 h-4 text-slate-500" />}
                />
                <InfoField 
                  label="Monto Total" 
                  value={solicitud.monto} 
                  variant="currency" 
                  icon={<DollarSign className="w-4 h-4 text-slate-500" />}
                />
                <InfoField 
                  label="Fecha Límite" 
                  value={solicitud.fecha_limite} 
                  variant="date" 
                  icon={<Calendar className="w-4 h-4 text-slate-500" />}
                />
              </div>
            </div>

            {/* Información de Comisión mejorada */}
            {(solicitud.porcentaje_comision || solicitud.periodo_comision) && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Detalles de Comisión</h2>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl border border-emerald-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField 
                      label="Porcentaje de Comisión" 
                      value={solicitud.porcentaje_comision} 
                      variant="percentage"
                      icon={<DollarSign className="w-4 h-4 text-slate-500" />}
                    />
                    <InfoField 
                      label="Periodo de Comisión" 
                      value={solicitud.periodo_comision}
                      icon={<Calendar className="w-4 h-4 text-slate-500" />}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Información de Aprobación mejorada */}
            {(solicitudExtended.id_aprobador || solicitudExtended.fecha_aprobacion || solicitudExtended.comentarios_aprobacion) && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Información de Aprobación</h2>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField 
                      label="ID Aprobador" 
                      value={solicitudExtended.id_aprobador?.toString()} 
                      icon={<User className="w-4 h-4 text-slate-500" />}
                    />
                    <InfoField 
                      label="Fecha de Aprobación" 
                      value={solicitudExtended.fecha_aprobacion} 
                      variant="date" 
                      icon={<Calendar className="w-4 h-4 text-slate-500" />}
                    />
                    <div className="md:col-span-2">
                      <InfoField 
                        label="Comentarios de Aprobación" 
                        value={solicitudExtended.comentarios_aprobacion} 
                        icon={<FileText className="w-4 h-4 text-slate-500" />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Archivos Adjuntos mejorados */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Archivos Adjuntos</h2>
              </div>
              
              {loading.archivos && (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
                  </div>
                  <p className="text-slate-600 font-semibold text-lg">Cargando archivos...</p>
                  <p className="text-slate-500 text-sm mt-2">Por favor espere un momento</p>
                </div>
              )}

              {errors.archivos && (
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-2xl shadow-sm">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <X className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-base font-semibold text-red-800">Error al cargar archivos</p>
                      <p className="text-sm text-red-700 mt-1">{errors.archivos}</p>
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
                    <div className="col-span-full text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border-2 border-dashed border-slate-300">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
                        <FileText className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">No hay archivos adjuntos</h3>
                      <p className="text-slate-500 max-w-md mx-auto">Los documentos aparecerán aquí cuando sean cargados por el solicitante</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Información de Auditoría mejorada */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Información de Auditoría</h2>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoField 
                    label="Fecha de Creación" 
                    value={solicitud.fecha_creacion} 
                    variant="date" 
                    icon={<Calendar className="w-4 h-4 text-slate-500" />}
                  />
                  <InfoField 
                    label="Fecha de Actualización" 
                    value={solicitud.fecha_actualizacion} 
                    variant="date" 
                    icon={<Calendar className="w-4 h-4 text-slate-500" />}
                  />
                  <InfoField 
                    label="Usuario de Creación" 
                    value={solicitud.usuario_creacion} 
                    icon={<User className="w-4 h-4 text-slate-500" />}
                  />
                  <InfoField 
                    label="Usuario de Actualización" 
                    value={solicitud.usuario_actualizacion} 
                    icon={<User className="w-4 h-4 text-slate-500" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlantillaComisionesDetailModal;