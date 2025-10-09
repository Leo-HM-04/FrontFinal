'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
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
  soporte_url?: string; // URL del comprobante de pago
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
  const handleError = useCallback((_error: unknown): string => {
    // console.error('Error:', _error);
    if (_error instanceof Error) {
      return _error.message;
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
    let baseClass = "text-gray-900 bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-blue-200 text-sm";
    if (variant === 'mono') {
      baseClass += " font-mono text-xs sm:text-sm";
    }
    if (variant === 'currency') {
      baseClass += " font-semibold text-green-700";
    }
    return baseClass;
  };
  return (
    <div className={`space-y-1.5 sm:space-y-2 ${className}`}>
      <label className="block text-xs sm:text-sm font-semibold text-blue-800">{label}</label>
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

  // Comprobantes de pago
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  // Función para obtener archivos
  const fetchArchivos = useCallback(async () => {
    if (!solicitud) return;
    setLoading(prev => ({ ...prev, archivos: true }));
    setErrors(prev => ({ ...prev, archivos: null }));
    try {
      const data = await SolicitudN09TokaArchivosService.obtenerArchivos(solicitud.id_solicitud || 0);
      setArchivos(data);
    } catch (_error) {
      const errorMessage = handleError(_error);
      setErrors(prev => ({ ...prev, archivos: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, archivos: false }));
    }
  }, [solicitud, handleError]);

  // Función para obtener comprobantes (para TOKA, usa archivos adjuntos de solicitudes_n09_toka_archivos)
  const fetchComprobantes = useCallback(async () => {
    if (!solicitud || !solicitud.id_solicitud) return;
    
    // Solo cargar comprobantes si la solicitud está pagada
    const estadoPagado = solicitud.estado?.toLowerCase();
    if (estadoPagado !== 'pagada') {
      setComprobantes([]);
      setLoadingComprobantes(false);
      setErrorComprobantes(null);
      return;
    }
    
    setLoadingComprobantes(true);
    setErrorComprobantes(null);
    try {
      // Primero verificar si hay soporte_url en la solicitud
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((solicitud as any).soporte_url) {
        const comprobanteFromSoporte = {
          id_comprobante: 999999, // ID ficticio para soporte_url
          id_solicitud: solicitud.id_solicitud || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ruta_archivo: (solicitud as any).soporte_url,
          nombre_archivo: 'Comprobante de Pago',
          fecha_subida: new Date().toISOString(),
          usuario_subio: 0,
          comentario: 'Comprobante desde soporte_url'
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.log(`✅ Usando comprobante desde soporte_url: ${(solicitud as any).soporte_url}`);
        setComprobantes([comprobanteFromSoporte]);
        return;
      }
      
      // 🔍 Para TOKA: Obtener archivos de solicitudes_n09_toka_archivos
      console.log('📋 Obteniendo archivos TOKA para comprobantes desde /uploads/solicitudes-n09-toka/');
      const archivos = await SolicitudN09TokaArchivosService.obtenerArchivos(solicitud.id_solicitud);
      
      // Convertir archivos TOKA al formato de comprobantes para mantener compatibilidad con el render
      const comprobantesConvertidos = archivos.map(archivo => ({
        id_comprobante: archivo.id_archivo,
        id_solicitud: solicitud.id_solicitud || 0,
        ruta_archivo: archivo.ruta_archivo, // Ya tiene formato /uploads/solicitudes-n09-toka/xxx.pdf
        nombre_archivo: archivo.nombre_archivo,
        fecha_subida: archivo.fecha_subida,
        usuario_subio: 0,
        comentario: `Archivo TOKA: ${archivo.tipo_archivo}`
      }));
      
      console.log(`✅ Archivos TOKA convertidos a comprobantes: ${comprobantesConvertidos.length}`);
      setComprobantes(comprobantesConvertidos);
    } catch (error) {
      console.error('❌ Error cargando archivos TOKA:', error);
      setErrorComprobantes('Error al cargar archivos');
    } finally {
      setLoadingComprobantes(false);
    }
  }, [solicitud]);

  useEffect(() => {
    if (isOpen && solicitud) {
      fetchArchivos();
      fetchComprobantes();
    }
  }, [isOpen, solicitud, fetchArchivos, fetchComprobantes]);

  useEffect(() => {
    if (!isOpen) {
      setArchivos([]);
      setLoading({ archivos: false, general: false });
      setErrors({ archivos: null, general: null });
      setComprobantes([]);
      setLoadingComprobantes(false);
      setErrorComprobantes(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-blue-900/60 backdrop-blur-sm overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container: responsive y con scroll interno */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-1.5 sm:p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {/* Contenido con scroll, layout horizontal en desktop */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Columna izquierda: info principal y auditoría */}
          <div className="flex-1 min-w-0 w-full">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-md">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                <Factory className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PAGO N09 / TOKA</span>
                </h2>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-xs sm:text-sm"><FileText className="w-3 h-3 sm:w-4 sm:h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitudExtended.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-xs sm:text-sm"><Factory className="w-3 h-3 sm:w-4 sm:h-4" />Folio: {solicitudExtended.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto`}>
                <Factory className="w-3 h-3 sm:w-4 sm:h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            {/* Información Principal */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} className="sm:col-span-2 lg:col-span-3" />
                <InfoField label="Cliente" value={solicitud.cliente} />
                <InfoField label="Beneficiario" value={solicitud.beneficiario} />
                <InfoField label="Monto" value={solicitud.monto} variant="currency" />
                <InfoField label="Tipo de Moneda" value={solicitud.tipo_moneda} />
              </div>
            </div>
            {/* Información Bancaria */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />Información Bancaria</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <InfoField label="Tipo de Cuenta" value={solicitud.tipo_cuenta_clabe} />
                <InfoField label="Número de Cuenta/CLABE" value={solicitud.numero_cuenta_clabe} variant="mono" />
                <InfoField label="Banco Destino" value={solicitud.banco_destino} />
              </div>
            </div>
            {/* Información de Aprobación */}
            {(solicitudExtended.id_aprobador || solicitudExtended.fecha_aprobacion || solicitudExtended.comentarios_aprobacion) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Aprobación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <InfoField label="ID Aprobador" value={solicitudExtended.id_aprobador?.toString()} />
                  <InfoField label="Fecha de Aprobación" value={solicitudExtended.fecha_aprobacion} variant="date" />
                  <div className="md:col-span-2">
                    <InfoField label="Comentarios de Aprobación" value={solicitudExtended.comentarios_aprobacion} />
                  </div>
                </div>
              </div>
            )}
            {/* Información de Auditoría */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />Información de Auditoría</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} variant="date" />
                <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} variant="date" />
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              </div>
            </div>

            {/* Comprobantes de Pago - Movido dentro de la columna izquierda */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200">Comprobante de Pago</h3>
              {loadingComprobantes ? (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
                  <span className="text-blue-600 text-sm">Cargando comprobante...</span>
                </div>
              ) : errorComprobantes ? (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{errorComprobantes}</div>
              ) : comprobantes.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {(() => {
                    const estado = solicitud.estado?.toLowerCase();
                    if (estado === 'pendiente') {
                      return <p className="text-gray-600 font-semibold">La solicitud debe ser autorizada y pagada para mostrar comprobantes</p>;
                    } else if (estado === 'autorizada') {
                      return <p className="text-gray-600 font-semibold">La solicitud está autorizada. Los comprobantes aparecerán cuando sea pagada</p>;
                    } else if (estado === 'rechazada') {
                      return <p className="text-gray-600 font-semibold">La solicitud fue rechazada. No se generarán comprobantes</p>;
                    } else {
                      return <p className="text-gray-600 font-semibold">AÚN NO HAY COMPROBANTE</p>;
                    }
                  })()}
                </div>
              ) : (
                (() => {
                  const comprobante = comprobantes[0];
                  if (!comprobante) return null;
                  const url = buildFileUrl(comprobante.ruta_archivo); // ✅ Usar buildFileUrl para construir URL correcta
                  const fileName = comprobante.ruta_archivo.split('/').pop() || 'comprobante';
                  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                  const isPdf = /\.pdf$/i.test(fileName);
                  return (
                    <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full">
                      <div className="relative h-[300px] sm:h-[350px] md:h-[420px] bg-gray-50 flex items-center justify-center">
                        {isImage ? (
                          <Image src={url} alt={fileName} fill className="object-contain p-2" />
                        ) : isPdf ? (
                          <iframe src={url} title={fileName} className="w-full h-full" />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200 m-4">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-blue-900 font-medium text-xs sm:text-sm truncate">{fileName}</p>
                              <p className="text-xs text-gray-600 mt-1">Archivo adjunto</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <button
                          onClick={() => window.open(url, '_blank')}
                          className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                        >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          Ver completo
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
          {/* Columna derecha: archivos adjuntos */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 min-w-0">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />Archivos Adjuntos</h3>
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
                <div className="flex flex-col gap-4 items-center justify-center w-full">
                  {archivos && archivos.length > 0 ? (
                    archivos.map((archivo) => (
                      <FilePreview key={archivo.id_archivo} archivo={archivo} />
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