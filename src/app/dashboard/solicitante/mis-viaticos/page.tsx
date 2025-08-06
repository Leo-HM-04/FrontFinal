'use client';

import { FaFilePdf, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { ViaticoDetailModal } from '@/components/viaticos/ViaticoDetailModal';
import { useEffect, useState } from 'react';
import { ViaticosService } from '@/services/viaticos.service';
import type { Viatico as BaseViatico } from '@/services/viaticos.service';
import {
  exportMisViaticosCSV,
  exportMisViaticosExcel,
  exportMisViaticosPDF
} from '@/utils/exportMisViaticos';

type Viatico = BaseViatico & {
  id_viatico: number;
  folio?: string;
  estado?: string;
  fecha_creacion?: string;
};

export default function MisViaticosPage() {
  // Estados para exportación
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRango, setExportRango] = useState('total');

  // Función para manejar la exportación
  const handleExport = () => {
    const viaticosExport = filteredViaticos;
    if (exportFormat === 'pdf') {
      exportMisViaticosPDF(viaticosExport, exportRango);
    } else if (exportFormat === 'excel') {
      exportMisViaticosExcel(viaticosExport, exportRango);
    } else if (exportFormat === 'csv') {
      exportMisViaticosCSV(viaticosExport, exportRango);
    }
  };

  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [filteredViaticos, setFilteredViaticos] = useState<Viatico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viaticoAEliminar, setViaticoAEliminar] = useState<number|null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState<Viatico | null>(null);

  const handleEliminar = async () => {
    if (!viaticoAEliminar) return;
    try {
      await ViaticosService.delete(viaticoAEliminar);
      setMensaje('Viático eliminado correctamente.');
      setViaticos(viaticos.filter(v => v.id_viatico !== viaticoAEliminar));
    } catch {
      setMensaje('Error al eliminar el viático.');
    }
    setShowModal(false);
    setViaticoAEliminar(null);
  };
  
  const handleOpenDetailModal = (viatico: Viatico) => {
    setSelectedViatico(viatico);
    setShowDetailModal(true);
  };

  useEffect(() => {
    ViaticosService.getAll()
      .then((data: BaseViatico[]) => {
        // Mapear para asegurar que todos los campos requeridos existen
        const viaticosExtendidos = data.map((v: BaseViatico) => ({
          ...v,
          id_viatico: (v as Record<string, unknown>)["id_viatico"] ?? (v as Record<string, unknown>)["id"] ?? 0,
          folio: (v as Record<string, unknown>)["folio"] ?? '',
          estado: (v as Record<string, unknown>)["estado"] ?? '',
          fecha_creacion: (v as Record<string, unknown>)["fecha_creacion"] ?? '',
        }) as Viatico);
        setViaticos(viaticosExtendidos);
        setError('');
      })
      .catch(() => setError('Error al cargar viáticos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...viaticos];
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.cuenta_destino?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter(v => v.estado?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (dateFilter) {
      const today = new Date();
      const filterDate = new Date(today);
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(v => {
            const vDate = new Date(v.fecha_creacion || v.fecha_limite_pago);
            vDate.setHours(0, 0, 0, 0);
            return vDate.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(v => new Date(v.fecha_creacion || v.fecha_limite_pago) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(v => new Date(v.fecha_creacion || v.fecha_limite_pago) >= filterDate);
          break;
      }
    }
    setFilteredViaticos(filtered);
    setCurrentPage(1);
  }, [viaticos, searchTerm, statusFilter, dateFilter]);

  const estadoOrden = {
    'pendiente': 1,
    'autorizada': 2,
    'pagada': 3,
    'rechazada': 4
  };
  const viaticosOrdenados = [...filteredViaticos].sort((a, b) => {
    const estadoA = (a.estado || '').toLowerCase();
    const estadoB = (b.estado || '').toLowerCase();
    const ordenA = estadoOrden[estadoA as keyof typeof estadoOrden] ?? 99;
    const ordenB = estadoOrden[estadoB as keyof typeof estadoOrden] ?? 99;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return new Date(b.fecha_creacion || b.fecha_limite_pago).getTime() - new Date(a.fecha_creacion || a.fecha_limite_pago).getTime();
  });
  const totalPages = Math.ceil(viaticosOrdenados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, viaticosOrdenados.length);
  const currentViaticos = viaticosOrdenados.slice(startIndex, endIndex);

  const filterOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'autorizada', label: 'Autorizada' },
    { value: 'rechazada', label: 'Rechazada' },
    { value: 'pagada', label: 'Pagada' }
  ];
  const dateOptions = [
    { value: '', label: 'Todas las fechas' },
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mes' }
  ];
  const getEstadoColor = (estado: string) => {
    switch ((estado || '').toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'autorizada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'pagada': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getEstadoIcon = (estado: string) => {
    switch ((estado || '').toLowerCase()) {
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'autorizada': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rechazada': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pagada': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 shadow-sm">
                <FaFilePdf className="text-blue-600 w-7 h-7" />
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Mis Viáticos</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard/solicitante/nuevo-viatico"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-bold shadow-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <FaPlus className="w-5 h-5" />
                Crear viático
              </Link>
              
              {/* Controles de exportación */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-white/80 text-sm font-medium">Exportar como:</span>
                  <select
                    value={exportFormat}
                    onChange={e => setExportFormat(e.target.value)}
                    className="text-bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                  >
                    <option value="pdf" className="text-black">PDF</option>
                    <option value="excel" className="text-black">Excel</option>
                    <option value="csv" className="text-black">CSV</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-2 border-l border-white/10">
                  <span className="text-white/80 text-sm font-medium">Período:</span>
                  <select
                    value={exportRango}
                    onChange={e => setExportRango(e.target.value)}
                    className="bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                  >
                    <option value="dia" className="text-black">Último día</option>
                    <option value="semana" className="text-black">Última semana</option>
                    <option value="mes" className="text-black">Último mes</option>
                    <option value="año" className="text-black">Último año</option>
                    <option value="total" className="text-black">Todo el historial</option>
                  </select>
                </div>
                <Button
                  onClick={handleExport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg inline-flex items-center gap-2 transition-all duration-200 border border-white/10"
                >
                  <FaFilePdf className="w-4 h-4" />
                  <span>Exportar</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Filtros */}
          <div className="mb-8">
            <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por concepto, departamento o cuenta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {dateOptions.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {/* Notificación tipo toast para borrar */}
          {mensaje && (
            <div
              className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl font-semibold text-base animate-fade-in-up transition-all duration-300
                ${mensaje.includes('eliminado')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'}
              `}
              style={{ minWidth: 280 }}
            >
              {mensaje.includes('eliminado') ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span>{mensaje}</span>
              <button
                className="ml-2 text-xl text-gray-400 hover:text-gray-600 font-bold px-2 py-1 rounded-full transition"
                onClick={() => setMensaje("")}
                title="Cerrar"
              >×</button>
            </div>
          )}

          {/* Tabla de viáticos */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-16">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-28">Folio</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-40">Departamento</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">Concepto</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Monto</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-40">Cuenta Destino</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Estado</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider w-32">Fecha Límite</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider w-24">Archivo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-blue-900 uppercase tracking-wider w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {currentViaticos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-blue-900/80">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                        <p className="text-lg font-semibold">No tienes viáticos aún</p>
                        <p className="text-sm text-blue-500 mt-1">
                          {searchTerm || statusFilter || dateFilter
                            ? 'No se encontraron viáticos con los filtros aplicados'
                            : 'Crea tu primer viático'}
                        </p>
                      </td>
                    </tr>
                  ) :
                    currentViaticos.map((v: Viatico) => (
                      <tr key={v.id_viatico} className="hover:bg-blue-50/70 transition-colors">
                        <td className="px-3 py-2.5 text-blue-900 font-medium text-sm">{v.id_viatico}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded">{v.folio || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900 font-medium truncate max-w-[160px]">
                            {v.departamento?.split(' ').map(word => 
                              word.toLowerCase() === 'ti' ? 'TI' :
                              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            ).join(' ')}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900 truncate max-w-[200px]">{v.concepto}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm font-bold text-blue-900">{formatCurrency(Number(v.monto))}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900/90 font-medium truncate max-w-[160px]">{v.cuenta_destino}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(v.estado || '')} shadow-sm bg-white/90`}>
                            {getEstadoIcon(v.estado || '')}
                            <span className="ml-1 capitalize truncate max-w-[80px]">{v.estado || 'pendiente'}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-blue-900/80">{formatDate(v.fecha_limite_pago)}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {v.viatico_url ? (
                            <a
                              href={`http://localhost:4000${v.viatico_url.startsWith('/') ? '' : '/'}${v.viatico_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              title="Ver archivo"
                            >
                              <FaFilePdf className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {String(v.estado).toLowerCase() === 'pendiente' ? (
                              <>
                                <Link
                                  href={`/dashboard/solicitante/editar-viatico?id=${v.id_viatico}`}
                                  className="inline-flex items-center justify-center p-1.5 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                                  title="Editar"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  title="Eliminar"
                                  className="inline-flex items-center justify-center p-1.5 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                  onClick={() => { setShowModal(true); setViaticoAEliminar(v.id_viatico); }}
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : String(v.estado).toLowerCase() === 'pagada' ? (
                              <button
                                title="Ver detalles y comprobante"
                                className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                onClick={() => handleOpenDetailModal(v)}
                              >
                                <FaEye className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">No disponible</span>
                            )}
                          </div>
                            {/* Modal de confirmación para eliminar */}
                            {showModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a237e19] backdrop-blur-sm">
                                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                                    <div className="flex items-center justify-between px-6 py-4 bg-red-50 rounded-t-2xl border-b border-red-200">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                        <span className="text-lg font-bold text-red-700">¿Eliminar viático?</span>
                                    </div>
                                    <button onClick={() => { setShowModal(false); setViaticoAEliminar(null); }} className="text-red-400 hover:text-red-600 text-xl font-bold px-2 py-1 rounded-full transition">×</button>
                                    </div>
                                    <div className="px-8 py-6 flex flex-col items-center">
                                    <p className="text-blue-900 text-base mb-4 text-center">Esta acción eliminará el viático de forma permanente. No podrás recuperarlo.</p>
                                    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-4 text-left">
                                        <span className="block text-xs text-gray-500 font-semibold mb-1">Elemento a eliminar:</span>
                                        <span className="font-mono text-blue-800 text-sm">ID {viaticoAEliminar}</span>
                                    </div>
                                    <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
                                        <span className="text-red-600 font-bold">Advertencia</span>
                                        <span className="text-xs text-red-700">⚠️ Haz esto solo si estás completamente seguro</span>
                                    </div>
                                    <div className="flex gap-4 w-full justify-center">
                                        <button
                                        className="px-6 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 font-semibold hover:bg-gray-100 transition"
                                        onClick={() => { setShowModal(false); setViaticoAEliminar(null); }}
                                        >Cancelar</button>
                                        <button
                                        className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                                        onClick={() => handleEliminar()}
                                        >Eliminar</button>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Paginación visual */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-6 border-t border-blue-100 gap-6 bg-gradient-to-r from-blue-100/60 to-blue-50/80">
              <div className="text-blue-900 text-base font-medium">
                Mostrando <span className="font-bold text-blue-700">{filteredViaticos.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-700">{filteredViaticos.length}</span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === 1 ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >Primera</button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === 1 ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >Anterior</button>
                  <span className="text-blue-900 text-base font-semibold px-2">Página <span className="text-blue-700">{currentPage}</span> de <span className="text-blue-700">{totalPages}</span></span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === totalPages ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >Siguiente</button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 border border-blue-300 shadow-sm ${currentPage === totalPages ? 'bg-gray-200 text-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >Última</button>
                </div>
              )}
            </div>
          </div>

          {/* Modal de detalles de viático */}
          <ViaticoDetailModal
            viatico={selectedViatico}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
          />
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
