"use client";

import { useEffect, useState } from 'react';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { Eye, CheckCircle2 } from 'lucide-react';


export default function PagadorRecurrentesPage() {
  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerAprobadasParaPagador();
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
          <h1 className="text-2xl font-bold text-blue-800 mb-6 text-white">Pagos Recurrentes</h1>
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-200">
            {loading ? (
              <div className="text-center py-8 text-blue-700">Cargando solicitudes recurrentes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-blue-200 rounded-xl overflow-hidden text-[15px]">
                  <thead className="sticky top-0 z-10 shadow bg-blue-700/95 backdrop-blur-md">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Departamento</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Cuenta Destino</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Tipo Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Frecuencia</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-white uppercase tracking-wider">Activa</th>
                      <th className="px-4 py-3 text-left text-xs font-extrabold text-white uppercase tracking-wider">Siguiente Fecha</th>
                      <th className="px-4 py-3 text-center text-xs font-extrabold text-white uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurrentes.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-blue-600 font-semibold">No hay pagos recurrentes aprobados.</td>
                      </tr>
                    ) : (
                      recurrentes.map((p, idx) => (
                        <tr
                          key={p.id_recurrente}
                          className={`transition-all duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 hover:shadow-md`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-base font-extrabold text-blue-900">#{p.id_recurrente}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-900">{p.nombre_usuario || `Usuario ${p.id_usuario}`}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-900">{p.departamento}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800">{Number(p.monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800">{p.cuenta_destino}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.concepto}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.tipo_pago}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900">{p.frecuencia}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${p.estado === 'aprobada' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                              {p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                            {p.activo ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 shadow-sm"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>Activo</span> : <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 shadow-sm"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>Inactivo</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-900 font-medium">{p.siguiente_fecha ? new Date(p.siguiente_fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium flex gap-2 justify-center">
                            <button className="text-blue-600 hover:text-blue-900 p-1 rounded-full transition-colors duration-150 group-hover:scale-110" title="Ver Detalle">
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              className="text-green-600 hover:text-green-800 p-1 rounded-full transition-colors duration-150 group-hover:scale-110"
                              title="Marcar como pagada"
                              onClick={async () => {
                                if (!window.confirm('¿Marcar esta recurrente como pagada?')) return;
                                try {
                                  await RecurrentesService.marcarComoPagada(p.id_recurrente);
                                  setRecurrentes((prev) => prev.filter((r) => r.id_recurrente !== p.id_recurrente));
                                } catch (err) {
                                  alert('Error al marcar como pagada');
                                }
                              }}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
