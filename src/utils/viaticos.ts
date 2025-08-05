// Utilidades para viaticos
import { Solicitud, SolicitudEstado } from '@/types';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string | Date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('es-ES', { month: 'long' });
    const year = d.getFullYear();
    return `${day} de ${month.toLowerCase()} de ${year}`;
  } catch {
    return '-';
  }
}

export function getDepartmentColorClass(departamento: string) {
  const departamentosColores: Record<string, string> = {
    'Finanzas': 'px-3 py-1 text-sm font-medium rounded-lg bg-blue-100 text-blue-800',
    'Recursos Humanos': 'px-3 py-1 text-sm font-medium rounded-lg bg-purple-100 text-purple-800',
    'Marketing': 'px-3 py-1 text-sm font-medium rounded-lg bg-green-100 text-green-800',
    'Ventas': 'px-3 py-1 text-sm font-medium rounded-lg bg-orange-100 text-orange-800',
    'Operaciones': 'px-3 py-1 text-sm font-medium rounded-lg bg-teal-100 text-teal-800',
    'Tecnología': 'px-3 py-1 text-sm font-medium rounded-lg bg-indigo-100 text-indigo-800',
    'Administración': 'px-3 py-1 text-sm font-medium rounded-lg bg-pink-100 text-pink-800',
    'Logística': 'px-3 py-1 text-sm font-medium rounded-lg bg-amber-100 text-amber-800',
    'Proyectos': 'px-3 py-1 text-sm font-medium rounded-lg bg-cyan-100 text-cyan-800',
    'Legal': 'px-3 py-1 text-sm font-medium rounded-lg bg-red-100 text-red-800',
  };
  return departamentosColores[departamento] || 'px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-800';
}

export function normalizeViatico(v: Record<string, unknown>): Solicitud {
  return {
    ...v,
    id_solicitud: (v.id_viatico as number) ?? (v.id_solicitud as number) ?? 0,
    folio: (v.folio as string) ?? '',
    id_usuario: (v.id_usuario as number) ?? 0,
    departamento: (v.departamento as string) ?? '',
    monto: (v.monto as number) ?? 0,
    cuenta_destino: (v.cuenta_destino as string) ?? '',
    factura_url: (v.factura_url as string) ?? '',
    concepto: (v.concepto as string) ?? '',
    fecha_limite_pago: (v.fecha_limite_pago as string) ?? '',
    soporte_url: (v.soporte_url as string) ?? '',
    estado: (v.estado as SolicitudEstado) ?? 'pendiente',
    id_aprobador: (v.id_aprobador as number) ?? 0,
    comentario_aprobador: (v.comentario_aprobador as string) ?? '',
    fecha_revision: (v.fecha_revision as string) ?? '',
    fecha_creacion: (v.fecha_creacion as string) ?? (v.created_at as string) ?? '',
    updated_at: (v.updated_at as string) ?? '',
    usuario_nombre: (v.usuario_nombre as string) ?? '',
    aprobador_nombre: (v.aprobador_nombre as string) ?? '',
    tipo_pago: (v.tipo_pago as string) ?? 'viaticos',
    nombre_usuario: (v.nombre_usuario as string) ?? '',
    fecha_pago: (v.fecha_pago as string) ?? '',
    tipo_tarjeta: (v.tipo_tarjeta as string) ?? '',
    banco_destino: (v.banco_destino as string) ?? '',
  };
}
