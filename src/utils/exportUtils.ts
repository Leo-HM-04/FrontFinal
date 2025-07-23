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

  // Calcular tendencia de pagos por tipo de pago
  const pagosPorTipo: Record<string, { cantidad: number; total: number }> = {};
  solicitudes.forEach(s => {
    const tipo = s.tipo_pago || 'Sin tipo';
    if (!pagosPorTipo[tipo]) pagosPorTipo[tipo] = { cantidad: 0, total: 0 };
    pagosPorTipo[tipo].cantidad++;
    pagosPorTipo[tipo].total += s.monto;
  });

  // Crear resumen para el CSV
  let resumen = 'Tendencia de pagos por tipo:\n';
  Object.entries(pagosPorTipo).forEach(([tipo, info]) => {
    resumen += `${tipo}: ${info.cantidad} pago(s), Total: $${info.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} mxn\n`;
  });

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
    aprobador_nombre: solicitud.aprobador_nombre && solicitud.aprobador_nombre !== 'N/A' ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
  }));

  // Exportar CSV con resumen al inicio
  const headers = columns.map(col => col.label).join(',');
  const rows = processedData.map(item => 
    columns.map(col => {
      const value = item[col.key];
      const stringValue = String(value || '').replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    }).join(',')
  );
  const csvContent = [resumen, headers, ...rows].join('\n');
  downloadFile(csvContent, `solicitudes_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
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

  // Calcular tendencia de pagos por tipo de pago
  const pagosPorTipo: Record<string, { cantidad: number; total: number }> = {};
  solicitudes.forEach(s => {
    const tipo = s.tipo_pago || 'Sin tipo';
    if (!pagosPorTipo[tipo]) pagosPorTipo[tipo] = { cantidad: 0, total: 0 };
    pagosPorTipo[tipo].cantidad++;
    pagosPorTipo[tipo].total += s.monto;
  });

  // Crear resumen para Excel (como hoja extra)
  const resumenRows = [['Tendencia de pagos por tipo']];
  Object.entries(pagosPorTipo).forEach(([tipo, info]) => {
    resumenRows.push([`${tipo}: ${info.cantidad} pago(s), Total: $${info.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} mxn`]);
  });

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
    aprobador_nombre: solicitud.aprobador_nombre && solicitud.aprobador_nombre !== 'N/A' ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
  }));

  // Exportar Excel con hoja de resumen
  const workbook = new ExcelJS.Workbook();
  const resumenSheet = workbook.addWorksheet('Resumen');
  resumenRows.forEach(row => resumenSheet.addRow(row));
  const dataSheet = workbook.addWorksheet('Solicitudes');
  dataSheet.addRow(columns.map(col => col.label));
  processedData.forEach(item => {
    dataSheet.addRow(columns.map(col => item[col.key]));
  });
  workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `solicitudes_${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
}

// Utilidad para convertir imagen URL a base64
async function getImageBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportSolicitudesToPDF(solicitudes: Solicitud[]) {
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
    { key: 'usuario_nombre' as keyof Solicitud, label: 'Aprobador' }
  ];

  // Calcular tendencia de pagos por tipo de pago
  const pagosPorTipo: Record<string, { cantidad: number; total: number }> = {};
  solicitudes.forEach(s => {
    const tipo = s.tipo_pago || 'Sin tipo';
    if (!pagosPorTipo[tipo]) pagosPorTipo[tipo] = { cantidad: 0, total: 0 };
    pagosPorTipo[tipo].cantidad++;
    pagosPorTipo[tipo].total += s.monto;
  });

  // Crear resumen para PDF
  let resumen = 'Tendencia de pagos por tipo:\n';
  Object.entries(pagosPorTipo).forEach(([tipo, info]) => {
    resumen += `${tipo}: ${info.cantidad} pago(s), Total: $${info.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} mxn\n`;
  });

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
    aprobador_nombre: solicitud.aprobador_nombre && solicitud.aprobador_nombre !== 'N/A' ? solicitud.aprobador_nombre : (solicitud.id_aprobador ? `Aprobador ${solicitud.id_aprobador}` : 'N/A')
  }));

  // Exportar PDF con resumen al inicio, como bloque destacado
  // PDF en orientación horizontal (landscape)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  // Encabezado profesional con logo en la esquina superior izquierda
  doc.setFillColor(18, 61, 140); // Azul corporativo
  doc.roundedRect(0, 0, pageWidth, 36, 8, 8, 'F');
  // Logo en la esquina superior izquierda
  const logoUrl = 'https://media.licdn.com/dms/image/v2/D4E0BAQEEoooIoWmBfw/company-logo_200_200/company-logo_200_200/0/1734988712036/bechapra_logo?e=2147483647&v=beta&t=Zud09Nh9JmjqB47tZ4cPzFAN9NtiyXWDqvlyqqRZAV0';
  const imgWidth = 28;
  const imgHeight = 28;
  const logoX = 8;
  const logoY = 4;
  let logoBase64 = '';
  try {
    logoBase64 = await getImageBase64(logoUrl);
    doc.addImage(logoBase64, 'PNG', logoX, logoY, imgWidth, imgHeight);
  } catch {
    // Si falla, no muestra logo
  }
  // Título y subtítulo alineados a la izquierda, con detalles visuales
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BECHAPRA', logoX + imgWidth + 8, logoY + 10);
  doc.setFontSize(14);
  doc.text('Reporte de Solicitudes', logoX + imgWidth + 8, logoY + 22);
  // Línea decorativa bajo el encabezado
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.2);
  doc.line(logoX, 36, pageWidth - 8, 36);
  // Fecha de exportación alineada a la derecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - 14, logoY + 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Resumen de tendencia de pagos con icono y fondo suave, ajustado a landscape
  const resumenLines = resumen.trim().split('\n');
  const resumenY = logoY + imgHeight + 16;
  const resumenBoxWidth = pageWidth - 24;
  doc.setFillColor(240, 245, 255);
  doc.roundedRect(12, resumenY - 8, resumenBoxWidth, resumenLines.length * 8 + 14, 4, 4, 'F');
  // Icono de tendencia (flecha)
  doc.setDrawColor(18, 61, 140);
  doc.setLineWidth(1.2);
  doc.line(18, resumenY, 24, resumenY - 6); // flecha arriba
  doc.line(24, resumenY - 6, 24, resumenY + 6); // palo
  doc.line(24, resumenY + 6, 18, resumenY); // flecha abajo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(18, 61, 140);
  doc.text('Tendencia de pagos por tipo:', 30, resumenY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  resumenLines.slice(1).forEach((line, idx) => {
    doc.text(line, 30, resumenY + 10 + idx * 8);
  });

  // Tabla de solicitudes con estilos profesionales y ancho ajustado
  const tableColumns = columns.map(col => col.label);
  const tableRows = processedData.map(item => columns.map(col => String(item[col.key] ?? '')));
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: resumenY + resumenLines.length * 8 + 18,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 61, 140],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 12,
      halign: 'center',
      valign: 'middle',
      cellPadding: 4,
      lineWidth: 0.5,
      lineColor: [18, 61, 140],
      font: 'helvetica'
    },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    styles: {
      fontSize: 11,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
      textColor: [40, 40, 40],
      overflow: 'linebreak',
      minCellHeight: 8,
      lineWidth: 0.2,
      lineColor: [200, 200, 200],
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 18 }, // ID
      1: { cellWidth: 32 }, // Departamento
      2: { cellWidth: 22 }, // Monto
      3: { cellWidth: 32 }, // Cuenta Destino
      4: { cellWidth: 22 }, // Estado
      5: { cellWidth: 40 }, // Concepto
      6: { cellWidth: 28 }, // Fecha Límite
      7: { cellWidth: 28 }, // Fecha Creación
      8: { cellWidth: 32 }, // Solicitante
      9: { cellWidth: 32 }  // Aprobador
    },
    margin: { left: 0, right: 0 },
    tableWidth: 'auto',
    didDrawPage: function (data) {
      // Centrar la tabla en la página
      const table = data.table;
      const pageWidth = doc.internal.pageSize.getWidth();
      // @ts-expect-error jsPDF-autotable: 'width' no está tipado pero existe en runtime
      const tableWidth = table.width;
      const leftMargin = (pageWidth - tableWidth) / 2;
      // @ts-expect-error jsPDF-autotable: 'x' no está tipado pero existe en runtime
      table.x = leftMargin;
      // Pie de página elegante
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('© BECHAPRA - Plataforma de Pagos', 14, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Página ${doc.getCurrentPageInfo().pageNumber} de ${doc.getNumberOfPages()}`, pageWidth - 60, doc.internal.pageSize.getHeight() - 10);
    }
  });
  doc.save(`solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
}
