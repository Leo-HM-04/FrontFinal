"use client";

import { useEffect, useState } from "react";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface EstadoData {
  estado: string;
  total: number;
  monto_total: string;
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
      } catch (err: any) {
        setError(err.message || "Error desconocido");
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
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-xl font-medium text-gray-600">Cargando estadísticas...</p>
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
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar datos</h2>
              <p className="text-gray-600">{error}</p>
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
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Sin datos disponibles</h2>
              <p className="text-gray-600">No hay datos para mostrar en este momento.</p>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  // Colores modernos con gradientes
  const colorPalette = [
    { bg: "#3b82f6", hover: "#2563eb", gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" },
    { bg: "#06b6d4", hover: "#0891b2", gradient: "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)" },
    { bg: "#8b5cf6", hover: "#7c3aed", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" },
    { bg: "#f59e0b", hover: "#d97706", gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" },
    { bg: "#10b981", hover: "#059669", gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)" },
    { bg: "#ef4444", hover: "#dc2626", gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" }
  ];

  const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
  const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);

  // Configuración para gráfica de dona
  const doughnutData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Solicitudes",
        data: data.map(d => d.total),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderWidth: 0,
        hoverOffset: 8,
        cutout: "65%",
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: { size: 14, weight: 'bold' as const },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1f2937',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: (ctx: any) => {
            const percentage = ((ctx.parsed / totalSolicitudes) * 100).toFixed(1);
            return `${ctx.label}: ${ctx.parsed} solicitudes (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      duration: 1500,
      easing: 'easeInOutQuart' as const
    } as any
  };

  // Configuración para gráfica de barras mejorada
  const barData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Monto total",
        data: data.map(d => Number(d.monto_total)),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 60,
        borderWidth: 0
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1f2937',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        callbacks: {
          label: (ctx: any) => `Monto: $${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#6b7280', 
          font: { size: 13, weight: 'bold' as const } 
        },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        ticks: { 
          color: '#6b7280', 
          font: { size: 13, weight: 'bold' as const },
          callback: (value: any) => `$${value.toLocaleString()}`
        },
        grid: { 
          color: '#f3f4f6',
          drawBorder: false
        },
        border: { display: false }
      }
    },
    animation: {
      duration: 1800,
      easing: 'easeOutBounce' as const
    }
  };

  return (
    <ProtectedRoute>
      <AprobadorLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header mejorado */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                <span className="text-2xl text-white">📊</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Estadísticas de Solicitudes
              </h1>
              <p className="text-gray-600 text-lg">Panel de control para aprobadores</p>
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Solicitudes</p>
                    <p className="text-3xl font-bold text-gray-800">{totalSolicitudes.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📋</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Monto Total</p>
                    <p className="text-3xl font-bold text-gray-800">${totalMonto.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-green-600 text-xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Estados Activos</p>
                    <p className="text-3xl font-bold text-gray-800">{data.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-purple-600 text-xl">📈</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficas principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gráfica de dona */}
              <div className="group">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Distribución por Estado</h2>
                      <p className="text-gray-600">Cantidad de solicitudes</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-blue-600">🥧</span>
                    </div>
                  </div>
                  
                  <div className="relative h-80">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    {/* Texto central */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-800">{totalSolicitudes}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfica de barras */}
              <div className="group">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Monto por Estado</h2>
                      <p className="text-gray-600">Valores monetarios totales</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-green-600">📊</span>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <Bar data={barData} options={barOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de detalles */}
            <div className="mt-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Detalle por Estado</h2>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((item, index) => {
                      const percentage = ((item.total / totalSolicitudes) * 100).toFixed(1);
                      const color = colorPalette[index % colorPalette.length];
                      
                      return (
                        <div key={item.estado} className="bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 capitalize">{item.estado}</h3>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.bg }}></div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Solicitudes:</span>
                              <span className="font-semibold text-gray-800">{item.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Porcentaje:</span>
                              <span className="font-semibold text-gray-800">{percentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Monto:</span>
                              <span className="font-semibold text-gray-800">${Number(item.monto_total).toLocaleString()}</span>
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
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}