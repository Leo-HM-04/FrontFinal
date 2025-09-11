"use client";

import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { MdAssignment, MdAttachMoney, MdBarChart, MdPieChart, MdStackedBarChart, MdErrorOutline, MdInsertChartOutlined, MdAnalytics, MdFileDownload } from "react-icons/md";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  TooltipItem,
  Chart
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { Context as DataLabelsContext } from "chartjs-plugin-datalabels/types";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AprobadorLayout } from '@/components/layout/AprobadorLayout';
import { toast } from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartDataLabels);

interface EstadoData {
  estado: string;
  total: number;
  monto_total: string;
  origen?: 'solicitudes_pago' | 'solicitudes_viaticos' | 'pagos_recurrentes';
}

interface TendenciaMes {
  mes: string;
  total: number;
  monto_total: number;
  origen?: string;
}

export default function GraficasAprobador() {
  const [data, setData] = useState<EstadoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tendencia, setTendencia] = useState<TendenciaMes[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        // Resumen por estado
        const res = await fetch("/api/estadisticas-aprobador/resumen-estado", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (!res.ok) throw new Error("Error al obtener datos");
        const json = await res.json();
        setData(json);
        // Tendencia mensual
        const resTend = await fetch("/api/estadisticas-aprobador/tendencia-mensual", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        });
        if (resTend.ok) {
          const tendenciaJson = await resTend.json();
          setTendencia(tendenciaJson);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Funciones de exportación a PDF
  const exportToPDF = async () => {
    try {
      setExporting(true);
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape para mejor visualización
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Título del reporte
      pdf.setFontSize(20);
      pdf.text('Panel de Estadísticas Ejecutivas', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, 30, { align: 'center' });
      
      // Capturar las gráficas
      const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
      const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
      
      if (doughnutChart && barChart) {
        // Capturar gráfica de dona
        const doughnutCanvas = await html2canvas(doughnutChart.parentElement as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        // Capturar gráfica de barras
        const barCanvas = await html2canvas(barChart.parentElement as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        // Agregar gráfica de dona (lado izquierdo)
        const doughnutImgData = doughnutCanvas.toDataURL('image/png');
        const doughnutWidth = (pageWidth / 2) - 20;
        const doughnutHeight = (doughnutWidth * doughnutCanvas.height) / doughnutCanvas.width;
        pdf.addImage(doughnutImgData, 'PNG', 10, 45, doughnutWidth, doughnutHeight);
        
        // Agregar gráfica de barras (lado derecho)
        const barImgData = barCanvas.toDataURL('image/png');
        const barWidth = (pageWidth / 2) - 20;
        const barHeight = (barWidth * barCanvas.height) / barCanvas.width;
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, 45, barWidth, barHeight);
        
        // Agregar estadísticas resumidas
        const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
        const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);
        
        const statsY = Math.max(doughnutHeight, barHeight) + 60;
        pdf.setFontSize(14);
        pdf.text('Resumen Estadístico:', 20, statsY);
        
        pdf.setFontSize(12);
        pdf.text(`• Total de solicitudes: ${totalSolicitudes.toLocaleString()}`, 20, statsY + 15);
        pdf.text(`• Monto total: $${totalMonto.toLocaleString('es-MX')}`, 20, statsY + 25);
        pdf.text(`• Estados activos: ${data.length}`, 20, statsY + 35);
        pdf.text(`• Promedio por solicitud: $${Math.round(totalMonto / totalSolicitudes).toLocaleString('es-MX')}`, 20, statsY + 45);
        
        // Detalle por estado
        pdf.text('Detalle por Estado:', pageWidth / 2 + 20, statsY);
        let detailY = statsY + 15;
        
        data.forEach((item, index) => {
          const promedio = Math.round(Number(item.monto_total) / item.total);
          pdf.text(`• ${item.estado}: ${item.total} solicitudes ($${Number(item.monto_total).toLocaleString('es-MX')})`, 
                   pageWidth / 2 + 20, detailY);
          pdf.text(`  Promedio: $${promedio.toLocaleString('es-MX')}`, 
                   pageWidth / 2 + 25, detailY + 8);
          detailY += 20;
        });
        
        // Footer
        pdf.setFontSize(8);
        pdf.text('Generado por Sistema de Gestión de Pagos', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
      
      // Descargar el PDF
      pdf.save(`estadisticas-ejecutivas-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Reporte PDF generado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al generar el reporte PDF');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  const exportChartsOnly = async () => {
    try {
      setExporting(true);
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Título
      pdf.setFontSize(18);
      pdf.text('Gráficas de Estadísticas', pageWidth / 2, 20, { align: 'center' });
      
      // Capturar solo las gráficas
      const doughnutChart = document.querySelector('.doughnut-chart canvas') as HTMLCanvasElement;
      const barChart = document.querySelector('.bar-chart canvas') as HTMLCanvasElement;
      
      if (doughnutChart && barChart) {
        const doughnutCanvas = await html2canvas(doughnutChart.parentElement as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        const barCanvas = await html2canvas(barChart.parentElement as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        // Gráficas más grandes al ocupar toda la página
        const chartWidth = (pageWidth / 2) - 20;
        const doughnutHeight = (chartWidth * doughnutCanvas.height) / doughnutCanvas.width;
        const barHeight = (chartWidth * barCanvas.height) / barCanvas.width;
        
        const doughnutImgData = doughnutCanvas.toDataURL('image/png');
        const barImgData = barCanvas.toDataURL('image/png');
        
        pdf.addImage(doughnutImgData, 'PNG', 10, 35, chartWidth, doughnutHeight);
        pdf.addImage(barImgData, 'PNG', pageWidth / 2 + 10, 35, chartWidth, barHeight);
      }
      
      pdf.save(`graficas-estadisticas-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Gráficas exportadas exitosamente');
      
    } catch (error) {
      console.error('Error al exportar gráficas:', error);
      toast.error('Error al exportar las gráficas');
    } finally {
      setExporting(false);
      setShowExportModal(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <div className="absolute inset-0 rounded-full bg-blue-100/20 blur-xl"></div>
              </div>
              <p className="text-xl font-medium text-gray-600">Cargando estadísticas...</p>
              <p className="text-sm text-gray-500 mt-2">Preparando tu dashboard ejecutivo</p>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/50">
                <div className="text-red-500 text-6xl mb-6 flex justify-center">
                  <div className="bg-red-50 p-4 rounded-full">
                    <MdErrorOutline size={56} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Error al cargar datos</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Reintentar
                </button>
              </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  if (!data.length) {
    return (
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/50">
              <div className="text-gray-400 text-6xl mb-6 flex justify-center">
                <div className="bg-gray-50 p-4 rounded-full">
                  <MdInsertChartOutlined size={56} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Sin datos disponibles</h2>
              <p className="text-gray-600 mb-6">No hay datos para mostrar en este momento.</p>
              <div className="text-sm text-gray-500">
                <p>• Verifica que tengas solicitudes asignadas</p>
                <p>• Contacta al administrador si el problema persiste</p>
              </div>
            </div>
          </div>
        </AprobadorLayout>
      </ProtectedRoute>
    );
  }

  // Paleta de colores corporativa mejorada
  const colorPalette = [
    { bg: "#1e40af", hover: "#1d4ed8", gradient: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)" },
    { bg: "#059669", hover: "#047857", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
    { bg: "#d97706", hover: "#b45309", gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" },
    { bg: "#dc2626", hover: "#b91c1c", gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" },
    { bg: "#7c3aed", hover: "#6d28d9", gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" },
    { bg: "#0891b2", hover: "#0e7490", gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)" }
  ];

  const totalSolicitudes = data.reduce((sum, item) => sum + item.total, 0);
  const totalMonto = data.reduce((sum, item) => sum + Number(item.monto_total), 0);

  // Calcular variación mensual de solicitudes y monto
  let variacionSolicitudes = 0;
  let variacionMonto = 0;
  if (tendencia.length > 1) {
    // Agrupar por mes (puede haber varios orígenes por mes)
    const meses: { [key: string]: { total: number; monto: number } } = {};
    tendencia.forEach((item) => {
      if (!meses[item.mes]) meses[item.mes] = { total: 0, monto: 0 };
      meses[item.mes].total += Number(item.total);
      meses[item.mes].monto += Number(item.monto_total);
    });
    const mesesKeys = Object.keys(meses).sort();
    if (mesesKeys.length >= 2) {
      const mesActual = meses[mesesKeys[mesesKeys.length - 1]];
      const mesAnterior = meses[mesesKeys[mesesKeys.length - 2]];
      variacionSolicitudes = mesAnterior.total === 0 ? 100 : ((mesActual.total - mesAnterior.total) / mesAnterior.total) * 100;
      variacionMonto = mesAnterior.monto === 0 ? 100 : ((mesActual.monto - mesAnterior.monto) / mesAnterior.monto) * 100;
    }
  }

  // Configuración mejorada de gráfica de dona
  const doughnutData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Solicitudes",
        data: data.map(d => d.total),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 15,
        cutout: "65%",
        hoverBorderWidth: 6,
        hoverBackgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].hover),
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: (ctx: DataLabelsContext) => {
          // Si el porcentaje es pequeño, reducir fuente
          const value = ctx.dataset.data[ctx.dataIndex] as number;
          const percentage = (value / totalSolicitudes) * 100;
          return {
            weight: "bold" as const,
            size: percentage < 5 ? 11 : 14
          };
        },
        formatter: (value: number) => {
          const percentage = ((value / totalSolicitudes) * 100);
          return `${value.toLocaleString()}\n${percentage.toFixed(1)}%`;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        borderRadius: 8,
        backgroundColor: 'rgba(30,41,59,0.85)',
        padding: { top: 4, bottom: 4, left: 8, right: 8 },
        display: true,
        textAlign: 'center' as const,
        borderWidth: 0,
        shadowBlur: 4,
        clamp: true,
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: { size: 15, weight: "bold" as const, family: 'Inter, system-ui, sans-serif' },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
          generateLabels: (chart: Chart<"doughnut">) => {
            const data = chart.data;
            const labels = Array.isArray(data.labels) ? data.labels.map(l => String(l)) : [];
            const bgColors = Array.isArray(data.datasets[0]?.backgroundColor)
              ? (data.datasets[0].backgroundColor as string[])
              : [];
            return labels.map((label, i) => ({
              text: `${label} (${data.datasets[0]?.data[i] ?? 0})`,
              fillStyle: bgColors[i] ?? '#ccc',
              strokeStyle: 'transparent',
              pointStyle: "circle" as const,
            }));
          },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        callbacks: {
          label: function(this: import("chart.js").TooltipModel<"doughnut">, tooltipItem: TooltipItem<"doughnut">) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.parsed;
            const percentage = ((value / totalSolicitudes) * 100).toFixed(1);
            return [
              `Estado: ${label}`,
              `Cantidad: ${value} solicitudes`,
              `Porcentaje: ${percentage}%`
            ];
          },
        },
        // zIndex para asegurar que la tooltip esté por encima
        z: 100,
      }
    },
    animation: {
      animateRotate: true,
      duration: 800,
      easing: 'easeOutQuart' as const
    }
  };

  // Configuración mejorada de gráfica de barras
  const barData = {
    labels: data.map(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1)),
    datasets: [
      {
        label: "Monto total",
        data: data.map(d => Number(d.monto_total)),
        backgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].bg),
        borderRadius: {
          topLeft: 16,
          topRight: 16,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderSkipped: false,
        maxBarThickness: 70,
        borderWidth: 0,
        hoverBackgroundColor: data.map((_, i) => colorPalette[i % colorPalette.length].hover),
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        font: { weight: "bold" as const, size: 13 },
        anchor: 'end' as const,
        align: 'end' as const,
        offset: 0,
        borderRadius: 8,
        backgroundColor: 'rgba(30,41,59,0.85)',
        padding: { top: 6, bottom: 6, left: 10, right: 10 },
        display: true,
        textAlign: 'center' as const,
        borderWidth: 0,
        shadowBlur: 4,
        clip: false,
        formatter: (value: number) => {
          // Mostrar con separador de miles y símbolo de $ grande
          return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
        }
      },
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        callbacks: {
          label: function(this: import("chart.js").TooltipModel<"bar">, tooltipItem: TooltipItem<"bar">) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.parsed.y;
            return [
              `Monto: $${value.toLocaleString()}`,
              `Promedio por solicitud: $${Math.round(value / (data.find(d => d.estado.charAt(0).toUpperCase() + d.estado.slice(1) === label)?.total || 1)).toLocaleString()}`
            ];
          },
        },
        // zIndex para asegurar que la tooltip esté por encima
        z: 100,
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#4b5563', 
          font: { size: 14, weight: "bold" as const, family: 'Inter, system-ui, sans-serif' },
          maxRotation: 0,
          padding: 10
        },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        ticks: { 
          color: '#4b5563', 
          font: { size: 13, weight: "bold" as const, family: 'Inter, system-ui, sans-serif' },
          callback: (value: number | string) => `$${Number(value).toLocaleString()}`,
          padding: 15
        },
        grid: { 
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
          lineWidth: 1
        },
        border: { display: false },
        beginAtZero: true
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'autorizada': 
      case 'autorizado': 
        return (
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'pagada': 
      case 'pagado': 
        return (
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'rechazada': 
      case 'rechazado': 
        return (
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pendiente': 
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'en_proceso': 
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      default: 
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  // CSS global para tooltips de Chart.js y datalabels
  // Esto asegura que los tooltips y datalabels estén siempre por encima
  // Puedes mover este bloque a un CSS global si lo prefieres
  // El selector .chartjs-tooltip es para tooltips, .chartjs-datalabel para datalabels
  // El !important es necesario para sobrescribir cualquier stacking context
  return (
    <>
      <style>{`
        .chartjs-tooltip {
          z-index: 9999 !important;
          font-family: 'Inter', system-ui, sans-serif !important;
        }
        .chartjs-datalabel {
          z-index: 9999 !important;
          font-family: 'Inter', system-ui, sans-serif !important;
        }
        .chartjs-size-monitor, .chartjs-size-monitor-expand, .chartjs-size-monitor-shrink {
          z-index: auto !important;
        }
        .chartjs-render-monitor {
          z-index: auto !important;
        }
        canvas {
          z-index: 1 !important;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
        }
        /* Mejorar animaciones de hover en las gráficas */
        .chart-container {
          transition: all 0.3s ease;
        }
        .chart-container:hover {
          transform: translateY(-2px);
        }
      `}</style>
      <ProtectedRoute>
        <AprobadorLayout>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-10 px-6">
            <div className="max-w-7xl mx-auto">
              
              {/* Header Section */}
              <div className="mb-12">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="text-center lg:text-left max-w-3xl">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                      Panel de Estadísticas Ejecutivas
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Dashboard integral con insights de rendimiento y análisis de solicitudes
                    </p>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={exporting}
                    >
                      <MdFileDownload size={20} />
                      {exporting ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards de estadísticas - Diseño corporativo mejorado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="group relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MdAssignment size={28} className="text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${variacionSolicitudes >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {variacionSolicitudes >= 0 ? '+' : ''}{variacionSolicitudes.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-2">Total Solicitudes</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">{totalSolicitudes.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm">vs mes anterior</p>
                    </div>
                  </div>
                </div>
                
                <div className="group relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MdAttachMoney size={28} className="text-white" />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${variacionMonto >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {variacionMonto >= 0 ? '+' : ''}{variacionMonto.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-2">Monto Total</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">${totalMonto.toLocaleString()}</p>
                      <p className="text-gray-500 text-sm">vs mes anterior</p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <MdBarChart size={28} className="text-white" />
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Activo
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide mb-2">Estados Activos</p>
                      <p className="text-3xl font-bold text-gray-900 mb-2">{data.length}</p>
                      <p className="text-gray-500 text-sm">Categorías en proceso</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficas principales - Diseño mejorado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                {/* Gráfica de dona */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribución por Estado</h2>
                      <p className="text-gray-600">Análisis de solicitudes por categoría</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MdPieChart size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="relative h-96 flex items-center justify-center chart-container doughnut-chart">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center bg-white/95 rounded-2xl px-6 py-4 shadow-xl backdrop-blur-md border border-white/50">
                        <div className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                          {totalSolicitudes}
                        </div>
                        <div className="text-sm text-gray-600 font-semibold">Total Solicitudes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfica de barras */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Valores por Estado</h2>
                      <p className="text-gray-600">Distribución monetaria por categoría</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MdStackedBarChart size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="relative h-96 chart-container bar-chart">
                    <Bar data={barData} options={barOptions} />
                  </div>
                </div>
              </div>

              {/* Panel de insights y detalle */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <MdAnalytics size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">Insights Ejecutivos</h3>
                      <p className="text-gray-600">Análisis inteligente y automatizado</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Rendimiento Actual</h4>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {data.length > 0 && (
                          <>
                            Estado predominante: <span className="font-bold text-blue-700">{data.sort((a, b) => b.total - a.total)[0].estado}</span> con <span className="font-bold">{data.sort((a, b) => b.total - a.total)[0].total} solicitudes</span>
                            <br />
                            <span className="text-sm text-gray-600">
                              Representa el {((data.sort((a, b) => b.total - a.total)[0].total / totalSolicitudes) * 100).toFixed(1)}% del volumen total
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Análisis Financiero</h4>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        Monto promedio por solicitud: <span className="font-bold text-emerald-700 text-xl">${Math.round(totalMonto / totalSolicitudes).toLocaleString()}</span>
                        <br />
                        <span className="text-sm text-gray-600">Valor medio de procesamiento por transacción</span>
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Recomendaciones Estratégicas</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-gray-700">Priorizar revisión de montos altos</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-gray-700">Optimizar tiempos de aprobación</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-gray-700">Implementar alertas tempranas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle por estado */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      <MdPieChart size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">Detalle por Estado</h3>
                      <p className="text-gray-600">Análisis detallado de cada categoría</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {data.map((item, index) => {
                      const percentage = ((item.total / totalSolicitudes) * 100).toFixed(1);
                      const color = colorPalette[index % colorPalette.length];
                      const avgPerRequest = Math.round(Number(item.monto_total) / item.total);
                      
                      return (
                        <div key={item.estado} className="group border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300 bg-gradient-to-r from-gray-50/50 to-white">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(item.estado)}
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 capitalize mb-1">{item.estado}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">{percentage}% del total</span>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                  <span className="text-sm text-gray-600">{item.total} solicitudes</span>
                                </div>
                              </div>
                            </div>
                            <div 
                              className="w-6 h-6 rounded-full shadow-lg ring-2 ring-white" 
                              style={{ backgroundColor: color.bg }}
                            ></div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                              <p className="text-2xl font-bold text-gray-900 mb-1">{item.total}</p>
                              <p className="text-sm text-gray-600 font-medium">Solicitudes</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                              <p className="text-2xl font-bold text-emerald-600 mb-1">${Number(item.monto_total).toLocaleString()}</p>
                              <p className="text-sm text-gray-600 font-medium">Monto Total</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                              <p className="text-2xl font-bold text-blue-600 mb-1">${avgPerRequest.toLocaleString()}</p>
                              <p className="text-sm text-gray-600 font-medium">Promedio</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                              <span>Participación en volumen</span>
                              <span className="text-lg font-bold" style={{ color: color.bg }}>{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 group-hover:scale-x-105 origin-left" 
                                style={{ 
                                  width: `${percentage}%`, 
                                  background: `linear-gradient(90deg, ${color.bg} 0%, ${color.hover} 100%)`,
                                  boxShadow: `0 2px 8px ${color.bg}30`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Exportación */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full mx-4 shadow-2xl border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <MdFileDownload size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Exportar a PDF</h3>
                        <p className="text-sm text-gray-600">Selecciona el tipo de exportación</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={exporting}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <button
                      onClick={exportToPDF}
                      disabled={exporting}
                      className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
                        <MdAnalytics size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Reporte Completo</p>
                        <p className="text-sm text-gray-600">Incluye gráficas, estadísticas y análisis detallado</p>
                      </div>
                      {exporting && (
                        <div className="ml-auto">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={exportChartsOnly}
                      disabled={exporting}
                      className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-shadow">
                        <MdPieChart size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Solo Gráficas</p>
                        <p className="text-sm text-gray-600">Exporta únicamente las gráficas en alta calidad</p>
                      </div>
                      {exporting && (
                        <div className="ml-auto">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Los archivos se descargarán automáticamente en formato PDF
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

      </AprobadorLayout>
    </ProtectedRoute>
    </>
  );
}