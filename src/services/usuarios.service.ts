import api from '@/lib/api';
import { User } from '@/types';

export interface CreateUserData {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface UpdateUserData {
  nombre?: string;
  email?: string;
  rol?: string;
  password?: string;
  bloqueado?: boolean; // Para bloquear/desbloquear usuarios
  bloqueo_temporal_fin?: string; // Fecha de fin del bloqueo temporal
}

export interface UpdateProfileData {
  nombre: string;
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UsuariosService {
  static async getAll(): Promise<User[]> {
    const response = await api.get<User[]>('/usuarios');
    return response.data;
  }

  static async getById(id: number): Promise<User> {
    const response = await api.get<User>(`/usuarios/${id}`);
    return response.data;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const response = await api.post<User>('/usuarios', userData);
    return response.data;
  }

  static async update(id: number, userData: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/usuarios/${id}`, userData);
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  }

  // Métodos para perfil propio
  static async updatee(id: number, userData: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/usuarios/${id}`, userData);
    return response.data;
  }

  static async changePassword(passwordData: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>('/usuarios/profile/change-password', passwordData);
    return response.data;
  }
  static async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/usuarios/logout`);
    return response.data;
  }
}
