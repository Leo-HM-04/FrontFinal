import { Solicitud } from '@/types';
import api from '@/lib/api';

/**
 * Detecta si una solicitud es de tipo N09/TOKA
 * @param solicitud - La solicitud a verificar
 * @returns true si es N09/TOKA, false en caso contrario
 */
export function isN09TokaSolicitud(solicitud: Solicitud): boolean {
  // Método 1: Verificar por tipo_plantilla
  if ((solicitud as Solicitud & { tipo_plantilla?: string }).tipo_plantilla === 'N09_TOKA') {
    return true;
  }
  
  // Método 2: Verificar dentro de plantilla_datos
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' 
        ? JSON.parse(solicitud.plantilla_datos) 
        : solicitud.plantilla_datos;
      
      if (plantillaData.isN09Toka === true || plantillaData.templateType === 'tarjetas-n09-toka') {
        return true;
      }
    } catch (e) {
      // Si hay error al parsear, continuar con la verificación normal
      console.warn('Error parsing plantilla_datos:', e);
    }
  }
  
  return false;
}

/**
 * Actualiza el estado de una solicitud usando el endpoint correcto según su tipo
 * @param id - ID de la solicitud
 * @param solicitud - Datos de la solicitud
 * @param estadoData - Datos del nuevo estado
 * @returns Promise con el resultado
 */
export async function updateSolicitudEstado(
  id: number, 
  solicitud: Solicitud, 
  estadoData: { estado: string; comentario_aprobador?: string }
): Promise<{ success: boolean; message?: string; data?: unknown }> {
  // Debug de autenticación
  const { getAuthToken } = await import('@/utils/auth');
  const token = getAuthToken();
  console.log('🔍 DEBUG AUTH - Token disponible:', !!token);
  console.log('🔍 DEBUG AUTH - Token preview:', token ? token.substring(0, 30) + '...' : 'null');
  
  const isN09Toka = isN09TokaSolicitud(solicitud);
  
  if (isN09Toka) {
    // Usar endpoint específico para N09/TOKA
    console.log(`🔄 Actualizando estado solicitud N09/TOKA ID: ${id} a ${estadoData.estado}`);
    
    // Verificar que el token existe (el interceptor de api ya lo maneja automáticamente)
    if (!token) {
      console.error('❌ No hay token de autenticación disponible');
      throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    
    console.log(`🔑 Token encontrado, longitud: ${token.length}`);
    
    try {
      // Mapear estado de solicitudes normales a N09/TOKA
      const estadoN09 = estadoData.estado === 'autorizada' ? 'aprobada' : estadoData.estado;
      
      console.log(`📡 Enviando PATCH a /solicitudes-n09-toka/${id}/estado con:`, {
        estado: estadoN09,
        comentarios: estadoData.comentario_aprobador || `Solicitud ${estadoN09}`
      });
      
      const response = await api.patch(`/solicitudes-n09-toka/${id}/estado`, {
        estado: estadoN09,
        comentarios: estadoData.comentario_aprobador || `Solicitud ${estadoN09}`
      });
      
      const result = response.data;
      console.log(`✅ Solicitud N09/TOKA ${id} actualizada a ${estadoN09} exitosamente`);
      return { success: true, data: result };
    } catch (error: unknown) {
      console.error('❌ Error actualizando solicitud N09/TOKA:', error);
      
      // Type guard para errores de axios
      const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      console.error('❌ Error response:', axiosError?.response?.data);
      console.error('❌ Error status:', axiosError?.response?.status);
      
      return { 
        success: false, 
        message: axiosError?.response?.data?.message || axiosError?.message || 'Error desconocido'
      };
    }
  } else {
    // Usar endpoint normal para solicitudes regulares - esto se manejará externamente
    throw new Error('NOT_N09_TOKA'); // Indicador para usar el método normal
  }
}