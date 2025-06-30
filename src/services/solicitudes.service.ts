import api from '@/lib/api';
import axios from 'axios';
import { Solicitud, CreateSolicitudData, UpdateEstadoData } from '@/types';

export class SolicitudesService {
  static async getAll(): Promise<Solicitud[]> {
    try {
      const response = await api.get<Solicitud[]>('/solicitudes');
      return response.data;
    } catch (error: any) {
      console.error('SolicitudesService.getAll error:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: api.defaults.baseURL,
      });
      throw error;
    }
  }

  static async getById(id: number): Promise<Solicitud> {
    const response = await api.get<Solicitud>(`/solicitudes/${id}`);
    return response.data;
  }

  static async create(solicitudData: CreateSolicitudData): Promise<Solicitud> {
    const response = await api.post<Solicitud>('/solicitudes', solicitudData);
    return response.data;
  }

  static async updateEstado(id: number, estadoData: UpdateEstadoData): Promise<Solicitud> {
    const response = await api.put<Solicitud>(`/solicitudes/${id}/estado`, estadoData);
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/solicitudes/${id}`);
  }

  static async getMySolicitudes(): Promise<Solicitud[]> {
    const response = await api.get<Solicitud[]>('/solicitudes');
    return response.data;
  }
}