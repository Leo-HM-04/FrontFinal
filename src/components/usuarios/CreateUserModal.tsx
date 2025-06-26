'use client';

import React, { useState } from 'react';
import { X, User, Mail, Lock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UsuariosService, CreateUserData } from '@/services/usuarios.service';
import { User as UserType } from '@/types';
import { toast } from 'react-hot-toast';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: UserType) => void;
}

export function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    nombre: '',
    email: '',
    password: '',
    rol: 'solicitante'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});

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
      const newUser = await UsuariosService.create(formData);
      onUserCreated(newUser);
      toast.success('Usuario creado exitosamente');
      onClose();
      setFormData({ nombre: '', email: '', password: '', rol: 'solicitante' });
      setErrors({});
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ nombre: '', email: '', password: '', rol: 'solicitante' });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <User className="w-5 h-5 mr-2" />
              Crear Nuevo Usuario
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-white border-white hover:bg-white hover:text-primary-blue"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Nombre Completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            error={errors.nombre}
            icon={<User className="w-5 h-5 text-gray-400" />}
            placeholder="Ej: Juan Pérez García"
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
          />

          <div>
            <label className="block text-sm font-medium text-primary-dark mb-2">
              <UserCheck className="w-4 h-4 inline mr-1" />
              Rol
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                errors.rol ? 'border-red-500' : ''
              }`}
            >
              <option value="solicitante">Solicitante</option>
              <option value="aprobador">Aprobador</option>
              <option value="pagador_banca">Pagador Banca</option>
              <option value="admin_general">Administrador General</option>
            </select>
            {errors.rol && <p className="mt-1 text-sm text-red-600">{errors.rol}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Crear Usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
