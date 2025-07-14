import api from '@/lib/api';

export class ComprobantesService {
  static async getBySolicitud(id_solicitud: number, token: string) {
    const response = await api.get(`/comprobantes/${id_solicitud}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
}
