import api from '@/lib/api';

export interface SolicitudArchivo {
  id: number;
  solicitud_id: number;
  archivo_url: string;
  tipo: string;
  fecha_subida: string;
}

export class SolicitudArchivosService {
  // Subir múltiples archivos
  static async subirArchivos(
    solicitud_id: number, 
    archivos: File[], 
    tipos?: string[]
  ): Promise<{ archivos: SolicitudArchivo[] }> {
    console.log('🚀 FRONTEND subirArchivos - Inicio');
    console.log('📋 FRONTEND solicitud_id:', solicitud_id);
    console.log('📋 FRONTEND archivos recibidos:', archivos);
    console.log('📋 FRONTEND archivos length:', archivos.length);
    console.log('📋 FRONTEND tipos recibidos:', tipos);
    
    const token = localStorage.getItem('token');
    console.log('📋 FRONTEND token existe:', !!token);
    
    const formData = new FormData();
    
    formData.append('solicitud_id', solicitud_id.toString());
    console.log('📋 FRONTEND solicitud_id agregado:', solicitud_id.toString());
    
    // Agregar cada archivo
    archivos.forEach((archivo, index) => {
      console.log(`📄 FRONTEND agregando archivo ${index + 1}:`, {
        name: archivo.name,
        size: archivo.size,
        type: archivo.type
      });
      
      formData.append('archivos', archivo);
      
      if (tipos && tipos[index]) {
        console.log(`📄 FRONTEND agregando tipo ${index + 1}:`, tipos[index]);
        formData.append(`tipo_archivos`, tipos[index]);
      }
    });
    
    // Debug: mostrar todo el FormData
    console.log('📋 FRONTEND FormData entries:');
    for (let pair of formData.entries()) {
      console.log(`📋 ${pair[0]}:`, pair[1]);
    }
    
    console.log('📤 FRONTEND enviando request a:', '/solicitud-archivos/subir');
    
    const response = await api.post('/solicitud-archivos/subir', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('📥 FRONTEND respuesta recibida:', response.data);
    
    return response.data;
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
