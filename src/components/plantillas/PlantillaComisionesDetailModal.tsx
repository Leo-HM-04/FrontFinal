'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, CreditCard, Building2, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { SolicitudComisionesData } from '@/types/plantillaComisiones';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import { obtenerNombreBanco } from '@/utils/bancos';

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
  banco_destino?: string;
  cuenta_destino?: string;
  tipo_cuenta_destino?: string;
  beneficiario?: string;
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


export function PlantillaComisionesDetailModal({ solicitud, isOpen, onClose }: PlantillaComisionesDetailModalProps) {
  // Estados
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loading, setLoading] = useState<LoadingStateComisiones>({ archivos: false, general: false });
  const [errors, setErrors] = useState<ErrorStateComisiones>({ archivos: null, general: null });

  // Hooks personalizados
  const { handleError } = useErrorHandler();
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

  useEffect(() => {
    if (isOpen && solicitud) {
      fetchArchivos();
    }
  }, [isOpen, solicitud, fetchArchivos]);

  useEffect(() => {
    if (!isOpen) {
      setArchivos([]);
      setLoading({ archivos: false, general: false });
      setErrors({ archivos: null, general: null });
    }
  }, [isOpen]);

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
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container: igual SUA Frenshetsi */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Layout horizontal */}
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: info principal y auditoría */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PAGO COMISIONES</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitudExtended.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><CreditCard className="w-4 h-4" />Folio: {solicitudExtended.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                <CreditCard className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            {/* Información Principal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} className="md:col-span-2" />
                <InfoField label="Empresa" value={solicitud.empresa} />
                <InfoField label="Cliente/Concepto" value={solicitud.cliente} />
                <InfoField label="Monto Total" value={solicitud.monto} variant="currency" />
                <InfoField label="Fecha Límite" value={solicitud.fecha_limite} variant="date" />
              </div>
            </div>

            {/* Información Bancaria */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Información Bancaria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField 
                  label="Banco Destino" 
                  value={solicitudExtended.banco_destino 
                    ? obtenerNombreBanco(solicitudExtended.banco_destino)
                    : ((solicitud as any).banco_destino 
                      ? obtenerNombreBanco((solicitud as any).banco_destino)
                      : 'No especificado')} 
                />
                <InfoField 
                  label="Cuenta/CLABE" 
                  value={solicitudExtended.cuenta_destino || (solicitud as any).cuenta_destino || 'No especificado'} 
                  variant="mono" 
                />
                <InfoField 
                  label="Tipo de Cuenta" 
                  value={solicitudExtended.tipo_cuenta_destino || (solicitud as any).tipo_cuenta_destino || 'No especificado'} 
                />
                <InfoField 
                  label="Beneficiario" 
                  value={solicitudExtended.beneficiario || (solicitud as any).beneficiario || 'No especificado'} 
                />
              </div>
            </div>

            {/* Detalles de Comisión */}
            {(solicitud.porcentaje_comision || solicitud.periodo_comision) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500" />Detalles de Comisión</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Porcentaje de Comisión" value={solicitud.porcentaje_comision} variant="percentage" />
                  <InfoField label="Periodo de Comisión" value={solicitud.periodo_comision} />
                </div>
              </div>
            )}
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
                <div className="flex flex-col items-center justify-center w-full">
                  {archivos && archivos.length > 0 ? (
                    archivos.map((archivo) => (
                      <div key={archivo.id} className="w-full flex justify-center">
                        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                          {/* Preview area grande */}
                          <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                            <FilePreview archivo={archivo} />
                          </div>
                        </div>
                      </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlantillaComisionesDetailModal;