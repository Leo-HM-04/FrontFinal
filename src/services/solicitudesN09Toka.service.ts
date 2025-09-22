import api from '@/lib/api';

export interface SolicitudN09TokaData {
  id_solicitud?: number;
  id_solicitud_principal?: number;
  id_usuario?: number;
  asunto: 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT';
  proveedor?: string;
  cliente: string;
  beneficiario: string;
  tipo_cuenta_clabe: 'CLABE' | 'CUENTA';
  numero_cuenta_clabe: string;
  banco_destino: string;
  monto: number;
  tipo_moneda: 'MXN' | 'USD' | 'EUR';
  estado?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_limite_pago?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}

export class SolicitudesN09TokaService {
  // Crear nueva solicitud N09/TOKA
  static async crear(datos: Omit<SolicitudN09TokaData, 'id_solicitud'>): Promise<{ success: boolean; data?: SolicitudN09TokaData; message?: string }> {
    try {
      console.log('🚀 Creando solicitud N09/TOKA:', datos);
      
      const response = await api.post('/solicitudes-n09-toka', datos);
      
      console.log('✅ Solicitud N09/TOKA creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en crear solicitud N09/TOKA:', error);
      throw error;
    }
  }

  // Obtener solicitud N09/TOKA por ID
  static async obtenerPorId(id: number): Promise<{ success: boolean; data?: SolicitudN09TokaData; message?: string }> {
    try {
      console.log(`🔍 Obteniendo solicitud N09/TOKA ID: ${id}`);
      
      const response = await api.get(`/solicitudes-n09-toka/${id}`);
      
      console.log('✅ Solicitud N09/TOKA obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en obtener solicitud N09/TOKA:', error);
      throw error;
    }
  }

  // Obtener solicitud N09/TOKA por ID de solicitud principal
  static async obtenerPorSolicitudPrincipal(idSolicitudPrincipal: number): Promise<{ success: boolean; data?: SolicitudN09TokaData; message?: string }> {
    try {
      console.log(`🔍 Obteniendo solicitud N09/TOKA por solicitud principal: ${idSolicitudPrincipal}`);
      
      const response = await api.get(`/solicitudes-n09-toka/por-solicitud/${idSolicitudPrincipal}`);
      
      console.log('✅ Solicitud N09/TOKA obtenida por solicitud principal:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { status?: number } };
        if (errorResponse.response?.status === 404) {
          console.log('ℹ️ No se encontró solicitud N09/TOKA para la solicitud principal');
          return { success: false, message: 'No encontrada' };
        }
      }
      console.error('❌ Error en obtener solicitud N09/TOKA por solicitud principal:', error);
      throw error;
    }
  }

  // Actualizar solicitud N09/TOKA
  static async actualizar(id: number, datos: Partial<SolicitudN09TokaData>): Promise<{ success: boolean; data?: SolicitudN09TokaData; message?: string }> {
    try {
      console.log(`📝 Actualizando solicitud N09/TOKA ID ${id}:`, datos);
      
      const response = await api.put(`/solicitudes-n09-toka/${id}`, datos);
      
      console.log('✅ Solicitud N09/TOKA actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en actualizar solicitud N09/TOKA:', error);
      throw error;
    }
  }

  // Listar solicitudes N09/TOKA
  static async listar(filtros?: {
    estado?: string;
    id_usuario?: number;
    asunto?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    limite?: number;
  }): Promise<{ success: boolean; data?: SolicitudN09TokaData[]; total?: number; message?: string }> {
    try {
      const params = new URLSearchParams();
      
      if (filtros) {
        Object.entries(filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      console.log(`📋 Listando solicitudes N09/TOKA: /solicitudes-n09-toka${queryString}`);
      
      const response = await api.get(`/solicitudes-n09-toka${queryString}`);
      
      console.log(`✅ Solicitudes N09/TOKA listadas: ${response.data?.data?.length || 0} registros`);
      return response.data;
    } catch (error) {
      console.error('❌ Error en listar solicitudes N09/TOKA:', error);
      throw error;
    }
  }

  // Eliminar solicitud N09/TOKA
  static async eliminar(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`🗑️ Eliminando solicitud N09/TOKA ID: ${id}`);
      
      const response = await api.delete(`/solicitudes-n09-toka/${id}`);
      
      console.log('✅ Solicitud N09/TOKA eliminada');
      return response.data;
    } catch (error) {
      console.error('❌ Error en eliminar solicitud N09/TOKA:', error);
      throw error;
    }
  }

  // Convertir datos de plantilla a formato de API
  static convertirDatosPlantilla(datosPlantilla: Record<string, unknown>): Partial<SolicitudN09TokaData> {
    return {
      asunto: (typeof datosPlantilla.asunto === 'string' ? datosPlantilla.asunto : undefined) as 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT' | undefined,
      cliente: typeof datosPlantilla.cliente === 'string' ? datosPlantilla.cliente : undefined,
      beneficiario: typeof datosPlantilla.beneficiario === 'string' ? datosPlantilla.beneficiario : undefined,
      tipo_cuenta_clabe: (typeof datosPlantilla.tipo_cuenta === 'string' ? datosPlantilla.tipo_cuenta : 'CLABE') as 'CLABE' | 'CUENTA',
      numero_cuenta_clabe: typeof datosPlantilla.numero_cuenta === 'string' ? datosPlantilla.numero_cuenta : undefined,
      banco_destino: typeof datosPlantilla.banco_destino === 'string' ? datosPlantilla.banco_destino : 'STP',
      monto: parseFloat(datosPlantilla.monto?.toString()?.replace(/[^0-9.-]/g, '') || '0'),
      tipo_moneda: (typeof datosPlantilla.moneda === 'string' ? datosPlantilla.moneda : 'MXN') as 'MXN' | 'USD' | 'EUR',
    };
  }

  // Convertir datos de API a formato de plantilla
  static convertirADatosPlantilla(datosApi: SolicitudN09TokaData): Record<string, unknown> {
    return {
      asunto: datosApi.asunto,
      cliente: datosApi.cliente,
      beneficiario: datosApi.beneficiario,
      tipo_cuenta: datosApi.tipo_cuenta_clabe,
      numero_cuenta: datosApi.numero_cuenta_clabe,
      banco_destino: datosApi.banco_destino,
      monto: datosApi.monto,
      moneda: datosApi.tipo_moneda,
    };
  }
}