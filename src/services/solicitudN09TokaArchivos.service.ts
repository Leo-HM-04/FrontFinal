interface SolicitudArchivo {
  id_archivo: number;
  id_solicitud: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_archivo: number;
  fecha_subida: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface SolicitudN09TokaArchivo {
  id_archivo: number;
  id_solicitud_n09_toka: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: string;
  tamano_archivo: number;
  fecha_subida: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: SolicitudN09TokaArchivo[];
  error?: string;
}

interface GetArchivosResponse {
  success: boolean;
  data: SolicitudN09TokaArchivo[];
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  message: string;
  error?: string;
}

class SolicitudN09TokaArchivosService {
  
  // 📤 Subir archivos a solicitud N09/TOKA
  static async subirArchivos(
    idSolicitudN09Toka: number, 
    archivos: File[], 
    tiposArchivos?: string[]
  ): Promise<UploadResponse> {
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      
      // Agregar archivos
      archivos.forEach((archivo) => {
        formData.append('archivos', archivo);
      });
      
      // Agregar tipos de archivos si se proporcionan
      if (tiposArchivos && tiposArchivos.length === archivos.length) {
        tiposArchivos.forEach((tipo) => {
          formData.append('tipos_archivos', tipo);
        });
      }
      
      console.log('📤 Subiendo archivos N09/TOKA:', {
        idSolicitud: idSolicitudN09Toka,
        cantidadArchivos: archivos.length,
        tiposArchivos
      });
      
      const response = await fetch(
        `${API_URL}/solicitudes-n09-toka-archivos/${idSolicitudN09Toka}/archivos`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );
      
      const result: UploadResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al subir archivos');
      }
      
      console.log('✅ Archivos N09/TOKA subidos exitosamente:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error subiendo archivos N09/TOKA:', error);
      throw error;
    }
  }
  
  // 📋 Obtener archivos de solicitud N09/TOKA
  static async obtenerArchivos(idSolicitudN09Toka: number): Promise<SolicitudN09TokaArchivo[]> {
    try {
      const token = localStorage.getItem('token');
      
      console.log('📋 Obteniendo archivos N09/TOKA para solicitud:', idSolicitudN09Toka);
      
      const response = await fetch(
        `${API_URL}/solicitudes-n09-toka-archivos/${idSolicitudN09Toka}/archivos`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result: GetArchivosResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al obtener archivos');
      }
      
      console.log('✅ Archivos N09/TOKA obtenidos:', result.data?.length || 0);
      return result.data || [];
      
    } catch (error) {
      console.error('❌ Error obteniendo archivos N09/TOKA:', error);
      throw error;
    }
  }
  
  // 🗑️ Eliminar archivo específico
  static async eliminarArchivo(idArchivo: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🗑️ Eliminando archivo N09/TOKA:', idArchivo);
      
      const response = await fetch(
        `${API_URL}/solicitudes-n09-toka-archivos/archivos/${idArchivo}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result: DeleteResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar archivo');
      }
      
      console.log('✅ Archivo N09/TOKA eliminado exitosamente');
      
    } catch (error) {
      console.error('❌ Error eliminando archivo N09/TOKA:', error);
      throw error;
    }
  }
  
  // 🔄 Convertir archivo N09/TOKA a formato estándar para compatibilidad
  static convertToSolicitudArchivo(archivoN09Toka: SolicitudN09TokaArchivo): SolicitudArchivo {
    return {
      id_archivo: archivoN09Toka.id_archivo,
      id_solicitud: archivoN09Toka.id_solicitud_n09_toka, // mapeo de campo
      nombre_archivo: archivoN09Toka.nombre_archivo,
      ruta_archivo: archivoN09Toka.ruta_archivo,
      tipo_archivo: archivoN09Toka.tipo_archivo,
      tamano_archivo: archivoN09Toka.tamano_archivo,
      fecha_subida: archivoN09Toka.fecha_subida
    };
  }
  
  // 🔄 Convertir múltiples archivos N09/TOKA a formato estándar
  static convertArrayToSolicitudArchivos(archivosN09Toka: SolicitudN09TokaArchivo[]): SolicitudArchivo[] {
    return archivosN09Toka.map(archivo => this.convertToSolicitudArchivo(archivo));
  }
}

export default SolicitudN09TokaArchivosService;
export type { SolicitudN09TokaArchivo, UploadResponse, GetArchivosResponse, DeleteResponse };