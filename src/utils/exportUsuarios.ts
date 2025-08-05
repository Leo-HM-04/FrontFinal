import { User } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Configuración de columnas
const columns = [
    { header: 'ID', width: 20 },
    { header: 'Nombre', width: 60 },
    { header: 'Email', width: 65 },
    { header: 'Rol', width: 40 },
    { header: 'Estado', width: 30 },
    { header: 'Bloqueado', width: 30 },
    { header: 'Fecha Creación', width: 35 }
];

// Función auxiliar para filtrar por rango de fecha y rol
const filtrarPorRango = (usuarios: User[], rango: string): User[] => {
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
    
    return usuarios
        .filter(u => new Date(u.creado_en) >= inicio)
        .filter(u => !u.rol?.toLowerCase().includes('admin'));
};

// Función para formatear la fecha
const formatearFecha = (fecha: string): string => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Función para formatear el rol
const formatearRol = (rol?: string): string => {
    if (!rol) return '-';
    if (rol.toLowerCase() === 'pagador_banca') return 'Pagador';
    if (rol.toLowerCase().includes('admin')) return '';
    return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
};

// Exportar a PDF
export const exportUsuariosPDF = (usuarios: User[], rango: string): void => {
    const filtered = filtrarPorRango(usuarios, rango);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const headerHeight = 45;
    const startY = headerHeight + 40;

    // Preparar los datos con formato mejorado
    const data = filtered.map(u => [
        u.id_usuario.toString(),
        u.nombre,
        u.email,
        formatearRol(u.rol),
        u.activo ? 'Activo' : 'Inactivo',
        u.bloqueado ? 'Sí' : 'No',
        formatearFecha(u.creado_en)
    ]);

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
    doc.text('REPORTE DE USUARIOS', pageWidth / 2, headerHeight/2 + 2, { align: 'center' });
    
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

    // Información del reporte
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
    doc.text(`Total de usuarios: ${filtered.length}`, pageWidth/2, headerHeight + 30, { align: 'center' });

    // Título de la sección de detalles
    doc.setFillColor(18, 61, 140);
    doc.roundedRect(10, startY, pageWidth - 20, 20, 3, 3, 'F');

    // Texto del título con mejor formato
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE USUARIOS', pageWidth / 2, startY + 14, { align: 'center' });

    // Generar la tabla con diseño profesional mejorado
    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data,
        startY: startY + 20,
        margin: { left: 10, right: 10, bottom: margin + 5 },
        styles: {
            fontSize: 8.5,
            cellPadding: 6,
            font: 'helvetica',
            lineColor: [220, 220, 220],
            lineWidth: 0.3,
            overflow: 'linebreak',
            halign: 'left',
            minCellHeight: 12,
            textColor: [50, 50, 50],
            cellWidth: 'auto'
        },
        headStyles: {
            fillColor: [18, 61, 140],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            cellPadding: 10,
            overflow: 'linebreak',
            minCellHeight: 20,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 15 },
            1: { cellWidth: 'auto', fontStyle: 'bold', minCellWidth: 40 },
            2: { cellWidth: 'auto', textColor: [0, 102, 204], minCellWidth: 45 },
            3: { cellWidth: 'auto', halign: 'center', minCellWidth: 25 },
            4: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold', minCellWidth: 20 },
            5: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold', minCellWidth: 20 },
            6: { cellWidth: 'auto', halign: 'center', minCellWidth: 30 }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 255]
        },
        tableLineWidth: 0.5,
        tableLineColor: [200, 200, 200],
        theme: 'grid',
        didDrawPage: function(data) {
            // Pie de página
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            
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
            const textWidth = doc.getTextWidth(pageText);
            doc.roundedRect(pageWidth - textWidth - 50, pageHeight - 25, textWidth + 20, 15, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text(pageText, pageWidth - 40, pageHeight - 20, { align: 'right' });
            
            doc.setTextColor(180, 180, 180);
            doc.setFont('helvetica', 'normal');
            doc.text('BECHAPRA - Sistema de Gestión de Usuarios', pageWidth/2, pageHeight - 20, { align: 'center' });
        },
        willDrawCell: function(data) {
            if (data.section === 'body') {
                if (data.column.index === 4) {
                    const estado = String(data.cell.raw).toLowerCase();
                    if (estado === 'activo') {
                        data.cell.styles.fillColor = [168, 230, 207];
                    } else {
                        data.cell.styles.fillColor = [255, 183, 178];
                    }
                }
                if (data.column.index === 5) {
                    const bloqueado = String(data.cell.raw).toLowerCase();
                    if (bloqueado === 'sí') {
                        data.cell.styles.fillColor = [255, 183, 178];
                    } else {
                        data.cell.styles.fillColor = [168, 230, 207];
                    }
                }
            }
        }
    });

    doc.save('reporte-usuarios.pdf');
};

// Exportar a Excel
export const exportUsuariosExcel = async (usuarios: User[], rango: string): Promise<void> => {
    const filtered = filtrarPorRango(usuarios, rango);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Usuarios';
    workbook.lastModifiedBy = 'Sistema de Gestión de Usuarios';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Usuarios', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Título del reporte
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Reporte de Usuarios';
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
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Generado el: ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`;
    
    // Período
    worksheet.mergeCells('A3:G3');
    const periodoTexto = {
        'dia': 'Último día',
        'semana': 'Última semana',
        'mes': 'Último mes',
        'año': 'Último año',
        'total': 'Todo el historial'
    }[rango];
    worksheet.getCell('A3').value = `Período: ${periodoTexto}`;

    // Aviso de confidencialidad
    worksheet.mergeCells('A4:G4');
    worksheet.getCell('A4').value = 'CONFIDENCIAL: Este documento es propiedad de BECHAPRA';

    // Espacio antes de la tabla
    worksheet.addRow([]);

    // Encabezados
    const headerRow = worksheet.addRow(columns.map(col => col.header));
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '123D8C' }
    };

    // Datos
    filtered.forEach(usuario => {
        const row = worksheet.addRow([
            usuario.id_usuario,
            usuario.nombre,
            usuario.email,
            formatearRol(usuario.rol),
            usuario.activo ? 'Activo' : 'Inactivo',
            usuario.bloqueado ? 'Sí' : 'No',
            formatearFecha(usuario.creado_en)
        ]);

        // Colorear estados
        const estadoCell = row.getCell(5);
        estadoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: usuario.activo ? 'A8E6CF' : 'FFB7B2' }
        };

        const bloqueadoCell = row.getCell(6);
        bloqueadoCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: usuario.bloqueado ? 'FFB7B2' : 'A8E6CF' }
        };
    });

    // Ajustar anchos de columna
    worksheet.columns = [
        { key: 'ID', width: 10 },
        { key: 'Nombre', width: 30 },
        { key: 'Email', width: 35 },
        { key: 'Rol', width: 15 },
        { key: 'Estado', width: 12 },
        { key: 'Bloqueado', width: 12 },
        { key: 'Fecha Creación', width: 20 }
    ];

    // Guardar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-usuarios.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
};

// Exportar a CSV
export const exportUsuariosCSV = async (usuarios: User[], rango: string): Promise<void> => {
    const filtered = filtrarPorRango(usuarios, rango);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    // Encabezados
    worksheet.addRow(columns.map(col => col.header));

    // Datos
    filtered.forEach(usuario => {
        worksheet.addRow([
            usuario.id_usuario,
            usuario.nombre,
            usuario.email,
            formatearRol(usuario.rol),
            usuario.activo ? 'Activo' : 'Inactivo',
            usuario.bloqueado ? 'Sí' : 'No',
            formatearFecha(usuario.creado_en)
        ]);
    });

    // Guardar como CSV
    const buffer = await workbook.csv.writeBuffer();
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte-usuarios.csv';
    link.click();
    window.URL.revokeObjectURL(url);
};
