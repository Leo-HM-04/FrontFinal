import { toast } from 'react-hot-toast';

export interface EstadoData {
  estado: string;
  total: number;
  monto_total: string;
}

// Función simple para exportar solo gráficas
export const exportChartsOnly = async (data: EstadoData[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header simple
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GRÁFICAS ESTADÍSTICAS', pageWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    pdf.text(`Análisis Visual - ${fecha}`, pageWidth / 2, 26, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    
    // Captura de gráficas
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Posiciones centradas y simples
        const chartSize = 140;
        const topY = 55;
        const leftX = (pageWidth / 2) - chartSize - 20;
        const rightX = (pageWidth / 2) + 20;
        
        // Primera gráfica
        pdf.setFillColor(248, 249, 250);
        pdf.rect(leftX - 10, topY - 10, chartSize + 20, chartSize + 30, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(leftX - 10, topY - 10, chartSize + 20, chartSize + 30, 'S');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('Distribución por Estado', leftX + chartSize/2, topY - 2, { align: 'center' });
        
        pdf.addImage(doughnutImgData, 'PNG', leftX, topY, chartSize, chartSize);
        
        // Segunda gráfica
        pdf.setFillColor(248, 249, 250);
        pdf.rect(rightX - 10, topY - 10, chartSize + 20, chartSize + 30, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(rightX - 10, topY - 10, chartSize + 20, chartSize + 30, 'S');
        
        pdf.text('Análisis de Valores', rightX + chartSize/2, topY - 2, { align: 'center' });
        
        pdf.addImage(barImgData, 'PNG', rightX, topY, chartSize, chartSize);
        
      } catch (canvasError) {
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
          })
        ]);
        
        const chartSize = 140;
        const topY = 55;
        const leftX = (pageWidth / 2) - chartSize - 20;
        const rightX = (pageWidth / 2) + 20;
        
        pdf.setFillColor(248, 249, 250);
        pdf.rect(leftX - 10, topY - 10, chartSize + 20, chartSize + 30, 'F');
        pdf.rect(rightX - 10, topY - 10, chartSize + 20, chartSize + 30, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(leftX - 10, topY - 10, chartSize + 20, chartSize + 30, 'S');
        pdf.rect(rightX - 10, topY - 10, chartSize + 20, chartSize + 30, 'S');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('Distribución por Estado', leftX + chartSize/2, topY - 2, { align: 'center' });
        pdf.text('Análisis de Valores', rightX + chartSize/2, topY - 2, { align: 'center' });
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', leftX, topY, chartSize, chartSize);
        pdf.addImage(barImgData, 'PNG', rightX, topY, chartSize, chartSize);
      }
    }
    
    // Footer simple
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('Sistema de Gestión de Pagos - Exportación de Gráficas', 20, pageHeight - 8);
    pdf.text('Página 1 de 1', pageWidth - 20, pageHeight - 8, { align: 'right' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    pdf.save(`graficas-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📊 Gráficas exportadas correctamente');
    
  } catch (error) {
    console.error('Error al exportar gráficas:', error);
    toast.error('❌ Error al exportar gráficas');
  }
};

// Función para reporte completo con estadísticas
export const exportToPDF = async (data: EstadoData[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header profesional simple
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE EJECUTIVO DE ESTADÍSTICAS', pageWidth / 2, 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generado el: ${fecha}`, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    
    // Gráficas
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Sección de gráficas
        const chartW = 120;
        const chartH = 90;
        const chartsY = 50;
        const leftChartX = 40;
        const rightChartX = pageWidth - chartW - 40;
        
        // Gráfica izquierda
        pdf.setFillColor(250, 251, 252);
        pdf.rect(leftChartX - 5, chartsY, chartW + 10, chartH + 20, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(leftChartX - 5, chartsY, chartW + 10, chartH + 20, 'S');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Distribución por Estado', leftChartX + chartW/2, chartsY + 10, { align: 'center' });
        
        pdf.addImage(doughnutImgData, 'PNG', leftChartX, chartsY + 15, chartW, chartH);
        
        // Gráfica derecha
        pdf.setFillColor(250, 251, 252);
        pdf.rect(rightChartX - 5, chartsY, chartW + 10, chartH + 20, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(rightChartX - 5, chartsY, chartW + 10, chartH + 20, 'S');
        
        pdf.text('Análisis de Montos', rightChartX + chartW/2, chartsY + 10, { align: 'center' });
        
        pdf.addImage(barImgData, 'PNG', rightChartX, chartsY + 15, chartW, chartH);
        
      } catch (canvasError) {
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
          })
        ]);
        
        const chartW = 120;
        const chartH = 90;
        const chartsY = 50;
        const leftChartX = 40;
        const rightChartX = pageWidth - chartW - 40;
        
        pdf.setFillColor(250, 251, 252);
        pdf.rect(leftChartX - 5, chartsY, chartW + 10, chartH + 20, 'F');
        pdf.rect(rightChartX - 5, chartsY, chartW + 10, chartH + 20, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(leftChartX - 5, chartsY, chartW + 10, chartH + 20, 'S');
        pdf.rect(rightChartX - 5, chartsY, chartW + 10, chartH + 20, 'S');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Distribución por Estado', leftChartX + chartW/2, chartsY + 10, { align: 'center' });
        pdf.text('Análisis de Montos', rightChartX + chartW/2, chartsY + 10, { align: 'center' });
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', leftChartX, chartsY + 15, chartW, chartH);
        pdf.addImage(barImgData, 'PNG', rightChartX, chartsY + 15, chartW, chartH);
      }
      
      // Sección de estadísticas
      const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
      const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);
      
      const statsY = 165;
      
      // Título de estadísticas
      pdf.setFillColor(41, 128, 185);
      pdf.rect(30, statsY, pageWidth - 60, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN ESTADÍSTICO', pageWidth / 2, statsY + 10, { align: 'center' });
      
      // Marco de estadísticas
      pdf.setFillColor(247, 250, 252);
      pdf.rect(30, statsY + 15, pageWidth - 60, 90, 'F');
      pdf.setDrawColor(209, 213, 219);
      pdf.rect(30, statsY + 15, pageWidth - 60, 90, 'S');
      
      // Datos generales
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      let currentY = statsY + 30;
      const col1X = 45;
      const col2X = pageWidth / 2 + 15;
      
      pdf.text('RESUMEN GENERAL', col1X, currentY);
      currentY += 12;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total solicitudes: ${totalSolicitudes.toLocaleString('es-MX')}`, col1X, currentY);
      currentY += 10;
      
      pdf.text(`Monto total: $${totalMonto.toLocaleString('es-MX', { 
        minimumFractionDigits: 2 
      })}`, col1X, currentY);
      currentY += 10;
      
      const promedio = totalSolicitudes > 0 ? totalMonto / totalSolicitudes : 0;
      pdf.text(`Promedio: $${promedio.toLocaleString('es-MX', { 
        minimumFractionDigits: 2 
      })}`, col1X, currentY);
      
      // Detalle por estado
      currentY = statsY + 30;
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALLE POR ESTADO', col2X, currentY);
      currentY += 12;
      
      pdf.setFont('helvetica', 'normal');
      data.forEach(item => {
        const porcentaje = totalSolicitudes > 0 ? (item.total / totalSolicitudes * 100) : 0;
        pdf.text(`${item.estado.toUpperCase()}: ${item.total} (${porcentaje.toFixed(1)}%)`, col2X, currentY);
        currentY += 8;
        
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`$${Number(item.monto_total).toLocaleString('es-MX')}`, col2X + 5, currentY);
        currentY += 10;
        
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
      });
    }
    
    // Footer
    pdf.setFillColor(55, 65, 81);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('Sistema de Gestión - Reporte Ejecutivo', 20, pageHeight - 6);
    pdf.text('Página 1 de 1', pageWidth - 20, pageHeight - 6, { align: 'right' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth / 2, pageHeight - 6, { align: 'center' });
    
    pdf.save(`reporte-ejecutivo-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📊 Reporte ejecutivo generado correctamente');
    
  } catch (error) {
    console.error('Error al generar reporte:', error);
    toast.error('❌ Error al generar reporte ejecutivo');
  }
};
