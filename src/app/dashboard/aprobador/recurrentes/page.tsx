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
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-extrabold text-white">Solicitudes Recurrentes</h1>
            <p className="text-white/90 text-lg">Total: {solicitudes.length} solicitudes</p>
          </div>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[160px] bg-white/30 rounded-xl shadow p-3 flex items-center gap-3">
              <div className="bg-white/60 rounded-full p-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#3b82f6" opacity=".15"/><rect x="7" y="7" width="10" height="10" rx="2" fill="#3b82f6" opacity=".25"/><rect x="10" y="10" width="4" height="4" rx="1" fill="#3b82f6"/></svg>
              </div>
              <div>
                <div className="text-base font-bold text-white">{solicitudes.length}</div>
                <div className="text-white/80 text-xs font-medium">Total Procesadas</div>
              </div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white/30 rounded-xl shadow p-3 flex items-center gap-3">
              <div className="bg-white/60 rounded-full p-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e" opacity=".15"/><path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="text-base font-bold text-white">{solicitudes.filter(s => s.estado === 'aprobada').length}</div>
                <div className="text-white/80 text-xs font-medium">Aprobadas</div>
              </div>
            </div>
            <div className="flex-1 min-w-[160px] bg-white/30 rounded-xl shadow p-3 flex items-center gap-3">
              <div className="bg-white/60 rounded-full p-2 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444" opacity=".15"/><path d="M15 9l-6 6m0-6l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="text-base font-bold text-white">{solicitudes.filter(s => s.estado === 'rechazada').length}</div>
                <div className="text-white/80 text-xs font-medium">Rechazadas</div>
              </div>
            </div>
          </div>
          {/* BUSCADOR Y FILTROS */}
          <div className="bg-white/30 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="flex flex-row gap-2 items-center w-full md:w-auto">
              <div className="relative flex-grow max-w-xs">
                <input
                  type="text"
                  className="bg-white shadow px-10 pr-4 py-2 rounded-lg w-full text-base text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
                  placeholder="Buscar por nombre, departamento, cuenta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-2.5 text-blue-400" size={16} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-white text-sm font-semibold">Estado:</label>
                <select 
                  className="bg-white shadow px-3 py-2 rounded-lg text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-200"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="rechazada">Rechazadas</option>
                  <option value="aprobada">Aprobadas</option>
                  <option value="pagada">Pagadas</option>
                </select>
              </div>
              {(busqueda || filtroEstado !== 'todos') && (
                <button 
                  className="bg-white shadow px-3 py-2 rounded-lg text-sm text-blue-700 font-semibold hover:bg-blue-50 border border-blue-200 focus:outline-none ml-2"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('todos');
                  }}
                >
                  Limpiar
                </button>
              )}
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
          <div className="bg-white rounded-t-2xl shadow-lg overflow-hidden">
            <div className="px-8 pt-7 pb-4 flex items-center justify-between bg-white rounded-t-2xl border-b border-gray-200">
              <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">Solicitudes Procesadas</h2>
              <span className="text-sm text-gray-500 font-medium">Orden: Pendientes → Rechazadas → Aprobadas</span>
            </div>
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">ID</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Folio</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Usuario</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Departamento</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Monto</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Cuenta</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Frecuencia</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Estado</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Siguiente fecha</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Aprobador</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Pagador</th>
                    <th className="px-6 py-4 bg-white text-left text-xs font-bold text-gray-700 uppercase border-b border-gray-200">Detalle</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-blue-600">Cargando solicitudes...</p>
                        </div>
                      </td>
                    </tr>
                  ) : solicitudesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-gray-500">
                        No se encontraron solicitudes que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    solicitudesFiltradas
                      .slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)
                      .map((s) => (
                        <tr key={s.id_recurrente} className="group hover:bg-blue-50 transition-colors border-b border-gray-200">
                          <td className="px-5 py-3 text-base text-gray-800 align-middle border-r border-gray-100 font-semibold">{s.id_recurrente}</td>
                          <td className="px-5 py-3 text-base font-bold text-blue-700 align-middle border-r border-gray-100 underline cursor-pointer hover:text-blue-900">
                            {s.folio ? (
                              <span>{s.folio}</span>
                            ) : '-'}
                          </td>
                          <td className="px-5 py-3 text-base text-gray-800 align-middle border-r border-gray-100">{s.nombre_usuario || '-'}</td>
                          <td className="px-5 py-3 text-base text-gray-700 align-middle border-r border-gray-100">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold border border-gray-200">{s.departamento}</span>
                          </td>
                          <td className="px-5 py-3 text-base font-semibold text-gray-700 align-middle border-r border-gray-100">
                            ${s.monto.toLocaleString('es-MX', {minimumFractionDigits:2})}
                          </td>
                          <td className="px-5 py-3 text-base text-gray-800 align-middle border-r border-gray-100">{s.cuenta_destino}</td>
                          <td className="px-5 py-3 text-base text-gray-700 align-middle border-r border-gray-100">{s.frecuencia}</td>
                          <td className="px-5 py-3 align-middle border-r border-gray-100">
                            {(() => {
                              const estado = (s.estado || '').toLowerCase();
                              if (estado === 'pendiente') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="#3b82f6"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>
                                    Pendiente
                                  </span>
                                );
                              } else if (estado === 'aprobada' || estado === 'aprobado') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="#22c55e"/><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Aprobada
                                  </span>
                                );
                              } else if (estado === 'rechazada' || estado === 'rechazado') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="#ef4444"/><path d="M9 9l6 6m0-6l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                                    Rechazada
                                  </span>
                                );
                              } else if (estado === 'pagada' || estado === 'pagado') {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="#fde68a"/><path d="M9 12l2 2 4-4" stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    Pagada
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                    {s.estado || '-'}
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-800 align-middle border-r border-gray-100">
                            {s.siguiente_fecha ? (
                              <span title={new Date(s.siguiente_fecha).toLocaleString('es-MX')}>
                                {new Date(s.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-800 align-middle border-r border-gray-100">{s.nombre_aprobador || '-'}</td>
                          <td className="px-5 py-3 text-sm text-gray-800 align-middle border-r border-gray-100">{s.nombre_pagador || '-'}</td>
                          <td className="px-5 py-3 align-middle">
                            <div className="flex gap-2 items-center">
                              <button
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-blue-500 bg-white text-blue-600 hover:bg-blue-100 hover:border-blue-700 transition"
                                onClick={() => { setSolicitudSeleccionada(s); setModalOpen(true); }}
                                title="Ver detalles"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2" fill="#fff"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="#3b82f6" strokeWidth="2"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="#3b82f6" strokeWidth="2"/></svg>
                              </button>
                              {s.estado === 'pendiente' && (
                                <>
                                  <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-green-500 bg-white text-green-600 hover:bg-green-100 hover:border-green-700 transition disabled:opacity-50"
                                    disabled={accionEnCurso === s.id_recurrente}
                                    onClick={() => setConfirmarAccion({ tipo: 'aprobar', id: s.id_recurrente })}
                                    title="Aprobar"
                                  >
                                    {accionEnCurso === s.id_recurrente ? (
                                      <div className="animate-spin h-4 w-4 border-2 border-green-600 rounded-full border-t-transparent"></div>
                                    ) : (
                                      <FaCheck size={16} />
                                    )}
                                  </button>
                                  <button
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-red-500 bg-white text-red-600 hover:bg-red-100 hover:border-red-700 transition disabled:opacity-50"
                                    disabled={accionEnCurso === s.id_recurrente}
                                    onClick={() => setConfirmarAccion({ tipo: 'rechazar', id: s.id_recurrente })}
                                    title="Rechazar"
                                  >
                                    <FaTimes size={16} />
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
          
          {/* Paginador - Fuera de la tabla como solicitado */}
          {!loading && solicitudesFiltradas.length > 0 && (
            <div className="flex items-center justify-between py-4 px-8 bg-white rounded-b-2xl border-t border-gray-200">
              <div className="text-base text-gray-600">
                Mostrando {Math.min(solicitudesFiltradas.length, (paginaActual - 1) * elementosPorPagina + 1)} a {Math.min(paginaActual * elementosPorPagina, solicitudesFiltradas.length)} de {solicitudesFiltradas.length} resultados
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} 
                  disabled={paginaActual === 1}
                  className={`px-4 py-2 rounded-md font-semibold ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                >
                  Anterior
                </button>
                {/* Números de página */}
                {Array.from({ length: Math.ceil(solicitudesFiltradas.length / elementosPorPagina) }).map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setPaginaActual(i + 1)}
                    className={`px-4 py-2 rounded-md font-semibold ${paginaActual === i + 1 ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(solicitudesFiltradas.length / elementosPorPagina)))}
                  disabled={paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina)}
                  className={`px-4 py-2 rounded-md font-semibold ${paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
    </AprobadorLayout>
  </ProtectedRoute>
);
}