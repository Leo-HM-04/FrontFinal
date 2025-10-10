// Tipos para la plantilla PAGO SUA FRENSHETSI

export interface SolicitudSuaFrenshetsiData {
  id_solicitud: number;
  asunto: string;
  empresa: string; // Siempre "FRENSHETSI"
  cliente: string;
  monto: number;
  fecha_limite: string;
  linea_captura: string;
  archivos_adjuntos: unknown[];
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_creacion: string;
  usuario_actualizacion: string;
  soporte_url?: string; // <-- Agregado para comprobante desde soporte_url
}

export interface PlantillaSuaFrenshetsiDetailModalProps {
  solicitud: SolicitudSuaFrenshetsiData | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingStateSuaFrenshetsi {
  archivos: boolean;
}

export interface ErrorStateSuaFrenshetsi {
  general: string | null;
  archivos: string | null;
}

export interface PlantillaSuaFrenshetsiModalProps {
  solicitud: SolicitudSuaFrenshetsiData;
  isOpen: boolean;
  onClose: () => void;
  loadingState?: LoadingStateSuaFrenshetsi;
  errorState?: ErrorStateSuaFrenshetsi;
}