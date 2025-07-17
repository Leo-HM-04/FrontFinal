"use client";

import { useEffect, useState } from 'react';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { Eye } from 'lucide-react';


export default function PagadorRecurrentesPage() {
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerTodas();
        setRecurrentes(data);
      } catch {
        setRecurrentes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecurrentes();
  }, []);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-blue-800 mb-6">Pagos Recurrentes</h1>
          <div className="bg-white rounded-2xl shadow p-6 border border-blue-100">
            {loading ? (
              <div className="text-center py-8 text-blue-700">Cargando solicitudes recurrentes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frecuencia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Activa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siguiente Fecha</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recurrentes.map((p) => (
                      <tr key={p.id_recurrente} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{p.id_recurrente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.nombre_usuario || `Usuario ${p.id_usuario}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.departamento}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(p.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.cuenta_destino}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.concepto}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.tipo_pago}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.frecuencia}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.estado}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          {p.activo ? <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">Activo</span> : <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Inactivo</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.siguiente_fecha ? new Date(p.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded-full" title="Ver Detalle">
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
