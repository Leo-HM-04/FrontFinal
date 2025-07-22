'use client';

import { useState, useEffect } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { ConfirmDeleteSoli } from '@/components/common/ConfirmDeleteSoli';
import { Eye, Trash2 } from 'lucide-react';
import { RecurrenteViewModal } from '@/components/modals/RecurrenteViewModal';
import { RecurrentesService } from '@/services/recurrentes.service';
import { PlantillaRecurrente } from '@/types';
import { toast } from 'react-hot-toast';

export default function AdminRecurrentesPage() {

  const [recurrentes, setRecurrentes] = useState<PlantillaRecurrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecurrente, setSelectedRecurrente] = useState<PlantillaRecurrente | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRecurrente, setViewRecurrente] = useState<PlantillaRecurrente | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchRecurrentes = async () => {
      try {
        const data = await RecurrentesService.obtenerTodas();
        // Ordena por ID descendente (más alto primero)
        const sorted = [...data].sort((a, b) => b.id_recurrente - a.id_recurrente);
        setRecurrentes(sorted);
      } catch {
        toast.error('Error al cargar plantillas recurrentes');
      } finally {
        setLoading(false);
      }
    };
    fetchRecurrentes();
  }, []);


  // FILTROS AVANZADOS
  const {
    filters,
    filteredData: filteredRecurrentes,
    resetFilters,
    updateFilters
  } = useAdvancedFilters<PlantillaRecurrente>(recurrentes, 'recurrentes');

  const totalPages = Math.ceil(filteredRecurrentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRecurrentes.length);
  const currentRecurrentes = filteredRecurrentes.slice(startIndex, endIndex);

  const handleDelete = (rec: PlantillaRecurrente) => {
    setSelectedRecurrente(rec);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecurrente) return;
    setDeleting(true);
    try {
      await RecurrentesService.eliminar(selectedRecurrente.id_recurrente);
      setRecurrentes(prev => prev.filter(r => r.id_recurrente !== selectedRecurrente.id_recurrente));
      toast.success('Plantilla eliminada exitosamente');
      setShowDeleteModal(false);
      setSelectedRecurrente(null);
    } catch {
      toast.error('Error al eliminar la plantilla');
    } finally {
      setDeleting(false);
    }
  };


  // Capitaliza la primera letra
  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

  // Formatea monto como moneda
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
  };

  // Formatea fecha legible
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Badge color para estado
  const getEstadoColor = (estado: string) => {
    switch ((estado || '').toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'aprobada': return 'bg-green-100 text-green-800 border-green-300';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  // Badge color para activa
  const getActivaColor = (activo: boolean) => activo
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-red-100 text-red-800 border-red-300';

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">Gestión de Recurrentes</h2>
                <p className="text-white/80">Total: {recurrentes.length} plantillas</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white font-montserrat mb-6">Lista de Recurrentes</h3>
              <AdvancedFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                type="recurrentes"
              />
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Cargando plantillas...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <thead className="sticky top-0 z-10" style={{backgroundColor: '#F0F4FC'}}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Folio</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Usuario</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Departamento</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Monto</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Cuenta Destino</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Concepto</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Tipo Pago</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Frecuencia</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Estado</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Activa</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Siguiente Fecha</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {currentRecurrentes.map((p) => (
                          <tr key={p.id_recurrente} className="group transition-all hover:bg-blue-50/80 hover:shadow-md">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">#{p.id_recurrente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.folio || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.nombre_usuario || `Usuario ${p.id_usuario}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{capitalize(p.departamento)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(p.monto)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.cuenta_destino}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.concepto}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{capitalize(p.tipo_pago)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{capitalize(p.frecuencia)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(p.estado)}`}>{capitalize(p.estado)}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getActivaColor(!!p.activo)}`}>{p.activo ? 'Activo' : 'Inactivo'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(p.siguiente_fecha)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { setViewRecurrente(p); setShowViewModal(true); }}
                                className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-900 hover:text-blue-900 transition"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(p)}
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-red-900 transition"
                                title="Eliminar plantilla"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ backgroundColor: '#F0F4FC', color: 'black' }} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-b-2xl border-t border-blue-100 animate-fade-in">
                    <span>Mostrando <span className="font-bold text-blue-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredRecurrentes.length)}</span> - <span className="font-bold text-blue-900">{Math.min(currentPage * itemsPerPage, filteredRecurrentes.length)}</span> de <span className="font-bold text-blue-900">{filteredRecurrentes.length}</span></span>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredRecurrentes.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <RecurrenteViewModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            recurrente={viewRecurrente}
          />

          <ConfirmDeleteSoli
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            title="Eliminar Plantilla"
            message="¿Estás seguro de que deseas eliminar esta plantilla recurrente? Esta acción no se puede deshacer."
            itemName={selectedRecurrente ? `Plantilla #${selectedRecurrente.id_recurrente} - ${selectedRecurrente.departamento}` : undefined}
            loading={deleting}
          />
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
