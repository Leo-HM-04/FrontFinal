import api from '@/lib/api';

export interface SolicitudArchivo {
  id: number;
  id_solicitud: number;
  archivo_url: string;
  tipo: string;
  fecha_subida: string;
}

export class SolicitudArchivosService {
  // Subir múltiples archivos en un solo request usando la clave 'archivos'
  static async subirArchivos(
    id_solicitud: number,
    archivos: File[],
    tipos?: string[]
  ): Promise<{ archivos: SolicitudArchivo[] }> {
    console.log('🚀 FRONTEND subirArchivos - Inicio (envío múltiple)');
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('id_solicitud', id_solicitud.toString());
    archivos.forEach((archivo, i) => {
      formData.append('archivos', archivo);
      if (tipos && tipos[i]) {
        formData.append('tipos', tipos[i]);
      }
    });
    // Log para depuración: mostrar el contenido del FormData
    for (const pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`📝 FormData: ${pair[0]} = [File] ${pair[1].name}`);
      } else {
        console.log(`📝 FormData: ${pair[0]} = ${pair[1]}`);
      }
    }
    try {
      const response = await api.post('/solicitud-archivos/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      console.log('📥 FRONTEND respuesta recibida:', response.data);
      return { archivos: response.data.archivos || [] };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // @ts-expect-error: error.response puede existir en errores de axios
        console.error('❌ Error al subir archivos:', error.response?.data);
      } else {
        console.error('❌ Error al subir archivos:', error);
      }
      throw error;
    }
  }
  
  // Obtener archivos de una solicitud
  static async obtenerArchivos(id_solicitud: number): Promise<SolicitudArchivo[]> {
    const token = localStorage.getItem('token');

    const response = await api.get<SolicitudArchivo[]>(`/solicitud-archivos/${id_solicitud}`, {
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
