'use client';

export const dynamic = 'force-dynamic';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Users, Plus, Trash2, Edit, User as UserIcon, Ban, CheckCircle2, UserCheck, UserPlus } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { Suspense } from 'react'; 
import { exportUsuariosPDF, exportUsuariosExcel, exportUsuariosCSV } from '@/utils/exportUsuarios';
import { FileDown } from 'lucide-react';

// Skeleton loader para la tabla
function TableSkeleton({ rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 7 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}


function UsuariosContent() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [exportRange, setExportRange] = useState('total');
  const { user } = useAuth();

  // Función auxiliar para exportar
  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv', range: string) => {
    try {
      switch (format) {
        case 'pdf':
          exportUsuariosPDF(usuarios, range);
          break;
        case 'excel':
          exportUsuariosExcel(usuarios, range);
          break;
        case 'csv':
          exportUsuariosCSV(usuarios, range);
          break;
      }
      toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el reporte');
    }
  }, [usuarios]);

  // Cache simple en sessionStorage con versioning
  const CACHE_VERSION = '1.0';
  const cacheKey = `usuarios_cache_${CACHE_VERSION}`;
  const CACHE_TTL = 60000; // 1 minuto
  
  // Función para validar cache - implementada directamente en fetchUsuarios para evitar variables no utilizadas
  // Esta función se eliminó como variable separada y se integró donde se necesita

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


  // Estado y lógica para búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByRole;
    const q = searchQuery.trim().toLowerCase();
    return filteredByRole.filter(u =>
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [filteredByRole, searchQuery]);

  // Actualiza paginación para búsqueda
  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: paginatedUsuarios,
    goToPage,
  } = usePagination({ data: filteredBySearch, initialItemsPerPage: 5 });

  const searchParams = useSearchParams();
  const updatedFlag = searchParams.get('updated'); // también puedes usar 'created' o 'deleted' luego

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      // Si se detecta que se vino desde edición/creación/eliminación
      if (updatedFlag === '1') {
        sessionStorage.removeItem(cacheKey); // limpia cache
        router.replace('/dashboard/admin/usuarios'); // limpia el query param
      }

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

      // Cargar desde backend si no hay cache válido
      const data = await UsuariosService.getAll();
      const sortedData = data.sort(
        (a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      );

      // Guardar en cache con versioning y validación
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: sortedData,
          timestamp: Date.now(),
          version: CACHE_VERSION
        }));
      } catch (error) {
        console.warn('Error al guardar en cache:', error);
        // Limpiar cache si hay error al guardar
        sessionStorage.removeItem(cacheKey);
      }

      setUsuarios(sortedData);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [updatedFlag, router, cacheKey]);

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
  }, [selectedUser, cacheKey]);

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
    // Reset página al cambiar filtro
    goToPage(1);
  }, [goToPage]);

  const clearRoleFilter = useCallback(() => {
    setRoleFilter('');
    // Reset página al limpiar filtro
    goToPage(1);
  }, [goToPage]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
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
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 flex items-center gap-2">
                <select 
                  className="text-sm rounded-lg border-gray-300 bg-white/80 text-gray-700 px-2 py-1"
                  value={exportRange}
                  onChange={(e) => setExportRange(e.target.value)}
                >
                  <option value="total">Todo el historial</option>
                  <option value="dia">Último día</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                  <option value="año">Último año</option>
                </select>
                
                <Button
                  onClick={() => handleExport('pdf', exportRange)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </Button>
                
                <Button
                  onClick={() => handleExport('excel', exportRange)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-1" /> Excel
                </Button>
                
                <Button
                  onClick={() => handleExport('csv', exportRange)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <FileDown className="w-4 h-4 mr-1" /> CSV
                </Button>
              </div>

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
        {/* Tarjetas de estadísticas visuales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl p-4 shadow flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">Total Usuarios</p>
              <p className="text-2xl font-bold text-white animate-fade-in">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-white/80" />
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-xl p-4 shadow flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">Nuevos (7d)</p>
              <p className="text-2xl font-bold text-white animate-fade-in">{stats.nuevos}</p>
            </div>
            <UserPlus className="w-8 h-8 text-white/80" />
          </div>
        </div>
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-700 font-semibold mr-2">Filtrar por Rol:</span>
            <button
              onClick={clearRoleFilter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${roleFilter === '' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => handleRoleFilterChange('solicitante')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${roleFilter === 'solicitante' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
            >
              Solicitantes ({stats.roleCount.solicitante || 0})
            </button>
            <button
              onClick={() => handleRoleFilterChange('aprobador')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${roleFilter === 'aprobador' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
            >
              Aprobadores ({stats.roleCount.aprobador || 0})
            </button>
            <button
              onClick={() => handleRoleFilterChange('pagador_banca')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${roleFilter === 'pagador_banca' ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
            >
              Pagadores ({stats.roleCount.pagador_banca || 0})
            </button>
          </div>
          {/* Búsqueda */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
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
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <thead className="sticky top-0 z-10" style={{backgroundColor: '#F0F4FC'}}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Fecha de creación</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Bloqueado</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200">Acciones</th>
                    </tr>
                  </thead>
                  {loading ? (
                    <TableSkeleton rows={5} />
                  ) : (
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedUsuarios.map((usuario) => (
                        <tr key={usuario.id_usuario} className="group transition-all hover:bg-blue-50/80 hover:shadow-md">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{usuario.id_usuario}</td>
                          <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{usuario.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border shadow-sm
                                ${usuario.rol === 'solicitante' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                                ${usuario.rol === 'aprobador' ? 'bg-purple-100 text-purple-700 border-purple-300' : ''}
                                ${usuario.rol === 'pagador_banca' ? 'bg-green-100 text-green-700 border-green-300' : ''}
                                ${usuario.rol === 'admin_general' ? 'bg-gray-200 text-gray-700 border-gray-300' : ''}
                              `}
                              style={{ minWidth: 110, justifyContent: 'center' }}
                            >
                              {usuario.rol === 'solicitante' && <UserIcon className="w-4 h-4" />}
                              {usuario.rol === 'aprobador' && <UserCheck className="w-4 h-4" />}
                              {usuario.rol === 'pagador_banca' && <UserPlus className="w-4 h-4" />}
                              {usuario.rol === 'admin_general' && <Users className="w-4 h-4" />}
                              {getRoleLabel(usuario.rol)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {usuario.creado_en ? new Date(usuario.creado_en).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border shadow-sm ${usuario.bloqueado ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'}`}> 
                              {usuario.bloqueado ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} 
                              {usuario.bloqueado ? 'Sí' : 'No'} 
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border shadow-sm ${usuario.activo ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}> 
                              {usuario.activo ? <UserCheck className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />} 
                              {usuario.activo ? 'Activo' : 'Desconectado'} 
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/admin/usuarios/${usuario.id_usuario}/edit`)}
                              className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-900 hover:text-blue-900 transition"
                              title="Editar usuario"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(usuario)}
                              className="rounded-full border-red-200 text-red-600 hover:bg-red-600 hover:text-red-900 transition"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
              <div style={{ backgroundColor: '#F0F4FC', color: 'black' }} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-b-2xl border-t border-blue-100 animate-fade-in">
                {/* Paginador profesional fijo a 8 por página */}
                <div className="flex items-center gap-2 mx-auto md:mx-0 bg-white/40 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg border border-blue-100">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg border-2 transition-all duration-200 shadow-md focus:ring-2 focus:ring-blue-400
                      ${currentPage === 1 ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'}`}
                    aria-label="Anterior"
                  >
                    &#8592;
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToPage(idx + 1)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-base border-2 transition-all duration-200 mx-0.5 focus:ring-2 focus:ring-blue-400
                          ${currentPage === idx + 1 ? 'bg-gradient-to-br from-blue-600 to-blue-400 text-white border-blue-600 scale-110 shadow-xl' : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'}`}
                        aria-current={currentPage === idx + 1 ? 'page' : undefined}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-lg border-2 transition-all duration-200 shadow-md focus:ring-2 focus:ring-blue-400
                      ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'}`}
                    aria-label="Siguiente"
                  >
                    &#8594;
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 justify-center md:justify-end">
                  <span>Mostrando <span className="font-bold text-blue-900">{Math.min((currentPage - 1) * 5 + 1, totalItems)}</span> - <span className="font-bold text-blue-900">{Math.min(currentPage * 5, totalItems)}</span> de <span className="font-bold text-blue-900">{totalItems}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white/90 border-2 border-blue-600 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in-up">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 border-4 border-blue-600 rounded-full p-3 mb-4 animate-pulse">
                  <Trash2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-blue-700 mb-2 font-montserrat">Eliminar Usuario</h2>
                <p className="text-gray-700 mb-2 font-medium">¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
                {selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 font-semibold mb-4">
                    {selectedUser.nombre} <span className="text-gray-500">({selectedUser.email})</span>
                  </div>
                )}
                <div className="flex gap-4 mt-4 w-full justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-900 font-bold px-6 py-2 rounded-xl transition-all"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl shadow-xl transition-all border-0"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Eliminando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function UsuariosPage() {
  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <Suspense>
          <UsuariosContent />
        </Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
}