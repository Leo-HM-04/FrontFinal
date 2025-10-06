import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, DollarSign, Building2, FileText, ExternalLink, FileCheck } from 'lucide-react';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';

// Tipos específicos para la plantilla de Pólizas
export interface SolicitudPolizasData {
  id_solicitud: number;
  asunto: string;
  titular_poliza: string; // aseguradora (titular de la cuenta)
  empresa_emisora?: string; // empresa emisora del pago
  banco_destino?: string; // banco destino
  convenio?: string; // convenio
  referencia?: string; // referencia
  numero_poliza: string;
  monto: number;
  tipo_movimiento: string;
  nombre_solicitante: string;
  email_solicitante: string;
  gerencia_solicitante: string;
  // Campos de auditoría y estado  
  folio: string;
  departamento: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  concepto: string;
  observaciones: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_creacion: string;
  usuario_actualizacion: string;
}

interface PlantillaPolizasDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: SolicitudPolizasData;
  titulo?: string;
}

export const PlantillaPolizasDetailModal: React.FC<PlantillaPolizasDetailModalProps> = ({
  isOpen,
  onClose,
  solicitud,
  titulo = "PAGO POLIZAS"
}) => {
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState<SolicitudArchivo | null>(null);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);
  // Cargar comprobantes si la solicitud está pagada
  const fetchComprobantes = useCallback(async () => {
    setLoadingComprobantes(true);
    setErrorComprobantes(null);
    try {
      const data = await SolicitudesService.getComprobantes(solicitud.id_solicitud);
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

  const cargarArchivos = useCallback(async () => {
    try {
      setLoadingArchivos(true);
      const response = await SolicitudArchivosService.obtenerArchivos(solicitud.id_solicitud);
      setArchivos(response || []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
      setArchivos([]);
    } finally {
      setLoadingArchivos(false);
    }
  }, [solicitud.id_solicitud]);

  useEffect(() => {
    if (isOpen && solicitud?.id_solicitud) {
      cargarArchivos();
    }
  }, [isOpen, solicitud?.id_solicitud, cargarArchivos]);
  useEffect(() => {
    if (archivos.length > 0) {
      setArchivoPreview(archivos[0]);
    } else {
      setArchivoPreview(null);
    }
  }, [archivos]);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(numAmount || 0);
  };



  const getTitularLabel = (titular: string): string => {
    const aseguradoras: Record<string, string> = {
      'qualitas': 'Qualitas Compañía de Seguros',
      'allianz': 'Allianz Seguros',
      'gnp': 'GNP Seguros',
      'axa': 'AXA Seguros',
      'mapfre': 'MAPFRE Seguros'
    };
    
    if (!titular) return 'No especificada';
    const key = titular.toLowerCase();
    return aseguradoras[key] || titular;
  };

  const InfoField: React.FC<{
    label: string;
    value: string | number | null | undefined;
    className?: string;
    icon?: React.ReactNode;
  }> = ({ label, value, className = '', icon }) => (
    <div className={`bg-white/80 p-3 rounded border border-blue-100 flex items-center gap-2 ${className}`}>
      {icon && <span className="text-blue-600">{icon}</span>}
      <div>
        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">{label}</span>
        <p className="text-blue-900 font-medium text-sm">{value || '-'}</p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (!isOpen) return null;

  // Renderiza la previsualización del archivo seleccionado
  const renderPreview = () => {
    if (!archivoPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-blue-400">
          <FileText className="w-16 h-16 mb-4" />
          <span className="text-lg">Selecciona un archivo para previsualizar</span>
        </div>
      );
    }
    const url = archivoPreview.archivo_url;
    if (url.match(/\.(pdf)$/i)) {
      return (
        <iframe
          src={url}
          title="Previsualización PDF"
          className="w-full h-64 md:h-96 rounded-xl border border-blue-200 bg-white"
        />
      );
    }
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return (
        <div className="relative w-full h-64 md:h-96 rounded-xl border border-blue-200 bg-white overflow-hidden">
          <Image src={url} alt="Previsualización" fill className="object-contain" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-blue-400">
        <FileText className="w-16 h-16 mb-4" />
        <span className="text-lg">No se puede previsualizar este tipo de archivo</span>
      </div>
    );
  };

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
      {/* Modal container: horizontal layout */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Layout horizontal: info+comprobantes left, archivos right */}
  <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: info principal, montos, comprobantes */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>{titulo}</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Solicitud #{solicitud.id_solicitud}</span>
                  {solicitud.folio && (
                    <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Folio: {solicitud.folio}</span>
                  )}
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                <FileText className="w-4 h-4" />
                {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            {/* Información Principal */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto || solicitud.concepto} icon={<FileText className="w-4 h-4" />} />
                <InfoField label="Titular de la Cuenta (Aseguradora)" value={getTitularLabel(solicitud.titular_poliza)} icon={<Shield className="w-4 h-4" />} />
                <InfoField label="Empresa Emisora del Pago" value={solicitud.empresa_emisora} icon={<Building2 className="w-4 h-4" />} />
                <InfoField label="Banco Destino" value={solicitud.banco_destino} icon={<Building2 className="w-4 h-4" />} />
                <InfoField label="Convenio" value={solicitud.convenio} icon={<FileText className="w-4 h-4" />} />
                <InfoField label="Referencia" value={solicitud.referencia} icon={<FileText className="w-4 h-4" />} />
              </div>
            </div>
            {/* Información de Montos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Monto Total</h3>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-300" />
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(solicitud.monto)}
                  </p>
                </div>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-20" />
              </div>
            </div>
            {/* Comprobantes de Pago */}
            {solicitud.estado === 'pagada' && (
              <div className="mb-6 w-full">
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
                    <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No hay comprobantes disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comprobantes.map((comprobante) => {
                      const comprobanteUrl = comprobante.ruta_archivo;
                      const fileName = comprobante.nombre_archivo || comprobanteUrl.split('/').pop() || '';
                      return (
                        <div key={comprobante.id_comprobante} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-3">
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
                            <div className="w-full md:w-auto flex justify-end">
                              <button
                                onClick={() => window.open(comprobanteUrl, '_blank')}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs w-full md:w-auto"
                                disabled={!comprobanteUrl}
                              >
                                Ver completo
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Información de Auditoría */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información de Auditoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} />
                <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} />
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              </div>
            </div>
          </div>
          {/* Columna derecha: archivos adjuntos y comprobante de pago */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Archivos Adjuntos</h3>
              {loadingArchivos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando archivos...</p>
                </div>
              ) : archivos.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay archivos adjuntos</p>
                  <p className="text-gray-500 text-sm mt-2">Los archivos aparecerán aquí cuando sean cargados</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full gap-4">
                  {archivos.map((archivo, idx) => {
                    const url = archivo.archivo_url;
                    const fileName = url.split('/').pop() || `archivo-${idx}`;
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                    const isPdf = /\.pdf$/i.test(fileName);
                    return (
                      <div key={archivo.id || idx} className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                        <div className="relative h-[220px] bg-gray-50 flex items-center justify-center">
                          {isImage ? (
                            <Image src={url} alt={fileName} fill className="object-contain" />
                          ) : isPdf ? (
                            <iframe src={url} title={fileName} className="w-full" style={{ height: '200px' }} />
                          ) : (
                            <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-blue-900 font-medium text-sm">{fileName}</p>
                                <p className="text-xs text-gray-600 mt-1">Tipo: Archivo adjunto</p>
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
                  })}
                </div>
              )}
            </div>
            {/* Comprobante de Pago */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileCheck className="w-5 h-5 text-blue-500" />Comprobante de Pago</h3>
              {loadingComprobantes ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando comprobante...</p>
                </div>
              ) : comprobantes.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No hay comprobante disponible</p>
                  <p className="text-gray-500 text-sm mt-2">El comprobante aparecerá aquí cuando sea cargado</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full">
                  {(() => {
                    const comprobante = comprobantes[0];
                    if (!comprobante) return null;
                    const url = comprobante.ruta_archivo;
                    const fileName = url.split('/').pop() || 'comprobante';
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                    const isPdf = /\.pdf$/i.test(fileName);
                    return (
                      <div className="w-full flex justify-center">
                        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                          <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                            {isImage ? (
                              <Image
                                src={url}
                                alt={fileName}
                                fill
                                className="object-contain"
                                onError={() => console.log('Error cargando imagen')}
                              />
                            ) : isPdf ? (
                              <iframe
                                src={url}
                                title={fileName}
                                className="w-full"
                                style={{ height: '200px' }}
                              />
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                                <FileCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-blue-900 font-medium text-sm">
                                    {fileName}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Tipo: Comprobante
                                  </p>
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
};