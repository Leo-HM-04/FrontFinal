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
  MdPieChart
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando Dashboard</h3>
              <p className="text-gray-600 mb-4">Procesando información financiera...</p>
              
              <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{width: '60%'}}></div>
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md mx-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdInsertChartOutlined className="text-red-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error de Conexión</h3>
              <p className="text-gray-600 mb-6 bg-red-50 rounded-md p-3 border border-red-200 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
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

  // Paleta de colores profesional
  const estadoColors = {
    'pendiente': { 
      bg: 'rgba(99, 102, 241, 0.9)', 
      border: '#6366f1', 
      gradient: ['#818cf8', '#6366f1'], 
      hover: '#4f46e5',
      text: '#4f46e5'
    },
    'autorizada': { 
      bg: 'rgba(16, 185, 129, 0.9)', 
      border: '#10b981', 
      gradient: ['#34d399', '#10b981'], 
      hover: '#059669',
      text: '#059669'
    },
    'rechazada': { 
      bg: 'rgba(245, 158, 11, 0.9)', 
      border: '#f59e0b', 
      gradient: ['#fbbf24', '#f59e0b'], 
      hover: '#d97706',
      text: '#d97706'
    },
    'pagada': { 
      bg: 'rgba(59, 130, 246, 0.9)', 
      border: '#3b82f6', 
      gradient: ['#60a5fa', '#3b82f6'], 
      hover: '#2563eb',
      text: '#2563eb'
    }
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

  // Datos para gráfica de pie (usando estados consolidados)
  const pieData = {
    labels: estadosConsolidados.map(estado => estado.estado.charAt(0).toUpperCase() + estado.estado.slice(1)),
    datasets: [{
      data: estadosConsolidados.map(estado => estado.total),
      backgroundColor: estadosConsolidados.map(estado => 
        estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors]?.bg || 'rgba(203, 213, 225, 0.9)'
      ),
      borderColor: estadosConsolidados.map(estado => 
        estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors]?.border || '#cbd5e1'
      ),
      borderWidth: 3,
      hoverBackgroundColor: estadosConsolidados.map(estado => 
        estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors]?.hover || '#94a3b8'
      ),
      hoverBorderWidth: 4
    }]
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 25,
          font: { 
            size: 16, 
            weight: 600,
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#1f2937',
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

  // Renderizar barra superior con métricas
  const renderBarraSuperior = () => {
    if (!resumenMesActual) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <MdPayments className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Mes Actual</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(resumenMesActual.gasto_mes_actual)}
          </div>
          <div className="text-sm opacity-90">
            {resumenMesActual.transacciones_mes_actual} transacciones
          </div>
        </div>

        <div className={`rounded-xl p-6 text-white shadow-lg ${
          resumenMesActual.diferencia >= 0 
            ? 'bg-gradient-to-r from-red-500 to-red-600' 
            : 'bg-gradient-to-r from-green-500 to-green-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <MdTrendingUp className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">vs Mes Anterior</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(Math.abs(resumenMesActual.diferencia))}
          </div>
          <div className="text-sm opacity-90">
            {formatPercentage(resumenMesActual.porcentaje_cambio)} cambio
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <MdAnalytics className="text-3xl opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Balance</span>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(resumenMesActual.gasto_mes_anterior)}
          </div>
          <div className="text-sm opacity-90">Mes anterior</div>
        </div>
      </div>
    );
  };

  // Renderizar controles de filtros
  const renderControles = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MdFilterList className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Panel de Control</h3>
            <p className="text-sm text-gray-500">Configura la vista y filtros</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Selector de vista */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-2">VISTA</label>
            <select
              value={vistaActual}
              onChange={(e) => setVistaActual(e.target.value as 'general' | 'departamentos' | 'comparativa' | 'tipos-pago')}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[180px]"
            >
              <option value="general">Vista General</option>
              <option value="departamentos">Por Departamentos</option>
              <option value="tipos-pago">Por Tipos de Pago</option>
              <option value="comparativa">Comparativas</option>
            </select>
          </div>

          {/* Selector de departamento */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-2">DEPARTAMENTO</label>
            <select
              value={departamentoSeleccionado}
              onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors min-w-[180px]"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((dept) => (
                <option key={dept.departamento} value={dept.departamento}>
                  {formatDepartmentName(dept.departamento)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de período */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-2">PERÍODO</label>
            <div className="flex bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
              {['semana', 'mes', 'año'].map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => setPeriodoTemporal(periodo as 'semana' | 'mes' | 'año')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all capitalize ${
                    periodoTemporal === periodo
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {periodo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-2">ACCIÓN</label>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdRefresh className="text-lg" />
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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 animate-bounce">
                  <MdInsertChartOutlined className="text-white text-2xl" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                  Dashboard Financiero
                </h1>
                <p className="text-gray-600 text-lg">
                  Análisis detallado de pagos y transacciones
                </p>
              </div>

              {/* Barra superior con métricas */}
              {renderBarraSuperior()}

              {/* Controles */}
              {renderControles()}

              {/* Contenido según la vista seleccionada */}
              {vistaActual === 'general' && (
                <>
                  {/* Gráfica de estado */}
                  <div className="chart-container bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MdPieChart className="text-blue-600 text-lg" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">Distribución por Estado</h2>
                            <p className="text-sm text-gray-500">Estado actual de las solicitudes</p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-md">
                          {totalSolicitudes} solicitudes
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row">
                      <div className="flex-1 p-6">
                        <div className="h-80">
                          {resumenEstado.length > 0 ? (
                            <Pie data={pieData} options={pieOptions} />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <MdPieChart size={48} className="mb-3" />
                              <p className="text-base font-semibold">Sin datos disponibles</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tendencia temporal */}
                  <div className="chart-container bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <MdTrendingUp className="text-green-600 text-lg" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              Tendencia por {periodoTemporal}
                            </h2>
                            <p className="text-sm text-gray-500">
                              Evolución de gastos ({periodoTemporal})
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-md">
                          {formatCurrency(tendenciaTemporal.reduce((sum, item) => sum + item.monto_total, 0))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="h-80">
                        {tendenciaTemporal.length > 0 ? (
                          <Bar 
                            data={{
                              labels: tendenciaTemporal.map(item => item.periodo),
                              datasets: [{
                                label: 'Monto Total',
                                data: tendenciaTemporal.map(item => item.monto_total),
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: 'rgb(59, 130, 246)',
                                borderWidth: 2,
                                borderRadius: 8
                              }]
                            }} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: (context: TooltipItem<'bar'>) => formatCurrency(context.parsed.y)
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: {
                                    callback: (value: string | number) => formatCurrency(Number(value))
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MdInsertChartOutlined size={48} className="mb-3" />
                            <p className="text-base font-semibold">Sin datos disponibles</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {vistaActual === 'departamentos' && (
                <div className="chart-container bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <MdBusiness className="text-yellow-600 text-lg" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Gastos por Departamento</h2>
                        <p className="text-sm text-gray-500">Distribución de gastos por área</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {gastoNeto.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gastoNeto.map((dept, index) => (
                          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-sm border border-blue-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-gray-900 truncate">{formatDepartmentName(dept.departamento)}</h3>
                              <MdBusiness className="text-blue-600" />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(dept.gasto_total)}
                                </div>
                                <div className="text-xs text-gray-500">Gasto Total</div>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Transacciones:</span>
                                <span className="font-medium">{dept.total_transacciones}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Promedio:</span>
                                <span className="font-medium">{formatCurrency(dept.promedio_por_transaccion)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <MdBusiness size={48} className="mb-3" />
                        <p className="text-base font-semibold">Sin datos de departamentos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {vistaActual === 'tipos-pago' && (
                <div className="chart-container bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MdPayments className="text-purple-600 text-lg" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Gastos por Tipo de Pago</h2>
                        <p className="text-sm text-gray-500">Análisis por método de pago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-6">
                      <div className="h-80">
                        {gastosPorTipo.length > 0 ? (
                          <Doughnut 
                            data={{
                              labels: gastosPorTipo.map(tipo => tipo.tipo_pago),
                              datasets: [{
                                data: gastosPorTipo.map(tipo => tipo.monto_total),
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(16, 185, 129, 0.8)',
                                  'rgba(245, 158, 11, 0.8)',
                                  'rgba(239, 68, 68, 0.8)',
                                  'rgba(139, 92, 246, 0.8)'
                                ],
                                borderWidth: 2,
                                borderColor: '#fff'
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right' as const
                                },
                                tooltip: {
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
                            <MdPayments size={48} className="mb-3" />
                            <p className="text-base font-semibold">Sin datos de tipos de pago</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:w-96 bg-gray-50 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Detalles por Tipo</h3>
                      <div className="space-y-4">
                        {gastosPorTipo.map((tipo, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="font-medium text-gray-900 mb-2">{tipo.tipo_pago}</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Monto:</span>
                                <span className="font-medium">{formatCurrency(tipo.monto_total)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Transacciones:</span>
                                <span className="font-medium">{tipo.total_transacciones}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Promedio:</span>
                                <span className="font-medium">{formatCurrency(tipo.promedio_monto)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {vistaActual === 'comparativa' && (
                <div className="chart-container bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <MdCompare className="text-red-600 text-lg" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Análisis Comparativo</h2>
                        <p className="text-sm text-gray-500">Comparaciones de períodos y categorías</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                      <MdCompare size={64} className="mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
                      <p>Las funciones de comparativa estarán disponibles pronto</p>
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
