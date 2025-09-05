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
          fetch('/api/estadisticas-pagador-dashboard/resumen-estado', { headers }),
          fetch('/api/estadisticas-pagador-dashboard/tendencia-mensual', { headers })
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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20 max-w-md mx-4">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-inner">
                    <MdInsertChartOutlined className="text-white text-2xl" />
                  </div>
                </div>
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-3">Cargando Dashboard</h3>
              <p className="text-blue-600 font-medium mb-6">Procesando información financiera en tiempo real</p>
              
              <div className="mt-6 w-72 h-3 bg-blue-100 rounded-full overflow-hidden mx-auto shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full animate-pulse shadow-sm" style={{width: '75%'}}></div>
              </div>
              
              <div className="mt-4 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 text-center max-w-lg border border-white/20 mx-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MdInsertChartOutlined className="text-red-600 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent mb-4">Error de Conexión</h3>
              <p className="text-red-600 font-medium mb-6 bg-red-50 rounded-xl p-4 border border-red-200">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <MdInsertChartOutlined className="text-lg" />
                <span>Reintentar Conexión</span>
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
          animation: fadeIn 1.2s ease-out;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.08), 0 8px 25px rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(20px);
        }
        
        .chart-container:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 30px 80px rgba(59, 130, 246, 0.15), 0 12px 35px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card {
          animation: fadeIn 1s ease-out;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s;
        }
        
        .stat-card:hover::before {
          left: 100%;
        }
        
        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15), 0 8px 25px rgba(0, 0, 0, 0.08);
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
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3);
          }
        }
        
        .donut-center {
          animation: float 4s ease-in-out infinite;
        }
        
        .corporate-header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
          position: relative;
          overflow: hidden;
        }
        
        .corporate-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.1;
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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header corporativo con gradiente */}
            <div className="corporate-header shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                    <MdInsertChartOutlined className="text-white text-3xl" />
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Dashboard Analítico</h1>
                  <p className="text-blue-100 text-lg font-medium">Centro de Control de Estadísticas Financieras</p>
                  <div className="mt-6 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20">
                      <span className="text-white font-semibold flex items-center space-x-2">
                        <MdInsertChartOutlined className="text-lg" />
                        <span>Análisis en Tiempo Real</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              
              {/* Gráfica de distribución */}
              <div className="chart-container bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <MdPieChart className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">Distribución por Estado</h2>
                        <p className="text-blue-600 font-medium">Estado actual de las solicitudes</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <MdInfoOutline className="text-lg" />
                        <span className="font-semibold">Total: {totalSolicitudes} solicitudes</span>
                      </div>
                    </div>
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
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-8 text-center donut-center border border-blue-200 shadow-lg">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent text-5xl font-bold mb-2">{totalSolicitudes}</div>
                      <div className="text-blue-700 font-bold text-lg">Total solicitudes</div>
                      <div className="mt-4 inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-blue-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-blue-700 font-semibold">{porcentajePagadas}% pagadas</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {resumenFiltrado.map((estado, index) => {
                        const porcentaje = totalSolicitudes > 0 ? ((estado.total / totalSolicitudes) * 100).toFixed(1) : '0.0';
                        const color = estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors];
                        
                        return (
                          <div key={index} className="stat-card bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center space-x-3 mb-3">
                              <div 
                                className="w-4 h-4 rounded-full shadow-sm animate-pulse" 
                                style={{ background: color?.gradient?.[1] || '#cbd5e1' }}
                              />
                              <span className="text-sm font-bold text-gray-800 capitalize">
                                {estado.estado.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-3xl font-bold mb-3" style={{ color: color?.text }}>
                              {estado.total}
                            </div>
                            <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full progress-bar rounded-full shadow-sm" 
                                style={{ 
                                  width: `${porcentaje}%`, 
                                  background: `linear-gradient(90deg, ${color?.gradient?.join(',') || '#cbd5e1'})`,
                                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              />
                            </div>
                            <div className="mt-2 text-sm font-semibold text-gray-600 text-right">
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
              <div className="chart-container bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <MdTrendingUp className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-900 bg-clip-text text-transparent">Tendencia Mensual</h2>
                        <p className="text-green-600 font-medium">Evolución de montos pagados</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-green-200">
                      <div className="text-green-700 font-bold text-lg">
                        Total: ${tendenciaMensual.reduce((sum, item) => {
                          const monto = Number(item.monto_total);
                          return sum + (isNaN(monto) ? 0 : monto);
                        }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
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
              <div className="chart-container bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <MdInsertChartOutlined className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-900 bg-clip-text text-transparent">Resumen Detallado</h2>
                      <p className="text-blue-600 font-medium">Análisis por estado de solicitudes</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {resumenFiltrado.map((estado, index) => {
                    const color = estadoColors[estado.estado.toLowerCase() as keyof typeof estadoColors];
                    const montoPromedio = estado.total > 0 ? (estado.monto_total / estado.total) : 0;
                    
                    return (
                      <div key={index} className="stat-card bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold text-gray-800 capitalize">
                            {estado.estado.toLowerCase()}
                          </span>
                          <div 
                            className="w-5 h-5 rounded-full shadow-lg animate-pulse" 
                            style={{ background: color?.gradient?.[1] || '#cbd5e1' }}
                          />
                        </div>
                        
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                            <div className="text-3xl font-bold mb-1" style={{ color: color?.text }}>
                              {estado.total}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Solicitudes</div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                            <div className="text-xl font-bold text-blue-800 mb-1">
                              ${estado.monto_total?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">Monto total</div>
                          </div>
                          
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                            <div className="text-lg font-bold text-green-800 mb-1">
                              {isNaN(montoPromedio) || !isFinite(montoPromedio) ? '$0.00' : `$${montoPromedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                            </div>
                            <div className="text-sm text-green-600 font-medium">Promedio por solicitud</div>
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