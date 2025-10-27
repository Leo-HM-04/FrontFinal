'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, Settings, DollarSign, Calendar, Building } from 'lucide-react';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Interfaz para datos de servicios internos
interface SolicitudServiciosInternosData {
  id_solicitud: number;
  folio: string;
  descripcion_pago: string;
  monto: number | string;
  fecha_limite_pago: string;
  estado: string;
  created_at: string;
  usuario_nombre?: string;
  nombre_aprobador?: string;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
  ruta_archivo?: string;
  soporte_url?: string;
  tiene_archivos?: boolean | number;
}

// Interfaz para props del modal
interface PlantillaServiciosInternosDetailModalProps {
  solicitud: SolicitudServiciosInternosData;
  isOpen: boolean;
  onClose: () => void;
}

// Estados de loading y error
interface LoadingStateServiciosInternos {
  archivos: boolean;
  general: boolean;
}

interface ErrorStateServiciosInternos {
  archivos: string | null;
  general: string | null;
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

// Función para formatear solo fecha (sin hora)
const formatDateOnly = (dateString: string): string => {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// URL base para archivos
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

// Componente InfoField para mostrar información
const InfoField: React.FC<{
  label: string;
  value: string | number | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, icon, className = '' }) => (
  <div className={`bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 ${className}`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-gray-800 font-medium">
      {typeof value === 'string' || typeof value === 'number' ? (
        <span className="wrap-break-word">{value}</span>
      ) : (
        value
      )}
    </div>
  </div>
);

// Componente para mostrar el estado de la solicitud
const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const getEstadoStyles = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'aprobada':
      case 'autorizada':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pagada':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoStyles(estado)}`}>
      {estado.toUpperCase()}
    </span>
  );
};

// Componente principal del modal
export const PlantillaServiciosInternosDetailModal: React.FC<PlantillaServiciosInternosDetailModalProps> = ({
  solicitud,
  isOpen,
  onClose
}) => {
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loading, setLoading] = useState<LoadingStateServiciosInternos>({
    archivos: false,
    general: false
  });
  const [error, setError] = useState<ErrorStateServiciosInternos>({
    archivos: null,
    general: null
  });

  const { handleError } = useErrorHandler();

  // Cargar archivos cuando se abre el modal
  useEffect(() => {
    if (isOpen && solicitud.id_solicitud) {
      cargarArchivos();
    }
  }, [isOpen, solicitud.id_solicitud]);

  const cargarArchivos = async () => {
    setLoading(prev => ({ ...prev, archivos: true }));
    setError(prev => ({ ...prev, archivos: null }));

    try {
      const archivosData = await SolicitudArchivosService.obtenerArchivos(solicitud.id_solicitud);
      setArchivos(archivosData || []);
    } catch (err) {
      const errorMessage = handleError(err);
      setError(prev => ({ ...prev, archivos: errorMessage }));
      console.error('Error cargando archivos:', err);
    } finally {
      setLoading(prev => ({ ...prev, archivos: false }));
    }
  };

  const handleFileClick = useCallback((archivo: SolicitudArchivo) => {
    try {
      const fileUrl = buildFileUrl(archivo.archivo_url);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error al abrir archivo:', err);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header del modal */}
        <div className="bg-linear-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pago de Servicios Internos</h2>
              <p className="text-green-100 text-sm">Folio: {solicitud.folio}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Estado de la solicitud */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Estado de la Solicitud</h3>
            <EstadoBadge estado={solicitud.estado} />
          </div>

          {/* Información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoField
              label="Descripción del Pago"
              value={solicitud.descripcion_pago || 'No especificada'}
              icon={<FileText className="w-4 h-4 text-blue-600" />}
              className="md:col-span-2"
            />
            
            <InfoField
              label="Monto Total"
              value={formatCurrency(solicitud.monto)}
              icon={<DollarSign className="w-4 h-4 text-green-600" />}
            />
            
            <InfoField
              label="Fecha Límite de Pago"
              value={formatDateOnly(solicitud.fecha_limite_pago)}
              icon={<Calendar className="w-4 h-4 text-red-600" />}
            />
          </div>

          {/* Información del solicitante */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Información del Solicitante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField
                label="Solicitante"
                value={solicitud.usuario_nombre || 'No especificado'}
                icon={<Building className="w-4 h-4 text-blue-600" />}
              />
              
              <InfoField
                label="Fecha de Solicitud"
                value={formatDate(solicitud.created_at)}
                icon={<Calendar className="w-4 h-4 text-blue-600" />}
              />
            </div>
          </div>

          {/* Información de aprobación (si aplica) */}
          {(solicitud.nombre_aprobador || solicitud.fecha_aprobacion) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Aprobación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {solicitud.nombre_aprobador && (
                  <InfoField
                    label="Aprobador"
                    value={solicitud.nombre_aprobador}
                    icon={<Building className="w-4 h-4 text-green-600" />}
                  />
                )}
                
                {solicitud.fecha_aprobacion && (
                  <InfoField
                    label="Fecha de Aprobación"
                    value={formatDate(solicitud.fecha_aprobacion)}
                    icon={<Calendar className="w-4 h-4 text-green-600" />}
                  />
                )}
                
                {solicitud.comentarios_aprobacion && (
                  <InfoField
                    label="Comentarios de Aprobación"
                    value={solicitud.comentarios_aprobacion}
                    className="md:col-span-2"
                  />
                )}
              </div>
            </div>
          )}

          {/* Archivos adjuntos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Documentos de Soporte
            </h3>
            
            {loading.archivos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Cargando archivos...</span>
              </div>
            ) : error.archivos ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error al cargar archivos: {error.archivos}</p>
                <button
                  onClick={cargarArchivos}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : archivos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivos.map((archivo) => (
                  <div
                    key={archivo.id}
                    onClick={() => handleFileClick(archivo)}
                    className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {archivo.tipo || 'Documento'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(archivo.fecha_subida)}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay documentos adjuntos</p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta solicitud no incluye documentos de soporte
                </p>
              </div>
            )}
          </div>

          {/* Comprobante de pago (si existe) */}
          {(solicitud.ruta_archivo || solicitud.soporte_url) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comprobante de Pago</h3>
              <div
                onClick={() => {
                  const url = solicitud.ruta_archivo || solicitud.soporte_url;
                  if (url) {
                    window.open(buildFileUrl(url), '_blank', 'noopener,noreferrer');
                  }
                }}
                className="bg-linear-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Comprobante de Pago</p>
                    <p className="text-sm text-gray-600">Clic para ver el comprobante</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del modal */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantillaServiciosInternosDetailModal;