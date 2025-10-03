"use client";

import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useViaticosPagados } from '@/hooks/useViaticos';
import SubirComprobanteViaticoModal from '@/components/viaticos/SubirComprobanteViaticoModal';
import { ViaticoDetailModal } from '@/components/viaticos/ViaticoDetailModal';
import { subirComprobanteViatico, getComprobantesPorViatico } from '@/services/comprobantesViaticos.service';
import { Viatico } from '@/services/viaticos.service';
import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';

export default function ComprobantesViaticosPage() {
  const { viaticos, loading, error, refetch } = useViaticosPagados();
  const { token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedViaticoId, setSelectedViaticoId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [comprobantes, setComprobantes] = useState<{ [id: number]: string | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; viaticoId: number | null }>({ open: false, viaticoId: null });
  const [successNotification, setSuccessNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [modalViaticoOpen, setModalViaticoOpen] = useState(false);
  const [viaticoDetalle, setViaticoDetalle] = useState<Viatico | null>(null);

  // Filtrar y ordenar: primero sin comprobantes, luego con comprobantes
  const viaticosFiltrados = viaticos
    .filter(v => departamentoFiltro === 'todos' || v.departamento === departamentoFiltro)
    .sort((a, b) => {
      const aHasComprobante = comprobantes[a.id_viatico] ? 1 : 0;
      const bHasComprobante = comprobantes[b.id_viatico] ? 1 : 0;
      // Ordenar: sin comprobantes (0) antes que con comprobantes (1)
      return aHasComprobante - bHasComprobante;
    });
  
  const paginatedViaticos = viaticosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(viaticosFiltrados.length / itemsPerPage);

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
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 sm:px-10 py-4 sm:py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px] mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-3xl font-extrabold text-white text-center tracking-tight">Subir Comprobante - Viáticos</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-2 sm:px-4 py-4 sm:py-6 border border-white/20 flex-1 flex flex-col min-w-[260px] w-full">
            {/* Filtros y estadísticas */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center w-full mb-4 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-2 border border-blue-200">
                  <label htmlFor="departamentoFiltro" className="text-blue-700 text-sm font-medium">Departamento:</label>
                  <select
                    id="departamentoFiltro"
                    value={departamentoFiltro}
                    onChange={e => { setDepartamentoFiltro(e.target.value); setCurrentPage(1); }}
                    className="min-w-[120px] bg-white border border-blue-200 rounded-md px-2 py-1 text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
                  >
                    <option value="todos">Todos</option>
                    {[...new Set(viaticos.map(v => v.departamento).filter(Boolean))].map(dep => (
                      <option key={dep} value={dep}>{dep ? dep.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</option>
                    ))}
                  </select>
                </div>
                
                {/* Indicadores de estado */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">
                      Sin comprobante: {viaticosFiltrados.filter(v => !comprobantes[v.id_viatico]).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">
                      Con comprobante: {viaticosFiltrados.filter(v => comprobantes[v.id_viatico]).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
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

                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden w-full">
                  {/* Vista de tabla para pantallas grandes */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100">
                      <thead style={{ backgroundColor: "#F0F4FC" }}>
                        <tr>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Estado</th>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Folio</th>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                          <th className="px-3 lg:px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha</th>
                          <th className="px-3 lg:px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/60 divide-y divide-blue-50">
                        {paginatedViaticos.map((v, i) => {
                          const hasComprobante = comprobantes[v.id_viatico];
                          const rowBgClass = hasComprobante 
                            ? (i % 2 === 0 ? 'bg-green-50' : 'bg-white') 
                            : (i % 2 === 0 ? 'bg-red-50' : 'bg-red-25');
                          
                          return (
                            <tr key={v.id_viatico} className={`transition-colors rounded-xl ${rowBgClass} hover:bg-blue-100 ${!hasComprobante ? 'border-l-4 border-red-400' : 'border-l-4 border-green-400'}`}>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${hasComprobante ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className={`text-xs font-semibold ${hasComprobante ? 'text-green-700' : 'text-red-700'}`}>
                                    {hasComprobante ? 'Con comprobante' : 'Sin comprobante'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{v.folio || '—'}</td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                <span className="px-2 lg:px-3 py-1 text-xs lg:text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">
                                  {v.departamento ? v.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}
                                </span>
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-blue-800 font-bold">
                                {Number(v.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs text-blue-900 max-w-32 truncate" title={v.concepto || '—'}>
                                {v.concepto || '—'}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs text-blue-900">
                                {v.fecha_limite_pago ? new Date(v.fecha_limite_pago).toLocaleDateString('es-MX', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : '-'}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center align-middle">
                                <div className="flex flex-col items-center gap-2 w-full">
                                  <button
                                    className="w-[120px] lg:w-[150px] py-2 text-xs font-bold bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-400 tracking-wide"
                                    onClick={() => { setViaticoDetalle(v); setModalViaticoOpen(true); }}
                                  >
                                    Ver
                                  </button>
                                  {hasComprobante ? (
                                    <button
                                      className="w-[120px] lg:w-[150px] py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-wide"
                                      onClick={() => setVerComprobante({ open: true, viaticoId: v.id_viatico })}
                                    >
                                      Ver comprobante
                                    </button>
                                  ) : (
                                    <button
                                      className="w-[120px] lg:w-[150px] py-2 text-xs font-bold bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400 tracking-wide animate-pulse"
                                      onClick={() => handleOpenModal(v.id_viatico)}
                                    >
                                      Subir Comprobante
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de tarjetas para pantallas pequeñas */}
                  <div className="md:hidden space-y-4 p-4">
                    {paginatedViaticos.map((v) => {
                      const hasComprobante = comprobantes[v.id_viatico];
                      return (
                        <div key={v.id_viatico} 
                             className={`bg-white rounded-lg shadow-md border-l-4 p-4 ${
                               hasComprobante ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                             }`}>
                          {/* Estado */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${hasComprobante ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className={`text-sm font-semibold ${hasComprobante ? 'text-green-700' : 'text-red-700'}`}>
                                {hasComprobante ? 'Con comprobante' : 'Sin comprobante'}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-blue-900">{v.folio || '—'}</span>
                          </div>
                          
                          {/* Información */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Departamento:</span>
                              <span className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-200 text-blue-800">
                                {v.departamento ? v.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Monto:</span>
                              <span className="text-sm font-bold text-blue-800">
                                {Number(v.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Fecha:</span>
                              <span className="text-xs text-blue-900">
                                {v.fecha_limite_pago ? new Date(v.fecha_limite_pago).toLocaleDateString('es-MX', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : '-'}
                              </span>
                            </div>
                            {v.concepto && (
                              <div className="pt-2">
                                <span className="text-xs text-gray-600">Concepto:</span>
                                <p className="text-xs text-blue-900 mt-1">{v.concepto}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Botones */}
                          <div className="flex gap-2">
                            <button
                              className="flex-1 py-2 text-xs font-bold bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition"
                              onClick={() => { setViaticoDetalle(v); setModalViaticoOpen(true); }}
                            >
                              Ver
                            </button>
                            {hasComprobante ? (
                              <button
                                className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                                onClick={() => setVerComprobante({ open: true, viaticoId: v.id_viatico })}
                              >
                                Ver comprobante
                              </button>
                            ) : (
                              <button
                                className="flex-1 py-2 text-xs font-bold bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition animate-pulse"
                                onClick={() => handleOpenModal(v.id_viatico)}
                              >
                                Subir Comprobante
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {uploadError && <div className="text-red-600 text-center mt-2">{uploadError}</div>}
              </>
            )}
            
            <div className="px-2 sm:px-6 py-4" style={{backgroundColor: '#F0F4FC'}}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={viaticosFiltrados.length}
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
                src = `/uploads/comprobante-viaticos/${fileName}`;
              }
              window.open(src, '_blank', 'noopener,noreferrer');
              setVerComprobante({ open: false, viaticoId: null });
              return null;
            })()}
          </div>
          
          {/* Modal de detalles de viático */}
          <ViaticoDetailModal
            viatico={viaticoDetalle}
            isOpen={modalViaticoOpen}
            onClose={() => setModalViaticoOpen(false)}
          />
          
          <SubirComprobanteViaticoModal
            open={modalOpen}
            viaticoId={selectedViaticoId}
            onClose={handleCloseModal}
            onSubmit={handleSubmitComprobante}
          />
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}