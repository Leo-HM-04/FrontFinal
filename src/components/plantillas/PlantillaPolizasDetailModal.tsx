import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, Calendar, DollarSign, Building2, User, FileText, Eye } from 'lucide-react';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

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

  // Cuando se cargan archivos, selecciona el primero para previsualizar
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
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-lg">
      <div className="text-blue-600">{icon}</div>
      <div>
        <p className="text-sm text-blue-600 font-medium">{label}</p>
        <p className="text-blue-900 font-semibold">{value}</p>
      </div>
    </div>
  );

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
          className="w-full h-full min-h-[400px] rounded-xl border border-blue-200 bg-white"
        />
      );
    }
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      return (
        <img
          src={url}
          alt="Previsualización"
          className="w-full h-full object-contain rounded-xl border border-blue-200 bg-white"
        />
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">
        {/* Panel Izquierdo: Información */}
        <div className="w-full md:w-[55%] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 rounded-t-2xl md:rounded-tr-none border-b border-blue-200 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{titulo}</h2>
                  <p className="text-blue-100 text-sm">Folio: {solicitud.folio}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Información Principal de la Póliza */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Información de la Póliza</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  icon={<FileText className="w-4 h-4" />}
                  label="Asunto"
                  value={solicitud.asunto || 'No especificado'}
                />
                <InfoField
                  icon={<Building2 className="w-4 h-4" />}
                  label="Aseguradora"
                  value={getTitularLabel(solicitud.titular_poliza) || 'No especificada'}
                />
                <InfoField
                  icon={<Shield className="w-4 h-4" />}
                  label="Número de Póliza"
                  value={solicitud.numero_poliza || 'No especificado'}
                />
                <InfoField
                  icon={<Calendar className="w-4 h-4" />}
                  label="Tipo de Movimiento"
                  value={solicitud.tipo_movimiento || 'No especificado'}
                />
              </div>
            </div>

            {/* Información del Solicitante */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Información del Solicitante</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  icon={<User className="w-4 h-4" />}
                  label="Nombre"
                  value={solicitud.nombre_solicitante || 'No especificado'}
                />
                <InfoField
                  icon={<Building2 className="w-4 h-4" />}
                  label="Gerencia"
                  value={solicitud.gerencia_solicitante || 'No especificada'}
                />
                <InfoField
                  icon={<FileText className="w-4 h-4" />}
                  label="Email"
                  value={solicitud.email_solicitante || 'No especificado'}
                />
                <InfoField
                  icon={<Building2 className="w-4 h-4" />}
                  label="Departamento"
                  value={solicitud.departamento || 'No especificado'}
                />
              </div>
            </div>

            {/* Resumen Total */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 mr-3 text-blue-100" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-100">Monto Total</h3>
                    <p className="text-sm text-blue-200">Importe de la póliza</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white text-xl font-bold">{formatCurrency(solicitud.monto)}</span>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center mb-4">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Información Adicional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  icon={<FileText className="w-4 h-4" />}
                  label="Concepto"
                  value={solicitud.concepto || 'No especificado'}
                />
                <InfoField
                  icon={<Calendar className="w-4 h-4" />}
                  label="Fecha de Creación"
                  value={formatDate(solicitud.fecha_creacion)}
                />
                {solicitud.observaciones && (
                  <div className="md:col-span-2">
                    <InfoField
                      icon={<FileText className="w-4 h-4" />}
                      label="Observaciones"
                      value={solicitud.observaciones}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Archivos Adjuntos */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-800">Archivos Adjuntos</h3>
                </div>
                {loadingArchivos && (
                  <div className="text-blue-600 text-sm">Cargando...</div>
                )}
              </div>
              {archivos.length > 0 ? (
                <div className="space-y-2">
                  {archivos.map((archivo, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:shadow-sm transition-shadow cursor-pointer ${archivoPreview?.archivo_url === archivo.archivo_url ? 'ring-2 ring-blue-400' : ''}`}
                      onClick={() => setArchivoPreview(archivo)}
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-blue-900">{archivo.archivo_url.split('/').pop() || 'Archivo'}</p>
                          <p className="text-sm text-blue-600">{archivo.tipo}</p>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); window.open(archivo.archivo_url, '_blank'); }}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-sm">Ver</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-600 text-center py-4">No hay archivos adjuntos</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl md:rounded-bl-none border-t border-gray-200 z-10">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        {/* Panel Derecho: Previsualización */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex flex-col items-center justify-center min-h-[400px] max-h-[90vh] overflow-y-auto rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl border-l border-blue-100">
          <div className="w-full h-[350px] md:h-[500px] flex items-center justify-center">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
};