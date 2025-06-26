'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, User, Mail, Lock, UserCheck, Menu, LogOut } from 'lucide-react';
import { UsuariosService, CreateUserData } from '@/services/usuarios.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function CreateUserPage() {
  const [formData, setFormData] = useState<CreateUserData>({
    nombre: '',
    email: '',
    password: '',
    rol: 'solicitante'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});
  const { user, logout } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof CreateUserData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<CreateUserData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.rol) {
      newErrors.rol = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await UsuariosService.create(formData);
      toast.success('Usuario creado exitosamente');
      window.location.href = '/dashboard/admin/usuarios';
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear el usuario');
    } finally {
      setLoading(false);
    }
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
                onClick={() => window.location.href = '/dashboard/admin/usuarios'}
                className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
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
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="text-white p-6" style={{background: 'linear-gradient(135deg, #004AB7 0%, #0057D9 100%)'}}>
              <h2 className="text-2xl font-bold font-montserrat flex items-center">
                <User className="w-6 h-6 mr-3" />
                Crear Nuevo Usuario
              </h2>
              <p className="text-white/80 mt-2">
                Completa la información para crear un nuevo usuario en el sistema
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Input
                label="Nombre Completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                error={errors.nombre}
                icon={<User className="w-5 h-5 text-gray-400" />}
                placeholder="Ej: Juan Pérez García"
                required
              />

              <Input
                label="Correo Electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="usuario@bechapra.com"
                required
              />

              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                placeholder="Mínimo 6 caracteres"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 inline mr-1" />
                  Rol del Usuario
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.rol ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                  style={{'focus': {ringColor: '#004AB7'}}}
                >
                  <option value="solicitante">Solicitante</option>
                  <option value="aprobador">Aprobador</option>
                  <option value="pagador_banca">Pagador Banca</option>
                  <option value="admin_general">Administrador General</option>
                </select>
                {errors.rol && <p className="mt-1 text-sm text-red-600">{errors.rol}</p>}
              </div>

              {/* Role Description */}
              <div className="p-4 rounded-lg" style={{backgroundColor: '#F0F4FC'}}>
                <h4 className="font-semibold text-gray-800 mb-2">Descripción del Rol:</h4>
                <div className="text-sm text-gray-600">
                  {formData.rol === 'solicitante' && "Puede crear y gestionar sus propias solicitudes de pago."}
                  {formData.rol === 'aprobador' && "Puede revisar, aprobar o rechazar solicitudes de pago."}
                  {formData.rol === 'pagador_banca' && "Puede ver solicitudes autorizadas y procesar pagos."}
                  {formData.rol === 'admin_general' && "Acceso completo al sistema, puede gestionar usuarios y todas las solicitudes."}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard/admin/usuarios'}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="px-6 text-white"
                  style={{backgroundColor: '#004AB7'}}
                >
                  Crear Usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
