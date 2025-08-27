import api from '@/lib/api';

export interface SolicitudArchivo {
  id: number;
  solicitud_id: number;
  archivo_url: string;
  tipo: string;
  fecha_subida: string;
}

export class SolicitudArchivosService {
  // Subir múltiples archivos (uno por uno, usando la clave 'archivo')
  static async subirArchivos(
    solicitud_id: number,
    archivos: File[],
    tipos?: string[]
  ): Promise<{ archivos: SolicitudArchivo[] }> {
    console.log('🚀 FRONTEND subirArchivos - Inicio');
    const token = localStorage.getItem('token');
    const resultados: SolicitudArchivo[] = [];
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const formData = new FormData();
      formData.append('solicitud_id', solicitud_id.toString());
      formData.append('archivo', archivo);
      if (tipos && tipos[i]) {
        formData.append('tipo', tipos[i]);
      }
      console.log(`� Enviando archivo ${i + 1}:`, archivo.name);
      const response = await api.post('/solicitud-archivos/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      console.log('📥 FRONTEND respuesta recibida:', response.data);
      if (response.data && response.data.archivos && response.data.archivos[0]) {
        resultados.push(response.data.archivos[0]);
      }
    }
    return { archivos: resultados };
  }
  
  // Obtener archivos de una solicitud
  static async obtenerArchivos(solicitud_id: number): Promise<SolicitudArchivo[]> {
    const token = localStorage.getItem('token');
    
    const response = await api.get<SolicitudArchivo[]>(`/solicitud-archivos/${solicitud_id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
  
  // Eliminar un archivo
  static async eliminarArchivo(id: number): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    
    const response = await api.delete(`/solicitud-archivos/archivo/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
  
  // Actualizar tipo de archivo
  static async actualizarTipoArchivo(id: number, tipo: string): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    
    const response = await api.put(`/solicitud-archivos/archivo/${id}/tipo`, { tipo }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
  
  // Obtener URL de descarga
  static getUrlDescarga(id: number): string {
    return `/api/solicitud-archivos/descargar/${id}`;
  }
}
