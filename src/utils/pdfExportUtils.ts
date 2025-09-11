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
    
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape para mejor visualización
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header con gradiente simulado
    pdf.setFillColor(30, 64, 175); // Azul corporativo
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PANEL DE ESTADÍSTICAS EJECUTIVAS', pageWidth / 2, 25, { align: 'center' });
    
    // Subtítulo
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 38, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Restaurar color negro
    
    // Intentar capturar directamente desde los canvas de Chart.js
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        // Método 1: Usar directamente los canvas de Chart.js (más confiable)
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Dimensiones mejoradas para las gráficas
        const chartWidth = (pageWidth / 2.2) - 15;
        const chartHeight = chartWidth * 0.75;
        const startY = 65;
        
        // Agregar marcos y títulos para las gráficas
        pdf.setFillColor(248, 250, 252);
        pdf.rect(15, startY - 10, chartWidth + 10, chartHeight + 30, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(15, startY - 10, chartWidth + 10, chartHeight + 30, 'S');
        
        pdf.rect(pageWidth / 2 + 5, startY - 10, chartWidth + 10, chartHeight + 30, 'F');
        pdf.rect(pageWidth / 2 + 5, startY - 10, chartWidth + 10, chartHeight + 30, 'S');
        
        // Títulos de gráficas
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        pdf.text('Distribución por Estado', 20 + chartWidth / 2, startY - 2, { align: 'center' });
        pdf.text('Valores Monetarios', (pageWidth / 2 + 10) + chartWidth / 2, startY - 2, { align: 'center' });
        
        // Agregar gráficas
        pdf.addImage(doughnutImgData, 'PNG', 20, startY, chartWidth, chartHeight);
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, startY, chartWidth, chartHeight);
        
      } catch (canvasError) {
        console.warn('Error con canvas directo, usando html2canvas:', canvasError);
        
        // Método 2: Fallback con html2canvas
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1400,
            windowHeight: 900,
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: false,
            logging: false,
            windowWidth: 1400,
            windowHeight: 900,
          })
        ]);
        
        const chartWidth = (pageWidth / 2.2) - 15;
        const doughnutHeight = (chartWidth * doughnutCanvas.height) / doughnutCanvas.width;
        const barHeight = (chartWidth * barCanvas.height) / barCanvas.width;
        const startY = 65;
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', 20, startY, chartWidth, doughnutHeight);
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, startY, chartWidth, barHeight);
      }
      
      // Calcular estadísticas
      const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
      const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);
      
      // Sección de estadísticas mejorada
      const statsY = 180;
      
      // Marco para estadísticas
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, statsY - 5, pageWidth - 30, 80, 'F');
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(15, statsY - 5, pageWidth - 30, 80, 'S');
      
      // Título de estadísticas
      pdf.setFillColor(30, 64, 175);
      pdf.rect(15, statsY - 5, pageWidth - 30, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN EJECUTIVO', pageWidth / 2, statsY + 7, { align: 'center' });
      
      // Estadísticas en dos columnas
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const col1X = 25;
      const col2X = pageWidth / 2 + 15;
      let currentY = statsY + 25;
      
      // Columna izquierda
      pdf.setFont('helvetica', 'bold');
      pdf.text('📊 RESUMEN GENERAL:', col1X, currentY);
      pdf.setFont('helvetica', 'normal');
      currentY += 8;
      pdf.text(`• Total de solicitudes: ${totalSolicitudes.toLocaleString()}`, col1X + 5, currentY);
      currentY += 7;
      pdf.text(`• Monto total procesado: $${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, col1X + 5, currentY);
      currentY += 7;
      pdf.text(`• Estados diferentes: ${data.length}`, col1X + 5, currentY);
      currentY += 7;
      pdf.text(`• Promedio por solicitud: $${Math.round(totalMonto / totalSolicitudes).toLocaleString('es-MX')}`, col1X + 5, currentY);
      
      // Columna derecha - Detalle por estado
      currentY = statsY + 25;
      pdf.setFont('helvetica', 'bold');
      pdf.text('📋 DETALLE POR ESTADO:', col2X, currentY);
      pdf.setFont('helvetica', 'normal');
      currentY += 8;
      
      data.forEach((item, index) => {
        const promedio = Math.round(Number(item.monto_total) / item.total);
        const porcentaje = ((item.total / totalSolicitudes) * 100).toFixed(1);
        
        pdf.text(`• ${item.estado.toUpperCase()}: ${item.total} (${porcentaje}%)`, col2X + 5, currentY);
        currentY += 5;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`  Monto: $${Number(item.monto_total).toLocaleString('es-MX')} | Promedio: $${promedio.toLocaleString('es-MX')}`, col2X + 8, currentY);
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        currentY += 8;
      });
    }
    
    // Footer profesional
    pdf.setFillColor(51, 65, 85);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sistema de Gestión de Pagos - Reporte Ejecutivo', 20, pageHeight - 15);
    pdf.text(`Página 1 de 1`, pageWidth - 20, pageHeight - 15, { align: 'right' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth / 2, pageHeight - 8, { align: 'center' });
    
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
    
    // Header elegante
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GRÁFICAS ESTADÍSTICAS', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Exportación de gráficas - ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, 35, { align: 'center' });
    
    // Intentar capturar directamente desde los canvas de Chart.js
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        // Método 1: Canvas directo
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Dimensiones más grandes para mejor calidad
        const chartWidth = (pageWidth / 2.1) - 10;
        const chartHeight = chartWidth * 0.8;
        const startY = 60;
        
        // Marcos con sombra para las gráficas
        pdf.setFillColor(255, 255, 255);
        pdf.rect(15, startY - 5, chartWidth + 10, chartHeight + 25, 'F');
        pdf.setDrawColor(148, 163, 184);
        pdf.setLineWidth(0.5);
        pdf.rect(15, startY - 5, chartWidth + 10, chartHeight + 25, 'S');
        
        pdf.rect(pageWidth / 2 + 5, startY - 5, chartWidth + 10, chartHeight + 25, 'F');
        pdf.rect(pageWidth / 2 + 5, startY - 5, chartWidth + 10, chartHeight + 25, 'S');
        
        // Títulos elegantes
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distribución por Estado', 20 + chartWidth / 2, startY + chartHeight + 15, { align: 'center' });
        pdf.text('Análisis de Valores', (pageWidth / 2 + 10) + chartWidth / 2, startY + chartHeight + 15, { align: 'center' });
        
        // Agregar gráficas con mejor espaciado
        pdf.addImage(doughnutImgData, 'PNG', 20, startY, chartWidth, chartHeight);
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, startY, chartWidth, chartHeight);
        
      } catch (canvasError) {
        console.warn('Error con canvas directo, usando html2canvas:', canvasError);
        
        // Método 2: Fallback
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
        
        const chartWidth = (pageWidth / 2.1) - 10;
        const startY = 60;
        const doughnutHeight = (chartWidth * doughnutCanvas.height) / doughnutCanvas.width;
        const barHeight = (chartWidth * barCanvas.height) / barCanvas.width;
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', 20, startY, chartWidth, doughnutHeight);
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, startY, chartWidth, barHeight);
      }
    }
    
    // Footer
    pdf.setFillColor(51, 65, 85);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.text('Sistema de Gestión de Pagos', 20, pageHeight - 10);
    pdf.text(`Gráficas Estadísticas`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth - 20, pageHeight - 10, { align: 'right' });
    
    pdf.save(`graficas-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📈 Gráficas exportadas exitosamente');
    
  } catch (error) {
    console.error('Error al exportar gráficas:', error);
    toast.error('❌ Error al exportar las gráficas');
  }
};
