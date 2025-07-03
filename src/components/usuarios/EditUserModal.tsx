'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UsuariosService, UpdateUserData } from '@/services/usuarios.service';
import { User as UserType } from '@/types';
import { toast } from 'react-hot-toast';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUserUpdated: (user: UserType) => void;
}

export function EditUserModal({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({
    nombre: '',
    email: '',
    rol: 'solicitante'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<UpdateUserData>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof UpdateUserData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<UpdateUserData> = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.rol) {
      newErrors.rol = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !validateForm()) return;

    setLoading(true);
    try {
      const updatedUser = await UsuariosService.update(user.id_usuario, formData);
      onUserUpdated(updatedUser);
      toast.success('Usuario actualizado exitosamente');
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary-blue to-primary-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <User className="w-5 h-5 mr-2" />
              Editar Usuario
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

          <div className="bg-light-bg-100 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>ID:</strong> {user.id_usuario} | 
              <strong> Creado:</strong> {new Date(user.creado_en).toLocaleDateString('es-CO')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Estado:</strong> 
              <span className={`ml-1 ${user.bloqueado ? 'text-red-600' : 'text-green-600'}`}>
                {user.bloqueado ? 'Bloqueado' : 'Activo'}
              </span>
            </p>
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
              Actualizar Usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
