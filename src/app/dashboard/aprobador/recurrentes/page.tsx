"use client";

import { useEffect, useState } from "react";
import React from "react";
import { SolicitudModal } from '../components/SolicitudModal';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PlantillaRecurrente } from '@/types';
import { RecurrentesService } from '@/services/recurrentes.service';
import { FaCheck, FaTimes, FaSearch, FaRegCalendarAlt } from 'react-icons/fa';

export default function AprobadorRecurrentesPage() {
const [solicitudes, setSolicitudes] = useState<PlantillaRecurrente[]>([]);
const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<PlantillaRecurrente[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
const [mensaje, setMensaje] = useState<string | null>(null);
const [comentario, setComentario] = useState<string>('');
const [rechazoId, setRechazoId] = useState<number | null>(null);
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
  
  // Filtrar por estado
  if (filtroEstado !== 'todos') {
    resultado = resultado.filter(s => s.estado === filtroEstado);
  }
  
  // Ordenar los resultados: pendientes primero, luego rechazadas, y finalmente aprobadas
  resultado.sort((a, b) => {
    // Orden de prioridad: pendiente (más alta) > rechazada > aprobada (más baja)
    const prioridad = {
      'pendiente': 0,
      'rechazada': 1,
      'aprobada': 2
    };
    
    // Comparar por prioridad de estado
    return (prioridad[a.estado as keyof typeof prioridad] ?? 3) - 
            (prioridad[b.estado as keyof typeof prioridad] ?? 3);
  });
  
  setSolicitudesFiltradas(resultado);
  setPaginaActual(1); // Reset a la primera página al filtrar
}, [busqueda, filtroEstado, solicitudes]);

const handleAprobar = async (id: number) => {
  setAccionEnCurso(id);
  setMensaje(null);
  setError(null);
  try {
    await RecurrentesService.aprobar(id);
    setSolicitudes((prev) => prev.map(s => s.id_recurrente === id ? { ...s, estado: 'aprobada', comentario_aprobador: 'Solicitud aprobada' } : s));
    setMensaje('Solicitud aprobada correctamente.');
    setComentario('');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      setError((err as { message: string }).message);
    } else {
      setError('Error inesperado');
    }
  } finally {
    setAccionEnCurso(null);
  }
};

const handleRechazar = async (id: number) => {
  setAccionEnCurso(id);
  setMensaje(null);
  setError(null);
  try {
    // Comentario por defecto si está vacío
    const comentarioRechazo = comentario && comentario.trim() !== '' ? comentario : 'Solicitud rechazada';
    await RecurrentesService.rechazar(id, comentarioRechazo);
    setSolicitudes((prev) => prev.map(s => s.id_recurrente === id ? { ...s, estado: 'rechazada', comentario_aprobador: comentarioRechazo } : s));
    setMensaje('Solicitud rechazada correctamente.');
    setComentario('');
    setRechazoId(null);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      setError((err as { message: string }).message);
    } else {
      setError('Error inesperado');
    }
  } finally {
    setAccionEnCurso(null);
  }
};

return (
  <ProtectedRoute requiredRoles={['aprobador']}>
    <AprobadorLayout>
      <div className="min-h-[80vh] bg-blue-600 py-6 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Solicitudes Recurrentes</h1>
            <p className="text-white/90 mb-4">Total: {solicitudesFiltradas.length} de {solicitudes.length} solicitudes</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  className="bg-white/90 pl-10 pr-4 py-2 rounded-lg w-full text-sm text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Buscar por nombre, departamento, cuenta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-2.5 text-blue-400" size={16} />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-white text-sm font-medium">Estado:</label>
                <select 
                  className="bg-white/90 px-3 py-2 rounded-lg text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">⬤ Pendientes</option>
                  <option value="rechazada">⬤ Rechazadas</option>
                  <option value="aprobada">⬤ Aprobadas</option>
                </select>
              </div>
              
              {(busqueda || filtroEstado !== 'todos') && (
                <button 
                  className="bg-white/90 hover:bg-white px-3 py-2 rounded-lg text-sm text-blue-700 focus:outline-none"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('todos');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
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

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Solicitudes Procesadas</h2>
                <span className="text-xs text-gray-500">
                  Orden: Pendientes → Rechazadas → Aprobadas
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <th className="py-3 px-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Folio</th>
                    <th className="py-3 px-4 text-left">Usuario</th>
                    <th className="py-3 px-4 text-left">Departamento</th>
                    <th className="py-3 px-4 text-left">Monto</th>
                    <th className="py-3 px-4 text-left">Cuenta</th>
                    <th className="py-3 px-4 text-left">Frecuencia</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-left">Siguiente fecha</th>
                    <th className="py-3 px-4 text-left">Aprobador</th>
                    <th className="py-3 px-4 text-left">Pagador</th>
                    <th className="py-3 px-4 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                  // Aplicar paginación
                  solicitudesFiltradas
                    .slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina)
                    .map((s) => (
                    <tr key={s.id_recurrente} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-800">{s.id_recurrente}</td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {s.folio ? (
                          <span className="text-blue-600">
                            {s.folio}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">{s.nombre_usuario || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{s.departamento}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-600">
                        ${s.monto.toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">{s.cuenta_destino}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{s.frecuencia}</td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center">
                          {s.estado === "aprobada" ? (
                            <span className="inline-flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              <span className="text-sm text-green-600">Aprobada</span>
                            </span>
                          ) : s.estado === "pendiente" ? (
                            <span className="inline-flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              <span className="text-sm text-blue-600">Pendiente</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                              <span className="text-sm text-red-600">Rechazada</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">
                        {s.siguiente_fecha ? (
                          <span title={new Date(s.siguiente_fecha).toLocaleString('es-MX')}>
                            {new Date(s.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">{s.nombre_aprobador || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{s.nombre_pagador || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 items-center">
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                            onClick={() => { setSolicitudSeleccionada(s); setModalOpen(true); }}
                            title="Ver detalles"
                          >
                            <FaSearch size={14} />
                          </button>
                          
                          {s.estado === 'pendiente' && (
                            <>
                              <button
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                                disabled={accionEnCurso === s.id_recurrente}
                                onClick={() => handleAprobar(s.id_recurrente)}
                                title="Aprobar"
                              >
                                {accionEnCurso === s.id_recurrente ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-green-600 rounded-full border-t-transparent"></div>
                                ) : (
                                  <FaCheck size={14} />
                                )}
                              </button>
                              <button
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                                disabled={accionEnCurso === s.id_recurrente}
                                onClick={() => { setRechazoId(s.id_recurrente); setComentario(''); }}
                                title="Rechazar"
                              >
                                <FaTimes size={14} />
                              </button>
                            </>
                          )}
                          
                          {rechazoId === s.id_recurrente && (
                            <div className="absolute bg-white border shadow-lg p-3 z-10 rounded-lg mt-48 -ml-20 w-64">
                              <h3 className="text-sm font-medium mb-2 text-gray-700">Motivo del rechazo:</h3>
                              <textarea
                                className="border w-full p-2 text-sm mb-3 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={3}
                                placeholder="Ingrese un motivo para el rechazo"
                                value={comentario}
                                onChange={e => setComentario(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  className="bg-gray-200 text-gray-600 px-3 py-1 rounded-md text-sm"
                                  onClick={() => setRechazoId(null)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
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
            <div className="flex items-center justify-between py-4 px-6 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {Math.min(solicitudesFiltradas.length, (paginaActual - 1) * elementosPorPagina + 1)} a {Math.min(paginaActual * elementosPorPagina, solicitudesFiltradas.length)} de {solicitudesFiltradas.length} resultados
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} 
                  disabled={paginaActual === 1}
                  className={`px-3 py-1 rounded-md ${paginaActual === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                
                {/* Números de página */}
                {Array.from({ length: Math.ceil(solicitudesFiltradas.length / elementosPorPagina) }).map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => setPaginaActual(i + 1)}
                    className={`px-3 py-1 rounded-md ${paginaActual === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, Math.ceil(solicitudesFiltradas.length / elementosPorPagina)))}
                  disabled={paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina)}
                  className={`px-3 py-1 rounded-md ${paginaActual === Math.ceil(solicitudesFiltradas.length / elementosPorPagina) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
    </AprobadorLayout>
  </ProtectedRoute>
);
}