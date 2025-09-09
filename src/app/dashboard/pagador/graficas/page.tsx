'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';

import { useEffect, useState } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  MdInsertChartOutlined, 
  MdTrendingUp, 
  MdFilterList,
  MdCompare,
  MdBusiness,
  MdPayments,
  MdAnalytics,
  MdRefresh,
  MdPieChart,
  MdShowChart,
  MdAttachMoney,
  MdDateRange
} from 'react-icons/md';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
  TimeScale
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { TooltipItem } from 'chart.js';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  ChartDataLabels,
  PointElement,
  LineElement,
  Filler,
  TimeScale
);

type EstadoResumen = { estado: string; total: number; monto_total: number; origen?: string };
type GastoNeto = { departamento: string; gasto_total: number; total_transacciones: number; promedio_por_transaccion: number };
type GastoTipoPago = { tipo_pago: string; total_transacciones: number; monto_total: number; promedio_monto: number };
type TendenciaTemporal = { periodo: string; monto_total: number; total_transacciones: number };
type ResumenMes = { 
  gasto_mes_actual: number; 
  gasto_mes_anterior: number; 
  diferencia: number; 
  porcentaje_cambio: number; 
  transacciones_mes_actual: number; 
};
type Departamento = { departamento: string };

export default function PagadorGraficasPage() {
  const [resumenEstado, setResumenEstado] = useState<EstadoResumen[]>([]);
  const [gastoNeto, setGastoNeto] = useState<GastoNeto[]>([]);
  const [gastosPorTipo, setGastosPorTipo] = useState<GastoTipoPago[]>([]);
  const [tendenciaTemporal, setTendenciaTemporal] = useState<TendenciaTemporal[]>([]);
  const [resumenMesActual, setResumenMesActual] = useState<ResumenMes | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>('');
  const [periodoTemporal, setPeriodoTemporal] = useState<'semana' | 'mes' | 'año'>('mes');
  const [vistaActual, setVistaActual] = useState<'general' | 'departamentos' | 'comparativa' | 'tipos-pago'>('general');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [
          res1, res2, res3, res4, res5, res6
        ] = await Promise.all([
          fetch('/api/estadisticas-pagador-dashboard/resumen-estado', { headers }),
          fetch(`/api/estadisticas-pagador-dashboard/gasto-neto${departamentoSeleccionado ? `?departamento=${departamentoSeleccionado}` : ''}`, { headers }),
          fetch('/api/estadisticas-pagador-dashboard/gastos-por-tipo-pago', { headers }),
          fetch(`/api/estadisticas-pagador-dashboard/tendencia-temporal?periodo=${periodoTemporal}`, { headers }),
          fetch('/api/estadisticas-pagador-dashboard/resumen-mes-actual', { headers }),
          fetch('/api/estadisticas-pagador-dashboard/departamentos', { headers })
        ]);
        
        if (!res1.ok || !res2.ok || !res3.ok || !res4.ok || !res5.ok || !res6.ok) {
          throw new Error('Error al obtener datos');
        }
        
        setResumenEstado(await res1.json());
        setGastoNeto(await res2.json());
        setGastosPorTipo(await res3.json());
        setTendenciaTemporal(await res4.json());
        setResumenMesActual(await res5.json());
        setDepartamentos(await res6.json());
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [departamentoSeleccionado, periodoTemporal]);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <div className="animate-spin w-10 h-10 border-3 border-white border-t-transparent rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                Cargando Dashboard
              </h3>
              <p className="text-gray-600 mb-6 text-lg">Procesando información financiera...</p>
              
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mx-auto shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse shadow-sm" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-red-200/50 p-8 text-center max-w-md mx-4">
              <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MdInsertChartOutlined className="text-white text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Error de Conexión</h3>
              <p className="text-gray-600 mb-6 bg-red-50 rounded-xl p-4 border border-red-200 text-sm leading-relaxed">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Reintentar
              </button>
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    );
  }

  // Funciones auxiliares
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDepartmentName = (departamento: string) => {
    if (departamento.toLowerCase() === 'ti') {
      return 'TI';
    }
    return departamento.charAt(0).toUpperCase() + departamento.slice(1).toLowerCase();
  };

  // Consolidar estados duplicados
  const estadosConsolidados = resumenEstado.reduce((acc, estado) => {
    const estadoKey = estado.estado.toLowerCase();
    const existing = acc.find(item => item.estado.toLowerCase() === estadoKey);
    
    if (existing) {
      existing.total += estado.total;
      existing.monto_total += estado.monto_total;
    } else {
      acc.push({ ...estado });
    }
    
    return acc;
  }, [] as EstadoResumen[]);

  // Calcular total de solicitudes usando estados consolidados
  const totalSolicitudes = estadosConsolidados.reduce((acc: number, curr) => acc + curr.total, 0);

  // Datos para gráfica de pie mejorada
  const pieData = {
    labels: estadosConsolidados.map(estado => estado.estado.charAt(0).toUpperCase() + estado.estado.slice(1)),
    datasets: [{
      data: estadosConsolidados.map(estado => estado.total),
      backgroundColor: [
        'rgba(99, 102, 241, 0.85)',
        'rgba(16, 185, 129, 0.85)',
        'rgba(245, 158, 11, 0.85)',
        'rgba(59, 130, 246, 0.85)',
        'rgba(139, 92, 246, 0.85)'
      ],
      borderColor: [
        '#6366f1',
        '#10b981',
        '#f59e0b',
        '#3b82f6',
        '#8b5cf6'
      ],
      borderWidth: 3,
      hoverBackgroundColor: [
        'rgba(99, 102, 241, 0.95)',
        'rgba(16, 185, 129, 0.95)',
        'rgba(245, 158, 11, 0.95)',
        'rgba(59, 130, 246, 0.95)',
        'rgba(139, 92, 246, 0.95)'
      ],
      hoverBorderWidth: 4,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.2)'
    }]
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded' as const,
          padding: 20,
          font: { 
            size: 14, 
            weight: 600,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            if (datasets.length) {
              return chart.data.labels.map((label: string, index: number) => {
                const value = datasets[0].data[index];
                const total = datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: datasets[0].backgroundColor[index],
                  strokeStyle: datasets[0].borderColor[index],
                  lineWidth: 2,
                  hidden: false,
                  index
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        titleFont: { 
          weight: 'bold' as const, 
          size: 16,
          family: 'Inter, system-ui, sans-serif'
        },
        bodyColor: '#374151',
        bodyFont: {
          size: 14,
          family: 'Inter, system-ui, sans-serif'
        },
        borderColor: '#d1d5db',
        borderWidth: 2,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} solicitudes (${percentage}%)`;
          },
          afterLabel: (context: TooltipItem<'pie'>) => {
            const idx = context.dataIndex;
            const estado = estadosConsolidados[idx];
            if (estado && typeof estado.monto_total === 'number') {
              return `Monto: ${formatCurrency(estado.monto_total)}`;
            }
            return '';
          }
        }
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 2000,
      easing: 'easeInOutCubic' as const
    }
  };

  // Renderizar barra superior con métricas mejorada
  const renderBarraSuperior = () => {
    if (!resumenMesActual) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* Mes Actual */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl border border-blue-400/30 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <MdAttachMoney className="text-3xl" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full">
                <span className="text-xs font-semibold">Mes Actual</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black tracking-tight">
                {formatCurrency(resumenMesActual.gasto_mes_actual)}
              </div>
              <div className="text-blue-100 font-medium">
                {resumenMesActual.transacciones_mes_actual} transacciones
              </div>
            </div>
          </div>
        </div>

        {/* Comparación */}
        <div className={`group relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl border border-opacity-30 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] ${
          resumenMesActual.diferencia >= 0 
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-red-400' 
            : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 border-emerald-400'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <MdTrendingUp className="text-3xl" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full">
                <span className="text-xs font-semibold">vs Mes Anterior</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black tracking-tight">
                {formatCurrency(Math.abs(resumenMesActual.diferencia))}
              </div>
              <div className={`font-medium ${resumenMesActual.diferencia >= 0 ? 'text-red-100' : 'text-emerald-100'}`}>
                {formatPercentage(resumenMesActual.porcentaje_cambio)} cambio
              </div>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl border border-purple-400/30 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <MdAnalytics className="text-3xl" />
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full">
                <span className="text-xs font-semibold">Histórico</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black tracking-tight">
                {formatCurrency(resumenMesActual.gasto_mes_anterior)}
              </div>
              <div className="text-purple-100 font-medium">Mes anterior</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar controles mejorados
  const renderControles = () => (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 mb-10 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <MdFilterList className="text-white text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-xl">Panel de Control</h3>
            <p className="text-sm text-gray-600">Configura la vista y filtros del dashboard</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
          {/* Selector de vista */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Vista</label>
            <div className="relative">
              <select
                value={vistaActual}
                onChange={(e) => setVistaActual(e.target.value as 'general' | 'departamentos' | 'comparativa' | 'tipos-pago')}
                className="appearance-none px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 min-w-[200px] shadow-sm"
              >
                <option value="general">Vista General</option>
                <option value="departamentos">Por Departamentos</option>
                <option value="tipos-pago">Por Tipos de Pago</option>
                <option value="comparativa">Comparativas</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Selector de departamento */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Departamento</label>
            <div className="relative">
              <select
                value={departamentoSeleccionado}
                onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
                className="appearance-none px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 min-w-[200px] shadow-sm"
              >
                <option value="">Todos los departamentos</option>
                {departamentos.map((dept) => (
                  <option key={dept.departamento} value={dept.departamento}>
                    {formatDepartmentName(dept.departamento)}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Selector de período */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Período</label>
            <div className="flex bg-gray-100 rounded-xl p-1 border-2 border-gray-200 shadow-inner">
              {[
                { key: 'semana', label: 'Semana' },
                { key: 'mes', label: 'Mes' },
                { key: 'año', label: 'Año' }
              ].map((periodo) => (
                <button
                  key={periodo.key}
                  onClick={() => setPeriodoTemporal(periodo.key as 'semana' | 'mes' | 'año')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    periodoTemporal === periodo.key
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {periodo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botón de actualizar */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Acción</label>
            <button
              onClick={() => window.location.reload()}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdRefresh className="text-lg group-hover:rotate-180 transition-transform duration-500" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Header mejorado */}
              <div className="text-center mb-12">
                <h1 className="text-6xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 tracking-tight">
                  Graficas 
                </h1>
                <p className="text-gray-600 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  Análisis detallado y visualización inteligente de pagos, transacciones y tendencias financieras
                </p>
              </div>

              {/* Barra superior con métricas */}
              {renderBarraSuperior()}

              {/* Controles */}
              {renderControles()}

              {/* Contenido según la vista seleccionada */}
              {vistaActual === 'general' && (
                <>
                  {/* Grid de gráficas principales */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Gráfica de estado */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <MdPieChart className="text-white text-lg" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">Distribución por Estado</h2>
                              <p className="text-sm text-gray-600">Estado actual de las solicitudes</p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                            <span className="text-sm font-bold">{totalSolicitudes} solicitudes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="h-96">
                          {resumenEstado.length > 0 ? (
                            <Pie data={pieData} options={pieOptions} />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <MdPieChart size={64} className="mb-4 opacity-50" />
                              <p className="text-lg font-semibold">Sin datos disponibles</p>
                              <p className="text-sm">Los datos aparecerán aquí cuando estén disponibles</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tendencia temporal */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                              <MdTrendingUp className="text-white text-lg" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">
                                Tendencia por {periodoTemporal}
                              </h2>
                              <p className="text-sm text-gray-600">
                                Evolución de gastos ({periodoTemporal})
                              </p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-full shadow-lg">
                            <span className="text-sm font-bold">
                              {formatCurrency(tendenciaTemporal.reduce((sum, item) => sum + item.monto_total, 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="h-96">
                          {tendenciaTemporal.length > 0 ? (
                            <Bar 
                              data={{
                                labels: tendenciaTemporal.map(item => item.periodo),
                                datasets: [{
                                  label: 'Monto Total',
                                  data: tendenciaTemporal.map(item => item.monto_total),
                                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                  borderColor: 'rgb(16, 185, 129)',
                                  borderWidth: 2,
                                  borderRadius: 12,
                                  borderSkipped: false,
                                  hoverBackgroundColor: 'rgba(16, 185, 129, 0.9)',
                                  hoverBorderColor: 'rgb(5, 150, 105)',
                                  hoverBorderWidth: 3
                                }]
                              }} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    titleColor: '#1e293b',
                                    bodyColor: '#374151',
                                    borderColor: '#d1d5db',
                                    borderWidth: 2,
                                    cornerRadius: 12,
                                    padding: 16,
                                    callbacks: {
                                      label: (context: TooltipItem<'bar'>) => formatCurrency(context.parsed.y)
                                    }
                                  }
                                },
                                scales: {
                                  x: {
                                    grid: {
                                      display: false
                                    },
                                    ticks: {
                                      color: '#6b7280',
                                      font: {
                                        weight: 'bold'
                                      }
                                    }
                                  },
                                  y: {
                                    beginAtZero: true,
                                    grid: {
                                      color: 'rgba(107, 114, 128, 0.1)'
                                    },
                                    ticks: {
                                      color: '#6b7280',
                                      font: {
                                        weight: 'bold'
                                      },
                                      callback: (value: string | number) => formatCurrency(Number(value))
                                    }
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <MdShowChart size={64} className="mb-4 opacity-50" />
                              <p className="text-lg font-semibold">Sin datos de tendencia</p>
                              <p className="text-sm">Los datos aparecerán cuando haya información temporal</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {vistaActual === 'departamentos' && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MdBusiness className="text-white text-xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Gastos por Departamento</h2>
                        <p className="text-sm text-gray-600">Distribución de gastos por área organizacional</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    {gastoNeto.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gastoNeto.map((dept, index) => (
                          <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl p-6 shadow-lg border border-blue-200/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900 text-lg truncate">{formatDepartmentName(dept.departamento)}</h3>
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <MdBusiness className="text-white" />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                                  <div className="text-3xl font-black text-gray-900 mb-1">
                                    {formatCurrency(dept.gasto_total)}
                                  </div>
                                  <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Gasto Total</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3">
                                    <div className="font-bold text-gray-900 text-lg">{dept.total_transacciones}</div>
                                    <div className="text-xs text-gray-600">Transacciones</div>
                                  </div>
                                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3">
                                    <div className="font-bold text-gray-900 text-sm">{formatCurrency(dept.promedio_por_transaccion)}</div>
                                    <div className="text-xs text-gray-600">Promedio</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <MdBusiness size={64} className="mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Sin datos de departamentos</p>
                        <p className="text-sm">Selecciona un filtro diferente o verifica la conexión</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {vistaActual === 'tipos-pago' && (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <MdPayments className="text-white text-xl" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Gastos por Tipo de Pago</h2>
                          <p className="text-sm text-gray-600">Análisis detallado por método de pago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grid de contenido optimizado */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Gráfica principal - más compacta */}
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
                      <div className="h-80 lg:h-96">
                        {gastosPorTipo.length > 0 ? (
                          <Doughnut 
                            data={{
                              labels: gastosPorTipo.map(tipo => tipo.tipo_pago),
                              datasets: [{
                                data: gastosPorTipo.map(tipo => tipo.monto_total),
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.85)',
                                  'rgba(16, 185, 129, 0.85)',
                                  'rgba(245, 158, 11, 0.85)',
                                  'rgba(239, 68, 68, 0.85)',
                                  'rgba(139, 92, 246, 0.85)',
                                  'rgba(236, 72, 153, 0.85)'
                                ],
                                borderWidth: 3,
                                borderColor: '#fff',
                                hoverBackgroundColor: [
                                  'rgba(59, 130, 246, 0.95)',
                                  'rgba(16, 185, 129, 0.95)',
                                  'rgba(245, 158, 11, 0.95)',
                                  'rgba(239, 68, 68, 0.95)',
                                  'rgba(139, 92, 246, 0.95)',
                                  'rgba(236, 72, 153, 0.95)'
                                ],
                                hoverBorderWidth: 4
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              cutout: '65%',
                              plugins: {
                                legend: {
                                  position: 'right' as const,
                                  labels: {
                                    padding: 15,
                                    usePointStyle: true,
                                    font: {
                                      weight: 'bold',
                                      size: 12
                                    },
                                    boxWidth: 12,
                                    boxHeight: 12
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                  titleColor: '#1e293b',
                                  bodyColor: '#374151',
                                  borderColor: '#d1d5db',
                                  borderWidth: 2,
                                  cornerRadius: 12,
                                  padding: 16,
                                  callbacks: {
                                    label: (context: TooltipItem<'doughnut'>) => {
                                      const value = context.parsed;
                                      const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                                      const percentage = ((value / total) * 100).toFixed(1);
                                      return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MdPayments size={64} className="mb-4 opacity-50" />
                            <p className="text-lg font-semibold">Sin datos de tipos de pago</p>
                            <p className="text-sm">Los datos aparecerán cuando haya transacciones</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Panel de detalles optimizado */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg mr-3">
                          <MdAnalytics className="text-white text-lg" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-xl">Detalles por Tipo</h3>
                      </div>
                      
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {gastosPorTipo.map((tipo, index) => (
                          <div key={index} className="group bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-bold text-gray-900 text-lg">{tipo.tipo_pago}</div>
                              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 group-hover:scale-110 transition-transform duration-200"></div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-700 font-medium text-sm">Monto Total</span>
                                  <span className="font-bold text-green-800 text-lg">{formatCurrency(tipo.monto_total)}</span>
                                </div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                                <div className="flex justify-between items-center">
                                  <span className="text-blue-700 font-medium text-sm">Transacciones</span>
                                  <span className="font-bold text-blue-800 text-lg">{tipo.total_transacciones}</span>
                                </div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                                <div className="flex justify-between items-center">
                                  <span className="text-black font-medium text-sm">Promedio</span>
                                  <span className="font-bold text-black text-lg">{formatCurrency(tipo.promedio_monto)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resumen estadístico adicional */}
                  {gastosPorTipo.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
                      <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center">
                        <MdInsertChartOutlined className="mr-2 text-purple-600" />
                        Resumen Estadístico
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <MdPayments className="text-blue-600 text-2xl" />
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-semibold">Total</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(gastosPorTipo.reduce((sum, tipo) => sum + (Number(tipo.monto_total) || 0), 0))}
                          </div>
                          <div className="text-sm text-blue-700">Monto Global</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <MdTrendingUp className="text-green-600 text-2xl" />
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">Tipos</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900">{gastosPorTipo.length}</div>
                          <div className="text-sm text-green-700">Métodos de Pago</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <MdAnalytics className="text-purple-600 text-2xl" />
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-semibold">Total</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {gastosPorTipo.reduce((sum, tipo) => sum + (Number(tipo.total_transacciones) || 0), 0)}
                          </div>
                          <div className="text-sm text-purple-700">Transacciones</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <MdAttachMoney className="text-orange-600 text-2xl" />
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-semibold">Promedio</span>
                          </div>
                          <div className="text-2xl font-bold text-orange-900">
                            {(() => {
                              const totalMonto = gastosPorTipo.reduce((sum, tipo) => sum + (Number(tipo.monto_total) || 0), 0);
                              const totalTransacciones = gastosPorTipo.reduce((sum, tipo) => sum + (Number(tipo.total_transacciones) || 0), 0);
                              const promedio = totalTransacciones > 0 ? totalMonto / totalTransacciones : 0;
                              return formatCurrency(promedio);
                            })()}
                          </div>
                          <div className="text-sm text-orange-700">Por Transacción</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {vistaActual === 'comparativa' && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MdCompare className="text-white text-xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Análisis Comparativo</h2>
                        <p className="text-sm text-gray-600">Comparaciones avanzadas de períodos y categorías</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-12">
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <MdCompare size={48} className="text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Funciones Comparativas</h3>
                      <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto leading-relaxed">
                        Las herramientas de análisis comparativo y benchmarking estarán disponibles próximamente
                      </p>
                      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full shadow-lg">
                        <MdDateRange className="mr-2" />
                        <span className="font-semibold">En desarrollo</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    </>
  );
}