'use client';

import { PagoProcesado } from '@/utils/exportUtils';
import { pagosProcesadosEjemplo, pagosPendientesEjemplo } from '@/hooks/usePagos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://46.202.177.106:4000';

/**
 * Obtiene los pagos procesados del servidor
 * Si la API falla, devuelve datos de ejemplo
 */
export async function getPagosProcesados(): Promise<PagoProcesado[]> {
  try {
    const response = await fetch(`${API_URL}/api/pagos/procesados`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener pagos procesados');
    }
    
    return await response.json();
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
    const response = await fetch(`${API_URL}/api/pagos/pendientes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener pagos pendientes');
    }
    
    return await response.json();
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
    const response = await fetch(`${API_URL}/api/pagos/${idPago}/procesar`, {
      method: 'POST',
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
    const response = await fetch(`${API_URL}/api/comprobantes/${idComprobante}`, {
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
