'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, FileText, Eye, EyeOff, ExternalLink, Download } from 'lucide-react';
import { PlantillaN09TokaModalProps, LoadingStateN09Toka, ErrorStateN09Toka } from '@/types/plantillaN09Toka';
import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import SolicitudN09TokaArchivosService, { type SolicitudN09TokaArchivo } from '@/services/solicitudN09TokaArchivos.service';

// Función para formatear moneda en pesos mexicanos
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
};

// Función para obtener el color del estado
const getEstadoColor = (estado: string): string => {
  const colors = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    autorizada: 'bg-green-100 text-green-800 border-green-200',
    rechazada: 'bg-red-100 text-red-800 border-red-200',
    pagada: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Función para formatear fechas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Hook personalizado para manejo de errores
const useErrorHandler = () => {
  const handleError = useCallback((error: unknown): string => {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      
      if (err.response && typeof err.response === 'object' && err.response !== null) {
        const response = err.response as Record<string, unknown>;
        if (typeof response.status === 'number') {
          const status = response.status;
          
          switch (status) {
            case 401:
            case 403:
              return 'No tiene permisos para ver esta información.';
            case 404:
              return 'No se encontró la información solicitada.';
            case 500:
              return 'Error interno del servidor. Intente nuevamente más tarde.';
            default:
              return `Error del servidor (${status}). Intente nuevamente más tarde.`;
          }
        }
      }
      
      if (err.request) {
        return 'No se pudo establecer conexión con el servidor. Verifique su conexión a internet.';
      }
      
      if (typeof err.message === 'string') {
        return `Error: ${err.message}`;
      }
    }
    
    return 'Ocurrió un error inesperado. Intente nuevamente.';
  }, []);
  
  return { handleError };
};

// Componente para mostrar estados de carga
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
    <span className="text-blue-600 text-sm">{message}</span>
  </div>
);

// Componente para mostrar errores
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
        variant === 'currency' ? 'text-green-700 font-semibold' : ''
      }`}>
        {displayValue}
      </p>
    </div>
  );
};

// Componente para previsualización de archivos
const FilePreview: React.FC<{
  archivo: SolicitudN09TokaArchivo;
  baseUrl: string;
}> = ({ archivo, baseUrl }) => {
  const url = `${baseUrl}/${archivo.ruta_archivo}`;
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(archivo.nombre_archivo);
  const isPdf = /\.pdf$/i.test(archivo.nombre_archivo);

  if (isImage) {
    return (
      <div className="relative w-full h-40 group overflow-hidden rounded border border-blue-200 shadow-sm bg-white/90">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
        <Image
          src={url}
          alt={archivo.nombre_archivo}
          fill
          className="object-contain bg-white/80 transition-all duration-300 group-hover:scale-[1.02]"
          onLoad={(e) => {
            const parent = (e.target as HTMLImageElement).parentElement;
            const loadingBg = parent?.querySelector('div');
            if (loadingBg) loadingBg.classList.add('opacity-0');
          }}
          quality={85}
        />
        <div 
          className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 cursor-zoom-in"
          onClick={() => window.open(url, '_blank')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.open(url, '_blank');
            }
          }}
          aria-label="Abrir imagen en nueva ventana"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
        <iframe 
          src={url} 
          title={archivo.nombre_archivo}
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
          Archivo: {archivo.nombre_archivo}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Subido el {formatDate(archivo.fecha_subida)} • {Math.round(archivo.tamano_archivo / 1024)} KB
        </p>
      </div>
    </div>
  );
};

export function PlantillaN09TokaDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: PlantillaN09TokaModalProps) {
  // Estados
  const [archivos, setArchivos] = useState<SolicitudN09TokaArchivo[]>([]);
  
  const [loading, setLoading] = useState<LoadingStateN09Toka>({
    archivos: false,
    general: false,
  });
  
  const [errors, setErrors] = useState<ErrorStateN09Toka>({
    archivos: null,
    general: null,
  });

  // Hooks personalizados
  const { handleError } = useErrorHandler();

  // URL base para archivos
  const baseFileUrl = process.env.NEXT_PUBLIC_API_URL || 'https://bechapra.com.mx:8443/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-blue-200/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Plantilla N09 y TOKA</h2>
              <p className="text-blue-100 text-sm mt-1">
                Asunto: {solicitud.asunto}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(solicitud.estado || 'pendiente')}`}>
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-1 rounded-full hover:bg-blue-800/50"
                title="Cerrar"
                aria-label="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Información Principal */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">
              Información Principal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Cliente" value={solicitud.cliente} />
              <InfoField label="Beneficiario" value={solicitud.beneficiario} />
              <InfoField label="Proveedor" value={solicitud.proveedor} />
              <InfoField label="Monto" value={solicitud.monto.toString()} variant="currency" />
              <InfoField label="Tipo de Moneda" value={solicitud.tipo_moneda} />
              <InfoField label="Fecha Límite de Pago" value={solicitud.fecha_limite_pago ? formatDate(solicitud.fecha_limite_pago) : ''} />
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">
              Información Bancaria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Tipo de Cuenta" value={solicitud.tipo_cuenta_clabe} />
              <InfoField label="Número de Cuenta/CLABE" value={solicitud.numero_cuenta_clabe} variant="mono" />
              <InfoField label="Banco Destino" value={solicitud.banco_destino} />
            </div>
          </div>

          {/* Información de Seguimiento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">
              Información de Seguimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion ? formatDate(solicitud.fecha_creacion) : ''} />
              <InfoField label="Última Actualización" value={solicitud.fecha_actualizacion ? formatDate(solicitud.fecha_actualizacion) : ''} />
              <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
              <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
            </div>
          </div>

          {/* Archivos Adjuntos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">
              Archivos Adjuntos
            </h3>
            
            {loading.archivos && (
              <LoadingSpinner message="Cargando archivos..." />
            )}

            {errors.archivos && (
              <ErrorMessage message={errors.archivos} />
            )}

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
                      <div key={archivo.id_archivo} className="bg-white/90 rounded-lg border border-blue-200 p-4 shadow-sm">
                        <FilePreview archivo={archivo} baseUrl={baseFileUrl} />
                        
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => window.open(`${baseFileUrl}/${archivo.ruta_archivo}`, '_blank')}
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
        </div>
      </div>
    </div>
  );
}