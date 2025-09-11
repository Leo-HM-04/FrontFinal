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
    
    // Header más compacto para más espacio
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, 0, pageWidth, 28, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GRÁFICAS ESTADÍSTICAS', pageWidth / 2, 12, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    pdf.text(`Análisis Visual - ${fecha}`, pageWidth / 2, 21, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    
    // Captura de gráficas con tamaños más grandes
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Gráficos más grandes - usando más espacio disponible
        const chartSize = 180; // Aumentado de 140 a 180
        const topY = 35; // Menos espacio desde arriba
        const leftX = (pageWidth / 2) - chartSize - 15; // Menos separación entre gráficos
        const rightX = (pageWidth / 2) + 15;
        
        // Primera gráfica - marcos más elegantes
        pdf.setFillColor(248, 249, 250);
        pdf.rect(leftX - 12, topY - 8, chartSize + 24, chartSize + 35, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.5);
        pdf.rect(leftX - 12, topY - 8, chartSize + 24, chartSize + 35, 'S');
        
        pdf.setFontSize(13); // Título más grande
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('Distribución por Estado', leftX + chartSize/2, topY + 2, { align: 'center' });
        
        pdf.addImage(doughnutImgData, 'PNG', leftX, topY + 8, chartSize, chartSize);
        
        // Segunda gráfica
        pdf.setFillColor(248, 249, 250);
        pdf.rect(rightX - 12, topY - 8, chartSize + 24, chartSize + 35, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(rightX - 12, topY - 8, chartSize + 24, chartSize + 35, 'S');
        
        pdf.text('Análisis de Valores', rightX + chartSize/2, topY + 2, { align: 'center' });
        
        pdf.addImage(barImgData, 'PNG', rightX, topY + 8, chartSize, chartSize);
        
      } catch (canvasError) {
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3, // Mayor calidad
            useCORS: true,
            allowTaint: true
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
            allowTaint: true
          })
        ]);
        
        const chartSize = 180;
        const topY = 35;
        const leftX = (pageWidth / 2) - chartSize - 15;
        const rightX = (pageWidth / 2) + 15;
        
        pdf.setFillColor(248, 249, 250);
        pdf.rect(leftX - 12, topY - 8, chartSize + 24, chartSize + 35, 'F');
        pdf.rect(rightX - 12, topY - 8, chartSize + 24, chartSize + 35, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(leftX - 12, topY - 8, chartSize + 24, chartSize + 35, 'S');
        pdf.rect(rightX - 12, topY - 8, chartSize + 24, chartSize + 35, 'S');
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94);
        pdf.text('Distribución por Estado', leftX + chartSize/2, topY + 2, { align: 'center' });
        pdf.text('Análisis de Valores', rightX + chartSize/2, topY + 2, { align: 'center' });
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', leftX, topY + 8, chartSize, chartSize);
        pdf.addImage(barImgData, 'PNG', rightX, topY + 8, chartSize, chartSize);
      }
    }
    
    // Footer más compacto
    pdf.setFillColor(52, 73, 94);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text('Sistema de Gestión de Pagos - Exportación de Gráficas', 15, pageHeight - 6);
    pdf.text('Página 1 de 1', pageWidth - 15, pageHeight - 6, { align: 'right' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth / 2, pageHeight - 6, { align: 'center' });
    
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
    
    // Header más compacto
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 32, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE EJECUTIVO DE ESTADÍSTICAS', pageWidth / 2, 14, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generado el: ${fecha}`, pageWidth / 2, 24, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    
    // Gráficas más grandes
    const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
    const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
    
    if (doughnutChart && barChart) {
      try {
        const doughnutImgData = doughnutChart.toDataURL('image/png', 1.0);
        const barImgData = barChart.toDataURL('image/png', 1.0);
        
        // Gráficos más grandes y mejor distribuidos
        const chartW = 150; // Aumentado de 120 a 150
        const chartH = 115; // Aumentado de 90 a 115
        const chartsY = 40; // Más cerca del header
        const leftChartX = 30; // Más cerca del borde
        const rightChartX = pageWidth - chartW - 30;
        
        // Gráfica izquierda con marco elegante
        pdf.setFillColor(250, 251, 252);
        pdf.rect(leftChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.5);
        pdf.rect(leftChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'S');
        
        pdf.setFontSize(12); // Título más grande
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Distribución por Estado', leftChartX + chartW/2, chartsY + 5, { align: 'center' });
        
        pdf.addImage(doughnutImgData, 'PNG', leftChartX, chartsY + 12, chartW, chartH);
        
        // Gráfica derecha
        pdf.setFillColor(250, 251, 252);
        pdf.rect(rightChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(rightChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'S');
        
        pdf.text('Análisis de Montos', rightChartX + chartW/2, chartsY + 5, { align: 'center' });
        
        pdf.addImage(barImgData, 'PNG', rightChartX, chartsY + 12, chartW, chartH);
        
      } catch (canvasError) {
        const html2canvas = (await import('html2canvas')).default;
        
        const [doughnutCanvas, barCanvas] = await Promise.all([
          html2canvas(doughnutChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3, // Mayor calidad
            useCORS: true
          }),
          html2canvas(barChart.parentElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true
          })
        ]);
        
        const chartW = 150;
        const chartH = 115;
        const chartsY = 40;
        const leftChartX = 30;
        const rightChartX = pageWidth - chartW - 30;
        
        pdf.setFillColor(250, 251, 252);
        pdf.rect(leftChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'F');
        pdf.rect(rightChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(leftChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'S');
        pdf.rect(rightChartX - 8, chartsY - 5, chartW + 16, chartH + 28, 'S');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text('Distribución por Estado', leftChartX + chartW/2, chartsY + 5, { align: 'center' });
        pdf.text('Análisis de Montos', rightChartX + chartW/2, chartsY + 5, { align: 'center' });
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png', 1.0);
        const barImgData = barCanvas.toDataURL('image/png', 1.0);
        
        pdf.addImage(doughnutImgData, 'PNG', leftChartX, chartsY + 12, chartW, chartH);
        pdf.addImage(barImgData, 'PNG', rightChartX, chartsY + 12, chartW, chartH);
      }
      
      // Sección de estadísticas con más espacio
      const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
      const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);
      
      const statsY = 185; // Más abajo para dar espacio a los gráficos grandes
      
      // Título de estadísticas más prominente
      pdf.setFillColor(41, 128, 185);
      pdf.rect(25, statsY, pageWidth - 50, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14); // Título más grande
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN ESTADÍSTICO COMPLETO', pageWidth / 2, statsY + 12, { align: 'center' });
      
      // Marco de estadísticas más espacioso
      pdf.setFillColor(247, 250, 252);
      pdf.rect(25, statsY + 18, pageWidth - 50, 80, 'F'); // Más alto
      pdf.setDrawColor(209, 213, 219);
      pdf.setLineWidth(0.5);
      pdf.rect(25, statsY + 18, pageWidth - 50, 80, 'S');
      
      // Datos organizados en dos columnas con mejor espaciado
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(11); // Texto más grande
      pdf.setFont('helvetica', 'bold');
      
      let currentY = statsY + 32;
      const col1X = 40;
      const col2X = pageWidth / 2 + 20;
      
      // Columna izquierda
      pdf.text('📊 RESUMEN GENERAL', col1X, currentY);
      currentY += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`• Total solicitudes: ${totalSolicitudes.toLocaleString('es-MX')}`, col1X, currentY);
      currentY += 12;
      
      pdf.text(`• Monto total: $${totalMonto.toLocaleString('es-MX', { 
        minimumFractionDigits: 2 
      })}`, col1X, currentY);
      currentY += 12;
      
      const promedio = totalSolicitudes > 0 ? totalMonto / totalSolicitudes : 0;
      pdf.text(`• Promedio: $${promedio.toLocaleString('es-MX', { 
        minimumFractionDigits: 2 
      })}`, col1X, currentY);
      
      // Columna derecha con mejor formato
      currentY = statsY + 32;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('📋 DETALLE POR ESTADO', col2X, currentY);
      currentY += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      data.forEach(item => {
        const porcentaje = totalSolicitudes > 0 ? (item.total / totalSolicitudes * 100) : 0;
        
        // Estado en negrita
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.estado.toUpperCase()}`, col2X, currentY);
        currentY += 10;
        
        // Detalles en texto normal
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`  ${item.total} solicitudes (${porcentaje.toFixed(1)}%)`, col2X + 3, currentY);
        currentY += 8;
        pdf.text(`  $${Number(item.monto_total).toLocaleString('es-MX')}`, col2X + 3, currentY);
        currentY += 12;
        
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
      });
    }
    
    // Footer más elegante
    pdf.setFillColor(55, 65, 81);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text('Sistema de Gestión - Reporte Ejecutivo', 15, pageHeight - 5);
    pdf.text('Página 1 de 1', pageWidth - 15, pageHeight - 5, { align: 'right' });
    pdf.text(new Date().toLocaleString('es-MX'), pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    pdf.save(`reporte-ejecutivo-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('📊 Reporte ejecutivo generado correctamente');
    
  } catch (error) {
    console.error('Error al generar reporte:', error);
    toast.error('❌ Error al generar reporte ejecutivo');
  }
};
