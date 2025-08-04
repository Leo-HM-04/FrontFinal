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

  useEffect(() => {
    const fetchComprobantes = async () => {
      const comprobantesObj: { [id: number]: string | null } = {};
      for (const v of viaticos) {
        try {
          const res = await getComprobantesPorViatico(v.id_viatico);
          comprobantesObj[v.id_viatico] = res.length > 0 ? res[0].archivo_url : null;
        } catch {
          comprobantesObj[v.id_viatico] = null;
        }
      }
      setComprobantes(comprobantesObj);
    };
    if (viaticos.length > 0) fetchComprobantes();
  }, [viaticos]);

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
      await subirComprobanteViatico(viaticoId, file);
      refetch();
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir comprobante');
      throw err;
    }
  };

  return (
    <ProtectedRoute requiredRoles={["pagador_banca"]}>
      <PagadorLayout>
        <div className="max-w-4xl mx-auto py-10 px-4">
          <h1 className="text-3xl font-extrabold text-blue-900 mb-8">Comprobantes de Viáticos</h1>
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-blue-200">
            <h2 className="text-2xl font-extrabold mb-8 text-blue-900 tracking-tight">Solicitudes ya pagadas</h2>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="bg-blue-100 rounded-xl text-blue-900">
                        <th className="px-6 py-4 rounded-l-2xl font-bold text-base">Folio</th>
                        <th className="px-6 py-4 font-bold text-base">Departamento</th>
                        <th className="px-6 py-4 font-bold text-base">Monto</th>
                        <th className="px-6 py-4 font-bold text-base">Concepto</th>
                        <th className="px-6 py-4 font-bold text-base">Fecha de pago</th>
                        <th className="px-6 py-4 rounded-r-2xl font-bold text-base text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedViaticos.map((v, i) => (
                        <tr key={v.id_viatico} className={`rounded-2xl shadow ${i % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'} hover:bg-blue-200 transition-all duration-150`}>
                          <td className="px-6 py-4 font-mono rounded-l-2xl align-middle text-blue-900 text-lg">{v.folio}</td>
                          <td className="px-6 py-4 align-middle text-blue-800">{v.departamento}</td>
                          <td className="px-6 py-4 align-middle text-blue-900 font-bold text-lg">${v.monto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 align-middle text-blue-800">{v.concepto}</td>
                          <td className="px-6 py-4 align-middle text-blue-700">{v.fecha_limite_pago?.split('T')[0]}</td>
                          <td className="px-6 py-4 rounded-r-2xl text-center align-middle">
                            {comprobantes[v.id_viatico] ? (
                              <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                onClick={() => {
                                  setVerComprobante({ open: true, viaticoId: v.id_viatico });
                                }}
                              >
                                Ver comprobante
                              </button>
                            ) : (
                              <button
                                className="px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold shadow-lg hover:scale-105 hover:from-blue-700 transition-all duration-150 text-base"
                                onClick={() => handleOpenModal(v.id_viatico)}
                              >
                                Subir comprobante
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {uploadError && <div className="text-red-600 text-center mt-2">{uploadError}</div>}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={viaticos.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
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
