"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { Eye, User, Building2, DollarSign, Banknote, FileText, Calendar, Repeat, BadgeCheck, PauseCircle, MessageCircle, FileImage, FileCheck2, FileWarning, FileX2 } from 'lucide-react';
import SimpleModal from '@/components/ui/SimpleModal';

export default function PagadorRecurrentesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<PlantillaRecurrente | null>(null);
  const handleView = (rec: PlantillaRecurrente) => {
    setSelected(rec);
    setModalOpen(true);
  };
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerAprobadasParaPagador();
        setRecurrentes(data);
      } catch {
        setRecurrentes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecurrentes();
  }, []);

  // Helper for modal file preview
  let cleanFile = '';
  let fileUrl = '';
  if (selected && selected.fact_recurrente) {
    cleanFile = selected.fact_recurrente.replace(/^[/\\]*uploads[/\\]*recurrente[/\\]*/i, '');
    fileUrl = `http://localhost:4000/uploads/recurrente/${cleanFile}`;
  }

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">Pagos Recurrentes</h1>
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-200">
            {loading ? (
              <div className="text-center py-8 text-blue-700">Cargando solicitudes recurrentes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-blue-200 rounded-xl overflow-hidden text-[15px]">
                  <thead className="sticky top-0 z-10 shadow bg-blue-700/95 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Departamento</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Frecuencia</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-white uppercase tracking-wider">Activa</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Siguiente Fecha</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-white uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurrentes.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-blue-600 font-semibold">No hay pagos recurrentes aprobados.</td>
                      </tr>
                    ) : (
                      recurrentes.map((p, idx) => (
                        <tr
                          key={p.id_recurrente}
                          className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 hover:shadow-md`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-base font-extrabold text-blue-900">#{p.id_recurrente}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900">{p.nombre_usuario || `Usuario ${p.id_usuario}`}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-900">{p.departamento}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800">{Number(p.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800">{p.cuenta_destino}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.concepto}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.tipo_pago}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.frecuencia}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${p.estado === 'aprobada' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                              {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                            {p.activo ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 shadow-sm"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>Activo</span> : <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>Inactivo</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900 font-medium">{p.siguiente_fecha ? new Date(p.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium flex gap-2 justify-center">
                            <button
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full transition-colors duration-150 group-hover:scale-110"
                              title="Ver Detalle"
                              onClick={() => handleView(p)}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Modal fuera de la tabla */}
                <SimpleModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Detalle de Pago Recurrente">
                  {selected && (
                    <div className="space-y-4 text-blue-900 text-[15px] max-w-3xl w-full mx-auto p-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">ID:</span> #{selected.id_recurrente}</div>
                        <div className="flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Solicitante:</span> {selected.nombre_usuario || `Usuario ${selected.id_usuario}`}</div>
                        <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Departamento:</span> {selected.departamento}</div>
                        <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /><span className="font-semibold text-blue-700">Monto:</span> <span className="font-bold text-green-700">{Number(selected.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span></div>
                        <div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Cuenta Destino:</span> {selected.cuenta_destino}</div>
                        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Concepto:</span> {selected.concepto}</div>
                        <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Tipo Pago:</span> {selected.tipo_pago}</div>
                        <div className="flex items-center gap-2"><Repeat className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Frecuencia:</span> {selected.frecuencia}</div>
                        <div className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-500" /><span className="font-semibold text-blue-700">Estado:</span> <span className={`font-bold ${selected.estado === 'aprobada' ? 'text-yellow-700' : selected.estado === 'rechazada' ? 'text-red-700' : 'text-gray-700'}`}>{selected.estado}</span></div>
                        <div className="flex items-center gap-2">{selected.activo ? <PauseCircle className="w-5 h-5 text-green-600" /> : <PauseCircle className="w-5 h-5 text-red-600" />}<span className="font-semibold text-blue-700">Activa:</span> {selected.activo ? <span className="text-green-700 font-bold">Sí</span> : <span className="text-red-700 font-bold">No</span>}</div>
                        <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Siguiente Fecha:</span> {selected.siguiente_fecha ? new Date(selected.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
                        <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-500" /><span className="font-semibold text-blue-700">Comentario Aprobador:</span> {selected.comentario_aprobador || '-'}</div>
                      </div>
                      {selected.fact_recurrente && (
                        <div className="mt-4 w-full">
                          <div className="flex items-center gap-2 font-semibold text-blue-700 mb-1"><FileImage className="w-5 h-5 text-blue-500" />Factura:</div>
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 flex flex-col items-center w-full">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 underline font-medium mb-1 flex items-center gap-1"
                            >
                              <FileCheck2 className="w-4 h-4" /> Ver archivo de factura
                            </a>
                            {/(.png|jpg|jpeg|gif)$/i.test(cleanFile) ? (
                              <div className="relative w-full flex justify-center mt-1">
                                <Image
                                  src={fileUrl}
                                  alt="Factura recurrente"
                                  width={400}
                                  height={192}
                                  className="max-h-48 rounded shadow border object-contain"
                                  style={{ width: 'auto', height: '12rem', maxWidth: '100%' }}
                                />
                              </div>
                            ) : /\.pdf$/i.test(cleanFile) ? (
                              <object
                                data={fileUrl}
                                type="application/pdf"
                                className="w-full h-48 rounded border mt-1 bg-white"
                              >
                                <div className="flex flex-col items-center justify-center h-48 text-center text-blue-700">
                                  <FileWarning className="w-8 h-8 mb-2 text-yellow-500" />
                                  <span>No se pudo previsualizar el PDF aquí.<br />
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Abrir factura en otra pestaña</a></span>
                                </div>
                              </object>
                            ) : (
                              <div className="flex flex-col items-center text-red-600 mt-1">
                                <FileX2 className="w-6 h-6 mb-1" />
                                <span>Tipo de archivo no soportado para previsualización.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SimpleModal>
              </div>
            )}
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );

}