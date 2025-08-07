

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ExternalLink, DollarSign, Building, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Solicitud, Comprobante } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';
import '@/styles/modal.css';

interface SolicitudDetailModalProps {
solicitud: Solicitud | null;
isOpen: boolean;
onClose: () => void;
showActions?: boolean;
userRole?: string;
}

export function SolicitudDetailModal({ 
solicitud, 
isOpen, 
onClose
}: SolicitudDetailModalProps) {
const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
const [loadingComprobantes, setLoadingComprobantes] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

const fetchComprobantes = useCallback(async () => {
if (!solicitud) return;

try {
setLoadingComprobantes(true);
setError(null);

// Intentamos obtener los comprobantes (el servicio maneja la obtención del token)
const data = await SolicitudesService.getComprobantes(solicitud.id_solicitud);
setComprobantes(data);

console.log(`Comprobantes obtenidos para la solicitud ${solicitud.id_solicitud}:`, data);
} catch (error) {
console.error('Error al obtener comprobantes:', error);

// Mensajes de error personalizados según el tipo de error
const err = error as { 
  response?: { status: number; data?: unknown }; 
  request?: unknown; 
  message?: string 
};

if (err.response) {
  const status = err.response.status;
  
  if (status === 401 || status === 403) {
    setError('No tiene permisos para ver los comprobantes. Solo el pagador o administrador puede acceder a esta información.');
  } else if (status === 404) {
    setError('No se encontraron comprobantes para esta solicitud.');
  } else {
    setError(`Error del servidor (${status}). Intente nuevamente más tarde.`);
  }
} else if (err.request) {
  // La solicitud fue realizada pero no se recibió respuesta
  setError('No se pudo establecer conexión con el servidor. Verifique su conexión a internet.');
} else {
  // Error en la configuración de la solicitud
  setError('No se pudieron cargar los comprobantes de pago. Verifique su conexión e inténtelo de nuevo.');
}
} finally {
setLoadingComprobantes(false);
}
}, [solicitud]);

useEffect(() => {
if (isOpen && solicitud && solicitud.estado === 'pagada') {
fetchComprobantes();
}
}, [isOpen, solicitud, fetchComprobantes]);

if (!isOpen || !solicitud) return null;

const formatCurrency = (amount: number) => {
return new Intl.NumberFormat('es-CO', {
style: 'currency',
currency: 'COP',
minimumFractionDigits: 0
}).format(amount);
};

const getEstadoColor = (estado: string) => {
const colors = {
pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
autorizada: 'bg-green-100 text-green-800 border-green-200',
rechazada: 'bg-red-100 text-red-800 border-red-200'
};
return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Fondo degradado oscuro/transparente mejorado */}
  <div
    className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
    onClick={onClose}
  />
  <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-sm">
    {/* Contenedor con scroll interno */}
    <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
    {/* Botón de cerrar (X) flotante mejorado */}
    <button
      onClick={onClose}
      className="absolute top-6 right-6 z-20 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
      aria-label="Cerrar"
    >
      <X className="w-6 h-6" />
    </button>
    {/* Header mejorado */}
    <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            Solicitud #{solicitud.id_solicitud}
          </h2>
          <p className="text-blue-100 text-lg">
            Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{solicitud.folio || '-'}</span>
          </p>
          <p className="text-blue-200 mt-2">
            Creada el {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 ${getEstadoColor(solicitud.estado)} backdrop-blur-sm`}> 
            {solicitud.estado.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
      <div className="p-8 space-y-8">
        {/* Información Principal con diseño mejorado */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <Card className="xl:col-span-2 p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
              <div className="p-2 bg-blue-100 rounded-xl mr-3">
                <DollarSign className="w-6 h-6 text-blue-700" />
              </div>
              Información Financiera
            </h3>
            
            {/* Monto destacado con mejor diseño */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-blue-300/50 mb-6 shadow-lg">
              <span className="text-sm uppercase tracking-wider text-blue-100 font-bold block mb-2">Monto total</span>
              <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(solicitud.monto)}</p>
              <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
            </div>
          
          {/* Grid principal de información */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-white p-2 rounded-md">
              <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Empresa a pagar</span>
              <p className="text-blue-900 font-medium">{solicitud.empresa_a_pagar || '-'}</p>
            </div>
            
            <div className="bg-white p-2 rounded-md">
              <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Persona que recibe</span>
              <p className="text-blue-900 font-medium">{solicitud.nombre_persona || '-'}</p>
            </div>
          </div>
            
          {/* Información bancaria con bordes suaves */}
          <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80 mb-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Información bancaria</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta</span>
                <p className="font-mono text-blue-900 font-medium">{solicitud.cuenta_destino}</p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Banco</span>
                <p className="text-blue-900 font-medium">{solicitud.banco_destino || '-'}</p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de cuenta</span>
                <p className="text-blue-900 font-medium">
                  {solicitud.tipo_cuenta_destino === 'Tarjeta'
                    ? `Tarjeta${solicitud.tipo_tarjeta ? ' - ' + solicitud.tipo_tarjeta : ''}`
                    : solicitud.tipo_cuenta_destino || '-'}
                </p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Fecha límite</span>
                <p className="text-blue-900 font-medium">{
                  solicitud.fecha_limite_pago
                    ? new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '-'
                }</p>
              </div>
            </div>
          </div>
          
          {/* Descripción del tipo de pago */}
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Descripción del tipo de pago</span>
            <p className="text-blue-900 p-2 bg-white rounded-md">{solicitud.tipo_pago_descripcion || '-'}</p>
          </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <Building className="w-6 h-6 text-indigo-700" />
                </div>
                Información Organizacional
              </h3>
              
              {/* Estado destacado con mejor diseño */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado actual</span>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-3 bg-yellow-400 shadow-lg"></div>
                  <p className="font-black text-2xl text-white tracking-tight">{solicitud.estado.toUpperCase()}</p>
                </div>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-20"></div>
              </div>
          
          {/* Información de departamento y solicitante */}
          <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80 mb-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Equipo y personal</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Departamento</span>
                <p className="text-blue-900 font-medium">{solicitud.departamento ? solicitud.departamento.charAt(0).toUpperCase() + solicitud.departamento.slice(1) : '-'}</p>
              </div>
              
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Solicitante</span>
                <p className="text-blue-900 font-medium">{solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}</p>
              </div>
              
              {solicitud.aprobador_nombre && (
                <div className="col-span-2">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Aprobado por</span>
                  <p className="text-blue-900 font-medium">{solicitud.aprobador_nombre}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="bg-white rounded-md p-3">
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-700 text-xs font-bold">{solicitud.id_solicitud}</span>
              </div>
              <div>
                <p className="text-xs text-blue-700/70">ID de Solicitud</p>
                <p className="text-sm font-medium text-blue-900">#{solicitud.id_solicitud}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-700 text-xs">
                  {new Date(solicitud.fecha_creacion).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit'}).replace('/', '/')}
                </span>
              </div>
              <div>
                <p className="text-xs text-blue-700/70">Fecha de creación</p>
                <p className="text-sm font-medium text-blue-900">{new Date(solicitud.fecha_creacion).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
          {/* Concepto y Documentos con diseño mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Concepto - 1 columna */}
            <Card className="p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <FileText className="w-6 h-6 text-green-700" />
                </div>
                Concepto
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 shadow-inner">
                <p className="text-gray-800 leading-relaxed text-base font-medium">{solicitud.concepto}</p>
              </div>
            </Card>
            
            {/* Documentos - 2 columnas */}
            <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <ExternalLink className="w-6 h-6 text-purple-700" />
                </div>
                Documentos Adjuntos
              </h3>
          <div className="space-y-4">
            {/* Previsualización de factura */}
            {solicitud.factura_url ? (() => {
              // Garantizar que la URL tenga el formato correcto con la barra diagonal
              let facturaUrl = '';
              if (solicitud.factura_url.startsWith('http')) {
                facturaUrl = solicitud.factura_url;
              } else {
                const baseUrl = 'http://localhost:4000';
                const rutaArchivo = solicitud.factura_url.startsWith('/') 
                  ? solicitud.factura_url 
                  : `/${solicitud.factura_url}`;
                facturaUrl = `${baseUrl}${rutaArchivo}`;
              }
              const fileName = facturaUrl.split('/').pop();
              const isImage = /\.(jpg|jpeg|png|gif)$/i.test(facturaUrl);
              const isPdf = /\.pdf$/i.test(facturaUrl);
              
              if (isImage) {
                return (
                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <span className="text-sm text-blue-700 mb-2 flex items-center font-medium">
                      <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                      Previsualización de factura:
                    </span>
                    <div className="relative w-full h-40 group mt-2">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                      <Image
                        src={facturaUrl}
                        alt="Factura"
                        fill
                        className="rounded-lg border border-blue-200 shadow-sm transition-all duration-300 hover:shadow-md object-contain bg-white/90"
                        onLoadingComplete={(img) => {
                          img.classList.remove('animate-pulse');
                        }}
                        quality={85}
                      />
                      <div 
                        className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                        onClick={() => window.open(facturaUrl, '_blank')}
                      />
                    </div>
                  </div>
                );
              } else if (isPdf) {
                return (
                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <span className="text-sm text-blue-700 mb-2 block font-medium">Previsualización de factura (PDF):</span>
                    <iframe 
                      src={facturaUrl} 
                      title="Factura PDF" 
                      className="w-full rounded border border-blue-200" 
                      style={{height: '200px'}} 
                    />
                  </div>
                );
              } else {
                return (
                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <span className="text-sm text-blue-700 mb-2 block font-medium">Archivo adjunto:</span>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">No se puede previsualizar, haz clic en &quot;Ver Factura&quot; para abrir</span>
                  </div>
                );
              }
            })() : (
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 flex items-center font-medium">
                  <FileText className="w-4 h-4 mr-1.5 text-gray-500" />
                  No hay factura adjunta
                </span>
                <p className="text-xs text-gray-500 mt-1">Esta solicitud no tiene documentos adjuntos</p>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              {solicitud.factura_url && (
                <Button
                  size="sm"
                  onClick={() => {
                    // Garantizar que la URL tenga el formato correcto con la barra diagonal
                    let facturaUrl = '';
                    if (solicitud.factura_url.startsWith('http')) {
                      facturaUrl = solicitud.factura_url;
                    } else {
                      const baseUrl = 'http://localhost:4000';
                      const rutaArchivo = solicitud.factura_url.startsWith('/') 
                        ? solicitud.factura_url 
                        : `/${solicitud.factura_url}`;
                      facturaUrl = `${baseUrl}${rutaArchivo}`;
                    }
                    window.open(facturaUrl, '_blank');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Factura
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
              {solicitud.soporte_url && (
                <Button
                  size="sm"
                  onClick={() => window.open(solicitud.soporte_url, '_blank')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Ver Soporte
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              )}
              {!solicitud.factura_url && !solicitud.soporte_url && (
                <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                  No hay documentos adjuntos disponibles
                </div>
              )}
            </div>
          
          {/* Sección de comprobantes de pago */}
          {solicitud.estado === 'pagada' && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                Comprobantes de Pago
              </h4>
              
              {loadingComprobantes ? (
                <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">Cargando comprobantes...</div>
              ) : error ? (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
              ) : comprobantes.length === 0 ? (
                <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">No hay comprobantes de pago disponibles</div>
              ) : (
                <div className="space-y-4">
                    {comprobantes.map((comprobante) => {
                      // Construir la URL del comprobante
                      let comprobanteUrl = '';
                      if (comprobante.ruta_archivo.startsWith('http')) {
                        comprobanteUrl = comprobante.ruta_archivo;
                      } else {
                        const baseUrl = 'http://localhost:4000';
                        const rutaArchivo = comprobante.ruta_archivo.startsWith('/')
                          ? comprobante.ruta_archivo
                          : `/${comprobante.ruta_archivo}`;
                        comprobanteUrl = `${baseUrl}${rutaArchivo}`;
                      }
                      
                      // Determinar el tipo de archivo
                      const fileName = comprobante.nombre_archivo || comprobanteUrl.split('/').pop() || '';
                      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                      const isPdf = /\.pdf$/i.test(fileName);
                      
                      return (
                        <div key={comprobante.id_comprobante} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center bg-white/80 px-3 py-1.5 rounded-md w-fit">
                                <span className="text-xs text-blue-700/80 mr-2">Subido por:</span>
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
                            <Button
                              size="sm"
                              onClick={() => {
                                if (comprobanteUrl) {
                                  window.open(comprobanteUrl, '_blank');
                                } else {
                                  console.error('URL del comprobante no disponible');
                                }
                              }}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 ml-3"
                              disabled={!comprobanteUrl}
                            >
                              Ver completo
                            </Button>
                          </div>
                          
                          {/* Previsualización según el tipo de archivo */}
                          {isImage && (
                            <div className="relative w-full h-36 group overflow-hidden rounded border border-blue-200 shadow-sm bg-white/90">
                              <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                              <Image
                                src={comprobanteUrl}
                                alt={`Comprobante: ${comprobante.nombre_archivo}`}
                                fill
                                className="object-contain bg-white/80 transition-all duration-300 group-hover:scale-[1.02]"
                                onLoadingComplete={(img) => {
                                  const parent = img.parentElement;
                                  if (parent) {
                                    const loadingBg = parent.querySelector('div');
                                    if (loadingBg) loadingBg.classList.add('opacity-0');
                                  }
                                }}
                                quality={80}
                              />
                              <div 
                                className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 cursor-zoom-in"
                                onClick={() => window.open(comprobanteUrl, '_blank')}
                              />
                            </div>
                          )}
                          
                          {isPdf && (
                            <div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
                              <iframe 
                                src={comprobanteUrl} 
                                title={`Comprobante: ${comprobante.nombre_archivo}`} 
                                className="w-full" 
                                style={{height: '150px'}} 
                              />
                              <div className="bg-blue-50/80 p-2 text-xs text-center text-blue-700">
                                Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
                              </div>
                            </div>
                          )}
                          
                          {!isImage && !isPdf && (
                            <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
                              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-blue-800 font-medium text-sm">Archivo: {fileName}</p>
                                <p className="text-xs text-gray-600">Haga clic en &quot;Ver completo&quot; para abrir el archivo</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          </Card>
        </div>
      </div>
    </div>
      </div>
  </div>
);
}