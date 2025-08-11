import React from 'react';
import Image from 'next/image';
import { DollarSign, Building2, FileText, FileImage, FileCheck2, BadgeCheck, Calendar, FileX2 } from 'lucide-react';

interface Recurrente {
  id_recurrente: number;
  fact_recurrente?: string;
  nombre_usuario?: string;
  id_usuario?: number;
  siguiente_fecha?: string;
  estado?: string;
  monto?: number;
  cuenta_destino?: string;
  departamento?: string;
  concepto?: string;
  comentario?: string;
}

interface RecurrenteDetailModalProps {
  recurrente: Recurrente | null;
  isOpen: boolean;
  onClose: () => void;
}

function capitalizeWords(str: string) {
  if (!str) return '';
  if (str.trim().toLowerCase() === 'ti') return 'TI';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export const RecurrenteDetailModal: React.FC<RecurrenteDetailModalProps> = ({ recurrente, isOpen, onClose }) => {
  if (!isOpen || !recurrente) return null;

  let cleanFile = '';
  let fileUrl = '';
  if (recurrente && recurrente.fact_recurrente) {
    cleanFile = recurrente.fact_recurrente.replace(/^[/\\]*uploads[/\\]*recurrente[/\\]*/i, '');
    fileUrl = `http://46.202.177.106:4000/uploads/recurrente/${cleanFile}`;
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro/transparente */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        {/* Scroll interno */}
        <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
          {/* Botón de cerrar flotante */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            aria-label="Cerrar"
          >
            <FileX2 className="w-6 h-6" />
          </button>
          {/* Header con degradado y decoraciones */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">
                  Pago Recurrente #{recurrente.id_recurrente}
                </h2>
                <p className="text-blue-100 text-lg">
                  Solicitante: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md">{recurrente.nombre_usuario || `Usuario ${recurrente.id_usuario}`}</span>
                </p>
                <p className="text-blue-200 mt-2">
                  Creado el {recurrente.siguiente_fecha ? new Date(recurrente.siguiente_fecha).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-4 py-2 text-lg font-bold rounded-xl border-2 ${recurrente.estado === 'aprobada' ? 'bg-green-100 text-green-800 border-green-300' : recurrente.estado === 'pagada' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'} backdrop-blur-sm`}>
                  {recurrente.estado?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-xl mr-3">
                    <DollarSign className="w-6 h-6 text-blue-700" />
                  </div>
                  Información Financiera
                </h3>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-blue-300/50 mb-6 shadow-lg">
                  <span className="text-sm uppercase tracking-wider text-blue-100 font-bold block mb-2">Monto total</span>
                  <p className="text-4xl font-black text-white tracking-tight">{Number(recurrente.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                  <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-white p-2 rounded-md">
                    <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Cuenta Destino</span>
                    <p className="text-blue-900 font-medium">{recurrente.cuenta_destino}</p>
                  </div>
                  <div className="bg-white p-2 rounded-md">
                    <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">Fecha Límite</span>
                    <p className="text-blue-900 font-medium">{recurrente.siguiente_fecha ? new Date(recurrente.siguiente_fecha).toLocaleDateString('es-MX') : '-'}</p>
                  </div>
                  
                </div>
                            {/* Estado y otros datos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-md rounded-md p-3 border border-blue-100 flex items-center mb-2 shadow">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <BadgeCheck className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-blue-700/70">ID de Recurrente</p>
                  <p className="text-sm font-medium text-blue-900">#{recurrente.id_recurrente}</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-md rounded-md p-3 border border-blue-100 flex items-center mb-2 shadow">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-blue-700/70">Siguiente Fecha</p>
                  <p className="text-sm font-medium text-blue-900">{recurrente.siguiente_fecha ? new Date(recurrente.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                </div>
              </div>
            </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                    <Building2 className="w-6 h-6 text-indigo-700" />
                  </div>
                  Información Organizacional
                </h3>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                  <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Departamento</span>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full mr-3 bg-yellow-400 shadow-lg"></div>
                    <p className="font-black text-2xl text-white tracking-tight">{capitalizeWords(recurrente.departamento || "")}</p>
                  </div>
                  <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-20"></div>
                </div>
                <div className="bg-blue-50/30 rounded-md p-3 border border-blue-100/80 mb-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Solicitante</h4>
                  <p className="text-blue-900 font-medium">{recurrente.nombre_usuario || '-'}</p>
                </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 bg-green-100 rounded-lg"><FileText className="w-4 h-4 text-green-700" /></span>
                  <span className="text-base font-semibold text-green-900">Concepto</span>
                </div>
                <div className="w-full bg-green-50 rounded border border-green-100 px-2 py-1 text-sm text-green-900 font-normal">
                  {recurrente.concepto || <span className="italic text-gray-400">Sin concepto</span>}
                </div>
              </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 mb-8">
              {/* Documento Adjunto Mejorado */}
              <div className="p-8 bg-gradient-to-br from-purple-50/80 to-white border border-purple-200/60 shadow-xl rounded-3xl flex flex-col justify-between  ">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-200 rounded-2xl mr-4 shadow-lg">
                    <FileImage className="w-8 h-8 text-blue-700" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-blue-900 tracking-tight">Documento Adjunto</h3>
                </div>
                {recurrente.fact_recurrente ? (
                  <div className="space-y-4">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-blue-400 rounded-xl text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 shadow transition text-base mb-2"
                    >
                      <FileCheck2 className="w-5 h-5" /> Ver archivo de factura
                    </a>
                    {/* Comentario destacado si existe */}
                    {recurrente.comentario && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 rounded-xl p-4 shadow flex items-start gap-3">
                        <span className="text-blue-500 font-bold text-xl">💬</span>
                        <div>
                          <span className="block text-blue-900 font-semibold text-base mb-1">Comentario:</span>
                          <span className="text-blue-800 italic text-base">{recurrente.comentario}</span>
                        </div>
                      </div>
                    )}
                    {/* Previsualización PDF/imagen mejorada */}
                    <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-2xl border-2 border-blue-200 shadow-xl flex flex-col items-center">
                      {/(.png|jpg|jpeg|gif)$/i.test(cleanFile) ? (
                        <div className="w-full flex justify-center">
                          <Image
                            src={fileUrl}
                            alt="Factura recurrente"
                            width={400}
                            height={192}
                            className="max-h-56 rounded-xl border-2 border-blue-200 shadow object-contain bg-white"
                            style={{ width: 'auto', height: '14rem', maxWidth: '100%' }}
                          />
                        </div>
                      ) : /\.pdf$/i.test(cleanFile) ? (
                        <div className="w-full flex flex-col items-center">
                          <object
                            data={fileUrl}
                            type="application/pdf"
                            className="w-full rounded-xl border-2 border-blue-300 shadow bg-white"
                            style={{ minHeight: '320px', height: '320px', maxHeight: '50vh' }}
                          >
                            <div className="flex flex-col items-center justify-center h-48 text-center text-blue-700">
                              <span>No se pudo previsualizar el PDF aquí.<br />
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Abrir factura en otra pestaña</a>
                              </span>
                            </div>
                          </object>
                          <span className="text-xs text-blue-500 mt-2">Puedes hacer zoom y desplazarte en el PDF. Haz clic en el botón para abrirlo completo.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-red-600 mt-1">
                          <FileX2 className="w-6 h-6 mb-1" />
                          <span>Tipo de archivo no soportado para previsualización.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/90 p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
                    <FileImage className="w-6 h-6 text-gray-400" />
                    <div>
                      <span className="text-base text-gray-500 font-medium block">No hay factura adjunta</span>
                      <span className="text-xs text-gray-400">No se adjuntó documento para este pago recurrente</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
