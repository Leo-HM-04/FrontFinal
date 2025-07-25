"use client";

import { useEffect, useState } from "react";
import { PagadorLayout } from "@/components/layout/PagadorLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RecurrentesService } from "@/services/recurrentes.service";
import { SubirFacturaModal } from "@/components/pagos/SubirFacturaModal";
import { PlantillaRecurrente } from "@/types";
// Extiende el tipo para incluir com_recurrente si no existe
type PlantillaRecurrenteConComprobante = PlantillaRecurrente & { com_recurrente?: string };
import { AlertCircle, FileCheck2 } from "lucide-react";

export default function SubirComprobanteRecurrentePage() {
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrenteConComprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recurrenteId, setRecurrenteId] = useState<number | null>(null);
  // Estado para comprobantes y ver comprobante
  const [comprobantes, setComprobantes] = useState<{ [id: number]: string | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; recurrente: PlantillaRecurrenteConComprobante | null }>({ open: false, recurrente: null });

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

  // Paginación
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const totalPaginas = Math.ceil(recurrentes.length / pagosPorPagina);
  const recurrentesPaginados = recurrentes.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={["pagador_banca"]}>
      <PagadorLayout>
        <div className="w-full max-w-7xl mx-auto mt-12 bg-white rounded-3xl shadow-2xl p-12 border-t-4 border-b-4 border-blue-200">
          <h2 className="text-3xl font-extrabold mb-6 text-blue-700 text-center">Subir Comprobante - Pagos Recurrentes</h2>
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
              <div className="bg-white rounded-3xl shadow-2xl border-t-4 border-b-4 border-blue-200 overflow-x-auto p-10 w-full max-w-7xl mx-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead style={{ backgroundColor: "#F0F4FC" }}>
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">ID</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Solicitante</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Departamento</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Monto</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Concepto</th>
                      <th className="px-8 py-5 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Frecuencia</th>
                      <th className="px-8 py-5 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {recurrentesPaginados.map((rec) => (
                      <tr key={rec.id_recurrente} className="transition-colors rounded-xl bg-blue-50 hover:bg-blue-100">
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900 font-bold">#{rec.id_recurrente}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{rec.nombre_usuario || `Usuario ${rec.id_usuario}`}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-900">{rec.departamento}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-blue-800 font-bold">{Number(rec.monto).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-xs text-blue-900">{rec.concepto}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-xs text-blue-900">{rec.frecuencia}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          {comprobantes[rec.id_recurrente] ? (
                            <button
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                              onClick={() => setVerComprobante({ open: true, recurrente: rec })}
                            >
                              <FileCheck2 className="w-4 h-4" /> Ver comprobante
                            </button>
                          ) : (
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                              onClick={() => {
                                setRecurrenteId(rec.id_recurrente);
                                setModalOpen(true);
                              }}
                            >
                              Subir Comprobante
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginación */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-200 text-blue-700 font-bold border border-blue-400 shadow hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1 || totalPaginas === 0}
                  aria-label="Página anterior"
                >
                  <span>Anterior</span>
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`w-8 h-8 rounded-full font-bold border transition flex items-center justify-center ${
                        num === pagina
                          ? "bg-blue-700 text-white border-blue-700 shadow-lg"
                          : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                      }`}
                      onClick={() => setPagina(num)}
                      disabled={num === pagina}
                      aria-label={`Ir a la página ${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-200 text-blue-700 font-bold border border-blue-400 shadow hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas || totalPaginas === 0}
                  aria-label="Página siguiente"
                >
                  <span>Siguiente</span>
                </button>
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
              {/* Modal para subir comprobante */}
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
            </>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
