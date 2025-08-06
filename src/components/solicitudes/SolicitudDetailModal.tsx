

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ExternalLink, DollarSign, Building, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Solicitud, Comprobante } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo degradado oscuro/transparente */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-blue-900/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up border border-blue-200">
        {/* Botón de cerrar (X) flotante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-400 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Solicitud #{solicitud.id_solicitud}
              </h2>
              <p className="text-blue-100 mt-1">
                Folio: <span className="font-mono text-yellow-200">{solicitud.folio || '-'}</span>
              </p>
              <p className="text-blue-100 mt-1">
                Creada el {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(solicitud.estado)}`}> 
              {solicitud.estado.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="p-6">
          {/* Información Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-5 bg-white/90 border border-blue-100 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-700" />
                Información Financiera
              </h3>
              
              {/* Monto destacado */}
              <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-200/50 mb-4">
                <span className="text-xs uppercase tracking-wider text-blue-700/80 font-semibold">Monto total</span>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(solicitud.monto)}</p>
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
            <Card className="p-5 bg-white/90 border border-blue-100 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-700" />
                Información Organizacional
              </h3>
              
              {/* Estado destacado */}
              <div className="p-3 rounded-lg border mb-4 bg-blue-50/80 border-blue-200/50">
                <span className="text-xs uppercase tracking-wider font-semibold block mb-1 text-blue-700">Estado actual</span>
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full mr-2 bg-blue-600"></div>
                  <p className="font-bold text-lg text-blue-700">{solicitud.estado.toUpperCase()}</p>
                </div>
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
          {/* Concepto */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-700" />
              Concepto
            </h3>
            <p className="text-blue-900 leading-relaxed">{solicitud.concepto}</p>
          </Card>
          {/* Documentos */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-blue-700" />
              Documentos Adjuntos
            </h3>
            <div className="flex flex-col gap-4">
              {/* Previsualización de factura */}
              {solicitud.factura_url && (() => {
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
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                        Previsualización de factura:
                      </span>
                      <div className="relative w-full h-64 group">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                        <Image
                          src={facturaUrl}
                          alt="Factura"
                          fill
                          className="rounded-lg border-2 border-blue-200 shadow-lg transition-all duration-300 hover:border-blue-400 hover:shadow-xl object-contain bg-white/80 backdrop-blur-sm group-hover:scale-[1.02]"
                          onLoadingComplete={(img) => {
                            img.classList.remove('animate-pulse');
                          }}
                          quality={100}
                          priority
                        />
                        <div className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                             onClick={() => window.open(facturaUrl, '_blank')}
                        />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 shadow-sm flex items-center">
                            <ExternalLink className="w-4 h-4 mr-1.5" />
                            Click para ampliar
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else if (isPdf) {
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Previsualización de factura (PDF):</span>
                      <iframe src={facturaUrl} title="Factura PDF" className="w-full" style={{height: '300px', border: '1px solid #93c5fd', borderRadius: '8px'}} />
                    </div>
                  );
                } else {
                  // Otros formatos: solo mostrar nombre y botón para descargar
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Archivo adjunto:</span>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                        <span className="text-xs text-gray-500">(No se puede previsualizar, descarga para ver el contenido)</span>
                      </div>
                    </div>
                  );
                }
              })()}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button
                  variant="outline"
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
                  className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Factura</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                {solicitud.soporte_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(solicitud.soporte_url, '_blank')}
                    className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Soporte</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
                {/* Sección de comprobantes de pago */}
                {solicitud.estado === 'pagada' && (
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <h4 className="text-md font-semibold text-blue-800 mb-2 flex items-center">
                      <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                      Comprobantes de Pago
                    </h4>
                    
                    {loadingComprobantes ? (
                      <div className="text-blue-600 text-sm">Cargando comprobantes...</div>
                    ) : error ? (
                      <div className="text-red-500 text-sm">{error}</div>
                    ) : comprobantes.length === 0 ? (
                      <div className="text-gray-500 text-sm">No hay comprobantes de pago disponibles</div>
                    ) : (
                      <div className="space-y-6">
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
                            <div key={comprobante.id_comprobante} className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/50 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <p className="text-blue-800 font-medium flex items-center">
                                    <FileCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                                    {comprobante.nombre_archivo}
                                  </p>
                                  <div className="flex items-center mt-1.5 bg-white/60 px-2 py-1 rounded-md inline-block">
                                    <span className="text-xs text-blue-700/70 mr-1">Subido por:</span>
                                    <span className="text-xs text-blue-700 font-medium">
                                      {comprobante.nombre_usuario || `Usuario ${comprobante.usuario_subio}`}
                                    </span>
                                  </div>
                                  {comprobante.comentario && (
                                    <p className="text-xs text-gray-600 italic mt-2 pl-1.5 border-l-2 border-blue-200">&ldquo;{comprobante.comentario}&rdquo;</p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => window.open(comprobanteUrl, '_blank')}
                                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 ml-3 whitespace-nowrap"
                                >
                                  Ver completo
                                </Button>
                              </div>
                              
                              {/* Previsualización según el tipo de archivo */}
                              {isImage && (
                                <div className="relative w-full h-48 group overflow-hidden rounded-lg border-2 border-blue-100 shadow-md bg-white/80">
                                  <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                                  <Image
                                    src={comprobanteUrl}
                                    alt={`Comprobante: ${comprobante.nombre_archivo}`}
                                    fill
                                    className="object-contain bg-white/60 backdrop-blur-sm group-hover:scale-[1.02] transition-all duration-300"
                                    onLoadingComplete={(img) => {
                                      const parent = img.parentElement;
                                      if (parent) {
                                        const loadingBg = parent.querySelector('div');
                                        if (loadingBg) loadingBg.classList.add('opacity-0');
                                      }
                                    }}
                                    quality={85}
                                  />
                                  <div 
                                    className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                                    onClick={() => window.open(comprobanteUrl, '_blank')}
                                  />
                                </div>
                              )}
                              
                              {isPdf && (
                                <div className="w-full rounded-lg border border-blue-200 overflow-hidden shadow-md">
                                  <iframe 
                                    src={comprobanteUrl} 
                                    title={`Comprobante: ${comprobante.nombre_archivo}`} 
                                    className="w-full" 
                                    style={{height: '200px'}} 
                                  />
                                  <div className="bg-blue-50 p-2 text-xs text-center text-blue-700">
                                    Vista previa limitada. Haga clic en &ldquo;Ver completo&rdquo; para abrir el PDF completo.
                                  </div>
                                </div>
                              )}
                              
                              {!isImage && !isPdf && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <FileText className="w-8 h-8 text-blue-600" />
                                  <div>
                                    <p className="text-gray-700">No se puede previsualizar este tipo de archivo</p>
                                    <p className="text-xs text-gray-500">Haga clic en &ldquo;Ver completo&rdquo; para abrir el archivo</p>
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
  );
}
