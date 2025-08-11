export async function subirComprobanteViatico(id_viatico: number, file: File, token?: string) {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('id_viatico', String(id_viatico));
  
  // When sending FormData, don't set Content-Type header - browser will set it with proper boundary
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/comprobantes-viaticos/subir`, {
    method: 'POST',
    body: formData,
    headers,
  });
  
  if (!res.ok) {
    // Try to get error message from response
    const errorMessage = `Error al subir comprobante: ${res.status} ${res.statusText}`;
    
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || errorMessage);
    } catch {
      // If we can't parse the error as JSON, just use the status code
      throw new Error(errorMessage);
    }
  }
  
  return await res.json();
}

export async function getComprobantesPorViatico(id_viatico: number, token?: string) {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://46.202.177.106:4000"}/api/comprobantes-viaticos/${id_viatico}`, {
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
  
  return await res.json();
}
