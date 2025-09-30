'use client';

import { Button } from '@/components/ui/Button';
import type { Solicitud } from '@/types/index';
import { CreditCard, FileText, Building, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { detectarPlantillaId } from '@/utils/plantillasLabels';
import { PlantillaComisionesDetailModal } from '@/components/plantillas/PlantillaComisionesDetailModal';
import { SolicitudComisionesData } from '@/types/plantillaComisiones';
import { obtenerNombreBanco } from '@/utils/bancos';

interface PagoDetailModalProps {
  isOpen: boolean;
  pago: Solicitud | null;
  onClose: () => void;
}

export function PagoDetailModal({ isOpen, pago, onClose }: PagoDetailModalProps) {
  if (!isOpen || !pago) return null;



  // Función para detectar si es una solicitud PAGO COMISIONES
  function isComisionesSolicitud(solicitud: Solicitud): boolean {
    // 1. Verificar por plantillaId en plantilla_datos
    const plantillaId = detectarPlantillaId(solicitud);
    if (plantillaId === 'pago-comisiones') {
      return true;
    }
    
    // 2. Verificar por contenido de plantilla_datos
    if (solicitud.plantilla_datos) {
      try {
        const plantillaData = JSON.parse(solicitud.plantilla_datos);
        const esComisiones = plantillaData.templateType === 'pago-comisiones' ||
               plantillaData.isComisiones === true ||
               (plantillaData.porcentaje_comision && plantillaData.periodo_comision) ||
               plantillaData.tipo_comision;
        if (esComisiones) {
          return true;
        }
      } catch {
        // Error parseando plantilla_datos, continuar con otras validaciones
      }
    }
    
    // 3. Verificar por tipo_pago_descripcion
    if (solicitud.tipo_pago_descripcion && (
        solicitud.tipo_pago_descripcion.includes('COMISION') ||
        solicitud.tipo_pago_descripcion.includes('COMISIONES')
      )) {
      return true;
    }
    
    // 4. Verificar por concepto que contenga COMISION o COMISIONES
    if (solicitud.concepto && (
        solicitud.concepto.includes('COMISION') ||
        solicitud.concepto.includes('COMISIONES')
      )) {
      return true;
    }
    
    return false;
  }

  // Verificar si es una solicitud PAGO COMISIONES y mostrar modal específico
  if (isComisionesSolicitud(pago)) {
    let solicitudComisiones: SolicitudComisionesData | null = null;
    
    // Intentar obtener datos desde plantilla_datos
    if (pago.plantilla_datos) {
      try {
        const plantillaData = JSON.parse(pago.plantilla_datos);
        
        // Usar datos de plantilla si están disponibles
        solicitudComisiones = {
          id_solicitud: pago.id_solicitud,
          asunto: plantillaData.asunto || '',
          empresa: plantillaData.empresa || '',
          cliente: plantillaData.cliente || '',
          monto: plantillaData.monto || Number(pago.monto) || 0,
          porcentaje_comision: plantillaData.porcentaje_comision,
          fecha_limite: plantillaData.fecha_limite || '',
          periodo_comision: plantillaData.periodo_comision,
          archivos_adjuntos: plantillaData.archivos_adjuntos || [],
          estado: 'pagada', // En el contexto del pagador, la solicitud ya está pagada
          fecha_creacion: pago.fecha_creacion || '',
          fecha_actualizacion: pago.updated_at || '',
          usuario_creacion: pago.usuario_nombre || '',
          usuario_actualizacion: '',
          // Información bancaria
          banco_destino: plantillaData.banco_destino || pago.banco_destino || '',
          cuenta_destino: plantillaData.cuenta_destino || pago.cuenta_destino || '',
          tipo_cuenta_destino: plantillaData.tipo_cuenta_destino || pago.tipo_cuenta_destino || '',
          beneficiario: plantillaData.beneficiario || pago.nombre_persona || '',
          // Campo adicional para extraer información
          concepto: pago.concepto || '',
        };
      } catch {
        // Error parseando plantilla_datos, usar datos base
      }
    }
    
    // Si no se pudo mapear desde plantilla_datos, usar datos básicos de la solicitud
    if (!solicitudComisiones) {
      // Extraer información del concepto si está presente
      let asunto = pago.concepto || 'PAGO COMISIONES';
      let cliente = '';
      let empresa = '';
      let porcentaje_comision: number | undefined;
      let periodo_comision = '';
      
      // Intentar extraer información del concepto
      if (pago.concepto) {
        // Extraer solo el asunto principal (primera parte)
        const asuntoMatch = pago.concepto.match(/^([^-]+)(?:\s*-)?/);
        if (asuntoMatch) {
          asunto = asuntoMatch[1].trim();
        }
        
        // Buscar Cliente: en el concepto
        const clienteMatch = pago.concepto.match(/Cliente:\s*([^-\n,]+)/i);
        if (clienteMatch) {
          cliente = clienteMatch[1].trim();
        }
        
        // Buscar Empresa: en el concepto
        const empresaMatch = pago.concepto.match(/Empresa:\s*([^-\n,]+)/i);
        if (empresaMatch) {
          empresa = empresaMatch[1].trim();
        }
        
        // Buscar porcentaje de comisión
        const porcentajeMatch = pago.concepto.match(/(\d+(?:\.\d+)?)%/);
        if (porcentajeMatch) {
          porcentaje_comision = parseFloat(porcentajeMatch[1]);
        }
        
        // Buscar periodo (mensual, trimestral, etc.)
        const periodoMatch = pago.concepto.match(/periodo:\s*([^-\n,]+)/i);
        if (periodoMatch) {
          periodo_comision = periodoMatch[1].trim();
        }
      }
      
      // Si no se encontraron en el concepto, usar campos alternativos
      if (!cliente) {
        cliente = pago.empresa_a_pagar || pago.nombre_persona || '';
      }
      if (!empresa) {
        empresa = pago.empresa_a_pagar || '';
      }
      
      solicitudComisiones = {
        id_solicitud: pago.id_solicitud,
        asunto,
        empresa,
        cliente,
        monto: Number(pago.monto) || 0,
        porcentaje_comision,
        fecha_limite: pago.fecha_limite_pago || '',
        periodo_comision,
        archivos_adjuntos: [],
        estado: 'pagada', // En el contexto del pagador, la solicitud ya está pagada
        fecha_creacion: pago.fecha_creacion || '',
        fecha_actualizacion: pago.updated_at || '',
        usuario_creacion: pago.usuario_nombre || '',
        usuario_actualizacion: '',
        // Información bancaria
        banco_destino: pago.banco_destino || '',
        cuenta_destino: pago.cuenta_destino || '',
        tipo_cuenta_destino: pago.tipo_cuenta_destino || '',
        beneficiario: pago.nombre_persona || '',
        // Campo adicional para extraer información
        concepto: pago.concepto || '',
      };
    }
    
    if (solicitudComisiones) {
      return (
        <PlantillaComisionesDetailModal
          solicitud={solicitudComisiones}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
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
            ×
          </button>
          {/* Header con gradiente y estado */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white px-8 py-6 md:py-8 rounded-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">
                  Pago #{pago.id_solicitud}
                </h2>
                <p className="text-blue-100 text-lg">
                  Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{pago.folio || '-'}</span>
                </p>
                <p className="text-blue-200 mt-2">
                  Creado el {formatDateForDisplay(pago.fecha_creacion)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 bg-green-100 text-green-800 border-green-200 backdrop-blur-sm">
                  {pago.estado.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="px-0 md:px-2 space-y-8">
            {/* Concepto y descripción del tipo de pago al inicio */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
              <div className="xl:col-span-2">
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-xl mr-3">
                      <FileText className="w-6 h-6 text-green-700" />
                    </div>
                    Concepto
                  </h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 shadow-inner mb-4">
                    <p className="text-gray-800 leading-relaxed text-base font-medium">{pago.concepto || '-'}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Descripción del tipo de pago</span>
                  <p className="text-blue-900 p-2 md:p-3 bg-white rounded-md">{pago.tipo_pago_descripcion || '-'}</p>
                </div>
                {/* Información Financiera */}
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-xl mr-3">
                      <CreditCard className="w-6 h-6 text-blue-700" />
                    </div>
                    Información Financiera
                  </h3>
                  {/* Monto destacado con mejor diseño */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-blue-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider text-blue-100 font-bold block mb-2">Monto total</span>
                    <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(pago.monto)}</p>
                    <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3">
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Se paga por</span>
                      <p className="text-blue-900 font-medium">{pago.empresa_a_pagar || '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Nombre del beneficiario</span>
                      <p className="text-blue-900 font-medium">{pago.nombre_persona || '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Solicitante</span>
                      <p className="text-blue-900 font-medium">{typeof pago.nombre_usuario === 'string' && pago.nombre_usuario
                        ? pago.nombre_usuario
                        : typeof pago.usuario_nombre === 'string' && pago.usuario_nombre
                        ? pago.usuario_nombre
                        : '-'}</p>
                    </div>
                    <div className="bg-white p-2 md:p-3 rounded-md">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Departamento</span>
                      <p className="text-blue-900 font-medium">{pago.departamento ? pago.departamento.charAt(0).toUpperCase() + pago.departamento.slice(1).toLowerCase() : '-'}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50/30 rounded-md p-2 md:p-3 border border-blue-100/80 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Información bancaria</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de cuenta</span>
                        <p className="text-blue-900 font-medium">
                          {pago.tipo_cuenta_destino === 'Tarjeta'
                            ? `Tarjeta${pago.tipo_tarjeta ? ' - ' + pago.tipo_tarjeta : ''}`
                            : pago.tipo_cuenta_destino || '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Banco</span>
                        <p className="text-blue-900 font-medium">{pago.banco_destino ? obtenerNombreBanco(pago.banco_destino) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta destino</span>
                        <p className="font-mono text-blue-900 font-medium">{pago.cuenta_destino}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Fecha límite</span>
                        <p className="text-blue-900 font-medium">{
                          pago.fecha_limite_pago
                            ? formatDateForDisplay(pago.fecha_limite_pago)
                            : '-'
                        }</p>
                      </div>
                    </div>
                    {/* Sección: Tipo de Pago */}
                    <div className="mt-4">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de Pago</span>
                      <p className="text-blue-900 font-semibold bg-blue-50 rounded px-3 py-2 inline-block">
                        {pago.tipo_pago ? pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1).replace(/_/g, ' ') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                    <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                      <Building className="w-6 h-6 text-indigo-700" />
                    </div>
                    Información Organizacional
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado actual</span>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-3 bg-green-400 shadow-lg"></div>
                      <p className="font-black text-2xl text-white tracking-tight">{pago.estado.toUpperCase()}</p>
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-20"></div>
                  </div>
                  <div className="bg-blue-50/30 rounded-md p-2 md:p-3 border border-blue-100/80 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Aprobador</h4>
                    <p className="text-blue-900 font-medium">{pago.aprobador_nombre || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
              
              {/* Documentos Adjuntos - 2 columnas */}
              <div className="lg:col-span-2 p-5 md:p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                  <div className="p-2 bg-green-100 rounded-xl mr-3">
                    <FileText className="w-6 h-6 text-green-700" />
                  </div>
                  Documentos Adjuntos
                </h3>
                <div className="space-y-4">
                  {/* Previsualización de factura */}
                  {pago.factura_url ? (() => {
                    let facturaUrl = '';
                    if (pago.factura_url.startsWith('http')) {
                      facturaUrl = pago.factura_url;
                    } else {
                      const rutaArchivo = pago.factura_url.startsWith('/') 
                        ? pago.factura_url 
                        : `/${pago.factura_url}`;
                      facturaUrl = rutaArchivo;
                    }
                    const fileName = facturaUrl.split('/').pop();
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(facturaUrl);
                    const isPdf = /\.pdf$/i.test(facturaUrl);
                    if (isImage) {
                      return (
                        <div className="bg-blue-50/30 p-2 md:p-3 rounded-lg border border-blue-100">
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
                        <div className="bg-white p-0 md:p-0 rounded-xl border border-blue-200 shadow-lg flex flex-col items-center">
                          <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                            <span className="text-sm text-blue-700 font-semibold flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-blue-600" />
                              Previsualización de factura (PDF)
                            </span>
                            <button
                              onClick={() => window.open(facturaUrl, '_blank')}
                              className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition"
                            >
                              Abrir en nueva pestaña <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                          <iframe
                            src={facturaUrl}
                            title={"Factura PDF"}
                            className="w-full rounded-b-xl bg-white border-0"
                            style={{ minHeight: '540px', height: '540px', maxHeight: '70vh' }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-blue-50/30 p-2 md:p-3 rounded-lg border border-blue-100">
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
                  
                  {/* Botones de acción para documentos */}
                  <div className="flex w-full justify-end mt-6">
                    {(pago.factura_url || pago.soporte_url) ? (
                      <div className="flex gap-3 items-end">
                        {pago.factura_url && (
                          <button
                            onClick={() => {
                              let facturaUrl = '';
                              if (pago.factura_url.startsWith('http')) {
                                facturaUrl = pago.factura_url;
                              } else {
                                const rutaArchivo = pago.factura_url.startsWith('/') 
                                  ? pago.factura_url 
                                  : `/${pago.factura_url}`;
                                facturaUrl = rutaArchivo;
                              }
                              window.open(facturaUrl, '_blank');
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Ver Factura
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        {pago.soporte_url && (
                          <button
                            onClick={() => window.open(pago.soporte_url, '_blank')}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Ver Soporte
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                        No hay documentos adjuntos disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Botones de Acción */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-8 border-t border-blue-100">
              <Button
                onClick={onClose}
                className="bg-blue-600 text-white font-bold px-10 py-3 text-lg rounded-xl shadow hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all border-none"
                style={{ boxShadow: '0 2px 8px 0 rgba(30, 64, 175, 0.10)' }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}
