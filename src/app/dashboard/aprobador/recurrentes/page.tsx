"use client";

import { useEffect, useState } from "react";
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PlantillaRecurrente } from '@/types';
import { RecurrentesService } from '@/services/recurrentes.service';
import { FaCheck, FaTimes, FaSearch, FaRegCalendarAlt } from 'react-icons/fa';

export default function AprobadorRecurrentesPage() {
  const [solicitudes, setSolicitudes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [comentario, setComentario] = useState<string>('');
  const [rechazoId, setRechazoId] = useState<number | null>(null);

  useEffect(() => {
    RecurrentesService.obtenerTodas()
      .then((data) => {
        setSolicitudes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar las solicitudes');
        setLoading(false);
      });
  }, []);

  const handleAprobar = async (id: number) => {
    setAccionEnCurso(id);
    setMensaje(null);
    setError(null);
    try {
      await RecurrentesService.aprobar(id);
      setSolicitudes((prev) => prev.map(s => s.id_recurrente === id ? { ...s, estado: 'aprobada' } : s));
      setMensaje('Solicitud aprobada correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setAccionEnCurso(null);
    }
  };

  const handleRechazar = async (id: number) => {
    setAccionEnCurso(id);
    setMensaje(null);
    setError(null);
    try {
      await RecurrentesService.rechazar(id, comentario);
      setSolicitudes((prev) => prev.map(s => s.id_recurrente === id ? { ...s, estado: 'rechazada', comentario_aprobador: comentario } : s));
      setMensaje('Solicitud rechazada correctamente.');
      setComentario('');
      setRechazoId(null);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setAccionEnCurso(null);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-100/40 to-blue-300/20 py-8 px-2">
          <div className="w-full max-w-6xl mx-auto bg-white/90 rounded-3xl shadow-2xl border border-blue-200 px-6 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-blue-800 mb-2 text-center tracking-tight">Solicitudes Recurrentes</h1>
            <p className="text-blue-700 mb-6 text-center">Gestiona y revisa las plantillas de pagos recurrentes pendientes, aprobadas o rechazadas.</p>
            {mensaje && (
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg mb-4">
                <FaCheck className="text-green-500" />
                <span>{mensaje}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg mb-4">
                <FaTimes className="text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full border-separate border-spacing-0 rounded-xl overflow-hidden shadow-sm">
                <thead className="sticky top-0 z-10" style={{background: 'rgba(240,244,252,0.95)'}}>
                  <tr>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">ID</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Usuario</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Departamento</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Monto</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Cuenta</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Frecuencia</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Estado</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Siguiente fecha</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Aprobador</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Pagador</th>
                    <th className="px-4 py-3 text-left text-blue-800 font-semibold text-sm border-b border-blue-200">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-blue-700 text-lg">Cargando solicitudes...</td>
                    </tr>
                  ) : solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-blue-700 text-lg">No hay solicitudes recurrentes.</td>
                    </tr>
                  ) : (
                    solicitudes.map((s) => (
                      <tr key={s.id_recurrente} className="border-b last:border-b-0 hover:bg-blue-50 transition-colors group">
                        <td className="px-4 py-3 font-mono text-black text-sm">{s.id_recurrente}</td>
                        <td className="px-4 py-3 text-black text-sm">{s.nombre_usuario || '-'}</td>
                        <td className="px-4 py-3 text-black text-sm">{s.departamento}</td>
                        <td className="px-4 py-3 text-black text-sm">${s.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                        <td className="px-4 py-3 text-black text-sm">{s.cuenta_destino}</td>
                        <td className="px-4 py-3 text-black text-sm">{s.frecuencia}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors duration-200 ${
                            s.estado === "aprobada"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : s.estado === "pendiente"
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : s.estado === "rechazada"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}>
                            {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-black text-sm">
                          {s.siguiente_fecha ? (
                            <span
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-xs shadow-sm cursor-help"
                              title={new Date(s.siguiente_fecha).toLocaleString('es-MX', { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            >
                              <FaRegCalendarAlt className="text-blue-400" />
                              {new Date(s.siguiente_fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-500 font-semibold text-xs shadow-sm">
                              <FaRegCalendarAlt className="text-gray-300" />
                              Sin fecha
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-black text-sm">{s.nombre_aprobador || '-'}</td>
                        <td className="px-4 py-3 text-black text-sm">{s.nombre_pagador || '-'}</td>
                        <td className="px-4 py-3">
                          {s.estado === 'pendiente' ? (
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              <button
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition disabled:opacity-50"
                                disabled={accionEnCurso === s.id_recurrente}
                                onClick={() => handleAprobar(s.id_recurrente)}
                                title="Aprobar"
                              >
                                <FaCheck /> {accionEnCurso === s.id_recurrente ? 'Procesando...' : 'Aprobar'}
                              </button>
                              <button
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition disabled:opacity-50"
                                disabled={accionEnCurso === s.id_recurrente}
                                onClick={() => { setRechazoId(s.id_recurrente); setComentario(''); }}
                                title="Rechazar"
                              >
                                <FaTimes /> {accionEnCurso === s.id_recurrente ? 'Procesando...' : 'Rechazar'}
                              </button>
                              {rechazoId === s.id_recurrente && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <textarea
                                    className="border rounded p-1 text-xs"
                                    rows={2}
                                    placeholder="Motivo del rechazo (opcional)"
                                    value={comentario}
                                    onChange={e => setComentario(e.target.value)}
                                    disabled={accionEnCurso === s.id_recurrente}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                      disabled={accionEnCurso === s.id_recurrente}
                                      onClick={() => handleRechazar(s.id_recurrente)}
                                    >Confirmar rechazo</button>
                                    <button
                                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded text-xs"
                                      onClick={() => setRechazoId(null)}
                                      disabled={accionEnCurso === s.id_recurrente}
                                    >Cancelar</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              <button
                                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200 shadow-sm transition"
                                title="Ver detalles"
                                // Aquí podrías abrir un modal de detalles si lo tienes implementado
                              >
                                <FaSearch /> Ver
                              </button>
                              <span className="text-gray-400 text-xs">Sin acciones</span>
                              {s.estado === 'rechazada' && s.comentario_aprobador && (
                                <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mt-1" title={s.comentario_aprobador}>
                                  Motivo: {s.comentario_aprobador.length > 30 ? s.comentario_aprobador.slice(0, 30) + '…' : s.comentario_aprobador}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}
