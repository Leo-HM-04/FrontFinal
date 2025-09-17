
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
import { Plus, FileText, Clock, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, ChevronDown, Search, Star, Calendar, AlertTriangle } from 'lucide-react';
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
    const [explicacionExpandida, setExplicacionExpandida] = useState(false);
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
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-100 p-2 shadow-sm">
                            <FileText className="text-blue-600 w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7" />
                        </span>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Mis Recurrentes</h1>
                    </div>

                    {/* Sección explicativa colapsible */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-4 mb-6 border border-blue-200 shadow-sm">
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExplicacionExpandida(!explicacionExpandida)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">¿Cómo funcionan los Pagos Recurrentes?</h2>
                                    <p className="text-sm text-gray-600">Haz clic para ver información detallada</p>
                                </div>
                            </div>
                            <ChevronDown 
                                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                                    explicacionExpandida ? 'rotate-180' : ''
                                }`}
                            />
                        </div>
                        
                        {/* Contenido expandible */}
                        {explicacionExpandida && (
                            <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                {/* Explicación general */}
                                <div className="bg-white p-4 rounded-lg border border-blue-200">
                                    <p className="text-gray-700 leading-relaxed">
                                        Los <strong>Pagos Recurrentes</strong> te permiten automatizar solicitudes de pago regulares. 
                                        Una vez configurada una plantilla, el sistema creará automáticamente las solicitudes cada mes, 
                                        ahorrándote tiempo y asegurando que no olvides pagos importantes.
                                    </p>
                                </div>

                                {/* Proceso paso a paso */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                                        <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">Paso 1</div>
                                        <h3 className="font-semibold text-blue-900 mb-2">Crear Plantilla</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Configura todos los datos del pago: beneficiario, monto, concepto, frecuencia y fechas.
                                        </p>
                                        <ul className="text-xs text-gray-500 space-y-1">
                                            <li>• Define el monto y concepto</li>
                                            <li>• Selecciona la frecuencia</li>
                                            <li>• Configura fechas de inicio y fin</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-green-200">
                                        <div className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">Paso 2</div>
                                        <h3 className="font-semibold text-green-900 mb-2">Generación Automática</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            El sistema crea solicitudes automáticamente según la frecuencia configurada.
                                        </p>
                                        <ul className="text-xs text-gray-500 space-y-1">
                                            <li>• Mensual, quincenal, etc.</li>
                                            <li>• Se crean al inicio del período</li>
                                            <li>• Mantiene todos los datos originales</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                                        <div className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">Paso 3</div>
                                        <h3 className="font-semibold text-orange-900 mb-2">Revisión y Actualización</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Tienes hasta el día 5 de cada mes para revisar y modificar las solicitudes generadas.
                                        </p>
                                        <ul className="text-xs text-gray-500 space-y-1">
                                            <li>• Revisa montos y datos</li>
                                            <li>• Actualiza si es necesario</li>
                                            <li>• Elimina si no aplica ese mes</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-purple-200">
                                        <div className="bg-purple-100 text-purple-800 text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">Paso 4</div>
                                        <h3 className="font-semibold text-purple-900 mb-2">Control Total</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Activa, desactiva o elimina plantillas cuando lo necesites.
                                        </p>
                                        <ul className="text-xs text-gray-500 space-y-1">
                                            <li>• Pausa temporalmente</li>
                                            <li>• Modifica configuración</li>
                                            <li>• Elimina cuando no se necesite</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Beneficios */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-5 h-5 text-green-600" />
                                        <h3 className="font-semibold text-green-900">Beneficios de los Pagos Recurrentes</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                        <div>• <strong>Ahorro de tiempo:</strong> No necesitas crear solicitudes manualmente cada mes</div>
                                        <div>• <strong>No olvidos:</strong> El sistema se encarga de recordar todos los pagos</div>
                                        <div>• <strong>Consistencia:</strong> Mantiene la información exacta cada vez</div>
                                        <div>• <strong>Control:</strong> Siempre puedes revisar y modificar antes del procesamiento</div>
                                    </div>
                                </div>

                                {/* Fechas importantes */}
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-orange-600" />
                                        <h3 className="font-semibold text-orange-900">Fechas Importantes a Recordar</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="bg-white p-3 rounded border">
                                            <div className="font-semibold text-blue-900">Día 1-3</div>
                                            <div className="text-gray-600">Se generan las solicitudes automáticamente</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="font-semibold text-orange-900">Día 4-5</div>
                                            <div className="text-gray-600">Último día para revisar y modificar</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="font-semibold text-green-900">Día 6+</div>
                                            <div className="text-gray-600">Las solicitudes pasan a aprobación</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerta importante */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                                    <div className="bg-yellow-400 p-2 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-4 h-4 text-yellow-900" />
                                            <p className="font-semibold text-yellow-900">Importante</p>
                                        </div>
                                        <p className="text-yellow-800 text-sm">
                                            Revisa tus plantillas antes del día 5 de cada mes para mantener la información actualizada. 
                                            Después de esta fecha, las solicitudes pasan automáticamente al proceso de aprobación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <div className="bg-red-100 text-red-800 border border-red-300 p-3 sm:p-4 rounded mb-4 text-sm">{error}</div>}
                    {success && <div className="bg-green-100 text-green-800 border border-green-300 p-3 sm:p-4 rounded mb-4 text-sm">{success}</div>}

                    {/* Filtros y acciones compactas */}
                    <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-900">Filtros y Acciones</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => router.push('/dashboard/solicitante/recurrentes')}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva
                                </Button>
                                <Button
                                    onClick={() => setExportModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow-sm"
                                >
                                    <FileText className="w-4 h-4" />
                                    Exportar
                                </Button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {/* Búsqueda */}
                            <div className="relative sm:col-span-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={filtroBusqueda}
                                    onChange={e => setFiltroBusqueda(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Estado */}
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todas">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="aprobada">Aprobada</option>
                                <option value="rechazada">Rechazada</option>
                            </select>

                            {/* Frecuencia */}
                            <select
                                value={filtroFrecuencia}
                                onChange={(e) => setFiltroFrecuencia(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="todas">Todas las frecuencias</option>
                                {frecuencias.map(f => (
                                    <option key={f} value={f}>
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {/* Limpiar */}
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
                                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-blue-200"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {/* Tabla/Tarjetas de recurrentes responsiva */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl">
                        {/* Vista de tabla para desktop */}
                        <div className="hidden lg:block overflow-x-auto">
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                                                Cargando plantillas...
                                            </td>
                                        </tr>
                                    ) : currentRecurrentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
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
                                                        {p.estado.toLowerCase() === 'pendiente' && (
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

                        {/* Vista de tarjetas para móvil y tablet */}
                        <div className="lg:hidden">
                            {loading ? (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    Cargando plantillas...
                                </div>
                            ) : currentRecurrentes.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg">No tienes plantillas para el filtro seleccionado.</p>
                                    <p className="text-sm text-gray-400 mt-1">Intenta con otro estado o crea una nueva plantilla.</p>
                                </div>
                            ) : (
                                <div className="p-3 space-y-3">
                                    {currentRecurrentes.map((p) => {
                                        const isHighlighted = highlightedId === p.id_recurrente;
                                        return (
                                            <div 
                                                key={p.id_recurrente}
                                                className={`border border-gray-200 rounded-lg p-4 transition-all ${
                                                    isHighlighted 
                                                        ? 'bg-yellow-100 border-yellow-400 shadow-lg animate-pulse' 
                                                        : 'bg-white hover:shadow-md hover:border-gray-300'
                                                }`}
                                            >
                                                {/* Header de la tarjeta */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded w-fit">
                                                            {p.folio || '-'}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(p.estado)}`}>
                                                                {getEstadoIcon(p.estado)}
                                                                <span className="ml-1 capitalize">{p.estado}</span>
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${p.activo ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}
                                                                onClick={() => {
                                                                    setRecurrenteAToggle(p);
                                                                    setToggleModalOpen(true);
                                                                }}
                                                            >
                                                                {p.activo ? (
                                                                    <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#22c55e"/><path d="M9 12l2 2l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 mr-1 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#ef4444"/><path d="M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                                                                )}
                                                                {p.activo ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                                            ${p.monto}
                                                        </div>
                                                        <div className="text-xs text-gray-500 capitalize">
                                                            {p.frecuencia}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Información principal */}
                                                <div className="space-y-2 mb-4">
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Usuario</span>
                                                        <p className="text-sm text-gray-900 font-medium mt-1">{p.nombre_usuario ? p.nombre_usuario : p.id_usuario}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Departamento</span>
                                                        <p className="text-sm text-gray-900 font-medium mt-1">{p.departamento.charAt(0).toUpperCase() + p.departamento.slice(1)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Concepto</span>
                                                        <p className="text-sm text-gray-900 mt-1">{p.concepto}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuenta Destino</span>
                                                            <p className="text-sm text-gray-900 mt-1 truncate">{p.cuenta_destino}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tipo Pago</span>
                                                            <p className="text-sm text-gray-900 mt-1">{p.tipo_pago.charAt(0).toUpperCase() + p.tipo_pago.slice(1)}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Siguiente Fecha</span>
                                                        <p className="text-sm text-gray-900 mt-1">{formatDate(p.siguiente_fecha)}</p>
                                                    </div>
                                                </div>

                                                {/* Botones de acción */}
                                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                                    <button
                                                        onClick={() => { setRecurrenteDetalle(p); setDetalleModalOpen(true); }}
                                                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Ver
                                                    </button>
                                                    {p.estado.toLowerCase() === 'pendiente' && (
                                                        <>
                                                            <button
                                                                onClick={() => router.push(`/dashboard/solicitante/editar-recurrente/${p.id_recurrente}`)}
                                                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => { setRecurrenteAEliminar(p); setDeleteModalOpen(true); }}
                                                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Eliminar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Paginación responsiva */}
                    {totalPages > 1 && (
                        <div className="bg-white border-t border-gray-200 rounded-b-xl">
                            {/* Información de registros */}
                            <div className="px-3 sm:px-6 py-3 sm:py-4">
                                <div className="text-xs sm:text-sm text-gray-700 font-medium text-center">
                                    Mostrando <span className="font-bold text-blue-600">{filteredRecurrentes.length === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="font-bold text-blue-600">{filteredRecurrentes.length}</span>
                                </div>
                            </div>

                            {/* Paginador Móvil - Diseño VERTICAL */}
                            <div className="flex lg:hidden flex-col items-center gap-2 px-2 py-3 border-t border-gray-100">
                                <div className="text-xs font-medium text-gray-600">
                                    Página {currentPage} de {totalPages}
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded disabled:bg-gray-300 transition-colors"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded disabled:bg-gray-300 transition-colors"
                                    >
                                        Siguiente
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Paginador Desktop */}
                            <div className="hidden lg:flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-100">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    itemsPerPage={itemsPerPage}
                                    totalItems={filteredRecurrentes.length}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
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