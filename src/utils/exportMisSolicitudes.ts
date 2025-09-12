// exportMisSolicitudes.ts
// Utilidades para exportar "mis solicitudes" en PDF, Excel y CSV con filtros personalizados

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import { Solicitud } from '@/types';

// Función para convertir imagen a base64
const getImageAsBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`No se pudo cargar la imagen: ${imagePath}`));
    };
    
    // Cargar la imagen
    img.src = imagePath;
  });
};

// Función auxiliar para formatear moneda de manera consistente
const formatoMoneda = (valor: number | string | null | undefined) => {
  let numeroValido = 0;
  
  if (valor !== undefined && valor !== null) {
    if (typeof valor === 'number' && !isNaN(valor)) {
      numeroValido = valor;
    } else if (typeof valor === 'string') {
      // Limpiar la cadena de cualquier carácter que no sea número o punto
      const limpio = valor.replace(/[^\d.-]/g, '');
      const numero = Number(limpio);
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

// Función auxiliar para formatear texto con primera letra mayúscula
const formatoTitulo = (texto: string | null | undefined) => {
  if (!texto) return '';
  const textoLimpio = texto.trim();
  if (textoLimpio.length === 0) return '';
  return textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1).toLowerCase();
};

// Array de meses y función para formato legible de fecha
const meses = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];
export function fechaLegible(fechaStr: string) {
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

// Filtra solicitudes por rango
export function filtrarSolicitudesPorRango(solicitudes: Solicitud[], rango: 'dia' | 'semana' | 'mes' | 'año' | 'total'): Solicitud[] {
  const hoy = new Date();
  let desde: Date | null = null;
  switch (rango) {
    case 'dia':
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      break;
    case 'semana':
      desde = new Date(hoy);
      desde.setTime(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'mes':
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      break;
    case 'año':
      desde = new Date(hoy.getFullYear(), 0, 1);
      break;
    case 'total':
      return solicitudes;
  }
  return solicitudes.filter(s => {
    const fecha = new Date(s.fecha_creacion);
    return desde ? fecha >= desde : true;
  });
}

// Exportar a CSV
export function exportMisSolicitudesCSV(solicitudes: Solicitud[], rango: string = 'total') {
  const datos = filtrarSolicitudesPorRango(solicitudes, rango as 'dia' | 'semana' | 'mes' | 'año' | 'total');
  const headers = ['Folio', 'Concepto', 'Monto', 'Departamento', 'Estado', 'Fecha Creación', 'Solicitante', 'Cuenta Destino', 'Banco'];
  const rows = datos.map(s => [
    s.folio || '',
    s.concepto || '',
    formatoMoneda(s.monto),
    formatoTitulo(s.departamento),
    formatoTitulo(s.estado),
    fechaLegible(s.fecha_creacion),
    s.usuario_nombre || `Usuario ${s.id_usuario}`,
    s.cuenta_destino || '',
    s.banco_destino || ''
  ]);
  let csv = headers.join(',') + '\n';
  csv += rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}` ).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `MisSolicitudes_${rango}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a Excel
export async function exportMisSolicitudesExcel(solicitudes: Solicitud[], rango: string = 'total') {
  const datos = filtrarSolicitudesPorRango(solicitudes, rango as 'dia' | 'semana' | 'mes' | 'año' | 'total');
  const workbook = new ExcelJS.Workbook();
  
  // Configurar metadatos del documento
  workbook.creator = 'BECHAPRA S.A.S';
  workbook.lastModifiedBy = 'Sistema de Solicitudes';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const sheet = workbook.addWorksheet('Solicitudes', {
    properties: { tabColor: { argb: '123D8C' } }
  });

  // Calcular estadísticas
  const estadisticas = {
    pendientes: { count: 0, total: 0 },
    aprobadas: { count: 0, total: 0 },
    rechazadas: { count: 0, total: 0 },
    pagadas: { count: 0, total: 0 }
  };

  datos.forEach(s => {
    const estado = s.estado?.toLowerCase() || '';
    // Asegurarse de que el monto sea un número válido
    let monto = 0;
    if (s.monto !== undefined && s.monto !== null) {
      if (typeof s.monto === 'number' && !isNaN(s.monto)) {
        monto = s.monto;
      } else {
        const valor = Number(s.monto);
        if (!isNaN(valor)) {
          monto = valor;
        }
      }
    }
    
    if (estado.includes('pendiente')) {
      estadisticas.pendientes.count++;
      estadisticas.pendientes.total += monto;
    } else if (estado.includes('aprobada') || estado.includes('autorizada')) {
      estadisticas.aprobadas.count++;
      estadisticas.aprobadas.total += monto;
    } else if (estado.includes('rechazada')) {
      estadisticas.rechazadas.count++;
      estadisticas.rechazadas.total += monto;
    } else if (estado.includes('pagada')) {
      estadisticas.pagadas.count++;
      estadisticas.pagadas.total += monto;
    }
  });

  // Encabezado profesional
  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = `Reporte de Solicitudes (${rango.charAt(0).toUpperCase() + rango.slice(1)})`;
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getCell('A1').fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [ { position: 0, color: { argb: '123D8C' } }, { position: 1, color: { argb: '1E90FF' } } ] };

  // Tabla de resumen
  sheet.addRow([]); // Espacio
  const resumenHeaderRow = sheet.addRow(['Resumen de Solicitudes']);
  sheet.mergeCells(`A${resumenHeaderRow.number}:C${resumenHeaderRow.number}`);
  resumenHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  resumenHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '123D8C' } };
  resumenHeaderRow.getCell(1).alignment = { horizontal: 'center' };

  const resumenHeaders = sheet.addRow(['Estado', 'Cantidad', 'Total']);
  resumenHeaders.font = { bold: true };
  resumenHeaders.alignment = { horizontal: 'center' };

  // Calcular totales
  const totalCount = estadisticas.pendientes.count + 
                    estadisticas.aprobadas.count + 
                    estadisticas.rechazadas.count + 
                    estadisticas.pagadas.count;
                    
  const totalMonto = estadisticas.pendientes.total + 
                    estadisticas.aprobadas.total + 
                    estadisticas.rechazadas.total + 
                    estadisticas.pagadas.total;
  
  const estadosResumen = [
    ['Pendientes', estadisticas.pendientes.count, estadisticas.pendientes.total],
    ['Autorizadas', estadisticas.aprobadas.count, estadisticas.aprobadas.total],
    ['Rechazadas', estadisticas.rechazadas.count, estadisticas.rechazadas.total],
    ['Pagadas', estadisticas.pagadas.count, estadisticas.pagadas.total],
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
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E6E6E6' } };
    }
  });

  // Agregar espacio entre resumen y tabla principal
  sheet.addRow([]);
  sheet.addRow([]);

  // Encabezados de columnas
  const headerRow = sheet.addRow([
    'Folio',
    'Concepto',
    'Monto',
    'Departamento',
    'Estado',
    'Fecha Creación',
    'Solicitante',
    'Cuenta Destino',
    'Banco'
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
  datos.forEach(s => {
    // Convertir el monto a número
    let monto = 0;
    if (s.monto !== undefined && s.monto !== null) {
      if (typeof s.monto === 'number' && !isNaN(s.monto)) {
        monto = s.monto;
      } else {
        const valor = Number(s.monto);
        if (!isNaN(valor)) {
          monto = valor;
        }
      }
    }

    const row = sheet.addRow([
      s.folio || '',
      s.concepto || '',
      monto, // Guardamos el número, no el string formateado
      formatoTitulo(s.departamento),
      formatoTitulo(s.estado),
      fechaLegible(s.fecha_creacion),
      s.usuario_nombre || `Usuario ${s.id_usuario}`,
      s.cuenta_destino || '',
      s.banco_destino || ''
    ]);

    // Aplicar formato de moneda a la columna de monto (índice 2, antes era 3)
    const montoCell = row.getCell(3); // La columna 3 es ahora 'Monto'
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
    C: 40,  // Concepto
    D: 20,  // Monto
    E: 25,  // Departamento
    F: 15,  // Estado
    G: 30,  // Fecha Creación
    H: 15   // ID Usuario
  };

  // Aplicar anchos y formatos
  Object.entries(columnWidths).forEach(([col, width]) => {
    sheet.getColumn(col).width = width;
    sheet.getColumn(col).alignment = { 
      vertical: 'middle',
      horizontal: col === 'C' ? 'left' : col === 'D' ? 'right' : 'center'
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
  link.download = `MisSolicitudes_${rango}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a PDF
export async function exportMisSolicitudesPDF(solicitudes: Solicitud[], rango: string = 'total') {
  const datos = filtrarSolicitudesPorRango(solicitudes, rango as 'dia' | 'semana' | 'mes' | 'año' | 'total');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'A4' });
  
  // Calcular estadísticas
  const estadisticas = {
    pendientes: { count: 0, total: 0 },
    aprobadas: { count: 0, total: 0 },
    rechazadas: { count: 0, total: 0 },
    pagadas: { count: 0, total: 0 }
  };
  
  // Debug: Imprimir los primeros datos para verificar
  console.log('Primeros 3 datos:', datos.slice(0, 3).map(s => ({ 
    estado: s.estado, 
    monto: s.monto, 
    tipo: typeof s.monto 
  })));
  
  datos.forEach(s => {
    const estado = s.estado?.toLowerCase() || '';
    // Asegurarse de que el monto sea un número válido
    let monto = 0;
    if (s.monto !== undefined && s.monto !== null) {
      if (typeof s.monto === 'number' && !isNaN(s.monto)) {
        monto = s.monto;
      } else {
        const valor = Number(s.monto);
        if (!isNaN(valor)) {
          monto = valor;
        }
      }
    }
    
    if (estado.includes('pendiente')) {
      estadisticas.pendientes.count++;
      estadisticas.pendientes.total += monto;
    } else if (estado.includes('aprobada') || estado.includes('autorizada')) {
      estadisticas.aprobadas.count++;
      estadisticas.aprobadas.total += monto;
    } else if (estado.includes('rechazada')) {
      estadisticas.rechazadas.count++;
      estadisticas.rechazadas.total += monto;
    } else if (estado.includes('pagada')) {
      estadisticas.pagadas.count++;
      estadisticas.pagadas.total += monto;
    }
  });

  const columns = ['Folio', 'Concepto', 'Monto', 'Departamento', 'Estado', 'Fecha Creación'];
  const rows = datos.map(s => {
    // Convertir el monto a número
    let monto = 0;
    if (s.monto !== undefined && s.monto !== null) {
      if (typeof s.monto === 'number' && !isNaN(s.monto)) {
        monto = s.monto;
      } else {
        const valor = Number(s.monto);
        if (!isNaN(valor)) {
          monto = valor;
        }
      }
    }
    
    return [
      s.folio || '',
      s.concepto || '',
      formatoMoneda(monto),
      formatoTitulo(s.departamento),
      formatoTitulo(s.estado),
      fechaLegible(s.fecha_creacion)
    ];
  });

  // Encabezado profesional con confidencialidad
  const pageWidth = doc.internal.pageSize.getWidth();
  // Encabezado más alto y espacioso
  const headerHeight = 110;
  doc.setFillColor(18, 61, 140);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo corporativo usando la imagen del proyecto - posición optimizada
  const logoX = pageWidth - 120;
  const logoY = 20;
  
  // Intentar cargar y agregar el logo del proyecto
  try {
    const logoPath = '/assets/images/Logo_1x1_AzulSinFondo@2x.png';
    const logoBase64 = await getImageAsBase64(logoPath);
    
    // Agregar la imagen al PDF con tamaño bien proporcionado
    doc.addImage(logoBase64, 'PNG', logoX, logoY, 85, 70);
    console.log('Logo cargado correctamente en el PDF');
  } catch (error) {
    console.warn('No se pudo cargar el logo, usando diseño alternativo:', error);
    
    // Diseño alternativo profesional si no se puede cargar la imagen
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(logoX, logoY, 85, 70, 10, 10, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(2);
    doc.roundedRect(logoX, logoY, 85, 70, 10, 10, 'S');
    
    // Texto corporativo
    doc.setTextColor(18, 61, 140);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('BECHAPRA', logoX + 42.5, logoY + 35, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text('Soluciones Corporativas', logoX + 42.5, logoY + 50, { align: 'center' });
  }
  
  // Fondo elegante para información adicional
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoX - 8, logoY - 8, 101, 86, 8, 8, 'F');
  
  // Marco sutil
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(logoX - 8, logoY - 8, 101, 86, 8, 8, 'S');
  
  // Cargar y añadir el logo desde el proyecto
  try {
    // Usar el logo azul que se ve mejor en documentos
    const logoPath = '/assets/images/Logo_1x1_AzulSinFondo@2x.png';
    doc.addImage(logoPath, 'PNG', logoX, logoY, 85, 65);
  } catch {
    // Fallback: Logo de texto si la imagen no se puede cargar
    doc.setTextColor(18, 61, 140);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BECHAPRA', logoX + 42.5, logoY + 35, { align: 'center' });
    
    //doc.setTextColor(100, 100, 100);
    //doc.setFontSize(12);
    //doc.setFont('helvetica', 'normal');
    //doc.text('S.A.S', logoX + 10, logoY + 55);
  }

  // Título principal centrado
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const title = `Reporte de Solicitudes (${rango.charAt(0).toUpperCase() + rango.slice(1)})`;
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

  // Calcular totales
  const totalCount = estadisticas.pendientes.count + 
                    estadisticas.aprobadas.count + 
                    estadisticas.rechazadas.count + 
                    estadisticas.pagadas.count;
                    
  const totalMonto = estadisticas.pendientes.total + 
                    estadisticas.aprobadas.total + 
                    estadisticas.rechazadas.total + 
                    estadisticas.pagadas.total;

  // Agregar tabla de resumen
  const tableStartY = headerHeight + 30;
  
  // Tabla de resumen
  autoTable(doc, {
    head: [['Estado', 'Cantidad', 'Total']],
    body: [
      ['Pendientes', estadisticas.pendientes.count.toString(), formatoMoneda(estadisticas.pendientes.total)],
      ['Autorizadas', estadisticas.aprobadas.count.toString(), formatoMoneda(estadisticas.aprobadas.total)],
      ['Rechazadas', estadisticas.rechazadas.count.toString(), formatoMoneda(estadisticas.rechazadas.total)],
      ['Pagadas', estadisticas.pagadas.count.toString(), formatoMoneda(estadisticas.pagadas.total)],
      ['Total', totalCount.toString(), formatoMoneda(totalMonto)]
    ],
    startY: tableStartY,
    theme: 'grid',
    headStyles: { fillColor: [18, 61, 140], textColor: 255, fontStyle: 'bold', fontSize: 12 },
    bodyStyles: { fontSize: 11, halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },    // Estado
      1: { halign: 'center' },  // Cantidad
      2: { halign: 'right' }    // Total
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
      0: { halign: 'center' }, // ID
      1: { halign: 'center' }, // Folio
      2: { halign: 'left' },   // Concepto
      3: { halign: 'right' },  // Monto
      4: { halign: 'center' }, // Departamento
      5: { halign: 'center' }, // Estado
      6: { halign: 'center' }  // Fecha Creación
    },
    styles: { cellPadding: 9, valign: 'middle' },
    didDrawPage: () => {
      // Pie de página
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      const pageNum = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : 1;
      doc.text(`Página ${pageNum}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
    }
  });

  // Agregar fecha de exportación en la última página
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const hoy = new Date();
  const fechaExport = `Exportado el ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const fechaWidth = doc.getTextWidth(fechaExport);
  doc.text(fechaExport, (doc.internal.pageSize.getWidth() - fechaWidth) / 2, doc.internal.pageSize.getHeight() - 40);

  doc.save(`MisSolicitudes_${rango}.pdf`);
}