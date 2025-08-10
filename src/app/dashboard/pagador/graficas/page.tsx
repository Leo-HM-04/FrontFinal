'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';

import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { MdInsertChartOutlined, MdTrendingUp, MdPieChart, MdInfoOutline } from 'react-icons/md';
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
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ScriptableContext, TooltipItem } from 'chart.js';
import type { Context as DataLabelsContext } from 'chartjs-plugin-datalabels/types';

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
  Filler
);

type EstadoResumen = { estado: string; total: number; monto_total: number; origen?: string };
type TendenciaMensual = { mes: string; total: number; monto_total: number; origen?: string };

export default function PagadorGraficasPage() {
  const [resumenEstado, setResumenEstado] = useState<EstadoResumen[]>([]);
  const [tendenciaMensual, setTendenciaMensual] = useState<TendenciaMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [res1, res2] = await Promise.all([
          fetch('http://localhost:4000/api/estadisticas-pagador-dashboard/resumen-estado', { headers }),
          fetch('http://localhost:4000/api/estadisticas-pagador-dashboard/tendencia-mensual', { headers })
        ]);
        if (!res1.ok || !res2.ok) throw new Error('Error al obtener datos');
        setResumenEstado(await res1.json());
        setTendenciaMensual(await res2.json());
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
            <div className="text-center bg-white/80 rounded-3xl shadow-xl p-10 glass-effect border border-blue-100 gradient-border">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdInsertChartOutlined className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-800 mb-2">Cargando datos analíticos</p>
              <p className="text-base text-blue-600 font-medium">Procesando información financiera</p>
              
              <div className="mt-6 w-64 h-2 bg-blue-100 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{width: '70%'}}></div>
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
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md border border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdInsertChartOutlined className="text-blue-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-blue-700 mb-2">Error de Conexión</h3>
              <p className="text-blue-500">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    );
  }

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

  // Tema para gráficas
  const chartTheme = {
    fontFamily: '"Inter", sans-serif',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      text: {
        primary: '#1e293b',
        secondary: '#334155'
      }
    }
  };

  // Filtrar solo estados relevantes y agrupar por estado sumando totales y montos
  const estadosPermitidos = ['autorizada', 'autorizado', 'pagada', 'pagado'];
  const resumenFiltradoRaw = resumenEstado.filter(e => estadosPermitidos.includes(e.estado.toLowerCase()));
  const resumenFiltrado = Object.values(
    resumenFiltradoRaw.reduce((acc, curr) => {
      const key = curr.estado.toLowerCase();
      if (!acc[key]) {
        acc[key] = { ...curr };
      } else {
        acc[key].total += curr.total;
        // Sumar solo si ambos son números válidos
        const prevMonto = Number(acc[key].monto_total);
        const currMonto = Number(curr.monto_total);
        acc[key].monto_total = (isNaN(prevMonto) ? 0 : prevMonto) + (isNaN(currMonto) ? 0 : currMonto);
      }
      return acc;
    }, {} as Record<string, EstadoResumen>)
  );
  
  // Datos para gráfica de PASTEL 
  const pieData = {
    labels: resumenFiltrado.map((d) => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        data: resumenFiltrado.map((d) => d.total),
        backgroundColor: resumenFiltrado.map((d) => estadoColors[d.estado.toLowerCase() as keyof typeof estadoColors]?.bg || '#cbd5e1'),
        borderColor: resumenFiltrado.map((d) => estadoColors[d.estado.toLowerCase() as keyof typeof estadoColors]?.border || '#9ca3af'),
        borderWidth: 2,
        hoverOffset: 20,
        hoverBorderWidth: 4,
      },
    ],
  };

  // Opciones para gráfica de PASTEL 
  const pieOptions = {
    plugins: {
      datalabels: {
        color: '#fff',
        font: { 
          weight: 'bold' as const, // Usa literal type
          size: 14, 
          family: chartTheme.fontFamily 
        },
        backgroundColor: (context: DataLabelsContext) => {
          const estado = resumenFiltrado[context.dataIndex]?.estado.toLowerCase();
          return estado ? estadoColors[estado as keyof typeof estadoColors]?.border || '#3b82f6' : '#3b82f6';
        },
        borderRadius: 8,
        padding: 6,
        display: (context: DataLabelsContext) => {
          const data = context.dataset.data as number[];
          return data[context.dataIndex] > 0;
        },
        formatter: (value: number, context: DataLabelsContext) => {
          const data = context.dataset.data as number[];
          const total = data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value}\n(${percentage}%)`;
        },
        textAlign: 'center' as const,
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#1e293b',
          font: { 
            size: 12, 
            weight: 600, // Cambia a number para evitar error de tipo
            family: chartTheme.fontFamily 
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        titleFont: { 
          weight: 'bold' as const, // Usa literal type
          size: 14, 
          family: chartTheme.fontFamily 
        },
        bodyColor: '#334155',
        bodyFont: { 
          weight: 'normal' as const, // Usa literal type
          size: 13, 
          family: chartTheme.fontFamily 
        },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${value} solicitudes (${percentage}%)`;
          },
          afterLabel: (context: TooltipItem<'pie'>) => {
            const idx = context.dataIndex;
            const estado = resumenFiltrado[idx];
            if (estado && typeof estado.monto_total === 'number') {
              return ` Monto total: $${estado.monto_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            }
            return '';
          }
        }
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    // cutout eliminado para que sea pie chart
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1800,
      easing: 'easeInOutCubic' as const
    }
  };

  // Crear gradiente para barras
  const createBarGradient = (ctx: CanvasRenderingContext2D, chartArea: { bottom: number; top: number }) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.9)');
    gradient.addColorStop(1, 'rgba(147, 197, 253, 0.8)');
    return gradient;
  };

  // Datos para gráfica de barras
  const barData = {
    labels: tendenciaMensual.map((d) => d.mes),
    datasets: [
      {
        label: 'Monto Total',
        data: tendenciaMensual.map((d) => d.monto_total),
        backgroundColor: (context: ScriptableContext<'bar'>) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.8)';
          return createBarGradient(ctx, chartArea);
        },
        borderColor: 'rgba(37, 99, 235, 0.8)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        hoverBackgroundColor: 'rgba(37, 99, 235, 0.9)',
        hoverBorderColor: 'rgba(30, 64, 175, 1)',
        hoverBorderWidth: 2,
      },
    ],
  };

  // Opciones para gráfica de barras
  const barOptions = {
    plugins: {
      datalabels: {
        color: '#1e40af',
            font: {
              weight: 'bold' as const, // Usa literal type
              size: 14,
              family: chartTheme.fontFamily
            },
  anchor: 'end' as const,
  align: 'top' as const,
  offset: 18,
            formatter: (value: number) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        display: (context: DataLabelsContext) => {
          const data = context.dataset.data as number[];
          return data[context.dataIndex] > 0;
        }
      },
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e40af',
        titleFont: { 
          weight: 'bold' as const, // Usa literal type
          size: 14, 
          family: chartTheme.fontFamily 
        },
        bodyColor: '#334155',
        bodyFont: { 
          weight: 'normal' as const, // Usa literal type
          size: 13, 
          family: chartTheme.fontFamily 
        },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            return ` $${context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          },
          afterLabel: (context: TooltipItem<'bar'>) => {
            const idx = context.dataIndex;
            const item = tendenciaMensual[idx];
            if (item && item.total) {
              return ` Solicitudes: ${item.total}`;
            }
            return '';
          }
        }
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { 
            size: 12, 
            weight: 600, // Cambia a number para evitar error de tipo
            family: chartTheme.fontFamily 
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { 
            size: 12, 
            weight: 600, // Cambia a number para evitar error de tipo
            family: chartTheme.fontFamily 
          },
          callback: (value: string | number) => {
            const num = typeof value === 'number' ? value : Number(value);
            return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          }
        },
        beginAtZero: true
      }
    },
    animation: {
      duration: 1800,
      easing: 'easeInOutCubic' as const
    }
  };

  // Calcular estadísticas
  const totalSolicitudes = resumenEstado.reduce((acc, curr) => acc + curr.total, 0);
  const pagadas = resumenEstado.find(e => e.estado.toLowerCase() === 'pagada')?.total || 0;
  const porcentajePagadas = totalSolicitudes > 0 ? ((pagadas / totalSolicitudes) * 100).toFixed(1) : '0.0';

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .chart-container {
          animation: fadeIn 0.8s ease-out;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        
        .chart-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(59, 130, 246, 0.15);
        }
        
        .stat-card {
          animation: fadeIn 0.8s ease-out;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.1);
        }
        
        .progress-bar {
          position: relative;
          overflow: hidden;
        }
        
        .progress-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .donut-center {
          animation: float 4s ease-in-out infinite;
        }
        
        .gradient-border {
          position: relative;
        }
        
        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, #3b82f6, #60a5fa, #93c5fd);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      <ProtectedRoute requiredRoles={['pagador_banca']}>
        <PagadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Gráfica de distribución */}
              <div className="chart-container bg-white rounded-2xl p-6 gradient-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 mb-4 md:mb-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MdPieChart className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Distribución por Estado</h2>
                      <p className="text-sm text-gray-500">Estado actual de las solicitudes</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <MdInfoOutline />
                    <span>Total: {totalSolicitudes} solicitudes</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="h-80 lg:h-96">
                    {resumenFiltrado.length > 0 ? (
                      <Pie data={pieData} options={pieOptions} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MdInsertChartOutlined size={48} className="mb-3" />
                        <p className="text-base font-semibold">Sin datos disponibles</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-6 text-center donut-center">
                      <div className="text-4xl font-bold text-blue-700 mb-1">{totalSolicitudes}</div>
                      <div className="text-sm font-medium text-blue-600">Total solicitudes</div>
                      <div className="mt-3 text-sm text-blue-500">
                        <span className="font-semibold">{porcentajePagadas}%</span> pagadas
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {resumenFiltrado.map((estado, index) => {
                        const porcentaje = totalSolicitudes > 0 ? ((estado.total / totalSolicitudes) * 100).toFixed(1) : '0.0';
                        const color = estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors];
                        
                        return (
                          <div key={index} className="stat-card bg-white rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ background: color?.gradient?.[1] || '#cbd5e1' }}
                              />
                              <span className="text-sm font-semibold text-gray-700 capitalize">
                                {estado.estado.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-2xl font-bold" style={{ color: color?.text }}>
                              {estado.total}
                            </div>
                            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full progress-bar rounded-full" 
                                style={{ 
                                  width: `${porcentaje}%`, 
                                  background: `linear-gradient(90deg, ${color?.gradient?.join(',') || '#cbd5e1'})`
                                }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-gray-500 text-right">
                              {porcentaje}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfica de tendencia */}
              <div className="chart-container bg-white rounded-2xl p-6 gradient-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 mb-4 md:mb-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MdTrendingUp className="text-blue-600 text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Tendencia Mensual</h2>
                      <p className="text-sm text-gray-500">Evolución de montos pagados</p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    Total: ${tendenciaMensual.reduce((sum, item) => {
                      const monto = Number(item.monto_total);
                      return sum + (isNaN(monto) ? 0 : monto);
                    }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="h-[28rem]">
                  {tendenciaMensual.length > 0 ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MdInsertChartOutlined size={48} className="mb-3" />
                      <p className="text-base font-semibold">Sin datos disponibles</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen detallado */}
              <div className="chart-container bg-white rounded-2xl p-6 gradient-border">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MdInsertChartOutlined className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Resumen Detallado</h2>
                    <p className="text-sm text-gray-500">Análisis por estado de solicitudes</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {resumenFiltrado.map((estado, index) => {
                    const color = estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors];
                    const montoPromedio = estado.total > 0 ? (estado.monto_total / estado.total) : 0;
                    
                    return (
                      <div key={index} className="stat-card bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {estado.estado.toLowerCase()}
                          </span>
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ background: color?.gradient?.[1] || '#cbd5e1' }}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="text-2xl font-bold" style={{ color: color?.text }}>
                              {estado.total}
                            </div>
                            <div className="text-xs text-gray-500">Solicitudes</div>
                          </div>
                          
                          <div>
                            <div className="text-lg font-semibold text-gray-800">
                              ${estado.monto_total?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                            </div>
                            <div className="text-xs text-gray-500">Monto total</div>
                          </div>
                          
                          <div>
                            <div className="text-md font-medium text-gray-700">
                              {isNaN(montoPromedio) || !isFinite(montoPromedio) ? '$0.00' : `$${montoPromedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            </div>
                            <div className="text-xs text-gray-500">Promedio por solicitud</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </PagadorLayout>
      </ProtectedRoute>
    </>
  );
}