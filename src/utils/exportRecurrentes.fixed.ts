// exportRecurrentes.ts
// Utilidades para exportar "recurrentes" en PDF, Excel y CSV con filtros personalizados

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { PlantillaRecurrente } from '@/types';

// Función auxiliar para formatear moneda de manera consistente
const formatoMoneda = (valor: number | string | null | undefined) => {
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
    // Asegurarse de que el monto sea un número válido
    const monto = formatoMoneda(r.monto);
    
    return [
      String(r.id_recurrente),
      r.folio || '',
      r.nombre_usuario || `Usuario ${r.id_usuario}`,
      r.departamento || '',
      monto,
      r.concepto || '',
      capitalize(r.tipo_pago || ''),
      capitalize(r.frecuencia || ''),
      capitalize(r.estado || ''),
      r.activo ? 'Activo' : 'Inactivo',
      r.siguiente_fecha ? new Date(r.siguiente_fecha).toLocaleDateString('es-CO') : ''
    ];
  });

  // Encabezado profesional con confidencialidad
  const pageWidth = doc.internal.pageSize.getWidth();
  // Encabezado más alto y espacioso
  const headerHeight = 110;
  doc.setFillColor(18, 61, 140);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo más grande y mejor posicionado
  const logoUrl = 'https://media.licdn.com/dms/image/v2/D4E0BAQEEoooIoWmBfw/company-logo_200_200/company-logo_200_200/0/1734988712036/bechapra_logo?e=2147483647&v=beta&t=Zud09Nh9JmjqB47tZ4cPzFAN9NtiyXWDqvlyqqRZAV0';
  doc.addImage(logoUrl, 'PNG', pageWidth - 140, 25, 100, 60);

  // Título principal centrado
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const title = `Reporte de Recurrentes (${capitalize(estado)})`;
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 45);

  // Leyenda de confidencialidad
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENCIAL - USO INTERNO DE LA EMPRESA', 40, 75);

  // Texto de uso interno
  doc.setFontSize(12);
  doc.setTextColor(220, 220, 220);
  doc.text('Este documento contiene información sensible y es para uso exclusivo de BECHAPRA', 40, 98);

  // Fecha de exportación, alineada a la derecha y debajo del logo
  doc.setFontSize(14);
  doc.setTextColor(220, 230, 255);
  const hoy = new Date();
  const fechaExport = `Exportado el ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  doc.text(fechaExport, pageWidth - 240, 105);

  // Calcular totales
  const totalCount = estadisticas.activos.count + estadisticas.inactivos.count;
  const totalMonto = estadisticas.activos.total + estadisticas.inactivos.total;

  // Agregar tabla de resumen
  const tableStartY = headerHeight + 30;
  
  // Tabla de resumen
  autoTable(doc, {
    head: [['Estado', 'Cantidad', 'Total']],
    body: [
      ['Activos', estadisticas.activos.count.toString(), formatoMoneda(estadisticas.activos.total)],
      ['Inactivos', estadisticas.inactivos.count.toString(), formatoMoneda(estadisticas.inactivos.total)],
      ['Total', totalCount.toString(), formatoMoneda(totalMonto)]
    ],
    startY: tableStartY,
    theme: 'grid',
    headStyles: { fillColor: [18, 61, 140], textColor: 255, fontStyle: 'bold', fontSize: 12 },
    bodyStyles: { fontSize: 11, halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' }
    },
    margin: { top: 30, bottom: 30 }
  });

  // Tabla principal
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? 
            (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30 : 
            150,
    theme: 'grid',
    headStyles: { fillColor: [18, 61, 140], textColor: 255, fontStyle: 'bold', fontSize: 13, halign: 'center', valign: 'middle', cellPadding: 10 },
    bodyStyles: { fontSize: 12, textColor: [40, 40, 40], cellPadding: 9, halign: 'center' },
    alternateRowStyles: { fillColor: [230, 240, 255] },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'left' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'left' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
      10: { halign: 'center' }
    },
    styles: { cellPadding: 9, valign: 'middle' },
    didDrawPage: () => {
      // Añadir pie de página en cada página
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const docTyped = doc as jsPDF & { getNumberOfPages: () => number };
      doc.text(`BECHAPRA S.A.S - Página ${docTyped.getNumberOfPages()}`, pageWidth - 150, doc.internal.pageSize.getHeight() - 20);
    }
  });
  doc.save(`Recurrentes_${estado}.pdf`);
}
