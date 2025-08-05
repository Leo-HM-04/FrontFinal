export type UserRole = 'admin_general' | 'solicitante' | 'aprobador' | 'pagador_banca';

export interface User {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: UserRole;
  intentos_fallidos: number;
  bloqueado: boolean;
  activo: boolean; // ✅ AGREGAR ESTA LÍNEA
  bloqueo_temporal_fin?: string;
  bloqueo_temporal_activado: boolean;
  creado_en: string; // Cambiado a DataTransfer para manejar fechas
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export type SolicitudEstado = 'pendiente' | 'autorizada' | 'rechazada' | 'pagada';

export interface Solicitud {
  tipo_cuenta_destino?: string;
  id_solicitud: number;
  folio?: string;
  id_usuario: number;
  departamento: string;
  monto: number;
  cuenta_destino: string;
  factura_url: string;
  concepto: string;
  fecha_limite_pago: string;
  soporte_url?: string;
  estado: SolicitudEstado;
  id_aprobador?: number;
  comentario_aprobador?: string;
  fecha_revision?: string;
  fecha_creacion: string;
  updated_at: string;
  usuario_nombre?: string;
  aprobador_nombre?: string;
  tipo_pago?: string; // <-- agregado para edición
  nombre_usuario?: string; // <-- Campo agregado
  fecha_pago?: string; // <-- Campo agregado para historial
  tipo_tarjeta?: string;
  banco_destino?: string;
  viatico_url?: string;
  tipo_pago_descripcion?: string;
  empresa_a_pagar?: string;
  nombre_persona?: string;
}

export interface CreateSolicitudData {
  departamento: string;
  monto: number;
  cuenta_destino: string;
  factura_url: string;
  concepto: string;
  fecha_limite_pago: string;
  soporte_url?: string;
}

export interface UpdateEstadoData {
  estado: 'autorizada' | 'rechazada';
  comentario_aprobador?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export type EstadoRecurrente = 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';

export interface PlantillaRecurrente {
  folio?: string;
  fact_recurrente?: string; // Ruta del archivo de factura (opcional)
  id_recurrente: number;
  id_usuario: number;
  departamento: string;
  monto: number;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_pago_descripcion?: string;
  empresa_a_pagar?: string;
  nombre_persona?: string;
  tipo_cuenta_destino?: string;
  tipo_tarjeta?: string;
  banco_destino?: string;
  frecuencia: string;
  siguiente_fecha: string;
  estado: EstadoRecurrente;
  created_at: string;
  updated_at: string;
  nombre_usuario?: string; // opcional si lo agregas por JOIN
  nombre_aprobador?: string;
  nombre_pagador?: string;
  id_aprobador?: number;
  id_pagador?: number;
  comentario_aprobador?: string;
  activo: boolean; // indica si la plantilla está activa o pausada
  com_recurrente?: string; // Ruta del comprobante de pago (opcional)
}