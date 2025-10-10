import React, { useState, useEffect, useCallback } from 'react';
import { X, Banknote, DollarSign, User, Calendar, FileText, ExternalLink, FileCheck, Users } from 'lucide-react';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';

// Tipos específicos para la plantilla de Regresos en Efectivo
export interface SolicitudEfectivoData {
  id_solicitud: number;
  asunto: string;
  cliente: string;
  persona_recibe: string;
  fecha_entrega: string;
  monto_efectivo: string | number;
  viaticos: string | number;
  elementos_adicionales?: string;
  archivos_adjuntos?: Array<{name?: string; size?: number}>;
  // Campos de auditoría y estado  
  folio: string;
  departamento: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  concepto: string;
  observaciones?: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  usuario_creacion: string;
  usuario_actualizacion?: string;
  soporte_url?: string; // <-- Agregado para comprobante desde soporte_url
}

interface PlantillaEfectivoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: SolicitudEfectivoData;
  titulo?: string;
}

export const PlantillaEfectivoDetailModal: React.FC<PlantillaEfectivoDetailModalProps> = ({
  isOpen,
  onClose,
  solicitud,
  titulo = "REGRESOS - EFECTIVO"
}) => {
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState<SolicitudArchivo | null>(null);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<Comprobante | null>(null);

  // Cargar comprobantes si la solicitud está pagada
  const fetchComprobantes = useCallback(async () => {
    if (!solicitud) return;
    console.log('🔍 EFECTIVO COMPROBANTES - Iniciando fetchComprobantes para solicitud:', solicitud.id_solicitud);
    console.log('🔍 EFECTIVO COMPROBANTES - solicitud completa:', solicitud);
    console.log('🔍 EFECTIVO COMPROBANTES - soporte_url específico:', solicitud.soporte_url);
    console.log('🔍 EFECTIVO COMPROBANTES - tipo de soporte_url:', typeof solicitud.soporte_url);
    setLoadingComprobantes(true);
    setErrorComprobantes(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Primero verificar si la solicitud tiene soporte_url (nuevo sistema)
      if (solicitud.soporte_url) {
        console.log('✅ EFECTIVO COMPROBANTES - Encontrado soporte_url:', solicitud.soporte_url);
        const comprobanteFromSoporte = {
          id_comprobante: 999999, // ID ficticio para soporte_url
          id_solicitud: solicitud.id_solicitud,
          ruta_archivo: solicitud.soporte_url,
          nombre_archivo: 'Comprobante de Pago',
          fecha_subida: solicitud.fecha_actualizacion || new Date().toISOString(),
          usuario_subio: 0,
          comentario: 'Comprobante desde soporte_url',
          nombre_usuario: 'Sistema'
        };
        setComprobantes([comprobanteFromSoporte]);
        return;
      }
      
      // Si no tiene soporte_url, buscar en la tabla comprobantes (sistema viejo)
      console.log('⚠️ EFECTIVO COMPROBANTES - No se encontró soporte_url, buscando en tabla comprobantes_pago');
      if (token) {
        const { ComprobantesService } = await import('@/services/comprobantes.service');
        const comprobantes = await ComprobantesService.getBySolicitud(solicitud.id_solicitud, token);
        console.log('✅ EFECTIVO COMPROBANTES - Comprobantes de tabla:', comprobantes);
        if (comprobantes && comprobantes.length > 0) {
          setComprobantes(comprobantes);
        } else {
          setComprobantes([]);
        }
      } else {
        console.log('❌ EFECTIVO COMPROBANTES - No hay token');
        setComprobantes([]);
      }
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Mexico_City'
      });
    } catch {
      return dateString;
    }
  };

  const calcularMontoTotal = (): number => {
    const efectivo = typeof solicitud.monto_efectivo === 'string' ? parseFloat(solicitud.monto_efectivo) : solicitud.monto_efectivo;
    const viaticos = typeof solicitud.viaticos === 'string' ? parseFloat(solicitud.viaticos) : solicitud.viaticos;
    return (efectivo || 0) + (viaticos || 0);
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

  // Renderiza la previsualización del archivo seleccionado
  const renderPreview = () => {
    const previewItem = comprobantePreview || archivoPreview;
    if (!previewItem) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-blue-400">
          <FileText className="w-16 h-16 mb-4" />
          <span className="text-lg">Selecciona un archivo para previsualizar</span>
        </div>
      );
    }

    const url = 'archivo_url' in previewItem ? previewItem.archivo_url : previewItem.ruta_archivo;
    const fileName = 'archivo_url' in previewItem ? 
      url.split('/').pop() || 'archivo' : 
      previewItem.nombre_archivo || url.split('/').pop() || 'comprobante';

    if (url.match(/\.(pdf)$/i)) {
      return (
        <iframe
          src={url}
          title={`Previsualización de ${fileName}`}
          className="w-full h-64 md:h-96 rounded-xl border border-blue-200 bg-white"
        />
      );
    }
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return (
        <div className="relative w-full h-64 md:h-96 rounded-xl border border-blue-200 bg-white overflow-hidden">
          <Image src={url} alt={`Previsualización de ${fileName}`} fill className="object-contain" />
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
      ></div>
      {/* Modal container: vertical layout */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: información principal */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <Banknote className="w-8 h-8 text-white" />
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
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Información Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} icon={<FileText className="w-4 h-4" />} className="md:col-span-2" />
                <InfoField label="Cliente" value={solicitud.cliente} icon={<Users className="w-4 h-4" />} />
                <InfoField label="Persona que Recibe" value={solicitud.persona_recibe} icon={<User className="w-4 h-4" />} />
                <InfoField label="Fecha de Entrega" value={formatDate(solicitud.fecha_entrega)} icon={<Calendar className="w-4 h-4" />} />
              </div>
            </div>

            {/* Desglose de Montos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Desglose de Montos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monto en Efectivo */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900 text-sm">Monto en Efectivo</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(solicitud.monto_efectivo)}</p>
                </div>

                {/* Viáticos */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900 text-sm">Viáticos</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(solicitud.viaticos)}</p>
                </div>
              </div>
            </div>

            {/* Monto Total */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200">Monto Total</h3>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl">
                <div className="flex items-baseline gap-2">
                  <DollarSign className="w-6 h-6 text-yellow-300" />
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(calcularMontoTotal())}
                  </p>
                </div>
                <div className="mt-2 text-sm text-blue-100">
                  Efectivo + Viáticos
                </div>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-20" />
              </div>
            </div>

            {/* Elementos Adicionales */}
            {solicitud.elementos_adicionales && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Elementos Adicionales / Descriptivos
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-900 whitespace-pre-wrap">{solicitud.elementos_adicionales}</p>
                </div>
              </div>
            )}

            {/* Información de Auditoría */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Información de Auditoría
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} />
                {solicitud.fecha_actualizacion && (
                  <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} />
                )}
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                {solicitud.usuario_actualizacion && (
                  <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
                )}
              </div>
            </div>

            {/* Sección de Comprobantes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-500" />
                Comprobantes de Pago
              </h3>
              {loadingComprobantes ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Cargando comprobantes...</p>
                </div>
              ) : comprobantes.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No hay comprobantes disponibles</p>
                  {solicitud.estado !== 'pagada' && (
                    <p className="text-gray-500 text-sm mt-1">Los comprobantes estarán disponibles cuando la solicitud sea pagada</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {comprobantes.map((comprobante, idx) => {
                    const fileName = comprobante.nombre_archivo || comprobante.ruta_archivo.split('/').pop() || `comprobante-${idx}`;
                    return (
                      <div 
                        key={comprobante.id_comprobante || idx} 
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setComprobantePreview(comprobante);
                              setArchivoPreview(null);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                              comprobantePreview?.id_comprobante === comprobante.id_comprobante
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            Previsualizar
                          </button>
                          <button
                            onClick={() => window.open(comprobante.ruta_archivo, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent transition-colors duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Previsualización y archivos adjuntos */}
          <div className="lg:w-[500px] flex-shrink-0">
            {/* Previsualización */}
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                {comprobantePreview ? 'Previsualización de Comprobante' : 'Previsualización de Archivo'}
              </h3>
              <div className="aspect-[4/3] bg-white rounded-lg shadow-inner border border-blue-100">
                {renderPreview()}
              </div>
              {(archivoPreview || comprobantePreview) && (
                <div className="mt-4">
                  <button
                    onClick={() => window.open(
                      comprobantePreview ? comprobantePreview.ruta_archivo : archivoPreview?.archivo_url,
                      '_blank'
                    )}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver archivo completo
                  </button>
                </div>
              )}
            </div>

            {/* Lista de archivos adjuntos */}
            <div className="bg-white rounded-xl border border-blue-100 p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Archivos Adjuntos
              </h3>
              {loadingArchivos ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">Cargando archivos...</p>
                </div>
              ) : archivos.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No hay archivos adjuntos</p>
                  <p className="text-gray-500 text-sm mt-1">Los archivos aparecerán aquí cuando sean cargados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivos.map((archivo, index) => {
                    const fileName = archivo.archivo_url.split('/').pop() || `archivo-${index}`;
                    return (
                      <div
                        key={archivo.id || index}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          archivoPreview?.id === archivo.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-blue-700 truncate">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            onClick={() => {
                              setArchivoPreview(archivo);
                              setComprobantePreview(null);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 ${
                              archivoPreview?.id === archivo.id 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent'
                            }`}
                          >
                            <FileText className="w-4 h-4" />
                            Previsualizar
                          </button>
                          <button
                            onClick={() => window.open(archivo.archivo_url, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent transition-colors duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
