/**
 * Tipos específicos para la plantilla de Pago de Servicios Internos
 * 
 * @version 1.0.0
 * @created 2025-10-27
 */

/**
 * Datos específicos de la plantilla de Servicios Internos
 */
export interface DatosServiciosInternos {
  /** Descripción detallada del servicio interno a pagar */
  descripcion_pago: string;
  
  /** Monto total del pago del servicio interno */
  monto: number;
  
  /** Fecha límite para realizar el pago */
  fecha_limite_pago: string;
  
  /** Archivos de soporte opcionales */
  documentos?: File[] | string[];
}

/**
 * Validaciones específicas para Servicios Internos
 */
export interface ValidacionesServiciosInternos {
  descripcion_pago: {
    minLength: 20;
    maxLength: 1000;
    required: true;
  };
  monto: {
    min: 0.01;
    required: true;
  };
  fecha_limite_pago: {
    required: true;
    futureDate: true;
  };
  documentos: {
    required: false;
    maxFiles: 10;
    maxSize: number; // 25MB
    allowedTypes: string[];
  };
}

/**
 * Configuración específica para la plantilla de Servicios Internos
 */
export interface ConfiguracionServiciosInternos {
  /** Categorías de servicios internos permitidas */
  categoriasServicio: string[];
  
  /** Departamentos que pueden solicitar servicios internos */
  departamentosPermitidos: string[];
  
  /** Monto máximo permitido sin autorización adicional */
  montoMaximoSinAutorizacion: number;
  
  /** Días mínimos de anticipación para la fecha límite */
  diasMinimosAnticipacion: number;
}

/**
 * Constantes para la plantilla de Servicios Internos
 */
export const SERVICIOS_INTERNOS_CONFIG: ConfiguracionServiciosInternos = {
  categoriasServicio: [
    'Consultoría Interna',
    'Servicios de TI',
    'Servicios Administrativos',
    'Capacitación Interna',
    'Soporte Técnico',
    'Servicios de Diseño',
    'Servicios Legales Internos',
    'Otros Servicios Internos'
  ],
  departamentosPermitidos: [
    'Administración',
    'Finanzas',
    'Recursos Humanos',
    'TI',
    'Marketing',
    'Operaciones',
    'Legal',
    'Tesorería'
  ],
  montoMaximoSinAutorizacion: 50000, // $50,000 MXN
  diasMinimosAnticipacion: 3
};

/**
 * Tipos de archivos permitidos para documentos de soporte
 */
export const TIPOS_ARCHIVOS_PERMITIDOS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpg',
  '.jpeg',
  '.png'
];

/**
 * Mensajes de validación específicos
 */
export const MENSAJES_VALIDACION = {
  descripcion_pago: {
    required: 'La descripción del pago es obligatoria',
    minLength: 'La descripción debe tener al menos 20 caracteres',
    maxLength: 'La descripción no puede exceder 1000 caracteres'
  },
  monto: {
    required: 'El monto es obligatorio',
    min: 'El monto debe ser mayor a 0',
    max: 'El monto excede el límite permitido'
  },
  fecha_limite_pago: {
    required: 'La fecha límite de pago es obligatoria',
    futureDate: 'La fecha límite debe ser futura',
    minDays: 'La fecha límite debe ser al menos 3 días en el futuro'
  },
  documentos: {
    maxFiles: 'No se pueden adjuntar más de 10 archivos',
    maxSize: 'El archivo excede el tamaño máximo permitido (25MB)',
    invalidType: 'Tipo de archivo no permitido'
  }
};

/**
 * Utilidades para formateo de datos
 */
export const formatearMontoServiciosInternos = (monto: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(monto);
};

export const formatearFechaLimite = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};