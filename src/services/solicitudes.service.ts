import api from '@/lib/api';
import { Solicitud, CreateSolicitudData, UpdateEstadoData } from '@/types';

export class SolicitudesService {
  static async getAll(): Promise<Solicitud[]> {
    const response = await api.get<Solicitud[]>('/solicitudes');
    return response.data;
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
    const response = await api.get<Solicitud[]>('/solicitudes?own=true');
    return response.data;
  }
}
