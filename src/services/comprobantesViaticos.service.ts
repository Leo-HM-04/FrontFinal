export async function subirComprobanteViatico(id_viatico: number, file: File, token?: string) {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('id_viatico', String(id_viatico));
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/comprobantes-viaticos/subir`, {
    method: 'POST',
    body: formData,
    headers,
  });
  if (!res.ok) throw new Error('Error al subir comprobante');
  return await res.json();
}

export async function getComprobantesPorViatico(id_viatico: number, token?: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/comprobantes-viaticos/${id_viatico}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Error al obtener comprobantes');
  return await res.json();
}
