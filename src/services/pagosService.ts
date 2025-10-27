import { api } from '../lib/api';
import { isN09TokaSolicitud, marcarN09TokaComoPagada } from '@/utils/solicitudUtils';
import { Solicitud } from '@/types';

export const getPagosPendientes = async () => {
  try {
    // Usar endpoint unificado que incluye N09/TOKA y solicitudes normales
    const res = await api.get('/solicitudes/unificadas');
    
    // 🔍 DEBUG: Verificar solicitud 321 en el servicio frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const solicitud321 = res.data.find((s: any) => s.id_solicitud === 321);
    if (solicitud321) {
      console.log('🔍 [FRONTEND SERVICE DEBUG] Solicitud 321 recibida:', {
        id_solicitud: solicitud321.id_solicitud,
        soporte_url: solicitud321.soporte_url,
        keys: Object.keys(solicitud321)
      });
    }
    
    // Filtrar solo solicitudes autorizadas/aprobadas
    const solicitudesAutorizadas = res.data.filter((solicitud: { estado?: string }) => 
      solicitud.estado && (
        solicitud.estado.toLowerCase() === 'autorizada' || 
        solicitud.estado.toLowerCase() === 'aprobada'
      )
    );
    
    console.log('📋 Pagos pendientes encontrados:', solicitudesAutorizadas.length);
    console.log('📋 Estados encontrados:', [...new Set(solicitudesAutorizadas.map((s: { estado?: string }) => s.estado))]);
    
    return solicitudesAutorizadas;
  } catch (error) {
    console.error('Error obteniendo pagos pendientes:', error);
    throw error;
  }
};

export const marcarPagoComoPagado = async (id_solicitud: number, solicitud?: Solicitud) => {
  try {
    console.log(`💰 Marcando pago como pagado - ID: ${id_solicitud}`);
    
    // Si tenemos datos de la solicitud, verificamos si es N09/TOKA
    if (solicitud && isN09TokaSolicitud(solicitud)) {
      console.log('🔄 Detectada solicitud N09/TOKA, usando endpoint específico');
      const result = await marcarN09TokaComoPagada(id_solicitud, solicitud);
      
      if (!result.success) {
        throw new Error(result.message || 'Error marcando N09/TOKA como pagada');
      }
      
      return result.data;
    } else {
      // Solicitud normal
      console.log('🔄 Solicitud normal, usando endpoint estándar');
      const res = await api.put(`/solicitudes/${id_solicitud}/pagar`);
      
      console.log('✅ Pago marcado como pagado exitosamente');
      return res.data;
    }
  } catch (error) {
    console.error('❌ Error marcando pago como pagado:', error);
    throw error;
  }
};

export async function subirComprobante(id_solicitud: number, file: File) {
  try {
    console.log(`📄 Subiendo comprobante para solicitud ${id_solicitud}`);
    console.log(`📄 Archivo recibido:`, { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });
    
    // 🔍 DETECTAR SI ES SOLICITUD TOKA (N09/TOKA)
    // Verificamos si es una solicitud TOKA consultando por solicitud principal
    try {
      console.log(`🔍 Verificando si solicitud ${id_solicitud} es TOKA...`);
      const res = await api.get(`/solicitudes-n09-toka/por-solicitud/${id_solicitud}`, {
        // Evitar que el interceptor muestre toast de error para verificación TOKA
        headers: { 'X-Skip-Error-Toast': 'true' }
      });
      console.log(`🔍 Respuesta de verificación TOKA:`, res.data);
      
      if (res.data && res.data.success && res.data.data) {
        console.log('🎯 ¡ES SOLICITUD TOKA! - usando servicio específico');
        console.log('🎯 Datos TOKA encontrados:', res.data.data);
        
        // Es solicitud TOKA - usar servicio específico
        const { default: SolicitudN09TokaArchivosService } = await import('@/services/solicitudN09TokaArchivos.service');
        
        const tokaId = res.data.data.id_solicitud; // ✅ Usar id_solicitud, no id_solicitud_n09_toka
        console.log(`📤 Subiendo a TOKA con ID: ${tokaId}`);
        console.log(`📤 Archivo a subir:`, { name: file.name, size: file.size, type: file.type });
        
        const result = await SolicitudN09TokaArchivosService.subirArchivos(
          tokaId, // Usar el ID de solicitud TOKA
          [file], 
          ['comprobante_pago']
        );
        console.log('✅ Comprobante TOKA subido exitosamente:', result);
        
        // Verificar que el resultado sea exitoso
        if (result && result.success !== false) {
          return result;
        } else {
          console.error('❌ Error en resultado TOKA:', result);
          throw new Error(result?.message || 'Error al subir comprobante TOKA');
        }
      }
    } catch (tokaError) {
      console.log('📝 No es solicitud TOKA o error verificando:', tokaError);
      // No es TOKA, continuar con método estándar
    }
    
    // MÉTODO ESTÁNDAR para solicitudes normales
    console.log('📝 Usando método estándar para solicitud normal');
    const formData = new FormData();
    formData.append('comprobante', file);
    
    // Usar cliente API que maneja automáticamente la autenticación
    const res = await api.put(`/solicitudes/${id_solicitud}/comprobante`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Comprobante estándar subido exitosamente');
    return res.data;
  } catch (error) {
    console.error('❌ Error subiendo comprobante:', error);
    // Dejar que el error se propague al componente para manejo apropiado
    throw error;
  }
}

export const getPagosPagados = async () => {
  // Trae solicitudes marcadas como pagadas
  const res = await api.get('/solicitudes/pagadas');
  return res.data;
};

export const getSolicitudesAutorizadas = async () => {
  // Trae solicitudes autorizadas
  const res = await api.get('/solicitudes?estado=autorizada');
  return res.data;
};
