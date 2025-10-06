import { api } from '../lib/api';
import { isN09TokaSolicitud, marcarN09TokaComoPagada } from '@/utils/solicitudUtils';
import { Solicitud } from '@/types';

export const getPagosPendientes = async () => {
  try {
    // Usar endpoint unificado que incluye N09/TOKA y solicitudes normales
    const res = await api.get('/solicitudes/unificadas');
    
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
    
    const formData = new FormData();
    formData.append('comprobante', file);
    
    // Usar cliente API que maneja automáticamente la autenticación
    const res = await api.put(`/solicitudes/${id_solicitud}/comprobante`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Comprobante subido exitosamente');
    return res.data;
  } catch (error) {
    console.error('❌ Error subiendo comprobante:', error);
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
