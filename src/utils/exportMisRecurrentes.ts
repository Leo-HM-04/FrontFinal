import { PlantillaRecurrente } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Función auxiliar para filtrar por rango de fecha
const filtrarPorRango = (recurrentes: PlantillaRecurrente[], rango: string) => {
    const hoy = new Date();
    const inicio = new Date();
    
    switch (rango) {
        case 'dia':
            inicio.setDate(hoy.getDate() - 1);
            break;
        case 'semana':
            inicio.setDate(hoy.getDate() - 7);
            break;
        case 'mes':
            inicio.setMonth(hoy.getMonth() - 1);
            break;
        case 'año':
            inicio.setFullYear(hoy.getFullYear() - 1);
            break;
        default:
            return recurrentes;
    }
    
    return recurrentes.filter(r => new Date(r.created_at) >= inicio);
};

// Función para formatear la moneda
const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(monto);
};

// Función para formatear la fecha
const formatearFecha = (fecha: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Exportar a PDF
export const exportMisRecurrentesPDF = (recurrentes: PlantillaRecurrente[], rango: string) => {
    const filtered = filtrarPorRango(recurrentes, rango);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

    // Encabezado con degradado profesional
    const headerHeight = 45; // Altura optimizada para mejor proporción
    doc.setFillColor(18, 61, 140); // Color corporativo BECHAPRA #123D8C
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Franja decorativa inferior del header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, headerHeight - 5, pageWidth, 2, 'F');

    // Título principal con estilo moderno y elegante
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE DE PAGOS RECURRENTES', pageWidth / 2, headerHeight/2 + 2, { align: 'center' });
    
    // Subtítulo con fecha
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(fechaActual.toUpperCase(), pageWidth / 2, headerHeight/2 + 12, { align: 'center' });

    // Aviso de confidencialidad con diseño profesional
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, headerHeight + 5, pageWidth - (margin * 2), 12, 2, 2, 'F');
    doc.setTextColor(180, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENCIAL • DOCUMENTO INTERNO • PROPIEDAD DE BECHAPRA',
        pageWidth / 2, headerHeight + 13, { align: 'center' });

    // Información del reporte con diseño moderno
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaReporte = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generado: ${fechaReporte}`, margin + 5, headerHeight + 30);

    // Información del período con estilo profesional y moderno
    const periodoTexto = {
        'dia': 'ÚLTIMO DÍA',
        'semana': 'ÚLTIMA SEMANA',
        'mes': 'ÚLTIMO MES',
        'año': 'ÚLTIMO AÑO',
        'total': 'HISTORIAL COMPLETO'
    }[rango];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 61, 140);
    doc.text(`PERÍODO: ${periodoTexto}`, pageWidth - margin - 5, headerHeight + 30, { align: 'right' });

    // Total de registros
    doc.setFontSize(10);
    doc.setTextColor(18, 61, 140);
    doc.text(`Total de registros: ${filtered.length}`, pageWidth/2, headerHeight + 30, { align: 'center' });

    // Configurar las columnas con ancho específico y optimizado
    const columns = [
        { header: 'ID', width: 15 },
        { header: 'Departamento', width: 45 },
        { header: 'Monto', width: 25 },
        { header: 'Concepto', width: 50 },
        { header: 'Tipo Pago', width: 25 },
        { header: 'Frecuencia', width: 25 },
        { header: 'Estado', width: 20 },
        { header: 'Sig. Fecha', width: 25 }
    ];

    // Preparar los datos
    const data = filtered.map(r => [
        r.id_recurrente,
        r.departamento?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        formatearMoneda(Number(r.monto)),
        r.concepto,
        r.tipo_pago?.charAt(0).toUpperCase() + r.tipo_pago?.slice(1).toLowerCase(),
        r.frecuencia?.charAt(0).toUpperCase() + r.frecuencia?.slice(1).toLowerCase(),
        r.estado?.charAt(0).toUpperCase() + r.estado?.slice(1).toLowerCase(),
        formatearFecha(r.siguiente_fecha)
    ]);

    // Generar la tabla
    // Título de la sección de detalles con diseño mejorado
    const startY = headerHeight + 40;
    doc.setFillColor(18, 61, 140);
    doc.roundedRect(margin, startY, pageWidth - (margin * 2), 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE PAGOS RECURRENTES', margin + 10, startY + 11);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data,
        startY: startY + 20,
        margin: { left: margin, right: margin, bottom: margin + 5 },
        styles: {
            fontSize: 9,
            cellPadding: 6,
            font: 'helvetica',
            lineColor: [230, 230, 230],
            lineWidth: 0.2,
            overflow: 'linebreak',
            halign: 'left',
            minCellHeight: 12,
            textColor: [50, 50, 50]
        },
        headStyles: {
            fillColor: [18, 61, 140],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            cellPadding: 6
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: columns[0].width },
            1: { cellWidth: columns[1].width },
            2: { halign: 'right', cellWidth: columns[2].width },
            3: { cellWidth: columns[3].width },
            4: { cellWidth: columns[4].width },
            5: { cellWidth: columns[5].width },
            6: { cellWidth: columns[6].width },
            7: { cellWidth: columns[7].width }
        },
        alternateRowStyles: {
            fillColor: [245, 245, 255]
        },
        didDrawPage: function(data) {
            // Pie de página profesional
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            
            // Línea separadora elegante
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const fecha = new Date().toLocaleString('es-MX');
            doc.text(`Generado el: ${fecha}`, 40, pageHeight - 20);
            
            // Numeración de página elegante con fondo
            doc.setFillColor(245, 247, 250);
            const pageText = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
            const textWidth = doc.getTextWidth(pageText);
            doc.roundedRect(pageWidth - textWidth - 50, pageHeight - 25, textWidth + 20, 15, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text(pageText, pageWidth - 40, pageHeight - 20, { align: 'right' });
            
            // Logo o texto de la empresa
            doc.setTextColor(180, 180, 180);
            doc.setFont('helvetica', 'normal');
            doc.text('BECHAPRA - Sistema de Pagos Recurrentes', pageWidth/2, pageHeight - 20, { align: 'center' });
        },
        willDrawCell: function(data) {
            // Colorear las celdas de estado
            if (data.column.index === 6 && data.section === 'body') {
                const estado = String(data.cell.raw).toLowerCase();
                switch (estado) {
                    case 'pendiente':
                        data.cell.styles.fillColor = [255, 232, 163];
                        data.cell.styles.textColor = [0, 0, 0];
                        break;
                    case 'activo':
                        data.cell.styles.fillColor = [168, 230, 207];
                        data.cell.styles.textColor = [0, 0, 0];
                        break;
                    case 'inactivo':
                        data.cell.styles.fillColor = [255, 183, 178];
                        data.cell.styles.textColor = [0, 0, 0];
                        break;
                }
            }
        }
    });

    // Guardar el PDF
    doc.save('mis-recurrentes.pdf');
};

// Exportar a Excel
export const exportMisRecurrentesExcel = async (recurrentes: PlantillaRecurrente[], rango: string) => {
    const filtered = filtrarPorRango(recurrentes, rango);
    
    // Preparar los datos
    const data = filtered.map(r => ({
        'ID': r.id_recurrente,
        'Departamento': r.departamento?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        'Monto': formatearMoneda(Number(r.monto)),
        'Concepto': r.concepto,
        'Tipo Pago': r.tipo_pago?.charAt(0).toUpperCase() + r.tipo_pago?.slice(1).toLowerCase(),
        'Frecuencia': r.frecuencia?.charAt(0).toUpperCase() + r.frecuencia?.slice(1).toLowerCase(),
        'Estado': r.estado?.charAt(0).toUpperCase() + r.estado?.slice(1).toLowerCase(),
        'Activo': r.activo ? 'Sí' : 'No',
        'Siguiente Fecha': formatearFecha(r.siguiente_fecha),
        'Fecha Creación': formatearFecha(r.created_at)
    }));

    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Pagos Recurrentes';
    workbook.lastModifiedBy = 'Sistema de Pagos Recurrentes';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Crear y configurar la hoja
    const worksheet = workbook.addWorksheet('Recurrentes', {
        pageSetup: {
            paperSize: 9, // A4
            orientation: 'landscape'
        }
    });

    // Título del reporte con estilo corporativo
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Pagos Recurrentes';
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FFFFFF' }
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '123D8C' } // Color corporativo BECHAPRA
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } }
    };

    // Información adicional con estilo profesional
    worksheet.mergeCells('A2:J2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`;
    infoCell.font = { name: 'Arial', size: 11, color: { argb: '666666' } };
    infoCell.alignment = { horizontal: 'center' };
    
    // Período y confidencialidad
    worksheet.mergeCells('A3:J3');
    const periodCell = worksheet.getCell('A3');
    const periodoTexto = {
        'dia': 'Último día',
        'semana': 'Última semana',
        'mes': 'Último mes',
        'año': 'Último año',
        'total': 'Todo el historial'
    }[rango];
    periodCell.value = `Período: ${periodoTexto}`;
    periodCell.font = { name: 'Arial', bold: true, size: 11, color: { argb: '123D8C' } };
    periodCell.alignment = { horizontal: 'center' };

    // Aviso de confidencialidad
    worksheet.mergeCells('A4:J4');
    const confidentialCell = worksheet.getCell('A4');
    confidentialCell.value = 'CONFIDENCIAL: Este documento es propiedad de BECHAPRA. Para uso interno exclusivo.';
    confidentialCell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF0000' } };
    confidentialCell.alignment = { horizontal: 'center' };
    
    // Espacio antes de la tabla
    worksheet.addRow([]);

    // Encabezados con estilo profesional
    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '123D8C' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30; // Altura personalizada para mejor visualización
    
    // Bordes para encabezados
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFF' } }
        };
    });

    // Añadir datos con formato
    data.forEach(row => {
        const dataRow = worksheet.addRow(Object.values(row));
        dataRow.alignment = { vertical: 'middle' };
    });

    // Configurar ancho de columnas
    worksheet.columns = [
        { key: 'ID', width: 10 },
        { key: 'Departamento', width: 20 },
        { key: 'Monto', width: 15 },
        { key: 'Concepto', width: 40 },
        { key: 'Tipo Pago', width: 15 },
        { key: 'Frecuencia', width: 15 },
        { key: 'Estado', width: 12 },
        { key: 'Activo', width: 10 },
        { key: 'Siguiente Fecha', width: 18 },
        { key: 'Fecha Creación', width: 18 }
    ];

    // Aplicar bordes y alineación a todas las celdas con datos
    const lastRow = worksheet.rowCount;
    const lastCol = worksheet.columnCount;
    for (let i = 3; i <= lastRow; i++) {
        for (let j = 1; j <= lastCol; j++) {
            const cell = worksheet.getCell(i, j);
            cell.border = {
                top: { style: 'thin', color: { argb: 'E0E0E0' } },
                left: { style: 'thin', color: { argb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
                right: { style: 'thin', color: { argb: 'E0E0E0' } }
            };

            // Alineación específica por columna
            if (j === 1) { // ID
                cell.alignment = { horizontal: 'center' };
            } else if (j === 3) { // Monto
                cell.alignment = { horizontal: 'right' };
            } else {
                cell.alignment = { horizontal: 'left' };
            }
        }

        // Alternar colores de fondo en las filas
        if (i % 2 === 0) {
            worksheet.getRow(i).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F5F5FF' }
            };
        }
    }

    // Guardar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis-recurrentes.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
};

// Exportar a CSV
export const exportMisRecurrentesCSV = async (recurrentes: PlantillaRecurrente[], rango: string) => {
    const filtered = filtrarPorRango(recurrentes, rango);
    
    // Preparar los datos
    const data = filtered.map(r => ({
        'ID': r.id_recurrente,
        'Departamento': r.departamento,
        'Monto': formatearMoneda(Number(r.monto)),
        'Concepto': r.concepto,
        'Tipo Pago': r.tipo_pago,
        'Frecuencia': r.frecuencia,
        'Estado': r.estado,
        'Activo': r.activo ? 'Sí' : 'No',
        'Siguiente Fecha': formatearFecha(r.siguiente_fecha),
        'Fecha Creación': formatearFecha(r.created_at)
    }));

    // Crear workbook y worksheet para CSV
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recurrentes');

    // Añadir encabezados
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Añadir datos
    data.forEach(row => {
        worksheet.addRow(Object.values(row));
    });

    // Convertir a CSV
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mis-recurrentes.csv';
    link.click();
    window.URL.revokeObjectURL(url);
};
