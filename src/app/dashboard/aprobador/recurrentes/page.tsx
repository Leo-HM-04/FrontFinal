"use client";

import { useEffect, useState } from "react";
import React from "react";
import { SolicitudModal } from '../components/SolicitudModal';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PlantillaRecurrente } from '@/types';
import { RecurrentesService } from '@/services/recurrentes.service';
import { FaCheck, FaTimes, FaSearch  } from 'react-icons/fa';

export default function AprobadorRecurrentesPage() {
const [solicitudes, setSolicitudes] = useState<PlantillaRecurrente[]>([]);
const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<PlantillaRecurrente[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
const [mensaje, setMensaje] = useState<string | null>(null);
const [comentario, setComentario] = useState<string>('');
const [rechazoId, setRechazoId] = useState<number | null>(null);
const [confirmarAccion, setConfirmarAccion] = useState<{ tipo: 'aprobar' | 'rechazar', id: number } | null>(null);
const [modalOpen, setModalOpen] = useState(false);
const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<PlantillaRecurrente | null>(null);

// Estados para filtros y paginación
const [busqueda, setBusqueda] = useState('');
const [filtroEstado, setFiltroEstado] = useState<string>('todos');
const [paginaActual, setPaginaActual] = useState(1);
const elementosPorPagina = 5;

useEffect(() => {
  RecurrentesService.obtenerTodas()
    .then((data) => {
      setSolicitudes(data);
      setSolicitudesFiltradas(data);
      setLoading(false);
    })
    .catch((err) => {
      setError(err.message || 'Error al cargar las solicitudes');
      setLoading(false);
    });
}, []);

// Efecto para aplicar filtros y ordenamiento
useEffect(() => {
  let resultado = [...solicitudes];
  
  // Filtrar por texto de búsqueda
  if (busqueda) {
    const busquedaLower = busqueda.toLowerCase();
    resultado = resultado.filter(s => 
      (s.nombre_usuario && s.nombre_usuario.toLowerCase().includes(busquedaLower)) ||
      (s.departamento && s.departamento.toLowerCase().includes(busquedaLower)) ||
      (s.cuenta_destino && s.cuenta_destino.toLowerCase().includes(busquedaLower)) ||
      (s.folio && s.folio.toLowerCase().includes(busquedaLower))
    );
  }
  
  // Filtrar por estado (aceptando variantes masculino/femenino)
  if (filtroEstado !== 'todos') {
    const variantes: Record<string, string[]> = {
      'pendiente': ['pendiente'],
      'aprobada': ['aprobada', 'aprobado'],
      'rechazada': ['rechazada', 'rechazado'],
      'pagada': ['pagada', 'pagado']
    };
    const variantesFiltro = variantes[filtroEstado.toLowerCase()] || [filtroEstado.toLowerCase()];
    resultado = resultado.filter(s => {
      const estado = (s.estado || '').toLowerCase();
      return variantesFiltro.includes(estado);
    });
  }

  // Ordenar los resultados: pendientes primero, luego rechazadas, luego aprobadas, luego pagadas
  resultado.sort((a, b) => {
    // Orden de prioridad: pendiente (más alta) > rechazada > aprobada > pagada (más baja)
    const prioridad: Record<string, number> = {
      'pendiente': 0,
      'rechazada': 1,
      'aprobada': 2,
      'pagada': 3
    };
    const estadoA = (a.estado || '').toLowerCase();
    const estadoB = (b.estado || '').toLowerCase();
    return (prioridad[estadoA] ?? 99) - (prioridad[estadoB] ?? 99);
  });
  
  setSolicitudesFiltradas(resultado);
  setPaginaActual(1); // Reset a la primera página al filtrar
}, [busqueda, filtroEstado, solicitudes]);


const refreshSolicitudes = async () => {
  setLoading(true);
  try {
    const data = await RecurrentesService.obtenerTodas();
    setSolicitudes(data);
    setSolicitudesFiltradas(data);
  } catch {
    setError('Error al refrescar solicitudes');
  } finally {
    setLoading(false);
  }
};

const handleAprobar = async (id: number) => {
  setAccionEnCurso(id);
  setMensaje(null);
  setError(null);
  try {
    await RecurrentesService.aprobar(id);
    setMensaje('Solicitud aprobada correctamente.');
    setComentario('');
    await refreshSolicitudes();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      setError((err as { message: string }).message);
    } else {
      setError('Error inesperado');
    }
  } finally {
    setAccionEnCurso(null);
    setConfirmarAccion(null);
  }
};

const handleRechazar = async (id: number) => {
  setAccionEnCurso(id);
  setMensaje(null);
  setError(null);
  try {
    const comentarioRechazo = comentario && comentario.trim() !== '' ? comentario : 'Solicitud rechazada';
    await RecurrentesService.rechazar(id, comentarioRechazo);
    setMensaje('Solicitud rechazada correctamente.');
    setComentario('');
    setRechazoId(null);
    await refreshSolicitudes();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      setError((err as { message: string }).message);
    } else {
      setError('Error inesperado');
    }
  } finally {
    setAccionEnCurso(null);
    setConfirmarAccion(null);
  }
};

return (
  <ProtectedRoute requiredRoles={['aprobador']}>
    <AprobadorLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* HEADER Y CARDS DE RESUMEN */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Solicitudes Recurrentes</h1>
              <p className="text-blue-100 text-lg font-medium">
                Gestiona y monitorea todas las solicitudes recurrentes del sistema
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-white/90 text-lg font-semibold">Total: <span className="text-white">{solicitudes.length}</span> solicitudes</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 rounded-xl p-3">
                  <svg className="w-8 h-8 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-4xl font-black text-white mb-1">{solicitudes.length}</p>
                  <p className="text-blue-100 font-medium">Total Procesadas</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-green-500/20 rounded-xl p-3">
                  <svg className="w-8 h-8 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-4xl font-black text-white mb-1">{solicitudes.filter(s => s.estado === 'aprobada').length}</p>
                  <p className="text-blue-100 font-medium">Aprobadas</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="bg-red-500/20 rounded-xl p-3">
                  <svg className="w-8 h-8 text-red-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-4xl font-black text-white mb-1">{solicitudes.filter(s => s.estado === 'rechazada').length}</p>
                  <p className="text-blue-100 font-medium">Rechazadas</p>
                </div>
              </div>
            </div>
          </div>
          {/* BUSCADOR Y FILTROS */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-3 border-0 ring-1 ring-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50/50"
                    placeholder="Buscar por nombre, departamento, cuenta..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-gray-700 font-medium">Estado:</label>
                  <select 
                    className="bg-gray-50/50 border-0 ring-1 ring-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 focus:ring-2 focus:ring-blue-500 transition-shadow"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="rechazada">Rechazadas</option>
                    <option value="aprobada">Aprobadas</option>
                    <option value="pagada">Pagadas</option>
                  </select>
                </div>
                
                {(busqueda || filtroEstado !== 'todos') && (
                  <button 
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    onClick={() => {
                      setBusqueda('');
                      setFiltroEstado('todos');
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
          
          {mensaje && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded shadow">
              <div className="flex">
                <FaCheck className="text-green-500 mt-0.5 mr-2" />
                <span>{mensaje}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded shadow">
              <div className="flex">
                <FaTimes className="text-red-500 mt-0.5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Tabla con el mismo diseño que historial */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
            <div className="px-8 py-6 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Solicitudes Procesadas</h2>
                <p className="text-sm text-gray-500 mt-1">Gestiona las solicitudes recurrentes del sistema</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                  Pendientes
                </span>
                <span className="text-gray-300">→</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800">
                  Rechazadas
                </span>
                <span className="text-gray-300">→</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800">
                  Aprobadas
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="group px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider first:rounded-tl-lg">
                      <div className="flex items-center gap-2">
                        Folio
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </div>
                      </div>
                    </th>
                    <th className="group px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        Usuario
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cuenta</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Frecuencia</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Siguiente fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aprobador</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pagador</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider last:rounded-tr-lg">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-blue-600 text-sm">Cargando solicitudes...</p>
                        </div>
                      </td>
                    </tr>
                  ) : solicitudesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-gray-500 text-sm">
                        No se encontraron solicitudes que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    solicitudesFiltradas
                      .slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)
                      .map((s) => (
                        <tr key={s.id_recurrente} className="group hover:bg-gray-50/50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                {s.folio ? (
                                  <span className="cursor-pointer hover:underline">{s.folio}</span>
                                ) : '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">{s.nombre_usuario || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {s.departamento?.split(' ').map(word => 
                                word.toLowerCase() === 'ti' ? 'TI' : 
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${s.monto.toLocaleString('es-MX', {minimumFractionDigits:2})}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{s.cuenta_destino}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {s.frecuencia?.charAt(0).toUpperCase() + s.frecuencia?.slice(1).toLowerCase()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const estado = (s.estado || '').toLowerCase();
                              if (estado === 'pendiente') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 ring-1 ring-yellow-700/10">
                                    <svg className="w-1.5 h-1.5 fill-current" viewBox="0 0 6 6">
                                      <circle cx="3" cy="3" r="3"/>
                                    </svg>
                                    Pendiente
                                  </span>
                                );
                              } else if (estado === 'aprobada' || estado === 'aprobado') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-700/10">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Aprobada
                                  </span>
                                );
                              } else if (estado === 'rechazada' || estado === 'rechazado') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-700/10">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Rechazada
                                  </span>
                                );
                              } else if (estado === 'pagada' || estado === 'pagado') {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 ring-1 ring-green-700/10">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pagada
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 ring-1 ring-gray-700/10">
                                    {s.estado || '-'}
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {s.siguiente_fecha ? (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-600" title={new Date(s.siguiente_fecha).toLocaleString('es-MX')}>
                                  {new Date(s.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="text-sm text-gray-600">{s.nombre_aprobador || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="text-sm text-gray-600">{s.nombre_pagador || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="inline-flex items-center p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                onClick={() => { setSolicitudSeleccionada(s); setModalOpen(true); }}
                                title="Ver detalles"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {s.estado === 'pendiente' && (
                                <>
                                  <button
                                    className="inline-flex items-center p-1.5 text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    disabled={accionEnCurso === s.id_recurrente}
                                    onClick={() => setConfirmarAccion({ tipo: 'aprobar', id: s.id_recurrente })}
                                    title="Aprobar solicitud"
                                  >
                                    {accionEnCurso === s.id_recurrente ? (
                                      <div className="animate-spin h-5 w-5 border-2 border-current rounded-full border-t-transparent"></div>
                                    ) : (
                                      <FaCheck className="w-5 h-5" />
                                    )}
                                  </button>
                                  <button
                                    className="inline-flex items-center p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    disabled={accionEnCurso === s.id_recurrente}
                                    onClick={() => setConfirmarAccion({ tipo: 'rechazar', id: s.id_recurrente })}
                                    title="Rechazar solicitud"
                                  >
                                    <FaTimes className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {/* Modal de confirmación para aprobar/rechazar */}
                                {confirmarAccion && (
                                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                                    <div className="bg-gradient-to-br from-white via-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center relative">
                                      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full shadow-xl bg-yellow-100 animate-bounce border-4 border-yellow-300">
                                        <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <circle cx="12" cy="12" r="10" fill="#fde68a" />
                                          <path stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                                        </svg>
                                      </div>
                                      <h3 className="text-xl font-bold text-yellow-700 mb-1 text-center drop-shadow-sm">
                                        Confirmación requerida
                                      </h3>
                                      <p className="text-xs text-yellow-700 mb-2 text-center font-medium">
                                        Esta acción es importante y no se puede deshacer.
                                      </p>
                                      <p className="text-sm text-gray-700 mb-4 text-center">
                                        {confirmarAccion.tipo === 'aprobar'
                                          ? '¿Estás seguro que deseas aprobar esta solicitud?'
                                          : '¿Estás seguro que deseas rechazar esta solicitud?'}
                                      </p>
                                      {confirmarAccion.tipo === 'rechazar' && (
                                        <textarea
                                          className="border w-full p-2 text-base mb-3 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 text-black"
                                          rows={3}
                                          placeholder="Ingrese un motivo para el rechazo"
                                          value={comentario}
                                          onChange={e => setComentario(e.target.value)}
                                        />
                                      )}
                                      <div className="flex gap-3 mt-2 w-full justify-center">
                                        <button
                                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-semibold"
                                          onClick={() => { setConfirmarAccion(null); setComentario(''); }}
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          className={`px-4 py-2 rounded-md font-semibold text-white ${confirmarAccion.tipo === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                          onClick={() => {
                                            if (confirmarAccion.tipo === 'aprobar') handleAprobar(confirmarAccion.id);
                                            else handleRechazar(confirmarAccion.id);
                                          }}
                                          disabled={accionEnCurso === confirmarAccion.id}
                                        >
                                          {accionEnCurso === confirmarAccion.id ? 'Procesando...' : confirmarAccion.tipo === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                              )}
                              {rechazoId === s.id_recurrente && (
                                <div className="absolute bg-white border shadow-lg p-3 z-10 rounded-lg mt-48 -ml-20 w-64">
                                  <h3 className="text-base font-semibold mb-2 text-gray-700">Motivo del rechazo:</h3>
                                  <textarea
                                    className="border w-full p-2 text-base mb-3 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Ingrese un motivo para el rechazo"
                                    value={comentario}
                                    onChange={e => setComentario(e.target.value)}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      className="bg-gray-200 text-gray-600 px-3 py-1 rounded-md text-base font-semibold"
                                      onClick={() => setRechazoId(null)}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="bg-red-600 text-white px-3 py-1 rounded-md text-base font-semibold"
                                      disabled={accionEnCurso === s.id_recurrente}
                                      onClick={() => handleRechazar(s.id_recurrente)}
                                    >
                                      {accionEnCurso === s.id_recurrente ? 'Procesando...' : 'Confirmar'}
                                    </button>
                                  </div>
                                </div>
                              )}
                              <SolicitudModal 
                                solicitud={solicitudSeleccionada!}
                                open={modalOpen && !!solicitudSeleccionada}
                                onClose={() => setModalOpen(false)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          
          {/* Paginador mejorado */}
          {!loading && solicitudesFiltradas.length > 0 && (
            <div className="bg-white border-t border-gray-200">
              <div className="px-8 py-4 sm:flex sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700 font-medium">
                  <span className="hidden sm:inline">Mostrando </span>
                  <span className="font-semibold text-gray-900">{(paginaActual - 1) * elementosPorPagina + 1}</span>
                  <span className="hidden sm:inline"> a </span>
                  <span className="sm:hidden">-</span>
                  <span className="font-semibold text-gray-900">{Math.min(paginaActual * elementosPorPagina, solicitudesFiltradas.length)}</span>
                  <span className="hidden sm:inline"> de </span>
                  <span className="sm:hidden">/</span>
                  <span className="font-semibold text-gray-900">{solicitudesFiltradas.length}</span>
                  <span className="hidden sm:inline"> resultados</span>
                </div>
                <nav className="flex items-center gap-2 mt-3 sm:mt-0" aria-label="Pagination">
                  <button 
                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} 
                    disabled={paginaActual === 1}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      paginaActual === 1 
                        ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Anterior</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(solicitudesFiltradas.length / elementosPorPagina) }).map((_, i) => {
                      // Solo mostrar 5 páginas alrededor de la página actual
                      if (
                        i === 0 || // Primera página
                        i === Math.ceil(solicitudesFiltradas.length / elementosPorPagina) - 1 || // Última página
                        (i >= paginaActual - 2 && i <= paginaActual + 2) // 2 páginas antes y después de la actual
                      ) {
                        return (
                          <button 
                            key={i + 1}
                            onClick={() => setPaginaActual(i + 1)}
                            className={`inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              paginaActual === i + 1
                                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-600'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            aria-current={paginaActual === i + 1 ? 'page' : undefined}
                          >
                            {i + 1}
                          </button>
                        );
                      } else if (
                        (i === 1 && paginaActual - 2 > 1) || 
                        (i === Math.ceil(solicitudesFiltradas.length / elementosPorPagina) - 2 && paginaActual + 2 < Math.ceil(solicitudesFiltradas.length / elementosPorPagina) - 1)
                      ) {
                        return <span key={i} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(solicitudesFiltradas.length / elementosPorPagina)))}
                    disabled={paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina)
                        ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}
                  >
                    <span>Siguiente</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          )}
            </div>
          </div>
    </AprobadorLayout>
  </ProtectedRoute>
);
}