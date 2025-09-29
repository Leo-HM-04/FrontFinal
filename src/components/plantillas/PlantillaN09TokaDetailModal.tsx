'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, Factory } from 'lucide-react';
import { PlantillaN09TokaModalProps, LoadingStateN09Toka, ErrorStateN09Toka } from '@/types/plantillaN09Toka';
import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import SolicitudN09TokaArchivosService, { type SolicitudN09TokaArchivo } from '@/services/solicitudN09TokaArchivos.service';

// Tipo extendido para solicitudes N09/TOKA que incluye campos adicionales
interface SolicitudN09TokaExtended extends SolicitudN09TokaData {
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
  switch ((estado || '').toLowerCase()) {
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

// Función para construir URL de archivos
const buildFileUrl = (rutaArchivo: string): string => {
  const baseUrl = 'https://bechapra.com.mx';
  if (!rutaArchivo) return '';
  if (rutaArchivo.startsWith('http')) return rutaArchivo;
  // Si la ruta contiene /uploads/ en cualquier parte, extraer desde ahí
  const uploadsIdx = rutaArchivo.indexOf('/uploads/');
  let rutaPublica = rutaArchivo;
  if (uploadsIdx !== -1) {
    rutaPublica = rutaArchivo.substring(uploadsIdx);
  }
  // Normalizar backslash a slash
  rutaPublica = rutaPublica.replace(/\\/g, '/');
  return `${baseUrl}${rutaPublica.startsWith('/') ? '' : '/'}${rutaPublica}`;
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
const FilePreview: React.FC<{ archivo: SolicitudN09TokaArchivo }> = ({ archivo }) => {
  const [imageError, setImageError] = useState(false);
  if (!archivo.ruta_archivo) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Archivo no disponible</p>
      </div>
    );
  }
  const fileUrl = buildFileUrl(archivo.ruta_archivo);
  const extension = archivo.ruta_archivo?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  const isPdf = extension === 'pdf';
  const getFileName = () => {
    const urlParts = archivo.ruta_archivo.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName || `Archivo ${archivo.id_archivo}`;
  };
  if (isPdf) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 truncate mb-1">
          {getFileName()}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Archivo
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

export function PlantillaN09TokaDetailModal({ solicitud, isOpen, onClose }: PlantillaN09TokaModalProps) {
  // Estados
  const [archivos, setArchivos] = useState<SolicitudN09TokaArchivo[]>([]);
  const [loading, setLoading] = useState<LoadingStateN09Toka>({ archivos: false, general: false });
  const [errors, setErrors] = useState<ErrorStateN09Toka>({ archivos: null, general: null });
  const { handleError } = useErrorHandler();
  const solicitudExtended = solicitud as SolicitudN09TokaExtended;

  // Función para obtener archivos
  const fetchArchivos = useCallback(async () => {
    if (!solicitud) return;
    setLoading(prev => ({ ...prev, archivos: true }));
    setErrors(prev => ({ ...prev, archivos: null }));
    try {
      const data = await SolicitudN09TokaArchivosService.obtenerArchivos(solicitud.id_solicitud || 0);
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
      {/* Modal container: horizontal, ancho, igual a SUA Frenshetsi */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Contenido con scroll, layout horizontal en desktop */}
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: info principal y auditoría */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PAGO N09 / TOKA</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitudExtended.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><Factory className="w-4 h-4" />Folio: {solicitudExtended.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                <Factory className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            {/* Información Principal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} className="md:col-span-2" />
                <InfoField label="Cliente" value={solicitud.cliente} />
                <InfoField label="Beneficiario" value={solicitud.beneficiario} />
                <InfoField label="Monto" value={solicitud.monto} variant="currency" />
                <InfoField label="Tipo de Moneda" value={solicitud.tipo_moneda} />
              </div>
            </div>
            {/* Información Bancaria */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Bancaria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Tipo de Cuenta" value={solicitud.tipo_cuenta_clabe} />
                <InfoField label="Número de Cuenta/CLABE" value={solicitud.numero_cuenta_clabe} variant="mono" />
                <InfoField label="Banco Destino" value={solicitud.banco_destino} />
                <InfoField label="Tiene Archivos" value={solicitudExtended.tiene_archivos ? 'Sí' : 'No'} />
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
                      <div key={archivo.id_archivo} className="w-full flex justify-center">
                        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
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