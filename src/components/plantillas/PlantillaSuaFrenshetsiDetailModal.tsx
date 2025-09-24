'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { X, FileText, ExternalLink, Factory } from 'lucide-react';
import { PlantillaSuaFrenshetsiModalProps, LoadingStateSuaFrenshetsi, ErrorStateSuaFrenshetsi } from '@/types/plantillaSuaFrenshetsi';
import { SolicitudSuaFrenshetsiData } from '@/types/plantillaSuaFrenshetsi';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

// Tipo extendido para solicitudes SUA FRENSHETSI que incluye campos adicionales
interface SolicitudSuaFrenshetsiExtended extends SolicitudSuaFrenshetsiData {
  archivos?: SolicitudArchivo[];
}

// Función auxiliar para construir URLs de archivos
function buildFileUrl(path: string): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/${cleanPath}`;
}

// Componente para mostrar información en formato clave-valor
const InfoField: React.FC<{ label: string; value: string | number; className?: string }> = ({ 
  label, 
  value, 
  className = "" 
}) => (
  <div className={`space-y-1 ${className}`}>
    <dt className="text-sm font-medium text-indigo-600">{label}</dt>
    <dd className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
      {value || 'No especificado'}
    </dd>
  </div>
);

// Componente para preview de archivos
const FilePreview: React.FC<{ archivo: SolicitudArchivo }> = ({ archivo }) => {
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  console.log('🖼️ [SUA FRENSHETSI ARCHIVOS] Renderizando preview para archivo ID:', archivo.id);
  
  if (!archivo.archivo_url) {
    console.log('⚠️ [SUA FRENSHETSI ARCHIVOS] No hay URL de archivo');
    return (
      <div className="text-center p-3 bg-gray-50 rounded border">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No disponible</p>
      </div>
    );
  }

  const fileUrl = buildFileUrl(archivo.archivo_url);
  console.log('🔗 [SUA FRENSHETSI ARCHIVOS] URL construida:', fileUrl);

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
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        {/* PDF Preview */}
        <div className="relative">
          {!showPdfViewer ? (
            // Vista previa limitada
            <div className="h-40 bg-gray-50 border-b">
              <iframe
                src={`${fileUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0&page=1`}
                className="w-full h-full"
                style={{ pointerEvents: 'none' }}
                title="Vista previa PDF"
              />
              <div className="absolute inset-0 bg-black bg-opacity-10 flex items-end justify-center pb-2">
                <div className="bg-white bg-opacity-90 px-3 py-1 rounded text-xs text-gray-600">
                  Vista previa limitada - Haga clic en &quot;Ver completo&quot; para el PDF completo
                </div>
              </div>
            </div>
          ) : (
            // Viewer completo
            <div className="h-96">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
          )}
        </div>
        
        {/* File info and actions */}
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 truncate mb-2">
            {getFileName()}
          </p>
          <p className="text-xs text-gray-500 mb-3">Documento PDF</p>
          
          <button
            onClick={() => setShowPdfViewer(!showPdfViewer)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {showPdfViewer ? 'Vista previa' : 'Ver completo'}
          </button>
        </div>
      </div>
    );
  }

  // Para otros tipos de archivo (imágenes, etc.)
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Preview area */}
      <div className="relative h-32 bg-gray-50 flex items-center justify-center">
        {isImage ? (
          <Image
            src={fileUrl}
            alt="Preview del archivo"
            width={120}
            height={120}
            className="object-contain max-h-full max-w-full rounded"
            onError={(e) => {
              console.error('❌ [SUA FRENSHETSI ARCHIVOS] Error cargando imagen:', fileUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-xs text-gray-600 font-medium">Archivo</p>
          </div>
        )}
      </div>
      
      {/* File info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate mb-1">
          {getFileName()}
        </p>
        <p className="text-xs text-gray-500">
          {archivo.tipo || 'Archivo'}
        </p>
        
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Ver completo
        </a>
      </div>
    </div>
  );
};

// Componente principal del modal
export const PlantillaSuaFrenshetsiDetailModal: React.FC<PlantillaSuaFrenshetsiModalProps> = ({
  solicitud,
  isOpen,
  onClose
  // Removemos loadingState y errorState ya que manejamos el loading internamente
}) => {
  const [solicitudConArchivos, setSolicitudConArchivos] = useState<SolicitudSuaFrenshetsiExtended | null>(null);
  const [loading, setLoading] = useState<LoadingStateSuaFrenshetsi>({
    archivos: false
  });
  const [error, setError] = useState<ErrorStateSuaFrenshetsi>({
    general: null,
    archivos: null
  });

  console.log('🚀 [SUA FRENSHETSI MODAL] Modal abierto, solicitud:', solicitud);

  // Función para cargar archivos
  const cargarArchivos = useCallback(async (idSolicitud: number) => {
    console.log('📁 [SUA FRENSHETSI MODAL] Cargando archivos para solicitud:', idSolicitud);
    
    setLoading({ archivos: true });
    setError({ general: null, archivos: null });

    try {
      const archivos = await SolicitudArchivosService.obtenerArchivos(idSolicitud);
      console.log('✅ [SUA FRENSHETSI MODAL] Archivos cargados:', archivos);
      
      setSolicitudConArchivos({
        ...solicitud,
        archivos: archivos || []
      });
    } catch (err) {
      console.error('❌ [SUA FRENSHETSI MODAL] Error cargando archivos:', err);
      setError({ 
        general: null,
        archivos: 'Error al cargar los archivos adjuntos' 
      });
      setSolicitudConArchivos({
        ...solicitud,
        archivos: []
      });
    } finally {
      setLoading({ archivos: false });
    }
  }, [solicitud]);

  // Efecto para cargar archivos cuando se abre el modal
  useEffect(() => {
    if (isOpen && solicitud && solicitud.id_solicitud) {
      console.log('🔄 [SUA FRENSHETSI MODAL] Modal abierto, cargando datos...');
      cargarArchivos(solicitud.id_solicitud);
    } else if (!isOpen) {
      // Limpiar datos cuando se cierra el modal
      setSolicitudConArchivos(null);
      setError({
        general: null,
        archivos: null
      });
    }
  }, [isOpen, solicitud, cargarArchivos]);

  // Función para formatear fechas
  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'No especificada';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  };

  // Función para formatear moneda
  const formatearMoneda = (monto: number) => {
    if (!monto) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  if (!isOpen || !solicitud) return null;

  const solicitudFinal = solicitudConArchivos || solicitud;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Factory className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">PAGO SUA FRENSHETSI</h2>
              <p className="text-indigo-100 text-sm">
                Solicitud #{solicitud.id_solicitud}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-100 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            
            {/* Información General */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-indigo-100">
                Información General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField 
                  label="Asunto" 
                  value={solicitudFinal.asunto} 
                  className="md:col-span-2"
                />
                <InfoField 
                  label="Se paga por" 
                  value={solicitudFinal.empresa} 
                />
                <InfoField 
                  label="Cliente" 
                  value={solicitudFinal.cliente} 
                />
                <InfoField 
                  label="Monto Total" 
                  value={formatearMoneda(solicitudFinal.monto)} 
                />
                <InfoField 
                  label="Fecha Límite" 
                  value={formatearFecha(solicitudFinal.fecha_limite)} 
                />
              </div>
            </section>

            {/* Línea de Captura */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-indigo-100">
                Línea de Captura IMSS
              </h3>
              <InfoField 
                label="Línea de Captura" 
                value={solicitudFinal.linea_captura}
                className="font-mono bg-indigo-50"
              />
            </section>

            {/* Archivos Adjuntos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-indigo-100">
                Archivos Adjuntos
              </h3>
              
              {loading.archivos && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando archivos...</p>
                </div>
              )}

              {error.archivos && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600">{error.archivos}</p>
                </div>
              )}

              {!loading.archivos && !error.archivos && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(solicitudFinal as SolicitudSuaFrenshetsiExtended).archivos && (solicitudFinal as SolicitudSuaFrenshetsiExtended).archivos!.length > 0 ? (
                    (solicitudFinal as SolicitudSuaFrenshetsiExtended).archivos!.map((archivo: SolicitudArchivo) => (
                      <FilePreview key={archivo.id} archivo={archivo} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No hay archivos adjuntos disponibles</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Información de Auditoría */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-indigo-100">
                Información de Auditoría
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField 
                  label="Estado" 
                  value={solicitudFinal.estado?.toUpperCase()} 
                />
                <InfoField 
                  label="Usuario Creación" 
                  value={solicitudFinal.usuario_creacion} 
                />
                <InfoField 
                  label="Fecha Creación" 
                  value={formatearFecha(solicitudFinal.fecha_creacion)} 
                />
                <InfoField 
                  label="Fecha Actualización" 
                  value={formatearFecha(solicitudFinal.fecha_actualizacion)} 
                />
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantillaSuaFrenshetsiDetailModal;