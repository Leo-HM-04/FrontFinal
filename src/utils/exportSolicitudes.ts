import { Solicitud } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Configuración de columnas
const columns = [
    { header: 'ID', width: 15 },
    { header: 'Folio', width: 25 },
    { header: 'Solicitante', width: 40 },
    { header: 'Departamento', width: 35 },
    { header: 'Tipo Cuenta', width: 30 },
    { header: 'Banco', width: 30 },
    { header: 'Monto', width: 25 },
    { header: 'Estado', width: 25 },
    { header: 'Fecha', width: 35 }
];

// Función auxiliar para filtrar por rango de fecha
const filtrarPorRango = (solicitudes: Solicitud[], rango: string): Solicitud[] => {
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
            inicio.setFullYear(1970);
    }
    
    return solicitudes.filter(s => new Date(s.fecha_creacion) >= inicio);
};

// Función para formatear la fecha
const formatearFecha = (fecha: string): string => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Función para formatear el monto
const formatearMonto = (monto: number): string => {
    if (!monto) return '-';
    return monto.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    });
};

// Exportar a PDF
export const exportSolicitudesPDF = (solicitudes: Solicitud[], rango: string): void => {
    const filtered = filtrarPorRango(solicitudes, rango);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const headerHeight = 45;
    let startY = headerHeight + 40;

        // Preparar los datos principales
    const mainData = filtered.map(s => [
        s.id_solicitud.toString(),
        s.folio || '-',
        s.usuario_nombre || s.id_usuario.toString(),
        s.departamento?.toUpperCase() || '-',
        s.tipo_cuenta_destino === 'Tarjeta' 
            ? `Tarjeta${s.tipo_tarjeta ? ' - ' + s.tipo_tarjeta : ''}`
            : s.tipo_cuenta_destino || '-',
        s.banco_destino || '-',
        formatearMonto(s.monto),
        s.estado?.toUpperCase() || '-',
        formatearFecha(s.fecha_creacion)
    ]);

    // Preparar resumen por estado
    const estados = ['pendiente', 'autorizada', 'rechazada', 'procesada', 'cancelada', 'revisada', 'pagada', 'vencida'];
    const resumenEstados = estados.map(estado => {
        const solicitudesEstado = filtered.filter(s => s.estado === estado);
        const totalMonto = solicitudesEstado.reduce((sum, s) => sum + (s.monto || 0), 0);
        return [
            estado.toUpperCase(),
            solicitudesEstado.length.toString(),
            formatearMonto(totalMonto)
        ];
    }).filter(row => parseInt(row[1]) > 0); // Solo incluir estados con solicitudes

    // Calcular total general
    const totalGeneral = filtered.reduce((sum, s) => sum + (s.monto || 0), 0);

    // Encabezado con degradado profesional
    doc.setFillColor(18, 61, 140); // Color corporativo BECHAPRA #123D8C
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Franja decorativa
    doc.setFillColor(255, 255, 255);
    doc.rect(0, headerHeight - 5, pageWidth, 2, 'F');

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('REPORTE DE SOLICITUDES', pageWidth / 2, headerHeight/2 + 2, { align: 'center' });
    
    // Subtítulo con fecha
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(fechaActual.toUpperCase(), pageWidth / 2, headerHeight/2 + 12, { align: 'center' });

    // Aviso de confidencialidad
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, headerHeight + 5, pageWidth - (margin * 2), 12, 2, 2, 'F');
    doc.setTextColor(180, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENCIAL • DOCUMENTO INTERNO • PROPIEDAD DE BECHAPRA',
        pageWidth / 2, headerHeight + 13, { align: 'center' });

    // Información del período
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
    doc.text(`Total de solicitudes: ${filtered.length}`, pageWidth/2, headerHeight + 30, { align: 'center' });

    // Tabla de resumen
    doc.setFontSize(14);
    doc.setTextColor(18, 61, 140);
    doc.text('RESUMEN POR ESTADO', margin, startY);
    
    let finalY = startY;
    autoTable(doc, {
        head: [['ESTADO', 'CANTIDAD', 'MONTO TOTAL']],
        body: resumenEstados,
        startY: startY + 10,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 8,
            font: 'helvetica',
            lineColor: [220, 220, 220],
            lineWidth: 0.5,
            halign: 'center'
        },
        headStyles: {
            fillColor: [18, 61, 140],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 40 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'right', cellWidth: 40 }
        },
        didDrawCell: function(data) {
            if (data.cursor) {
                finalY = data.cursor.y;
            }
        }
    });

    // Total general
    doc.setFillColor(18, 61, 140);
    doc.setTextColor(255, 255, 255);
    const totalWidth = 150;
    doc.roundedRect(margin, finalY + 10, totalWidth, 12, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GENERAL: ${formatearMonto(totalGeneral)}`, margin + totalWidth/2, finalY + 18, {
        align: 'center'
    });

    // Tabla principal
    startY = finalY + 30;
    doc.setFontSize(14);
    doc.setTextColor(18, 61, 140);
    doc.text('DETALLE DE SOLICITUDES', margin, startY);

    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: mainData,
        startY: startY + 10,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 6,
            font: 'helvetica',
            lineColor: [220, 220, 220],
            lineWidth: 0.5,
            overflow: 'linebreak',
            minCellHeight: 10
        },
        headStyles: {
            fillColor: [18, 61, 140],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            cellPadding: 8
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'center', cellWidth: 25 },
            2: { halign: 'left', cellWidth: 40 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'left', cellWidth: 30 },
            5: { halign: 'left', cellWidth: 30 },
            6: { halign: 'right', cellWidth: 25 },
            7: { halign: 'center', cellWidth: 25 },
            8: { halign: 'center', cellWidth: 35 }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 255]
        },
        didDrawPage: function(data) {
            // Pie de página
            const pageHeight = doc.internal.pageSize.height;
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const fecha = new Date().toLocaleString('es-MX');
            doc.text(`Generado el: ${fecha}`, 40, pageHeight - 20);
            
            // Numeración de página
            doc.setFillColor(245, 247, 250);
            const pageText = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
            doc.text(pageText, pageWidth - 40, pageHeight - 20, { align: 'right' });
        }
    });

    doc.save('reporte-solicitudes.pdf');
};

// Exportar a Excel
export const exportSolicitudesExcel = async (solicitudes: Solicitud[], rango: string): Promise<void> => {
    const filtered = filtrarPorRango(solicitudes, rango);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Solicitudes';
    workbook.lastModifiedBy = 'Sistema de Gestión de Solicitudes';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Solicitudes', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Título del reporte
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Solicitudes';
    titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FFFFFF' }
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '123D8C' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Información adicional
    worksheet.mergeCells('A2:I2');
    const periodoTexto = {
        'dia': 'Último día',
        'semana': 'Última semana',
        'mes': 'Último mes',
        'año': 'Último año',
        'total': 'Todo el historial'
    }[rango];
    worksheet.getCell('A2').value = `Período: ${periodoTexto}`;

    // Encabezados
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '123D8C' }
    };

    // Datos
    filtered.forEach(solicitud => {
        worksheet.addRow([
            solicitud.id_solicitud,
            solicitud.folio || '-',
            solicitud.usuario_nombre || solicitud.id_usuario.toString(),
            solicitud.departamento?.toUpperCase() || '-',
            solicitud.tipo_cuenta_destino === 'Tarjeta'
                ? `Tarjeta${solicitud.tipo_tarjeta ? ' - ' + solicitud.tipo_tarjeta : ''}`
                : solicitud.tipo_cuenta_destino || '-',
            solicitud.banco_destino || '-',
            formatearMonto(solicitud.monto),
            solicitud.estado?.toUpperCase() || '-',
            formatearFecha(solicitud.fecha_creacion)
        ]);
    });

    // Ajustar anchos de columna
    worksheet.columns.forEach((column, i) => {
        column.width = columns[i].width;
    });

    // Guardar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-solicitudes.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
};

// Exportar a CSV
export const exportSolicitudesCSV = async (solicitudes: Solicitud[], rango: string): Promise<void> => {
    const filtered = filtrarPorRango(solicitudes, rango);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Solicitudes');

    // Encabezados
    worksheet.addRow(columns.map(col => col.header));

    // Datos
    filtered.forEach(solicitud => {
        worksheet.addRow([
            solicitud.id_solicitud,
            solicitud.folio || '-',
            solicitud.usuario_nombre || solicitud.id_usuario.toString(),
            solicitud.departamento?.toUpperCase() || '-',
            solicitud.tipo_cuenta_destino === 'Tarjeta'
                ? `Tarjeta${solicitud.tipo_tarjeta ? ' - ' + solicitud.tipo_tarjeta : ''}`
                : solicitud.tipo_cuenta_destino || '-',
            solicitud.banco_destino || '-',
            formatearMonto(solicitud.monto),
            solicitud.estado?.toUpperCase() || '-',
            formatearFecha(solicitud.fecha_creacion)
        ]);
    });

    // Guardar como CSV
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-solicitudes.csv';
    link.click();
    window.URL.revokeObjectURL(url);
};
