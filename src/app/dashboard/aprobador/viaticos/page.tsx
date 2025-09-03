"use client";

import React, { useMemo, useCallback } from 'react';
import { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import axios from 'axios';
import { useViaticos } from '@/hooks/useViaticos';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { usePagination } from '@/hooks/usePagination';

import { Solicitud } from '@/types';
import { formatDate, normalizeViatico } from '@/utils/viaticos';

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 11 }).map((_, i) => (
      <td key={i} className="h-8 bg-gray-100 rounded" />
    ))}
  </tr>
);

const ViaticoRow: React.FC<{
  v: Solicitud;
  isSelected: boolean;
  onToggle: (id: number) => void;
  tresDiasDespues: Date;
}> = React.memo(({ v, isSelected, onToggle, tresDiasDespues }) => {
  if (!v.id_solicitud) return null;
  const isUrgent = new Date(v.fecha_limite_pago) < tresDiasDespues;
  let tipoCuentaTarjeta = '-';
  if (v.tipo_cuenta_destino && v.tipo_tarjeta) {
    tipoCuentaTarjeta = `${v.tipo_cuenta_destino} / ${v.tipo_tarjeta}`;
  } else if (v.tipo_cuenta_destino) {
    tipoCuentaTarjeta = v.tipo_cuenta_destino;
  } else if (v.tipo_tarjeta) {
    tipoCuentaTarjeta = v.tipo_tarjeta;
  }
  return (
    <tr className={`group transition-colors duration-150 ${isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50/80'}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          aria-label={isSelected ? 'Deseleccionar viático' : 'Seleccionar viático'}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
          checked={isSelected}
          onChange={() => onToggle(v.id_solicitud)}
        />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
          {v.folio || v.id_solicitud}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{v.usuario_nombre || `Usuario ${v.id_usuario}`}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {(v.tipo_pago || '-').toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {(v.departamento || '-').toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">
          ${v.monto ? v.monto.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }) : '0.00'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
            {formatDate(v.fecha_limite_pago)}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center p-1 rounded-full bg-red-100 text-red-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">{formatDate(v.fecha_creacion)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-900">{tipoCuentaTarjeta}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-900">{v.banco_destino || '-'}</span>
      </td>
      <td className="px-4 py-3 text-center">
        {v.viatico_url ? (
          <a
            href={`/uploads/viaticos/${v.viatico_url.split('/').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-colors"
          >
            <FaFilePdf className="text-red-500" />
            <span>Ver PDF</span>
          </a>
        ) : (
          <span className="text-sm text-gray-400">Sin archivo</span>
        )}
      </td>
    </tr>
  );
});
ViaticoRow.displayName = 'ViaticoRow';

const useSelectAllByUsuario = (viaticosPorUsuario: Record<string, Solicitud[]>, selectedViaticos: number[], setSelectedViaticos: React.Dispatch<React.SetStateAction<number[]>>) => {
  return useCallback((usuario: string) => {
    const viaticosUsuario = viaticosPorUsuario[usuario] || [];
    const allSelected = viaticosUsuario.every(v => selectedViaticos.includes(v.id_solicitud));
    if (allSelected) {
      setSelectedViaticos(selectedViaticos.filter(id => !viaticosUsuario.some(v => v.id_solicitud === id)));
    } else {
      setSelectedViaticos([
        ...selectedViaticos,
        ...viaticosUsuario.filter(v => !selectedViaticos.includes(v.id_solicitud)).map(v => v.id_solicitud)
      ]);
    }
  }, [viaticosPorUsuario, selectedViaticos, setSelectedViaticos]);
};

import { useUserPagination } from '@/hooks/useUserPagination';
import api from '@/lib/api';

const DEFAULT_ITEMS_PER_PAGE = 5;

const Viaticos: React.FC = () => {
  const { viaticos = [], loading, error, refetch } = useViaticos();
  const tresDiasDespues = useMemo(() => new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), []);

  const [selectedViaticos, setSelectedViaticos] = React.useState<number[]>([]);
  const toggleViatico = useCallback((id: number) => {
    setSelectedViaticos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const viaticosOrdenados = useMemo(() =>
    viaticos
      .filter(v => v.estado === 'pendiente')
      .slice()
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_limite_pago).getTime();
        const fechaB = new Date(b.fecha_limite_pago).getTime();
        const esUrgenteA = fechaA < tresDiasDespues.getTime();
        const esUrgenteB = fechaB < tresDiasDespues.getTime();
        if (esUrgenteA && !esUrgenteB) return -1;
        if (!esUrgenteA && esUrgenteB) return 1;
        return fechaA - fechaB;
      })
      .map(normalizeViatico),
    [viaticos, tresDiasDespues]
  );

  const viaticosForFilter: Solicitud[] = viaticosOrdenados;

  const filteredViaticos = viaticosForFilter;

  const viaticosPorUsuario = useMemo(() => {
    if (!Array.isArray(filteredViaticos)) return {};
    return filteredViaticos.reduce((acc: Record<string, Solicitud[]>, v: Solicitud) => {
      const id = String(v.id_usuario);
      if (!acc[id]) acc[id] = [];
      acc[id].push(v);
      return acc;
    }, {});
  }, [filteredViaticos]);

  usePagination({ data: filteredViaticos, initialItemsPerPage: DEFAULT_ITEMS_PER_PAGE });

  const userIds = useMemo(() => Object.keys(viaticosPorUsuario), [viaticosPorUsuario]);
  const userPagination = useUserPagination(userIds, DEFAULT_ITEMS_PER_PAGE);

  const selectAllByUsuario = useSelectAllByUsuario(
    viaticosPorUsuario,
    selectedViaticos,
    setSelectedViaticos
  );
  const hasSelection = selectedViaticos.length > 0;

  const [usuarioExpandido, setUsuarioExpandido] = React.useState<string | null>(null);

  const [accionCargando, setAccionCargando] = useState<'aprobar' | 'rechazar' | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const [modalConfirm, setModalConfirm] = useState<null | 'aprobar' | 'rechazar'>(null);

  const aprobarSeleccionados = async () => {
    setModalConfirm(null);
    setAccionCargando('aprobar');
    setMensajeAccion(null);
    setErrorAccion(null);
    try {
      const response = await api.post('/viaticos/aprobar-lote', {
        ids: selectedViaticos,
      });
      setMensajeAccion(response.data.message || 'Viáticos aprobados correctamente');
      setSelectedViaticos([]);
      if (typeof refetch === 'function') refetch();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorAccion(err.response?.data?.error || 'Error al aprobar viáticos');
      } else {
        setErrorAccion('Error inesperado al aprobar viáticos');
      }
    } finally {
      setAccionCargando(null);
    }
  };

  const rechazarSeleccionados = async () => {
    setModalConfirm(null);
    setAccionCargando('rechazar');
    setMensajeAccion(null);
    setErrorAccion(null);
    try {
      const response = await api.post('/viaticos/rechazar-lote', {
        ids: selectedViaticos,
      });
      setMensajeAccion(response.data.message || 'Viáticos rechazados correctamente');
      setSelectedViaticos([]);
      if (typeof refetch === 'function') refetch();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorAccion(err.response?.data?.error || 'Error al rechazar viáticos');
      } else {
        setErrorAccion('Error inesperado al rechazar viáticos');
      }
    } finally {
      setAccionCargando(null);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 mb-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Viáticos Pendientes</h1>
                <p className="text-blue-100 text-sm">
                  Gestiona y aprueba las solicitudes de viáticos pendientes
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 lg:flex-shrink-0">
                <p className="text-white/90 text-sm font-medium">
                  Total: <span className="text-white font-semibold">{viaticos.length}</span> viáticos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 rounded-lg p-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-red-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-white">
                      {viaticos.filter(v => new Date(v.fecha_limite_pago) < tresDiasDespues).length}
                    </p>
                    <p className="text-red-100 text-sm">Urgentes</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 rounded-lg p-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-white">{viaticos.length}</p>
                    <p className="text-blue-100 text-sm">Total Pendientes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              {hasSelection && (
                <div className="fixed left-1/2 bottom-8 transform -translate-x-1/2 z-50 animate-slide-up">
                  <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 p-6 min-w-[480px] max-w-[600px] overflow-hidden">
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 rounded-2xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Clean header */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-xs font-bold">{selectedViaticos.length}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Aprobación de Viáticos</h3>
                          <p className="text-sm text-gray-600">
                            {selectedViaticos.length} elemento{selectedViaticos.length !== 1 ? 's' : ''} seleccionado{selectedViaticos.length !== 1 ? 's' : ''} para revisión
                          </p>
                        </div>
                      </div>

                      {/* Action buttons - Modern and clean */}
                      <div className="flex gap-3">
                        <button
                          className="group relative flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                          onClick={() => setModalConfirm('aprobar')}
                          disabled={accionCargando === 'aprobar'}
                        >
                          <div className="flex items-center justify-center gap-3">
                            {accionCargando === 'aprobar' ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Aprobar Selección</span>
                              </>
                            )}
                          </div>
                          {/* Subtle hover effect */}
                          <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                        
                        <button
                          className="group relative flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                          onClick={() => setModalConfirm('rechazar')}
                          disabled={accionCargando === 'rechazar'}
                        >
                          <div className="flex items-center justify-center gap-3">
                            {accionCargando === 'rechazar' ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Rechazar Selección</span>
                              </>
                            )}
                          </div>
                          {/* Subtle hover effect */}
                          <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </div>

                      {/* Clean feedback messages */}
                      {(mensajeAccion || errorAccion) && (
                        <div className="mt-5 animate-fade-in">
                          {mensajeAccion && (
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-800 text-sm">Operación exitosa</h4>
                                <p className="text-green-700 text-sm">{mensajeAccion}</p>
                              </div>
                            </div>
                          )}
                          {errorAccion && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-red-800 text-sm">Error en la operación</h4>
                                <p className="text-red-700 text-sm">{errorAccion}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Optional: Quick stats */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Seleccionados: {selectedViaticos.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span>Aprobación requerida</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center animate-fade-in">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">
                      {modalConfirm === 'aprobar' ? '¿Aprobar viáticos seleccionados?' : '¿Rechazar viáticos seleccionados?'}
                    </h3>
                    <p className="text-blue-800 mb-6 text-center">
                      Se {modalConfirm === 'aprobar' ? 'aprobarán' : 'rechazarán'} <b>{selectedViaticos.length}</b> viáticos. ¿Estás seguro?
                    </p>
                    <div className="flex gap-4">
                      <button
                        className="px-4 py-2 rounded font-semibold bg-blue-200 hover:bg-blue-300 text-blue-900 transition"
                        onClick={() => setModalConfirm(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        className={modalConfirm === 'aprobar'
                          ? 'px-4 py-2 rounded font-semibold bg-green-500 hover:bg-green-600 text-white transition'
                          : 'px-4 py-2 rounded font-semibold bg-red-500 hover:bg-red-600 text-white transition'}
                        onClick={modalConfirm === 'aprobar' ? aprobarSeleccionados : rechazarSeleccionados}
                        autoFocus
                      >
                        {modalConfirm === 'aprobar' ? 'Sí, aprobar' : 'Sí, rechazar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <table className="min-w-[950px] w-full border-collapse text-xs md:text-sm">
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                  </tbody>
                </table>
              ) : error ? (
                <div className="text-center py-8 text-red-500 flex flex-col items-center gap-2">
                  <span>Ocurrió un error al cargar los viáticos.</span>
                </div>
              ) : (
                <>
                  {userIds.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay viáticos para mostrar.</div>
                  ) : (
                    <div className="space-y-6">
                      {userIds.map((userId) => {
                        const viaticosUsuario = viaticosPorUsuario[userId] || [];
                        const currentPage = userPagination.getPage(userId);
                        const itemsPerPage = userPagination.getItemsPerPage(userId);
                        const totalItems = viaticosUsuario.length;
                        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                        const startIdx = (currentPage - 1) * itemsPerPage;
                        const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
                        const pageViaticos = viaticosUsuario.slice(startIdx, endIdx);
                        const usuarioNombre = viaticosUsuario[0]?.usuario_nombre || `Usuario ${userId}`;
                        const isOpen = usuarioExpandido === userId;
                        
                        return (
                          <div key={userId} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300">
                            <button
                              className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50/80 focus:outline-none focus:bg-gray-50/80 transition-all duration-200 ${isOpen ? 'border-b border-gray-200' : ''}`}
                              aria-expanded={isOpen}
                              onClick={() => setUsuarioExpandido(isOpen ? null : userId)}
                            >
                              <div className="flex-1 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div className="text-left">
                                  <span className="block text-sm font-semibold text-gray-900">{usuarioNombre}</span>
                                  <span className="block text-xs text-gray-500">ID: {userId}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {totalItems} viáticos
                                </span>
                                <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} 
                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {isOpen && (
                              <div className="overflow-x-auto transition-all duration-300">
                                <div className="px-6 py-2 text-blue-900 text-sm font-semibold">
                                  {totalItems === 0
                                    ? 'No hay viáticos para este usuario.'
                                    : `Mostrando ${totalItems === 0 ? 0 : startIdx + 1}–${endIdx} de ${totalItems} viáticos`}
                                </div>
                                
                                {pageViaticos.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-12">
                                    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="mt-4 text-sm text-gray-500">No hay viáticos en esta página para {usuarioNombre}</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-[1050px] w-full border-collapse text-sm">
                                      <thead>
                                        <tr className="bg-gray-50/80">
                                          <th className="px-4 py-3 first:rounded-tl-lg">
                                            <input
                                              type="checkbox"
                                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              checked={pageViaticos.length > 0 && pageViaticos.every(v => selectedViaticos.includes(v.id_solicitud))}
                                              onChange={() => selectAllByUsuario(userId)}
                                            />
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depto.</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-1">
                                              <span>Límite</span>
                                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                              </svg>
                                            </div>
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitud</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider last:rounded-tr-lg">Archivo</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {pageViaticos.map((v) => (
                                          <ViaticoRow
                                            key={`${userId}-${v.id_solicitud}`}
                                            v={v}
                                            isSelected={selectedViaticos.includes(v.id_solicitud)}
                                            onToggle={toggleViatico}
                                            tresDiasDespues={tresDiasDespues}
                                          />
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {totalPages > 1 && (
                                  <div className="flex justify-end px-6 py-4">
                                    <nav>
                                      <ul className="flex items-center gap-1 bg-white/80 rounded-xl shadow border border-gray-200 px-2 py-1">
                                        <li>
                                          <button
                                            className="transition-all duration-150 px-3 py-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            onClick={() => userPagination.setPage(userId, Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                          >
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                          </button>
                                        </li>
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                          <li key={idx}>
                                            <button
                                              className={`transition-all duration-150 px-3 py-2 rounded-full font-semibold border-2 ${currentPage === idx + 1
                                                ? 'bg-gradient-to-tr from-blue-600 to-blue-400 text-white border-blue-600 shadow-lg scale-105'
                                                : 'bg-white text-blue-700 border-transparent hover:border-blue-400 hover:bg-blue-50'}`}
                                              onClick={() => userPagination.setPage(userId, idx + 1)}
                                            >
                                              {idx + 1}
                                            </button>
                                          </li>
                                        ))}
                                        <li>
                                          <button
                                            className="transition-all duration-150 px-3 py-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            onClick={() => userPagination.setPage(userId, Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                          >
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          </button>
                                        </li>
                                      </ul>
                                    </nav>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
};

export default Viaticos;
