/**
 * Utilidades para manejo de fechas con zona horaria UTC-6 (México)
 */

/**
 * Convierte una fecha a formato ISO con zona horaria UTC-6
 * Útil para evitar problemas de zona horaria al enviar fechas al backend
 */
export const toUTC6ISOString = (date: Date): string => {
  if (!date) return '';
  
  // Crear una nueva fecha en UTC-6 (6 horas atrás de UTC)
  const utc6Date = new Date(date.getTime() - (6 * 60 * 60 * 1000));
  
  // Obtener los componentes de la fecha en UTC-6
  const year = utc6Date.getUTCFullYear();
  const month = String(utc6Date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc6Date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha del DatePicker al formato correcto para enviar al backend
 * Evita el problema de que se muestre un día antes
 */
export const formatDateForAPI = (date: Date | null): string => {
  if (!date) return '';
  
  // Usar la fecha local sin conversión a UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una cadena de fecha del backend a Date object
 * considerando la zona horaria UTC-6
 */
export const parseUTC6Date = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // Si la fecha viene en formato ISO, parsearlo directamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Si viene solo la fecha (YYYY-MM-DD), añadir hora local
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formatea una fecha para mostrar en la interfaz con zona horaria UTC-6
 */
export const formatDateForDisplay = (dateString: string, locale: string = 'es-MX'): string => {
  if (!dateString) return 'N/A';
  
  const date = parseUTC6Date(dateString);
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City' // UTC-6
  });
};

/**
 * Formatea una fecha corta para mostrar en tablas
 */
export const formatShortDate = (dateString: string, format: 'short' | 'dayMonth' = 'short', locale: string = 'es-MX'): string => {
  if (!dateString) return 'N/A';
  
  const date = parseUTC6Date(dateString);
  
  if (format === 'dayMonth') {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Mexico_City' // UTC-6
    });
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Mexico_City' // UTC-6
  });
};

/**
 * Obtiene la fecha actual en zona horaria UTC-6
 */
export const getCurrentUTC6Date = (): Date => {
  const now = new Date();
  // Ajustar a UTC-6
  const utc6Time = now.getTime() + (now.getTimezoneOffset() * 60000) - (6 * 60 * 60 * 1000);
  return new Date(utc6Time);
};

/**
 * Verifica si una fecha está en el pasado considerando UTC-6
 */
export const isDateInPast = (date: Date): boolean => {
  const today = getCurrentUTC6Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate < today;
};
