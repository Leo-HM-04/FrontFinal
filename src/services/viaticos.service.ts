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
    // Construir el objeto de datos para el primer POST (JSON)
    const payload: any = {
      departamento: data.departamento,
      monto: data.monto,
      cuenta_destino: data.cuenta_destino,
      concepto: data.concepto,
      tipo_pago: data.tipo_pago,
      fecha_limite_pago: data.fecha_limite_pago,
      tipo_cuenta_destino: data.tipo_cuenta_destino,
      tipo_tarjeta: data.tipo_tarjeta || '',
      banco_destino: data.banco_destino || ''
    };
    if (data.id_usuario) {
      payload.id_usuario = data.id_usuario;
    }
    // Primero crea el viático sin archivo
    const viaticoRes = await api.post('/viaticos', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    // Luego sube el archivo y asocia el id_viatico
    const id_viatico = viaticoRes.data.id_viatico;
    const fileForm = new FormData();
    fileForm.append('viatico_url', data.viatico_url);
    fileForm.append('id_viatico', id_viatico);
    await api.post('/viaticos/subir', fileForm, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return viaticoRes.data;
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
}
