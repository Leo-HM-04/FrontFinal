"use client";

import { useEffect, useState } from 'react';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { Eye, BadgeCheck} from 'lucide-react';
import { RecurrenteDetailModal } from '@/components/recurrentes/RecurrenteDetailModal';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function PagadorRecurrentesPage() {
  // Utilidad para capitalizar cada palabra
  function capitalizeWords(str: string) {
    if (str.trim().toLowerCase() === 'ti') return 'TI';
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<PlantillaRecurrente | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  // Filtros y búsqueda
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [filtroTipoPago, setFiltroTipoPago] = useState('');
  const [busquedaSolicitante, setBusquedaSolicitante] = useState('');

  // Filtrado, búsqueda y orden (debe ir antes del hook de paginación)
  let filtrados = recurrentes
    .filter(r => !filtroEstado || r.estado === filtroEstado)
    .filter(r => !filtroDepartamento || r.departamento === filtroDepartamento)
    .filter(r => !filtroTipoPago || r.tipo_pago === filtroTipoPago)
    .filter(r => !busquedaSolicitante || (r.nombre_usuario || '').toLowerCase().includes(busquedaSolicitante.toLowerCase()));
  // Ordenar por importancia: aprobada > pagada > otros
  filtrados = filtrados.sort((a, b) => {
    const orden: Record<string, number> = { aprobada: 1, pagada: 2 };
    return (orden[String(a.estado)] ?? 99) - (orden[String(b.estado)] ?? 99);
  });

  // Paginación con hook reutilizable
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData,
    goToPage,
    changeItemsPerPage
  } = usePagination({ data: filtrados, initialItemsPerPage: 5 });

  // Procesar pago recurrente y marcar como pagada
  const handleProcesar = async (rec: PlantillaRecurrente) => {
    setProcessingId(rec.id_recurrente);
    try {
      await RecurrentesService.marcarComoPagada(rec.id_recurrente);
      // Recargar la lista
      const data = await RecurrentesService.obtenerTodasParaPagador();
      setRecurrentes(data.filter(r => r.estado === 'aprobada' || r.estado === 'pagada'));
    } catch {
      // Manejar error (puedes mostrar un toast, etc)
    } finally {
      setProcessingId(null);
    }
  };
  const handleView = (rec: PlantillaRecurrente) => {
    setSelected(rec);
    setModalOpen(true);
  };
  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerTodasParaPagador();
        setRecurrentes(data);
      } catch {
        setRecurrentes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecurrentes();
  }, []);

  // (cleanFile eliminado porque no se usa)

  // Opciones únicas para filtros
  const estadosUnicos = Array.from(new Set(recurrentes.map(r => r.estado))).filter(Boolean);
  const departamentosUnicos = Array.from(new Set(recurrentes.map(r => r.departamento))).filter(Boolean);
  const tiposPagoUnicos = Array.from(new Set(recurrentes.map(r => r.tipo_pago))).filter(Boolean);

  // El paginado ahora lo da el hook
  const mostrar = paginatedData;

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white font-sans">
              Pagos Recurrentes
            </h2>
          </div>

          {/* Filtros y búsqueda */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <form className="flex flex-wrap gap-4 w-full max-w-4xl mx-auto items-end">
              <div className="flex-1 min-w-[200px] max-w-xs">
                <label className="block text-sm font-bold text-white mb-2">Estado</label>
                <select className="border border-blue-200 rounded-xl px-4 py-3 w-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 text-base transition" value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); goToPage(1); }}>
                  <option value="">Todos</option>
                  {estadosUnicos.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <label className="block text-sm font-bold text-white mb-2">Departamento</label>
                <select className="border border-blue-200 rounded-xl px-4 py-3 w-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 text-base transition" value={filtroDepartamento} onChange={e => { setFiltroDepartamento(e.target.value); goToPage(1); }}>
                  <option value="">Todos</option>
                  {departamentosUnicos.map(d => <option key={d} value={d}>{capitalizeWords(d)}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <label className="block text-sm font-bold text-white mb-2">Tipo de Pago</label>
                <select className="border border-blue-200 rounded-xl px-4 py-3 w-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 text-base transition" value={filtroTipoPago} onChange={e => { setFiltroTipoPago(e.target.value); goToPage(1); }}>
                  <option value="">Todos</option>
                  {tiposPagoUnicos.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[200px] max-w-xs">
                <label className="block text-sm font-bold text-white mb-2">Buscar Solicitante</label>
                <input type="text" className="border border-blue-200 rounded-xl px-4 py-3 w-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 text-base transition" placeholder="Nombre..." value={busquedaSolicitante} onChange={e => { setBusquedaSolicitante(e.target.value); goToPage(1); }} />
              </div>
            </form>
          </div>

          <div className="w-full max-w-7xl mx-auto mt-12">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-10 text-blue-700">Cargando solicitudes recurrentes...</div>
              ) : ( 
                <table className="min-w-full bg-white rounded-2xl shadow-xl border border-blue-100">
                  <thead className="bg-[#F4F7FB]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Solicitante</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Concepto</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Frecuencia</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Activa</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Siguiente Fecha</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostrar.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-blue-600 font-semibold">No hay pagos recurrentes encontrados.</td>
                      </tr>
                    ) : (
                      mostrar.map((p: PlantillaRecurrente, idx: number) => (
                        <tr key={p.id_recurrente} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F4F7FB]'}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{p.id_recurrente}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{p.nombre_usuario || `Usuario ${p.id_usuario}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{capitalizeWords(p.departamento)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{color:'#16A34A'}}>{Number(p.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <span className="text-blue-800">{p.cuenta_destino}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{p.concepto}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">{p.tipo_pago.charAt(0).toUpperCase() + p.tipo_pago.slice(1)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900">{p.frecuencia}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${p.estado === 'aprobada' ? 'bg-blue-100 text-blue-800 border border-blue-300' : p.estado === 'pagada' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800 border border-gray-300'}`}>{p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                            {p.activo ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">Activo</span> : <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Inactivo</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-900 font-medium">{p.siguiente_fecha ? new Date(p.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex space-x-2 justify-center">
                              <button
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full transition-colors duration-150"
                                title="Ver Detalle"
                                onClick={() => handleView(p)}
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              {p.estado !== 'pagada' && (
                                <button
                                  className={`text-green-600 hover:text-green-900 p-1 rounded-full transition-colors duration-150 ${processingId === p.id_recurrente ? 'opacity-50 pointer-events-none' : ''}`}
                                  title="Procesar y marcar como pagada"
                                  onClick={() => handleProcesar(p)}
                                  disabled={processingId === p.id_recurrente}
                                >
                                  {processingId === p.id_recurrente ? (
                                    <span className="flex items-center gap-1"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Procesando...</span>
                                  ) : (
                                    <span className="flex items-center gap-1"><BadgeCheck className="w-5 h-5" />Procesar</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
              {/* Modal fuera de la tabla */}
              <RecurrenteDetailModal recurrente={selected} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
            {/* Paginador mejorado */}
            <div style={{backgroundColor: '#F0F4FC'}} className="px-6 py-4 mt-4 rounded-2xl border border-blue-100 w-full max-w-7xl mx-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={goToPage}
                onItemsPerPageChange={changeItemsPerPage}
              />
            </div>
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}