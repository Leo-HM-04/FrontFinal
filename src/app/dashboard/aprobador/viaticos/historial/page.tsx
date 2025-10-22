"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { FaFilePdf } from 'react-icons/fa';
import { Eye } from 'lucide-react';
import { ViaticoDetailModal } from '@/components/viaticos/ViaticoDetailModal';

type Viatico = {
  id: number;
  folio?: string | null;
  monto: number;
  departamento: string;
  cuenta_destino?: string | null;
  concepto?: string | null;
  estado: string;
  fecha_revision?: string | null;
  fecha_pago?: string | null;
  comentario_aprobador?: string | null;
  nombre_solicitante?: string | null;
};

export default function HistorialAprobadorPage() {
  const [data, setData] = useState<Viatico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedViatico, setSelectedViatico] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Obtiene detalle completo del viático antes de abrir el modal.
  const handleOpenDetail = async (v: any) => {
    const mapped = mapToViatico(v);
    try {
      // Intentar obtener el detalle completo desde el endpoint de viáticos
      const res = await api.get(`/viaticos/${mapped.id_viatico}`);
      // merge: la respuesta del detalle debe tener campos completos (viatico_url, cuenta_destino, etc.)
      setSelectedViatico({ ...mapped, ...(res.data || {}) });
    } catch (err) {
      // En caso de error, usar los datos mapeados (fallback)
      console.warn('No se pudo cargar detalle completo, usando datos listados', err);
      setSelectedViatico(mapped);
    } finally {
      setShowDetailModal(true);
    }
  };

  // Normaliza un objeto recibido desde la API a la forma que espera ViaticoDetailModal
  const mapToViatico = (v: any): any => {
    if (!v) return null;
    return {
      id_viatico: (v.id_viatico ?? v.id ?? v.id_solicitud) || 0,
      folio: v.folio ?? '',
      monto: Number(v.monto) || 0,
      departamento: v.departamento ?? '',
      cuenta_destino: v.cuenta_destino ?? v.cuenta ?? '',
      concepto: v.concepto ?? '',
      estado: v.estado ?? '',
      fecha_revision: v.fecha_revision ?? v.fecha_limite_pago ?? v.fecha_pago ?? '',
      fecha_pago: v.fecha_pago ?? null,
      comentario_aprobador: v.comentario_aprobador ?? '',
      nombre_persona: v.nombre_solicitante ?? v.nombre_persona ?? '',
      viatico_url: (v.viatico_url ?? v.soporte_url ?? v.archivo_url) || '',
      tipo_pago: v.tipo_pago ?? 'viaticos',
      tipo_cuenta_destino: v.tipo_cuenta_destino ?? v.tipo_cuenta ?? undefined,
      tipo_tarjeta: v.tipo_tarjeta ?? undefined,
      banco_destino: v.banco_destino ?? undefined,
      // preserve any extra fields
      ...v
    };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/viaticos/historial/aprobador');
        if (!mounted) return;
        setData(res.data || []);
      } catch (err: any) {
        console.error('Error cargando historial aprobador', err);
        setError(err?.response?.data?.error || err.message || 'Error al cargar datos');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <ProtectedRoute requiredRoles={["aprobador"]}>
      <AprobadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-4 mb-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Historial de Viáticos</h1>
                <p className="text-blue-100 text-sm">Lista de viáticos que has aprobado o rechazado.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 lg:flex-shrink-0">
                <p className="text-white/90 text-sm font-medium">
                  Total: <span className="text-white font-semibold">{data.length}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                <p className="text-sm text-blue-100">Aprobadas</p>
                <p className="text-white font-semibold text-lg">{data.filter(d => d.estado === 'autorizada').length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                <p className="text-sm text-blue-100">Rechazadas</p>
                <p className="text-white font-semibold text-lg">{data.filter(d => d.estado === 'rechazada').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">Cargando...</div>
              ) : error ? (
                <div className="p-6 text-red-600">{error}</div>
              ) : data.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No hay viáticos aprobados o rechazados por ti.</div>
              ) : (
                <table className="w-full table-auto border-collapse text-sm md:text-base">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-black">Folio </th>
                      <th className="px-6 py-4 text-left text-black">Solicitante</th>
                      <th className="px-6 py-4 text-left text-black">Departamento</th>
                      <th className="px-6 py-4 text-right text-black">Monto</th>
                      <th className="px-6 py-4 text-left text-black">Cuenta destino</th>
                      <th className="px-6 py-4 text-left text-black">Concepto</th>
                      <th className="px-6 py-4 text-left text-black">Estado</th>
                      <th className="px-6 py-4 text-left text-black">Fecha</th>
                      <th className="px-6 py-4 text-center text-black">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((v) => (
                      <tr key={v.id} className="group hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-black">{v.folio || v.id}</td>
                        <td className="px-6 py-4 text-sm text-black">{v.nombre_solicitante || '-'}</td>
                        <td className="px-6 py-4 text-sm text-black">{v.departamento}</td>
                        <td className="px-6 py-4 text-sm text-black text-right">${v.monto?.toFixed?.(2) ?? v.monto}</td>
                        <td className="px-6 py-4 text-sm text-black">{v.cuenta_destino || '-'}</td>
                        <td className="px-6 py-4 text-sm text-black">{v.concepto || '-'}</td>
                        <td className="px-6 py-4 text-sm text-black"><span className={v.estado === 'autorizada' ? 'text-green-600' : 'text-red-600'}>{v.estado}</span></td>
                        <td className="px-6 py-4 text-sm text-black">{v.fecha_revision || v.fecha_pago || '-'}</td>
                        <td className="px-6 py-4 text-sm text-black text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/** PDF link (if available) and view detail button, matching viáticos actions */}
                            { (v as any).viatico_url ? (
                              <a
                                href={`/uploads/viaticos/${(v as any).viatico_url.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                              >
                                <FaFilePdf className="text-red-500" />
                                <span>Ver PDF</span>
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">Sin archivo</span>
                            )}

                            <button
                              onClick={() => { handleOpenDetail(v); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-green-700 hover:text-green-800 hover:bg-green-50 transition-colors"
                              title="Ver detalles del viático"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver Detalle</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {selectedViatico && (
            <ViaticoDetailModal
              viatico={selectedViatico}
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}
