import api from '@/lib/api';

import { PlantillaRecurrente } from '@/types';

export class RecurrentesService {
  // Subir comprobante/factura para una recurrente pagada
  static async subirFactura(id: number, file: File): Promise<unknown> {
    const formData = new FormData();
    formData.append('fact_recurrente', file);
    const response = await api.put(`/recurrentes/${id}/factura`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
  // Activar o pausar plantilla recurrente
  static async cambiarEstadoActiva(id: number, activo: boolean): Promise<unknown> {
    const response = await api.put(`/recurrentes/${id}/activa`, { activo });
    return response.data;
  }

  // Editar plantilla con archivo (FormData)
  static async editarConArchivo(id: number, data: FormData): Promise<unknown> {
    const response = await api.put(`/recurrentes/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
  // Obtener una plantilla recurrente por ID
  static async obtenerPorId(id: number): Promise<PlantillaRecurrente> {
    const response = await api.get(`/recurrentes/${id}`);
    return response.data;
  }
  // Crear plantilla (acepta FormData para archivos)
  static async crearRecurrente(data: FormData): Promise<unknown> {
    const response = await api.post('/recurrentes', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }


  // Obtener plantillas del usuario autenticado
  static async obtenerMisRecurrentes(): Promise<PlantillaRecurrente[]> {
    const response = await api.get('/recurrentes');
    return response.data;
  }

  // Obtener todas las plantillas (admin)
  static async obtenerTodas(): Promise<PlantillaRecurrente[]> {
    const response = await api.get('/recurrentes/todas');
    return response.data;
  }

  // Obtener plantillas aprobadas para pagador
  static async obtenerTodasParaPagador(): Promise<PlantillaRecurrente[]> {
    const response = await api.get('/recurrentes/aprobadas');
    return response.data;
  }

  // Obtener todas las plantillas pendientes
  static async obtenerPendientes(): Promise<PlantillaRecurrente[]> {
    const response = await api.get('/recurrentes/pendientes');
    return response.data;
  }

  // Aprobar una plantilla
  static async aprobar(id: number): Promise<unknown> {
    const response = await api.put(`/recurrentes/${id}/aprobar`);
    return response.data;
  }

  // Rechazar una plantilla (con comentario opcional)
  static async rechazar(id: number, comentario_aprobador?: string): Promise<unknown> {
    const response = await api.put(`/recurrentes/${id}/rechazar`, { comentario_aprobador });
    return response.data;
  }

  // Eliminar una plantilla
  static async eliminar(id: number): Promise<void> {
    await api.delete(`/recurrentes/${id}`);
  }

  // Editar una plantilla
  static async editar(id: number, data: {
    departamento: string;
    monto: string | number;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    tipo_pago_descripcion?: string;
    empresa_a_pagar?: string;
    nombre_persona?: string;
    tipo_cuenta_destino?: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    frecuencia: string;
    siguiente_fecha: string;
  }): Promise<unknown> {
    const response = await api.put(`/recurrentes/${id}`, data);
    return response.data;
  }

  // Obtener historial general (filtrado por rol en el backend)
  static async obtenerHistorialGeneral(): Promise<unknown[]> {
    const response = await api.get('/recurrentes/historial');
    return response.data;
  }

  // Obtener historial por ID de plantilla
  static async obtenerHistorialPorPlantilla(id: number): Promise<unknown[]> {
    const response = await api.get(`/recurrentes/${id}/historial`);
    return response.data;
  }
}