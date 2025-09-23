// Types específicos para la plantilla Tarjetas TUKASH

export interface SolicitudTukashData {
  id_solicitud?: number;
  // Información Básica
  asunto: string;
  cliente: string;
  beneficiario_tarjeta: string;
  
  // Datos de Tarjeta
  numero_tarjeta: string;
  
  // Montos
  monto_total_cliente: number | string;
  monto_total_tukash: number | string;
  
  // Campos del sistema
  estado?: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}

export interface SolicitudTukashArchivo {
  id_archivo: number;
  id_solicitud_tukash: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_archivo: number;
  fecha_subida?: string;
}

export interface PlantillaTukashModalProps {
  solicitud: SolicitudTukashData;
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingStateTukash {
  archivos: boolean;
  general: boolean;
}

export interface ErrorStateTukash {
  archivos: string | null;
  general: string | null;
}