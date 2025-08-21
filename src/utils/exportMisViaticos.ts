import * as XLSX from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Viatico as BaseViatico } from '@/hooks/useViaticos';

interface Viatico extends BaseViatico {
  monto: number;
}

// Función para formatear texto profesionalmente
const capitalizar = (texto: string) => {
  if (!texto) return '';
  
  // Mapeo de textos específicos con el formato oficial de BECHAPRA
  const formatosEspeciales: { [key: string]: string } = {
    'ti': 'TI',
    'contabilidad': 'Contabilidad',
    'facturacion': 'Facturación',
    'cobranza': 'Cobranza',
    'vinculacion': 'Vinculación',
    'administracion': 'Administración',
    'automatizaciones': 'Automatizaciones',
    'comercial': 'Comercial',
    'atencion a clientes': 'Atención a Clientes',
    'tesoreria': 'Tesorería',
    'nomina': 'Nómina'
  };

  // Primero buscar en el mapeo de formatos especiales (ignorando acentos y mayúsculas)
  const textoNormalizado = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(formatosEspeciales)) {
    const keyNormalizada = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (textoNormalizado === keyNormalizada) {
      return value;
    }
  }

  // Si no está en el mapeo, capitalizar cada palabra
  return texto
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
};

const formatoMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(valor);
};

const fechaLegible = (fechaStr: string) => {
  if (!fechaStr) return '-';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Función auxiliar para filtrar viáticos por rango
function filtrarViaticosPorRango(viaticos: Viatico[], rango: string) {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setTime(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
  const inicioMes = new Date(hoy);
  inicioMes.setMonth(hoy.getMonth() - 1);

  return viaticos.filter(v => {
    const fechaViatico = new Date(v.fecha_limite_pago);
    switch (rango) {
      case 'semana':
        return fechaViatico >= inicioSemana;
      case 'mes':
        return fechaViatico >= inicioMes;
      default:
        return true;
    }
  });
}

// Exportar a CSV
export function exportMisViaticosCSV(viaticos: Viatico[], rango: string = 'total') {
  const datos = filtrarViaticosPorRango(viaticos, rango);
  const headers = ['ID', 'Folio', 'Concepto', 'Monto', 'Departamento', 'Estado', 'Fecha Límite', 'Tipo de Pago', 'Cuenta Destino', 'Banco'];
  const rows = datos.map(v => [
    v.id_viatico,
    v.folio || '',
    v.concepto || '',
    formatoMoneda(v.monto),
    v.departamento || '',
    v.estado || '',
    fechaLegible(v.fecha_limite_pago),
    v.tipo_pago || '',
    v.cuenta_destino || '',
    v.banco_destino || ''
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mis_viaticos_${rango}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Exportar a Excel
export async function exportMisViaticosExcel(viaticos: Viatico[], rango: string = 'total') {
  const datos = filtrarViaticosPorRango(viaticos, rango);
  const workbook = new XLSX.Workbook();
  const sheet = workbook.addWorksheet('Mis Viáticos');

  // Estilos para el título
  sheet.addRow([]);
  const titleCell = sheet.addRow(['Reporte de Viáticos']);
  titleCell.font = { bold: true, size: 16, color: { argb: '123D8C' } };
  sheet.addRow([]);

  // Resumen por estado
  const resumenHeaderRow = sheet.addRow(['Resumen de Viáticos']);
  sheet.mergeCells(`A${resumenHeaderRow.number}:C${resumenHeaderRow.number}`);
  resumenHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  resumenHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '123D8C' } };
  resumenHeaderRow.getCell(1).alignment = { horizontal: 'center' };

  const resumenHeaders = sheet.addRow(['Estado', 'Cantidad', 'Total']);
  resumenHeaders.font = { bold: true };
  resumenHeaders.alignment = { horizontal: 'center' };

  // Calcular resumen
  const resumen: { [key: string]: { cantidad: number; total: number } } = {};
  datos.forEach(v => {
    const estado = v.estado || 'pendiente';
    if (!resumen[estado]) {
      resumen[estado] = { cantidad: 0, total: 0 };
    }
    resumen[estado].cantidad++;
    resumen[estado].total += Number(v.monto) || 0;
  });

  // Agregar filas de resumen
  Object.entries(resumen).forEach(([estado, { cantidad, total }]) => {
    const row = sheet.addRow([estado, cantidad, total]);
    row.getCell(1).alignment = { horizontal: 'left' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).numFmt = '"$"#,##0.00';
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Encabezados de columnas
  const headerRow = sheet.addRow([
    'ID',
    'Folio',
    'Concepto',
    'Monto',
    'Departamento',
    'Estado',
    'Fecha Límite',
    'Tipo de Pago',
    'Cuenta Destino',
    'Banco'
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '123D8C' } };
  headerRow.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Datos
  datos.forEach(v => {
    const monto = Number(v.monto) || 0;

    const row = sheet.addRow([
      v.id_viatico,
      v.folio || '',
      v.concepto || '',
      monto, // Guardamos el número, no el string formateado
      v.departamento || '',
      v.estado || '',
      fechaLegible(v.fecha_limite_pago),
      v.tipo_pago || '',
      v.cuenta_destino || '',
      v.banco_destino || ''
    ]);

    // Formato condicional para estados
    const estadoCell = row.getCell(6);
    switch ((v.estado || '').toLowerCase()) {
      case 'pendiente':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8A3' } };
        break;
      case 'autorizada':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A8E6CF' } };
        break;
      case 'rechazada':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7B2' } };
        break;
      case 'pagada':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B7E4F9' } };
        break;
    }

    // Formato para el monto
    const montoCell = row.getCell(4);
    montoCell.numFmt = '"$"#,##0.00';
  });

  // Ajustar anchos de columna
  sheet.columns.forEach(column => {
    column.width = Math.max(15, ...datos.map(v => String(v[column.key as keyof typeof v] || '').length));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `mis_viaticos_${rango}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar a PDF
export async function exportMisViaticosPDF(viaticos: Viatico[], rango: string = 'total') {
  const datos = filtrarViaticosPorRango(viaticos, rango);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'letter'
  });

  // Función para agregar pie de página y número de página
  const agregarPiePagina = (doc: jsPDF) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const fecha = new Date().toLocaleString('es-MX');
    doc.text(`Generado el: ${fecha}`, 40, pageHeight - 20);
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
    // Línea separadora en el pie de página
    doc.setDrawColor(200, 200, 200);
    doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);
  };

  // Configuración de página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Encabezado con degradado
  const headerHeight = 130;
  doc.setFillColor(18, 61, 140); // Color principal #123D8C
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Franja decorativa
  doc.setFillColor(255, 255, 255);
  // Franja decorativa con opacidad
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.rect(0, headerHeight - 20, pageWidth, 20, 'F');

  // Cargar el logo desde URL
  const loadAndAddImage = async () => {
    try {
      const logoUrl = 'https://media.licdn.com/dms/image/v2/D4E0BAQEEoooIoWmBfw/company-logo_200_200/company-logo_200_200/0/1734988712036/bechapra_logo?e=2147483647&v=beta&t=Zud09Nh9JmjqB47tZ4cPzFAN9NtiyXWDqvlyqqRZAV0';
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Agregar el logo al PDF
        const logoSize = 60;
        doc.addImage(
          base64data,
          'PNG',
          margin,
          headerHeight/2 - 30,
          logoSize,
          logoSize
        );
      };
      
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: Si hay error al cargar el logo, mostrar texto
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(255, 255, 255);
      doc.circle(margin + 35, headerHeight/2, 30, 'FD');
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(18, 61, 140);
      doc.text('BECHAPRA', margin + 28, headerHeight/2);
    }
  };

  // Intentar cargar y agregar el logo
  await loadAndAddImage();
  
  // Título principal con estilo moderno y mejor posicionamiento
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Reporte de Viáticos', margin + 120, headerHeight/2 - 10);

  // Información del reporte con mejor formato y posicionamiento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  const fechaReporte = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Fecha del reporte: ${fechaReporte}`, margin + 120, headerHeight/2 + 20);

  // Rango del reporte con ícono
  let textoRango = 'Todos los viáticos';
  if (rango === 'dia') textoRango = 'Viáticos del día';
  if (rango === 'semana') textoRango = 'Viáticos de la última semana';
  if (rango === 'mes') textoRango = 'Viáticos del último mes';
  if (rango === 'año') textoRango = 'Viáticos del último año';
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Período: ${textoRango}`, margin + 60, headerHeight/2 + 35, { align: 'left' });

  // Aviso de confidencialidad
  doc.setFillColor(255, 247, 247);
  doc.rect(margin, headerHeight + 5, pageWidth - (margin * 2), 25, 'F');
  doc.setTextColor(180, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL: Este documento es propiedad de BECHAPRA. Contiene información confidencial y es para uso interno exclusivo.', 
    pageWidth / 2, headerHeight + 20, { align: 'center', maxWidth: pageWidth - (margin * 3) });
  doc.text('Prohibida su reproducción total o parcial sin autorización.', 
    pageWidth / 2, headerHeight + 30, { align: 'center' });

  // Tabla de resumen
  const resumen: { [key: string]: { cantidad: number; total: number } } = {};
  datos.forEach(v => {
    const estado = v.estado || 'pendiente';
    if (!resumen[estado]) {
      resumen[estado] = { cantidad: 0, total: 0 };
    }
    resumen[estado].cantidad++;
    resumen[estado].total += Number(v.monto) || 0;
  });

  const resumenData = Object.entries(resumen).map(([estado, { cantidad, total }]) => [
    capitalizar(estado),
    cantidad.toString(),
    formatoMoneda(total)
  ]);

  // Tabla de resumen
  let lastY = headerHeight + 40;
  
  // Título de la sección de resumen
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, lastY, pageWidth - (margin * 2), 30, 'F');
  doc.setTextColor(18, 61, 140);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Viáticos', margin + 10, lastY + 20);
  
  lastY += 40;

  const headers = [
    ['Estado', 'Cantidad', 'Total'],
    ...resumenData
  ];

  autoTable(doc, {
    startY: lastY,
    body: headers,
    theme: 'grid',
    styles: {
      fontSize: 11,
      cellWidth: 'auto',
      cellPadding: 8,
      font: 'helvetica',
      textColor: [50, 50, 50]
    },
    headStyles: {
      fillColor: [18, 61, 140],
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 80, halign: 'center' },
      2: { cellWidth: 100, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: function(data) {
      if (data.cursor) lastY = data.cursor.y;
    }
  });

  // Título de la sección de detalles
  lastY += 40;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, lastY, pageWidth - (margin * 2), 30, 'F');
  doc.setTextColor(18, 61, 140);
  doc.setFontSize(16);
  doc.text('Detalle de Viáticos', margin + 10, lastY + 20);
  
  lastY += 40;

  // Tabla de datos detallados
  const detallesHeaders = [
    'ID',
    'Folio',
    'Concepto',
    'Monto',
    'Departamento',
    'Estado',
    'Fecha Límite',
    'Tipo de Pago',
    'Cuenta'
  ];

  const detallesData = datos.map(v => [
    v.id_viatico.toString(),
    v.folio || '',
    v.concepto || '',
    formatoMoneda(v.monto),
    capitalizar(v.departamento || ''),
    capitalizar(v.estado || ''),
    fechaLegible(v.fecha_limite_pago),
    capitalizar(v.tipo_pago || ''),
    v.cuenta_destino || ''
  ]);

  // Calcular totales generales
  const totalesGenerales = datos.reduce((acc, v) => {
    acc.total += Number(v.monto) || 0;
    acc.cantidad++;
    return acc;
  }, { total: 0, cantidad: 0 });

  // Agregar fila de totales al final
  detallesData.push([
    '',
    '',
    'TOTAL GENERAL',
    formatoMoneda(totalesGenerales.total),
    '',
    '',
    '',
    '',
    ''
  ]);

  autoTable(doc, {
    startY: lastY,
    head: [detallesHeaders],
    body: detallesData,
    theme: 'grid',
    pageBreak: 'auto',
    didDrawPage: function() {
      agregarPiePagina(doc);
    },
    styles: {
      fontSize: 8,
      cellWidth: 'wrap',
      cellPadding: 5,
      font: 'helvetica',
      textColor: [50, 50, 50],
      minCellHeight: 20,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [18, 61, 140],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' }, // ID
      1: { cellWidth: 50 }, // Folio
      2: { cellWidth: 90, overflow: 'linebreak' }, // Concepto
      3: { cellWidth: 60, halign: 'right' }, // Monto
      4: { cellWidth: 70, overflow: 'linebreak' }, // Departamento
      5: { cellWidth: 50, halign: 'center' }, // Estado
      6: { cellWidth: 55 }, // Fecha
      7: { cellWidth: 50 }, // Tipo Pago
      8: { cellWidth: 70 } // Cuenta
    },
    margin: { left: margin, right: margin },
    bodyStyles: {
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      valign: 'middle'
    },
    willDrawCell: function(data) {
      // Colorear las celdas de estado
      if (data.column.index === 5 && data.row.index > 0) {
        const estado = data.cell.text[0]?.toLowerCase();
        switch (estado) {
          case 'pendiente':
            data.cell.styles.fillColor = [255, 232, 163];
            data.cell.styles.textColor = [0, 0, 0];
            break;
          case 'autorizada':
            data.cell.styles.fillColor = [168, 230, 207];
            data.cell.styles.textColor = [0, 0, 0];
            break;
          case 'rechazada':
            data.cell.styles.fillColor = [255, 183, 178];
            data.cell.styles.textColor = [0, 0, 0];
            break;
          case 'pagada':
            data.cell.styles.fillColor = [183, 228, 249];
            data.cell.styles.textColor = [0, 0, 0];
            break;
        }
      }
    }
  });

  // Agregar una nueva página para el gráfico y su diseño
  doc.addPage();

  // Resetear el margen superior para la nueva página
  const graficoY = 80;
  
  // Título de la sección de gráficos
  doc.setFillColor(245, 247, 250); // Un fondo gris muy claro
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(18, 61, 140);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Análisis Gráfico de Viáticos', pageWidth / 2, 38, { align: 'center' });

  // Dibujar el gráfico de barras
  const montosPorDepartamento = datos.reduce((acc: {[key: string]: number}, v) => {
    const depto = capitalizar(v.departamento || 'Sin Departamento');
    acc[depto] = (acc[depto] || 0) + (Number(v.monto) || 0);
    return acc;
  }, {});

  // Configuración del gráfico
  const chartX = margin + 20;
  const chartY = graficoY + 20;
  const chartWidth = pageWidth - (margin * 2) - 40;
  const chartHeight = 220;
  const barGap = 15;
  const numBars = Object.keys(montosPorDepartamento).length;
  const barWidth = (chartWidth - (barGap * (numBars - 1))) / numBars;

  // Encontrar el monto máximo para escalar las barras
  const maxMonto = Math.max(...Object.values(montosPorDepartamento), 1); // Evitar división por cero

  // Dibujar fondo del gráfico y ejes
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.rect(chartX, chartY, chartWidth, chartHeight, 'FD');

  // Dibujar líneas de la cuadrícula horizontal
  const gridLines = 5;
  doc.setDrawColor(240, 240, 240);
  doc.setLineWidth(0.5);
  for (let i = 1; i <= gridLines; i++) {
    const y = chartY + (i * (chartHeight / gridLines));
    doc.line(chartX, y, chartX + chartWidth, y);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const label = formatoMoneda(maxMonto * (1 - i / gridLines));
    doc.text(label, chartX - 10, y + 3, { align: 'right' });
  }

  // Paleta de colores profesional
  const colors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#606c38', '#283618'];

  // Dibujar barras
  let currentX = chartX;
  Object.entries(montosPorDepartamento).forEach(([depto, monto], index) => {
    const barHeight = (monto / maxMonto) * chartHeight;
    const y = chartY + chartHeight - barHeight;
    const color = colors[index % colors.length];
    
    // Sombra de la barra
    doc.setFillColor(200, 200, 200);
    doc.rect(currentX + 2, y + 2, barWidth, barHeight, 'F');

    // Barra principal
    doc.setFillColor(color);
    doc.rect(currentX, y, barWidth, barHeight, 'F');
    
    // Etiqueta del departamento (abajo)
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(depto, currentX + barWidth / 2, chartY + chartHeight + 15, { 
      align: 'center',
      maxWidth: barWidth + 5
    });
    
    // Valor de la barra (arriba)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color);
    doc.text(formatoMoneda(monto), currentX + barWidth / 2, y - 8, { align: 'center' });
    
    currentX += barWidth + barGap;
  });

  // Título del gráfico
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 61, 140);
  doc.text('Distribución de Viáticos por Departamento', chartX, chartY - 20);

  // Agregar una leyenda
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('* Los montos mostrados representan el total de viáticos por departamento.', 
    chartX, pageHeight - 60);

  // Agregar pie de página en la página del gráfico
  agregarPiePagina(doc);

  doc.save(`mis_viaticos_${rango}.pdf`);
}
