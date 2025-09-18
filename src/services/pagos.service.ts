'use client';

import { PagoProcesado } from '@/utils/exportUtils';
import { pagosProcesadosEjemplo, pagosPendientesEjemplo } from '@/hooks/usePagos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Tipo para la respuesta de solicitudes desde el backend
interface SolicitudBackend {
  id_solicitud: number;
  nombre_usuario?: string;
  solicitante?: string;
  concepto: string;
  monto: string | number;
  fecha_aprobacion?: string;
  fecha_solicitud: string;
  fecha_pago?: string;
  nombre_departamento?: string;
  departamento?: string;
  estado: string;
  urgente?: boolean;
  tipo_cuenta_destino?: string;
  banco_destino?: string;
  cuenta_destino?: string;
  comprobante_id?: string;
}

/**
 * Obtiene los pagos procesados del servidor
 * Si la API falla, devuelve datos de ejemplo
 */
export async function getPagosProcesados(): Promise<PagoProcesado[]> {
  try {
    // Esta ruta probablemente necesite ser corregida también
    // Por ahora usar solicitudes con filtro de estado 'pagada'
    const response = await fetch(`${API_URL}/solicitudes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener pagos procesados');
    }
    
    const solicitudes: SolicitudBackend[] = await response.json();
    
    // Filtrar solo las solicitudes pagadas y convertir al formato esperado
    return solicitudes
      .filter((solicitud: SolicitudBackend) => solicitud.estado === 'pagada')
      .map((solicitud: SolicitudBackend) => ({
        id_pago: solicitud.id_solicitud,
        id_solicitud: solicitud.id_solicitud,
        solicitante: solicitud.nombre_usuario || solicitud.solicitante || 'Sin nombre',
        concepto: solicitud.concepto,
        monto: typeof solicitud.monto === 'string' ? parseFloat(solicitud.monto) : solicitud.monto,
        fecha_aprobacion: solicitud.fecha_aprobacion || solicitud.fecha_solicitud,
        fecha_pago: solicitud.fecha_pago || '',
        departamento: solicitud.nombre_departamento || solicitud.departamento || 'Sin departamento',
        estado: solicitud.estado,
        urgencia: solicitud.urgente ? 'Alta' : 'Normal',
        metodo_pago: solicitud.tipo_cuenta_destino || '',
        banco_destino: solicitud.banco_destino || '',
        cuenta_destino: solicitud.cuenta_destino || '',
        comprobante_id: solicitud.comprobante_id || ''
      }));
  } catch (error) {
    console.warn('Error obteniendo pagos procesados de la API, usando datos de ejemplo:', error);
    return [...pagosProcesadosEjemplo];
  }
}

/**
 * Obtiene los pagos pendientes del servidor
 * Si la API falla, devuelve datos de ejemplo
 */
export async function getPagosPendientes(): Promise<PagoProcesado[]> {
  try {
    const response = await fetch(`${API_URL}/solicitudes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener pagos pendientes');
    }
    
    const solicitudes: SolicitudBackend[] = await response.json();
    
    // Filtrar solo las solicitudes autorizadas (pendientes de pago) y convertir al formato esperado
    return solicitudes
      .filter((solicitud: SolicitudBackend) => solicitud.estado === 'autorizada')
      .map((solicitud: SolicitudBackend) => ({
        id_pago: solicitud.id_solicitud, // Usar id_pago para compatibilidad
        id_solicitud: solicitud.id_solicitud,
        solicitante: solicitud.nombre_usuario || solicitud.solicitante || 'Sin nombre',
        concepto: solicitud.concepto,
        monto: typeof solicitud.monto === 'string' ? parseFloat(solicitud.monto) : solicitud.monto,
        fecha_aprobacion: solicitud.fecha_aprobacion || solicitud.fecha_solicitud,
        fecha_pago: solicitud.fecha_pago || '',
        departamento: solicitud.nombre_departamento || solicitud.departamento || 'Sin departamento',
        estado: solicitud.estado,
        urgencia: solicitud.urgente ? 'Alta' : 'Normal',
        metodo_pago: solicitud.tipo_cuenta_destino || '',
        banco_destino: solicitud.banco_destino || '',
        cuenta_destino: solicitud.cuenta_destino || '',
        comprobante_id: solicitud.comprobante_id || ''
      }));
  } catch (error) {
    console.warn('Error obteniendo pagos pendientes de la API, usando datos de ejemplo:', error);
    return [...pagosPendientesEjemplo];
  }
}

/**
 * Procesa un pago pendiente
 */
export async function procesarPago(idPago: number, datos: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`${API_URL}/solicitudes/${idPago}/pagar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(datos)
    });
    
    if (!response.ok) {
      throw new Error('Error al procesar el pago');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al procesar pago:', error);
    // Simulación para desarrollo
    return {
      success: true,
      pago: {
        ...pagosPendientesEjemplo.find(p => p.id_pago === idPago),
        estado: 'completado',
        fecha_pago: new Date().toISOString(),
        comprobante_id: `CP-${Date.now().toString().slice(-6)}`
      }
    };
  }
}

/**
 * Obtiene un comprobante de pago
 */
export async function getComprobantePago(idComprobante: string): Promise<Blob | null> {
  try {
    const response = await fetch(`${API_URL}/comprobantes/${idComprobante}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener el comprobante');
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error obteniendo comprobante:', error);
    return null;
  }
}

/**
 * Genera y descarga un comprobante de pago
 */
export async function descargarComprobante(pago: PagoProcesado): Promise<boolean> {
  try {
    // Primero intentamos obtener de la API
    const comprobante = await getComprobantePago(pago.comprobante_id);
    
    if (comprobante) {
      // Si tenemos un blob del comprobante desde la API
      const url = URL.createObjectURL(comprobante);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprobante_${pago.comprobante_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // Si no hay comprobante en la API, generamos uno con JSPDF
      // Esto se implementaría aquí usando jsPDF
      throw new Error('No se encontró el comprobante');
    }
  } catch (error) {
    console.error('Error descargando comprobante:', error);
    return false;
  }
}
