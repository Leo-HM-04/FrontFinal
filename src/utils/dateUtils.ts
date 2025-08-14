/**
 * Utilidades para manejo de fechas con zona horaria UTC-6 (México)
 */

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
 * Sin conversiones de zona horaria innecesarias
 */
export const parseUTC6Date = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // Si la fecha viene en formato ISO, parsearlo directamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Si viene solo la fecha (YYYY-MM-DD), crear fecha local
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formatea una fecha para mostrar en la interfaz
 */
export const formatDateForDisplay = (dateString: string, locale: string = 'es-MX'): string => {
  if (!dateString) return 'N/A';
  
  const date = parseUTC6Date(dateString);
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
      month: '2-digit'
    });
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Obtiene la fecha actual sin conversiones de zona horaria
 */
export const getCurrentUTC6Date = (): Date => {
  return new Date();
};

/**
 * Verifica si una fecha está en el pasado
 */
export const isDateInPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  return compareDate < today;
};
