import type { Viatico } from '@/hooks/useViaticos';

export type { Viatico };
import api from '@/lib/api';


export class ViaticosService {
  static async getAll(): Promise<Viatico[]> {
    const response = await api.get<Viatico[]>('/viaticos');
    return response.data;
  }

  static async getById(id: number): Promise<Viatico> {
    const response = await api.get<Viatico>(`/viaticos/${id}`);
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/viaticos/${id}`);
  }

  static async update(id: number, data: Partial<Viatico>): Promise<Viatico> {
    const response = await api.put<Viatico>(`/viaticos/${id}`, data);
    return response.data;
  }

  static async updateWithFiles(id: number, formData: FormData): Promise<Viatico> {
    const response = await api.put<Viatico>(`/viaticos/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async marcarComoPagado(id: number): Promise<void> {
    await api.put(`/viaticos/${id}/pagar`);
  }

  static async getPagados(): Promise<Viatico[]> {
    const response = await api.get<Viatico[]>('/viaticos?estado=pagado');
    return response.data;
  }

  static async createWithFile(data: {
    departamento?: string;
    monto?: string | number;
    cuenta_destino?: string;
    concepto?: string;
    tipo_pago?: string;
    tipo_cuenta_destino?: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    fecha_limite_pago?: string;
    viatico_url?: File;
    id_usuario?: string;
    [key: string]: string | number | File | undefined;
  }): Promise<Viatico> {
    const formData = new FormData();
    
    // Add all string/number fields to the FormData
    Object.keys(data).forEach(key => {
      if (key !== 'viatico_url' && data[key] !== undefined) {
        formData.append(key, String(data[key]));
      }
    });
    
    // Add the file if it exists
    if (data.viatico_url instanceof File) {
      formData.append('viatico_file', data.viatico_url);
    }
    
    const response = await api.post<Viatico>('/viaticos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}
