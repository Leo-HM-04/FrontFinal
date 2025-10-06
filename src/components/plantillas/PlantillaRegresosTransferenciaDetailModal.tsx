import React, { useState, useEffect } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';
import { 
  X, 
  FileText, 
  ExternalLink, 
  Banknote,
  Receipt,
  Calendar,
  CalendarClock,
  User,
  UserPlus,
  UserCog,
  Files,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  Building2,
  CreditCard,
  DollarSign
} from 'lucide-react';

// Ajusta los tipos según tu modelo real de datos
export interface SolicitudRegresosTransferenciaData {
  id_solicitud: number;
  asunto: string;
  beneficiario: string;
  monto: number;
  banco_destino: string;
  numero_cuenta: string;
  estado: string;
  folio?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}

export interface SolicitudArchivo {
  id_archivo: number;
  ruta_archivo: string;
  tipo?: string;
}

interface PlantillaRegresosTransferenciaDetailModalProps {
  solicitud: SolicitudRegresosTransferenciaData;
  isOpen: boolean;
  onClose: () => void;
}

// Utilidades para formato igual que SUA Frenshetsi
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00 MXN';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(numAmount);
};

const formatDate = (dateString?: string): string => {
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

const InfoField: React.FC<{
  label: string;
  value: string | number | null | undefined;
  variant?: 'default' | 'currency' | 'mono' | 'date';
  className?: string;
  icon?: React.ReactNode;
}> = ({ label, value, variant = 'default', className = '', icon }) => {
  let displayValue = value || '-';
  if (variant === 'currency' && value) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      displayValue = formatCurrency(numValue);
    }
  }
  if (variant === 'date' && value) {
    displayValue = formatDate(value.toString());
  }
  return (
    <div className={`bg-slate-50 p-4 rounded-lg border border-slate-200 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          <span className="text-xs uppercase tracking-wider text-slate-600 block mb-1 font-medium">{label}</span>
          <p className={`text-slate-800 font-medium text-sm ${variant === 'mono' ? 'font-mono' : ''}`}>{displayValue}</p>
        </div>
      </div>
    </div>
  );
};

export const PlantillaRegresosTransferenciaDetailModal: React.FC<PlantillaRegresosTransferenciaDetailModalProps> = ({ solicitud, isOpen, onClose }) => {
  // Simulación de archivos adjuntos (ajusta para tu lógica real)
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);

  // Comprobantes de pago
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && solicitud) {
      setLoadingArchivos(true);
      // Simula fetch de archivos
      setTimeout(() => {
        setArchivos([]); // Reemplaza con fetch real
        setLoadingArchivos(false);
      }, 500);

      // Fetch comprobantes
      setLoadingComprobantes(true);
      setErrorComprobantes(null);
      if (solicitud.id_solicitud) {
        SolicitudesService.getComprobantes(solicitud.id_solicitud)
          .then((data) => setComprobantes(data))
          .catch(() => setErrorComprobantes('Error al cargar comprobantes'))
          .finally(() => setLoadingComprobantes(false));
      } else {
        setComprobantes([]);
        setLoadingComprobantes(false);
      }
    } else {
      setComprobantes([]);
      setLoadingComprobantes(false);
      setErrorComprobantes(null);
    }
  }, [isOpen, solicitud]);

  if (!isOpen) return null;

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
          {/* Columna izquierda: info principal, auditoría, comprobantes */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl mb-8 flex items-center gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20"></div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm relative">
                <Banknote className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1 relative">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <span>Regresos y Transferencias</span>
                </h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="inline-flex items-center gap-2 text-blue-100 text-sm bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <FileText className="w-4 h-4" />
                    Solicitud #{solicitud.id_solicitud}
                  </span>
                  {solicitud.folio && (
                    <span className="inline-flex items-center gap-2 text-blue-100 text-sm bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                      <FileText className="w-4 h-4" />
                      Folio: {solicitud.folio}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold bg-white shadow-lg flex items-center gap-2 ${solicitud.estado === 'pagada' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {solicitud.estado === 'pagada' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  {solicitud.estado ? solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1) : 'Pendiente'}
                </span>
              </div>
            </header>
            {/* Información Principal */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Banknote className="w-6 h-6 text-blue-500" />
                Información Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField 
                  label="Asunto" 
                  value={solicitud.asunto}
                  icon={<FileText className="w-5 h-5 text-blue-500" />} 
                />
                <InfoField 
                  label="Beneficiario" 
                  value={solicitud.beneficiario}
                  icon={<User className="w-5 h-5 text-blue-500" />} 
                />
                <InfoField 
                  label="Banco Destino" 
                  value={solicitud.banco_destino}
                  icon={<Building2 className="w-5 h-5 text-blue-500" />} 
                />
                <InfoField 
                  label="Número de Cuenta" 
                  value={solicitud.numero_cuenta} 
                  variant="mono"
                  icon={<CreditCard className="w-5 h-5 text-blue-500" />} 
                />
                <InfoField 
                  label="Monto" 
                  value={solicitud.monto} 
                  variant="currency"
                  icon={<DollarSign className="w-5 h-5 text-emerald-500" />} 
                  className="md:col-span-2"
                />
              </div>
            </div>
            {/* Comprobantes de Pago */}
            <div className="mb-8 w-full">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-blue-500" />
                Comprobante de Pago
              </h3>
              {loadingComprobantes ? (
                <div className="flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3" />
                  <span className="text-slate-600 font-medium">Cargando comprobante...</span>
                </div>
              ) : errorComprobantes ? (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">Error al cargar el comprobante</p>
                  </div>
                  <p className="text-red-600 text-sm">{errorComprobantes}</p>
                </div>
              ) : comprobantes.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">AÚN NO HAY COMPROBANTE</p>
                  <p className="text-slate-500 text-sm mt-2">El comprobante estará disponible cuando la solicitud sea pagada</p>
                </div>
              ) : (
                (() => {
                  const comprobante = comprobantes[0];
                  if (!comprobante) return null;
                  const url = comprobante.ruta_archivo;
                  const fileName = url.split('/').pop() || 'comprobante';
                  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                  const isPdf = /\.pdf$/i.test(fileName);
                  return (
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                      <div className="flex flex-col gap-3 mb-3">
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
                        <div className="w-full flex justify-center">
                          <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-xs lg:max-w-full">
                            <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                              {isImage ? (
                                <Image src={url} alt={fileName} fill className="object-contain" />
                              ) : isPdf ? (
                                <iframe src={url} title={fileName} className="w-full" style={{ height: '200px' }} />
                              ) : (
                                <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                                  <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-blue-900 font-medium text-sm">{fileName}</p>
                                    <p className="text-xs text-gray-600 mt-1">Tipo: Comprobante</p>
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
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
            {/* Información de Auditoría */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
                <History className="w-6 h-6 text-blue-500" />
                Información de Auditoría
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField 
                  label="Fecha de Creación" 
                  value={solicitud.fecha_creacion} 
                  variant="date" 
                  icon={<Calendar className="w-5 h-5 text-blue-500" />}
                />
                <InfoField 
                  label="Fecha de Actualización" 
                  value={solicitud.fecha_actualizacion} 
                  variant="date" 
                  icon={<CalendarClock className="w-5 h-5 text-blue-500" />}
                />
                <InfoField 
                  label="Usuario de Creación" 
                  value={solicitud.usuario_creacion}
                  icon={<UserPlus className="w-5 h-5 text-blue-500" />} 
                />
                <InfoField 
                  label="Usuario de Actualización" 
                  value={solicitud.usuario_actualizacion}
                  icon={<UserCog className="w-5 h-5 text-blue-500" />} 
                />
              </div>
            </div>
          </div>
          {/* Columna derecha: archivos adjuntos */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
                <Files className="w-6 h-6 text-blue-500" />
                Archivos Adjuntos
              </h3>
              {loadingArchivos ? (
                <div className="flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3" />
                  <span className="text-slate-600 font-medium">Cargando archivos...</span>
                </div>
              ) : archivos.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200">
                  <Files className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-semibold">SIN ARCHIVOS ADJUNTOS</p>
                  <p className="text-slate-500 text-sm mt-2">No se han adjuntado archivos a esta solicitud</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {archivos.map((archivo, index) => {
                    const url = archivo.ruta_archivo;
                    const fileName = url.split('/').pop() || 'archivo';
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                    const isPdf = /\.pdf$/i.test(fileName);
                    return (
                      <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="relative h-[420px] bg-slate-50 flex items-center justify-center">
                          {isImage ? (
                            <Image src={url} alt={fileName} fill className="object-contain" />
                          ) : isPdf ? (
                            <iframe src={url} title={fileName} className="w-full h-full" />
                          ) : (
                            <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg border border-slate-200">
                              <FileText className="w-8 h-8 text-blue-500" />
                              <div className="flex-1">
                                <p className="text-slate-800 font-medium text-sm">{fileName}</p>
                                <p className="text-slate-500 text-xs mt-1">Tipo: {archivo.tipo || 'Archivo'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <button
                            onClick={() => window.open(url, '_blank')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Ver completo
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
};
