'use client';

import { useEffect, useState, useMemo } from 'react'; // Agregamos useMemo
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { Button } from '@/components/ui/Button';
import { exportMisRecurrentesPDF, exportMisRecurrentesExcel, exportMisRecurrentesCSV } from '@/utils/exportMisRecurrentes';
import { Pagination } from '@/components/ui/Pagination';
import { Plus, FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { RecurrenteDetalleModal } from '@/components/RecurrenteDetalleModal';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { ConfirmDeleteSoli } from '@/components/common/ConfirmDeleteSoli';

// Modal de confirmación para activar/desactivar
function ConfirmToggleModal({ isOpen, onClose, onConfirm, activo }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, activo: boolean }) {
    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-all duration-200 ${isOpen ? '' : 'pointer-events-none opacity-0'}`}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-7 border border-gray-200">
                <h2 className="text-lg font-bold mb-2 text-gray-900">{activo ? 'Desactivar plantilla' : 'Activar plantilla'}</h2>
                <p className="text-gray-700 mb-6">¿Seguro que deseas {activo ? 'desactivar' : 'activar'} esta plantilla recurrente? Podrás volver a {activo ? 'activarla' : 'desactivarla'} en cualquier momento.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition">Cancelar</button>
                    <button onClick={onConfirm} className={`px-4 py-2 rounded-lg font-semibold text-white transition ${activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>{activo ? 'Desactivar' : 'Activar'}</button>
                </div>
            </div>
        </div>
    );
}

// Funciones para colores e iconos (sin cambios, ya están bien)
const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
        case 'pendiente':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'aprobada':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'rechazada':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getEstadoIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
        case 'pendiente':
            return <Clock className="w-4 h-4" />;
        case 'aprobada':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'rechazada':
            return <XCircle className="w-4 h-4 text-red-500" />;
        default:
            return <Clock className="w-4 h-4" />;
    }
};

export default function MisRecurrentesPage() {
    // Estados para exportación
    const [exportFormat, setExportFormat] = useState('pdf');
    const [exportRango, setExportRango] = useState('total');

    // Función para manejar la exportación
    const handleExport = () => {
        const recurrentesExport = filteredRecurrentes;
        if (exportFormat === 'pdf') {
            exportMisRecurrentesPDF(recurrentesExport, exportRango);
        } else if (exportFormat === 'excel') {
            exportMisRecurrentesExcel(recurrentesExport, exportRango);
        } else if (exportFormat === 'csv') {
            exportMisRecurrentesCSV(recurrentesExport, exportRango);
        }
    };

    const [detalleModalOpen, setDetalleModalOpen] = useState(false);
    const [recurrenteDetalle, setRecurrenteDetalle] = useState<PlantillaRecurrente | null>(null);
    const router = useRouter();
    // const { user } = useAuth();
    const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [recurrenteAEliminar, setRecurrenteAEliminar] = useState<PlantillaRecurrente | null>(null);
    // Estado para modal de activar/desactivar
    const [toggleModalOpen, setToggleModalOpen] = useState(false);
    const [recurrenteAToggle, setRecurrenteAToggle] = useState<PlantillaRecurrente | null>(null);
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
    const [filtroTipoPago, setFiltroTipoPago] = useState<string>('todos');
    const [filtroFrecuencia, setFiltroFrecuencia] = useState<string>('todas');
    const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>('');
    const [filtroFechaFin, setFiltroFechaFin] = useState<string>('');
    const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
    // Eliminados filtroMontoMin y filtroMontoMax

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchRecurrentes = async () => {
            try {
                const data = await RecurrentesService.obtenerMisRecurrentes();
                // Ordenar por fecha de creación descendente (más reciente primero)
                const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setRecurrentes(sorted);
            } catch {
                setError('Error al cargar tus plantillas recurrentes');
            } finally {
                setLoading(false);
            }
        };
        fetchRecurrentes();
    }, []);

    const handleDelete = async () => {
        if (!recurrenteAEliminar) return;
        try {
            await RecurrentesService.eliminar(recurrenteAEliminar.id_recurrente);
            setRecurrentes(prev => prev.filter(p => p.id_recurrente !== recurrenteAEliminar.id_recurrente));
            setSuccess('Plantilla eliminada correctamente.');
        } catch {
            setError('Error al eliminar la plantilla');
        } finally {
            setDeleteModalOpen(false);
            setRecurrenteAEliminar(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        };
        // Capitaliza la primera letra del mes
        const formatted = date.toLocaleDateString('es-MX', options);
        return formatted.replace(/^(\d{2})\s(\w)/, (m, d, l) => `${d} ${l.toUpperCase()}`);
    };

    // Obtener listas únicas para selects
    const departamentos = useMemo(() => {
        const set = new Set<string>();
        recurrentes.forEach(p => { if (p.departamento) set.add(p.departamento); });
        return Array.from(set);
    }, [recurrentes]);
    const tiposPago = useMemo(() => {
        const set = new Set<string>();
        recurrentes.forEach(p => { if (p.tipo_pago) set.add(p.tipo_pago); });
        return Array.from(set);
    }, [recurrentes]);
    const frecuencias = useMemo(() => {
        const set = new Set<string>();
        recurrentes.forEach(p => { if (p.frecuencia) set.add(p.frecuencia); });
        return Array.from(set);
    }, [recurrentes]);

    // Lógica de filtrado combinada y orden por estado
    const filteredRecurrentes = useMemo(() => {
        let result = recurrentes;
        if (filtroEstado !== 'todas') {
            result = result.filter(p => p.estado.toLowerCase() === filtroEstado);
        }
        if (filtroDepartamento !== 'todos') {
            result = result.filter(p => p.departamento === filtroDepartamento);
        }
        if (filtroTipoPago !== 'todos') {
            result = result.filter(p => p.tipo_pago === filtroTipoPago);
        }
        if (filtroFrecuencia !== 'todas') {
            result = result.filter(p => p.frecuencia === filtroFrecuencia);
        }
        if (filtroFechaInicio) {
            result = result.filter(p => p.siguiente_fecha && new Date(p.siguiente_fecha) >= new Date(filtroFechaInicio));
        }
        if (filtroFechaFin) {
            result = result.filter(p => p.siguiente_fecha && new Date(p.siguiente_fecha) <= new Date(filtroFechaFin));
        }
        if (filtroBusqueda.trim() !== '') {
            const busq = filtroBusqueda.trim().toLowerCase();
            result = result.filter(p =>
                (p.concepto && p.concepto.toLowerCase().includes(busq)) ||
                (p.id_usuario && p.id_usuario.toString().toLowerCase().includes(busq))
            );
        }
        // Ordenar por estado: pendiente, aprobada, rechazada
        const estadoOrder = { pendiente: 0, aprobada: 1, rechazada: 2 };
        result = result.slice().sort((a, b) => {
            const estadoA = estadoOrder[(a.estado?.toLowerCase() ?? '') as keyof typeof estadoOrder] ?? 99;
            const estadoB = estadoOrder[(b.estado?.toLowerCase() ?? '') as keyof typeof estadoOrder] ?? 99;
            if (estadoA !== estadoB) return estadoA - estadoB;
            // Si tienen el mismo estado, ordenar por fecha de creación descendente
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return result;
    }, [recurrentes, filtroEstado, filtroDepartamento, filtroTipoPago, filtroFrecuencia, filtroFechaInicio, filtroFechaFin, filtroBusqueda]);

    const totalPages = Math.ceil(filteredRecurrentes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredRecurrentes.length);
    const currentRecurrentes = filteredRecurrentes.slice(startIndex, endIndex);

    // Reinicia la página actual a 1 cuando cambia el filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [filtroEstado]);


    return (
        <ProtectedRoute requiredRoles={['solicitante']}>
            <SolicitanteLayout>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 shadow-sm">
                                <FileText className="text-blue-600 w-7 h-7" />
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Mis Recurrentes</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <Button
                                onClick={() => router.push('/dashboard/solicitante/recurrentes')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-bold shadow-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                            >
                                <Plus className="w-5 h-5" /> Nueva Plantilla
                            </Button>
                            
                            {/* Controles de exportación */}
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20 shadow-xl">
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-white/80 text-sm font-medium">Exportar como:</span>
                                    <select
                                        value={exportFormat}
                                        onChange={e => setExportFormat(e.target.value)}
                                        className="bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="excel">Excel</option>
                                        <option value="csv">CSV</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 px-2 border-l border-white/10">
                                    <span className="text-white/80 text-sm font-medium">Período:</span>
                                    <select
                                        value={exportRango}
                                        onChange={e => setExportRango(e.target.value)}
                                        className="bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                                    >
                                        <option value="dia">Último día</option>
                                        <option value="semana">Última semana</option>
                                        <option value="mes">Último mes</option>
                                        <option value="año">Último año</option>
                                        <option value="total">Todo el historial</option>
                                    </select>
                                </div>
                                <Button
                                    onClick={handleExport}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg inline-flex items-center gap-2 transition-all duration-200 border border-white/10"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Exportar</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-100 text-red-800 border border-red-300 p-4 rounded mb-4">{error}</div>}
                    {success && <div className="bg-green-100 text-green-800 border border-green-300 p-4 rounded mb-4">{success}</div>}

                    {/* Controles de Filtro Visual Mejorada */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl border border-white/20 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Estado</label>
                                <select
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                >
                                    <option value="todas">Todas</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="aprobada">Aprobada</option>
                                    <option value="rechazada">Rechazada</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Departamento</label>
                                <select
                                    value={filtroDepartamento}
                                    onChange={(e) => setFiltroDepartamento(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                >
                                    <option value="todos">Todos</option>
                                    {departamentos.map(dep => (
                                        <option key={dep} value={dep}>
                                            {dep.charAt(0).toUpperCase() + dep.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Tipo de Pago</label>
                                <select
                                    value={filtroTipoPago}
                                    onChange={(e) => setFiltroTipoPago(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                >
                                    <option value="todos">Todos</option>
                                    {tiposPago.map(tp => (
                                        <option key={tp} value={tp}>
                                            {tp.charAt(0).toUpperCase() + tp.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Frecuencia</label>
                                <select
                                    value={filtroFrecuencia}
                                    onChange={(e) => setFiltroFrecuencia(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                >
                                    <option value="todas">Todas</option>
                                    {frecuencias.map(f => (
                                        <option key={f} value={f}>
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Siguiente Fecha</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={filtroFechaInicio}
                                        onChange={e => setFiltroFechaInicio(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    />
                                    <span className="text-white/70 self-center">a</span>
                                    <input
                                        type="date"
                                        value={filtroFechaFin}
                                        onChange={e => setFiltroFechaFin(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-white/90 text-sm font-semibold mb-2">Buscar por Concepto o Usuario</label>
                                <input
                                    type="text"
                                    placeholder="Concepto o Usuario"
                                    value={filtroBusqueda}
                                    onChange={e => setFiltroBusqueda(e.target.value)}
                                    className="px-3 py-2 rounded-lg bg-white text-black border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-white/60 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 overflow-x-auto shadow-xl">
                        <table className="w-full min-w-[1200px]">
                            <thead className="bg-white/10">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-24">Folio</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-16">ID</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-32">Usuario</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-40">Departamento</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-28">Monto</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-36">Cuenta Destino</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-48">Concepto</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-28">Tipo Pago</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-28">Frecuencia</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-28">Estado</th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-white w-28">Activa</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-white w-32">Siguiente Fecha</th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-white w-40">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {loading ? ( // Muestra un mensaje de carga
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-white/80">
                                            Cargando plantillas...
                                        </td>
                                    </tr>
                                ) : currentRecurrentes.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-white/80">
                                            <FileText className="w-12 h-12 mx-auto mb-4 text-white/40" />
                                            <p className="text-lg">No tienes plantillas para el filtro seleccionado.</p>
                                            <p className="text-sm text-white/60 mt-1">Intenta con otro estado o crea una nueva plantilla.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRecurrentes.map((p) => (
                                        <tr key={p.id_recurrente} className="hover:bg-white/10 transition-colors">
                                            <td className="px-4 py-3 text-white font-mono text-sm">{p.folio || '-'}</td>
                                            <td className="px-4 py-3 text-white text-sm">{p.id_recurrente}</td>
                                            <td className="px-4 py-3 text-white text-sm truncate">{p.nombre_usuario ? p.nombre_usuario : p.id_usuario}</td>
                                            <td className="px-4 py-3 text-white text-sm truncate">{p.departamento.charAt(0).toUpperCase() + p.departamento.slice(1)}</td>
                                            <td className="px-4 py-3 text-white font-medium text-sm">{p.monto}</td>
                                            <td className="px-4 py-3 text-white text-sm truncate">{p.cuenta_destino}</td>
                                            <td className="px-4 py-3 text-white text-sm truncate max-w-[200px]">{p.concepto}</td>
                                            <td className="px-8 py-5 text-white">{p.tipo_pago.charAt(0).toUpperCase() + p.tipo_pago.slice(1)}</td>
                                            <td className="px-8 py-5 text-white capitalize">{p.frecuencia}</td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(p.estado)}`}>
                                                    {getEstadoIcon(p.estado)}
                                                    <span className="ml-1 capitalize">{p.estado}</span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span
                                                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border shadow-md cursor-pointer select-none transition-all duration-200 group relative ${p.activo ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}`}
                                                    title={p.activo ? 'Haz clic para desactivar' : 'Haz clic para activar'}
                                                    style={{ minWidth: 110 }}
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        setRecurrenteAToggle(p);
                                                        setToggleModalOpen(true);
                                                    }}
                                                >
                                                    {p.activo ? (
                                                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#22c55e"/><path d="M9 12l2 2l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#ef4444"/><path d="M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                                                    )}
                                                    <span className="capitalize font-semibold">{p.activo ? 'Activo' : 'Inactivo'}</span>
                                                    <span className="ml-2 text-xs font-normal text-gray-500 group-hover:text-gray-700 transition-colors duration-200">(clic para {p.activo ? 'desactivar' : 'activar'})</span>
                                                    {/* Tooltip accesible para usuarios de teclado */}
                                                    <span className="absolute left-1/2 -bottom-8 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none bg-black text-white text-xs rounded px-2 py-1 transition-all duration-200 z-10 whitespace-nowrap">
                                                        {p.activo ? 'Haz clic para desactivar' : 'Haz clic para activar'}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-white text-sm">{formatDate(p.siguiente_fecha)}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setRecurrenteDetalle(p); setDetalleModalOpen(true); }}
                                                        className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                                    </Button>
                                                    {p.estado.toLowerCase() === 'pendiente' && ( // Solo permite editar/eliminar si está pendiente
                                                        <>
                                                            <Button
                                                                onClick={() => router.push(`/dashboard/solicitante/editar-recurrente/${p.id_recurrente}`)}
                                                                className="bg-yellow-500/20 text-yellow-200 border border-yellow-400/40 hover:bg-yellow-500/40"
                                                            >Editar</Button>
                                                            <Button
                                                                onClick={() => { setRecurrenteAEliminar(p); setDeleteModalOpen(true); }}
                                                                className="bg-red-500/20 text-red-200 border border-red-400/40 hover:bg-red-500/40"
                                                            >Eliminar</Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-6 py-4 border-t border-white/10 bg-gradient-to-r from-blue-900/30 to-blue-700/20 mt-2">
                            <div className="text-white/90 text-base font-medium">
                                Mostrando <span className="font-bold text-blue-200">{filteredRecurrentes.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-200">{filteredRecurrentes.length}</span>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredRecurrentes.length}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}

                    {/* Modal de confirmación para activar/desactivar fuera de la tabla */}
                    <ConfirmToggleModal
                        isOpen={toggleModalOpen}
                        onClose={() => { setToggleModalOpen(false); setRecurrenteAToggle(null); }}
                        activo={!!recurrenteAToggle?.activo}
                        onConfirm={async () => {
                            if (!recurrenteAToggle) return;
                            try {
                                const res = await RecurrentesService.cambiarEstadoActiva(recurrenteAToggle.id_recurrente, !recurrenteAToggle.activo);
                                if (res && typeof res === 'object' && 'recurrente' in res && typeof (res as { recurrente: { activo: boolean } }).recurrente === 'object' && (res as { recurrente: { activo: boolean } }).recurrente !== null) {
                                  setRecurrentes(prev => prev.map(r => r.id_recurrente === recurrenteAToggle.id_recurrente ? { ...r, activo: (res as { recurrente: { activo: boolean } }).recurrente.activo } : r));
                                }
                                setSuccess(`Plantilla ${recurrenteAToggle.activo ? 'desactivada' : 'activada'} correctamente.`);
                            } catch {
                                setError('No se pudo cambiar el estado');
                            } finally {
                                setToggleModalOpen(false);
                                setRecurrenteAToggle(null);
                                setTimeout(() => setSuccess(''), 3000);
                            }
                        }}
                    />
                    <ConfirmDeleteSoli
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        onConfirm={handleDelete}
                        title="¿Eliminar plantilla?"
                        message="Esta acción eliminará la plantilla recurrente de forma permanente. No podrás recuperarla."
                        itemName={recurrenteAEliminar?.concepto || ''}
                    />
                    <RecurrenteDetalleModal
                        open={detalleModalOpen}
                        onClose={() => setDetalleModalOpen(false)}
                        recurrente={
                            recurrenteDetalle
                                ? {
                                    id: recurrenteDetalle.id_recurrente?.toString(),
                                    departamento: recurrenteDetalle.departamento,
                                    monto: recurrenteDetalle.monto?.toString(),
                                    cuenta_destino: recurrenteDetalle.cuenta_destino,
                                    concepto: recurrenteDetalle.concepto,
                                    tipo_pago: recurrenteDetalle.tipo_pago,
                                    frecuencia: recurrenteDetalle.frecuencia,
                                    siguiente_fecha: recurrenteDetalle.siguiente_fecha,
                                    activo: (recurrenteDetalle.estado
                                        ? recurrenteDetalle.estado.toLowerCase() !== 'rechazada'
                                        : true),
                                    fact_recurrente: recurrenteDetalle.fact_recurrente,
                                }
                                : null
                        }
                    />
                </div>
            </SolicitanteLayout>
        </ProtectedRoute>
    );
}