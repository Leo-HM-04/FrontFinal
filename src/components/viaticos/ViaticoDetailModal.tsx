'use client';

import { useState, useEffect, useRef } from 'react';
import type { Viatico } from '@/hooks/useViaticos';
import { CreditCard, FileText, Building, ExternalLink, MapPin, Calendar, DollarSign, X, CheckCircle } from 'lucide-react';
import { formatDateForDisplay } from '@/utils/dateUtils';

import { ComprobantesGastoViaticoService } from '@/services/comprobantesGastoViatico.service';
import { getAuthToken } from '@/utils/auth';

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
  const [gastoComprobantes, setGastoComprobantes] = useState<ComprobanteViatico[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar comprobantes de pago (pagador)
  useEffect(() => {
    const fetchComprobantes = async () => {
      if (!viatico || viatico.estado?.toLowerCase() !== 'pagada') return;
      try {
        const token = getAuthToken();
        const response = await fetch(`/api/comprobantes-viaticos/${viatico.id_viatico}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const data = await response.json();
          setComprobantes(Array.isArray(data) ? data : []);
        }
      } catch {
        // Error silenciado
      }
    };
    if (isOpen && viatico) fetchComprobantes();
  }, [isOpen, viatico]);

  // Cargar comprobantes de gasto (nuevo módulo)
  useEffect(() => {
    const fetchGastoComprobantes = async () => {
      if (!viatico || viatico.estado?.toLowerCase() !== 'pagada') return;
      try {
        const token = getAuthToken();
        const data = await ComprobantesGastoViaticoService.list(viatico.id_viatico, token);
        setGastoComprobantes(Array.isArray(data) ? data : []);
      } catch (error) {
        setGastoComprobantes([]);
      }
    };
    if (isOpen && viatico) fetchGastoComprobantes();
  }, [isOpen, viatico, successMsg]);

  const handleUploadGastoComprobantes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!viatico || !e.target.files) return;
    setUploading(true);
    setUploadError(null);
    setSuccessMsg(null);
    const files = Array.from(e.target.files);
    let successCount = 0;
    const token = getAuthToken();
    for (const file of files) {
      try {
        await ComprobantesGastoViaticoService.upload(viatico.id_viatico, file, token);
        successCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error al subir comprobante';
        setUploadError(errorMsg);
      }
    }
    setUploading(false);
    if (successCount > 0) {
      setSuccessMsg(`${successCount} comprobante(s) subido(s) correctamente.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteGastoComprobante = async (id_comprobante: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este comprobante de gasto?')) return;
    try {
      const token = getAuthToken();
      await ComprobantesGastoViaticoService.delete(id_comprobante, token);
      setSuccessMsg('Comprobante eliminado correctamente.');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar comprobante';
      setUploadError(errorMsg);
    }
  };

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

          {/* Eliminar duplicados: solo debe haber UNA sección de comprobantes de gasto en el modal */}
          {/* Botón cerrar flotante */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Header con gradiente y estado */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white px-8 py-6 md:py-8 rounded-2xl relative overflow-hidden mb-8">
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
                <p className="text-blue-200 mt-2 flex items-center">
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
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-xl mr-3">
                      <Building className="w-6 h-6 text-blue-700" />
                    </div>
                    Información del Beneficiario
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Beneficiario</span>
                      <p className="text-blue-900 font-semibold text-lg">{viatico.nombre_persona || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Departamento</span>
                      <p className="text-blue-900 font-medium capitalize">{viatico.departamento || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-md border border-blue-100 md:col-span-2">
                      <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Tipo de pago</span>
                      <p className="text-blue-900 font-medium">{viatico.tipo_pago || '-'}</p>
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
                <div className="p-5 md:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl mb-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-xl mr-3">
                      <MapPin className="w-6 h-6 text-blue-700" />
                    </div>
                    Estado y Propósito
                  </h3>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 rounded-2xl border border-blue-300/50 mb-6 shadow-lg">
                    <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-blue-100">Estado actual</span>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-3 bg-green-400 shadow-lg"></div>
                      <p className="font-black text-2xl text-white tracking-tight">{viatico.estado.toUpperCase()}</p>
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-400 to-green-300 rounded-full w-20"></div>
                  </div>
                  
                  {/* Propósito del viático */}
                  <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Propósito del viático</h4>
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <p className="text-blue-900 font-medium leading-relaxed">{viatico.concepto || '-'}</p>
                    </div>
                  </div>
                  
                  {/* Descripción del tipo de pago */}
                  {viatico.tipo_pago_descripcion && (
                    <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80 mt-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Descripción</h4>
                      <div className="bg-white p-3 rounded-md border border-blue-100">
                        <p className="text-blue-900 font-medium">{viatico.tipo_pago_descripcion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Documentos y Comprobantes - UNIFICADA Y CORREGIDA */}
            <div className="w-full p-6 md:p-8 bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-lg rounded-3xl">
              <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl mr-4">
                  <FileText className="w-8 h-8 text-orange-700" />
                </div>
                Documentos y Comprobantes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Archivo del Solicitante */}
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center">
                  <div className="p-3 bg-orange-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-center">Documento del Solicitante</h4>
                  <div className="text-sm text-center text-gray-600 mb-4 truncate w-full px-2">
                    {viatico.viatico_url ? viatico.viatico_url.split('/').pop() : 'Sin archivo disponible'}
                  </div>
                  {viatico.viatico_url ? (
                    <a
                      href={`/uploads/viaticos/${viatico.viatico_url.split('/').pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors duration-200 text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver archivo
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded-lg">No disponible</span>
                  )}
                </div>

                {/* Comprobantes de Pago del Pagador */}
                {viatico.estado?.toLowerCase() === 'pagada' && comprobantes.length > 0 && (
                  comprobantes.map((comprobante) => (
                    <div key={comprobante.id_comprobante} className="bg-white p-6 rounded-2xl border border-green-100 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center">
                      <div className="p-3 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2 text-center">Comprobante de Pago</h4>
                      <div className="text-sm text-center text-gray-600 mb-4 truncate w-full px-2">
                        {comprobante.archivo_url ? comprobante.archivo_url.split('/').pop() : 'Sin archivo'}
                      </div>
                      <a
                        href={`/uploads/comprobantes-viaticos/${comprobante.archivo_url.split('/').pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver comprobante
                      </a>
                    </div>
                  ))
                )}

                {/* Mensaje si no hay comprobantes y está pagado */}
                {viatico.estado?.toLowerCase() === 'pagada' && comprobantes.length === 0 && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center flex flex-col items-center justify-center">
                    <div className="p-3 bg-gray-200 rounded-full mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-semibold text-gray-600 mb-2">Sin Comprobantes</h4>
                    <p className="text-gray-500 text-sm">No hay comprobantes de pago disponibles</p>
                  </div>
                )}

                {/* Mensaje informativo para estados no pagados */}
                {viatico.estado?.toLowerCase() !== 'pagada' && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 text-center flex flex-col items-center justify-center md:col-span-2 lg:col-span-1">
                    <div className="p-3 bg-blue-100 rounded-full mb-4">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-blue-800 mb-2">Comprobantes Pendientes</h4>
                    <p className="text-blue-700 text-sm text-center leading-relaxed">
                      Los comprobantes de pago aparecerán aquí una vez que el viático sea marcado como pagado
                    </p>
                  </div>
                )}
              </div>
            </div>

             {/* SIEMPRE visible arriba si pagada: sección para subir y mostrar comprobantes de gasto */}
            {viatico.estado?.toLowerCase() === 'pagada' && (
              <div className="w-full p-6 md:p-8 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg rounded-3xl mb-8">
                <h4 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Comprobantes de Gasto (Viático)
                </h4>
                <form className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                  <label className="inline-block cursor-pointer px-6 py-2 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition-colors text-base">
                    Elegir comprobantes
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      ref={fileInputRef}
                      disabled={uploading}
                      onChange={handleUploadGastoComprobantes}
                      className="hidden"
                    />
                  </label>
                  {uploading && <span className="text-green-700 animate-pulse ml-2">Subiendo...</span>}
                </form>
                {uploadError && <div className="text-red-600 mb-2">{uploadError}</div>}
                {successMsg && <div className="text-green-700 mb-2">{successMsg}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gastoComprobantes.length === 0 && (
                    <div className="text-gray-500 col-span-full">No hay comprobantes de gasto subidos.</div>
                  )}
                  {gastoComprobantes.map((comp) => (
                    <div key={comp.id_comprobante} className="bg-white p-4 rounded-xl border border-green-100 shadow flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-green-900 font-medium text-sm truncate max-w-[160px]">{comp.archivo_url.split('/').pop()}</span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/uploads/comprobantes_gasto_viatico/${comp.archivo_url.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-semibold"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" /> Ver
                        </a>
                        <button
                          onClick={() => handleDeleteGastoComprobante(comp.id_comprobante)}
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Subido: {formatDateForDisplay(comp.fecha_subida)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}