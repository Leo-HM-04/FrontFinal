
'use client';
import { ExportRecurrenteModal } from '@/components/modals/ExportRecurrenteModal';

import { useEffect, useState, useMemo, Suspense } from 'react'; // Agregamos useMemo
import { useRouter, useSearchParams } from 'next/navigation';
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
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <MisRecurrentesContent />
        </Suspense>
    );
}

function MisRecurrentesContent() {
    // Estados para exportación modal
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportRango, setExportRango] = useState('total');

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

    // Estados para highlighting desde notificaciones
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const searchParams = useSearchParams();

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

    // Manejo de parámetros URL para highlighting
    useEffect(() => {
        const highlightParam = searchParams?.get('highlight');
        if (highlightParam) {
            const id = parseInt(highlightParam);
            if (!isNaN(id)) {
                setHighlightedId(id);
                
                // Buscar la plantilla recurrente y abrir modal si es necesario
                const targetRecurrente = recurrentes.find(r => r.id_recurrente === id);
                if (targetRecurrente) {
                    setRecurrenteDetalle(targetRecurrente);
                    setDetalleModalOpen(true);
                }
                
                setTimeout(() => {
                    setHighlightedId(null);
                    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
                    newSearchParams.delete('highlight');
                    router.replace(
                        `${window.location.pathname}?${newSearchParams.toString()}`,
                        { scroll: false }
                    );
                }, 3000);
            }
        }
    }, [searchParams, router, recurrentes]);

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
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 shadow-sm">
                            <FileText className="text-blue-600 w-7 h-7" />
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Mis Recurrentes</h1>
                    </div>

                    {/* Descripción de funcionamiento de pagos recurrentes */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-8 border-l-4 border-blue-500 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Cómo funcionan los Pagos Recurrentes?</h2>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-200">
                                            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">1</span>
                                                Plantillas Recurrentes
                                            </h3>
                                            <p className="text-gray-700 text-sm">
                                                Las plantillas son formatos predefinidos que contienen toda la información necesaria para generar pagos automáticamente cada mes: concepto, monto, cuenta destino, departamento y frecuencia.
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
                                            <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                                                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">2</span>
                                                Proceso Automático
                                            </h3>
                                            <p className="text-gray-700 text-sm">
                                                Cada mes, el sistema genera automáticamente solicitudes de pago basadas en tus plantillas activas. Estas solicitudes siguen el flujo normal de aprobación: Pendiente → Aprobada → Pagada.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
                                            <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">3</span>
                                                Actualización Mensual
                                            </h3>
                                            <p className="text-gray-700 text-sm">
                                                <strong>¡Importante!</strong> Debes revisar y actualizar tus plantillas cada mes antes del día 5. Puedes modificar montos, cambiar cuentas destino, agregar nuevas plantillas o desactivar las que ya no necesites.
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-200">
                                            <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">4</span>
                                                Gestión y Control
                                            </h3>
                                            <p className="text-gray-700 text-sm">
                                                Puedes activar/desactivar plantillas, editarlas, duplicarlas o eliminarlas en cualquier momento. Las plantillas inactivas no generarán solicitudes automáticas.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-yellow-400 p-2 rounded-lg">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-yellow-900 mb-1">Recordatorio Importante</h4>
                                            <p className="text-yellow-800 text-sm">
                                                Las plantillas activas generan solicitudes automáticamente cada mes. Si no actualizas los montos o datos antes del día 5, se utilizarán los valores de la plantilla actual. 
                                                <strong> Revisa mensualmente tus plantillas para mantener la información actualizada.</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <div className="bg-red-100 text-red-800 border border-red-300 p-4 rounded mb-4">{error}</div>}
                    {success && <div className="bg-green-100 text-green-800 border border-green-300 p-4 rounded mb-4">{success}</div>}

                    {/* Filtros compactos como en la imagen de referencia */}
                    <div className="bg-white rounded-xl p-4 mb-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <span className="text-xl font-semibold text-gray-900">Filtros</span>
                            <span className="text-blue-500 text-sm">Refina tu búsqueda de recurrentes</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Búsqueda */}
                            <div className="flex-1 min-w-[300px]">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar por concepto, departamento, usuario..."
                                        value={filtroBusqueda}
                                        onChange={e => setFiltroBusqueda(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                    />
                                </div>
                            </div>

                            {/* Estado */}
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
                            >
                                <option value="todas">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="aprobada">Aprobada</option>
                                <option value="rechazada">Rechazada</option>
                            </select>

                            {/* Fechas */}
                            <select
                                value={filtroFrecuencia}
                                onChange={(e) => setFiltroFrecuencia(e.target.value)}
                                className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
                            >
                                <option value="todas">Todas las frecuencias</option>
                                {frecuencias.map(f => (
                                    <option key={f} value={f}>
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Limpiar filtros */}
                            <button
                                onClick={() => {
                                    setFiltroEstado('todas');
                                    setFiltroDepartamento('todos');
                                    setFiltroTipoPago('todos');
                                    setFiltroFrecuencia('todas');
                                    setFiltroFechaInicio('');
                                    setFiltroFechaFin('');
                                    setFiltroBusqueda('');
                                }}
                                className="px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Limpiar Filtros
                            </button>

                            {/* Botones de acción */}
                            <div className="flex gap-3 ml-auto">
                                <Button
                                    onClick={() => router.push('/dashboard/solicitante/recurrentes')}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    Nueva Solicitud
                                </Button>
                                <Button
                                    onClick={() => setExportModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 font-medium shadow-lg transition-all"
                                >
                                    <FileText className="w-5 h-5" />
                                    Exportar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xl">
                        <table className="w-full min-w-[1200px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-24">Folio</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">Usuario</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-40">Departamento</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">Monto</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-36">Cuenta Destino</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-48">Concepto</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">Tipo Pago</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">Frecuencia</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-28">Estado</th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-28">Activa</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 w-32">Siguiente Fecha</th>
                                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-900 w-40">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? ( // Muestra un mensaje de carga
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                            Cargando plantillas...
                                        </td>
                                    </tr>
                                ) : currentRecurrentes.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                            <p className="text-lg">No tienes plantillas para el filtro seleccionado.</p>
                                            <p className="text-sm text-gray-400 mt-1">Intenta con otro estado o crea una nueva plantilla.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRecurrentes.map((p) => {
                                        const isHighlighted = highlightedId === p.id_recurrente;
                                        return (
                                            <tr 
                                                key={p.id_recurrente} 
                                                className={`hover:bg-gray-50 transition-colors ${
                                                    isHighlighted 
                                                        ? 'bg-yellow-100 border-2 border-yellow-400 animate-pulse' 
                                                        : ''
                                                }`}
                                            >
                                            <td className="px-4 py-3 text-gray-900 font-mono text-sm">{p.folio || '-'}</td>
                                            <td className="px-4 py-3 text-gray-900 text-sm truncate">{p.nombre_usuario ? p.nombre_usuario : p.id_usuario}</td>
                                            <td className="px-4 py-3 text-gray-900 text-sm truncate">{p.departamento.charAt(0).toUpperCase() + p.departamento.slice(1)}</td>
                                            <td className="px-4 py-3 text-gray-900 font-medium text-sm">{p.monto}</td>
                                            <td className="px-4 py-3 text-gray-900 text-sm truncate">{p.cuenta_destino}</td>
                                            <td className="px-4 py-3 text-gray-900 text-sm truncate max-w-[200px]">{p.concepto}</td>
                                            <td className="px-8 py-5 text-gray-900">{p.tipo_pago.charAt(0).toUpperCase() + p.tipo_pago.slice(1)}</td>
                                            <td className="px-8 py-5 text-gray-900 capitalize">{p.frecuencia}</td>
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
                                            <td className="px-8 py-5 text-gray-900 text-sm">{formatDate(p.siguiente_fecha)}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setRecurrenteDetalle(p); setDetalleModalOpen(true); }}
                                                        className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all duration-300"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" /> Ver
                                                    </Button>
                                                    {p.estado.toLowerCase() === 'pendiente' && ( // Solo permite editar/eliminar si está pendiente
                                                        <>
                                                            <Button
                                                                onClick={() => router.push(`/dashboard/solicitante/editar-recurrente/${p.id_recurrente}`)}
                                                                className="bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100"
                                                            >Editar</Button>
                                                            <Button
                                                                onClick={() => { setRecurrenteAEliminar(p); setDeleteModalOpen(true); }}
                                                                className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                                            >Eliminar</Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white mt-2 rounded-b-xl">
                            <div className="text-gray-700 text-base font-medium">
                                Mostrando <span className="font-bold text-blue-600">{filteredRecurrentes.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-600">{filteredRecurrentes.length}</span>
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
                                    tipo_pago_descripcion: recurrenteDetalle.tipo_pago_descripcion,
                                    empresa_a_pagar: recurrenteDetalle.empresa_a_pagar,
                                    nombre_persona: recurrenteDetalle.nombre_persona,
                                    tipo_cuenta_destino: recurrenteDetalle.tipo_cuenta_destino,
                                    tipo_tarjeta: recurrenteDetalle.tipo_tarjeta,
                                    banco_destino: recurrenteDetalle.banco_destino,
                                    frecuencia: recurrenteDetalle.frecuencia,
                                    siguiente_fecha: recurrenteDetalle.siguiente_fecha,
                                    activo: recurrenteDetalle.activo,
                                    fact_recurrente: recurrenteDetalle.fact_recurrente,
                                    nombre_usuario: recurrenteDetalle.nombre_usuario,
                                    estado: recurrenteDetalle.estado,
                                }
                                : null
                        }
                    />
                    {/* Modal de exportación recurrentes */}
                    <ExportRecurrenteModal
                        isOpen={exportModalOpen}
                        onClose={() => setExportModalOpen(false)}
                        title="Exportar recurrentes"
                        description="Descarga tus plantillas recurrentes en el formato y período que prefieras."
                        onExportPDF={(filter, period) => exportMisRecurrentesPDF(filteredRecurrentes, period)}
                        onExportExcel={(filter, period) => exportMisRecurrentesExcel(filteredRecurrentes, period)}
                        onExportCSV={(filter, period) => exportMisRecurrentesCSV(filteredRecurrentes, period)}
                        selectedPeriod={exportRango}
                        onPeriodChange={setExportRango}
                    />
                </div>
            </SolicitanteLayout>
        </ProtectedRoute>
    );
}