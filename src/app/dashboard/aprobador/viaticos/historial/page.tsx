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
  const [selectedViatico, setSelectedViatico] = useState<Viatico | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
                <table className="min-w-[1050px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta destino</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((v) => (
                      <tr key={v.id} className="group hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{v.folio || v.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{v.nombre_solicitante || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{v.departamento}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">${v.monto?.toFixed?.(2) ?? v.monto}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{v.cuenta_destino || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{v.concepto || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800"><span className={v.estado === 'autorizada' ? 'text-green-600' : 'text-red-600'}>{v.estado}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-800">{v.fecha_revision || v.fecha_pago || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {(v as any).viatico_url ? (
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
                              onClick={() => { setSelectedViatico(v); setShowDetailModal(true); }}
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
              viatico={selectedViatico as any}
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}
