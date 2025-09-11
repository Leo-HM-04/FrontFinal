
import api from '@/lib/api';
import { Solicitud, CreateSolicitudData, UpdateEstadoData, Comprobante } from '@/types';

export class SolicitudesService {
  static async getComprobantes(id_solicitud: number, token?: string): Promise<Comprobante[]> {
    try {
      // Si no se proporciona token, intentamos obtenerlo del localStorage
      if (!token) {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          token = storedToken;
        }
      }
      
      console.log(`Obteniendo comprobantes para solicitud ${id_solicitud}. Token presente: ${!!token}`);
      
      const response = await api.get<Comprobante[]>(`/comprobantes/${id_solicitud}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error) {
      // Tipamos el error como unknown y luego verificamos sus propiedades
      const err = error as { response?: { data: unknown; status?: number }; message?: string };
      
      // Log más detallado para errores específicos
      if (err.response?.status === 401) {
        console.error(`Error 401 (No autorizado) obteniendo comprobantes para solicitud ${id_solicitud}`);
      } else if (err.response?.status === 403) {
        console.error(`Error 403 (Prohibido) obteniendo comprobantes para solicitud ${id_solicitud}`);
      } else {
        console.error(`Error obteniendo comprobantes para solicitud ${id_solicitud}:`, 
          err.response?.data || err.message || 'Error desconocido');
      }
      
      // Re-lanzamos el error para que se maneje en el componente
      throw error;
    }
  }

  static async subirFactura(id: number, factura: File, token: string): Promise<unknown> {
    const formData = new FormData();
    formData.append('archivo', factura); // El backend espera 'archivo'
    formData.append('id_solicitud', String(id));
    const response = await api.post(`/comprobantes/subir`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
  static async getAutorizadasYPagadas(token: string): Promise<Solicitud[]> {
    const response = await api.get<Solicitud[]>('/solicitudes/autorizadas-pagadas', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
  static async getAll(): Promise<Solicitud[]> {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get<Solicitud[]>('/solicitudes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null) {
        const errObj = error as { message?: string; response?: { status?: number }; config?: { url?: string }; };
        console.error('SolicitudesService.getAll error:', {
          message: errObj.message,
          status: errObj.response?.status,
          url: errObj.config?.url,
          baseURL: api.defaults.baseURL,
        });
      } else {
        console.error('SolicitudesService.getAll error:', error);
      }
      throw error;
    }
  }

  static async getById(id: number): Promise<Solicitud> {
    const token = localStorage.getItem('token');
    const response = await api.get<Solicitud>(`/solicitudes/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async create(solicitudData: CreateSolicitudData): Promise<Solicitud> {
    const token = localStorage.getItem('token');
    const response = await api.post<Solicitud>('/solicitudes', solicitudData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async updateEstado(id: number, estadoData: UpdateEstadoData): Promise<Solicitud> {
    const token = localStorage.getItem('token');
    const response = await api.put<Solicitud>(`/solicitudes/${id}/estado`, estadoData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    const token = localStorage.getItem('token');
    await api.delete(`/solicitudes/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  static async getMySolicitudes(): Promise<Solicitud[]> {
    const token = localStorage.getItem('token');
    const response = await api.get<Solicitud[]>('/solicitudes', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async update(id: number, data: Partial<Solicitud>): Promise<Solicitud> {
    const token = localStorage.getItem('token');
    const response = await api.put<Solicitud>(`/solicitudes/${id}`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  }

  static async createWithFiles(data: {
    departamento: string;
    monto: string | number;
    tipo_moneda: string;
    cuenta_destino: string | null;
    concepto: string;
    tipo_pago: string;
    tipo_cuenta_destino: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    fecha_limite_pago: string;
    factura: File;
    nombre_persona: string;
    tipo_pago_descripcion?: string;
    empresa_a_pagar?: string;
    cuenta?: string | null;
    banco_cuenta?: string | null;
    // Campos de tarjeta institucional
    link_pago?: string | null;
    usuario_acceso?: string | null;
    contrasena_acceso?: string | null;
    // Nuevos campos para segunda forma de pago
    tiene_segunda_forma_pago?: boolean;
    tipo_cuenta_destino_2?: string;
    banco_destino_2?: string;
    cuenta_destino_2?: string | null;
    tipo_tarjeta_2?: string;
    cuenta_2?: string | null;
    banco_cuenta_2?: string | null;
    // Campos de segunda tarjeta institucional
    link_pago_2?: string | null;
    usuario_acceso_2?: string | null;
    contrasena_acceso_2?: string | null;
  }): Promise<unknown> {
    const token = localStorage.getItem('token');
    
    console.log('Service data received:', data);
    
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('tipo_moneda', data.tipo_moneda);
    formData.append('cuenta_destino', data.cuenta_destino || '');
    
    console.log('tipo_moneda value:', data.tipo_moneda);
    console.log('FormData entries:', Array.from(formData.entries()));
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago);
    formData.append('factura', data.factura);
    formData.append('tipo_cuenta_destino', data.tipo_cuenta_destino);
    formData.append('tipo_tarjeta', data.tipo_tarjeta || '');
    formData.append('banco_destino', data.banco_destino || '');
    formData.append('nombre_persona', data.nombre_persona || '');
    formData.append('tipo_pago_descripcion', data.tipo_pago_descripcion || '');
    formData.append('empresa_a_pagar', data.empresa_a_pagar || '');
    formData.append('cuenta', data.cuenta || '');
    formData.append('banco_cuenta', data.banco_cuenta || '');
    formData.append('link_pago', data.link_pago || '');
    formData.append('usuario_acceso', data.usuario_acceso || '');
    formData.append('contrasena_acceso', data.contrasena_acceso || '');
    
    // Agregar campos de segunda forma de pago
    formData.append('tiene_segunda_forma_pago', String(data.tiene_segunda_forma_pago || false));
    if (data.tiene_segunda_forma_pago) {
      formData.append('tipo_cuenta_destino_2', data.tipo_cuenta_destino_2 || '');
      formData.append('banco_destino_2', data.banco_destino_2 || '');
      formData.append('cuenta_destino_2', data.cuenta_destino_2 || '');
      formData.append('tipo_tarjeta_2', data.tipo_tarjeta_2 || '');
      formData.append('cuenta_2', data.cuenta_2 || '');
      formData.append('banco_cuenta_2', data.banco_cuenta_2 || '');
      formData.append('link_pago_2', data.link_pago_2 || '');
      formData.append('usuario_acceso_2', data.usuario_acceso_2 || '');
      formData.append('contrasena_acceso_2', data.contrasena_acceso_2 || '');
    }
    
    const response = await api.post('/solicitudes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  }

  static async updateWithFiles(id: number | string, data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    tipo_pago_descripcion?: string;
    empresa_a_pagar?: string;
    nombre_persona?: string;
    fecha_limite_pago: string;
    tipo_cuenta_destino: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    factura?: File | null;
    cuenta?: string | null;
    banco_cuenta?: string | null;
  }): Promise<unknown> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('fecha_limite_pago', data.fecha_limite_pago);
    // Siempre enviar el campo factura, aunque sea vacío, para que el backend lo maneje igual que en createWithFiles
    if (data.factura instanceof File) {
      formData.append('factura', data.factura);
    } else {
      formData.append('factura', '');
    }
    formData.append('tipo_cuenta_destino', data.tipo_cuenta_destino || '');
    formData.append('tipo_tarjeta', data.tipo_tarjeta || '');
    formData.append('banco_destino', data.banco_destino || '');
    formData.append('tipo_pago_descripcion', (data.tipo_pago_descripcion !== undefined && data.tipo_pago_descripcion !== null) ? String(data.tipo_pago_descripcion) : '');
    formData.append('empresa_a_pagar', (data.empresa_a_pagar !== undefined && data.empresa_a_pagar !== null) ? String(data.empresa_a_pagar) : '');
    formData.append('nombre_persona', (data.nombre_persona !== undefined && data.nombre_persona !== null) ? String(data.nombre_persona) : '');
    formData.append('cuenta', data.cuenta || '');
    formData.append('banco_cuenta', data.banco_cuenta || '');
    // DEBUG: log FormData
    // for (let pair of formData.entries()) {
    //   console.log(pair[0]+ ': ' + pair[1]);
    // }
    const response = await api.put(`/solicitudes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  }

  static async deleteSolicitante(id: number): Promise<void> {
    const token = localStorage.getItem('token');
    await api.delete(`/solicitudes/solicitante/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  static async aprobarLote(ids: number[], comentario_aprobador = ''): Promise<{ success: boolean; message?: string; updated?: number }> {
    const token = localStorage.getItem('token');
    const response = await api.put<{ success: boolean; message?: string; updated?: number }>(
      '/solicitudes/aprobar-lote',
      { ids, comentario_aprobador },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return response.data;
  }

  static async rechazarLote(ids: number[], comentario_aprobador = ''): Promise<{ success: boolean; message?: string; updated?: number }> {
    const token = localStorage.getItem('token');
    const response = await api.put<{ success: boolean; message?: string; updated?: number }>(
      '/solicitudes/rechazar-lote',
      { ids, comentario_aprobador },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return response.data;
  }

  static async createPlantilla(data: {
    // Datos básicos de la solicitud
    departamento: string;
    monto: string | number;
    tipo_moneda: string;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    tipo_cuenta_destino: string;
    banco_destino?: string;
    nombre_persona: string;
    empresa_a_pagar?: string;
    fecha_limite_pago: string;
    
    // Datos específicos de plantilla
    plantilla_id: string;
    plantilla_version?: string;
    plantilla_datos?: string; // JSON string con datos de campos
    
    // Archivos
    archivos: File[];
  }): Promise<unknown> {
    const token = localStorage.getItem('token');
    
    console.log('Service createPlantilla data received:', data);
    
    const formData = new FormData();
    
    // Agregar campos básicos
    formData.append('departamento', data.departamento);
    formData.append('monto', String(data.monto));
    formData.append('tipo_moneda', data.tipo_moneda);
    formData.append('cuenta_destino', data.cuenta_destino);
    formData.append('concepto', data.concepto);
    formData.append('tipo_pago', data.tipo_pago);
    formData.append('tipo_cuenta_destino', data.tipo_cuenta_destino);
    formData.append('banco_destino', data.banco_destino || '');
    formData.append('nombre_persona', data.nombre_persona);
    formData.append('empresa_a_pagar', data.empresa_a_pagar || data.nombre_persona);
    formData.append('fecha_limite_pago', data.fecha_limite_pago);
    
    // Agregar campos específicos de plantilla
    formData.append('plantilla_id', data.plantilla_id);
    formData.append('plantilla_version', data.plantilla_version || '1.0');
    formData.append('plantilla_datos', data.plantilla_datos || '{}');
    
    // Agregar archivos múltiples
    data.archivos.forEach((archivo, index) => {
      formData.append('archivos', archivo);
      console.log(`Archivo ${index + 1} agregado:`, archivo.name);
    });
    
    console.log('FormData entries para plantilla:', Array.from(formData.entries()).map(([key, value]) => [key, typeof value === 'object' ? `File: ${(value as File).name}` : value]));
    
    const response = await api.post('/solicitudes/plantilla', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    
    return response.data;
  }
}
