import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, CreditCard } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { PlantillaTukashModalProps, LoadingStateTukash, ErrorStateTukash } from '@/types/plantillaTukash';
import { SolicitudTukashData } from '@/types/plantillaTukash';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import { Comprobante } from '@/types';

interface SolicitudTukashExtended extends SolicitudTukashData {
  folio?: string;
  tiene_archivos?: boolean | number;
  id_aprobador?: number;
  fecha_aprobacion?: string;
  comentarios_aprobacion?: string;
  banco_destino?: string;
  cuenta_destino?: string;
  tipo_cuenta_destino?: string;
  ruta_archivo?: string; // <-- Agregado para comprobante
  soporte_url?: string; // <-- Agregado para comprobante desde soporte_url
}

const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(numAmount);
};

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

const buildFileUrl = (rutaArchivo: string): string => {
  const baseUrl = 'https://bechapra.com.mx';
  if (rutaArchivo.startsWith('http')) return rutaArchivo;
  return rutaArchivo.startsWith('/') ? `${baseUrl}${rutaArchivo}` : `${baseUrl}/${rutaArchivo}`;
};

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

const InfoField: React.FC<{
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'currency' | 'mono' | 'date';
  className?: string;
  icon?: React.ReactNode;
}> = ({ label, value, variant = 'default', className = '', icon }) => {
  const formatValue = () => {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }
    switch (variant) {
      case 'currency':
        return formatCurrency(value);
      case 'date':
        return formatDate(value?.toString() || '');
      case 'mono':
        return value?.toString();
      default:
        return value?.toString();
    }
  };
  let baseClass = "text-slate-800 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md";
  if (variant === 'mono') baseClass += " font-mono text-sm";
  if (variant === 'currency') baseClass += " font-bold text-emerald-600";
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        {icon}
        {label}
      </label>
      <div className={baseClass}>{formatValue()}</div>
    </div>
  );
};

const FilePreview: React.FC<{ archivo: SolicitudArchivo }> = ({ archivo }) => {
  const [imageError, setImageError] = useState(false);
  if (!archivo.archivo_url) {
    return (
      <div className="text-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Archivo no disponible</p>
      </div>
    );
  }
  const fileUrl = buildFileUrl(archivo.archivo_url);
  const extension = archivo.archivo_url?.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  const isPdf = extension === 'pdf';
  const getFileName = () => {
    const urlParts = archivo.archivo_url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName || `Archivo ${archivo.id}`;
  };
  if (isPdf) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="w-full rounded-t-2xl border-b border-slate-200 overflow-hidden bg-white">
          <iframe src={fileUrl} title={getFileName()} className="w-full border-0" style={{ height: '220px' }} />
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-xs text-center text-blue-700 font-medium border-t border-blue-100">
            Vista previa limitada &bull; Haga clic en &quot;Ver completo&quot; para el PDF completo
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{getFileName()}</p>
              <p className="text-xs text-slate-500 mt-1">Documento PDF</p>
            </div>
          </div>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <ExternalLink className="w-4 h-4" />Ver completo
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-200">
        {isImage && !imageError ? (
          <Image src={fileUrl} alt="Preview del archivo" width={180} height={180} className="object-contain max-h-full max-w-full rounded-lg shadow-sm" onError={() => setImageError(true)} />
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 font-semibold">{isPdf ? 'PDF' : isImage ? 'Imagen' : 'Archivo'}</p>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{getFileName()}</p>
            <p className="text-xs text-slate-500 mt-1">{archivo.tipo || 'Archivo'}</p>
          </div>
        </div>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <ExternalLink className="w-4 h-4" />Ver completo
        </a>
      </div>
    </div>
  );
};

const obtenerArchivosSolicitud = async (idSolicitud: number): Promise<SolicitudArchivo[]> => {
  try {
    const archivos = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
    return archivos || [];
  } catch (error) {
    throw error;
  }
};

export function PlantillaTukashDetailModal({ solicitud, isOpen, onClose }: PlantillaTukashModalProps) {
  console.log('🚀 TUKASH MODAL - Componente renderizado. isOpen:', isOpen, 'solicitud ID:', solicitud?.id_solicitud);
  
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loading, setLoading] = useState<LoadingStateTukash>({ archivos: false, general: false });
  const [errors, setErrors] = useState<ErrorStateTukash>({ archivos: null, general: null });
  const { handleError } = useErrorHandler();
  const solicitudExtended = solicitud as SolicitudTukashExtended;
  // Estados para comprobantes (igual que en SolicitudDetailModal)
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);

  // Función para obtener comprobantes (usando la misma lógica que funciona en subir-comprobante)
  const fetchComprobantes = useCallback(async () => {
    if (!solicitud) return;
    console.log('🔍 TUKASH COMPROBANTES - Iniciando fetchComprobantes para solicitud:', solicitud.id_solicitud);
    console.log('🔍 TUKASH COMPROBANTES - solicitudExtended completo:', solicitudExtended);
    console.log('🔍 TUKASH COMPROBANTES - soporte_url específico:', solicitudExtended.soporte_url);
    console.log('🔍 TUKASH COMPROBANTES - tipo de soporte_url:', typeof solicitudExtended.soporte_url);
    
    // Debug detallado de las condiciones
    console.log('🔍 TUKASH COMPROBANTES - Verificando condiciones:');
    console.log('  - Existe soporte_url?', !!solicitudExtended.soporte_url);
    console.log('  - No es "NO TIENE"?', solicitudExtended.soporte_url !== 'NO TIENE');
    console.log('  - No está vacío?', solicitudExtended.soporte_url && solicitudExtended.soporte_url.trim() !== '');
    setLoading(prev => ({ ...prev, archivos: true })); // Reutilizamos el loading de archivos
    setErrors(prev => ({ ...prev, archivos: null }));
    
    try {
      const token = localStorage.getItem('auth_token');
      
      // Primero verificar si la solicitud tiene soporte_url válido (nuevo sistema)
      // Solo crear comprobante si soporte_url existe Y no es "NO TIENE"
      if (solicitudExtended.soporte_url && 
          solicitudExtended.soporte_url !== 'NO TIENE' && 
          solicitudExtended.soporte_url.trim() !== '') {
        console.log('✅ TUKASH COMPROBANTES - Encontrado soporte_url válido:', solicitudExtended.soporte_url);
        const comprobanteFromSoporte = {
          id_comprobante: 999999, // ID ficticio para soporte_url
          id_solicitud: solicitud.id_solicitud || 0,
          ruta_archivo: solicitudExtended.soporte_url,
          nombre_archivo: 'Comprobante de Pago',
          fecha_subida: solicitud.fecha_actualizacion || new Date().toISOString(),
          usuario_subio: 0,
          comentario: 'Comprobante desde soporte_url',
          nombre_usuario: 'Sistema'
        };
        setComprobantes([comprobanteFromSoporte]);
        return;
      } else {
        console.log('❌ TUKASH COMPROBANTES - No se creará comprobante desde soporte_url porque:');
        if (!solicitudExtended.soporte_url) {
          console.log('  - No existe soporte_url');
        } else if (solicitudExtended.soporte_url === 'NO TIENE') {
          console.log('  - soporte_url es "NO TIENE"');
        } else if (solicitudExtended.soporte_url.trim() === '') {
          console.log('  - soporte_url está vacío');
        }
      }
      
      // Si no tiene soporte_url válido, buscar en la tabla comprobantes (sistema viejo)
      console.log('⚠️ TUKASH COMPROBANTES - No se encontró soporte_url, buscando en tabla comprobantes_pago');
      if (token) {
        const { ComprobantesService } = await import('@/services/comprobantes.service');
        const comprobantes = await ComprobantesService.getBySolicitud(solicitud.id_solicitud || 0, token);
        console.log('✅ TUKASH COMPROBANTES - Comprobantes de tabla:', comprobantes);
        if (comprobantes && comprobantes.length > 0) {
          setComprobantes(comprobantes);
        } else {
          setComprobantes([]);
        }
      } else {
        console.log('❌ TUKASH COMPROBANTES - No hay token');
        setComprobantes([]);
      }
    } catch (error) {
      console.error('❌ TUKASH COMPROBANTES - Error:', error);
      const errorMessage = handleError(error);
      setErrors(prev => ({ ...prev, archivos: errorMessage }));
      setComprobantes([]);
    } finally {
      setLoading(prev => ({ ...prev, archivos: false }));
    }
  }, [solicitud, handleError]);

  // useEffect para cargar comprobantes cuando el modal se abre
  useEffect(() => {
    if (isOpen && solicitud) {
      fetchComprobantes(); // Cargar comprobantes sin restricción de estado
    }
  }, [isOpen, solicitud, fetchComprobantes]);
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
      setComprobantes([]);
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
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        <button onClick={onClose} className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Cerrar modal">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col lg:flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PLANTILLA TARJETAS TUKASH</span>
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Asunto" value={solicitud.asunto} icon={<FileText className="w-4 h-4 text-blue-500" />} />
                <InfoField label="Cliente" value={solicitud.cliente} icon={<CreditCard className="w-4 h-4 text-emerald-600" />} />
                <InfoField label="Beneficiario de Tarjeta" value={solicitud.beneficiario_tarjeta} icon={<CreditCard className="w-4 h-4 text-blue-700" />} />
                <InfoField label="Número de Tarjeta" value={solicitud.numero_tarjeta} variant="mono" icon={<CreditCard className="w-4 h-4 text-indigo-600" />} />
                <InfoField label="Monto Total Cliente" value={solicitud.monto_total_cliente} variant="currency" icon={<DollarSign className="w-4 h-4 text-emerald-600" />} />
                <InfoField label="Monto Total TUKASH" value={solicitud.monto_total_tukash} variant="currency" icon={<DollarSign className="w-4 h-4 text-blue-600" />} />
                {/* <InfoField label="Fecha Límite" value={solicitud.fecha_limite} variant="date" /> */}
              </div>
            </div>
            {/* Información Bancaria removida por solicitud del usuario */}
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información de Auditoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Fecha de Creación" value={solicitud.fecha_creacion} variant="date" />
                <InfoField label="Fecha de Actualización" value={solicitud.fecha_actualizacion} variant="date" />
                <InfoField label="Usuario de Creación" value={solicitud.usuario_creacion} />
                <InfoField label="Usuario de Actualización" value={solicitud.usuario_actualizacion} />
              </div>
            </div>
            {/* Comprobantes de Pago - debajo de Auditoría */}
            <div className="mb-6 w-full">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Comprobantes de Pago
              </h3>
              
              {loading.archivos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando comprobantes...</p>
                </div>
              ) : errors.archivos ? (
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
              ) : comprobantes.length === 0 ? (
                // Si no hay comprobantes en la tabla pero hay soporte_url, mostrar ese archivo
                (solicitudExtended as SolicitudTukashExtended).soporte_url ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center bg-white/80 px-3 py-1.5 rounded-md w-fit">
                            <span className="text-xs text-blue-800 font-semibold">
                              Comprobante de Pago
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(buildFileUrl((solicitudExtended as SolicitudTukashExtended).soporte_url!), '_blank')}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 ml-3 text-sm"
                        >
                          Ver completo
                        </button>
                      </div>
                      
                      <div className="relative h-36 bg-gray-50 flex items-center justify-center rounded-lg overflow-hidden">
                        <img
                          src={buildFileUrl((solicitudExtended as SolicitudTukashExtended).soporte_url!)}
                          alt="Comprobante de pago"
                          className="object-contain w-full h-full"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl p-8 border border-blue-200/30 shadow-sm text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Comprobantes Pendientes</h4>
                    <p className="text-sm text-blue-700 leading-relaxed max-w-md mx-auto">
                      El comprobante de pago aparecerá aquí una vez que la solicitud sea marcada como pagada
                    </p>
                    <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100/50 rounded-lg border border-blue-200/50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                      <span className="text-xs font-medium text-blue-800">Estado: Esperando comprobantes</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {comprobantes.map((comprobante) => {
                    const comprobanteUrl = buildFileUrl(comprobante.ruta_archivo);
                    const fileName = comprobante.nombre_archivo || comprobanteUrl.split('/').pop() || '';
                    
                    return (
                      <div key={comprobante.id_comprobante} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
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
                          <button
                            onClick={() => window.open(comprobanteUrl, '_blank')}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 ml-3 text-sm"
                            disabled={!comprobanteUrl}
                          >
                            Ver completo
                          </button>
                        </div>
                        
                        <div className="relative h-36 bg-gray-50 flex items-center justify-center rounded-lg overflow-hidden">
                          <img
                            src={comprobanteUrl}
                            alt={`Comprobante de ${comprobante.nombre_usuario || 'usuario'}: ${fileName}`}
                            className="object-contain w-full h-full"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Aquí podrías agregar comprobantes si aplica para TUKASH */}
          </div>
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