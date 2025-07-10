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

  static async update(id: number, data: Partial<Solicitud>): Promise<Solicitud> {
    const response = await api.put<Solicitud>(`/solicitudes/${id}`, data);
    return response.data;
  }

  static async createWithFiles(data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    fecha_limite_pago: string;
    factura: File;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago);
    formData.append('factura', data.factura);
    const response = await api.post('/solicitudes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async updateWithFiles(id: number | string, data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    fecha_limite_pago: string;
    factura?: File | null;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago || '');
    if (data.factura instanceof File) {
      formData.append('factura', data.factura);
    }
    // DEBUG: log FormData
    // for (let pair of formData.entries()) {
    //   console.log(pair[0]+ ': ' + pair[1]);
    // }
    const response = await api.put(`/solicitudes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  static async deleteSolicitante(id: number): Promise<void> {
    await api.delete(`/solicitudes/solicitante/${id}`);
  }
}