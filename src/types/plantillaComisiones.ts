// Tipos para la plantilla PAGO COMISIONES

export interface SolicitudComisionesData {
  id_solicitud: number;
  asunto: string;
  empresa: string; // Empresa que paga la comisión
  cliente: string; // Cliente o concepto de comisión
  monto: number;
  porcentaje_comision?: number;
  fecha_limite: string;
  periodo_comision?: string; // Periodo de la comisión (mensual, trimestral, etc.)
  archivos_adjuntos: unknown[];
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_creacion: string;
  usuario_actualizacion: string;
}

export interface PlantillaComisionesDetailModalProps {
  solicitud: SolicitudComisionesData | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingStateComisiones {
  archivos: boolean;
}

export interface ErrorStateComisiones {
  general: string | null;
  archivos: string | null;
}

export interface PlantillaComisionesModalProps {
  solicitud: SolicitudComisionesData;
  isOpen: boolean;
  onClose: () => void;
  loadingState?: LoadingStateComisiones;
  errorState?: ErrorStateComisiones;
}