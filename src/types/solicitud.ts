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
  fecha_limite_pago?: string;
  fecha_creacion?: string;
  updated_at?: string;
  id_pago?: number;
}
