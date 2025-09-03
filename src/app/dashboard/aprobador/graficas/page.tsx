"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { MdAssignment, MdAttachMoney, MdBarChart, MdPieChart, MdStackedBarChart, MdErrorOutline, MdInsertChartOutlined, MdAnalytics } from "react-icons/md";
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

interface TendenciaMes {
  mes: string;
  total: number;
  monto_total: number;
  origen?: string;
}

export default function GraficasAprobador() {
  const [data, setData] = useState<EstadoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tendencia, setTendencia] = useState<TendenciaMes[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        // Resumen por estado
        const res = await fetch("/api/estadisticas-aprobador/resumen-estado", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (!res.ok) throw new Error("Error al obtener datos");
        const json = await res.json();
        setData(json);
        // Tendencia mensual
        const resTend = await fetch("/api/estadisticas-aprobador/tendencia-mensual", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (resTend.ok) {
          const tendenciaJson = await resTend.json();
          setTendencia(tendenciaJson);
        }
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

  // Calcular variación mensual de solicitudes y monto
  let variacionSolicitudes = 0;
  let variacionMonto = 0;
  if (tendencia.length > 1) {
    // Agrupar por mes (puede haber varios orígenes por mes)
    const meses: { [key: string]: { total: number; monto: number } } = {};
    tendencia.forEach((item) => {
      if (!meses[item.mes]) meses[item.mes] = { total: 0, monto: 0 };
      meses[item.mes].total += Number(item.total);
      meses[item.mes].monto += Number(item.monto_total);
    });
    const mesesKeys = Object.keys(meses).sort();
    if (mesesKeys.length >= 2) {
      const mesActual = meses[mesesKeys[mesesKeys.length - 1]];
      const mesAnterior = meses[mesesKeys[mesesKeys.length - 2]];
      variacionSolicitudes = mesAnterior.total === 0 ? 100 : ((mesActual.total - mesAnterior.total) / mesAnterior.total) * 100;
      variacionMonto = mesAnterior.monto === 0 ? 100 : ((mesActual.monto - mesAnterior.monto) / mesAnterior.monto) * 100;
    }
  }

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
      duration: 800,
      easing: 'easeOutQuart' as const
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
      duration: 800,
      easing: 'easeOutQuart' as const
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'autorizada': 
      case 'autorizado': 
        return (
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'pagada': 
      case 'pagado': 
        return (
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'rechazada': 
      case 'rechazado': 
        return (
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pendiente': 
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'en_proceso': 
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default: 
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
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
          <div className="min-h-screen bg-gray-50 py-8 px-6">
            <div className="max-w-7xl mx-auto">
              
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Estadísticas</h1>
                <p className="text-gray-600">Resumen ejecutivo de solicitudes y montos</p>
              </div>

              {/* Cards de estadísticas - Diseño corporativo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Solicitudes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{totalSolicitudes.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm ${variacionSolicitudes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variacionSolicitudes >= 0 ? '+' : ''}{variacionSolicitudes.toFixed(1)}%
                        </span>
                        <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MdAssignment size={24} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Monto Total</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">${totalMonto.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm ${variacionMonto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variacionMonto >= 0 ? '+' : ''}{variacionMonto.toFixed(1)}%
                        </span>
                        <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <MdAttachMoney size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Estados Activos</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{data.length}</p>
                      <p className="text-gray-500 text-sm mt-2">Categorías en proceso</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <MdBarChart size={24} className="text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficas principales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Gráfica de dona */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Distribución por Estado</h2>
                      <p className="text-gray-600 text-sm">Cantidad y porcentaje de solicitudes</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MdPieChart size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="relative h-80 flex items-center justify-center">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{totalSolicitudes}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfica de barras */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Monto por Estado</h2>
                      <p className="text-gray-600 text-sm">Valores monetarios totales</p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <MdStackedBarChart size={20} className="text-green-600" />
                    </div>
                  </div>
                  <div className="relative h-80">
                    <Bar data={barData} options={barOptions} />
                  </div>
                </div>
              </div>

              {/* Panel de insights y detalle */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                      <MdAnalytics size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Insights Ejecutivos</h3>
                      <p className="text-gray-600 text-sm">Análisis automatizado</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Rendimiento Actual</h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        {data.length > 0 && (
                          <>
                            Estado predominante: <span className="font-medium">{data.sort((a, b) => b.total - a.total)[0].estado}</span> con {data.sort((a, b) => b.total - a.total)[0].total} solicitudes 
                            ({((data.sort((a, b) => b.total - a.total)[0].total / totalSolicitudes) * 100).toFixed(1)}% del total).
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Análisis Financiero</h4>
                      </div>
                      <p className="text-sm text-gray-700">
                        Monto promedio por solicitud: <span className="font-medium">${Math.round(totalMonto / totalSolicitudes).toLocaleString()}</span>
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-gray-900">Recomendaciones</h4>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Priorizar revisión de montos altos</li>
                        <li>• Optimizar tiempos de aprobación</li>
                        <li>• Implementar alertas tempranas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Detalle por estado */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Detalle por Estado</h3>
                  
                  <div className="space-y-4">
                    {data.map((item, index) => {
                      const percentage = ((item.total / totalSolicitudes) * 100).toFixed(1);
                      const color = colorPalette[index % colorPalette.length];
                      const avgPerRequest = Math.round(Number(item.monto_total) / item.total);
                      
                      return (
                        <div key={item.estado} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(item.estado)}
                              <div>
                                <h4 className="font-semibold text-gray-900 capitalize">{item.estado}</h4>
                                <p className="text-sm text-gray-600">{percentage}% del total</p>
                              </div>
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color.bg }}
                            ></div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-gray-900">{item.total}</p>
                              <p className="text-xs text-gray-600">Solicitudes</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-gray-900">${Number(item.monto_total).toLocaleString()}</p>
                              <p className="text-xs text-gray-600">Monto Total</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <p className="text-lg font-bold text-gray-900">${avgPerRequest.toLocaleString()}</p>
                              <p className="text-xs text-gray-600">Promedio</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Distribución</span>
                              <span>{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{ 
                                  width: `${percentage}%`, 
                                  backgroundColor: color.bg 
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