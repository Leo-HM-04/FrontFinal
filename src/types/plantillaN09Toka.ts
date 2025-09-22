import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';

export interface SolicitudN09Toka {
  id_solicitud: number;
  id_solicitud_principal?: number;
  id_usuario: number;
  asunto: string;
  proveedor?: string;
  cliente: string;
  beneficiario: string;
  tipo_cuenta_clabe: string;
  numero_cuenta_clabe: string;
  banco_destino: string;
  monto: number;
  tipo_moneda: string;
  fecha_limite_pago?: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario_creacion?: string;
  usuario_actualizacion?: string;
}

export interface SolicitudN09TokaArchivo {
  id_archivo: number;
  id_solicitud_n09_toka: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamaño_archivo: number;
  fecha_subida: string;
  usuario_subida: string;
}

export interface PlantillaN09TokaModalProps {
  solicitud: SolicitudN09TokaData;
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingStateN09Toka {
  archivos: boolean;
  general: boolean;
}

export interface ErrorStateN09Toka {
  archivos: string | null;
  general: string | null;
}