/**
 * exportUtils.ts
 *
 * Archivo central para la exportación de datos en el sistema BECHAPRA.
 * Proporciona funciones para generar y descargar archivos en formatos PDF, Excel, CSV y JSON, permitiendo reportes profesionales y personalizados.
 * Su objetivo principal es facilitar la exportación de información relevante (solicitudes, usuarios, pagos) de manera clara, ordenada y lista para compartir o analizar.
 * Incluye validaciones, estilos avanzados y opciones de personalización para cada tipo de archivo exportado.
 */
import { User, Solicitud } from '@/types';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

// ============ TIPOS Y INTERFACES ============

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

export interface PDFStats {
  totalSolicitudes: number;
  montoTotal: number;
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  departamentos: Set<string>;
  montoPromedio: number;
  solicitudesPorDia: number;
}

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
  width?: number;
  formatter?: (value: unknown, item?: T) => string;
  align?: 'left' | 'center' | 'right';
}

export interface ExportOptions {
  includeStats?: boolean;
  includeCharts?: boolean;
  customTitle?: string;
  companyLogo?: string;
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
}

// ============ CONSTANTES Y CONFIGURACIÓN ============

const COMPANY_CONFIG = {
  name: 'BECHAPRA',
  fullName: 'BECHAPRA Business Services - Sistema de Gestión de Pagos',
  colors: {
    primary: [18, 61, 140] as [number, number, number],
    secondary: [52, 152, 219] as [number, number, number],
    success: [46, 204, 113] as [number, number, number],
    warning: [241, 196, 15] as [number, number, number],
    danger: [231, 76, 60] as [number, number, number],
    info: [155, 89, 182] as [number, number, number]
  },
  logoUrl: 'https://media.licdn.com/dms/image/v2/D4E0BAQEEoooIoWmBfw/company-logo_200_200/company-logo_200_200/0/1734988712036/bechapra_logo?e=2147483647&v=beta&t=Zud09Nh9JmjqB47tZ4cPzFAN9NtiyXWDqvlyqqRZAV0'
};

const LOCALE_CONFIG = {
  country: 'es-CO',
  currency: 'COP',
  timezone: 'America/Bogota'
};

// ============ UTILIDADES CORE ============

class ExportUtils {
  // Formatea números grandes con unidades (mil, millones, etc.) sin redondear, usando separador de miles
  private static formatLargeNumberExact(amount: number): string {
    const absAmount = Math.abs(amount);
    let unit = '';
    let value = amount;
    if (absAmount >= 1_000_000_000_000) {
      value = amount / 1_000_000_000_000;
      unit = ' billones';
    } else if (absAmount >= 1_000_000_000) {
      value = amount / 1_000_000_000;
      unit = ' mil millones';
    } else if (absAmount >= 1_000_000) {
      value = amount / 1_000_000;
      unit = ' millones';
    } else if (absAmount >= 1_000) {
      value = amount / 1_000;
      unit = ' mil';
    } else {
      value = amount;
      unit = '';
    }
    // Mostrar todos los decimales exactos, sin redondear, y con separador de miles
    const valueStr = value.toLocaleString(LOCALE_CONFIG.country, { minimumFractionDigits: 0, maximumFractionDigits: 20 }).replace(/\.?0+$/, '');
    return valueStr + unit;
  }
  private static async downloadFile(content: string | Blob, filename: string, mimeType: string): Promise<void> {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: mimeType }) 
      : content;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    try {
      link.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat(LOCALE_CONFIG.country, {
      style: 'currency',
      currency: LOCALE_CONFIG.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private static formatDate(date: string | Date, includeTime = false): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString(LOCALE_CONFIG.country, options);
  }

  private static generateFilename(prefix: string, extension: string, itemCount?: number): string {
    const date = new Date().toISOString().split('T')[0];
    const count = itemCount ? `_${itemCount}items` : '';
    return `${COMPANY_CONFIG.name}_${prefix}_${date}${count}.${extension}`;
  }

  private static calculateStats(solicitudes: Solicitud[]): PDFStats {
    const total = solicitudes.length;
    const montoTotal = solicitudes.reduce((sum, s) => sum + s.monto, 0);
    
    return {
      totalSolicitudes: total,
      montoTotal,
      pendientes: solicitudes.filter(s => s.estado.toLowerCase() === 'pendiente').length,
      aprobadas: solicitudes.filter(s => s.estado.toLowerCase() === 'aprobada' || s.estado.toLowerCase() === 'autorizada').length,
      rechazadas: solicitudes.filter(s => s.estado.toLowerCase() === 'rechazada').length,
      departamentos: new Set(solicitudes.map(s => s.departamento)),
      montoPromedio: total > 0 ? montoTotal / total : 0,
      solicitudesPorDia: this.calculateDailyAverage(solicitudes)
    };
  }

  private static calculateDailyAverage(solicitudes: Solicitud[]): number {
    if (solicitudes.length === 0) return 0;
    
    const fechas = solicitudes.map(s => new Date(s.fecha_creacion).getTime());
    const fechaMin = Math.min(...fechas);
    const fechaMax = Math.max(...fechas);
    const diasTranscurridos = Math.max(1, Math.ceil((fechaMax - fechaMin) / (1000 * 60 * 60 * 24)));
    
    return solicitudes.length / diasTranscurridos;
  }

  private static async getImageBase64(url: string, timeoutMs = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading image'));
      }, timeoutMs);
      
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        clearTimeout(timeout);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Error loading image'));
      };
      
      img.src = url;
    });
  }

  // ============ EXPORTADORES CSV ============

  static exportToCSV<T>(data: T[], filename: string, columns: ExportColumn<T>[]): void {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const value = item[col.key];
        const formatted = col.formatter ? col.formatter(value, item) : value;
        const stringValue = String(formatted ?? '').replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('"') ? `"${stringValue}"` : stringValue;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static exportUsuariosToCSV(usuarios: User[]): void {
    const columns: ExportColumn<User>[] = [
      { key: 'id_usuario', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'rol', label: 'Rol' },
      { key: 'bloqueado', label: 'Bloqueado', formatter: (value) => value ? 'Sí' : 'No' },
      { key: 'creado_en', label: 'Fecha Creación', formatter: (value) => this.formatDate(value as string) }
    ];
    
    const filename = this.generateFilename('Usuarios', 'csv', usuarios.length);
    this.exportToCSV(usuarios, filename, columns);
  }

  static exportSolicitudesToCSV(solicitudes: Solicitud[], options: ExportOptions = {}): void {
    // const hasFolio = solicitudes.length > 0 && 'folio' in solicitudes[0];
    const columns: ExportColumn<Solicitud & { tipoCuentaTarjeta?: string }>[] = [
      { key: 'id_solicitud', label: 'ID' },
      { key: 'fecha_creacion', label: 'Fecha Solicitud', formatter: (value) => this.formatDate(value as string) },
      { key: 'departamento', label: 'Departamento' },
      { key: 'monto', label: 'Monto', formatter: (value) => this.formatCurrency(typeof value === 'number' ? value : Number(value)) },
      { key: 'cuenta_destino', label: 'Cuenta Destino' },
      { key: 'tipoCuentaTarjeta', label: 'Tipo de Cuenta/Tarjeta', formatter: (v, item) => {
        const s = item as Solicitud;
        if (s.tipo_cuenta_destino && s.tipo_tarjeta) return `${s.tipo_cuenta_destino} / ${s.tipo_tarjeta}`;
        if (s.tipo_cuenta_destino) return s.tipo_cuenta_destino;
        if (s.tipo_tarjeta) return s.tipo_tarjeta;
        return '-';
      } },
      { key: 'estado', label: 'Estado' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'fecha_limite_pago', label: 'Fecha Límite', formatter: (value) => this.formatDate(value as string) },
      { key: 'usuario_nombre', label: 'Solicitante', formatter: (value, item) => typeof value === 'string' && value ? value : item && typeof item.id_usuario === 'number' ? `Usuario ${item.id_usuario}` : '' },
      { key: 'aprobador_nombre', label: 'Aprobador', formatter: (value, item) => typeof value === 'string' && value !== 'N/A' ? value : item && typeof item.id_aprobador === 'number' ? `Aprobador ${item.id_aprobador}` : 'N/A' }
    ];

    let csvContent = '';
    if (options.includeStats) {
      const stats = this.calculateStats(solicitudes);
      const pagosPorTipo = this.calculatePaymentTypeStats(solicitudes);
      csvContent += 'REPORTE DE SOLICITUDES\n';
      csvContent += `Generado: ${this.formatDate(new Date(), true)}\n`;
      csvContent += `Total de solicitudes: ${stats.totalSolicitudes}\n`;
      csvContent += `Monto total: ${this.formatCurrency(stats.montoTotal)}\n`;
      csvContent += `Promedio por solicitud: ${this.formatCurrency(stats.montoPromedio)}\n\n`;
      csvContent += 'TENDENCIA DE PAGOS POR TIPO:\n';
      Object.entries(pagosPorTipo).forEach(([tipo, info]) => {
        csvContent += `${tipo}: ${info.cantidad} pago(s), Total: ${this.formatCurrency(info.total)}\n`;
      });
      csvContent += '\n';
    }
    // Añadir datos principales
    const headers = columns.map(col => col.label).join(',');
    const rows = solicitudes.map(item => 
      columns.map(col => {
        // Acceso seguro y tipado estricto
        const value = item[col.key as keyof Solicitud];
        const formatted = col.formatter ? col.formatter(value, item) : value;
        const stringValue = String(formatted ?? '').replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('"') ? `"${stringValue}"` : stringValue;
      }).join(',')
    );
    csvContent += [headers, ...rows].join('\n');
    const filename = this.generateFilename('Solicitudes', 'csv', solicitudes.length);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static exportPagosToCSV(pagos: PagoProcesado[]): void {
    const columns: ExportColumn<PagoProcesado>[] = [
      { key: 'id_pago', label: 'ID Pago' },
      { key: 'id_solicitud', label: 'ID Solicitud' },
      { key: 'solicitante', label: 'Solicitante' },
      { key: 'departamento', label: 'Departamento' },
      { key: 'monto', label: 'Monto', formatter: (value) => this.formatCurrency(typeof value === 'number' ? value : Number(value)) },
      { key: 'concepto', label: 'Concepto' },
      { key: 'fecha_pago', label: 'Fecha Pago', formatter: (value) => this.formatDate(value as string) },
      { key: 'estado', label: 'Estado' },
      { key: 'urgencia', label: 'Urgencia' },
      { key: 'metodo_pago', label: 'Método de Pago' },
      { key: 'banco_destino', label: 'Banco Destino' },
      { key: 'cuenta_destino', label: 'Cuenta Destino' },
      { key: 'comprobante_id', label: 'Comprobante ID' }
    ];
    
    const filename = this.generateFilename('PagosProcesados', 'csv', pagos.length);
    this.exportToCSV(pagos, filename, columns);
  }

  // ============ EXPORTADORES EXCEL ============

  static async exportToExcel<T>(data: T[], filename: string, columns: ExportColumn<T>[], options: ExportOptions = {}): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Configurar metadatos del libro
    workbook.creator = COMPANY_CONFIG.fullName;
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = options.customTitle || 'Reporte de Datos';

    const worksheet = workbook.addWorksheet('Datos', {
      headerFooter: {
        firstHeader: `&C&"Arial,Bold"${COMPANY_CONFIG.name}`,
        firstFooter: `&L&D &T&C${options.confidentialityLevel?.toUpperCase() || 'CONFIDENCIAL'}&Rpágina &P de &N`
      }
    });

    // Configurar encabezados con estilo
    const headerRow = worksheet.addRow(columns.map(col => col.label));
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + COMPANY_CONFIG.colors.primary.map(c => c.toString(16).padStart(2, '0')).join('') }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Añadir datos con formato
    data.forEach((item, rowIndex) => {
      const row = worksheet.addRow(
        columns.map(col => {
          const value = item[col.key];
          return col.formatter ? col.formatter(value, item) : value;
        })
      );

      // Aplicar estilos alternos
      if (rowIndex % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        });
      }

      // Aplicar alineación según configuración
      row.eachCell((cell, colNumber) => {
        const column = columns[colNumber - 1];
        cell.alignment = { 
          horizontal: column.align || 'left', 
          vertical: 'middle' 
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });
    });

    // Ajustar ancho de columnas automáticamente
    columns.forEach((col, idx) => {
      const columnIndex = idx + 1;
      const column = worksheet.getColumn(columnIndex);
      
      if (col.width) {
        column.width = col.width;
      } else {
        const maxLength = Math.max(
          col.label.length,
      ...data.map(item => {
        const value = item[col.key];
        const formatted = col.formatter ? col.formatter(value, item) : value;
        return String(formatted ?? '').length;
      })
        );
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Añadir hoja de estadísticas si se solicita
    if (options.includeStats && typeof data[0] === 'object' && data[0] !== null && 'monto' in (data[0] as Record<string, unknown>)) {
      this.addStatsSheet(workbook, data as Solicitud[]);
    }

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    await this.downloadFile(blob, filename, blob.type);
  }

  static async exportSolicitudesToExcel(solicitudes: Solicitud[], options: ExportOptions = {}): Promise<void> {
    // const hasFolio = solicitudes.length > 0 && 'folio' in solicitudes[0];
    const columns: ExportColumn<Solicitud & { tipoCuentaTarjeta?: string }>[] = [
      { key: 'id_solicitud', label: 'ID', width: 8, align: 'center' },
      { key: 'fecha_creacion', label: 'Fecha Solicitud', width: 14, align: 'center', formatter: (value) => this.formatDate(value as string) },
      { key: 'departamento', label: 'Departamento', width: 20 },
      { key: 'monto', label: 'Monto', width: 15, align: 'right', formatter: (value) => this.formatCurrency(typeof value === 'number' ? value : Number(value)) },
      { key: 'cuenta_destino', label: 'Cuenta Destino', width: 25 },
      { key: 'tipoCuentaTarjeta', label: 'Tipo de Cuenta/Tarjeta', width: 22, formatter: (v, item) => {
        const s = item as Solicitud;
        if (s.tipo_cuenta_destino && s.tipo_tarjeta) return `${s.tipo_cuenta_destino} / ${s.tipo_tarjeta}`;
        if (s.tipo_cuenta_destino) return s.tipo_cuenta_destino;
        if (s.tipo_tarjeta) return s.tipo_tarjeta;
        return '-';
      } },
      { key: 'estado', label: 'Estado', width: 12, align: 'center' },
      { key: 'concepto', label: 'Concepto', width: 30 },
      { key: 'fecha_limite_pago', label: 'Fecha Límite', width: 12, align: 'center', formatter: (value) => this.formatDate(value as string) },
      { key: 'usuario_nombre', label: 'Solicitante', width: 20, formatter: (value, item) => typeof value === 'string' && value ? value : item && typeof item.id_usuario === 'number' ? `Usuario ${item.id_usuario}` : '' },
      { key: 'aprobador_nombre', label: 'Aprobador', width: 20, formatter: (value, item) => typeof value === 'string' && value !== 'N/A' ? value : item && typeof item.id_aprobador === 'number' ? `Aprobador ${item.id_aprobador}` : 'N/A' }
    ];

    const filename = this.generateFilename('Solicitudes', 'xlsx', solicitudes.length);
    await this.exportToExcel(solicitudes, filename, columns, { ...options, includeStats: true });
  }

  private static addStatsSheet(workbook: ExcelJS.Workbook, solicitudes: Solicitud[]): void {
    const statsSheet = workbook.addWorksheet('Estadísticas');
    const stats = this.calculateStats(solicitudes);
    const pagosPorTipo = this.calculatePaymentTypeStats(solicitudes);
    const estados = this.calculateStateTotals(solicitudes);

    // Detectar si hay columna folio
    // const hasFolio = solicitudes.length > 0 && 'folio' in solicitudes[0];

    // Título
    const titleRow = statsSheet.addRow(['RESUMEN EJECUTIVO']);
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF' + COMPANY_CONFIG.colors.primary.map(c => c.toString(16).padStart(2, '0')).join('') } };
    statsSheet.addRow([]);

    // Métricas generales
    // columns no se usa

    // const tableData = ... (no se usa)
    statsSheet.addRow(['Aprobadas', estados.aprobadas.cantidad, this.formatCurrency(estados.aprobadas.monto)]);
    statsSheet.addRow(['Pendientes', estados.pendientes.cantidad, this.formatCurrency(estados.pendientes.monto)]);
    statsSheet.addRow(['Rechazadas', estados.rechazadas.cantidad, this.formatCurrency(estados.rechazadas.monto)]);
    if (statsSheet.lastRow) {
      statsSheet.getRow(statsSheet.lastRow.number).font = { bold: true };
    }
    statsSheet.addRow([]);
    statsSheet.addRow(['ANÁLISIS POR TIPO DE PAGO']).getCell(1).font = { size: 14, bold: true };
    Object.entries(pagosPorTipo).forEach(([tipo, data]) => {
      const percentage = ((data.total / stats.montoTotal) * 100).toFixed(1);
      statsSheet.addRow([tipo, `${data.cantidad} solicitudes (${percentage}%)`, this.formatCurrency(data.total)]);
    });

    // Ajustar columnas
    statsSheet.getColumn(1).width = 25;
    statsSheet.getColumn(2).width = 20;
    statsSheet.getColumn(3).width = 15;
  }

  // ============ EXPORTADORES PDF ============

  static async exportSolicitudesToPDF(solicitudes: Solicitud[], options: ExportOptions = {}): Promise<void> {
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const stats = this.calculateStats(solicitudes);

    // Configurar metadatos
    doc.setProperties({
      title: options.customTitle || `Reporte de Solicitudes - ${this.formatDate(new Date())}`,
      subject: 'Reporte de Solicitudes BECHAPRA',
      author: COMPANY_CONFIG.fullName,
      creator: COMPANY_CONFIG.name
    });

    // Cabecera profesional
    await this.createProfessionalHeader(doc, pageWidth, stats, options);

    // Línea divisoria elegante bajo la cabecera
    doc.setDrawColor(18, 61, 140);
    doc.setLineWidth(1.2);
    doc.line(10, 42, pageWidth - 10, 42);

    // Descripción general del reporte (centrada y clara)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(
      'Este archivo contiene un reporte profesional y detallado de las solicitudes de pago, usuarios y movimientos registrados en el sistema BECHAPRA.\n' +
      'Permite analizar, compartir y validar la información relevante de manera clara y ordenada. Incluye métricas, tablas y leyendas para facilitar la interpretación de los datos exportados.',
      pageWidth / 2,
      50,
      { align: 'center', maxWidth: pageWidth - 40 }
    );

    // Resumen de montos por estado en tabla profesional como la imagen
    const resumenMontosY = 62;
    const estadosMontos = this.calculateMontosPorEstado(solicitudes);
    
    // Crear datos para la tabla de resumen
    const resumenData = [
      ['Pendientes', solicitudes.filter(s => s.estado === 'pendiente').length.toString(), this.formatCurrency(Number(estadosMontos.pendiente) || 0)],
      ['Rechazadas', solicitudes.filter(s => s.estado === 'rechazada').length.toString(), this.formatCurrency(Number(estadosMontos.rechazada) || 0)],
      ['Pagadas', solicitudes.filter(s => s.estado === 'pagada').length.toString(), this.formatCurrency(Number(estadosMontos.pagada) || 0)],
      ['Autorizadas', solicitudes.filter(s => s.estado === 'autorizada').length.toString(), this.formatCurrency(Number(estadosMontos.autorizada) || 0)]
    ].filter(row => parseInt(row[1]) > 0); // Solo mostrar estados que tienen solicitudes

    // El total general debe ser la suma de todos los montos de todas las solicitudes
    const totalGeneral = solicitudes.reduce((sum, s) => {
      let monto = 0;
      if (typeof s.monto === 'number' && !isNaN(s.monto)) {
        monto = s.monto;
      } else if (typeof s.monto === 'string') {
        const parsed = parseFloat(String(s.monto).replace(/[^\d.-]/g, ''));
        monto = !isNaN(parsed) ? parsed : 0;
      } else {
        const parsed = Number(s.monto);
        monto = !isNaN(parsed) ? parsed : 0;
      }
      return sum + monto;
    }, 0);

    // Crear tabla de resumen con autoTable
    autoTable(doc, {
      head: [['Estado', 'Cantidad', 'Total']],
      body: resumenData,
      startY: resumenMontosY,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [18, 61, 140], // Color azul corporativo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 60 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 60 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    // Obtener posición final de la tabla
    const finalY = (doc as any).lastAutoTable.finalY;

    // Total general debajo de la tabla
    const totalY = finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(18, 61, 140);
    doc.text('Total General:', 15, totalY);
    doc.text(this.formatCurrency(totalGeneral), pageWidth - 15, totalY, { align: 'right' });

    // Asegura que la tabla y leyenda siempre queden al menos 10mm debajo del resumen
    const tableStartY = totalY + 15;
    await this.createSolicitudesTable(doc, solicitudes, tableStartY, pageWidth);
    this.addProfessionalFooter(doc, pageWidth, pageHeight, options, true);

    // Guardar archivo
    const filename = this.generateFilename('Solicitudes', 'pdf', solicitudes.length);
    doc.save(filename);
  }

  private static async createProfessionalHeader(doc: jsPDF, pageWidth: number, stats: PDFStats, options: ExportOptions): Promise<void> {
    // Fondo con gradiente
    doc.setFillColor(...COMPANY_CONFIG.colors.primary);
    doc.roundedRect(0, 0, pageWidth, 40, 0, 0, 'F');
    
    // Intentar cargar logo
    try {
      const logoBase64 = await this.getImageBase64(options.companyLogo || COMPANY_CONFIG.logoUrl);
      doc.addImage(logoBase64, 'PNG', 10, 6, 24, 24, undefined, 'FAST');
    } catch {
      // Logo alternativo con texto
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 6, 24, 24, 3, 3, 'F');
      doc.setTextColor(...COMPANY_CONFIG.colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(COMPANY_CONFIG.name, 22, 20, { align: 'center' });
    }

    // Información del header
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(COMPANY_CONFIG.name, 40, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text(options.customTitle || 'Reporte de Solicitudes de Pago', 40, 25);

    // Información resumida (corregir NaN)
    // const montoTotal = isNaN(stats.montoTotal) ? 0 : stats.montoTotal;
    const headerInfo = `${stats.totalSolicitudes} Solicitudes | ${stats.departamentos.size} Departamentos`;
    doc.setFontSize(13);
    doc.text(headerInfo, 40, 36);

    // Fecha de generación
    const fechaGeneracion = this.formatDate(new Date(), true);
    doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 15, 20, { align: 'right' });

    // Línea decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(10, 38, pageWidth - 10, 38);
  }

  private static async createExecutiveSummary(doc: jsPDF, pageWidth: number, stats: PDFStats, solicitudes: Solicitud[], options: ExportOptions): Promise<number> {
    if (!options.includeStats) return 50;
    
    const startY = 50;
    
    // Título del resumen
    doc.setTextColor(...COMPANY_CONFIG.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RESUMEN EJECUTIVO', 15, startY);

    // Crear tabla de métricas profesional como en las imágenes
    const metricsData = [
      ['Total Solicitudes', stats.totalSolicitudes.toString()],
      ['Monto Total', this.formatCurrency(stats.montoTotal)],
      ['Aprobadas', `${stats.aprobadas} (${((stats.aprobadas/stats.totalSolicitudes)*100).toFixed(0)}%)`],
      ['Pendientes', `${stats.pendientes} (${((stats.pendientes/stats.totalSolicitudes)*100).toFixed(0)}%)`],
      ['Promedio', this.formatCurrency(stats.montoPromedio)]
    ];

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: metricsData,
      startY: startY + 10,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [18, 61, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 80 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    // Obtener posición final de la primera tabla
    const firstTableFinalY = (doc as any).lastAutoTable.finalY;

    // Tabla de resumen por estado
    const estados = this.calculateStateTotals(solicitudes);
    const estadosData = [
      ['Aprobadas', estados.aprobadas.cantidad.toString(), this.formatCurrency(estados.aprobadas.monto)],
      ['Pendientes', estados.pendientes.cantidad.toString(), this.formatCurrency(estados.pendientes.monto)],
      ['Rechazadas', estados.rechazadas.cantidad.toString(), this.formatCurrency(estados.rechazadas.monto)]
    ];

    autoTable(doc, {
      head: [['Estado', 'Cantidad', 'Monto']],
      body: estadosData,
      startY: firstTableFinalY + 10,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [18, 61, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 60 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 60 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    return finalY + 10;
  }

  private static async createSolicitudesTable(doc: jsPDF, solicitudes: Solicitud[], startY: number, pageWidth: number): Promise<void> {
    // Agregar columna de prioridad con iconos
    // Ajuste de columnas para mayor estabilidad visual y evitar cortes
    // Si existe la propiedad 'folio' en los datos, agregar la columna
    const hasFolio = solicitudes.length > 0 && 'folio' in solicitudes[0];
    // Mejorar legibilidad: mostrar solo columnas clave y aumentar anchos
    // Puedes ajustar aquí qué columnas ocultar si es necesario
    // Restaurar todas las columnas clave y ajustar anchos para que la tabla no se corte ni se vea apretada
    // Suma total de anchos aprox. <= 275mm para A4 landscape
    // Mejorar legibilidad: filas más altas, fuente y padding mayores, columnas clave más anchas
    // Ajustar para que la suma de anchos ocupe el ancho útil de la hoja
    // A4 landscape útil: ~275mm (márgenes incluidos)
    // Rediseño: columnas distribuidas dinámicamente para ocupar el 100% del ancho útil
    const margin = 15;
    const usableWidth = pageWidth - margin * 2;
    // Ajuste: más espacio para Monto, F. Límite, Cuenta Destino y Tipo de Cuenta/Tarjeta
    const baseColumns = [
      { key: 'id_solicitud', label: 'ID', min: 12, rel: 0.9 },
      ...(hasFolio ? [{ key: 'folio', label: 'Folio', min: 16, rel: 1.1 }] : []),
      { key: 'departamento', label: 'Departamento', min: 22, rel: 1.2 },
      { key: 'monto', label: 'Monto', min: 22, rel: 1.5 },
      { key: 'cuenta_destino', label: 'Cuenta Destino', min: 36, rel: 2.1 },
      { key: 'tipoCuentaTarjeta', label: 'Tipo Cuenta/Tarj.', min: 30, rel: 1.7 },
      { key: 'estado', label: 'Estado', min: 13, rel: 0.9 },
      { key: 'concepto', label: 'Concepto', min: 28, rel: 1.5 },
      { key: 'fecha_limite_pago', label: 'F. Límite', min: 20, rel: 1.5 },
      { key: 'usuario_nombre', label: 'Solicitante', min: 14, rel: 1 },
      { key: 'aprobador_nombre', label: 'Aprobador', min: 14, rel: 1 },
      { key: 'prioridad', label: 'Prioridad', min: 10, rel: 0.7 }
    ];
    const totalRel = baseColumns.reduce((sum, c) => sum + c.rel, 0);
    // Calcular anchos proporcionales pero nunca menores al mínimo
    const columns = baseColumns.map(c => ({
      ...c,
      width: Math.max(c.min, Math.floor((c.rel / totalRel) * usableWidth))
    }));
    // Ajuste final: si sobra o falta por redondeo, ajustar la última columna
    const widthSum = columns.reduce((sum, c) => sum + c.width, 0);
    if (widthSum !== usableWidth) {
      columns[columns.length - 1].width += usableWidth - widthSum;
    }

    const tableData = solicitudes.map(item => columns.map(col => {
      let value: unknown;
      if (col.key === 'tipoCuentaTarjeta') {
        if (item.tipo_cuenta_destino && item.tipo_tarjeta) value = `${item.tipo_cuenta_destino} / ${item.tipo_tarjeta}`;
        else if (item.tipo_cuenta_destino) value = item.tipo_cuenta_destino;
        else if (item.tipo_tarjeta) value = item.tipo_tarjeta;
        else value = '-';
      } else {
        value = item[col.key as keyof Solicitud];
      }
      if (col.key === 'monto') {
        value = this.formatCurrency(typeof value === 'number' ? value : Number(value));
      } else if (col.key === 'fecha_limite_pago' || col.key === 'fecha_creacion') {
        value = this.formatDate(value as string);
      } else if (col.key === 'usuario_nombre') {
        value = typeof value === 'string' && value ? value : item && typeof item.id_usuario === 'number' ? `Usuario ${item.id_usuario}` : '';
      } else if (col.key === 'aprobador_nombre') {
        value = typeof value === 'string' && value !== 'N/A' ? value : item && typeof item.id_aprobador === 'number' ? `Aprobador ${item.id_aprobador}` : 'N/A';
      } else if (col.key === 'prioridad') {
        if (String(value).toLowerCase() === 'alta') value = 'Alta';
        else if (String(value).toLowerCase() === 'media') value = 'Media';
        else value = 'Baja';
      }
      return String(value || '');
    }));

    // Leyenda visual de prioridad (más ordenada y profesional)
    const legendY = startY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 60);
    doc.text('Leyenda de prioridad', pageWidth / 2, legendY, { align: 'center' });

    // Tarjetas de prioridad más compactas y mejor centradas
    const legendCardW = (pageWidth - 36) / 3;
    const legendCardH = 18;
    const legendCardY = legendY + 8;
    const legendBg = [245, 250, 255]; // azul grisáceo muy claro
    const legendData = [
      {
        label: 'Alta',
        desc: 'Solicitudes urgentes que requieren atención inmediata.',
        color: [220, 53, 69]
      },
      {
        label: 'Media',
        desc: 'Importantes pero no urgentes.',
        color: [255, 193, 7]
      },
      {
        label: 'Baja',
        desc: 'Pueden esperar sin afectar procesos críticos.',
        color: [40, 167, 69]
      }
    ];
    legendData.forEach((item, idx) => {
      const x = 8 + idx * (legendCardW + 10);
      // Fondo suave
      doc.setFillColor(legendBg[0], legendBg[1], legendBg[2]);
      doc.roundedRect(x, legendCardY, legendCardW, legendCardH, 4, 4, 'F');
      // Borde sutil
      doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, legendCardY, legendCardW, legendCardH, 4, 4);
      // Centrado vertical y horizontal
      const centerY = legendCardY + legendCardH / 2;
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.label + ':', x + 10, centerY - 1.5, { align: 'left' });
      // Descripción
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(item.desc, x + 10, centerY + 4.5, { align: 'left', maxWidth: legendCardW - 16 });
    });

    // Ajustar el inicio de la tabla para que nunca se sobreponga con la leyenda
    const tableY = legendCardY + legendCardH + 8;
    autoTable(doc, {
      willDrawCell: function(data) {
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.text[0] = '';
        }
        if (data.column.index === 8 && data.section === 'body') {
          data.cell.text[0] = '';
        }
      },
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: tableY,
      theme: 'striped',
      headStyles: {
        fillColor: COMPANY_CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5,
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        lineWidth: 0.6,
        lineColor: [18, 61, 140],
        overflow: 'visible',
        minCellHeight: 7
      },
      alternateRowStyles: { 
        fillColor: [242, 245, 252] // Contraste sutil, look corporativo
      },
      styles: {
        fontSize: 9.5,
        cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
        valign: 'middle',
        halign: 'center',
        textColor: [40, 40, 40],
        overflow: 'linebreak',
        lineWidth: 0.3,
        lineColor: [180, 180, 200],
        minCellHeight: 7
      },
      columnStyles: columns.reduce((acc, col, index) => {
        acc[index] = { 
          cellWidth: col.width,
          halign: (col.key === 'monto') ? 'right' : ((col.key === 'id_solicitud' || col.key === 'estado' || col.key === 'prioridad') ? 'center' : 'left')
        };
        return acc;
      }, {} as { [key: number]: Partial<{ cellWidth: number; halign: 'left' | 'center' | 'right' }> }),
      didDrawCell: function(data) {
        // Colorear estados y prioridad para mejor visualización
        if (data.column.index === 3 && data.section === 'body') {
          let estadoRaw: unknown;
          if (Array.isArray(data.row.raw)) {
            estadoRaw = data.row.raw[3];
          } else if (data.cell.raw) {
            estadoRaw = data.cell.raw;
          } else {
            estadoRaw = data.cell.text[0];
          }
          const estado = String(estadoRaw).toLowerCase();
          let color: [number, number, number] = [45, 45, 45];
          const fontStyle = 'bold';
          if (estado.includes('aprobada') || estado.includes('autorizada')) {
            color = COMPANY_CONFIG.colors.success as [number, number, number];
          } else if (estado.includes('pendiente')) {
            color = COMPANY_CONFIG.colors.warning as [number, number, number];
          } else if (estado.includes('rechazada')) {
            color = COMPANY_CONFIG.colors.danger as [number, number, number];
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(9.5);
          doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }

        if (data.column.index === 8 && data.section === 'body') {
          let prioridadRaw: unknown;
          if (Array.isArray(data.row.raw)) {
            prioridadRaw = data.row.raw[8];
          } else if (data.cell.raw) {
            prioridadRaw = data.cell.raw;
          } else {
            prioridadRaw = data.cell.text[0];
          }
          const prioridad = String(prioridadRaw).toLowerCase();
          let color: [number, number, number] = [45, 45, 45];
          if (prioridad.includes('alta')) {
            color = [220, 53, 69]; // Rojo
          } else if (prioridad.includes('media')) {
            color = [255, 193, 7]; // Amarillo
          } else if (prioridad.includes('baja')) {
            color = [40, 167, 69]; // Verde
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(prioridad.charAt(0).toUpperCase() + prioridad.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }
      }
    });
  }

  private static addProfessionalFooter(doc: jsPDF, pageWidth: number, pageHeight: number, options: ExportOptions, showContact = false): void {
    const totalPages = doc.getNumberOfPages();
    const confidentiality = options.confidentialityLevel?.toUpperCase() || 'CONFIDENCIAL - USO INTERNO';
    const contacto = 'Contacto: soporte@bechapra.com | +57 123 456 7890';
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Línea superior del footer
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
      // Información del footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      // Izquierda: Información de la empresa
      doc.text(`© ${COMPANY_CONFIG.fullName}`, 15, pageHeight - 12);
      if (showContact) {
        doc.text(contacto, 15, pageHeight - 8);
      } else {
        doc.text('Documento generado automáticamente', 15, pageHeight - 8);
      }
      // Centro: Clasificación del documento
      doc.text(confidentiality, pageWidth/2, pageHeight - 10, { align: 'center' });
      // Derecha: Numeración de páginas y fecha
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
      doc.text(this.formatDate(new Date()), pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
  }

  // Calcula montos por estado para el resumen profesional
  private static calculateMontosPorEstado(solicitudes: Solicitud[]) {
    const estados = {
      pendiente: 0,
      rechazada: 0,
      pagada: 0,
      autorizada: 0
    };
    solicitudes.forEach(s => {
      const estado = s.estado.toLowerCase();
      if (estado === 'pendiente') {
        estados.pendiente += s.monto;
      } else if (estado === 'rechazada') {
        estados.rechazada += s.monto;
      } else if (estado === 'pagada') {
        estados.pagada += s.monto;
      } else if (estado === 'autorizada' || estado === 'aprobada') {
        estados.autorizada += s.monto;
      }
    });
    return estados;
  }

  // ============ UTILIDADES ESPECÍFICAS ============

  private static calculatePaymentTypeStats(solicitudes: Solicitud[]) {
    const pagosPorTipo: Record<string, { cantidad: number; total: number; promedio: number }> = {};
    
    solicitudes.forEach(s => {
      const tipo = s.tipo_pago || 'Sin tipo';
      if (!pagosPorTipo[tipo]) {
        pagosPorTipo[tipo] = { cantidad: 0, total: 0, promedio: 0 };
      }
      pagosPorTipo[tipo].cantidad++;
      pagosPorTipo[tipo].total += s.monto;
    });

    // Calcular promedios
    Object.keys(pagosPorTipo).forEach(tipo => {
      pagosPorTipo[tipo].promedio = pagosPorTipo[tipo].total / pagosPorTipo[tipo].cantidad;
    });

    return pagosPorTipo;
  }

  // Calcula totales y montos por estado
  private static calculateStateTotals(solicitudes: Solicitud[]) {
    const estados = {
      aprobadas: { cantidad: 0, monto: 0 },
      pendientes: { cantidad: 0, monto: 0 },
      rechazadas: { cantidad: 0, monto: 0 }
    };
    solicitudes.forEach(s => {
      const estado = s.estado.toLowerCase();
      if (estado === 'aprobada' || estado === 'autorizada') {
        estados.aprobadas.cantidad++;
        estados.aprobadas.monto += s.monto;
      } else if (estado === 'pendiente') {
        estados.pendientes.cantidad++;
        estados.pendientes.monto += s.monto;
      } else if (estado === 'rechazada') {
        estados.rechazadas.cantidad++;
        estados.rechazadas.monto += s.monto;
      }
    });
    return estados;
  }

  static exportDetailedReport(usuarios: User[], solicitudes: Solicitud[]): void {
    const stats = this.calculateStats(solicitudes);
    const pagosPorTipo = this.calculatePaymentTypeStats(solicitudes);
    
    const report = {
      metadata: {
        generado_en: new Date().toISOString(),
        generado_por: COMPANY_CONFIG.fullName,
        version: '2.0.0',
        tipo_reporte: 'Reporte Detallado Completo'
      },
      resumen_general: {
        usuarios: {
          total: usuarios.length,
          activos: usuarios.filter(u => !u.bloqueado).length,
          bloqueados: usuarios.filter(u => u.bloqueado).length,
          por_rol: {
            admin_general: usuarios.filter(u => u.rol === 'admin_general').length,
            solicitante: usuarios.filter(u => u.rol === 'solicitante').length,
            aprobador: usuarios.filter(u => u.rol === 'aprobador').length,
            pagador_banca: usuarios.filter(u => u.rol === 'pagador_banca').length
          }
        },
        solicitudes: {
          total: stats.totalSolicitudes,
          pendientes: stats.pendientes,
          aprobadas: stats.aprobadas,
          rechazadas: stats.rechazadas,
          monto_total: stats.montoTotal,
          monto_promedio: stats.montoPromedio,
          solicitudes_por_dia: stats.solicitudesPorDia
        }
      },
      analisis_detallado: {
        por_departamento: solicitudes.reduce((acc: Record<string, { cantidad: number; monto_total: number; monto_promedio: number }>, s) => {
          if (!acc[s.departamento]) {
            acc[s.departamento] = { cantidad: 0, monto_total: 0, monto_promedio: 0 };
          }
          acc[s.departamento].cantidad++;
          acc[s.departamento].monto_total += s.monto;
          acc[s.departamento].monto_promedio = acc[s.departamento].monto_total / acc[s.departamento].cantidad;
          return acc;
        }, {}),
        por_tipo_pago: pagosPorTipo,
        tendencias_temporales: this.calculateTemporalTrends(solicitudes)
      }
    };

    const filename = this.generateFilename('ReporteDetallado', 'json');
    this.downloadFile(JSON.stringify(report, null, 2), filename, 'application/json');
  }

  private static calculateTemporalTrends(solicitudes: Solicitud[]) {
    const trends = solicitudes.reduce((acc: Record<string, { cantidad: number; monto_total: number; crecimiento_cantidad?: string; crecimiento_monto?: string }>, s) => {
      const fecha = new Date(s.fecha_creacion);
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!acc[mes]) {
        acc[mes] = { cantidad: 0, monto_total: 0 };
      }
      acc[mes].cantidad++;
      acc[mes].monto_total += s.monto;
      return acc;
    }, {});

    // Calcular crecimiento mes a mes
    const meses = Object.keys(trends).sort();
    meses.forEach((mes, index) => {
      if (index > 0) {
        const mesAnterior = meses[index - 1];
        trends[mes].crecimiento_cantidad = ((trends[mes].cantidad - trends[mesAnterior].cantidad) / trends[mesAnterior].cantidad * 100).toFixed(2) + '%';
        trends[mes].crecimiento_monto = ((trends[mes].monto_total - trends[mesAnterior].monto_total) / trends[mesAnterior].monto_total * 100).toFixed(2) + '%';
      }
    });

    return trends;
  }

  // ============ EXPORTADORES JSON MEJORADOS ============

  static exportToJSON<T>(data: T, filename: string, options: ExportOptions = {}): void {
    const exportData = {
      metadata: {
        exportado_en: new Date().toISOString(),
        exportado_por: COMPANY_CONFIG.fullName,
        titulo: options.customTitle || 'Exportación de Datos',
        confidencialidad: options.confidentialityLevel || 'confidential',
        total_registros: Array.isArray(data) ? data.length : 1
      },
      datos: data
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  // ============ VALIDACIONES Y UTILIDADES ============

  static validateData<T>(data: T[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Array.isArray(data)) {
      errors.push('Los datos deben ser un array');
      return { isValid: false, errors };
    }
    if (data.length === 0) {
      errors.push('No hay datos para exportar');
      return { isValid: false, errors };
    }
    // Validaciones específicas para solicitudes
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null && 'monto' in (data[0] as Record<string, unknown>)) {
      const solicitudes = data as Solicitud[];
      const invalidMontos = solicitudes.filter(s => !s.monto || s.monto <= 0);
      if (invalidMontos.length > 0) {
        errors.push(`${invalidMontos.length} solicitudes tienen montos inválidos`);
      }
      const invalidFechas = solicitudes.filter(s => !s.fecha_creacion || isNaN(new Date(s.fecha_creacion).getTime()));
      if (invalidFechas.length > 0) {
        errors.push(`${invalidFechas.length} solicitudes tienen fechas inválidas`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  static async exportWithValidation<T>(
    data: T[], 
    exportFunction: (data: T[]) => Promise<void> | void,
    showErrors = true
  ): Promise<boolean> {
    const validation = this.validateData(data);
    
    if (!validation.isValid) {
      if (showErrors) {
        console.error('Errores de validación:', validation.errors);
        // Aquí podrías mostrar un toast o modal con los errores
      }
      return false;
    }

    try {
      await exportFunction(data);
      return true;
    } catch (error) {
      if (showErrors) {
        console.error('Error durante la exportación:', error);
      }
      return false;
    }
  }

  // ============ MÉTODOS DE UTILIDAD PÚBLICOS ============

  static getAvailableFormats(): string[] {
    return ['csv', 'xlsx', 'pdf', 'json'];
  }

  static getRecommendedFormat(dataSize: number, includeStats: boolean): string {
    if (dataSize > 10000) return 'csv'; // Para grandes volúmenes
    if (includeStats) return 'xlsx'; // Para análisis detallado
    if (dataSize < 100) return 'pdf'; // Para reportes ejecutivos
    return 'xlsx'; // Por defecto
  }

  static estimateFileSize(dataCount: number, format: string): string {
    const baseSize = {
      csv: 0.5, // KB por registro
      xlsx: 1.2,
      pdf: 2.0,
      json: 0.8
    };

    const estimatedKB = (baseSize[format as keyof typeof baseSize] || 1) * dataCount;
    
    if (estimatedKB < 1024) return `~${Math.round(estimatedKB)} KB`;
    return `~${(estimatedKB / 1024).toFixed(1)} MB`;
  }

  // ============ EXPORTACIÓN DE VIÁTICOS ============

  static async exportViaticosToPDF(viaticos: Solicitud[], options: ExportOptions = {}): Promise<void> {
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const stats = this.calculateViaticoStats(viaticos);

    // Configurar metadatos
    doc.setProperties({
      title: options.customTitle || `Reporte de Viáticos - ${this.formatDate(new Date())}`,
      subject: 'Reporte de Viáticos BECHAPRA',
      author: COMPANY_CONFIG.fullName,
      creator: COMPANY_CONFIG.name
    });

    // Cabecera profesional específica para viáticos
    await this.createViaticoHeader(doc, pageWidth, stats, options);

    // Línea divisoria elegante bajo la cabecera
    doc.setDrawColor(18, 61, 140);
    doc.setLineWidth(1.2);
    doc.line(10, 42, pageWidth - 10, 42);

    // Descripción específica para viáticos con diseño profesional
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    
    // Fondo sutil para la descripción
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 46, pageWidth - 40, 12, 2, 2, 'F');
    
    doc.text(
      'Reporte ejecutivo de viáticos pendientes con análisis de urgencias, fechas límite y métricas de gestión.\n' +
      'Sistema BECHAPRA - Módulo de Gestión de Viáticos y Gastos de Representación.',
      pageWidth / 2,
      52,
      { align: 'center', maxWidth: pageWidth - 50 }
    );

    // Resumen de viáticos con métricas específicas
    const resumenY = 64;
    const viaticoMetrics = this.calculateViaticoMetrics(viaticos);
    const tableEndY = this.createViaticoSummaryTable(doc, pageWidth, resumenY, viaticoMetrics);

    // Tabla de viáticos
    const tableStartY = tableEndY + 10;
    await this.createViaticosTable(doc, viaticos, tableStartY, pageWidth);
    
    // Footer profesional específico para viáticos
    this.addViaticoFooter(doc, pageWidth, pageHeight, viaticos, options);

    // Guardar archivo
    const filename = this.generateFilename('Viaticos', 'pdf', viaticos.length);
    doc.save(filename);
  }

  private static calculateViaticoStats(viaticos: Solicitud[]): PDFStats {
    const totalViaticos = viaticos.length;
    const montoTotal = viaticos.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    const pendientes = viaticos.filter(v => v.estado === 'pendiente').length;
    const urgentes = viaticos.filter(v => {
      const fechaLimite = new Date(v.fecha_limite_pago);
      const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      return fechaLimite < tresDias;
    }).length;
    const departamentos = new Set(viaticos.map(v => v.departamento).filter(Boolean));
    const montoPromedio = totalViaticos > 0 ? montoTotal / totalViaticos : 0;

    return {
      totalSolicitudes: totalViaticos,
      montoTotal,
      pendientes,
      aprobadas: 0, // Los viáticos generalmente están en estado pendiente
      rechazadas: 0,
      departamentos,
      montoPromedio,
      solicitudesPorDia: 0
    };
  }

  private static calculateViaticoMetrics(viaticos: Solicitud[]) {
    const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const urgentes = viaticos.filter(v => new Date(v.fecha_limite_pago) < tresDias);
    const montoUrgentes = urgentes.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    const montoTotal = viaticos.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    
    return {
      total: viaticos.length,
      urgentes: urgentes.length,
      montoTotal,
      montoUrgentes,
      porcentajeUrgentes: viaticos.length > 0 ? (urgentes.length / viaticos.length) * 100 : 0
    };
  }

  private static async createViaticoHeader(doc: jsPDF, pageWidth: number, stats: PDFStats, options: ExportOptions): Promise<void> {
    // Fondo con gradiente azul corporativo profesional
    doc.setFillColor(...COMPANY_CONFIG.colors.primary); // Azul fuerte corporativo
    doc.roundedRect(0, 0, pageWidth, 40, 0, 0, 'F');
    
    // Intentar cargar logo
    try {
      const logoBase64 = await this.getImageBase64(options.companyLogo || COMPANY_CONFIG.logoUrl);
      doc.addImage(logoBase64, 'PNG', 10, 6, 24, 24, undefined, 'FAST');
    } catch {
      // Logo alternativo con texto
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 6, 24, 24, 3, 3, 'F');
      doc.setTextColor(...COMPANY_CONFIG.colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(COMPANY_CONFIG.name, 22, 20, { align: 'center' });
    }

    // Información del header específica para viáticos
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(COMPANY_CONFIG.name, 40, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('Reporte Ejecutivo de Viáticos', 40, 25);

    // Información resumida
    const headerInfo = `${stats.totalSolicitudes} Viáticos Pendientes | ${stats.departamentos.size} Departamentos`;
    doc.setFontSize(13);
    doc.text(headerInfo, 40, 36);

    // Fecha de generación
    const fechaGeneracion = this.formatDate(new Date(), true);
    doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 15, 20, { align: 'right' });

    // Línea decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.line(10, 38, pageWidth - 10, 38);
  }

  private static createViaticoSummaryTable(doc: jsPDF, pageWidth: number, startY: number, metrics: {
    total: number;
    urgentes: number;
    montoTotal: number;
    montoUrgentes: number;
    porcentajeUrgentes: number;
  }): number {
    // Crear tabla de resumen de viáticos como en las imágenes
    const viaticoData = [
      ['Total Viáticos', metrics.total.toString()],
      ['Urgentes', metrics.urgentes.toString()],
      ['Monto Total', this.formatCurrency(metrics.montoTotal)],
      ['Monto Urgentes', this.formatCurrency(metrics.montoUrgentes)],
      ['Porcentaje Urgentes', `${metrics.porcentajeUrgentes.toFixed(1)}%`]
    ];

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: viaticoData,
      startY: startY,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [18, 61, 140],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 80 }
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Indicador de urgencia profesional debajo de la tabla
    const urgencyY = finalY + 10;
    if (metrics.porcentajeUrgentes > 0) {
      // Mensaje de alerta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COMPANY_CONFIG.colors.danger);
      const urgencyText = `ALERTA: ${metrics.porcentajeUrgentes.toFixed(1)}% de los viáticos requieren atención inmediata`;
      doc.text(urgencyText, pageWidth / 2, urgencyY, { align: 'center' });
    } else {
      // Mensaje positivo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COMPANY_CONFIG.colors.success);
      doc.text('ESTADO: Todos los viáticos están dentro de los tiempos normales', pageWidth / 2, urgencyY, { align: 'center' });
    }
    
    return urgencyY + 10;
  }

  private static async createViaticosTable(doc: jsPDF, viaticos: Solicitud[], startY: number, pageWidth: number): Promise<void> {
    // Preparar datos de la tabla
    const tableData = viaticos.map(v => {
      const fechaLimite = new Date(v.fecha_limite_pago);
      const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const isUrgent = fechaLimite < tresDias;
      
      return [
        v.folio || v.id_solicitud?.toString() || '-',
        v.usuario_nombre || `Usuario ${v.id_usuario}`,
        v.departamento || '-',
        this.formatCurrency(Number(v.monto) || 0),
        this.formatDate(v.fecha_creacion),
        this.formatDate(v.fecha_limite_pago),
        isUrgent ? 'URGENTE' : 'NORMAL',
        v.tipo_pago || '-',
        v.banco_destino || '-'
      ];
    });

    // Configurar tabla con diseño profesional azul
    autoTable(doc, {
      head: [[
        'Folio',
        'Solicitante', 
        'Departamento',
        'Monto',
        'Fecha Solicitud',
        'Fecha Límite',
        'Prioridad',
        'Tipo Pago',
        'Banco Destino'
      ]],
      body: tableData,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: COMPANY_CONFIG.colors.primary, // Azul corporativo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Azul muy claro alternado
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }, // Folio
        1: { halign: 'left', cellWidth: 35 },   // Solicitante
        2: { halign: 'center', cellWidth: 25 }, // Departamento
        3: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },  // Monto
        4: { halign: 'center', cellWidth: 22 }, // Fecha Solicitud
        5: { halign: 'center', cellWidth: 22 }, // Fecha Límite
        6: { halign: 'center', cellWidth: 20, fontStyle: 'bold' }, // Prioridad
        7: { halign: 'center', cellWidth: 20 }, // Tipo Pago
        8: { halign: 'center', cellWidth: 25 }  // Banco
      },
      didParseCell: (data) => {
        // Resaltar filas urgentes con colores corporativos
        if (data.section === 'body' && Array.isArray(data.row.raw) && data.row.raw[6] && data.row.raw[6].toString().includes('URGENTE')) {
          data.cell.styles.fillColor = [254, 242, 242]; // Fondo rojo muy claro
          if (data.column.index === 6) { // Columna de prioridad
            data.cell.styles.textColor = COMPANY_CONFIG.colors.danger;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Estilo especial para montos
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = COMPANY_CONFIG.colors.success;
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Estilo para folios
        if (data.section === 'body' && data.column.index === 0) {
          data.cell.styles.textColor = COMPANY_CONFIG.colors.primary;
        }
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto',
      styles: {
        cellPadding: 3,
        fontSize: 9,
        valign: 'middle'
      }
    });
  }

  private static addViaticoFooter(doc: jsPDF, pageWidth: number, pageHeight: number, viaticos: Solicitud[], options: ExportOptions): void {
    const footerY = pageHeight - 25;
    
    // Línea divisoria superior
    doc.setDrawColor(...COMPANY_CONFIG.colors.primary);
    doc.setLineWidth(1);
    doc.line(10, footerY - 5, pageWidth - 10, footerY - 5);
    
    // Fondo sutil del footer
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY - 3, pageWidth, 28, 'F');
    
    // Información de confidencialidad
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COMPANY_CONFIG.colors.primary);
    doc.text('DOCUMENTO CONFIDENCIAL - BECHAPRA', 15, footerY + 2);
    
    // Estadísticas del reporte
    const urgentes = viaticos.filter(v => {
      const fechaLimite = new Date(v.fecha_limite_pago);
      const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      return fechaLimite < tresDias;
    }).length;
    
    const montoTotal = viaticos.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total: ${viaticos.length} viáticos | Urgentes: ${urgentes} | Monto: ${this.formatCurrency(montoTotal)}`, 15, footerY + 8);
    
    // Información del sistema
    doc.text(`Sistema BECHAPRA v2.0 | Módulo de Viáticos | ${new Date().getFullYear()}`, 15, footerY + 14);
    
    // Página y fecha en la derecha
    doc.setTextColor(...COMPANY_CONFIG.colors.primary);
    doc.text(`Página 1`, pageWidth - 15, footerY + 2, { align: 'right' });
    doc.setTextColor(100, 100, 100);
    doc.text(`${this.formatDate(new Date(), true)}`, pageWidth - 15, footerY + 8, { align: 'right' });
    
    // Logo pequeño o marca de agua (opcional)
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(6);
    doc.text('Powered by BECHAPRA Business Services', pageWidth - 15, footerY + 14, { align: 'right' });
  }

  static async exportViaticosToExcel(viaticos: Solicitud[], options: ExportOptions = {}): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Viáticos');

    // Configurar propiedades del archivo
    workbook.creator = COMPANY_CONFIG.fullName;
    workbook.title = 'Reporte de Viáticos';
    workbook.subject = 'Exportación de viáticos BECHAPRA';

    // Encabezados de columnas específicos para viáticos
    const headers = [
      'Folio',
      'Usuario Solicitante',
      'Departamento',
      'Monto',
      'Fecha Solicitud',
      'Fecha Límite Pago',
      'Días Restantes',
      'Prioridad',
      'Tipo Pago',
      'Banco Destino',
      'Estado'
    ];

    // Aplicar encabezados
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    viaticos.forEach(viatico => {
      const fechaLimite = new Date(viatico.fecha_limite_pago);
      const diasRestantes = Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isUrgent = fechaLimite < tresDias;

      const row = worksheet.addRow([
        viatico.folio || viatico.id_solicitud?.toString() || '-',
        viatico.usuario_nombre || `Usuario ${viatico.id_usuario}`,
        viatico.departamento || '-',
        Number(viatico.monto) || 0,
        viatico.fecha_creacion ? this.formatDate(viatico.fecha_creacion) : '-',
        viatico.fecha_limite_pago ? this.formatDate(viatico.fecha_limite_pago) : '-',
        diasRestantes,
        isUrgent ? 'URGENTE' : 'NORMAL',
        viatico.tipo_pago || '-',
        viatico.banco_destino || '-',
        viatico.estado || 'pendiente'
      ]);

      // Colorear filas urgentes
      if (isUrgent) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
      }
    });

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 15 }, // Folio
      { width: 30 }, // Usuario
      { width: 20 }, // Departamento
      { width: 15 }, // Monto
      { width: 18 }, // Fecha Solicitud
      { width: 18 }, // Fecha Límite
      { width: 15 }, // Días Restantes
      { width: 12 }, // Prioridad
      { width: 15 }, // Tipo Pago
      { width: 20 }, // Banco
      { width: 12 }  // Estado
    ];

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.generateFilename('Viaticos', 'xlsx', viaticos.length);
    link.click();
    URL.revokeObjectURL(url);
  }

  static exportViaticosToCSV(viaticos: Solicitud[]): void {
    const headers = [
      'Folio',
      'Usuario Solicitante',
      'Departamento',
      'Monto',
      'Fecha Solicitud',
      'Fecha Límite Pago',
      'Días Restantes',
      'Prioridad',
      'Tipo Pago',
      'Banco Destino',
      'Estado'
    ];

    let csvContent = 'REPORTE DE VIÁTICOS\n';
    csvContent += `Generado: ${this.formatDate(new Date(), true)}\n`;
    csvContent += `Total de viáticos: ${viaticos.length}\n\n`;
    csvContent += headers.join(',') + '\n';

    const tresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    viaticos.forEach(viatico => {
      const fechaLimite = new Date(viatico.fecha_limite_pago);
      const diasRestantes = Math.ceil((fechaLimite.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isUrgent = fechaLimite < tresDias;

      const row = [
        `"${(viatico.folio || viatico.id_solicitud?.toString() || '-').toString().replace(/"/g, '""')}"`,
        `"${(viatico.usuario_nombre || `Usuario ${viatico.id_usuario}`).toString().replace(/"/g, '""')}"`,
        `"${(viatico.departamento || '-').toString().replace(/"/g, '""')}"`,
        Number(viatico.monto) || 0,
        viatico.fecha_creacion ? this.formatDate(viatico.fecha_creacion) : '-',
        viatico.fecha_limite_pago ? this.formatDate(viatico.fecha_limite_pago) : '-',
        diasRestantes,
        isUrgent ? 'URGENTE' : 'NORMAL',
        `"${(viatico.tipo_pago || '-').toString().replace(/"/g, '""')}"`,
        `"${(viatico.banco_destino || '-').toString().replace(/"/g, '""')}"`,
        `"${(viatico.estado || 'pendiente').toString().replace(/"/g, '""')}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    this.downloadFile(csvContent, this.generateFilename('Viaticos', 'csv', viaticos.length), 'text/csv');
  }
}

// ============ EXPORTACIÓN DE LA CLASE ============

export default ExportUtils;

// ============ FUNCIONES DE COMPATIBILIDAD (LEGACY) ============

export const exportToCSV = ExportUtils.exportToCSV.bind(ExportUtils);
export const exportToJSON = ExportUtils.exportToJSON.bind(ExportUtils);
export const exportToExcel = ExportUtils.exportToExcel.bind(ExportUtils);
export const exportUsuariosToCSV = ExportUtils.exportUsuariosToCSV.bind(ExportUtils);
export const exportSolicitudesToCSV = ExportUtils.exportSolicitudesToCSV.bind(ExportUtils);
export const exportSolicitudesToExcel = ExportUtils.exportSolicitudesToExcel.bind(ExportUtils);
export const exportSolicitudesToPDF = ExportUtils.exportSolicitudesToPDF.bind(ExportUtils);
export const exportViaticosToPDF = ExportUtils.exportViaticosToPDF.bind(ExportUtils);
export const exportViaticosToExcel = ExportUtils.exportViaticosToExcel.bind(ExportUtils);
export const exportViaticosToCSV = ExportUtils.exportViaticosToCSV.bind(ExportUtils);
export const exportDetailedReport = ExportUtils.exportDetailedReport.bind(ExportUtils);
export const exportPagosToCSV = ExportUtils.exportPagosToCSV.bind(ExportUtils);