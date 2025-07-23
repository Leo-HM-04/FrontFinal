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
  formatter?: (value: any, item?: T) => string;
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
  fullName: 'BECHAPRA - Sistema de Gestión de Pagos',
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
        let value = (item as any)[col.key];
        if (col.formatter) {
          value = col.formatter(value, item as any);
        }
        // Permitir asignación de string
        const stringValue = String(value ?? '').replace(/"/g, '""');
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
      { key: 'creado_en', label: 'Fecha Creación', formatter: (value) => this.formatDate(value) }
    ];
    
    const filename = this.generateFilename('Usuarios', 'csv', usuarios.length);
    this.exportToCSV(usuarios, filename, columns);
  }

  static exportSolicitudesToCSV(solicitudes: Solicitud[], options: ExportOptions = {}): void {
    const columns: ExportColumn<Solicitud>[] = [
      { key: 'id_solicitud', label: 'ID' },
      { key: 'departamento', label: 'Departamento' },
      { key: 'monto', label: 'Monto', formatter: (value) => this.formatCurrency(value) },
      { key: 'cuenta_destino', label: 'Cuenta Destino' },
      { key: 'estado', label: 'Estado' },
      { key: 'concepto', label: 'Concepto' },
      { key: 'fecha_limite_pago', label: 'Fecha Límite', formatter: (value) => this.formatDate(value) },
      { key: 'fecha_creacion', label: 'Fecha Creación', formatter: (value) => this.formatDate(value) },
      { key: 'usuario_nombre', label: 'Solicitante', formatter: (value, item) => value || `Usuario ${(item as any)?.id_usuario ?? ''}` },
      { key: 'aprobador_nombre', label: 'Aprobador', formatter: (value, item) => value && value !== 'N/A' ? value : ((item as any)?.id_aprobador ? `Aprobador ${(item as any)?.id_aprobador}` : 'N/A') }
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
        let value = (item as any)[col.key];
        if (col.formatter) {
          value = col.formatter(value, item ?? {});
        }
        const stringValue = String(value ?? '').replace(/"/g, '""');
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
      { key: 'monto', label: 'Monto', formatter: (value) => this.formatCurrency(value) },
      { key: 'concepto', label: 'Concepto' },
      { key: 'fecha_pago', label: 'Fecha Pago', formatter: (value) => this.formatDate(value) },
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
    headerRow.eachCell((cell, colNumber) => {
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
          let value = (item as any)[col.key];
          if (col.formatter) {
            value = col.formatter(value, item as any);
          }
          // Forzar el tipo a 'any' para evitar error de TypeScript
          return value as any;
        }) as any[]
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
            let value = (item as any)[col.key];
            if (col.formatter) {
              value = col.formatter(value, item as any);
            }
            // Forzar el tipo a 'any' para evitar error de TypeScript
            return String(value as any || '').length;
          })
        );
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Añadir hoja de estadísticas si se solicita
    if (options.includeStats && typeof data[0] === 'object' && data[0] !== null && 'monto' in (data[0] as any)) {
      this.addStatsSheet(workbook, data as any);
    }

    // Generar y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    await this.downloadFile(blob, filename, blob.type);
  }

  static async exportSolicitudesToExcel(solicitudes: Solicitud[], options: ExportOptions = {}): Promise<void> {
    const columns: ExportColumn<Solicitud>[] = [
      { key: 'id_solicitud', label: 'ID', width: 8, align: 'center' },
      { key: 'departamento', label: 'Departamento', width: 20 },
      { key: 'monto', label: 'Monto', width: 15, align: 'right', formatter: (value) => this.formatCurrency(value) },
      { key: 'cuenta_destino', label: 'Cuenta Destino', width: 25 },
      { key: 'estado', label: 'Estado', width: 12, align: 'center' },
      { key: 'concepto', label: 'Concepto', width: 30 },
      { key: 'fecha_limite_pago', label: 'Fecha Límite', width: 12, align: 'center', formatter: (value) => this.formatDate(value) },
      { key: 'fecha_creacion', label: 'Fecha Creación', width: 12, align: 'center', formatter: (value) => this.formatDate(value) },
      { key: 'usuario_nombre', label: 'Solicitante', width: 20, formatter: (value, item) => value || `Usuario ${(item as any)?.id_usuario ?? ''}` },
      { key: 'aprobador_nombre', label: 'Aprobador', width: 20, formatter: (value, item) => 
        value && value !== 'N/A' ? value : ((item as any)?.id_aprobador ? `Aprobador ${(item as any)?.id_aprobador}` : 'N/A')
      }
    ];

    const filename = this.generateFilename('Solicitudes', 'xlsx', solicitudes.length);
    await this.exportToExcel(solicitudes, filename, columns, { ...options, includeStats: true });
  }

  private static addStatsSheet(workbook: ExcelJS.Workbook, solicitudes: Solicitud[]): void {
    const statsSheet = workbook.addWorksheet('Estadísticas');
    const stats = this.calculateStats(solicitudes);
    const pagosPorTipo = this.calculatePaymentTypeStats(solicitudes);

    // Título
    const titleRow = statsSheet.addRow(['RESUMEN EJECUTIVO']);
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF' + COMPANY_CONFIG.colors.primary.map(c => c.toString(16).padStart(2, '0')).join('') } };
    statsSheet.addRow([]);

    // Métricas generales
    const metrics = [
      ['Total de Solicitudes', stats.totalSolicitudes],
      ['Monto Total', this.formatCurrency(stats.montoTotal)],
      ['Monto Promedio', this.formatCurrency(stats.montoPromedio)],
      ['Solicitudes Aprobadas', `${stats.aprobadas} (${((stats.aprobadas/stats.totalSolicitudes)*100).toFixed(1)}%)`],
      ['Solicitudes Pendientes', `${stats.pendientes} (${((stats.pendientes/stats.totalSolicitudes)*100).toFixed(1)}%)`],
      ['Solicitudes Rechazadas', `${stats.rechazadas} (${((stats.rechazadas/stats.totalSolicitudes)*100).toFixed(1)}%)`],
      ['Departamentos Únicos', stats.departamentos.size],
      ['Promedio Diario', stats.solicitudesPorDia.toFixed(2)]
    ];

    metrics.forEach(([label, value]) => {
      const row = statsSheet.addRow([label, value]);
      row.getCell(1).font = { bold: true };
    });

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

    // Crear contenido del PDF
    await this.createProfessionalHeader(doc, pageWidth, stats, options);

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
    const summaryY = await this.createExecutiveSummary(doc, pageWidth, stats, solicitudes, options);
    // Asegura que la tabla y leyenda siempre queden al menos 10mm debajo del resumen
    const tableStartY = Math.max(summaryY, 52) + 10;
    await this.createSolicitudesTable(doc, solicitudes, tableStartY, pageWidth);
    this.addProfessionalFooter(doc, pageWidth, pageHeight, options);

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
    const montoTotal = isNaN(stats.montoTotal) ? 0 : stats.montoTotal;
    const headerInfo = `${stats.totalSolicitudes} Solicitudes | ${stats.departamentos.size} Departamentos | Monto Total: ${this.formatCurrency(montoTotal)}`;
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

    // Métricas en tarjetas
    const cardWidth = (pageWidth - 80) / 5;
    const cardHeight = 25;
    const cardY = startY + 10;
    
    const metrics = [
      { title: 'Total', value: stats.totalSolicitudes.toString(), color: COMPANY_CONFIG.colors.secondary },
      { title: 'Monto Total', value: this.formatCurrency(stats.montoTotal).split(' ')[0], color: COMPANY_CONFIG.colors.success },
      { title: 'Aprobadas', value: `${stats.aprobadas} (${((stats.aprobadas/stats.totalSolicitudes)*100).toFixed(0)}%)`, color: COMPANY_CONFIG.colors.info },
      { title: 'Pendientes', value: `${stats.pendientes} (${((stats.pendientes/stats.totalSolicitudes)*100).toFixed(0)}%)`, color: COMPANY_CONFIG.colors.warning },
      { title: 'Promedio', value: this.formatCurrency(stats.montoPromedio).split(' ')[0], color: COMPANY_CONFIG.colors.primary }
    ];

    metrics.forEach((metric, index) => {
      const x = 15 + (index * (cardWidth + 10));
      
      // Fondo de la tarjeta
      doc.setFillColor(...metric.color);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Valor principal
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(metric.value, x + cardWidth/2, cardY + 10, { align: 'center' });
      
      // Título
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.title, x + cardWidth/2, cardY + 18, { align: 'center' });
    });

    return cardY + cardHeight + 20;
  }

  private static async createSolicitudesTable(doc: jsPDF, solicitudes: Solicitud[], startY: number, pageWidth: number): Promise<void> {
    // Agregar columna de prioridad con iconos
    const columns = [
      { key: 'id_solicitud', label: 'ID', width: 15 },
      { key: 'departamento', label: 'Departamento', width: 30 },
      { key: 'monto', label: 'Monto', width: 25 },
      { key: 'estado', label: 'Estado', width: 20 },
      { key: 'concepto', label: 'Concepto', width: 40 },
      { key: 'fecha_limite_pago', label: 'F. Límite', width: 25 },
      { key: 'usuario_nombre', label: 'Solicitante', width: 30 },
      { key: 'aprobador_nombre', label: 'Aprobador', width: 30 },
      { key: 'prioridad', label: 'Prioridad', width: 32 } // Mucho más ancho para que no se corte
    ];

    const tableData = solicitudes.map(item => columns.map(col => {
      // Cast explícito para acceso dinámico
      let value = (item as any)[col.key];
      // Formatear valores específicos
      if (col.key === 'monto') {
        value = this.formatCurrency(value);
      } else if (col.key === 'fecha_limite_pago' || col.key === 'fecha_creacion') {
        value = this.formatDate(value);
      } else if (col.key === 'usuario_nombre') {
        value = value || `Usuario ${(item as any).id_usuario}`;
      } else if (col.key === 'aprobador_nombre') {
        value = value && value !== 'N/A' ? value : ((item as any).id_aprobador ? `Aprobador ${(item as any).id_aprobador}` : 'N/A');
      } else if (col.key === 'prioridad') {
        // Solo texto limpio
        if (String(value).toLowerCase() === 'alta') value = 'Alta';
        else if (String(value).toLowerCase() === 'media') value = 'Media';
        else value = 'Baja';
      }
      // Mostrar el texto completo, sin truncar
      return String(value || '');
    }));

    // Leyenda visual de prioridad (centrada, con espacio y fuente clara)
    const legendY = startY + 10; // Más separación respecto al resumen/tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 60);
    doc.text('Leyenda de prioridad', pageWidth / 2, legendY, { align: 'center' });

    // Texto de niveles de prioridad, cada uno en su línea, con fuente y color diferenciados y más espacio entre líneas
    const expY = legendY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 53, 69); // Rojo para Alta
    doc.text('Alta: Solicitudes urgentes que requieren atención inmediata.', pageWidth / 2, expY, { align: 'center', maxWidth: pageWidth - 60 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 193, 7); // Amarillo para Media
    doc.text('Media: Importantes pero no urgentes.', pageWidth / 2, expY + 10, { align: 'center', maxWidth: pageWidth - 60 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69); // Verde para Baja
    doc.text('Baja: Pueden esperar sin afectar procesos críticos.', pageWidth / 2, expY + 20, { align: 'center', maxWidth: pageWidth - 60 });

    // Ajustar el inicio de la tabla para que nunca se sobreponga con la leyenda
    const tableY = expY + 30;
    autoTable(doc, {
      willDrawCell: function(data) {
        // Borrar el texto original antes de dibujar la celda de estado
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.text[0] = '';
        }
        // Borrar el texto original antes de dibujar la celda de prioridad
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
        fontSize: 11,
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 6, right: 2, bottom: 6, left: 2 }
      },
      alternateRowStyles: { 
        fillColor: [248, 249, 250] 
      },
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        valign: 'middle',
        textColor: [45, 45, 45],
        overflow: 'linebreak',
        lineWidth: 0.3,
        lineColor: [220, 220, 220]
      },
      columnStyles: columns.reduce((acc, col, index) => {
        acc[index] = { 
          cellWidth: col.width,
          halign: col.key === 'monto' ? 'right' : (col.key === 'id_solicitud' || col.key === 'estado' || col.key === 'prioridad' ? 'center' : 'left')
        };
        return acc;
      }, {} as any),
      didDrawCell: function(data) {
        // Colorear estados y prioridad para mejor visualización
        // Columna Estado
        if (data.column.index === 3 && data.section === 'body') {
          let estadoRaw: any = undefined;
          if (Array.isArray(data.row.raw)) {
            estadoRaw = data.row.raw[3];
          } else if (data.cell.raw) {
            estadoRaw = data.cell.raw;
          } else {
            estadoRaw = data.cell.text[0];
          }
          const estado = String(estadoRaw).toLowerCase();
          let color: [number, number, number] = [45, 45, 45];
          let fontStyle = 'bold';
          if (estado.includes('aprobada') || estado.includes('autorizada')) {
            color = COMPANY_CONFIG.colors.success as [number, number, number];
          } else if (estado.includes('pendiente')) {
            color = COMPANY_CONFIG.colors.warning as [number, number, number];
          } else if (estado.includes('rechazada')) {
            color = COMPANY_CONFIG.colors.danger as [number, number, number];
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(10);
          doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }

        // Columna Prioridad
        if (data.column.index === 8 && data.section === 'body') {
          let prioridadRaw: any = undefined;
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
          doc.setFontSize(10);
          doc.text(prioridad.charAt(0).toUpperCase() + prioridad.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }
      }
    });

    autoTable(doc, {
      willDrawCell: function(data) {
        // Borrar el texto original antes de dibujar la celda de estado
        if (data.column.index === 3 && data.section === 'body') {
          data.cell.text[0] = '';
        }
        // Borrar el texto original antes de dibujar la celda de prioridad
        if (data.column.index === 8 && data.section === 'body') {
          data.cell.text[0] = '';
        }
      },
      head: [columns.map(col => col.label)],
      body: tableData,
      startY: startY + 8,
      theme: 'striped',
      headStyles: {
        fillColor: COMPANY_CONFIG.colors.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 6, right: 2, bottom: 6, left: 2 }
      },
      alternateRowStyles: { 
        fillColor: [248, 249, 250] 
      },
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        valign: 'middle',
        textColor: [45, 45, 45],
        overflow: 'linebreak',
        lineWidth: 0.3,
        lineColor: [220, 220, 220]
      },
      columnStyles: columns.reduce((acc, col, index) => {
        acc[index] = { 
          cellWidth: col.width,
          halign: col.key === 'monto' ? 'right' : (col.key === 'id_solicitud' || col.key === 'estado' || col.key === 'prioridad' ? 'center' : 'left')
        };
        return acc;
      }, {} as any),
      didDrawCell: function(data) {
        // Colorear estados y prioridad para mejor visualización
        // Columna Estado
        if (data.column.index === 3 && data.section === 'body') {
          let estadoRaw: any = undefined;
          if (Array.isArray(data.row.raw)) {
            estadoRaw = data.row.raw[3];
          } else if (data.cell.raw) {
            estadoRaw = data.cell.raw;
          } else {
            estadoRaw = data.cell.text[0];
          }
          const estado = String(estadoRaw).toLowerCase();
          let color: [number, number, number] = [45, 45, 45];
          let fontStyle = 'bold';
          if (estado.includes('aprobada') || estado.includes('autorizada')) {
            color = COMPANY_CONFIG.colors.success as [number, number, number];
          } else if (estado.includes('pendiente')) {
            color = COMPANY_CONFIG.colors.warning as [number, number, number];
          } else if (estado.includes('rechazada')) {
            color = COMPANY_CONFIG.colors.danger as [number, number, number];
          }
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont('helvetica', fontStyle);
          doc.setFontSize(10);
          doc.text(estado.charAt(0).toUpperCase() + estado.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }

        // Columna Prioridad
        if (data.column.index === 8 && data.section === 'body') {
          let prioridadRaw: any = undefined;
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
          doc.setFontSize(10);
          doc.text(prioridad.charAt(0).toUpperCase() + prioridad.slice(1), data.cell.x + data.cell.width/2, data.cell.y + data.cell.height/2, {
            align: 'center',
            baseline: 'middle'
          });
        }
      }
    });
  }

  private static addProfessionalFooter(doc: jsPDF, pageWidth: number, pageHeight: number, options: ExportOptions): void {
    const totalPages = doc.getNumberOfPages();
    const confidentiality = options.confidentialityLevel?.toUpperCase() || 'CONFIDENCIAL - USO INTERNO';
    
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
      doc.text('Documento generado automáticamente', 15, pageHeight - 8);
      
      // Centro: Clasificación del documento
      doc.text(confidentiality, pageWidth/2, pageHeight - 10, { align: 'center' });
      
      // Derecha: Numeración de páginas y fecha
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
      doc.text(this.formatDate(new Date()), pageWidth - 15, pageHeight - 8, { align: 'right' });
    }
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
        por_departamento: solicitudes.reduce((acc, s) => {
          if (!acc[s.departamento]) {
            acc[s.departamento] = { cantidad: 0, monto_total: 0, monto_promedio: 0 };
          }
          acc[s.departamento].cantidad++;
          acc[s.departamento].monto_total += s.monto;
          acc[s.departamento].monto_promedio = acc[s.departamento].monto_total / acc[s.departamento].cantidad;
          return acc;
        }, {} as Record<string, any>),
        por_tipo_pago: pagosPorTipo,
        tendencias_temporales: this.calculateTemporalTrends(solicitudes)
      }
    };

    const filename = this.generateFilename('ReporteDetallado', 'json');
    this.downloadFile(JSON.stringify(report, null, 2), filename, 'application/json');
  }

  private static calculateTemporalTrends(solicitudes: Solicitud[]) {
    const trends = solicitudes.reduce((acc, s) => {
      const fecha = new Date(s.fecha_creacion);
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!acc[mes]) {
        acc[mes] = { cantidad: 0, monto_total: 0 };
      }
      acc[mes].cantidad++;
      acc[mes].monto_total += s.monto;
      
      return acc;
    }, {} as Record<string, any>);

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
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null && 'monto' in (data[0] as any)) {
      const solicitudes = data as any[];
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
export const exportDetailedReport = ExportUtils.exportDetailedReport.bind(ExportUtils);
export const exportPagosToCSV = ExportUtils.exportPagosToCSV.bind(ExportUtils);

// Ejemplo de uso:
/*
// Exportación básica
await ExportUtils.exportSolicitudesToPDF(solicitudes);

// Exportación con opciones avanzadas
await ExportUtils.exportSolicitudesToPDF(solicitudes, {
  includeStats: true,
  includeCharts: true,
  customTitle: 'Reporte Mensual de Solicitudes',
  confidentialityLevel: 'restricted'
});

// Exportación con validación
const success = await ExportUtils.exportWithValidation(
  solicitudes,
  (data) => ExportUtils.exportSolicitudesToExcel(data, { includeStats: true })
);

// Obtener formato recomendado
const format = ExportUtils.getRecommendedFormat(solicitudes.length, true);
console.log(`Formato recomendado: ${format}`);
console.log(`Tamaño estimado: ${ExportUtils.estimateFileSize(solicitudes.length, format)}`);
*/