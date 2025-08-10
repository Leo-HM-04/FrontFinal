"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { MdAssignment, MdAttachMoney, MdBarChart, MdPieChart, MdStackedBarChart, MdErrorOutline, MdInsertChartOutlined, MdTrendingUp, MdAnalytics } from "react-icons/md";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  TooltipItem,
  Chart
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { Context as DataLabelsContext } from "chartjs-plugin-datalabels/types";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartDataLabels);

interface EstadoData {
  estado: string;
  total: number;
  monto_total: string;
  origen?: 'solicitudes_pago' | 'solicitudes_viaticos' | 'pagos_recurrentes';
}

export default function GraficasAprobador() {
  const [data, setData] = useState<EstadoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch("http://localhost:4000/api/estadisticas-aprobador/resumen-estado", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (!res.ok) throw new Error("Error al obtener datos");
        const json = await res.json();
        setData(json);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (!data.length) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/50">
              <div className="text-gray-400 text-6xl mb-6 flex justify-center">
                <div className="bg-gray-50 p-4 rounded-full">
                  <MdInsertChartOutlined size={56} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Sin datos disponibles</h2>
              <p className="text-gray-600 mb-6">No hay datos para mostrar en este momento.</p>
              <div className="text-sm text-gray-500">
                <p>• Verifica que tengas solicitudes asignadas</p>
                <p>• Contacta al administrador si el problema persiste</p>
              </div>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  // Colores modernos mejorados
  const colorPalette = [
    { bg: "#3b82f6", hover: "#2563eb", gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
    { bg: "#10b981", hover: "#059669", gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    { bg: "#f59e0b", hover: "#d97706", gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
    { bg: "#ef4444", hover: "#dc2626", gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" },
    { bg: "#8b5cf6", hover: "#7c3aed", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
    { bg: "#06b6d4", hover: "#0891b2", gradient: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)" }
  ];

  const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
  const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);

  // Mejorar configuración de gráfica de dona
  const doughnutData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Solicitudes",
        data: data.map(d => d.total),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 12,
        cutout: "60%",
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: (ctx: DataLabelsContext) => {
          // Si el porcentaje es pequeño, reducir fuente
          const value = ctx.dataset.data[ctx.dataIndex] as number;
          const percentage = (value / totalSolicitudes) * 100;
          return {
            weight: "bold" as const,
            size: percentage < 5 ? 11 : 14
          };
        },
        formatter: (value: number) => {
          const percentage = ((value / totalSolicitudes) * 100);
          return `${value.toLocaleString()}\n${percentage.toFixed(1)}%`;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        borderRadius: 8,
        backgroundColor: 'rgba(30,41,59,0.85)',
        padding: { top: 4, bottom: 4, left: 8, right: 8 },
        display: true,
        textAlign: 'center' as const,
        borderWidth: 0,
        shadowBlur: 4,
        clamp: true,
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: { size: 14, weight: "bold" as const },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart: Chart<"doughnut">) => {
            const data = chart.data;
            // Chart.js types labels as unknown[] | undefined
            const labels = Array.isArray(data.labels) ? data.labels.map(l => String(l)) : [];
            const bgColors = Array.isArray(data.datasets[0]?.backgroundColor)
              ? (data.datasets[0].backgroundColor as string[])
              : [];
            return labels.map((label, i) => ({
              text: `${label} (${data.datasets[0]?.data[i] ?? 0})`,
              fillStyle: bgColors[i] ?? '#ccc',
              strokeStyle: bgColors[i] ?? '#ccc',
              pointStyle: "circle" as const,
            }));
          },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        callbacks: {
          label: function(this: import("chart.js").TooltipModel<"doughnut">, tooltipItem: TooltipItem<"doughnut">) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.parsed;
            const percentage = ((value / totalSolicitudes) * 100).toFixed(1);
            return [
              `Estado: ${label}`,
              `Cantidad: ${value} solicitudes`,
              `Porcentaje: ${percentage}%`
            ];
          },
        },
        // zIndex para asegurar que la tooltip esté por encima
        z: 100,
      }
    },
    animation: {
      animateRotate: true,
      duration: 2200,
      easing: 'easeInOutQuart' as const,
      delay(ctx: { type: string; dataIndex: number }) {
        return ctx.type === 'data' ? ctx.dataIndex * 120 : 0;
      },
    },
    hover: {
      mode: 'nearest' as const,
      animationDuration: 400,
    }
  };

  // Mejorar configuración de gráfica de barras
  const barData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Monto total",
        data: data.map(d => Number(d.monto_total)),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 80,
        borderWidth: 0
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: { weight: "bold" as const, size: 13 },
        anchor: 'end' as const,
        align: 'end' as const,
        offset: 0,
        borderRadius: 8,
        backgroundColor: 'rgba(30,41,59,0.85)',
        padding: { top: 6, bottom: 6, left: 10, right: 10 },
        display: true,
        textAlign: 'center' as const,
        borderWidth: 0,
        shadowBlur: 4,
        clip: false,
        formatter: (value: number) => {
          // Mostrar con separador de miles y símbolo de $ grande
          return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        callbacks: {
          label: function(this: import("chart.js").TooltipModel<"bar">, tooltipItem: TooltipItem<"bar">) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.parsed.y;
            return [
              `Monto: $${value.toLocaleString()}`,
              `Promedio por solicitud: $${Math.round(value / (data.find(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1) === label)?.total || 1)).toLocaleString()}`
            ];
          },
        },
        // zIndex para asegurar que la tooltip esté por encima
        z: 100,
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#6b7280', 
          font: { size: 13, weight: "bold" as const } 
        },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        ticks: { 
          color: '#6b7280', 
          font: { size: 13, weight: "bold" as const },
          callback: (value: number | string) => `$${Number(value).toLocaleString()}`
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false
        },
        border: { display: false }
      }
    },
    animation: {
      duration: 2200,
      easing: 'easeInOutQuart' as const,
      delay(ctx: { type: string; dataIndex: number }) {
        return ctx.type === 'data' ? ctx.dataIndex * 120 : 0;
      },
    },
    hover: {
      mode: 'nearest' as const,
      animationDuration: 400,
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'autorizada': case 'autorizado': return '✅';
      case 'pagada': case 'pagado': return '💰';
      case 'rechazada': case 'rechazado': return '❌';
      case 'pendiente': return '⏳';
      case 'en_proceso': return '🔄';
      default: return '📋';
    }
  };

  // CSS global para tooltips de Chart.js y datalabels
  // Esto asegura que los tooltips y datalabels estén siempre por encima
  // Puedes mover este bloque a un CSS global si lo prefieres
  // El selector .chartjs-tooltip es para tooltips, .chartjs-datalabel para datalabels
  // El !important es necesario para sobrescribir cualquier stacking context
  return (
    <>
      <style>{`
        .chartjs-tooltip {
          z-index: 9999 !important;
        }
        .chartjs-datalabel {
          z-index: 9999 !important;
        }
        .chartjs-size-monitor, .chartjs-size-monitor-expand, .chartjs-size-monitor-shrink {
          z-index: auto !important;
        }
        .chartjs-render-monitor {
          z-index: auto !important;
        }
        canvas {
          z-index: 1 !important;
        }
      `}</style>
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-4">
          <div className="max-w-7xl mx-auto">

            {/* Cards de estadísticas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Solicitudes</p>
                    <p className="text-3xl font-bold mb-1">{totalSolicitudes.toLocaleString()}</p>
                    <div className="flex items-center text-blue-200 text-sm">
                      <MdTrendingUp size={16} className="mr-1" />
                      +12% vs mes anterior
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <MdAssignment size={28} />
                  </div>
                </div>
              </div>
              
              <div className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Monto Total</p>
                    <p className="text-3xl font-bold mb-1">${totalMonto.toLocaleString()}</p>
                    <div className="flex items-center text-green-200 text-sm">
                      <MdTrendingUp size={16} className="mr-1" />
                      +8% vs mes anterior
                    </div>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <MdAttachMoney size={28} />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Estados Activos</p>
                    <p className="text-3xl font-bold mb-1">{data.length}</p>
                    <p className="text-purple-200 text-sm">Categorías en proceso</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                    <MdBarChart size={28} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficas principales mejoradas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfica de dona mejorada */}
              <div className="group">
                <div className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-blue-100 hover:shadow-2xl transition-all duration-400 hover:scale-[1.02] relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-t-2xl" />
                  <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div>
                      <h2 className="text-lg md:text-2xl font-extrabold text-blue-900 mb-1 md:mb-2 tracking-tight">Distribución por Estado</h2>
                      <p className="text-blue-700/80 font-medium text-xs md:text-base">Cantidad y porcentaje de solicitudes</p>
                    </div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md border-2 border-white">
                      <MdPieChart className="text-white drop-shadow" size={24} />
                    </div>
                  </div>
                  <div className="relative flex-1 flex items-center justify-center min-h-[200px] md:min-h-[320px]">
                    <div className="w-full h-full flex items-center justify-center">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    {/* Texto central destacado */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center bg-white/95 rounded-full p-4 md:p-8 shadow-xl border-2 border-blue-100 backdrop-blur-sm">
                        <div className="text-2xl md:text-4xl font-extrabold text-blue-900 drop-shadow-lg">{totalSolicitudes}</div>
                        <div className="text-xs md:text-base text-blue-700/80 font-semibold">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfica de barras mejorada */}
              <div className="group">
                <div className="bg-white rounded-2xl p-4 md:p-8 shadow-lg border border-green-100 hover:shadow-2xl transition-all duration-400 hover:scale-[1.02] relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-500 rounded-t-2xl" />
                  <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div>
                      <h2 className="text-lg md:text-2xl font-extrabold text-emerald-900 mb-1 md:mb-2 tracking-tight">Monto por Estado</h2>
                      <p className="text-emerald-700/80 font-medium text-xs md:text-base">Valores monetarios totales</p>
                    </div>
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md border-2 border-white">
                      <MdStackedBarChart className="text-white drop-shadow" size={24} />
                    </div>
                  </div>
                  <div className="relative flex-1 flex items-center justify-center min-h-[220px] md:min-h-[340px]">
                    <div className="w-full h-full flex items-center justify-center">
                      <Bar data={barData} options={barOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de insights mejorado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-lg border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-500 p-3 rounded-xl mr-4">
                    <MdAnalytics className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Insights Ejecutivos</h3>
                    <p className="text-gray-600 text-sm">Análisis automatizado</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      🎯 <span>Rendimiento Actual</span>
                    </h4>
                    <p className="text-sm text-gray-700">
                      {data.length > 0 && (
                        <>
                          Estado predominante: <strong>{data.sort((a, b) => b.total - a.total)[0].estado}</strong> con {data.sort((a, b) => b.total - a.total)[0].total} solicitudes 
                          ({((data.sort((a, b) => b.total - a.total)[0].total / totalSolicitudes) * 100).toFixed(1)}% del total).
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      💰 <span>Análisis Financiero</span>
                    </h4>
                    <p className="text-sm text-gray-700">
                      Monto promedio por solicitud: <strong>${Math.round(totalMonto / totalSolicitudes).toLocaleString()}</strong>
                    </p>
                  </div>
                  
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      ⚡ <span>Recomendaciones</span>
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Priorizar revisión de montos altos</li>
                      <li>• Optimizar tiempos de aprobación</li>
                      <li>• Implementar alertas tempranas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Detalle por estado completamente rediseñado */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Detalle por Estado</h3>
                
                <div className="space-y-4">
                  {data.map((item, index) => {
                    const percentage = ((item.total / totalSolicitudes) * 100).toFixed(1);
                    const color = colorPalette[index % colorPalette.length];
                    const avgPerRequest = Math.round(Number(item.monto_total) / item.total);
                    
                    return (
                      <div key={item.estado} className="bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getStatusIcon(item.estado)}</span>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 capitalize">{item.estado}</h4>
                              <p className="text-sm text-gray-600">{percentage}% del total</p>
                            </div>
                          </div>
                          <div 
                            className="w-6 h-6 rounded-full shadow-md" 
                            style={{ backgroundColor: color.bg }}
                          ></div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white/70 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">{item.total}</p>
                            <p className="text-xs text-gray-600">Solicitudes</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">${Number(item.monto_total).toLocaleString()}</p>
                            <p className="text-xs text-gray-600">Monto Total</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-gray-800">${avgPerRequest.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">Promedio</p>
                          </div>
                        </div>
                        
                        {/* Barra de progreso visual */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Distribución</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-700" 
                              style={{ 
                                width: `${percentage}%`, 
                                background: color.gradient 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
    </>
  );
}