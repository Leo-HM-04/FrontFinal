import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ExternalLink, DollarSign, Building, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Viatico } from '@/services/viaticos.service';
import { getComprobantesPorViatico } from '@/services/comprobantesViaticos.service';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/modal.css';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fondo degradado oscuro/transparente mejorado */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-sm animate-slide-up">
        {/* Contenedor con scroll interno */}
        <div className="overflow-y-auto max-h-[90vh] modal-scroll">
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
                Viático #{viatico.id_viatico}
              </h2>
              <p className="text-blue-100 text-lg">
                Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{viatico.folio || '-'}</span>
              </p>
              <p className="text-blue-200 mt-2">
                {viatico.fecha_creacion ? `Creado el ${formatDate(String(viatico.fecha_creacion))}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 ${getEstadoColor(viatico.estado || '')} backdrop-blur-sm`}> 
                {String(viatico.estado || 'pendiente').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Información Principal con diseño mejorado - 3 columnas para ser más ancho */}
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
                <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(Number(viatico.monto))}</p>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
              </div>
              
              {/* Grid principal de información */}
              <div className="grid grid-cols-2 gap-4">                
                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Cuenta Destino</span>
                  <p className="font-mono text-blue-900 font-medium text-sm">{viatico.cuenta_destino}</p>
                </div>
                
                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Fecha límite</span>
                  <p className="text-blue-900 font-medium text-sm">{formatDate(String(viatico.fecha_limite_pago))}</p>
                </div>
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
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado actual</span>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-3 bg-yellow-400 shadow-lg"></div>
                  <p className="font-black text-2xl text-white tracking-tight">{(viatico.estado || 'pendiente').toUpperCase()}</p>
                </div>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-20"></div>
              </div>
              
              {/* Información de departamento */}
              <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/80 shadow-sm">
                <h4 className="text-sm font-medium text-indigo-800 mb-2">Departamento</h4>
                <p className="text-indigo-900 font-medium">{viatico.departamento ? 
                  viatico.departamento.toLowerCase() === "ti" ? "TI" : 
                  viatico.departamento.charAt(0).toUpperCase() + viatico.departamento.slice(1).toLowerCase() : 
                  "-"}</p>
              </div>
            </Card>
          </div>
          
          {/* Concepto y Documentos con diseño mejorado - más ancho */}
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
                <p className="text-gray-800 leading-relaxed text-base font-medium">{viatico.concepto}</p>
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
                                <div className="flex items-center mt-1.5 bg-white/60 px-2 py-1 rounded-md">
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
                                  onClick={() => window.open(comprobanteUrl, '_blank')}
                                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs whitespace-nowrap ml-3"
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

        {/* Footer mejorado */}
      </div>

    </div>

  </div>

  );
}
