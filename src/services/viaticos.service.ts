import type { Viatico } from '@/hooks/useViaticos';
import api from '@/lib/api';

export type { Viatico };

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
    const response = await api.put<Viatico>(`/viaticos/${id}/subir`, formData, {
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

  static async downloadFile(fileUrl: string): Promise<Blob> {
    const response = await api.get(fileUrl, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf,application/vnd.ms-excel,application/octet-stream'
      }
    });
    return new Blob([response.data], { type: response.headers['content-type'] });
  }

  static createDownloadUrl(viatico: Pick<Viatico, 'viatico_url'>): string {
    // Asegurarse de que la URL es absoluta
    if (!viatico.viatico_url) return '';
    if (viatico.viatico_url.startsWith('http')) return viatico.viatico_url;
    
    // Para archivos estáticos, usar la URL base sin /api
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const serverBaseUrl = baseUrl.replace('/api', '');
    return `${serverBaseUrl}${viatico.viatico_url}`;
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
    
    // Procesar campos normales
    Object.keys(data).forEach(key => {
      if (key !== 'viatico_url' && data[key] !== undefined) {
        if (key === 'monto') {
          const monto = typeof data[key] === 'string' ? 
            parseFloat(data[key] as string) : 
            data[key];
          formData.append(key, String(monto));
        } else {
          formData.append(key, String(data[key]));
        }
      }
    });
    
    // Procesar archivo
    if (data.viatico_url instanceof File) {
      formData.append('viatico_url', data.viatico_url);
    }

    console.log('Enviando datos:', {
      ...Object.fromEntries(formData.entries()),
      archivo: data.viatico_url instanceof File ? data.viatico_url.name : null
    });
    
    const response = await api.post<Viatico>('/viaticos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}