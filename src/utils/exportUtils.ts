import { User, Solicitud } from '@/types';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

// Tipo para pagos procesados
export interface PagoProcesado {
  id_pago: number;
  id_solicitud: number;
  solicitante: string;
  departamento: string;
  monto: number;
  concepto: string;
  fecha_aprobacion: string;
  fecha_pago: string;
  estado: string;
  urgencia: string;
  metodo_pago: string;
  banco_destino: string;
  cuenta_destino: string;
  comprobante_id: string;
}

// Helper function for file downloads
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType }) 
    : content;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.setAttribute('target', '_blank'); // Asegurarse que se abra en nueva pestaña
  document.body.appendChild(link);
  setTimeout(() => { // Usar setTimeout para asegurar que el navegador tenga tiempo de procesar
    link.click();
    setTimeout(() => { // Limpiar después de la descarga
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Liberar la URL para evitar fugas de memoria
    }, 100);
  }, 0);
}

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

export function exportToJSON<T>(data: T, filename: string) {
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
    { key: 'creado_en' as keyof User, label: 'Fecha Creación' }
  ];
  
  const processedData = usuarios.map(user => ({
    ...user,
    bloqueado: user.bloqueado ? 'Sí' : 'No',
    creado_en: new Date(user.creado_en).toLocaleDateString('es-CO')
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
    aprobador_nombre: solicitud.aprobador_nombre ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
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

// Funciones para exportación de pagos procesados
export function exportPagosToCSV(pagos: PagoProcesado[]) {
  const columns = [
    { key: 'id_pago' as keyof PagoProcesado, label: 'ID Pago' },
    { key: 'id_solicitud' as keyof PagoProcesado, label: 'ID Solicitud' },
    { key: 'solicitante' as keyof PagoProcesado, label: 'Solicitante' },
    { key: 'departamento' as keyof PagoProcesado, label: 'Departamento' },
    { key: 'monto' as keyof PagoProcesado, label: 'Monto' },
    { key: 'concepto' as keyof PagoProcesado, label: 'Concepto' },
    { key: 'fecha_pago' as keyof PagoProcesado, label: 'Fecha Pago' },
    { key: 'estado' as keyof PagoProcesado, label: 'Estado' },
    { key: 'urgencia' as keyof PagoProcesado, label: 'Urgencia' },
    { key: 'metodo_pago' as keyof PagoProcesado, label: 'Método de Pago' },
    { key: 'banco_destino' as keyof PagoProcesado, label: 'Banco Destino' },
    { key: 'cuenta_destino' as keyof PagoProcesado, label: 'Cuenta Destino' },
    { key: 'comprobante_id' as keyof PagoProcesado, label: 'Comprobante ID' }
  ];
  
  const processedData = pagos.map(pago => ({
    ...pago,
    monto: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(pago.monto),
    fecha_pago: new Date(pago.fecha_pago).toLocaleDateString('es-CO')
  }));
  
  exportToCSV(processedData, `pagos_procesados_${new Date().toISOString().split('T')[0]}`, columns);
}

export function exportPagosToExcel(pagos: PagoProcesado[]) {
  const columns = [
    { key: 'id_pago' as keyof PagoProcesado, label: 'ID Pago' },
    { key: 'id_solicitud' as keyof PagoProcesado, label: 'ID Solicitud' },
    { key: 'solicitante' as keyof PagoProcesado, label: 'Solicitante' },
    { key: 'departamento' as keyof PagoProcesado, label: 'Departamento' },
    { key: 'monto' as keyof PagoProcesado, label: 'Monto' },
    { key: 'concepto' as keyof PagoProcesado, label: 'Concepto' },
    { key: 'fecha_pago' as keyof PagoProcesado, label: 'Fecha Pago' },
    { key: 'estado' as keyof PagoProcesado, label: 'Estado' },
    { key: 'urgencia' as keyof PagoProcesado, label: 'Urgencia' },
    { key: 'metodo_pago' as keyof PagoProcesado, label: 'Método de Pago' },
    { key: 'banco_destino' as keyof PagoProcesado, label: 'Banco Destino' },
    { key: 'cuenta_destino' as keyof PagoProcesado, label: 'Cuenta Destino' },
    { key: 'comprobante_id' as keyof PagoProcesado, label: 'Comprobante ID' }
  ];
  
  const processedData = pagos.map(pago => ({
    ...pago,
    monto: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(pago.monto),
    fecha_pago: new Date(pago.fecha_pago).toLocaleDateString('es-CO')
  }));
  
  exportToExcel(processedData, `pagos_procesados_${new Date().toISOString().split('T')[0]}`, columns);
}

export function exportPagosToPDF(pagos: PagoProcesado[]) {
  const columns = [
    { key: 'id_pago' as keyof PagoProcesado, label: 'ID Pago' },
    { key: 'solicitante' as keyof PagoProcesado, label: 'Solicitante' },
    { key: 'departamento' as keyof PagoProcesado, label: 'Departamento' },
    { key: 'monto' as keyof PagoProcesado, label: 'Monto' },
    { key: 'concepto' as keyof PagoProcesado, label: 'Concepto' },
    { key: 'fecha_pago' as keyof PagoProcesado, label: 'Fecha Pago' },
    { key: 'banco_destino' as keyof PagoProcesado, label: 'Banco' },
    { key: 'comprobante_id' as keyof PagoProcesado, label: 'Comprobante' }
  ];
  
  const processedData = pagos.map(pago => ({
    ...pago,
    monto: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(pago.monto),
    fecha_pago: new Date(pago.fecha_pago).toLocaleDateString('es-CO')
  }));
  
  exportToPDF(processedData, `pagos_procesados_${new Date().toISOString().split('T')[0]}`, columns, 'HISTORIAL DE PAGOS PROCESADOS');
}

export function exportToExcel<T>(data: T[], filename: string, columns: Array<{key: keyof T, label: string}>) {
  // Crear el libro y la hoja
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Agregar encabezados
  worksheet.addRow(columns.map(col => col.label));

  // Agregar datos
  data.forEach(item => {
    worksheet.addRow(columns.map(col => item[col.key]));
  });

  // Ajustar ancho de columnas automáticamente
  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = Math.max(
      col.label.length,
      ...data.map(item => String(item[col.key] || '').length)
    ) + 2;
  });

  // Generar y descargar el archivo Excel
  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
}

export function exportToPDF<T>(data: T[], filename: string, columns: Array<{key: keyof T, label: string}>, title: string) {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add the title
  pdf.setFontSize(18);
  pdf.text(title, 14, 22);
  
  // Add the date
  pdf.setFontSize(11);
  pdf.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
  
  // No intentamos añadir marca de agua ya que causa problemas con las rutas de imágenes
  // Simplemente continuamos generando el PDF sin marca de agua
  const addHeader = () => {
    try {
      // Añadir encabezado de texto en lugar de imagen
      pdf.setFontSize(14);
      pdf.setTextColor(0, 53, 128); // Color azul corporativo
      pdf.text("BECHAPRA", pdf.internal.pageSize.width / 2, 15, { align: 'center' });
    } catch (error) {
      console.error('Error adding header:', error);
    }
  };
  
  // Call the header function
  addHeader();
  
  // Add the table
  autoTable(pdf, {
    head: [columns.map(col => col.label)],
    body: data.map(item => {
      return columns.map(col => String(item[col.key] || ''));
    }),
    startY: 40,
    styles: { overflow: 'linebreak', cellWidth: 'auto' },
    headStyles: { fillColor: [0, 53, 128], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 40 },
  });
  
  // Add footer
  const totalPages = pdf.getNumberOfPages();
  pdf.setFontSize(10);
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(`Página ${i} de ${totalPages}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
    pdf.text('© BECHAPRA - Plataforma de Pagos', 14, pdf.internal.pageSize.getHeight() - 10);
  }
  
  // Download the PDF
  pdf.save(`${filename}.pdf`);
}

export function exportSolicitudesToExcel(solicitudes: Solicitud[]) {
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
    aprobador_nombre: solicitud.aprobador_nombre ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
  }));
  
  exportToExcel(processedData, `solicitudes_${new Date().toISOString().split('T')[0]}`, columns);
}

export function exportSolicitudesToPDF(solicitudes: Solicitud[]) {
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
    aprobador_nombre: solicitud.aprobador_nombre ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
  }));
  
  exportToPDF(processedData, `solicitudes_${new Date().toISOString().split('T')[0]}`, columns, 'Reporte de Solicitudes');
}
