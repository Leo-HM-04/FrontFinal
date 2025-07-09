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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/admin/usuarios')}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white font-sans">
                  Crear Usuario
                </h1>
                <p className="text-white/80">Ingresa los datos del nuevo usuario</p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <form onSubmit={handleSubmit}>
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
                    className="bg-white/15 border-white/20 text-white"
                    placeholder="Ej. Juan Pérez"
                  />
                  {errors.nombre && (
                    <p className="text-red-300 text-xs mt-1">{errors.nombre}</p>
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
                    className="bg-white/15 border-white/20 text-white"
                    placeholder="Ej. usuario@bechapra.com"
                  />
                  {errors.email && (
                    <p className="text-red-300 text-xs mt-1">{errors.email}</p>
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
                    className="bg-white/15 border-white/20 text-white"
                    placeholder="**********"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Rol del usuario
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('solicitante')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                        ${formData.rol === 'solicitante' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/15 text-white hover:bg-white/20'}
                      `}
                    >
                      Solicitante
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('aprobador')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                        ${formData.rol === 'aprobador' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/15 text-white hover:bg-white/20'}
                      `}
                    >
                      Aprobador
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('pagador_banca')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                        ${formData.rol === 'pagador_banca' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/15 text-white hover:bg-white/20'}
                      `}
                    >
                      Pagador
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('admin_general')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                        ${formData.rol === 'admin_general' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/15 text-white hover:bg-white/20'}
                      `}
                    >
                      Administrador
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  type="button" // ← importante: evitar que sea 'submit'
                  variant="outline"
                  onClick={() => router.push('/dashboard/admin/usuarios')}
                  className="mr-4 text-white border-white/30 hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading} 
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  Crear Usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
