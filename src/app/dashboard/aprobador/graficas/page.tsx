'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
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
  MdDateRange,
  MdErrorOutline
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

export default function AprobadorGraficasPage() {
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
          fetch('/api/estadisticas-aprobador-dashboard/resumen-estado', { headers }),
          fetch(`/api/estadisticas-aprobador-dashboard/gasto-neto${departamentoSeleccionado ? `?departamento=${departamentoSeleccionado}` : ''}`, { headers }),
          fetch('/api/estadisticas-aprobador-dashboard/gastos-por-tipo-pago', { headers }),
          fetch(`/api/estadisticas-aprobador-dashboard/tendencia-temporal?periodo=${periodoTemporal}`, { headers }),
          fetch('/api/estadisticas-aprobador-dashboard/resumen-mes-actual', { headers }),
          fetch('/api/estadisticas-aprobador-dashboard/departamentos', { headers })
        ]);
        
        if (!res1.ok || !res2.ok || !res3.ok || !res4.ok || !res5.ok || !res6.ok) {
          throw new Error('Error al obtener datos');
        }
        
        const [data1, data2, data3, data4, data5, data6] = await Promise.all([
          res1.json(),
          res2.json(),
          res3.json(),
          res4.json(),
          res5.json(),
          res6.json()
        ]);
        
        setResumenEstado(data1);
        setGastoNeto(data2);
        setGastosPorTipo(data3);
        setTendenciaTemporal(data4);
        setResumenMesActual(data5);
        setDepartamentos(data6);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [departamentoSeleccionado, periodoTemporal]);

  const formatCurrency = (amount: number): string => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <div className="absolute inset-0 rounded-full bg-blue-100/20 blur-xl"></div>
              </div>
              <p className="text-xl font-medium text-gray-600">Cargando estadísticas...</p>
              <p className="text-sm text-gray-500 mt-2">Preparando tu dashboard ejecutivo</p>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/50">
              <div className="text-red-500 text-6xl mb-6 flex justify-center">
                <div className="bg-red-50 p-4 rounded-full">
                  <MdErrorOutline size={56} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Error al cargar datos</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  // Consolidar estados de múltiples orígenes
  const estadosConsolidados = resumenEstado.reduce((acc: EstadoResumen[], curr) => {
    const existente = acc.find(item => item.estado === curr.estado);
    if (existente) {
      existente.total += curr.total;
      existente.monto_total += curr.monto_total;
    } else {
      acc.push({ ...curr });
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

  return (
    <>
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-10 px-6">
            <div className="max-w-7xl mx-auto">
              
              {/* Header Section */}
              <div className="mb-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="text-center lg:text-left max-w-3xl">
                    <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
                      Dashboard Ejecutivo de Aprobaciones
                    </h1>
                    <p className="text-xl text-gray-600 font-medium leading-relaxed">
                      Análisis completo y métricas avanzadas para la gestión de solicitudes y aprobaciones corporativas
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-4 no-print">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <MdRefresh className="text-xl" />
                      <span>Actualizar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra superior con métricas */}
              {renderBarraSuperior()}

              {/* Navegación de vistas */}
              <div className="mb-12">
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'general', label: 'Vista General', icon: MdInsertChartOutlined },
                      { key: 'departamentos', label: 'Por Departamentos', icon: MdBusiness },
                      { key: 'tipos-pago', label: 'Tipos de Pago', icon: MdPayments },
                      { key: 'comparativa', label: 'Análisis Comparativo', icon: MdCompare }
                    ].map((vista) => (
                      <button
                        key={vista.key}
                        onClick={() => setVistaActual(vista.key as any)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform ${
                          vistaActual === vista.key
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:scale-102'
                        }`}
                      >
                        <vista.icon className="text-lg" />
                        <span className="hidden sm:inline">{vista.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista General */}
              {vistaActual === 'general' && estadosConsolidados.length > 0 && (
                <div className="space-y-12">
                  {/* Gráficas principales */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    {/* Gráfica de pie */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200/50">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <MdPieChart className="text-white text-2xl" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-gray-900">Distribución de Estados</h2>
                            <p className="text-gray-600 text-lg">Análisis visual de solicitudes por estado</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="relative h-96">
                          <Pie data={pieData} options={pieOptions} />
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas detalladas */}
                    <div className="space-y-6">
                      {estadosConsolidados.map((estado, index) => {
                        const porcentaje = ((estado.total / totalSolicitudes) * 100).toFixed(1);
                        const colors = [
                          { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600', light: 'bg-blue-50' },
                          { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-600', light: 'bg-emerald-50' },
                          { bg: 'from-orange-500 to-amber-600', text: 'text-orange-600', light: 'bg-orange-50' },
                          { bg: 'from-red-500 to-rose-600', text: 'text-red-600', light: 'bg-red-50' },
                          { bg: 'from-purple-500 to-indigo-600', text: 'text-purple-600', light: 'bg-purple-50' }
                        ];
                        const color = colors[index % colors.length];

                        return (
                          <div key={estado.estado} className={`${color.light} rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl transition-all duration-300`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 bg-gradient-to-r ${color.bg} rounded-xl flex items-center justify-center shadow-lg`}>
                                  <span className="text-white font-bold text-lg">{estado.estado.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900 capitalize">{estado.estado}</h3>
                                  <p className="text-gray-600">{porcentaje}% del total</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${color.text}`}>{estado.total}</div>
                                <div className="text-sm text-gray-600">solicitudes</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(estado.monto_total)}</div>
                                <div className="text-sm text-gray-600">Monto Total</div>
                              </div>
                              <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(estado.monto_total / estado.total)}</div>
                                <div className="text-sm text-gray-600">Promedio</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensajes para otras vistas */}
              {vistaActual === 'departamentos' && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MdBusiness className="text-white text-xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Análisis por Departamentos</h2>
                        <p className="text-sm text-gray-600">Vista detallada de gastos y transacciones por departamento</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-12">
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <MdBusiness size={48} className="text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Vista por Departamentos</h3>
                      <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto leading-relaxed">
                        El análisis detallado por departamentos estará disponible próximamente con métricas avanzadas
                      </p>
                      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg">
                        <MdDateRange className="mr-2" />
                        <span className="font-semibold">En desarrollo</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vistaActual === 'tipos-pago' && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-gray-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MdPayments className="text-white text-xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Análisis por Tipos de Pago</h2>
                        <p className="text-sm text-gray-600">Distribución y análisis de métodos de pago utilizados</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-12">
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <MdPayments size={48} className="text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Análisis de Tipos de Pago</h3>
                      <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto leading-relaxed">
                        Las métricas detalladas por tipo de pago estarán disponibles próximamente
                      </p>
                      <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg">
                        <MdDateRange className="mr-2" />
                        <span className="font-semibold">En desarrollo</span>
                      </div>
                    </div>
                  </div>
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
        </AprobadorLayout>
      </ProtectedRoute>
    </>
  );
}