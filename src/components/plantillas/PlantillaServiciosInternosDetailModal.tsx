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

// Hook para manejo de errores
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
  <div className={`text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md space-y-3 ${className}`}>
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
      {icon}
      {label}
    </label>
    <div className="text-slate-800">
      {typeof value === 'string' || typeof value === 'number' ? (
        <span className="wrap-break-word">{value}</span>
      ) : (
        value
      )}
    </div>
  </div>
);

export function PlantillaServiciosInternosDetailModal({ solicitud, isOpen, onClose }: PlantillaServiciosInternosDetailModalProps) {
  // Estado para archivos
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
      console.log('🔍 [SERVICIOS INTERNOS MODAL] Cargando archivos para solicitud:', solicitud.id_solicitud);
      console.log('🔍 [SERVICIOS INTERNOS MODAL] soporte_url:', solicitud.soporte_url);
      cargarArchivos();
    }
  }, [isOpen, solicitud.id_solicitud]);

  const cargarArchivos = async () => {
    setLoading(prev => ({ ...prev, archivos: true }));
    setError(prev => ({ ...prev, archivos: null }));

    try {
      const archivosData = await SolicitudArchivosService.obtenerArchivos(solicitud.id_solicitud);
      console.log('🔍 [SERVICIOS INTERNOS MODAL] Archivos cargados:', archivosData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" 
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <header className="bg-linear-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>Pago de Servicios Internos</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm">
                    <Building className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm">
                    <FileText className="w-4 h-4" />Folio: {solicitud.folio}
                  </span>
                </div>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>

            {/* Información principal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />Información Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Descripción del Pago"
                  value={solicitud.descripcion_pago || 'No especificada'}
                  icon={<FileText className="w-4 h-4 text-blue-600" />}
                  className="md:col-span-2"
                />
                
                <InfoField
                  label="Monto Total"
                  value={<span className="font-bold text-emerald-600">{formatCurrency(solicitud.monto)}</span>}
                  icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                />
                
                <InfoField
                  label="Fecha Límite de Pago"
                  value={formatDateOnly(solicitud.fecha_limite_pago)}
                  icon={<Calendar className="w-4 h-4 text-red-600" />}
                />
              </div>
            </div>

            {/* Información del solicitante */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />Información del Solicitante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Información de Aprobación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Comprobante de Pago */}
            <div className="mb-6 w-full">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Comprobante de Pago
              </h3>
              
              {loading.archivos && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando comprobantes...</p>
                </div>
              )}
              
              {!loading.archivos && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // Filtrar comprobantes de pago de archivos adjuntos
                    const comprobantesArchivos = archivos.filter(archivo => 
                      archivo.tipo === 'comprobante_pago' || 
                      archivo.tipo === 'comprobante' ||
                      (archivo.tipo && archivo.tipo.toLowerCase().includes('comprobante'))
                    );
                    
                    // Verificar si hay comprobante en soporte_url
                    const tieneComprobanteUrl = solicitud.soporte_url && solicitud.soporte_url.trim() !== '';
                    
                    const handleComprobanteUrlClick = () => {
                      if (solicitud.soporte_url) {
                        const fileUrl = buildFileUrl(solicitud.soporte_url);
                        window.open(fileUrl, '_blank', 'noopener,noreferrer');
                      }
                    };
                    
                    const totalComprobantes = comprobantesArchivos.length + (tieneComprobanteUrl ? 1 : 0);
                    
                    if (totalComprobantes > 0) {
                      const elementos = [];
                      
                      // Agregar comprobante de soporte_url si existe
                      if (tieneComprobanteUrl) {
                        elementos.push(
                          <div key="soporte-url" className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div 
                              onClick={handleComprobanteUrlClick}
                              className="relative h-40 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                                  <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-sm text-slate-600 font-semibold">Comprobante de Pago</p>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-blue-100 p-1.5 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">Comprobante de Pago</p>
                                  <p className="text-xs text-slate-500">Subido por pagador</p>
                                </div>
                              </div>
                              <button
                                onClick={handleComprobanteUrlClick}
                                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                              >
                                <ExternalLink className="w-4 h-4" />Ver comprobante
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      // Agregar comprobantes de archivos adjuntos
                      comprobantesArchivos.forEach((archivo) => {
                        elementos.push(
                          <div key={archivo.id} className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div 
                              onClick={() => handleFileClick(archivo)}
                              className="relative h-40 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                                  <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="text-sm text-slate-600 font-semibold">Comprobante de Pago</p>
                              </div>
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-blue-100 p-1.5 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">Comprobante de Pago</p>
                                  <p className="text-xs text-slate-500">{formatDate(archivo.fecha_subida)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleFileClick(archivo)}
                                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                              >
                                <ExternalLink className="w-4 h-4" />Ver comprobante
                              </button>
                            </div>
                          </div>
                        );
                      });
                      
                      return elementos;
                    } else {
                      return (
                        <div className="col-span-full text-center py-12 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300">
                          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-blue-600 font-medium">No hay comprobantes de pago disponibles</p>
                          <p className="text-blue-500 text-sm mt-2">Los comprobantes aparecerán aquí cuando sean subidos por el pagador</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />Documentos de Soporte
              </h3>
              
              {loading.archivos && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando archivos...</p>
                </div>
              )}
              {error.archivos && (
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
                  <div className="flex">
                    <div className="shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error.archivos}</p>
                    </div>
                  </div>
                </div>
              )}
              {!loading.archivos && !error.archivos && (
                <div className="flex flex-col items-center justify-center w-full">
                  {(() => {
                    // Filtrar solo los documentos de soporte (facturas, documentos, NO comprobantes de pago)
                    const documentos = archivos.filter(archivo => 
                      archivo.tipo !== 'comprobante_pago' && 
                      archivo.tipo !== 'comprobante' &&
                      !(archivo.tipo && archivo.tipo.toLowerCase().includes('comprobante'))
                    );
                    
                    return documentos.length > 0 ? (
                      documentos.map((archivo) => (
                        <div key={archivo.id} className="w-full flex justify-center">
                          <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                            <div 
                              onClick={() => handleFileClick(archivo)}
                              className="relative h-[420px] bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                            >
                              <div className="text-center">
                                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                  <FileText className="w-10 h-10 text-blue-600" />
                                </div>
                                <p className="text-sm text-slate-600 font-semibold">{archivo.tipo || 'Documento'}</p>
                                <p className="text-xs text-slate-500 mt-1">{formatDate(archivo.fecha_subida)}</p>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">{archivo.tipo || 'Documento'}</p>
                                  <p className="text-xs text-slate-500 mt-1">{formatDate(archivo.fecha_subida)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleFileClick(archivo)}
                                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                <ExternalLink className="w-4 h-4" />Ver completo
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No hay documentos de soporte disponibles</p>
                        <p className="text-gray-500 text-sm mt-2">Los documentos aparecerán aquí cuando sean cargados</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlantillaServiciosInternosDetailModal;