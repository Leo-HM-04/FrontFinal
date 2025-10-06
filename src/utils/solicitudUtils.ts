import { Solicitud } from '@/types';

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
  const isN09Toka = isN09TokaSolicitud(solicitud);
  
  if (isN09Toka) {
    // Usar endpoint específico para N09/TOKA
    console.log(`🔄 Actualizando estado solicitud N09/TOKA ID: ${id} a ${estadoData.estado}`);
    const token = localStorage.getItem('token');
    
    // Mapear estado de solicitudes normales a N09/TOKA
    const estadoN09 = estadoData.estado === 'autorizada' ? 'aprobada' : estadoData.estado;
    
    const response = await fetch(`/api/solicitudes-n09-toka/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        estado: estadoN09,
        comentarios: estadoData.comentario_aprobador || `Solicitud ${estadoN09}`
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al actualizar estado de solicitud N09/TOKA`);
    }
    
    const result = await response.json();
    console.log(`✅ Solicitud N09/TOKA ${id} actualizada a ${estadoN09} exitosamente`);
    return result;
  } else {
    // Usar endpoint normal para solicitudes regulares - esto se manejará externamente
    throw new Error('NOT_N09_TOKA'); // Indicador para usar el método normal
  }
}