"use client";

import { useEffect, useState } from "react";
import { PagadorLayout } from "@/components/layout/PagadorLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RecurrentesService } from "@/services/recurrentes.service";

import { SubirFacturaModal } from "@/components/pagos/SubirFacturaModal";
import { AlertCircle, FileCheck2 } from "lucide-react";
import { Pagination } from '@/components/ui/Pagination';
import { RecurrenteDetailModal } from '@/components/recurrentes/RecurrenteDetailModal';

import { PlantillaRecurrente } from "@/types";
type PlantillaRecurrenteConComprobante = PlantillaRecurrente & { com_recurrente?: string };

export default function SubirComprobanteRecurrentePage() {
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrenteConComprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recurrenteId, setRecurrenteId] = useState<number | null>(null);
  // Estado para comprobantes y ver comprobante
  const [comprobantes, setComprobantes] = useState<{ [id: number]: string | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; recurrente: PlantillaRecurrenteConComprobante | null }>({ open: false, recurrente: null });
  // Filtro de departamento
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  // Estado para modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecurrente, setSelectedRecurrente] = useState<PlantillaRecurrenteConComprobante | null>(null);

  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerTodasParaPagador();
        const pagadas = data.filter((r) => r.estado === "pagada");
        setRecurrentes(pagadas);
        // Consultar comprobantes para cada recurrente pagada
        const comprobantesObj: { [id: number]: string | null } = {};
        pagadas.forEach((rec) => {
          comprobantesObj[rec.id_recurrente] = rec.com_recurrente || null;
        });
        setComprobantes(comprobantesObj);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    fetchRecurrentes();
  }, []);

  // Filtrar por departamento
  const recurrentesFiltrados = departamentoFiltro === 'todos'
    ? recurrentes
    : recurrentes.filter((r) => r.departamento === departamentoFiltro);

  // Ordenar: primero los que NO tienen comprobante, luego los que SÍ tienen
  const recurrentesOrdenados = [...recurrentesFiltrados].sort((a, b) => {
    const tieneComprobanteA = !!comprobantes[a.id_recurrente];
    const tieneComprobanteB = !!comprobantes[b.id_recurrente];
    if (tieneComprobanteA === tieneComprobanteB) return 0;
    return tieneComprobanteA ? 1 : -1;
  });

  // Paginación
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const totalPaginas = Math.ceil(recurrentesOrdenados.length / pagosPorPagina);
  const recurrentesPaginados = recurrentesOrdenados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={["pagador_banca"]}>
      <PagadorLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6 border border-white/20 flex-1 flex items-center justify-center min-w-[260px] mb-6">
            <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">Subir Comprobante - Pagos Recurrentes</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-6 border border-white/20 flex-1 flex flex-col min-w-[260px] w-full">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center w-full mb-4 gap-4">
              <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-1 border border-blue-200">
                <label htmlFor="departamentoFiltro" className="text-blue-700 text-sm font-medium">Departamento:</label>
                <select
                  id="departamentoFiltro"
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="min-w-[90px] bg-white border border-blue-200 rounded-md px-2 py-1 text-blue-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-150"
                >
                  <option value="todos">Todos</option>
                  {[...new Set(recurrentes.map(r => r.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep ? dep.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</option>
                  ))}
                </select>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-10">
                <AlertCircle className="w-12 h-12 mx-auto text-green-400 animate-spin mb-4" />
                <p className="text-lg text-gray-700">Cargando pagos recurrentes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                <p className="text-lg text-red-600">{error}</p>
              </div>
            ) : recurrentes.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
                <p className="text-lg text-gray-700">No hay pagos recurrentes pagados aún.</p>
              </div>
            ) : (
              <>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-x-auto p-0 w-full">
                  <table className="min-w-full divide-y divide-blue-100">
                    <thead style={{ backgroundColor: "#F0F4FC" }}>
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Solicitante</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Frecuencia</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/60 divide-y divide-blue-50">
                      {recurrentesPaginados.map((rec, idx) => (
                        <tr key={rec.id_recurrente} className={`transition-colors rounded-xl ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">#{rec.id_recurrente}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{rec.nombre_usuario || `Usuario ${rec.id_usuario}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">{rec.departamento ? rec.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800 font-bold">{Number(rec.monto).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{rec.concepto}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{rec.frecuencia ? rec.frecuencia.charAt(0).toUpperCase() + rec.frecuencia.slice(1).toLowerCase() : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <button
                                className="min-w-[120px] py-1.5 text-xs bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 mb-0.5"
                                onClick={() => { setSelectedRecurrente(rec); setShowDetailModal(true); }}
                              >
                                Ver
                              </button>
                              {comprobantes[rec.id_recurrente] ? (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  onClick={() => setVerComprobante({ open: true, recurrente: rec })}
                                >
                                  <FileCheck2 className="w-4 h-4 inline-block mr-1" /> Ver comprobante
                                </button>
                              ) : (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                                  onClick={() => {
                                    setRecurrenteId(rec.id_recurrente);
                                    setModalOpen(true);
                                  }}
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
                {/* Modal para ver comprobante */}
                {verComprobante.open && verComprobante.recurrente && comprobantes[verComprobante.recurrente.id_recurrente] && (
                  (() => {
                    const comprobantePath = comprobantes[verComprobante.recurrente.id_recurrente];
                    if (!comprobantePath) return null;
                    let src = comprobantePath;
                    if (!/^https?:\/\//i.test(comprobantePath)) {
                      // Si el path ya incluye 'uploads/comprobante-recurrentes/', solo usa el nombre de archivo
                      const fileName = comprobantePath.replace(/^.*uploads[\/\\]comprobante-recurrentes[\/\\]/i, "");
                      src = `http://localhost:4000/uploads/comprobante-recurrentes/${fileName}`;
                    }
                    window.open(src, '_blank', 'noopener,noreferrer');
                    setVerComprobante({ open: false, recurrente: null });
                    return null;
                  })()
                )}
              </>
            )}
          </div>
          {/* Modal para ver detalles de la solicitud recurrente */}
          <RecurrenteDetailModal
            isOpen={showDetailModal}
            recurrente={selectedRecurrente}
            onClose={() => setShowDetailModal(false)}
          />
          {/* Paginador reutilizado */}
          <div className="px-6 py-4" style={{backgroundColor: '#F0F4FC'}}>
            <Pagination
              currentPage={pagina}
              totalPages={totalPaginas}
              totalItems={recurrentesOrdenados.length}
              itemsPerPage={pagosPorPagina}
              onPageChange={setPagina}
            />
          </div>
          {/* Modal para subir comprobante (fuera de la tabla) */}
          <SubirFacturaModal
            open={modalOpen}
            solicitudId={recurrenteId}
            onClose={() => setModalOpen(false)}
            onSubmit={async (file, id) => {
              try {
                if (!id) throw new Error("No hay id de recurrente");
                await RecurrentesService.subirComprobante(id, file);
                // Recargar lista y comprobantes
                const data = await RecurrentesService.obtenerTodasParaPagador();
                const pagadas = data.filter((r) => r.estado === "pagada");
                setRecurrentes(pagadas);
                const comprobantesObj: { [id: number]: string | null } = {};
                pagadas.forEach((rec) => {
                  comprobantesObj[rec.id_recurrente] = rec.com_recurrente || null;
                });
                setComprobantes(comprobantesObj);
                alert("Comprobante subido exitosamente");
              } catch {
                alert("Error al subir el comprobante");
              } finally {
                setModalOpen(false);
              }
            }}
          />
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
