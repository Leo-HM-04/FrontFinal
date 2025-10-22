import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/Button';
import type { Solicitud } from '@/types/index';
import { FileText, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { detectarPlantillaId } from '@/utils/plantillasLabels';
import { PlantillaComisionesDetailModal } from '@/components/plantillas/PlantillaComisionesDetailModal';
import { SolicitudComisionesData } from '@/types/plantillaComisiones';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';

interface PagoDetailModalProps {
  isOpen: boolean;
  pago: Solicitud | null;
  onClose: () => void;
}

export function PagoDetailModal({ isOpen, pago, onClose }: PagoDetailModalProps) {
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [errorArchivos, setErrorArchivos] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArchivos() {
      if (!pago) return;
      setLoadingArchivos(true);
      setErrorArchivos(null);
      try {
        const data = await SolicitudArchivosService.obtenerArchivos(pago.id_solicitud);
        setArchivos(data);
      } catch {
        setErrorArchivos('Error al cargar archivos adjuntos');
      } finally {
        setLoadingArchivos(false);
      }
    }
    if (isOpen && pago) {
      fetchArchivos();
    }
    if (!isOpen) {
      setArchivos([]);
      setLoadingArchivos(false);
      setErrorArchivos(null);
    }
  }, [isOpen, pago]);

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
          // Campos REALES de la tabla solicitudes_pago (requeridos)
          concepto: pago.concepto || '',
          empresa_a_pagar: plantillaData.empresa_a_pagar || pago.empresa_a_pagar || '',
          nombre_persona: plantillaData.nombre_persona || pago.nombre_persona || '',
          fecha_limite_pago: plantillaData.fecha_limite_pago || pago.fecha_limite_pago || '',
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
        // Campos REALES de la tabla solicitudes_pago (requeridos)
        concepto: pago.concepto || '',
        empresa_a_pagar: pago.empresa_a_pagar || '',
        nombre_persona: pago.nombre_persona || '',
        fecha_limite_pago: pago.fecha_limite_pago || '',
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

  // --- Nuevo diseño igual al modal de TUKASH ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} role="button" tabIndex={-1} aria-label="Cerrar modal" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
        <button onClick={onClose} className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Cerrar modal">
          <span className="sr-only">Cerrar</span>
          ×
        </button>
        <div className="flex flex-row gap-6 overflow-y-auto max-h-[96vh] p-4 sm:p-6">
          {/* Columna izquierda: Información */}
          <div className="flex-1 min-w-0">
            <header className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 text-white p-4 rounded-xl mb-6 flex items-center gap-4 shadow-md">
              <div className="bg-white/20 p-3 rounded-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>PAGO #{pago.id_solicitud}</span>
                </h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-blue-100 text-sm"><FileText className="w-4 h-4" />Folio: {pago.folio || '-'}</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 bg-white/80 text-blue-700 border-blue-300 shadow-sm flex items-center gap-2`}>
                {pago.estado ? pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1) : 'Pendiente'}
              </span>
            </header>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Concepto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">{pago.concepto || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">{pago.tipo_pago_descripcion || '-'}</div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" />Información Financiera</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Monto: {formatCurrency(pago.monto)}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Beneficiario: {pago.nombre_persona || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Solicitante: {pago.nombre_usuario || pago.usuario_nombre || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Departamento: {pago.departamento || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Banco: {pago.banco_destino || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Cuenta destino: {pago.cuenta_destino || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Tipo de cuenta: {pago.tipo_cuenta_destino || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Fecha límite: {pago.fecha_limite_pago ? formatDateForDisplay(pago.fecha_limite_pago) : '-'}</div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Organizacional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Aprobador: {pago.aprobador_nombre || '-'}</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-black">Estado: {pago.estado ? pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1) : '-'}</div>
              </div>
            </div>
          </div>
          {/* Columna derecha: Previsualización de factura y archivos adjuntos */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-start">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 w-full">Archivos Adjuntos</h3>
            <div className="w-full flex flex-col items-center justify-center">
              {loadingArchivos && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando archivos...</p>
                </div>
              )}
              {errorArchivos && (
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errorArchivos}</p>
                    </div>
                  </div>
                </div>
              )}
              {!loadingArchivos && !errorArchivos && (
                <div className="flex flex-col items-center justify-center w-full">
                  {/* Mostrar factura adjunta si existe */}
                  {pago.factura_url && (
                    <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full mb-6">
                      <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                        {pago.factura_url.endsWith('.pdf') ? (
                          <iframe
                            src={pago.factura_url}
                            title="Factura PDF"
                            className="w-full h-full rounded-lg border border-blue-200"
                            style={{ minHeight: '420px', height: '420px' }}
                          />
                        ) : (
                          <Image
                            src={pago.factura_url}
                            alt="Factura Adjunta"
                            className="object-contain w-full h-full rounded-lg shadow-sm"
                            style={{ maxHeight: '420px', width: '100%' }}
                            width={800}
                            height={420}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="p-5 flex justify-end">
                        <button
                          onClick={() => window.open(pago.factura_url, '_blank')}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs"
                        >
                          Ver completo
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Mostrar otros archivos adjuntos */}
                  {archivos && archivos.length > 0 ? (
                    archivos.map((archivo) => {
                      const extension = archivo.archivo_url?.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                      const isPdf = extension === 'pdf';
                      const fileUrl = archivo.archivo_url.startsWith('http') ? archivo.archivo_url : `https://bechapra.com.mx${archivo.archivo_url.startsWith('/') ? '' : '/'}${archivo.archivo_url}`;
                      return (
                        <div key={archivo.id} className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full mb-6">
                          <div className="relative h-[420px] bg-gray-50 flex items-center justify-center">
                            {isPdf ? (
                              <iframe
                                src={fileUrl}
                                title={archivo.tipo || 'Archivo PDF'}
                                className="w-full h-full rounded-lg border border-blue-200"
                                style={{ minHeight: '420px', height: '420px' }}
                              />
                            ) : isImage ? (
                              <Image
                                src={fileUrl}
                                alt={archivo.tipo || 'Archivo adjunto'}
                                className="object-contain w-full h-full rounded-lg shadow-sm"
                                style={{ maxHeight: '420px', width: '100%' }}
                                width={800}
                                height={420}
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                unoptimized
                              />
                            ) : (
                              <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No se puede previsualizar este archivo</p>
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex justify-end">
                            <button
                              onClick={() => window.open(fileUrl, '_blank')}
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-xs"
                            >
                              Ver completo
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    !pago.factura_url && (
                      <div className="text-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 w-full">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">No hay archivos adjuntos disponibles</p>
                        <p className="text-gray-500 text-sm mt-2">Los documentos aparecerán aquí cuando sean cargados</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
