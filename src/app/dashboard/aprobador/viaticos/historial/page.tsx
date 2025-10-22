"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';

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
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Historial de viáticos (Aprobador)</h1>
          {loading && <p>Cargando...</p>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && data.length === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-300 p-4 rounded">No hay viáticos aprobados o rechazados por ti.</div>
          )}
          {!loading && !error && data.length > 0 && (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Folio / ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Solicitante</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Departamento</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Monto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cuenta destino</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Concepto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Comentario</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.folio || v.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.nombre_solicitante || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.departamento}</td>
                      <td className="px-4 py-2 text-sm text-gray-800 text-right">${v.monto?.toFixed?.(2) ?? v.monto}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.cuenta_destino || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.concepto || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800"><span className={v.estado === 'autorizada' ? 'text-green-600' : 'text-red-600'}>{v.estado}</span></td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.fecha_revision || v.fecha_pago || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{v.comentario_aprobador || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AprobadorLayout>
    </ProtectedRoute>
  );
}
