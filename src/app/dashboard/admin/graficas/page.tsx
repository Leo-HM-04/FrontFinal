"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from "recharts";
import { useState } from "react";
import { useEffect } from "react";
import { TrendingUp, TrendingDown, Users, CreditCard, Clock, CheckCircle } from "lucide-react";


import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getAuthToken } from '@/utils/auth';

function mesNombre(num: number): string {
  return ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][num - 1] || String(num);
}

export default function GraficasAdminPage() {
  // Componente Counter para animar números
  function Counter({ value, duration = 800, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let startTime: number | null = null;
      let animationFrame: number;
      
      function animate(ts: number) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        setDisplay(Math.round(progress * value));
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
      };
    }, [value, duration]);
    
    return <span>{display}{suffix}</span>;
  }
  
  // Animación de entrada para tarjetas
  const [showStats, setShowStats] = useState(false);
  useEffect(() => {
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
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("ultimo_mes");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagosPorMes, setPagosPorMes] = useState<{ mes: string; total: number; crecimiento?: number }[]>([]);
  const [solicitudesPorEstado, setSolicitudesPorEstado] = useState<{ estado: string; value: number }[]>([]);
  const [usuariosPorRol, setUsuariosPorRol] = useState<{ rol: string; value: number }[]>([]);
  const [usuariosBloqueados, setUsuariosBloqueados] = useState<{ bloqueado: string; value: number }[]>([]);
  const [recurrentesPorEstado, setRecurrentesPorEstado] = useState<{ estado: string; value: number }[]>([]);
  const [recurrentesPorFrecuencia, setRecurrentesPorFrecuencia] = useState<{ frecuencia: string; value: number }[]>([]);
  const [notificacionesPorTipo, setNotificacionesPorTipo] = useState<{ tipo: string; value: number }[]>([]);
  // Si tienes los nombres de usuario, usa este estado para mapear IDs a nombres
  const [notificacionesPorUsuario, setNotificacionesPorUsuario] = useState<{ usuario: string | number; value: number; nombre?: string }[]>([]);
  const [usuariosNombres, setUsuariosNombres] = useState<Record<string | number, string>>({});

  // Función auxiliar para hacer fetch con autorización
  const fetchWithAuth = async (url: string) => {
    const token = getAuthToken();
    return await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  };

  // Función para cargar los datos desde el API
  const cargarDatos = async (periodo = periodoSeleccionado) => {
    try {
      setIsRefreshing(true);
      
      // Restablecer estados de carga
      setLoadingSolicitudes(true);
      setLoadingUsuarios(true);
      setLoadingRecurrentes(true);
      setLoadingNotificaciones(true);
      setLoadingTendencia(true);

      // Solicitudes
      try {
        const resSolicitudes = await fetchWithAuth(`http://localhost:4000/api/estadisticas/solicitudes?periodo=${periodo}`);
        if (!resSolicitudes.ok) throw new Error('Error al cargar solicitudes');
        const data = await resSolicitudes.json();
        
        setSolicitudesPorEstado(
          (data.porEstado || []).map((item: { estado: string; total: number }) => ({
            estado: item.estado,
            value: item.total
          }))
        );
        
        setPagosPorMes(
          (data.porMes || []).map((item: { mes: number; total: number; crecimiento?: number }) => ({
            mes: mesNombre(item.mes),
            total: item.total,
            crecimiento: item.crecimiento || 0
          }))
        );
      } catch (error) {
        console.error("Error cargando solicitudes:", error);
      } finally {
        setLoadingSolicitudes(false);
      }

      // Usuarios
      try {
        const resUsuarios = await fetchWithAuth(`http://localhost:4000/api/estadisticas/usuarios?periodo=${periodo}`);
        if (!resUsuarios.ok) throw new Error('Error al cargar usuarios');
        const data = await resUsuarios.json();
        
        setUsuariosPorRol(
          (data.porRol || []).map((item: { rol: string; total: number }) => ({ 
            rol: item.rol, 
            value: item.total 
          }))
        );
        
        setUsuariosBloqueados(
          (data.bloqueados || []).map((item: { bloqueado: number; total: number }) => ({ 
            bloqueado: item.bloqueado ? "Bloqueado" : "Activo", 
            value: item.total 
          }))
        );
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setLoadingUsuarios(false);
      }

      // Recurrentes
      try {
        const resRecurrentes = await fetchWithAuth(`http://localhost:4000/api/estadisticas/recurrentes?periodo=${periodo}`);
        if (!resRecurrentes.ok) throw new Error('Error al cargar recurrentes');
        const data = await resRecurrentes.json();
        
        setRecurrentesPorEstado(
          (data.porEstado || []).map((item: { estado: string; total: number }) => ({ 
            estado: item.estado, 
            value: item.total 
          }))
        );
        
        setRecurrentesPorFrecuencia(
          (data.porFrecuencia || []).map((item: { frecuencia: string; total: number }) => ({ 
            frecuencia: item.frecuencia, 
            value: item.total 
          }))
        );
      } catch (error) {
        console.error("Error cargando recurrentes:", error);
      } finally {
        setLoadingRecurrentes(false);
      }

      // Notificaciones
      try {
        const resNotificaciones = await fetchWithAuth(`http://localhost:4000/api/estadisticas/notificaciones?periodo=${periodo}`);
        if (!resNotificaciones.ok) throw new Error('Error al cargar notificaciones');
        const data = await resNotificaciones.json();
        
        setNotificacionesPorTipo(
          (data.porLeida || []).map((item: { leida: number; total: number }) => ({ 
            tipo: item.leida ? "Leída" : "No leída", 
            value: item.total 
          }))
        );
        
        // Si el backend ya manda nombres, úsalo. Si no, haz fetch de usuarios y mapea.
        if (data.porUsuario && data.porUsuario.length && data.porUsuario[0].nombre) {
          setNotificacionesPorUsuario(
            data.porUsuario.map((item: { id_usuario: string | number; total: number; nombre?: string }) => ({ 
              usuario: item.id_usuario, 
              value: item.total, 
              nombre: item.nombre 
            }))
          );
        } else {
          setNotificacionesPorUsuario(
            (data.porUsuario || []).map((item: { id_usuario: string | number; total: number }) => ({ 
              usuario: item.id_usuario, 
              value: item.total 
            }))
          );
          
          // Intentar obtener nombres de usuario si no vienen
          try {
            const resUsuarios = await fetchWithAuth('http://localhost:4000/api/usuarios');
            if (!resUsuarios.ok) throw new Error('Error al cargar nombres de usuarios');
            const usuarios = await resUsuarios.json();
            
            const nombres: Record<string | number, string> = {};
            (usuarios || []).forEach((u: { id: string | number; nombre: string }) => {
              nombres[u.id] = u.nombre;
            });
            
            setUsuariosNombres(nombres);
          } catch (error) {
            console.error("Error cargando nombres de usuarios:", error);
          }
        }
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
      } finally {
        setLoadingNotificaciones(false);
      }

      // Tendencia semanal
      try {
        const resTendencia = await fetchWithAuth(`http://localhost:4000/api/estadisticas/tendencia-semanal?periodo=${periodo}`);
        if (!resTendencia.ok) throw new Error('Error al cargar tendencia semanal');
        const data = await resTendencia.json();
        
        if (data.tendencia) setTendenciaSemanal(data.tendencia);
      } catch (error) {
        console.error("Error cargando tendencia semanal:", error);
      } finally {
        setLoadingTendencia(false);
      }
      
    } catch (error) {
      console.error("Error general cargando datos:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const [tendenciaSemanal, setTendenciaSemanal] = useState<{ semana: string; pagos: number; solicitudes: number }[]>([]);

// Paleta de colores mejorada para las gráficas
const COLORS = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

// Función personalizada para formato de moneda
const formatoMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};


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
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Gráficas</h1>
                    <p className="text-slate-600">Resumen ejecutivo de pagos y solicitudes</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <div className="relative">
                      <select
                        value={periodoSeleccionado}
                        onChange={(e) => {
                          setPeriodoSeleccionado(e.target.value);
                          cargarDatos(e.target.value);
                        }}
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ultimo_mes">Último mes</option>
                        <option value="ultimo_trimestre">Último trimestre</option>
                        <option value="ultimo_semestre">Último semestre</option>
                        <option value="ultimo_anio">Último año</option>
                        <option value="todo">Todo el tiempo</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                    <button
                      onClick={() => cargarDatos()}
                      disabled={isRefreshing}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <svg className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isRefreshing ? 'Actualizando...' : 'Actualizar datos'}
                    </button>
                  </div>
                </div>

                {/* Tarjetas de estadísticas mejoradas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => {
                    // Mapa de colores para cada tipo de tarjeta
                    const colorMap: Record<string, { bg: string, text: string, border: string, icon: string }> = {
                      blue: {
                        bg: "from-blue-50 to-white via-blue-50/40",
                        text: "text-blue-800",
                        border: "border-blue-200",
                        icon: "text-blue-600"
                      },
                      green: {
                        bg: "from-green-50 to-white via-green-50/40",
                        text: "text-green-800",
                        border: "border-green-200",
                        icon: "text-green-600"
                      },
                      purple: {
                        bg: "from-purple-50 to-white via-purple-50/40",
                        text: "text-purple-800",
                        border: "border-purple-200",
                        icon: "text-purple-600"
                      },
                      orange: {
                        bg: "from-orange-50 to-white via-orange-50/40",
                        text: "text-orange-800",
                        border: "border-orange-200",
                        icon: "text-orange-600"
                      }
                    };

                    const colors = colorMap[stat.color as keyof typeof colorMap];
                    
                    return (
                      <div
                        key={index}
                        className={`relative rounded-2xl p-6 border ${colors.border} shadow-lg bg-gradient-to-br ${colors.bg} backdrop-blur-md hover:scale-[1.03] transition-all duration-300 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                        style={{ transitionDelay: `${index * 120}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase mb-1">{stat.title}</p>
                            <p className={`text-3xl font-extrabold ${colors.text} leading-tight`}>
                              {typeof stat.value === "number"
                                ? <Counter value={stat.value} />
                                : stat.value}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full shadow-md bg-white/90 border-2 ${colors.border} transition-all duration-300 hover:scale-110 hover:shadow-lg`}>
                            <stat.icon className={`w-7 h-7 ${colors.icon}`} />
                          </div>
                        </div>
                        <div className="flex items-center mt-5">
                          {stat.positive ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1 animate-pulse" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1 animate-pulse" />
                          )}
                          <span className={`text-xs font-bold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                          <span className="text-slate-400 text-xs ml-2">vs mes anterior</span>
                        </div>
                        
                        {/* Indicador de carga */}
                        {(index === 0 && loadingSolicitudes) || 
                         (index === 1 && loadingSolicitudes) || 
                         (index === 2 && loadingSolicitudes) || 
                         (index === 3 && loadingNotificaciones) ? (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Gráficas modernas y ordenadas para cada entidad */}
                {/* Selector de categorías */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['todos', 'solicitudes', 'usuarios', 'recurrentes', 'notificaciones', 'tendencias'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveChart(category)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        activeChart === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Solicitudes */}
                  {(activeChart === 'todos' || activeChart === 'solicitudes') && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-700">Solicitudes por Estado</h2>
                        {loadingSolicitudes && (
                          <div className="animate-pulse flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600 mr-1"></div>
                            <div className="h-2 w-2 rounded-full bg-blue-600 mr-1 animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        )}
                      </div>
                      
                      {loadingSolicitudes ? (
                        <div className="w-full h-[260px] flex items-center justify-center">
                          <div className="w-full h-[200px] bg-slate-100 animate-pulse rounded-xl" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={[...solicitudesPorEstado].sort((a,b)=>b.value-a.value)}>
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="estado" tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                            <YAxis tick={{ fontWeight: 700, fontSize: 13, fill: '#334155' }} />
                            <Tooltip 
                              formatter={(value) => formatoMoneda(Number(value))}
                              contentStyle={{ 
                                borderRadius: 12, 
                                background: '#e0e7ff', 
                                border: '1px solid #2563eb', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                color: '#1e293b' 
                              }} 
                            />
                            <Bar dataKey="value" fill="url(#barGradient)" radius={[10,10,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                  {(activeChart === 'todos' || activeChart === 'solicitudes') && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-700">Solicitudes por Estado (Pie)</h2>
                        {loadingSolicitudes && (
                          <div className="animate-pulse flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600 mr-1"></div>
                            <div className="h-2 w-2 rounded-full bg-blue-600 mr-1 animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        )}
                      </div>
                      
                      {loadingSolicitudes ? (
                        <div className="w-full h-[260px] flex items-center justify-center">
                          <div className="w-[200px] h-[200px] bg-slate-100 animate-pulse rounded-full mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie 
                              data={solicitudesPorEstado} 
                              dataKey="value" 
                              nameKey="estado" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={90} 
                              innerRadius={45} 
                              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                              labelLine={true}
                              animationDuration={1000}
                              animationBegin={200}
                            >
                              {solicitudesPorEstado.map((entry, index) => (
                                <Cell 
                                  key={`cell-solicitud-${index}`} 
                                  fill={COLORS[index % COLORS.length]} 
                                  stroke="#fff" 
                                  strokeWidth={2}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => formatoMoneda(Number(value))}
                              contentStyle={{ 
                                borderRadius: 8, 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(203, 213, 225, 0.5)'
                              }}
                            />
                            <Legend 
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={10}
                              iconType="circle"
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                  {/* Usuarios */}
                  <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-bold text-green-700 mb-4">Usuarios por Rol</h2>
                    {loadingUsuarios ? (
                      <div className="w-full h-[260px] flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...usuariosPorRol
                          .filter(u => u.rol.toLowerCase() !== 'admin_general')
                          .map(u => ({
                            ...u,
                            rol: u.rol.toLowerCase() === 'pagador_banca'
                              ? 'PAGADOR'
                              : u.rol.replace(/_/g, ' ').toUpperCase()
                          }))
                        ].sort((a,b)=>b.value-a.value)}>
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
                  <div className="rounded-2xl shadow-lg p-8 border border-yellow-100 hover:shadow-xl transition-shadow bg-white backdrop-blur-md">
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

                {/* Gráfica de tendencias mejorada */}
                {(activeChart === "todos" || activeChart === "tendencias") && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-slate-800">Tendencia Semanal</h2>
                      {loadingTendencia ? (
                        <div className="animate-pulse flex items-center">
                          <div className="h-2 w-2 rounded-full bg-purple-600 mr-1"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-600 mr-1 animate-bounce"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      ) : (
                        <div className="flex space-x-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                            <span className="text-xs font-medium text-slate-700">Pagos</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs font-medium text-slate-700">Solicitudes</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {loadingTendencia ? (
                      <div className="w-full h-[300px] flex items-center justify-center relative">
                        <div className="w-full h-[250px] bg-slate-100/70 animate-pulse rounded-xl" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-purple-300 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart 
                          data={tendenciaSemanal} 
                          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="areaGradientGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="semana" 
                            tick={{ fontSize: 12, fontWeight: 500, fill: '#475569' }} 
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fontWeight: 500, fill: '#475569' }} 
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => formatoMoneda(value).replace('$', '')}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              formatoMoneda(Number(value)), 
                              name === 'pagos' ? 'Pagos' : 'Solicitudes'
                            ]}
                            contentStyle={{ 
                              borderRadius: 8, 
                              background: 'rgba(255, 255, 255, 0.97)', 
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }} 
                            labelStyle={{
                              fontWeight: 'bold',
                              color: '#1e293b'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="pagos" 
                            name="Pagos"
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            fill="url(#areaGradient)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4, fill: '#fff' }}
                            activeDot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 6, fill: '#fff' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="solicitudes" 
                            name="Solicitudes"
                            stroke="#10b981" 
                            strokeWidth={3}
                            fill="url(#areaGradientGreen)"
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={300}
                            dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#fff' }}
                            activeDot={{ stroke: '#10b981', strokeWidth: 2, r: 6, fill: '#fff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    
                    <div className="mt-4 text-center text-xs text-slate-500">
                      <p>Comparación entre pagos procesados y solicitudes recibidas por semana</p>
                    </div>
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