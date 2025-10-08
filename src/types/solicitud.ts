export interface Solicitud {
  id_solicitud: number;
  id_usuario?: number;
  solicitante?: string;
  departamento: string;
  monto: number;
  concepto: string;
  fecha_aprobacion: string;
  estado: string;
  urgencia: string;
  metodo_pago?: string;
  banco_destino?: string;
  cuenta_destino?: string;
  factura_url?: string;
  soporte_url?: string; // URL del comprobante de pago
  fecha_limite_pago?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_pago?: string;
  updated_at?: string;
  id_pago?: number;
}
