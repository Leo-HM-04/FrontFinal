import { api } from '../lib/api';

export const getPagosPendientes = async () => {
  // Solo trae solicitudes autorizadas para pagador
  const res = await api.get('/solicitudes?estado=autorizada');
  return res.data;
};

export const marcarPagoComoPagado = async (id_solicitud: number) => {
  // PUT /solicitudes/:id/pagar
  const res = await api.put(`/solicitudes/${id_solicitud}/pagar`);
  return res.data;
};

export async function subirComprobante(id_solicitud: number, file: File) {
  const formData = new FormData();
  formData.append('comprobante', file);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes/${id_solicitud}/comprobante`, {
    method: 'PUT',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al subir comprobante');
  return await res.json();
}

export const getPagosPagados = async () => {
  // Trae solicitudes marcadas como pagadas
  const res = await api.get('/solicitudes/pagadas');
  return res.data;
};

export const getSolicitudesAutorizadas = async () => {
  // Trae solicitudes autorizadas
  const res = await api.get('/solicitudes?estado=autorizada');
  return res.data;
};
