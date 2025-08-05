"use client";

import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useViaticosPagados } from '@/hooks/useViaticos';
import SubirComprobanteViaticoModal from '@/components/viaticos/SubirComprobanteViaticoModal';
import { subirComprobanteViatico, getComprobantesPorViatico } from '@/services/comprobantesViaticos.service';
import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';

export default function ComprobantesViaticosPage() {
  const { viaticos, loading, error, refetch } = useViaticosPagados();
  const { token } = useAuth(); // Obtén el token JWT del contexto de autenticación
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedViaticoId, setSelectedViaticoId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const paginatedViaticos = viaticos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(viaticos.length / itemsPerPage);
  const [comprobantes, setComprobantes] = useState<{ [id: number]: string | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; viaticoId: number | null }>({ open: false, viaticoId: null });
  const [successNotification, setSuccessNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    const fetchComprobantes = async () => {
      if (!token) return;
      
      const comprobantesObj: { [id: number]: string | null } = {};
      for (const v of viaticos) {
        try {
          const res = await getComprobantesPorViatico(v.id_viatico, token);
          comprobantesObj[v.id_viatico] = res.length > 0 ? res[0].archivo_url : null;
        } catch {
          comprobantesObj[v.id_viatico] = null;
        }
      }
      setComprobantes(comprobantesObj);
    };
    if (viaticos.length > 0) fetchComprobantes();
  }, [viaticos, token]);

  const handleOpenModal = (id: number) => {
    setSelectedViaticoId(id);
    setModalOpen(true);
    setUploadError(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedViaticoId(null);
    setUploadError(null);
  };

  const handleSubmitComprobante = async (file: File, viaticoId: number) => {
    try {
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      await subirComprobanteViatico(viaticoId, file, token);
      setSuccessNotification({ show: true, message: 'Comprobante subido correctamente' });
      // Ocultar la notificación después de 5 segundos
      setTimeout(() => {
        setSuccessNotification({ show: false, message: '' });
      }, 5000);
      refetch();
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir comprobante';
      setUploadError(errorMessage);
      throw err;
    }
  };

  return (
    <ProtectedRoute requiredRoles={["pagador_banca"]}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto py-10 px-4">
          <h1 className="text-3xl font-extrabold text-white mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Comprobantes de Viáticos
          </h1>
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-blue-900 tracking-tight">Solicitudes ya pagadas</h2>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {viaticos.length} registros
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-blue-600 animate-pulse">
                <span className="loader mr-2" />Cargando...
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-4">{error}</div>
            ) : viaticos.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No hay viáticos pagados.</div>
            ) : (
              <>
                {successNotification.show && (
                  <div className="mb-6 flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-700 font-medium">{successNotification.message}</span>
                    <button 
                      onClick={() => setSuccessNotification({ show: false, message: '' })}
                      className="ml-auto text-green-700 hover:text-green-900"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Comprobantes de Viáticos
                </h2>
                <div className="rounded-xl overflow-hidden shadow-lg border border-blue-100 w-full">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider w-1/12 border-r border-blue-400">Folio</th>
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider w-2/12 border-r border-blue-400">Departamento</th>
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider w-1/12 text-right border-r border-blue-400">Monto</th>
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider w-3/12 pl-4 border-r border-blue-400">Concepto</th>
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider w-3/12 border-r border-blue-400">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Fecha de pago
                            </div>
                          </th>
                          <th className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider text-center w-2/12">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedViaticos.map((v, i) => (
                          <tr 
                            key={v.id_viatico} 
                            className={`${i % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-all duration-150 border-b border-blue-100 last:border-0`}
                          >
                            <td className="px-5 py-2.5 font-mono text-blue-900 font-medium">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                {v.folio || "—"}
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-blue-800 font-medium truncate">
                              <div className="flex items-center border-r border-blue-100 pr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {v.departamento ? 
                                  v.departamento.toLowerCase() === "ti" ? "TI" : 
                                  v.departamento.charAt(0).toUpperCase() + v.departamento.slice(1).toLowerCase() : 
                                  "—"}
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-blue-900 font-bold">
                              <div className="flex items-center justify-end border-r border-blue-100 pr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {v.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-blue-800 truncate max-w-xs pl-4">
                              <div className="flex items-center border-r border-blue-100 pr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {v.concepto || "—"}
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-blue-700 font-medium">
                              {v.fecha_limite_pago ? (
                                <div className="flex items-center border-r border-blue-100 pr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {(() => {
                                    const fecha = new Date(v.fecha_limite_pago);
                                    const day = fecha.getDate().toString().padStart(2, '0');
                                    const month = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(fecha);
                                    const year = fecha.getFullYear();
                                    return (
                                      <span>
                                        <span className="text-blue-500 font-semibold">{day}</span> {month} <span>{year}</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              {comprobantes[v.id_viatico] ? (
                                <button
                                  className="px-3 py-1 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition font-medium focus:outline-none focus:ring-1 focus:ring-green-400 text-xs flex items-center justify-center mx-auto"
                                  onClick={() => {
                                    setVerComprobante({ open: true, viaticoId: v.id_viatico });
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver
                                </button>
                              ) : (
                                <button
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs flex items-center justify-center mx-auto"
                                  onClick={() => handleOpenModal(v.id_viatico)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Subir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {uploadError && <div className="text-red-600 text-center mt-2">{uploadError}</div>}
                </div>
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={viaticos.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
                {/* Modal para ver comprobante */}
                {verComprobante.open && verComprobante.viaticoId && comprobantes[verComprobante.viaticoId] && (() => {
                  const comprobantePath = comprobantes[verComprobante.viaticoId];
                  if (!comprobantePath) return null;
                  let src = comprobantePath;
                  if (!/^https?:\/\//i.test(comprobantePath)) {
                    const fileName = comprobantePath.replace(/^.*uploads[\/\\]comprobante-viaticos[\/\\]/i, "");
                    src = `http://localhost:4000/uploads/comprobante-viaticos/${fileName}`;
                  }
                  window.open(src, '_blank', 'noopener,noreferrer');
                  setVerComprobante({ open: false, viaticoId: null });
                  return null;
                })()}
              </>
            )}
            <SubirComprobanteViaticoModal
              open={modalOpen}
              viaticoId={selectedViaticoId}
              onClose={handleCloseModal}
              onSubmit={handleSubmitComprobante}
            />
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
