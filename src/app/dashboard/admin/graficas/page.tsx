"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from "recharts";
import { useState } from "react";
import { TrendingUp, TrendingDown, Users, CreditCard, Clock, CheckCircle } from "lucide-react";

import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Datos expandidos y más realistas
const pagosPorMes = [
  { mes: "Ene", total: 45, objetivo: 50, crecimiento: 12 },
  { mes: "Feb", total: 62, objetivo: 55, crecimiento: 38 },
  { mes: "Mar", total: 38, objetivo: 60, crecimiento: -39 },
  { mes: "Abr", total: 78, objetivo: 65, crecimiento: 105 },
  { mes: "May", total: 85, objetivo: 70, crecimiento: 9 },
  { mes: "Jun", total: 92, objetivo: 75, crecimiento: 8 },
];

const solicitudesPorEstado = [
  { estado: "Aprobadas", value: 156, porcentaje: 65 },
  { estado: "Pendientes", value: 48, porcentaje: 20 },
  { estado: "Rechazadas", value: 36, porcentaje: 15 },
];

const tendenciaSemanal = [
  { semana: "S1", pagos: 18, solicitudes: 42 },
  { semana: "S2", pagos: 22, solicitudes: 38 },
  { semana: "S3", pagos: 28, solicitudes: 45 },
  { semana: "S4", pagos: 32, solicitudes: 52 },
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const GRADIENT_BAR = "url(#barGradient)";
const GRADIENT_AREA = "url(#areaGradient)";

function getTotalPagos() {
  return pagosPorMes.reduce((acc, cur) => acc + cur.total, 0);
}

function getTotalSolicitudes() {
  return solicitudesPorEstado.reduce((acc, cur) => acc + cur.value, 0);
}

function getPromedioCrecimiento() {
  const crecimiento = pagosPorMes.reduce((acc, cur) => acc + cur.crecimiento, 0) / pagosPorMes.length;
  return Math.round(crecimiento * 10) / 10;
}

export default function GraficasAdminPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6m");
  const [activeChart, setActiveChart] = useState("todos");

  const stats = [
    {
      title: "Total Pagos",
      value: getTotalPagos(),
      icon: CreditCard,
      color: "blue",
      change: "+12%",
      positive: true
    },
    {
      title: "Total Solicitudes",
      value: getTotalSolicitudes(),
      icon: Users,
      color: "green",
      change: "+8%",
      positive: true
    },
    {
      title: "Promedio Crecimiento",
      value: `${getPromedioCrecimiento()}%`,
      icon: TrendingUp,
      color: "purple",
      change: "+2.1%",
      positive: true
    },
    {
      title: "Tiempo Respuesta",
      value: "2.3 días",
      icon: Clock,
      color: "orange",
      change: "-15%",
      positive: true
    }
  ];

  return (

    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Dashboard Analytics</h1>
                    <p className="text-slate-600">Resumen ejecutivo de pagos y solicitudes</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                    <option value="1m">1 mes</option>
                    <option value="3m">3 meses</option>
                    <option value="6m">6 meses</option>
                    <option value="1y">1 año</option>
                    </select>
                </div>
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-${stat.color}-50`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                    </div>
                    <div className="flex items-center mt-4">
                        {stat.positive ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                        </span>
                        <span className="text-slate-500 text-sm ml-1">vs mes anterior</span>
                    </div>
                    </div>
                ))}
                </div>

                {/* Filtros de gráficas */}
                <div className="flex flex-wrap gap-2 mb-6">
                {["todos", "pagos", "solicitudes", "tendencias"].map((filter) => (
                    <button
                    key={filter}
                    onClick={() => setActiveChart(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeChart === filter
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                    >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
                </div>

                {/* Gráficas principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {(activeChart === "todos" || activeChart === "pagos") && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Pagos Procesados</h2>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Total: {getTotalPagos()}
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={pagosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="mes" 
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip 
                            contentStyle={{ 
                            borderRadius: 8, 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                        />
                        <Bar 
                            dataKey="total" 
                            fill={GRADIENT_BAR} 
                            radius={[6, 6, 0, 0]} 
                            isAnimationActive={true}
                        />
                        <Bar 
                            dataKey="objetivo" 
                            fill="#e2e8f0" 
                            radius={[6, 6, 0, 0]} 
                            isAnimationActive={true}
                            opacity={0.3}
                        />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                )}

                {(activeChart === "todos" || activeChart === "solicitudes") && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Estado de Solicitudes</h2>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Total: {getTotalSolicitudes()}
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                        <Pie
                            data={solicitudesPorEstado}
                            dataKey="value"
                            nameKey="estado"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={45}
                            label={({ name, percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                            isAnimationActive={true}
                        >
                            {solicitudesPorEstado.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke="#ffffff" 
                                strokeWidth={2} 
                            />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                            borderRadius: 8, 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                        />
                        <Legend 
                            formatter={(value, entry, i) => (
                            <span className="font-semibold text-sm" style={{ color: COLORS[i % COLORS.length] }}>
                                {value}
                            </span>
                            )} 
                        />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                )}
                </div>

                {/* Gráfica de tendencias */}
                {(activeChart === "todos" || activeChart === "tendencias") && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Tendencia Semanal</h2>
                    <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={tendenciaSemanal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                        </defs>
                        <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} 
                        axisLine={false} 
                        tickLine={false} 
                        />
                        <YAxis 
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} 
                        axisLine={false} 
                        tickLine={false} 
                        />
                        <Tooltip 
                        contentStyle={{ 
                            borderRadius: 8, 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                        />
                        <Area 
                        type="monotone" 
                        dataKey="pagos" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        fill={GRADIENT_AREA}
                        isAnimationActive={true}
                        />
                        <Line 
                        type="monotone" 
                        dataKey="solicitudes" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        isAnimationActive={true}
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
                )}

                {/* Resumen de métricas */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Resumen Ejecutivo</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Eficiencia</h3>
                    <p className="text-2xl font-bold text-green-600 mt-1">85%</p>
                    <p className="text-sm text-slate-500">Tasa de aprobación</p>
                    </div>
                    <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Crecimiento</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">+{getPromedioCrecimiento()}%</p>
                    <p className="text-sm text-slate-500">Mensual promedio</p>
                    </div>
                    <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Volumen</h3>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{getTotalSolicitudes()}</p>
                    <p className="text-sm text-slate-500">Solicitudes totales</p>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </AdminLayout>
    </ProtectedRoute>
  );
}