
import api from '@/lib/api';

export class ViaticosService {

  static async getMyViaticos(): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await api.get('/viaticos', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async createWithFile(data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    tipo_cuenta_destino: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    fecha_limite_pago: string;
    viatico_url: File;
    id_usuario?: string | number;
  }): Promise<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago);
    formData.append('tipo_cuenta_destino', data.tipo_cuenta_destino);
    formData.append('tipo_tarjeta', data.tipo_tarjeta || '');
    formData.append('banco_destino', data.banco_destino || '');
    if (data.id_usuario) {
      formData.append('id_usuario', String(data.id_usuario));
    }
    if (data.viatico_url instanceof File) {
      formData.append('viatico_url', data.viatico_url);
    }
    const res = await api.post('/viaticos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return res.data;
  }


  static async getById(id: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await api.get(`/viaticos/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async update(id: number, data: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await api.put(`/viaticos/${id}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    const token = localStorage.getItem('token');
    await api.delete(`/viaticos/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }


  static async createWithFileFormData(formData: FormData): Promise<any> {
    const token = localStorage.getItem('token');
    const res = await api.post('/viaticos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return res.data;
  }

    static async updateWithFiles(id: number | string, data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    fecha_limite_pago: string;
    tipo_cuenta_destino: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    viatico_url?: File | null;
  }): Promise<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago || '');
    formData.append('tipo_cuenta_destino', data.tipo_cuenta_destino || '');
    formData.append('tipo_tarjeta', data.tipo_tarjeta || '');
    formData.append('banco_destino', data.banco_destino || '');
    if (data.viatico_url instanceof File) {
      formData.append('viatico_url', data.viatico_url);
    }
    const response = await api.put(`/viaticos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  }
}
