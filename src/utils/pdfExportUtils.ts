import { toast } from 'react-hot-toast';

export interface EstadoData {
  estado: string;
  total: number;
  monto_total: string;
  origen?: 'solicitudes_pago' | 'solicitudes_viaticos' | 'pagos_recurrentes';
}

// Función para exportar reporte completo con estadísticas
export const exportToPDF = async (data: EstadoData[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // === HEADER CORPORATIVO ===
    pdf.setFillColor(30, 64, 175);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PANEL DE ESTADÍSTICAS EJECUTIVAS', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo con fecha completa
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const fechaCompleta = new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generado el: ${fechaCompleta}`, pageWidth / 2, 32, { align: 'center' });
    
    // Línea decorativa
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - 100, 38, pageWidth / 2 + 100, 38);
    
    pdf.setTextColor(0, 0, 0); // Restaurar color negro
    
    // === SECCIÓN DE GRÁFICAS ===
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        // Capturar gráficas con alta calidad
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Dimensiones optimizadas para mejor espaciado
        const chartWidth = 180; // Tamaño fijo para consistencia
        const chartHeight = 135;
        const startY = 65;
        const spacing = 30; // Espaciado entre elementos
        
        // === MARCO PARA GRÁFICA DE DONA ===
        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, startY - 5, chartWidth + 20, chartHeight + 35, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.rect(20, startY - 5, chartWidth + 20, chartHeight + 35, 'S');
        
        // Título gráfica de dona
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 65, 85);
        pdf.text('Distribución por Estado', 30 + chartWidth / 2, startY + 5, { align: 'center' });
        
        // Gráfica de dona
        pdf.addImage(doughnutImgData, 'PNG', 30, startY + 10, chartWidth, chartHeight);
        
        // === MARCO PARA GRÁFICA DE BARRAS ===
        const barX = 20 + chartWidth + 50; // Posición de la segunda gráfica
        pdf.setFillColor(248, 250, 252);
        pdf.rect(barX, startY - 5, chartWidth + 20, chartHeight + 35, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(barX, startY - 5, chartWidth + 20, chartHeight + 35, 'S');
        
        // Título gráfica de barras
        pdf.text('Análisis de Montos', barX + 10 + chartWidth / 2, startY + 5, { align: 'center' });
        
        // Gráfica de barras
        pdf.addImage(barImgData, 'PNG', barX + 10, startY + 10, chartWidth, chartHeight);
        
      } catch (canvasError) {
        console.warn('Error con canvas directo, usando html2canvas:', canvasError);
        
        // Método fallback con html2canvas
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1600,
            windowHeight: 1000,
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1600,
            windowHeight: 1000,
          })
        ]);
        
        const chartWidth = 180;
        const chartHeight = 135;
        const startY = 65;
        const barX = 20 + chartWidth + 50;
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        // Marcos
        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, startY - 5, chartWidth + 20, chartHeight + 35, 'F');
        pdf.rect(barX, startY - 5, chartWidth + 20, chartHeight + 35, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(20, startY - 5, chartWidth + 20, chartHeight + 35, 'S');
        pdf.rect(barX, startY - 5, chartWidth + 20, chartHeight + 35, 'S');
        
        // Títulos
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 65, 85);
        pdf.text('Distribución por Estado', 30 + chartWidth / 2, startY + 5, { align: 'center' });
        pdf.text('Análisis de Montos', barX + 10 + chartWidth / 2, startY + 5, { align: 'center' });
        
        // Gráficas
        pdf.addImage(doughnutImgData, 'PNG', 30, startY + 10, chartWidth, chartHeight);
        pdf.addImage(barImgData, 'PNG', barX + 10, startY + 10, chartWidth, chartHeight);
      }
      
      // === SECCIÓN DE ESTADÍSTICAS ===
      const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
      const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);
      
      const statsY = 240; // Posición más baja para evitar superposición
      
      // Marco principal de estadísticas
      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, statsY, pageWidth - 40, 120, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.5);
      pdf.rect(20, statsY, pageWidth - 40, 120, 'S');
      
      // Header de estadísticas
      pdf.setFillColor(30, 64, 175);
      pdf.rect(20, statsY, pageWidth - 40, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('📊 RESUMEN EJECUTIVO', pageWidth / 2, statsY + 16, { align: 'center' });
      
      // === COLUMNA IZQUIERDA - RESUMEN GENERAL ===
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      
      const col1X = 35;
      const col2X = pageWidth / 2 + 20;
      let currentY = statsY + 35;
      
      // Título columna izquierda
      pdf.setTextColor(30, 64, 175);
      pdf.text('� RESUMEN GENERAL', col1X, currentY);
      currentY += 15;
      
      // Estadísticas generales
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 65, 85);
      
      pdf.text(`• Total de solicitudes: ${totalSolicitudes.toLocaleString('es-MX')}`, col1X + 5, currentY);
      currentY += 12;
      
      pdf.text(`• Monto total procesado: $${totalMonto.toLocaleString('es-MX', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`, col1X + 5, currentY);
      currentY += 12;
      
      pdf.text(`• Estados diferentes: ${data.length}`, col1X + 5, currentY);
      currentY += 12;
      
      const promedioSolicitud = totalSolicitudes > 0 ? totalMonto / totalSolicitudes : 0;
      pdf.text(`• Promedio por solicitud: $${promedioSolicitud.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`, col1X + 5, currentY);
      
      // === COLUMNA DERECHA - DETALLE POR ESTADO ===
      currentY = statsY + 35;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text('📋 DETALLE POR ESTADO', col2X, currentY);
      currentY += 15;
      
      // Detalle por cada estado
      data.forEach((item) => {
        const promedio = item.total > 0 ? Number(item.monto_total) / item.total : 0;
        const porcentaje = totalSolicitudes > 0 ? ((item.total / totalSolicitudes) * 100) : 0;
        
        // Estado principal
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 65, 85);
        pdf.text(
          `• ${item.estado.toUpperCase()}: ${item.total} solicitudes (${porcentaje.toFixed(1)}%)`, 
          col2X + 5, 
          currentY
        );
        currentY += 8;
        
        // Detalles monetarios
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text(
          `  Monto: $${Number(item.monto_total).toLocaleString('es-MX', { 
            minimumFractionDigits: 2 
          })} | Promedio: $${promedio.toLocaleString('es-MX', { 
            minimumFractionDigits: 2 
          })}`, 
          col2X + 8, 
          currentY
        );
        currentY += 12;
      });
    }
    
    // === FOOTER PROFESIONAL ===
    pdf.setFillColor(51, 65, 85);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Información del sistema
    pdf.text('Sistema de Gestión de Pagos - Reporte Ejecutivo', 25, pageHeight - 12);
    
    // Número de página
    pdf.text('Página 1 de 1', pageWidth - 25, pageHeight - 12, { align: 'right' });
    
    // Timestamp completo
    const timestamp = new Date().toLocaleString('es-MX');
    pdf.text(timestamp, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Descargar el PDF
    pdf.save(`estadisticas-ejecutivas-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📊 Reporte PDF generado exitosamente');
    
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    toast.error('❌ Error al generar el reporte PDF');
  }
};

// Función para exportar solo las gráficas
export const exportChartsOnly = async () => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // === HEADER MODERNO ===
    pdf.setFillColor(15, 23, 42); // Azul oscuro elegante
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GRÁFICAS ESTADÍSTICAS', pageWidth / 2, 25, { align: 'center' });
    
    // Subtítulo
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Análisis Visual - ${new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`, pageWidth / 2, 40, { align: 'center' });
    
    // Línea decorativa
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - 120, 48, pageWidth / 2 + 120, 48);
    
    // === CAPTURA DE GRÁFICAS ===
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        // Captura directa de canvas con máxima calidad
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // === LAYOUT OPTIMIZADO ===
        const chartWidth = 200; // Tamaño más grande para mejor visualización
        const chartHeight = 150;
        const startY = 80;
        const centerSpacing = 40; // Espacio entre gráficas
        
        // Posiciones calculadas para centrado perfecto
        const doughnutX = (pageWidth / 4) - (chartWidth / 2);
        const barX = (3 * pageWidth / 4) - (chartWidth / 2);
        
        // === MARCO GRÁFICA DE DONA ===
        pdf.setFillColor(255, 255, 255);
        pdf.rect(doughnutX - 10, startY - 10, chartWidth + 20, chartHeight + 50, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.8);
        pdf.rect(doughnutX - 10, startY - 10, chartWidth + 20, chartHeight + 50, 'S');
        
        // Título gráfica de dona
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distribución por Estado', pageWidth / 4, startY - 2, { align: 'center' });
        
        // Gráfica de dona
        pdf.addImage(doughnutImgData, 'PNG', doughnutX, startY + 5, chartWidth, chartHeight);
        
        // === MARCO GRÁFICA DE BARRAS ===
        pdf.setFillColor(255, 255, 255);
        pdf.rect(barX - 10, startY - 10, chartWidth + 20, chartHeight + 50, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(barX - 10, startY - 10, chartWidth + 20, chartHeight + 50, 'S');
        
        // Título gráfica de barras
        pdf.text('Análisis de Valores', 3 * pageWidth / 4, startY - 2, { align: 'center' });
        
        // Gráfica de barras
        pdf.addImage(barImgData, 'PNG', barX, startY + 5, chartWidth, chartHeight);
        
        // === DESCRIPCIÓN PROFESIONAL ===
        const descY = startY + chartHeight + 60;
        
        // Marco para descripción
        pdf.setFillColor(248, 250, 252);
        pdf.rect(40, descY, pageWidth - 80, 60, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(40, descY, pageWidth - 80, 60, 'S');
        
        // Título descripción
        pdf.setFillColor(30, 64, 175);
        pdf.rect(40, descY, pageWidth - 80, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('📊 ANÁLISIS VISUAL', pageWidth / 2, descY + 13, { align: 'center' });
        
        // Contenido descripción
        pdf.setTextColor(51, 65, 85);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        
        const descripcionY = descY + 30;
        pdf.text('• La gráfica circular muestra la distribución proporcional de solicitudes por estado', 50, descripcionY);
        pdf.text('• El gráfico de barras presenta el análisis comparativo de valores monetarios', 50, descripcionY + 12);
        pdf.text('• Ambas visualizaciones proporcionan insights complementarios para la toma de decisiones', 50, descripcionY + 24);
        
      } catch (canvasError) {
        console.warn('Error con canvas directo, usando html2canvas:', canvasError);
        
        // === MÉTODO FALLBACK CON HTML2CANVAS ===
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 4, // Máxima calidad para fallback
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1800,
            windowHeight: 1200,
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 4,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1800,
            windowHeight: 1200,
          })
        ]);
        
        const chartWidth = 200;
        const startY = 80;
        const doughnutX = (pageWidth / 4) - (chartWidth / 2);
        const barX = (3 * pageWidth / 4) - (chartWidth / 2);
        
        const doughnutHeight = (chartWidth * doughnutCanvas.height) / doughnutCanvas.width;
        const barHeight = (chartWidth * barCanvas.height) / barCanvas.width;
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        // Marcos y títulos
        pdf.setFillColor(255, 255, 255);
        pdf.rect(doughnutX - 10, startY - 10, chartWidth + 20, doughnutHeight + 30, 'F');
        pdf.rect(barX - 10, startY - 10, chartWidth + 20, barHeight + 30, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(doughnutX - 10, startY - 10, chartWidth + 20, doughnutHeight + 30, 'S');
        pdf.rect(barX - 10, startY - 10, chartWidth + 20, barHeight + 30, 'S');
        
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distribución por Estado', pageWidth / 4, startY - 2, { align: 'center' });
        pdf.text('Análisis de Valores', 3 * pageWidth / 4, startY - 2, { align: 'center' });
        
        // Gráficas
        pdf.addImage(doughnutImgData, 'PNG', doughnutX, startY + 5, chartWidth, doughnutHeight);
        pdf.addImage(barImgData, 'PNG', barX, startY + 5, chartWidth, barHeight);
      }
    }
    
    // === FOOTER ELEGANTE ===
    pdf.setFillColor(51, 65, 85);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    // Información del sistema
    pdf.text('Sistema de Gestión de Pagos - Exportación de Gráficas', 25, pageHeight - 15);
    
    // Timestamp
    const timestamp = new Date().toLocaleString('es-MX');
    pdf.text(timestamp, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Página
    pdf.text('Visualización Ejecutiva', pageWidth - 25, pageHeight - 15, { align: 'right' });
    
    // Línea decorativa en footer
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.3);
    pdf.line(25, pageHeight - 8, pageWidth - 25, pageHeight - 8);
    
    pdf.save(`graficas-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📈 Gráficas exportadas exitosamente');
    
  } catch (error) {
    console.error('Error al exportar gráficas:', error);
    toast.error('❌ Error al exportar las gráficas');
  }
};
