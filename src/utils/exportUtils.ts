import { User, Solicitud } from '@/types';

export function exportToCSV<T>(data: T[], filename: string, columns: Array<{key: keyof T, label: string}>) {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      // Escapar comillas y envolver en comillas si contiene comas
      const stringValue = String(value || '').replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

export function exportToJSON<T>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

export function exportUsuariosToCSV(usuarios: User[]) {
  const columns = [
    { key: 'id_usuario' as keyof User, label: 'ID' },
    { key: 'nombre' as keyof User, label: 'Nombre' },
    { key: 'email' as keyof User, label: 'Email' },
    { key: 'rol' as keyof User, label: 'Rol' },
    { key: 'bloqueado' as keyof User, label: 'Bloqueado' },
    { key: 'created_at' as keyof User, label: 'Fecha Creación' }
  ];
  
  const processedData = usuarios.map(user => ({
    ...user,
    bloqueado: user.bloqueado ? 'Sí' : 'No',
    created_at: new Date(user.created_at).toLocaleDateString('es-CO')
  }));
  
  exportToCSV(processedData, `usuarios_${new Date().toISOString().split('T')[0]}`, columns);
}

export function exportSolicitudesToCSV(solicitudes: Solicitud[]) {
  const columns = [
    { key: 'id_solicitud' as keyof Solicitud, label: 'ID' },
    { key: 'departamento' as keyof Solicitud, label: 'Departamento' },
    { key: 'monto' as keyof Solicitud, label: 'Monto' },
    { key: 'cuenta_destino' as keyof Solicitud, label: 'Cuenta Destino' },
    { key: 'estado' as keyof Solicitud, label: 'Estado' },
    { key: 'concepto' as keyof Solicitud, label: 'Concepto' },
    { key: 'fecha_limite_pago' as keyof Solicitud, label: 'Fecha Límite' },
    { key: 'fecha_creacion' as keyof Solicitud, label: 'Fecha Creación' },
    { key: 'usuario_nombre' as keyof Solicitud, label: 'Solicitante' },
    { key: 'aprobador_nombre' as keyof Solicitud, label: 'Aprobador' }
  ];
  
  const processedData = solicitudes.map(solicitud => ({
    ...solicitud,
    monto: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(solicitud.monto),
    fecha_limite_pago: new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-CO'),
    fecha_creacion: new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO'),
    usuario_nombre: solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`,
    aprobador_nombre: solicitud.aprobador_nombre || (solicitud.id_aprobador ? `Usuario ${solicitud.id_aprobador}` : 'N/A')
  }));
  
  exportToCSV(processedData, `solicitudes_${new Date().toISOString().split('T')[0]}`, columns);
}

export function exportDetailedReport(usuarios: User[], solicitudes: Solicitud[]) {
  const stats = {
    resumen: {
      total_usuarios: usuarios.length,
      usuarios_activos: usuarios.filter(u => !u.bloqueado).length,
      usuarios_bloqueados: usuarios.filter(u => u.bloqueado).length,
      total_solicitudes: solicitudes.length,
      solicitudes_pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
      solicitudes_autorizadas: solicitudes.filter(s => s.estado === 'autorizada').length,
      solicitudes_rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length,
      monto_total_solicitado: solicitudes.reduce((sum, s) => sum + s.monto, 0),
      monto_autorizado: solicitudes.filter(s => s.estado === 'autorizada').reduce((sum, s) => sum + s.monto, 0)
    },
    usuarios_por_rol: {
      admin_general: usuarios.filter(u => u.rol === 'admin_general').length,
      solicitante: usuarios.filter(u => u.rol === 'solicitante').length,
      aprobador: usuarios.filter(u => u.rol === 'aprobador').length,
      pagador_banca: usuarios.filter(u => u.rol === 'pagador_banca').length
    },
    solicitudes_por_departamento: solicitudes.reduce((acc, s) => {
      acc[s.departamento] = (acc[s.departamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    fecha_generacion: new Date().toISOString()
  };

  exportToJSON(stats, `reporte_detallado_${new Date().toISOString().split('T')[0]}`);
}

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
