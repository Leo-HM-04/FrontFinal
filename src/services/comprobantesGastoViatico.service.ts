export class ComprobantesGastoViaticoService {
  static async upload(id_viatico: number, file: File, token?: string) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('id_viatico', String(id_viatico));
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/comprobantes-gasto-viatico/`, {
      method: 'POST',
      body: formData,
      headers,
    });
    if (!res.ok) {
      const errorMessage = `Error al subir comprobante: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        throw new Error(errorData.error || errorMessage);
      } catch {
        throw new Error(errorMessage);
      }
    }
    return await res.json();
  }

  static async list(id_viatico: number, token?: string) {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/comprobantes-gasto-viatico/${id_viatico}`, {
      headers
    });
    if (!res.ok) {
      const errorMessage = `Error al obtener comprobantes: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        throw new Error(errorData.error || errorMessage);
      } catch {
        throw new Error(errorMessage);
      }
    }
    // Mapeo: si el backend devuelve id_comprobante_gasto o id_comprobante_gastos, lo renombramos a id_comprobante
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item) => ({
        ...item,
        id_comprobante: item.id_comprobante ?? item.id_comprobante_gasto ?? item.id_comprobante_gastos
      }));
    }
    return data;
  }

  static async delete(id_comprobante_gasto: number, token?: string) {
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/comprobantes-gasto-viatico/${id_comprobante_gasto}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const errorMessage = `Error al eliminar comprobante: ${res.status} ${res.statusText}`;
      try {
        const errorData = await res.json();
        throw new Error(errorData.error || errorMessage);
      } catch {
        throw new Error(errorMessage);
      }
    }
    return await res.json();
  }
}
