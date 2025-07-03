'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Users, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { usePagination } from '@/hooks/usePagination';
import { exportUsuariosToCSV } from '@/utils/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const { user } = useAuth();

  // Cache simple en sessionStorage
  const cacheKey = 'usuarios_cache';
  const CACHE_TTL = 10000; // 1 minuto

  // Memoizar estadísticas para evitar recálculos
  const stats = useMemo(() => {
    if (usuarios.length === 0) {
      return { 
        total: 0, 
        activos: 0, 
        admins: 0, 
        nuevos: 0, 
        roleCount: {
          admin_general: 0,
          solicitante: 0,
          aprobador: 0,
          pagador_banca: 0
        } 
      };
    }
    
    // Filtramos al admin actual para las estadísticas también
    const filteredUsers = user?.id_usuario 
      ? usuarios.filter(u => u.id_usuario !== parseInt(user.id_usuario.toString()))
      : usuarios;

    const total = filteredUsers.length;
    const activos = filteredUsers.filter(u => !u.bloqueado).length;
    const admins = filteredUsers.filter(u => u.rol === 'admin_general').length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const nuevos = filteredUsers.filter(u => new Date(u.creado_en) > weekAgo).length;
    
    const roleCount = {
      admin_general: filteredUsers.filter(u => u.rol === 'admin_general').length,
      solicitante: filteredUsers.filter(u => u.rol === 'solicitante').length,
      aprobador: filteredUsers.filter(u => u.rol === 'aprobador').length,
      pagador_banca: filteredUsers.filter(u => u.rol === 'pagador_banca').length
    };

    return { total, activos, admins, nuevos, roleCount };
  }, [usuarios, user?.id_usuario]);

  // Memoizar filtro por rol y filtrar el admin actual
  const filteredByRole = useMemo(() => {
    // Primero filtramos al usuario actual (administrador)
    const filteredUsers = user?.id_usuario 
      ? usuarios.filter(u => u.id_usuario !== parseInt(user.id_usuario.toString()))
      : usuarios;
    
    // Luego aplicamos el filtro por rol si existe
    return roleFilter 
      ? filteredUsers.filter(u => u.rol === roleFilter)
      : filteredUsers;
  }, [usuarios, roleFilter, user?.id_usuario]);

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedUsuarios,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredByRole, initialItemsPerPage: 5 });

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      
      // Intentar cargar del cache
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setUsuarios(data);
          setLoading(false);
          return;
        }
      }

      const data = await UsuariosService.getAll();
      const sortedData = data.sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
      
      // Guardar en cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: sortedData,
        timestamp: Date.now()
      }));
      
      setUsuarios(sortedData);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleDelete = useCallback((usuario: User) => {
    setSelectedUser(usuario);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedUser) return;

    setDeleting(true);
    try {
      await UsuariosService.delete(selectedUser.id_usuario);
      setUsuarios(prev => prev.filter(u => u.id_usuario !== selectedUser.id_usuario));
      // Limpiar cache después de eliminar
      sessionStorage.removeItem(cacheKey);
      toast.success('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setDeleting(false);
    }
  }, [selectedUser]);

  const handleExport = useCallback(() => {
    exportUsuariosToCSV(filteredByRole);
    toast.success(`${filteredByRole.length} usuarios exportados`);
  }, [filteredByRole]);

  const getRoleLabel = useCallback((role: string) => {
    const roles = {
      solicitante: 'Solicitante',
      aprobador: 'Aprobador',
      pagador_banca: 'Pagador'
    };
    return roles[role as keyof typeof roles] || role;
  }, []);

  const handleRoleFilterChange = useCallback((role: string) => {
    setRoleFilter(role);
  }, []);

  const clearRoleFilter = useCallback(() => {
    setRoleFilter('');
  }, []);

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards optimizadas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Total Usuarios</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Header with Back Button */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-white font-montserrat">
                    Gestión de Usuarios
                  </h2>
                  <p className="text-white/80">
                    Administra usuarios, roles y permisos del sistema
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  className="bg-white hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                  style={{color: '#3B82F6'}}
                  onClick={() => router.push('/dashboard/admin/usuarios/create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros simplificados */}
          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Filtrar por Rol</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearRoleFilter}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === '' 
                      ? 'bg-blue-400 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos ({stats.total})
                </button>
                <button
                  onClick={() => handleRoleFilterChange('solicitante')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'solicitante' 
                      ? 'bg-blue-400 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Solicitantes ({stats.roleCount.solicitante || 0})
                </button>
                <button
                  onClick={() => handleRoleFilterChange('aprobador')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'aprobador' 
                      ? 'bg-blue-400 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aprobadores ({stats.roleCount.aprobador || 0})
                </button>
                <button
                  onClick={() => handleRoleFilterChange('pagador_banca')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'pagador_banca' 
                      ? 'bg-blue-400 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pagadores ({stats.roleCount.pagador_banca || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white font-montserrat">
                  Lista de Usuarios
                  {roleFilter && (
                    <span className="ml-2 text-sm font-normal text-white/80">
                      - Filtrado por: {getRoleLabel(roleFilter)}
                    </span>
                  )}
                </h3>
                {roleFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRoleFilter}
                    className="text-white border-white hover:bg-white/10"
                  >
                    Limpiar filtro
                  </Button>
                )}
              </div>
              
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Fecha de creación
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Bloqueado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsuarios.map((usuario) => (
                          <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {usuario.id_usuario}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{usuario.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white" style={{backgroundColor: '#3B82F6'}}>
                                {getRoleLabel(usuario.rol)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                usuario.bloqueado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {usuario.bloqueado ? 'Inactivo' : 'Activo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">
                                {usuario.creado_en ? new Date(usuario.creado_en).toLocaleDateString('es-CO') : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                usuario.bloqueado ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                              }`}>
                                {usuario.bloqueado ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/admin/usuarios/${usuario.id_usuario}/edit`)}
                                className="text-blue-600 hover:bg-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(usuario)}
                                className="text-red-600 hover:bg-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    <div
                      style={{ backgroundColor: '#F0F4FC', color: 'black' }}
                      className="px-6 py-4"
                    >
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
      </AdminLayout>
    </ProtectedRoute>
  );
}