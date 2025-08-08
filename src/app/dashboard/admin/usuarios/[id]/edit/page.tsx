'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, AlertCircle, Lock, UserCheck, UserX, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { UsuariosService } from '@/services/usuarios.service';
import { User as UserType } from '@/types';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function EditUsuarioPage() {
    const [showPassword, setShowPassword] = useState(false);
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
    const [emailTouched, setEmailTouched] = useState(false);
    const isEmailValid = /@(bechapra\.com|bechapra\.com\.mx)$/i.test(formData.email.trim());

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

  if (!/@(bechapra\.com|bechapra\.com\.mx)$/i.test(formData.email.trim())) {
    toast.error('El correo debe ser @bechapra.com o @bechapra.com.mx');
    return;
  }

  if (formData.password.trim() && formData.password.trim().length < 8) {
    toast.error('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  setSaving(true);
  try {
    const dataToUpdate: Record<string, unknown> = {
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
        if (name === 'email') setEmailTouched(true);
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
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute requiredRoles={['admin_general']}>
            <AdminLayout>
                <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 md:py-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-white/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-white">Editar Usuario</h1>
                                    <p className="text-white/80 text-sm sm:text-base">Modificar información del usuario: {usuario?.nombre}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8 bg-white/5 rounded-3xl shadow-2xl border border-white/20 p-2 sm:p-4 md:p-8">
                        <div className="lg:col-span-1 flex mb-4 lg:mb-0">
                            <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-4 sm:p-8 shadow-2xl text-white flex flex-col items-center w-full animate-fade-in border border-white/30 relative overflow-hidden" style={{boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)'}}>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 to-blue-400/40 rounded-3xl pointer-events-none" />
                                <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-blue-600 flex items-center justify-center mb-4 shadow-2xl border-4 border-white/30">
                                    <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-white/90 drop-shadow-lg" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-extrabold mb-2 tracking-tight drop-shadow relative z-10">Resumen Usuario</h3>
                                <div className="text-white/90 text-center mb-2 truncate w-full max-w-[220px] text-base sm:text-lg font-semibold relative z-10">{usuario?.nombre || 'Nombre completo'}</div>
                                <div className="text-white/70 text-center text-xs sm:text-sm mb-2 truncate w-full max-w-[220px] relative z-10">{usuario?.email || 'Correo electrónico'}</div>
                                <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold mt-2 shadow border-2 transition-all max-w-full truncate relative z-10
                                    ${usuario?.rol === 'solicitante' ? 'bg-blue-600 text-white border-blue-600' : ''}
                                    ${usuario?.rol === 'aprobador' ? 'bg-orange-500 text-white border-orange-500' : ''}
                                    ${usuario?.rol === 'pagador_banca' ? 'bg-green-600 text-white border-green-600' : ''}
                                    ${usuario?.rol === 'admin_general' ? 'bg-gray-700 text-white border-gray-700' : ''}
                                `}>
                                    {usuario?.rol === 'solicitante' && <UserCheck className="w-5 h-5" />}
                                    {usuario?.rol === 'aprobador' && <Shield className="w-5 h-5" />}
                                    {usuario?.rol === 'pagador_banca' && <UserX className="w-5 h-5" />}
                                    {usuario?.rol === 'admin_general' && <Shield className="w-5 h-5" />}
                                    <span className="truncate">{getRoleLabel(usuario?.rol || '')}</span>
                                </div>
                                <div className="mt-6 sm:mt-8 w-full border-t border-white/20 pt-4 relative z-10">
                                    <label className="text-white/70 text-xs font-semibold uppercase tracking-wider">ID de Usuario</label>
                                    <p className="text-white font-bold text-base sm:text-lg">#{usuario?.id_usuario}</p>
                                </div>
                                <div className="mt-2 w-full relative z-10">
                                    <label className="text-white/70 text-xs font-semibold uppercase tracking-wider">Fecha de Creación</label>
                                    <p className="text-white font-medium text-xs sm:text-base">
                                        {usuario?.creado_en ? new Date(usuario.creado_en).toLocaleDateString('es-CO', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-4 sm:p-8 shadow-xl">
                                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Editar Información</h3>
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                                                className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/90 text-black focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder:text-gray-400 shadow-sm backdrop-blur-md"
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
                                                onBlur={() => setEmailTouched(true)}
                                                required
                                                className={`w-full px-4 py-3 rounded-xl border bg-white/90 text-black focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder:text-gray-400 shadow-sm backdrop-blur-md
                                                    ${emailTouched && !isEmailValid ? 'border-red-500 ring-2 ring-red-400' : 'border-white/30'}`}
                                                placeholder="usuario@bechapra.com"
                                            />
                                            {emailTouched && !isEmailValid && (
                                                <p className="text-red-500 text-xs mt-1 font-semibold animate-fade-in">
                                                    El correo debe ser @bechapra.com o @bechapra.com.mx
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                Rol del usuario <span className="text-red-400">*</span>
                                            </label>
                                            <div className="flex flex-col gap-3 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, rol: 'solicitante' }))}
                                                    className={`w-full px-4 py-3 rounded-xl text-base font-bold border-2 transition-all flex items-center gap-2 shadow-sm
                                                        ${formData.rol === 'solicitante' 
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}
                                                    `}
                                                    title="Solicitante: Puede crear solicitudes de pago."
                                                >
                                                    <UserCheck className={`w-6 h-6 ${formData.rol === 'solicitante' ? 'text-white' : 'text-blue-600'}`} />
                                                    <span>Solicitante</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, rol: 'aprobador' }))}
                                                    className={`w-full px-4 py-3 rounded-xl text-base font-bold border-2 transition-all flex items-center gap-2 shadow-sm
                                                        ${formData.rol === 'aprobador' 
                                                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg' 
                                                            : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50'}
                                                    `}
                                                    title="Aprobador: Puede aprobar o rechazar solicitudes."
                                                >
                                                    <Shield className={`w-6 h-6 ${formData.rol === 'aprobador' ? 'text-white' : 'text-orange-500'}`} />
                                                    <span>Aprobador</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, rol: 'pagador_banca' }))}
                                                    className={`w-full px-4 py-3 rounded-xl text-base font-bold border-2 transition-all flex items-center gap-2 shadow-sm
                                                        ${formData.rol === 'pagador_banca' 
                                                            ? 'bg-green-600 text-white border-green-600 shadow-lg' 
                                                            : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}
                                                    `}
                                                    title="Pagador: Puede ejecutar pagos aprobados."
                                                >
                                                    <UserX className={`w-6 h-6 ${formData.rol === 'pagador_banca' ? 'text-white' : 'text-green-600'}`} />
                                                    <span>Pagador</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-white font-medium mb-2">
                                                <Lock className="w-4 h-4 inline mr-2" />
                                                Nueva contraseña
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/90 text-black focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all placeholder:text-gray-400 shadow-sm backdrop-blur-md pr-12"
                                                    placeholder="Dejar vacío para mantener contraseña actual"
                                                    minLength={8}
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    tabIndex={-1}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                                                    onClick={() => setShowPassword((v) => !v)}
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <p className="text-white/60 text-xs mt-1">
                                                Solo introduzca una contraseña si desea cambiarla (mínimo 8 caracteres)
                                            </p>
                                        </div>
                                        {/* Toggle de Bloqueado con descripción en negro */}
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
                                                description={<span style={{color: '#111'}} className="font-semibold">Acceso al sistema</span>}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-end sm:space-x-4 pt-4 sm:pt-6 border-t border-white/20 gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-white border-white/30 hover:bg-white/20 px-6 shadow-md rounded-xl transition-all"
                                            onClick={() => router.push(`/dashboard/admin/usuarios/`)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-blue-600 hover:bg-blue-700 font-bold px-8 py-3 rounded-xl shadow-xl text-white transition-all border-0"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
