/**
 * Extrae la fecha límite de pago desde plantilla_datos para plantillas SUA
 * @param plantilla_datos - JSON string o objeto con los datos de la plantilla
 * @param fecha_limite_pago_fallback - Fecha de fallback si no se encuentra en plantilla_datos
 * @returns La fecha límite en formato YYYY-MM-DD o el fallback
 */
export function extraerFechaLimiteDesdeplantilla(
  plantilla_datos: string | object | null,
  fecha_limite_pago_fallback?: string | Date | null
): string {
  // Si no hay plantilla_datos, usar el fallback
  if (!plantilla_datos) {
    return formatearFechaFallback(fecha_limite_pago_fallback);
  }

  try {
    // Parsear plantilla_datos si es string
    const datos = typeof plantilla_datos === 'string' 
      ? JSON.parse(plantilla_datos) 
      : plantilla_datos;

    // Extraer fecha_limite si existe
    const fechaLimite = datos.fecha_limite;
    
    if (fechaLimite && typeof fechaLimite === 'string') {
      // Validar que tenga formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaLimite)) {
        return fechaLimite;
      }
    }
    
    // Si no hay fecha válida en plantilla_datos, usar fallback
    return formatearFechaFallback(fecha_limite_pago_fallback);
    
  } catch (error) {
    console.warn('Error parseando plantilla_datos para extraer fecha_limite:', error);
    return formatearFechaFallback(fecha_limite_pago_fallback);
  }
}

/**
 * Formatea la fecha de fallback al formato YYYY-MM-DD
 */
function formatearFechaFallback(fecha?: string | Date | null): string {
  if (!fecha) return '';
  
  try {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

/**
 * Determina si una solicitud usa plantillas SUA que tienen fecha_limite
 * @param solicitud - Objeto de solicitud
 * @returns true si es una plantilla SUA que usa fecha_limite
 */
export function esSolicitudConFechaLimitePlantilla(solicitud: any): boolean {
  if (!solicitud) return false;

  // Verificar si tiene plantilla_datos con fecha_limite
  if (solicitud.plantilla_datos) {
    try {
      const datos = typeof solicitud.plantilla_datos === 'string' 
        ? JSON.parse(solicitud.plantilla_datos) 
        : solicitud.plantilla_datos;
      
      // Si tiene fecha_limite en plantilla_datos, es una plantilla SUA
      return !!(datos.fecha_limite);
    } catch {
      return false;
    }
  }

  // Verificar por tipo de plantilla o concepto
  const esPlantillaSua = 
    (solicitud.concepto && (
      solicitud.concepto.includes('SUA FRENSHETSI') ||
      solicitud.concepto.includes('SUA INTERNAS') ||
      solicitud.concepto.includes('FRENSHETSI')
    )) ||
    (solicitud.tipo_pago_descripcion && (
      solicitud.tipo_pago_descripcion.includes('sua-frenshetsi') ||
      solicitud.tipo_pago_descripcion.includes('sua-internas')
    ));

  return esPlantillaSua;
}