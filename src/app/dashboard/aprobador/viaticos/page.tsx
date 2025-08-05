"use client";

import React, { useMemo, useCallback } from 'react';
import { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import axios from 'axios';
import { useViaticos } from '@/hooks/useViaticos';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { Solicitud } from '@/types';
import { formatCurrency, formatDate, getDepartmentColorClass, normalizeViatico } from '@/utils/viaticos';
import { UrgencyBadge } from '@/components/viaticos/UrgencyBadge';

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 11 }).map((_, i) => (
      <td key={i} className="h-8 bg-blue-100/40 rounded" />
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
    <tr className="border-b last:border-b-0 hover:bg-blue-100/60 transition-colors group">
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          aria-label={isSelected ? 'Deseleccionar viático' : 'Seleccionar viático'}
          className="accent-blue-600 w-4 h-4 rounded shadow"
          checked={isSelected}
          onChange={() => onToggle(v.id_solicitud)}
        />
      </td>
      <td className="px-4 py-3 font-mono text-blue-900 text-base font-semibold">{v.id_solicitud}</td>
      <td className="px-4 py-3 text-blue-800 text-sm font-semibold">{v.folio || '-'}</td>
      <td className="px-4 py-3 text-blue-900 text-sm">{v.usuario_nombre || `Usuario ${v.id_usuario}`}</td>
      <td className="px-4 py-3 text-blue-700 text-xs font-bold">
        <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800">
          {(v.tipo_pago || '-').toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={getDepartmentColorClass(v.departamento)}>
          {(v.departamento || '-').toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-base text-blue-900 font-bold">{formatCurrency(v.monto)}</td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isUrgent ? 'text-red-600 font-bold' : 'text-gray-900'}`}> 
        {formatDate(v.fecha_limite_pago)}
        <UrgencyBadge isUrgent={isUrgent} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(v.fecha_creacion)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{tipoCuentaTarjeta}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{v.banco_destino || ''}</td>
      <td className="px-6 py-4 text-center">
        {v.viatico_url ? (
          <a
            href={`http://localhost:4000/uploads/viaticos/${v.viatico_url.split('/').pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold"
          >
            <FaFilePdf className="text-red-600" /> Ver
          </a>
        ) : (
          <span className="text-gray-400">-</span>
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

  // Selección múltiple para checklist (persistente entre modos y páginas)
  const [selectedViaticos, setSelectedViaticos] = React.useState<number[]>([]);
  const toggleViatico = useCallback((id: number) => {
    setSelectedViaticos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  // Ordenar y normalizar viaticos
  // Filtrar solo viáticos pendientes antes de ordenar y normalizar
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

  // FILTROS AVANZADOS
  const {
    filters,
    filteredData: filteredViaticos,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(viaticosForFilter, 'solicitudes');

  // Agrupar viáticos filtrados por id_usuario (clave: id_usuario)
  const viaticosPorUsuario = useMemo(() => {
    if (!Array.isArray(filteredViaticos)) return {};
    return filteredViaticos.reduce((acc: Record<string, Solicitud[]>, v: Solicitud) => {
      const id = String(v.id_usuario);
      if (!acc[id]) acc[id] = [];
      acc[id].push(v);
      return acc;
    }, {});
  }, [filteredViaticos]);

  // PAGINACIÓN GLOBAL (sobre todos los viáticos filtrados)
  // Aquí usamos usePagination pero no usamos sus valores de retorno actualmente
  usePagination({ data: filteredViaticos, initialItemsPerPage: DEFAULT_ITEMS_PER_PAGE });

  // Paginación local por usuario (hook reutilizable)
  const userIds = useMemo(() => Object.keys(viaticosPorUsuario), [viaticosPorUsuario]);
  const userPagination = useUserPagination(userIds, DEFAULT_ITEMS_PER_PAGE);


  // Selección masiva por usuario (persistente y global)
  const selectAllByUsuario = useSelectAllByUsuario(
    viaticosPorUsuario,
    selectedViaticos,
    setSelectedViaticos
  );
  const hasSelection = selectedViaticos.length > 0;

  // Estado para controlar qué usuario está expandido (acordeón)
  const [usuarioExpandido, setUsuarioExpandido] = React.useState<string | null>(null);


  // Estado para feedback de acciones masivas
  const [accionCargando, setAccionCargando] = useState<'aprobar' | 'rechazar' | null>(null);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // Estado para confirmaciones modales
  const [modalConfirm, setModalConfirm] = useState<null | 'aprobar' | 'rechazar'>(null);

  // Función para aprobar lote de viáticos seleccionados (con confirmación)
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
      if (typeof refetch === 'function') refetch(); // Recargar viáticos
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

  // Función para rechazar lote de viáticos seleccionados (con confirmación)
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
      if (typeof refetch === 'function') refetch(); // Recargar viáticos
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

  // Renderizado: acordeón, solo muestra la tabla del usuario seleccionado
  return (
    <ProtectedRoute requiredRoles={['aprobador']}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white font-sans mb-2">Viáticos Pendientes</h2>
            <p className="text-white/80">Total: {viaticos.length} viáticos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-blue-200">
            {/* FILTROS AVANZADOS */}
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onReset={resetFilters}
              type="solicitudes"
            />
            <div className="overflow-x-auto">
              {/* Barra fija de acciones masivas */}
              {/* Barra de acciones masivas: aprobar/rechazar */}
              {hasSelection && (
                <div className="fixed left-0 right-0 bottom-0 z-40 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-8 py-6 flex items-center gap-8 shadow-2xl animate-fade-in justify-center border-t-4 border-blue-400">
                  <span className="font-extrabold text-lg tracking-wide drop-shadow-lg">
                    Seleccionados: <span className="text-yellow-300 text-2xl font-black animate-pulse">{selectedViaticos.length}</span>
                  </span>
                  {/* Botón Aprobar */}
                  <button
                    className="flex items-center gap-2 bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-4 rounded-2xl font-extrabold text-xl shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-60 border-2 border-white/30"
                    aria-label={`Aprobar ${selectedViaticos.length} viáticos`}
                    onClick={() => setModalConfirm('aprobar')}
                    disabled={accionCargando === 'aprobar'}
                  >
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {accionCargando === 'aprobar' ? 'Aprobando...' : 'Aprobar'}
                  </button>
                  {/* Botón Rechazar */}
                  <button
                    className="flex items-center gap-2 bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-8 py-4 rounded-2xl font-extrabold text-xl shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-60 border-2 border-white/30"
                    aria-label={`Rechazar ${selectedViaticos.length} viáticos`}
                    onClick={() => setModalConfirm('rechazar')}
                    disabled={accionCargando === 'rechazar'}
                  >
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    {accionCargando === 'rechazar' ? 'Rechazando...' : 'Rechazar'}
                  </button>
                  {/* Mensaje de éxito o error */}
                  {mensajeAccion && (
                    <span className="ml-6 text-green-200 font-extrabold text-lg animate-fade-in drop-shadow-lg">{mensajeAccion}</span>
                  )}
                  {errorAccion && (
                    <span className="ml-6 text-red-200 font-extrabold text-lg animate-fade-in drop-shadow-lg">{errorAccion}</span>
                  )}
                </div>
              )}

              {/* Modal de confirmación para aprobar/rechazar lote */}
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
                        aria-label="Cancelar confirmación"
                      >
                        Cancelar
                      </button>
                      <button
                        className={modalConfirm === 'aprobar'
                          ? 'px-4 py-2 rounded font-semibold bg-green-500 hover:bg-green-600 text-white transition'
                          : 'px-4 py-2 rounded font-semibold bg-red-500 hover:bg-red-600 text-white transition'}
                        onClick={modalConfirm === 'aprobar' ? aprobarSeleccionados : rechazarSeleccionados}
                        aria-label={modalConfirm === 'aprobar' ? 'Confirmar aprobar' : 'Confirmar rechazar'}
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
                      {/* Renderiza todos los encabezados de usuario como botones de acordeón */}
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
                          <div key={userId} className="border border-blue-200 rounded-2xl bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg overflow-x-auto transition-all duration-300">
                            {/* Encabezado clickable para expandir/colapsar */}
                            <button
                              className={`w-full flex items-center gap-3 px-7 py-4 bg-gradient-to-r from-blue-300/60 to-blue-100 rounded-t-2xl border-b border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 ${isOpen ? 'shadow-lg' : 'opacity-80 hover:opacity-100'}`}
                              aria-expanded={isOpen}
                              aria-controls={`tabla-usuario-${userId}`}
                              onClick={() => setUsuarioExpandido(isOpen ? null : userId)}
                            >
                              <span className="text-blue-900 font-extrabold text-lg flex items-center gap-2">
                                <svg aria-hidden="true" focusable="false" xmlns='http://www.w3.org/2000/svg' className={`inline w-6 h-6 text-blue-700 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                                {usuarioNombre}
                              </span>
                              <span className="ml-2 text-xs text-white bg-blue-500 px-3 py-1 rounded-full shadow font-semibold flex items-center gap-1">
                                <svg aria-hidden="true" focusable="false" xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 17v-2a4 4 0 118 0v2M12 19h.01' /></svg>
                                {totalItems} viáticos
                              </span>
                              <span className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}> {/* Flecha acordeón */}
                                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </span>
                            </button>
                            {/* Contenido del acordeón: solo visible si está expandido */}
                            {isOpen && (
                              <div id={`tabla-usuario-${userId}`} className="overflow-x-auto transition-all duration-300">
                                <div className="px-6 py-2 text-blue-900 text-sm font-semibold">
                                  {totalItems === 0
                                    ? 'No hay viáticos para este usuario.'
                                    : `Mostrando ${totalItems === 0 ? 0 : startIdx + 1}–${endIdx} de ${totalItems} viáticos`}
                                </div>
                                {pageViaticos.length === 0 ? (
                                  <div className="text-center py-6 text-gray-400">No hay viáticos en esta página para {usuarioNombre}.</div>
                                ) : (
                                  <table className="min-w-[1050px] w-full border-collapse text-xs md:text-sm">
                                    <thead className="bg-blue-50">
                                      <tr>
                                        <th className="px-1 py-2 border-b border-blue-200 text-center">
                                          <input
                                            type="checkbox"
                                            aria-label={`Seleccionar todos los viáticos de ${usuarioNombre}`}
                                            className="accent-blue-600 w-4 h-4 rounded shadow"
                                            checked={pageViaticos.length > 0 && pageViaticos.every(v => selectedViaticos.includes(v.id_solicitud))}
                                            onChange={() => selectAllByUsuario(userId)}
                                          />
                                        </th>
                                        <th className="px-2 py-2 text-left text-blue-800 font-bold border-b border-blue-200">ID</th>
                                        <th className="px-2 py-2 text-left text-blue-800 font-bold border-b border-blue-200">Folio</th>
                                        <th className="px-2 py-2 text-left text-blue-800 font-bold border-b border-blue-200">Usuario</th>
                                        <th className="px-2 py-2 text-left text-blue-800 font-bold border-b border-blue-200">TIPO DE PAGO</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">DEPTO.</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">MONTO</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">LÍMITE</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">SOLICITUD</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">CUENTA/TARJETA</th>
                                        <th className="px-3 py-2 text-left text-blue-800 font-bold border-b border-blue-200">BANCO</th>
                                        <th className="px-3 py-2 text-center text-blue-800 font-bold border-b border-blue-200">Ver Viático</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-blue-100">
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
                                )}
                                {/* Paginador local por usuario */}
                                {totalPages > 1 && (
                                  <div className="flex justify-end px-6 py-4">
                                    <nav aria-label={`Paginador de ${usuarioNombre}`}> 
                                      <ul className="flex items-center gap-1 bg-white/80 rounded-xl shadow border border-blue-200 px-2 py-1">
                                        <li>
                                          <button
                                            className="transition-all duration-150 px-3 py-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                            onClick={() => userPagination.setPage(userId, Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            aria-label="Página anterior"
                                          >
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                          </button>
                                        </li>
                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                          <li key={idx}>
                                            <button
                                              className={`transition-all duration-150 px-3 py-2 rounded-full font-semibold border-2 ${currentPage === idx + 1
                                                ? 'bg-gradient-to-tr from-blue-600 to-blue-400 text-white border-blue-600 shadow-lg scale-105'
                                                : 'bg-white text-blue-700 border-transparent hover:border-blue-400 hover:bg-blue-50'}`}
                                              onClick={() => userPagination.setPage(userId, idx + 1)}
                                              aria-current={currentPage === idx + 1 ? 'page' : undefined}
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
                                            aria-label="Página siguiente"
                                          >
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline align-middle"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
}

export default Viaticos;
