// Definir interfaces para los datos de SUA INTERNAS
export interface SolicitudSuaInternasData {
  id_solicitud?: number;
  folio?: string;
  asunto: string;
  empresa: string;
  monto: number;
  fecha_limite: string;
  linea_captura: string;
  archivos_adjuntos?: string[];
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
  estado?: string;
}

// Props para el modal de SUA INTERNAS
export interface PlantillaSuaInternasModalProps {
  solicitud: SolicitudSuaInternasData;
  isOpen: boolean;
  onClose: () => void;
}

// Estados de carga y error
export interface LoadingStateSuaInternas {
  archivos: boolean;
  general: boolean;
}

export interface ErrorStateSuaInternas {
  archivos: string | null;
  general: string | null;
}