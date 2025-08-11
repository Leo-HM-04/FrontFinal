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
  // Filtro de departamento
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  // Modal de detalle de viático
  const [modalViaticoOpen, setModalViaticoOpen] = useState(false);
  const [viaticoDetalle, setViaticoDetalle] = useState<Viatico | null>(null);

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
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px] mb-6">
            <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">Subir Comprobante - Viáticos</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-6 border border-white/20 flex-1 flex flex-col min-w-[260px] w-full">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center w-full mb-4 gap-4">
              <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-1 border border-blue-200">
                <label htmlFor="departamentoFiltro" className="text-blue-700 text-sm font-medium">Departamento:</label>
                <select
                  id="departamentoFiltro"
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setCurrentPage(1); }}
                  className="min-w-[90px] bg-white border border-blue-200 rounded-md px-2 py-1 text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
                >
                  <option value="todos">Todos</option>
                  {[...new Set(viaticos.map(v => v.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep ? dep.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</option>
                  ))}
                </select>
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
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-x-auto p-0 w-full">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead style={{ backgroundColor: "#F0F4FC" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Folio</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Fecha de pago</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/60 divide-y divide-blue-50">
                      {paginatedViaticos
                        .filter(v => departamentoFiltro === 'todos' || v.departamento === departamentoFiltro)
                        .map((v, i) => (
                        <tr key={v.id_viatico} className={`transition-colors rounded-xl ${i % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{v.folio || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">{v.departamento ? v.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800 font-bold">{Number(v.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{v.concepto || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{v.fecha_limite_pago ? new Date(v.fecha_limite_pago).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                            <div className="flex flex-col items-center gap-2 w-full">
                              <button
                                className="w-[150px] py-2 text-xs font-bold bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-400 tracking-wide"
                                onClick={() => { setViaticoDetalle(v); setModalViaticoOpen(true); }}
                              >
                                Ver
                              </button>
                              {comprobantes[v.id_viatico] ? (
                                <button
                                  className="w-[150px] py-2 text-xs font-bold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-wide"
                                  onClick={() => setVerComprobante({ open: true, viaticoId: v.id_viatico })}
                                >
                                  Ver comprobante
                                </button>
                              ) : (
                                <button
                                  className="w-[150px] py-2 text-xs font-bold bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400 tracking-wide"
                                  onClick={() => handleOpenModal(v.id_viatico)}
                                >
                                  Subir Comprobante
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {uploadError && <div className="text-red-600 text-center mt-2">{uploadError}</div>}
              </>
            )}
            <div className="px-6 py-4" style={{backgroundColor: '#F0F4FC'}}>
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
                src = `http://46.202.177.106:4000/uploads/comprobante-viaticos/${fileName}`;
              }
              window.open(src, '_blank', 'noopener,noreferrer');
              setVerComprobante({ open: false, viaticoId: null });
              return null;
            })()}
          </div>
            {/* Modal de detalles de viático (idéntico a mis viáticos) */}
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