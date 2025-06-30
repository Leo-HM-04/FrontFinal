'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
        password: ''
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
            password: ''
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

        setSaving(true);
        try {
        const dataToUpdate = {
            nombre: formData.nombre,
            email: formData.email,
            rol: formData.rol,
            ...(formData.password ? { password: formData.password } : {})
        };
        
        await UsuariosService.update(usuario.id_usuario, dataToUpdate);
        toast.success('Usuario actualizado exitosamente');
        router.push(`/dashboard/admin/usuarios/${usuario.id_usuario}`);
        } catch (error) {
        console.error('Error updating usuario:', error);
        toast.error('Error al actualizar el usuario');
        } finally {
        setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
            <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Cargando datos del usuario...</p>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
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
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                    <div className="flex items-center space-x-4">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/admin/usuarios/${params.id}`)}
                        className="text-white border-white/30 hover:bg-white/10"
                        >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                        </Button>
                        <div>
                        <h1 className="text-2xl font-bold text-white">Editar Usuario</h1>
                        <p className="text-white/80">Modificar información del usuario</p>
                        </div>
                    </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                            Nombre completo
                            </label>
                            <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ingrese el nombre completo"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                            Correo electrónico
                            </label>
                            <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ingrese el correo electrónico"
                            />
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                            <Lock className="w-4 h-4 inline mr-2" />
                            Contraseña (dejar vacío para no cambiar)
                            </label>
                            <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nueva contraseña (opcional)"
                            />
                            <p className="text-white/60 text-xs mt-1">Solo introduzca una contraseña si desea cambiarla</p>
                        </div>

                        {/* Rol */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                            Rol
                            </label>
                            <select
                            name="rol"
                            value={formData.rol}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                            <option value="">Seleccionar rol</option>
                            <option value="admin_general">Administrador General</option>
                            <option value="solicitante">Solicitante</option>
                            <option value="aprobador">Aprobador</option>
                            <option value="pagador_banca">Pagador</option>
                            </select>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                            Contraseña
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                            <Lock className="w-5 h-5 text-gray-400 ml-3" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-500"
                                placeholder="Ingrese una nueva contraseña (opcional)"
                            />
                            </div>
                        </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                        <Button
                            type="button"
                            variant="outline"
                            className="text-white border-white/30 hover:bg-white/10"
                            onClick={() => router.push(`/dashboard/admin/usuarios/${params.id}`)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-white hover:bg-gray-50 font-semibold px-8 py-3 rounded-xl"
                            style={{color: '#3B82F6'}}
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
            </AdminLayout>
        </ProtectedRoute>
    );
}