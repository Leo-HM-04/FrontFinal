'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Users, Plus, Trash2, Edit, ArrowLeft, Menu, LogOut, Eye } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { exportUsuariosToCSV } from '@/utils/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const {
    filters,
    filteredData: filteredUsuarios,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(usuarios, 'usuarios');

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedUsuarios,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredUsuarios, initialItemsPerPage: 10 });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const data = await UsuariosService.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (usuario: User) => {
    setSelectedUser(usuario);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);
    try {
      await UsuariosService.delete(selectedUser.id_usuario);
      setUsuarios(prev => prev.filter(u => u.id_usuario !== selectedUser.id_usuario));
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    exportUsuariosToCSV(filteredUsuarios);
    toast.success(`${filteredUsuarios.length} usuarios exportados`);
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      admin_general: 'Administrador',
      solicitante: 'Solicitante',
      aprobador: 'Aprobador',
      pagador_banca: 'Pagador'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              >
                <Menu className="w-5 h-5 mr-2" />
                Menú
              </Button>

              <h1 className="text-2xl font-bold text-white text-center flex-1 font-montserrat tracking-wide">
                PLATAFORMA DE PAGOS
              </h1>

              <div className="flex items-center space-x-4">
                <div className="text-white text-sm">
                  <span className="font-medium">{user?.nombre}</span>
                  <span className="block text-xs text-white/80">Administrador</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with Back Button */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/admin'}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-white font-montserrat">
                    Gestión de Usuarios
                  </h2>
                  <p className="text-white/80">
                    Total: {totalItems} usuarios
                  </p>
                </div>
              </div>
              
              <Button
                className="bg-white hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                style={{color: '#004AB7'}}
                onClick={() => window.location.href = '/dashboard/admin/usuarios/create'}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 mb-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onExport={handleExport}
              onReset={resetFilters}
              type="usuarios"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-montserrat">
                Lista de Usuarios
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white">Cargando usuarios...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead style={{backgroundColor: '#F0F4FC'}}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Registro
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsuarios.map((usuario) => (
                          <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {usuario.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white" style={{backgroundColor: '#004AB7'}}>
                                {getRoleLabel(usuario.rol)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                usuario.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {usuario.bloqueado ? 'Bloqueado' : 'Activo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(usuario.created_at).toLocaleDateString('es-CO')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/dashboard/admin/usuarios/${usuario.id_usuario}`}
                                style={{color: '#004AB7', borderColor: '#004AB7'}}
                                className="hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/dashboard/admin/usuarios/${usuario.id_usuario}/edit`}
                                style={{color: '#0057D9', borderColor: '#0057D9'}}
                                className="hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(usuario)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{backgroundColor: '#F0F4FC'}} className="px-6 py-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={goToPage}
                      onItemsPerPageChange={changeItemsPerPage}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Eliminar Usuario"
          message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
          itemName={selectedUser ? `${selectedUser.nombre} (${selectedUser.email})` : undefined}
          loading={deleting}
        />
      </div>
    </ProtectedRoute>
  );
}
