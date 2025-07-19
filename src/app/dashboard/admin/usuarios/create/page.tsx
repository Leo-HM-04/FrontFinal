'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, User, Mail, Lock, UserCheck } from 'lucide-react';
import { UsuariosService, CreateUserData } from '@/services/usuarios.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateUserData>({
    nombre: '',
    email: '',
    password: '',
    rol: 'solicitante'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});
  const {} = useAuth();

  const handleChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      rol: role
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<CreateUserData> = {};
    let isValid = true;

    if (!formData.nombre) {
      newErrors.nombre = 'El nombre es requerido';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'El correo es requerido';
      isValid = false;
    } else if (!/^[^@\s]+@bechapra\.com$/.test(formData.email)) {
      newErrors.email = 'Solo se permiten correos @bechapra.com';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await UsuariosService.create(formData);
      toast.success('Usuario creado exitosamente');

      // 🧹 Limpiar caché para que se actualice la tabla
      sessionStorage.removeItem('usuarios_cache');

      router.push('/dashboard/admin/usuarios');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-white font-sans">
                  Crear Usuario
                </h1>
                <p className="text-white/80">Ingresa los datos del nuevo usuario</p>
              </div>
            </div>
          </div>

          {/* Form Container Mejorado */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 shadow-lg flex flex-col md:flex-row gap-8">
            {/* Card resumen visual */}
            <div className="hidden md:flex flex-col items-center justify-center w-1/3 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl p-8 shadow-lg text-white animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-white/80" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nuevo Usuario</h3>
              <div className="text-white/90 text-center mb-2 truncate w-full max-w-[180px]">{formData.nombre || 'Nombre completo'}</div>
              <div className="text-white/70 text-center text-sm mb-2 truncate w-full max-w-[180px]">{formData.email || 'Correo electrónico'}</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold mt-2 shadow border-2 transition-all max-w-full truncate
                ${formData.rol === 'solicitante' ? 'bg-blue-600 text-white border-blue-600' : ''}
                ${formData.rol === 'aprobador' ? 'bg-purple-600 text-white border-purple-600' : ''}
                ${formData.rol === 'pagador_banca' ? 'bg-green-600 text-white border-green-600' : ''}
              `}>
                {formData.rol === 'solicitante' && <User className="w-4 h-4" />}
                {formData.rol === 'aprobador' && <UserCheck className="w-4 h-4" />}
                {formData.rol === 'pagador_banca' && <UserCheck className="w-4 h-4" />}
                <span className="truncate">{formData.rol.charAt(0).toUpperCase() + formData.rol.slice(1).replace('_', ' ')}</span>
              </div>
            </div>
            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Nombre */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nombre completo
                  </label>
                  <Input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    className={`bg-white/15 border-white/20 text-white focus:ring-2 focus:ring-blue-400 ${errors.nombre ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                    placeholder="Ej. Juan Pérez"
                  />
                  {errors.nombre && (
                    <p className="text-red-300 text-xs mt-1 animate-shake">{errors.nombre}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Correo electrónico
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`bg-white/15 border-white/20 text-white focus:ring-2 focus:ring-blue-400 ${errors.email ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                    placeholder="Ej. usuario@bechapra.com"
                  />
                  {errors.email && (
                    <p className="text-red-300 text-xs mt-1 animate-shake">{errors.email}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`bg-white/15 border-white/20 text-white focus:ring-2 focus:ring-blue-400 ${errors.password ? 'border-red-400 ring-2 ring-red-400' : ''}`}
                    placeholder="**********"
                  />
                  {errors.password && (
                    <p className="text-red-300 text-xs mt-1 animate-shake">{errors.password}</p>
                  )}
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Rol del usuario
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('solicitante')}
                      className={`w-full px-3 py-2 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-sm border-2
                        ${formData.rol === 'solicitante' 
                          ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg' 
                          : 'bg-white/20 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-900'}
                      `}
                      title="Solicitante: Puede crear solicitudes de pago."
                    >
                      <User className="w-5 h-5" /> Solicitante
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('aprobador')}
                      className={`w-full px-3 py-2 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-sm border-2
                        ${formData.rol === 'aprobador' 
                          ? 'bg-purple-600 text-white border-purple-600 scale-105 shadow-lg' 
                          : 'bg-white/20 text-purple-700 border-purple-200 hover:bg-purple-50 hover:text-purple-900'}
                      `}
                      title="Aprobador: Puede aprobar o rechazar solicitudes."
                    >
                      <UserCheck className="w-5 h-5" /> Aprobador
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('pagador_banca')}
                      className={`w-full px-3 py-2 rounded-lg text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-sm border-2
                        ${formData.rol === 'pagador_banca' 
                          ? 'bg-green-600 text-white border-green-600 scale-105 shadow-lg' 
                          : 'bg-white/20 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-900'}
                      `}
                      title="Pagador: Puede ejecutar pagos aprobados."
                    >
                      <UserCheck className="w-5 h-5" /> Pagador
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/admin/usuarios')}
                  className="mr-2 text-white border-white/30 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="text-white border-white/30 hover:bg-white/10 bg-blue-600 font-bold px-8 py-3 rounded-lg shadow-lg"
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
