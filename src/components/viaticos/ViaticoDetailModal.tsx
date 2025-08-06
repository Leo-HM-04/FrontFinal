import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ExternalLink, DollarSign, Building, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Viatico } from '@/services/viaticos.service';
import { getComprobantesPorViatico } from '@/services/comprobantesViaticos.service';
import { useAuth } from '@/contexts/AuthContext';

interface ComprobanteViatico {
  id_comprobante: number;
  id_viatico: number;
  archivo_url: string;
  fecha_subida: string;
  id_usuario_subio: number;
  nombre_usuario?: string;
  // Campos adicionales que puedan venir en la respuesta
  usuario_subio?: number;
}

interface ViaticoDetailModalProps {
  viatico: Viatico | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViaticoDetailModal({ viatico, isOpen, onClose }: ViaticoDetailModalProps) {
  const [comprobantes, setComprobantes] = useState<ComprobanteViatico[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchComprobantes = async () => {
      if (!viatico || !isOpen || String(viatico.estado).toLowerCase() !== 'pagada') return;
      
      try {
        setLoadingComprobantes(true);
        setError(null);
        const data = await getComprobantesPorViatico(viatico.id_viatico, token || undefined);
        console.log('Comprobantes obtenidos (raw):', data);
        
        // Asegurar que tengamos un array
        const comprobantesArray = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
        console.log('Comprobantes procesados:', comprobantesArray);
        
        setComprobantes(comprobantesArray);
      } catch (err) {
        console.error('Error al obtener comprobantes:', err);
        setError('No se pudieron cargar los comprobantes de pago. Verifique su conexión e inténtelo de nuevo.');
      } finally {
        setLoadingComprobantes(false);
      }
    };

    if (isOpen && viatico) {
      fetchComprobantes();
    }
  }, [isOpen, viatico, token]);

  if (!isOpen || !viatico) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      autorizada: 'bg-green-100 text-green-800 border-green-200',
      rechazada: 'bg-red-100 text-red-800 border-red-200',
      pagada: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[estado.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
                Viático #{viatico.id_viatico}
              </h2>
              <p className="text-blue-100 mt-1">
                Folio: <span className="font-mono text-yellow-200">{viatico.folio || '-'}</span>
              </p>
              <p className="text-blue-100 mt-1">
                {viatico.fecha_creacion ? `Creado el ${formatDate(String(viatico.fecha_creacion))}` : ''}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(viatico.estado || '')} bg-white/20`}> 
              {String(viatico.estado || 'pendiente').toUpperCase()}
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
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(Number(viatico.monto))}</p>
              </div>
              
              {/* Grid principal de información */}
              <div className="grid grid-cols-2 gap-4">                
                <div className="bg-white p-2 rounded-md">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta Destino</span>
                  <p className="font-mono text-blue-900 font-medium">{viatico.cuenta_destino}</p>
                </div>
                
                <div className="bg-white p-2 rounded-md">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Fecha límite</span>
                  <p className="text-blue-900 font-medium">{formatDate(String(viatico.fecha_limite_pago))}</p>
                </div>
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
                  <p className="font-bold text-lg text-blue-700">{(viatico.estado || 'pendiente').toUpperCase()}</p>
                </div>
              </div>
              
              {/* Información de departamento */}
              <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Departamento</h4>
                <p className="text-blue-900 font-medium">{viatico.departamento ? 
                  viatico.departamento.toLowerCase() === "ti" ? "TI" : 
                  viatico.departamento.charAt(0).toUpperCase() + viatico.departamento.slice(1).toLowerCase() : 
                  "-"}</p>
              </div>
            </Card>
          </div>
          
          {/* Concepto */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-700" />
              Concepto
            </h3>
            <p className="text-blue-900 leading-relaxed">{viatico.concepto}</p>
          </Card>
          
          {/* Documentos */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-blue-700" />
              Documentos Adjuntos
            </h3>
            <div className="flex flex-col gap-4">
              {/* Documento de Viático */}
              {viatico.viatico_url && (() => {
                let viaticoUrl = '';
                if (viatico.viatico_url.startsWith('http')) {
                  viaticoUrl = viatico.viatico_url;
                } else {
                  const baseUrl = 'http://localhost:4000';
                  const rutaArchivo = viatico.viatico_url.startsWith('/') 
                    ? viatico.viatico_url 
                    : `/${viatico.viatico_url}`;
                  viaticoUrl = `${baseUrl}${rutaArchivo}`;
                }
                const fileName = viaticoUrl.split('/').pop();
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(viaticoUrl);
                const isPdf = /\.pdf$/i.test(viaticoUrl);

                if (isImage) {
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                        Documento de viático:
                      </span>
                      <div className="relative w-full h-64 group">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
                        <Image
                          src={viaticoUrl}
                          alt="Documento de viático"
                          fill
                          className="rounded-lg border-2 border-blue-200 shadow-lg transition-all duration-300 hover:border-blue-400 hover:shadow-xl object-contain bg-white/80 backdrop-blur-sm group-hover:scale-[1.02]"
                          onLoadingComplete={(img) => {
                            img.classList.remove('animate-pulse');
                          }}
                          quality={100}
                          priority
                        />
                        <div className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 rounded-lg cursor-zoom-in"
                             onClick={() => window.open(viaticoUrl, '_blank')}
                        />
                      </div>
                    </div>
                  );
                } else if (isPdf) {
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Documento de viático (PDF):</span>
                      <iframe src={viaticoUrl} title="Documento de viático PDF" className="w-full" style={{height: '300px', border: '1px solid #93c5fd', borderRadius: '8px'}} />
                    </div>
                  );
                } else {
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Archivo adjunto:</span>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(viaticoUrl, '_blank')}
                        className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Ver Documento</span>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                }
              })()}
              
              {/* Sección de comprobantes de pago */}
              {viatico.estado && viatico.estado.toLowerCase() === 'pagada' && (
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
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-700">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">No hay comprobantes de pago disponibles</span>
                      </div>
                      <p className="text-sm ml-7">Este viático está marcado como pagado pero aún no se ha subido ningún comprobante de pago.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {comprobantes.map((comprobante) => {
                        // Construir la URL del comprobante
                        let comprobanteUrl = '';
                        // Verificamos primero si tenemos el campo archivo_url, si no, podría estar en otro campo
                        const archivoPath = comprobante.archivo_url || '';
                        
                        if (archivoPath.startsWith('http')) {
                          comprobanteUrl = archivoPath;
                        } else {
                          const baseUrl = 'http://localhost:4000';
                          // Verificar si la ruta ya incluye '/uploads/comprobante-viaticos/'
                          if (archivoPath.includes('/uploads/comprobante-viaticos/')) {
                            const rutaArchivo = archivoPath.startsWith('/') ? archivoPath : `/${archivoPath}`;
                            comprobanteUrl = `${baseUrl}${rutaArchivo}`;
                          } else {
                            // Construir la ruta completa
                            comprobanteUrl = `${baseUrl}/uploads/comprobante-viaticos/${archivoPath.split('/').pop()}`;
                          }
                        }
                        
                        console.log('URL del comprobante construida:', comprobanteUrl);
                        
                        // Determinar el tipo de archivo
                        const fileName = comprobanteUrl.split('/').pop() || '';
                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
                        const isPdf = /\.pdf$/i.test(fileName);
                        
                        return (
                          <div key={comprobante.id_comprobante} className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/50 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="text-blue-800 font-medium flex items-center flex-wrap">
                                  <FileCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                                  {fileName ? (
                                    <>Comprobante: <span className="ml-1 font-mono text-xs bg-blue-50 px-1 py-0.5 rounded">{fileName}</span></>
                                  ) : (
                                    <>Comprobante #{comprobante.id_comprobante}</>
                                  )}
                                </p>
                                <div className="flex items-center mt-1.5 bg-white/60 px-2 py-1 rounded-md inline-block">
                                  <span className="text-xs text-blue-700/70 mr-1">Subido por:</span>
                                  <span className="text-xs text-blue-700 font-medium">
                                    {comprobante.nombre_usuario || `Usuario ${comprobante.id_usuario_subio || comprobante.usuario_subio}`}
                                  </span>
                                </div>
                                {comprobante.fecha_subida && (
                                  <div className="text-xs text-blue-700/70 mt-1">
                                    Fecha: {new Date(comprobante.fecha_subida).toLocaleDateString('es-MX')} {new Date(comprobante.fecha_subida).toLocaleTimeString('es-MX')}
                                  </div>
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
                                  alt={`Comprobante #${comprobante.id_comprobante}`}
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
                                  title={`Comprobante #${comprobante.id_comprobante}`} 
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
