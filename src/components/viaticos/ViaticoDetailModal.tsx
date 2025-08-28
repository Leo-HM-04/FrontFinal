'use client';

import { useState, useEffect } from 'react';
import type { Viatico } from '@/hooks/useViaticos';
import { CreditCard, FileText, Building, ExternalLink, MapPin, Calendar, DollarSign, X, Upload, CheckCircle } from 'lucide-react';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface ComprobanteViatico {
  id_comprobante: number;
  id_viatico: number;
  archivo_url: string;
  fecha_subida: string;
  id_usuario_subio: number;
  nombre_usuario?: string;
}

interface ViaticoDetailModalProps {
  isOpen: boolean;
  viatico: Viatico | null;
  onClose: () => void;
}

export function ViaticoDetailModal({ isOpen, viatico, onClose }: ViaticoDetailModalProps) {
  const [comprobantes, setComprobantes] = useState<ComprobanteViatico[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  // Cargar comprobantes de pago si el viático está pagado
  useEffect(() => {
    const fetchComprobantes = async () => {
      if (!viatico || viatico.estado?.toLowerCase() !== 'pagada') return;
      
      try {
        setLoadingComprobantes(true);
        setErrorComprobantes(null);
        
        const response = await fetch(`/api/comprobantes-viaticos/${viatico.id_viatico}`);
        if (response.ok) {
          const data = await response.json();
          setComprobantes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error al cargar comprobantes:', error);
        setErrorComprobantes('Error al cargar comprobantes de pago');
      } finally {
        setLoadingComprobantes(false);
      }
    };

    if (isOpen && viatico) {
      fetchComprobantes();
    }
  }, [isOpen, viatico]);

  if (!isOpen || !viatico) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo degradado y blur */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Scroll interno */}
        <div className="overflow-y-auto max-h-[92vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400 px-2 md:px-6 pb-8 pt-2">
          {/* Botón cerrar flotante */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Header con gradiente y estado */}
          <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-700 text-white px-8 py-6 md:py-8 rounded-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">
                  Viático #{viatico.id_viatico}
                </h2>
                <p className="text-purple-100 text-lg">
                  Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{viatico.folio || '-'}</span>
                </p>
                <p className="text-purple-200 mt-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Fecha límite: {viatico.fecha_limite_pago ? formatDateForDisplay(viatico.fecha_limite_pago) : '-'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 bg-green-100 text-green-800 border-green-200 backdrop-blur-sm">
                  {viatico.estado.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="px-0 md:px-2 space-y-8">
            {/* Información del Beneficiario y Monto */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
              <div className="xl:col-span-2">
                {/* Información del Beneficiario */}
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-purple-100 rounded-xl mr-3">
                      <Building className="w-6 h-6 text-purple-700" />
                    </div>
                    Información del Beneficiario
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-md border border-purple-100">
                      <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-1 font-medium">Beneficiario</span>
                      <p className="text-purple-900 font-semibold text-lg">{viatico.nombre_persona || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-purple-100">
                      <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-1 font-medium">Empresa a pagar</span>
                      <p className="text-purple-900 font-medium">{viatico.empresa_a_pagar || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-purple-100">
                      <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-1 font-medium">Departamento</span>
                      <p className="text-purple-900 font-medium capitalize">{viatico.departamento || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-purple-100">
                      <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-1 font-medium">Tipo de pago</span>
                      <p className="text-purple-900 font-medium">{viatico.tipo_pago || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-xl mr-3">
                      <DollarSign className="w-6 h-6 text-green-700" />
                    </div>
                    Información Financiera
                  </h3>
                  {/* Monto destacado */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-2xl border border-green-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider text-green-100 font-bold block mb-2">Monto total</span>
                    <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(viatico.monto)}</p>
                    <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
                  </div>

                  {/* Información bancaria */}
                  <div className="bg-green-50/30 rounded-md p-4 border border-green-100/80">
                    <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Información bancaria
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-md border border-green-100">
                        <span className="text-xs uppercase tracking-wider text-green-700/70 block mb-1 font-medium">Tipo de cuenta</span>
                        <p className="text-green-900 font-medium">
                          {viatico.tipo_cuenta_destino === 'Tarjeta'
                            ? `Tarjeta${viatico.tipo_tarjeta ? ' - ' + viatico.tipo_tarjeta : ''}`
                            : viatico.tipo_cuenta_destino || '-'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-green-100">
                        <span className="text-xs uppercase tracking-wider text-green-700/70 block mb-1 font-medium">Banco destino</span>
                        <p className="text-green-900 font-medium">{viatico.banco_destino || '-'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-green-100 md:col-span-2">
                        <span className="text-xs uppercase tracking-wider text-green-700/70 block mb-1 font-medium">Cuenta destino</span>
                        <p className="font-mono text-green-900 font-medium text-lg">{viatico.cuenta_destino}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar derecho */}
              <div>
                {/* Estado y propósito */}
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                      <MapPin className="w-6 h-6 text-indigo-700" />
                    </div>
                    Estado y Propósito
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado actual</span>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-3 bg-green-400 shadow-lg"></div>
                      <p className="font-black text-2xl text-white tracking-tight">{viatico.estado.toUpperCase()}</p>
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-20"></div>
                  </div>
                  
                  {/* Propósito del viático */}
                  <div className="bg-indigo-50/30 rounded-md p-3 border border-indigo-100/80">
                    <h4 className="text-sm font-medium text-indigo-800 mb-2">Propósito del viático</h4>
                    <div className="bg-white p-3 rounded-md border border-indigo-100">
                      <p className="text-indigo-900 font-medium leading-relaxed">{viatico.concepto || '-'}</p>
                    </div>
                  </div>
                  
                  {/* Descripción del tipo de pago */}
                  {viatico.tipo_pago_descripcion && (
                    <div className="bg-indigo-50/30 rounded-md p-3 border border-indigo-100/80 mt-4">
                      <h4 className="text-sm font-medium text-indigo-800 mb-2">Descripción</h4>
                      <div className="bg-white p-3 rounded-md border border-indigo-100">
                        <p className="text-indigo-900 font-medium">{viatico.tipo_pago_descripcion}</p>
                      </div>
                    </div>
                  )}

                  {/* Comentario del aprobador */}
                  {viatico.comentario_aprobador && (
                    <div className="bg-indigo-50/30 rounded-md p-3 border border-indigo-100/80 mt-4">
                      <h4 className="text-sm font-medium text-indigo-800 mb-2">Comentario del aprobador</h4>
                      <div className="bg-white p-3 rounded-md border border-indigo-100">
                        <p className="text-indigo-900 font-medium italic">{viatico.comentario_aprobador}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Documentos Adjuntos */}
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-orange-100 rounded-xl mr-3">
                      <FileText className="w-6 h-6 text-orange-700" />
                    </div>
                    Documentos y Comprobantes
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Archivo del Solicitante */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                        <Upload className="w-4 h-4 mr-2" />
                        Archivo del Solicitante
                      </h4>
                      {viatico.viatico_url ? (
                        <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <FileText className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Comprobante de viático</p>
                                <p className="text-sm text-gray-500">Subido por el solicitante</p>
                              </div>
                            </div>
                            <a
                              href={`/uploads/viaticos/${viatico.viatico_url.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 text-sm font-medium"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Ver archivo
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No hay archivo del solicitante</p>
                        </div>
                      )}
                    </div>

                    {/* Comprobantes de Pago del Pagador */}
                    {viatico.estado?.toLowerCase() === 'pagada' && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Comprobantes de Pago
                        </h4>
                        
                        {loadingComprobantes ? (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-blue-600 text-sm">Cargando comprobantes...</p>
                          </div>
                        ) : errorComprobantes ? (
                          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                            <p className="text-red-600 text-sm">{errorComprobantes}</p>
                          </div>
                        ) : comprobantes.length > 0 ? (
                          <div className="space-y-4">
                            {comprobantes.map((comprobante) => (
                              <div key={comprobante.id_comprobante} className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        Comprobante #{comprobante.id_comprobante}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        Subido por: {comprobante.nombre_usuario || 'Pagador'}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {new Date(comprobante.fecha_subida).toLocaleDateString('es-MX')} - {new Date(comprobante.fecha_subida).toLocaleTimeString('es-MX')}
                                      </p>
                                    </div>
                                  </div>
                                  <a
                                    href={`/uploads/comprobantes-viaticos/${comprobante.archivo_url.split('/').pop()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Ver comprobante
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                            <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">
                              No hay comprobantes de pago disponibles
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Los comprobantes se mostrarán aquí una vez que el pagador los suba
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje informativo para estados no pagados */}
                    {viatico.estado?.toLowerCase() !== 'pagada' && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <p className="text-blue-800 text-sm font-medium">
                            Los comprobantes de pago aparecerán aquí una vez que el viático sea marcado como pagado
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}