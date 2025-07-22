"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Line, Area, AreaChart } from "recharts";
import { useState } from "react";
import { useEffect as useEffectReact } from "react";
import { TrendingUp, TrendingDown, Users, CreditCard, Clock, CheckCircle } from "lucide-react";

import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { useEffect } from "react";

// API_BASE eliminado, no se usa

function mesNombre(num: number): string {
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][num - 1] || String(num);
}

export default function GraficasAdminPage() {
  // Componente Counter para animar números
  function Counter({ value, duration = 800, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffectReact(() => {
      let startTime: number | null = null;
      function animate(ts: number) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        setDisplay(Math.round(progress * value));
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
      return () => {};
    }, [value, duration]);
    return <span>{display}{suffix}</span>;
  }
  // Animación de entrada para tarjetas
  const [showStats, setShowStats] = useState(false);
  useEffectReact(() => {
    const timeout = setTimeout(() => setShowStats(true), 200);
    return () => clearTimeout(timeout);
  }, []);

 
  // Estado de carga para cada entidad
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingRecurrentes, setLoadingRecurrentes] = useState(true);
  const [loadingNotificaciones, setLoadingNotificaciones] = useState(true);
  const [loadingTendencia, setLoadingTendencia] = useState(true);

  // Estados para cada entidad
  const [activeChart, setActiveChart] = useState<string>("todos");
  const [pagosPorMes, setPagosPorMes] = useState<{ mes: string; total: number }[]>([]);
  const [solicitudesPorEstado, setSolicitudesPorEstado] = useState<{ estado: string; value: number }[]>([]);
  const [usuariosPorRol, setUsuariosPorRol] = useState<{ rol: string; value: number }[]>([]);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<{ bloqueado: string; value: number }[]>([]);
  const [recurrentesPorEstado, setRecurrentesPorEstado] = useState<{ estado: string; value: number }[]>([]);
  const [recurrentesPorFrecuencia, setRecurrentesPorFrecuencia] = useState<{ frecuencia: string; value: number }[]>([]);
  const [notificacionesPorTipo, setNotificacionesPorTipo] = useState<{ tipo: string; value: number }[]>([]);
  // Si tienes los nombres de usuario, usa este estado para mapear IDs a nombres
  const [notificacionesPorUsuario, setNotificacionesPorUsuario] = useState<{ usuario: string | number; value: number; nombre?: string }[]>([]);
  const [usuariosNombres, setUsuariosNombres] = useState<Record<string | number, string>>({});

  useEffect(() => {
    // Solicitudes
    fetch(`/api/estadisticas/solicitudes`)
      .then(res => res.json())
      .then(data => {
        setSolicitudesPorEstado(
          (data.porEstado || []).map((item: { estado: string; total: number }) => ({
            estado: item.estado,
            value: item.total
          }))
        );
        setPagosPorMes(
          (data.porMes || []).map((item: { mes: number; total: number }) => ({
            mes: mesNombre(item.mes),
            total: item.total
          }))
        );
        setLoadingSolicitudes(false);
      });
    // Usuarios
    fetch(`/api/estadisticas/usuarios`)
      .then(res => res.json())
      .then(data => {
        setUsuariosPorRol((data.porRol || []).map((item: { rol: string; total: number }) => ({ rol: item.rol, value: item.total })));
        setUsuariosBloqueados((data.bloqueados || []).map((item: { bloqueado: number; total: number }) => ({ bloqueado: item.bloqueado ? "Bloqueado" : "Activo", value: item.total })));
        setLoadingUsuarios(false);
      });
    // Recurrentes
    fetch(`/api/estadisticas/recurrentes`)
      .then(res => res.json())
      .then(data => {
        setRecurrentesPorEstado((data.porEstado || []).map((item: { estado: string; total: number }) => ({ estado: item.estado, value: item.total })));
        setRecurrentesPorFrecuencia((data.porFrecuencia || []).map((item: { frecuencia: string; total: number }) => ({ frecuencia: item.frecuencia, value: item.total })));
        setLoadingRecurrentes(false);
      });
    // Notificaciones
    fetch(`/api/estadisticas/notificaciones`)
      .then(res => res.json())
      .then(data => {
        setNotificacionesPorTipo((data.porLeida || []).map((item: { leida: number; total: number }) => ({ tipo: item.leida ? "Leída" : "No leída", value: item.total })));
        // Si el backend ya manda nombres, úsalo. Si no, haz fetch de usuarios y mapea.
        if (data.porUsuario && data.porUsuario.length && data.porUsuario[0].nombre) {
          setNotificacionesPorUsuario(data.porUsuario.map((item: { id_usuario: string | number; total: number; nombre?: string }) => ({ usuario: item.id_usuario, value: item.total, nombre: item.nombre })));
        } else {
          setNotificacionesPorUsuario((data.porUsuario || []).map((item: { id_usuario: string | number; total: number }) => ({ usuario: item.id_usuario, value: item.total })));
          // Intentar obtener nombres de usuario si no vienen
          fetch('/api/usuarios')
            .then(res => res.json())
            .then(usuarios => {
              const nombres: Record<string | number, string> = {};
              (usuarios || []).forEach((u: { id: string | number; nombre: string }) => {
                nombres[u.id] = u.nombre;
              });
              setUsuariosNombres(nombres);
            });
        }
        setLoadingNotificaciones(false);
      });
    // Tendencia semanal
    fetch(`/api/estadisticas/tendencia-semanal`)
      .then(res => res.json())
      .then(data => {
        if (data.tendencia) setTendenciaSemanal(data.tendencia);
        setLoadingTendencia(false);
      });
  }, []);

const [tendenciaSemanal, setTendenciaSemanal] = useState<{ semana: string; pagos: number; solicitudes: number }[]>([]);

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const GRADIENT_BAR = "url(#barGradient)";
const GRADIENT_AREA = "url(#areaGradient)";


type PagoMes = { mes: string; total: number; objetivo?: number; crecimiento?: number };
type EstadoSolicitud = { estado: string; value: number; porcentaje?: number };

function getTotalPagos(pagosPorMes: PagoMes[]): number {
  return pagosPorMes.reduce((acc: number, cur: PagoMes) => acc + (cur.total || 0), 0);
}

function getTotalSolicitudes(solicitudesPorEstado: EstadoSolicitud[]): number {
  return solicitudesPorEstado.reduce((acc: number, cur: EstadoSolicitud) => acc + (cur.value || 0), 0);
}

function getPromedioCrecimiento(pagosPorMes: PagoMes[]): number {
  if (!pagosPorMes.length) return 0;
  const crecimiento = pagosPorMes.reduce((acc: number, cur: PagoMes) => acc + (cur.crecimiento || 0), 0) / pagosPorMes.length;
  return Math.round(crecimiento * 10) / 10;
}

  const stats = [
    {
      title: "Total Pagos",
      value: getTotalPagos(pagosPorMes),
      icon: CreditCard,
      color: "blue",
      change: "+12%",
      positive: true
    },
    {
      title: "Total Solicitudes",
      value: getTotalSolicitudes(solicitudesPorEstado),
      icon: Users,
      color: "green",
      change: "+8%",
      positive: true
    },
    {
      title: "Promedio Crecimiento",
      value: `${getPromedioCrecimiento(pagosPorMes)}%`,
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
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Graficas</h1>
                    <p className="text-slate-600">Resumen ejecutivo de pagos y solicitudes</p>
                </div>
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className={`relative rounded-2xl p-6 border border-slate-200 shadow-lg bg-gradient-to-br from-white/60 via-${stat.color}-100/40 to-white/60 backdrop-blur-md hover:scale-[1.03] transition-all duration-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} animate-fade-in`}
                      style={{ transitionDelay: `${index * 80}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase mb-1">{stat.title}</p>
                          <p className="text-3xl font-extrabold text-slate-800 leading-tight">
                            {typeof stat.value === "number"
                              ? <Counter value={stat.value} />
                              : stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full shadow bg-white/80 border-2 border-${stat.color}-200 transition-transform duration-200 hover:scale-110`}>
                          <stat.icon className={`w-7 h-7 text-${stat.color}-500`} />
                        </div>
                      </div>
                      <div className="flex items-center mt-5">
                        {stat.positive ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1 animate-bounce" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1 animate-bounce" />
                        )}
                        <span className={`text-xs font-bold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                        <span className="text-slate-400 text-xs ml-2">vs mes anterior</span>
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
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        activeChart === filter
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
                      }`}
                      style={{ transitionDelay: `${showStats ? 200 : 0}ms` }}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Gráficas modernas y ordenadas para cada entidad */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Solicitudes */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-blue-700 mb-4">Solicitudes por Estado</h2>
                    {loadingSolicitudes ? (
                      <div className="w-full h-[260px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...solicitudesPorEstado].sort((a,b)=>b.value-a.value)}>
                          <XAxis dataKey="estado" tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <YAxis tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #dbeafe' }} />
                          <Bar dataKey="value" fill={GRADIENT_BAR} radius={[8,8,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-blue-700 mb-4">Solicitudes (Pie)</h2>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={solicitudesPorEstado} dataKey="value" nameKey="estado" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {solicitudesPorEstado.map((entry, index) => (
                            <Cell key={`cell-solicitud-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Usuarios */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-green-700 mb-4">Usuarios por Rol</h2>
                    {loadingUsuarios ? (
                      <div className="w-full h-[260px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...usuariosPorRol].sort((a,b)=>b.value-a.value)}>
                          <XAxis dataKey="rol" tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <YAxis tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" radius={[8,8,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-green-700 mb-4">Usuarios (Pie)</h2>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={usuariosBloqueados} dataKey="value" nameKey="bloqueado" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {usuariosBloqueados.map((entry, index) => (
                            <Cell key={`cell-usuario-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Recurrentes */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-purple-700 mb-4">Recurrentes por Estado</h2>
                    {loadingRecurrentes ? (
                      <div className="w-full h-[260px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...recurrentesPorEstado].sort((a,b)=>b.value-a.value)}>
                          <XAxis dataKey="estado" tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <YAxis tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[8,8,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-purple-700 mb-4">Recurrentes (Pie)</h2>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={recurrentesPorFrecuencia} dataKey="value" nameKey="frecuencia" cx="50%" cy="50%" outerRadius={90} innerRadius={45} label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {recurrentesPorFrecuencia.map((entry, index) => (
                            <Cell key={`cell-recurrente-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Notificaciones */}
                  <div className="rounded-2xl shadow-lg p-8 border border-yellow-100 hover:shadow-xl transition-shadow bg-transparent backdrop-blur-md">
                    <h2 className="text-xl font-bold text-yellow-700 mb-4">Notificaciones por Estado de Lectura</h2>
                    {loadingNotificaciones ? (
                      <div className="w-full h-[260px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...notificacionesPorTipo].sort((a,b)=>b.value-a.value)}>
                          <XAxis dataKey="tipo" tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <YAxis tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#f59e0b" radius={[8,8,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-yellow-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-yellow-700 mb-4">Notificaciones por Usuario (Pie)</h2>
                    <p className="text-slate-500 text-sm mb-2">Cada segmento representa la cantidad de notificaciones que tiene cada usuario. El número indica el ID de usuario y el total de notificaciones. Los colores muestran el porcentaje de cada usuario respecto al total.</p>
                    {/* Depuración rápida: mostrar datos en consola */}
                    {(() => { console.log('notificacionesPorUsuario', notificacionesPorUsuario); return null; })()}
                    <ResponsiveContainer width="100%" height={260}>
                      {Array.isArray(notificacionesPorUsuario) && notificacionesPorUsuario.length > 0 ? (
                        <PieChart>
                          <Pie 
                            data={notificacionesPorUsuario}
                            dataKey="value"
                            nameKey="usuario"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={45}
                            label={({ percent, value, payload }) => {
                              let nombre: string = '';
                              if (!payload || !payload.usuario) return '';
                              if (usuariosNombres[payload.usuario]) {
                                nombre = (usuariosNombres[payload.usuario] || '').split(' ')[0];
                              } else {
                                const usuarioObj = notificacionesPorUsuario.find(u => u.usuario === payload.usuario);
                                if (usuarioObj && usuarioObj.nombre) {
                                  nombre = (usuarioObj.nombre || '').split(' ')[0];
                                } else {
                                  nombre = String(payload.usuario);
                                }
                              }
                              return `${nombre}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`;
                            }}
                          >
                            {notificacionesPorUsuario.map((entry, index) => (
                              <Cell key={`cell-notif-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => {
                            let nombre: string = '';
                            const usuarioId = props?.payload?.usuario;
                            if (!usuarioId) return [`${value} notificaciones`, ''];
                            if (usuariosNombres[usuarioId]) {
                              nombre = (usuariosNombres[usuarioId] || '').split(' ')[0];
                            } else {
                              const usuarioObj = notificacionesPorUsuario.find(u => u.usuario === usuarioId);
                              if (usuarioObj && usuarioObj.nombre) {
                                nombre = (usuarioObj.nombre || '').split(' ')[0];
                              } else {
                                nombre = String(usuarioId);
                              }
                            }
                            return [`${value} notificaciones`, nombre];
                          }} />
                          <Legend formatter={(value) => {
                            let nombre: string = '';
                            if (!value) return '';
                            if (usuariosNombres[value]) {
                              nombre = (usuariosNombres[value] || '').split(' ')[0];
                            } else {
                              const usuarioObj = notificacionesPorUsuario.find(u => u.usuario === value);
                              if (usuarioObj && usuarioObj.nombre) {
                                nombre = (usuarioObj.nombre || '').split(' ')[0];
                              } else {
                                nombre = String(value);
                              }
                            }
                            return nombre;
                          }} />
                        </PieChart>
                      ) : (
                        <div className="w-full h-[220px] flex items-center justify-center text-slate-400 text-lg font-semibold border border-dashed border-yellow-300 rounded-xl bg-yellow-50/30">
                          Sin datos para mostrar
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfica de tendencias */}
                {(activeChart === "todos" || activeChart === "tendencias") && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Tendencia Semanal</h2>
                    {loadingTendencia ? (
                      <div className="w-full h-[300px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
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
                    )}
                </div>
                )}

                {/* Resumen de métricas */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100 mt-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Resumen Ejecutivo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-14 h-14 bg-green-50 rounded-full mx-auto mb-3 shadow">
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-slate-700 tracking-wide">Eficiencia</h3>
                      <p className="text-3xl font-extrabold text-green-600 mt-1">85%</p>
                      <p className="text-xs text-slate-400">Tasa de aprobación</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-full mx-auto mb-3 shadow">
                        <TrendingUp className="w-7 h-7 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-700 tracking-wide">Crecimiento</h3>
                      <p className="text-3xl font-extrabold text-blue-600 mt-1">+{getPromedioCrecimiento(pagosPorMes)}%</p>
                      <p className="text-xs text-slate-400">Mensual promedio</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-14 h-14 bg-purple-50 rounded-full mx-auto mb-3 shadow">
                        <Users className="w-7 h-7 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-slate-700 tracking-wide">Volumen</h3>
                      <p className="text-3xl font-extrabold text-purple-600 mt-1">{getTotalSolicitudes(solicitudesPorEstado)}</p>
                      <p className="text-xs text-slate-400">Solicitudes totales</p>
                    </div>
                  </div>
                </div>
            </div>
            </div>
        </AdminLayout>
    </ProtectedRoute>
  );
}