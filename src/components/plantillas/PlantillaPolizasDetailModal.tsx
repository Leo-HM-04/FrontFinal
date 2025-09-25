import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, Calendar, DollarSign, Building2, User, FileText, Eye, ExternalLink } from 'lucide-react';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import Image from 'next/image';

// Tipos específicos para la plantilla de Pólizas
export interface SolicitudPolizasData {
  id_solicitud: number;
  asunto: string;
  titular_poliza: string; // aseguradora
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
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      {/* Modal container */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-4xl xl:max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-30 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>
        {/* Contenedor con scroll */}
        <div className="overflow-y-auto max-h-[98vh] sm:max-h-[95vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-12 sm:translate-x-12 lg:-translate-y-16 lg:translate-x-16" />
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6 sm:translate-y-8 sm:-translate-x-8 lg:translate-y-12 lg:-translate-x-12" />
            <div className="relative z-10 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="w-7 h-7 text-white mr-2" />
                  {titulo}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-1 sm:space-y-0">
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                    Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md text-xs sm:text-sm">{solicitud.folio || '-'}</span>
                  </p>
                  <time className="text-blue-200 text-sm sm:text-base">
                    Creada el {formatDate(solicitud.fecha_creacion)}
                  </time>
                </div>
              </div>
              <div className="flex justify-start sm:justify-end">
                <span className={`inline-flex px-3 py-2 sm:px-4 text-sm sm:text-base lg:text-lg font-bold rounded-lg sm:rounded-xl border-2 border-blue-200 backdrop-blur-sm text-white bg-blue-700/40`}> 
                  {solicitud.estado?.toUpperCase() || 'PENDIENTE'}
                </span>
              </div>
            </div>
          </header>
          {/* Contenido principal */}
          <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Resumen ejecutivo */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl rounded-xl sm:rounded-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-1">
                  <span className="text-xs sm:text-sm uppercase tracking-wider text-blue-100 font-bold block mb-1 sm:mb-2">
                    Monto total
                  </span>
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                      {formatCurrency(solicitud.monto)}
                    </p>
                  </div>
                  <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-16 sm:w-20 lg:w-24" />
                </div>
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <InfoField label="Estado" value={solicitud.estado?.toUpperCase()} className="bg-blue-50/50 border-blue-100" />
                  <InfoField label="Departamento" value={solicitud.departamento} className="bg-blue-50/50 border-blue-100" />
                  <InfoField label="Solicitante" value={solicitud.nombre_solicitante} className="bg-blue-50/50 border-blue-100" />
                  <InfoField label="Aseguradora" value={getTitularLabel(solicitud.titular_poliza)} className="bg-blue-50/50 border-blue-100" />
                </div>
              </div>
            </div>
            {/* Concepto */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-lg rounded-xl sm:rounded-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-3 sm:mb-4 flex items-center">
                <div className="p-2 bg-green-100 rounded-lg sm:rounded-xl mr-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                </div>
                Concepto
              </h2>
              <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-green-100">
                <p className="text-gray-800 leading-relaxed text-sm sm:text-base font-medium">
                  {solicitud.concepto}
                </p>
              </div>
            </div>
            {/* Información de la póliza */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 sm:mb-6 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg sm:rounded-xl mr-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                </div>
                Información de la Póliza
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <InfoField label="Asunto" value={solicitud.asunto} icon={<FileText className="w-4 h-4" />} />
                <InfoField label="Número de Póliza" value={solicitud.numero_poliza} icon={<Shield className="w-4 h-4" />} />
                <InfoField label="Tipo de Movimiento" value={solicitud.tipo_movimiento} icon={<Calendar className="w-4 h-4" />} />
                <InfoField label="Fecha de Creación" value={formatDate(solicitud.fecha_creacion)} icon={<Calendar className="w-4 h-4" />} />
              </div>
              {solicitud.observaciones && (
                <div className="bg-white/80 p-3 rounded border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Observaciones</span>
                  <p className="text-blue-900 font-medium text-sm">{solicitud.observaciones}</p>
                </div>
              )}
            </div>
            {/* Información del solicitante */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 shadow-lg rounded-xl sm:rounded-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg sm:rounded-xl mr-3">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                </div>
                Información del Solicitante
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InfoField label="Nombre" value={solicitud.nombre_solicitante} icon={<User className="w-4 h-4" />} />
                <InfoField label="Gerencia" value={solicitud.gerencia_solicitante} icon={<Building2 className="w-4 h-4" />} />
                <InfoField label="Email" value={solicitud.email_solicitante} icon={<FileText className="w-4 h-4" />} />
                <InfoField label="Departamento" value={solicitud.departamento} icon={<Building2 className="w-4 h-4" />} />
              </div>
            </div>
            {/* Archivos Adjuntos */}
            <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <ExternalLink className="w-6 h-6 text-blue-700" />
                </div>
                Archivos Adjuntos
              </h2>
              <div className="space-y-4">
                {archivos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {archivos.map((archivo, index) => {
                      const url = archivo.archivo_url;
                      const fileName = url.split('/').pop() || '';
                      return (
                        <div key={index} className={`bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm ${archivoPreview?.archivo_url === archivo.archivo_url ? 'ring-2 ring-blue-400' : ''}`}
                          onClick={() => setArchivoPreview(archivo)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-blue-800 font-semibold">
                              {archivo.tipo || 'Archivo'}
                            </span>
                            <button 
                              onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl rounded-xl px-4 py-2 ml-3 transition-all duration-300 text-xs flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" /> Ver completo
                            </button>
                          </div>
                          {/* Previsualización mini */}
                          {(() => {
                            if (url.match(/\.(pdf)$/i)) {
                              return <iframe src={url} title={fileName} className="w-full h-32 rounded border border-blue-200 bg-white" />;
                            }
                            if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                              return <div className="relative w-full h-32 rounded border border-blue-200 bg-white overflow-hidden"><Image src={url} alt={fileName} fill className="object-contain" /></div>;
                            }
                            return <div className="flex items-center gap-2 text-blue-600"><FileText className="w-5 h-5" /> {fileName}</div>;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                    No hay archivos adjuntos disponibles
                  </div>
                )}
                {/* Previsualización grande */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Previsualización
                  </h3>
                  <div className="w-full max-w-2xl mx-auto">
                    {renderPreview()}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};