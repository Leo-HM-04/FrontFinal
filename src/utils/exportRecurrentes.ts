// exportRecurrentes.ts
// Utilidades para exportar "recurrentes" en PDF, Excel y CSV con filtros personalizados

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { PlantillaRecurrente } from '@/types';

// Función auxiliar para formatear moneda de manera consistente
const formatoMoneda = (valor: number | string | null | undefined, compacto = false) => {
  let numeroValido = 0;
  
  if (valor !== undefined && valor !== null) {
    if (typeof valor === 'number' && !isNaN(valor)) {
      numeroValido = valor;
    } else if (typeof valor === 'string') {
      const valorSinFormato = valor.replace(/[^\d.-]/g, '');
      const numero = parseFloat(valorSinFormato);
      if (!isNaN(numero)) {
        numeroValido = numero;
      }
    }
  }
  
  // Si se pide formato compacto para números grandes (para PDF)
  if (compacto && numeroValido >= 1000000) {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(numeroValido);
  }
  
  return new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeroValido);
};

// Array de meses y función para formato legible de fecha
const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function fechaLegible(fechaStr: string) {
  if (!fechaStr) return '';
  
  const d = new Date(fechaStr);
  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const año = d.getFullYear();
  let horas = d.getHours();
  const minutos = d.getMinutes().toString().padStart(2, '0');
  const ampm = horas >= 12 ? 'PM' : 'AM';
  horas = horas % 12;
  horas = horas ? horas : 12;
  return `${dia} de ${mes} de ${año}, ${horas}:${minutos} ${ampm}`;
}

// Capitaliza la primera letra
export function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

// Filtra recurrentes por estado activo/inactivo
export function filtrarRecurrentesPorEstado(recurrentes: PlantillaRecurrente[], estado: 'activo' | 'inactivo' | 'todos'): PlantillaRecurrente[] {
  if (estado === 'todos') return recurrentes;
  return recurrentes.filter(r => estado === 'activo' ? !!r.activo : !r.activo);
}

// Función para obtener el monto numérico de una plantilla recurrente
function obtenerMontoNumerico(monto: number | string | null | undefined): number {
  let resultado = 0;
  
  if (monto !== undefined && monto !== null) {
    if (typeof monto === 'number') {
      resultado = monto;
    } else if (typeof monto === 'string') {
      const montoStr = monto;
      resultado = parseFloat(montoStr.replace(/[^\d.-]/g, '')) || 0;
    }
  }
  
  return resultado;
}

// Exportar a CSV
export function exportRecurrentesCSV(recurrentes: PlantillaRecurrente[], estado: 'activo' | 'inactivo' | 'todos' = 'todos') {
  const datos = filtrarRecurrentesPorEstado(recurrentes, estado);
  const headers = ['ID', 'Folio', 'Usuario', 'Departamento', 'Monto', 'Cuenta Destino', 'Banco', 'Concepto', 'Tipo Pago', 'Frecuencia', 'Estado', 'Activo', 'Siguiente Fecha'];
  const rows = datos.map(r => [
    r.id_recurrente,
    r.folio || '',
    r.nombre_usuario || `Usuario ${r.id_usuario}`,
    r.departamento || '',
    formatoMoneda(r.monto),
    r.cuenta_destino || '',
    r.banco_destino || '',
    r.concepto || '',
    capitalize(r.tipo_pago || ''),
    capitalize(r.frecuencia || ''),
    capitalize(r.estado || ''),
    r.activo ? 'Activo' : 'Inactivo',
    r.siguiente_fecha ? new Date(r.siguiente_fecha).toLocaleDateString('es-CO') : ''
  ]);
  let csv = headers.join(',') + '\n';
  csv += rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Recurrentes_${estado}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a Excel
export async function exportRecurrentesExcel(recurrentes: PlantillaRecurrente[], estado: 'activo' | 'inactivo' | 'todos' = 'todos') {
  const datos = filtrarRecurrentesPorEstado(recurrentes, estado);
  const workbook = new ExcelJS.Workbook();
  
  // Configurar metadatos del documento
  workbook.creator = 'BECHAPRA S.A.S';
  workbook.lastModifiedBy = 'Sistema de Recurrentes';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const sheet = workbook.addWorksheet('Recurrentes', {
    properties: { tabColor: { argb: '123D8C' } }
  });

  // Calcular estadísticas
  const estadisticas = {
    activos: { count: 0, total: 0 },
    inactivos: { count: 0, total: 0 }
  };

  datos.forEach(r => {
    // Asegurarse de que el monto sea un número válido
    const monto = obtenerMontoNumerico(r.monto);
    
    if (r.activo) {
      estadisticas.activos.count++;
      estadisticas.activos.total += monto;
    } else {
      estadisticas.inactivos.count++;
      estadisticas.inactivos.total += monto;
    }
  });

  // Encabezado profesional
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = `Reporte de Recurrentes (${capitalize(estado)})`;
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('A1').fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [ { position: 0, color: { argb: '123D8C' } }, { position: 1, color: { argb: '1E90FF' } } ] };

  // Tabla de resumen
  sheet.addRow([]); // Espacio
  const resumenHeaderRow = sheet.addRow(['Resumen de Recurrentes']);
  sheet.mergeCells(`A${resumenHeaderRow.number}:C${resumenHeaderRow.number}`);
  resumenHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  resumenHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '123D8C' } };
  resumenHeaderRow.getCell(1).alignment = { horizontal: 'center' };

  const resumenHeaders = sheet.addRow(['Estado', 'Cantidad', 'Total']);
  resumenHeaders.font = { bold: true };
  resumenHeaders.alignment = { horizontal: 'center' };

  // Calcular totales
  const totalCount = estadisticas.activos.count + estadisticas.inactivos.count;
  const totalMonto = estadisticas.activos.total + estadisticas.inactivos.total;
  
  const estadosResumen = [
    ['Activos', estadisticas.activos.count, estadisticas.activos.total],
    ['Inactivos', estadisticas.inactivos.count, estadisticas.inactivos.total],
    ['Total', totalCount, totalMonto]
  ];

  estadosResumen.forEach(([estado, cantidad, total]) => {
    const row = sheet.addRow([estado, cantidad, total]);
    
    // Aplicar formato de moneda a la columna de total
    const totalCell = row.getCell(3); // La columna 3 es 'Total'
    totalCell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
    
    // Alinear las celdas
    row.getCell(1).alignment = { horizontal: 'left' };   // Estado
    row.getCell(2).alignment = { horizontal: 'center' }; // Cantidad
    row.getCell(3).alignment = { horizontal: 'right' };  // Total
    
    if (estado === 'Total') {
      row.font = { bold: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'double' }
        };
      });
    }
  });

  // Agregar espacio entre resumen y tabla principal
  sheet.addRow([]);
  sheet.addRow([]);

  // Encabezados de columnas
  const headerRow = sheet.addRow([
    'ID',
    'Folio',
    'Usuario',
    'Departamento',
    'Monto',
    'Cuenta Destino',
    'Banco',
    'Concepto',
    'Tipo Pago',
    'Frecuencia',
    'Estado',
    'Activo',
    'Siguiente Fecha'
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '123D8C' } };
  headerRow.border = {
    top: { style: 'thin', color: { argb: '1E90FF' } },
    left: { style: 'thin', color: { argb: '1E90FF' } },
    bottom: { style: 'thin', color: { argb: '1E90FF' } },
    right: { style: 'thin', color: { argb: '1E90FF' } }
  };

  // Filas de datos
  datos.forEach(r => {
    // Convertir el monto a número
    const monto = obtenerMontoNumerico(r.monto);

    const row = sheet.addRow([
      r.id_recurrente,
      r.folio || '',
      r.nombre_usuario || `Usuario ${r.id_usuario}`,
      r.departamento || '',
      monto,
      r.cuenta_destino || '',
      r.banco_destino || '',
      r.concepto || '',
      capitalize(r.tipo_pago || ''),
      capitalize(r.frecuencia || ''),
      capitalize(r.estado || ''),
      r.activo ? 'Activo' : 'Inactivo',
      r.siguiente_fecha ? new Date(r.siguiente_fecha).toLocaleDateString('es-CO') : ''
    ]);

    // Aplicar formato de moneda a la columna de monto (índice 4)
    const montoCell = row.getCell(5); // La columna 5 es 'Monto'
    montoCell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';

    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.border = {
      top: { style: 'thin', color: { argb: 'B0C4DE' } },
      left: { style: 'thin', color: { argb: 'B0C4DE' } },
      bottom: { style: 'thin', color: { argb: 'B0C4DE' } },
      right: { style: 'thin', color: { argb: 'B0C4DE' } }
    };
  });

  // Configurar el ancho y formato de las columnas
  const columnWidths = {
    A: 10,  // ID
    B: 15,  // Folio
    C: 30,  // Usuario
    D: 25,  // Departamento
    E: 20,  // Monto
    F: 20,  // Cuenta Destino
    G: 20,  // Banco
    H: 40,  // Concepto
    I: 15,  // Tipo Pago
    J: 15,  // Frecuencia
    K: 15,  // Estado
    L: 15,  // Activo
    M: 20   // Siguiente Fecha
  };

  // Aplicar anchos y formatos
  Object.entries(columnWidths).forEach(([col, width]) => {
    sheet.getColumn(col).width = width;
    sheet.getColumn(col).alignment = { 
      vertical: 'middle',
      horizontal: col === 'H' ? 'left' : col === 'E' ? 'right' : 'center'
    };
  });

  // Asegurarse de que todas las filas tengan la altura correcta
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.height = 25;
  });

  // Pie de página con fecha
  const lastRow = sheet.addRow([`Exportado el ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`]);
  lastRow.getCell(1).font = { italic: true, color: { argb: '888888' } };
  sheet.mergeCells(`A${lastRow.number}:G${lastRow.number}`);
  lastRow.alignment = { horizontal: 'right' };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Recurrentes_${estado}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a PDF
export function exportRecurrentesPDF(recurrentes: PlantillaRecurrente[], estado: 'activo' | 'inactivo' | 'todos' = 'todos') {
  const datos = filtrarRecurrentesPorEstado(recurrentes, estado);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
  
  // Calcular estadísticas
  const estadisticas = {
    activos: { count: 0, total: 0 },
    inactivos: { count: 0, total: 0 }
  };
  
  datos.forEach(r => {
    // Asegurarse de que el monto sea un número válido
    const monto = obtenerMontoNumerico(r.monto);
    
    if (r.activo) {
      estadisticas.activos.count++;
      estadisticas.activos.total += monto;
    } else {
      estadisticas.inactivos.count++;
      estadisticas.inactivos.total += monto;
    }
  });

  const columns = ['ID', 'Folio', 'Usuario', 'Departamento', 'Monto', 'Concepto', 'Tipo Pago', 'Frecuencia', 'Estado', 'Activo', 'Siguiente Fecha'];
  const rows = datos.map(r => {
    // Asegurarse de que el monto sea un número válido y usar formato compacto para PDF
    const monto = formatoMoneda(r.monto, true);
    
    // Acortar textos largos para mejorar visualización en tabla
    const conceptoAcortado = r.concepto && r.concepto.length > 25 ? 
      `${r.concepto.substring(0, 25)}...` : 
      r.concepto || '';
      
    // Acortar nombre de usuario si es muy largo
    const nombreUsuario = r.nombre_usuario || `Usuario ${r.id_usuario}`;
    const nombreAcortado = nombreUsuario.length > 20 ? 
      `${nombreUsuario.substring(0, 18)}...` : 
      nombreUsuario;
      
    return [
      String(r.id_recurrente),
      r.folio || '-',
      nombreAcortado,
      r.departamento ? r.departamento.substring(0, 15) : '-',
      monto,
      conceptoAcortado,
      capitalize(r.tipo_pago || '-').substring(0, 12),
      capitalize(r.frecuencia || '-'),
      capitalize(r.estado || '-'),
      r.activo ? 'Activo' : 'Inactivo',
      r.siguiente_fecha ? new Date(r.siguiente_fecha).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '-'
    ];
  });

  // Encabezado profesional con confidencialidad
  const pageWidth = doc.internal.pageSize.getWidth();
  // Encabezado más compacto
  const headerHeight = 90; // Reducido de 110 a 90
  doc.setFillColor(18, 61, 140);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo más compacto y mejor posicionado
  const logoUrl = 'https://media.licdn.com/dms/image/v2/D4E0BAQEEoooIoWmBfw/company-logo_200_200/company-logo_200_200/0/1734988712036/bechapra_logo?e=2147483647&v=beta&t=Zud09Nh9JmjqB47tZ4cPzFAN9NtiyXWDqvlyqqRZAV0';
  doc.addImage(logoUrl, 'PNG', pageWidth - 120, 15, 80, 50); // Logo más pequeño y más arriba

  // Título principal centrado
  doc.setFontSize(24); // Reducido de 28 a 24
  doc.setTextColor(255, 255, 255);
  const title = `Reporte de Recurrentes (${capitalize(estado)})`;
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 35); // Movido arriba

  // Leyenda de confidencialidad
  doc.setFontSize(12); // Reducido de 15 a 12
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENCIAL - USO INTERNO DE LA EMPRESA', 40, 55); // Movido arriba

  // Texto de uso interno
  doc.setFontSize(10); // Reducido de 12 a 10
  doc.setTextColor(220, 220, 220);
  doc.text('Este documento contiene información sensible y es para uso exclusivo de BECHAPRA S.A.S.', 40, 70); // Movido arriba

  // Fecha de exportación, alineada a la derecha y debajo del logo
  doc.setFontSize(12); // Reducido de 14 a 12
  doc.setTextColor(220, 230, 255);
  const hoy = new Date();
  const fechaExport = `Exportado: ${hoy.toLocaleDateString('es-MX')}`;
  doc.text(fechaExport, pageWidth - 200, 85); // Formato de fecha más compacto

  // Calcular totales
  const totalCount = estadisticas.activos.count + estadisticas.inactivos.count;
  const totalMonto = estadisticas.activos.total + estadisticas.inactivos.total;

  // Agregar tabla de resumen más cerca del encabezado
  const tableStartY = headerHeight + 15; // Reducido de 30 a 15
  
  // Tabla de resumen - más compacta
  autoTable(doc, {
    head: [['Estado', 'Cant.', 'Total']],
    body: [
      ['Activos', estadisticas.activos.count.toString(), formatoMoneda(estadisticas.activos.total, true)],
      ['Inactivos', estadisticas.inactivos.count.toString(), formatoMoneda(estadisticas.inactivos.total, true)],
      ['Total', totalCount.toString(), formatoMoneda(totalMonto, true)]
    ],
    startY: tableStartY,
    theme: 'grid',
    headStyles: { 
      fillColor: [18, 61, 140], 
      textColor: 255, 
      fontStyle: 'bold', 
      fontSize: 10, // Reducido de 12 a 10
      cellPadding: 5 // Reducir padding
    },
    bodyStyles: { 
      fontSize: 10, // Reducido de 11 a 10
      halign: 'center',
      cellPadding: 4 // Reducir padding
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 100 } // Aumentado de 80 a 100 para evitar cortes
    },
    margin: { top: 15, bottom: 20 } // Reducido de 30,30 a 15,20
  });

  // Crear columnas más compactas
  const compactColumns = columns.map(col => {
    // Acortar nombres de columnas largas y hacerlas más compactas
    if (col === 'Departamento') return 'Depto.';
    if (col === 'Frecuencia') return 'Frec.';
    if (col === 'Concepto') return 'Concepto';
    if (col === 'Tipo Pago') return 'T.Pago';
    if (col === 'Siguiente Fecha') return 'Sig.Fecha';
    return col;
  });

  // Tabla principal
  autoTable(doc, {
    head: [compactColumns],
    body: rows,
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? 
            (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15 : // Reducido de 30 a 15
            110, // Reducido de 150 a 110
    theme: 'grid',
    headStyles: { 
      fillColor: [18, 61, 140], 
      textColor: 255, 
      fontStyle: 'bold', 
      fontSize: 10, // Reducido de 13 a 10
      halign: 'center', 
      valign: 'middle', 
      cellPadding: 5, // Reducido de 10 a 5
      minCellHeight: 30 // Altura mínima para asegurar legibilidad
    },
    bodyStyles: { fontSize: 10, textColor: [40, 40, 40], cellPadding: 6, halign: 'center' },
    alternateRowStyles: { fillColor: [230, 240, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 }, // ID
      1: { halign: 'center', cellWidth: 50 }, // Folio
      2: { halign: 'left', cellWidth: 'auto' }, // Usuario
      3: { halign: 'center', cellWidth: 50 }, // Departamento
      4: { halign: 'right', cellWidth: 80 }, // Monto - Aumentado a 80 para evitar cortes
      5: { halign: 'left', cellWidth: 'auto' }, // Concepto
      6: { halign: 'center', cellWidth: 50 }, // Tipo Pago
      7: { halign: 'center', cellWidth: 40 }, // Frecuencia
      8: { halign: 'center', cellWidth: 50 }, // Estado
      9: { halign: 'center', cellWidth: 40 }, // Activo
      10: { halign: 'center', cellWidth: 60 } // Siguiente Fecha
    },
    styles: { cellPadding: 5, valign: 'middle' }, // Reducido de 9 a 5
    margin: { top: 15, right: 15, bottom: 20, left: 15 }, // Márgenes ajustados para evitar cortes
    didDrawPage: () => {
      // Añadir pie de página en cada página
      doc.setFontSize(9); // Reducido de 10 a 9
      doc.setTextColor(100, 100, 100);
      const docTyped = doc as jsPDF & { getNumberOfPages: () => number };
      doc.text(`BECHAPRA S.A.S - Página ${docTyped.getNumberOfPages()}`, pageWidth - 150, doc.internal.pageSize.getHeight() - 15);
    }
  });
  doc.save(`Recurrentes_${estado}.pdf`);
}
