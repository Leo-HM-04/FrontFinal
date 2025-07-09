'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Lock, UserCheck, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { UsuariosService } from '@/services/usuarios.service';
import { User as UserType } from '@/types';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function EditUsuarioPage() {
    const params = useParams();
    const router = useRouter();
    const [usuario, setUsuario] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: '',
        password: '',
        bloqueado: false,
        activo: true
    });

    useEffect(() => {
        if (params.id) {
            fetchUsuario(params.id as string);
        }
    }, [params.id]);

    const fetchUsuario = async (id: string) => {
        try {
            const data = await UsuariosService.getById(parseInt(id));
            setUsuario(data);
            setFormData({
                nombre: data.nombre,
                email: data.email,
                rol: data.rol,
                password: '',
                bloqueado: !!data.bloqueado,
                activo: !!data.activo
            });
        } catch (error) {
            console.error('Error fetching usuario:', error);
            setError('Error al cargar los datos del usuario');
        } finally {
            setLoading(false);
        }
    };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!usuario) return;

  if (formData.password.trim() && formData.password.trim().length < 8) {
    toast.error('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  setSaving(true);
  try {
    const dataToUpdate: any = {
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      rol: formData.rol,
      bloqueado: formData.bloqueado,
      activo: formData.activo
    };

    if (formData.password.trim()) {
      dataToUpdate.password = formData.password.trim();
    }

    await UsuariosService.update(usuario.id_usuario, dataToUpdate);
    toast.success('Usuario actualizado exitosamente');

    setUsuario(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...dataToUpdate,
        creado_en: prev.creado_en
      };
    });

    setFormData(prev => ({ ...prev, password: '' }));
    router.push('/dashboard/admin/usuarios?updated=1'); // ✅ Solo redirige aquí si todo está bien
    router.refresh();
  } catch (error) {
    console.error('Error updating usuario:', error);
    toast.error('Error al actualizar el usuario');
  } finally {
    setSaving(false);
  }
};


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type, checked } = target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const getRoleLabel = (role: string) => {
        const roles = {
            admin_general: 'Administrador General',
            solicitante: 'Solicitante',
            aprobador: 'Aprobador',
            pagador_banca: 'Pagador'
        };
        return roles[role as keyof typeof roles] || role;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}>
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg">Cargando datos del usuario...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}>
                <div className="text-white text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <p className="text-lg">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4 text-white border-white/30 hover:bg-white/10"
                        onClick={() => router.push('/dashboard/admin/usuarios')}
                    >
                        Volver a la lista
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRoles={['admin_general']}>
            <AdminLayout>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/admin/usuarios/`)}
                                    className="text-white border-white/30 hover:bg-white/10"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Editar Usuario</h1>
                                    <p className="text-white/80">Modificar información del usuario: {usuario?.nombre}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Información del Usuario</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/70 text-sm">ID de Usuario</label>
                                        <p className="text-white font-medium">#{usuario?.id_usuario}</p>
                                    </div>

                                    <div>
                                        <label className="text-white/70 text-sm">Rol Actual</label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                            <span className="text-white font-medium">{getRoleLabel(usuario?.rol || '')}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-white/70 text-sm">Fecha de Creación</label>
                                        <p className="text-white">
                                            {usuario?.creado_en ? new Date(usuario.creado_en).toLocaleDateString('es-CO', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'No disponible'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
                                <h3 className="text-lg font-semibold text-white mb-6">Editar Información</h3>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                Nombre completo <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Ingrese el nombre completo"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                Correo electrónico <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="usuario@ejemplo.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                Rol del usuario <span className="text-red-400">*</span>
                                            </label>
                                            <select
                                                name="rol"
                                                value={formData.rol}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            >
                                                <option value="">Seleccionar rol</option>
                                                <option value="admin_general">Administrador General</option>
                                                <option value="solicitante">Solicitante</option>
                                                <option value="aprobador">Aprobador</option>
                                                <option value="pagador_banca">Pagador</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                <Lock className="w-4 h-4 inline mr-2" />
                                                Nueva contraseña
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Dejar vacío para mantener contraseña actual"
                                                minLength={8}
                                                autoComplete="new-password"
                                            />
                                            <p className="text-white/60 text-xs mt-1">
                                                Solo introduzca una contraseña si desea cambiarla (mínimo 8 caracteres)
                                            </p>
                                        </div>

                                        {/* Toggle de Bloqueado */}
                                        <div className="flex flex-col justify-center">
                                            <label className="block text-white font-medium mb-2">Bloqueado</label>
                                            <ToggleSwitch
                                                checked={!formData.bloqueado}
                                                onChange={() =>
                                                    setFormData(prev => ({ ...prev, bloqueado: !prev.bloqueado }))
                                                }
                                                size="lg"
                                                variant="success"
                                                labels={{
                                                    inactive: 'Bloqueado',
                                                    active: 'Activo'
                                                }}
                                                icons={{
                                                    active: <UserCheck className="w-full h-full" />,
                                                    inactive: <UserX className="w-full h-full" />
                                                }}
                                                description="Acceso al sistema"
                                            />
                                        </div>

                                       
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-white border-white/30 hover:bg-white/10 px-6"
                                            onClick={() => router.push(`/dashboard/admin/usuarios/`)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-white hover:bg-gray-50 font-semibold px-8 py-3 rounded-xl"
                                            style={{ color: '#3B82F6' }}
                                            
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Guardar Cambios
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
}
