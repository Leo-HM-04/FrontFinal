'use client';

import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, Search, X } from 'lucide-react';
import { SubirFacturaModal } from '@/components/pagos/SubirFacturaModal';
import { VerComprobanteModal } from '@/components/pagos/VerComprobanteModal';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import type { Comprobante } from '@/components/pagos/VerComprobanteModal';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function HistorialPagosPage() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
  // Estado para modal de subir factura
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudIdFactura, setSolicitudIdFactura] = useState<number | null>(null);
  const [pagos, setPagos] = useState<Solicitud[]>([]);
  const [comprobantes, setComprobantes] = useState<{ [id: number]: Comprobante | null }>({});
  const [verComprobante, setVerComprobante] = useState<{ open: boolean; pago: Solicitud | null }>({ open: false, pago: null });
  // Estado para mostrar mensaje de éxito
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // Solo mostrar pagadas
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para exportación
  const [showExportModal, setShowExportModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'con_comprobante' | 'sin_comprobante'>('todos');

  // Función para recargar pagos y comprobantes
  // Ocultar mensaje de éxito automáticamente después de 3 segundos
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);
  const fetchPagosYComprobantes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No hay token de autenticación');
      const { SolicitudesService } = await import('@/services/solicitudes.service');
      const { ComprobantesService } = await import('@/services/comprobantes.service');
      const data = await SolicitudesService.getAutorizadasYPagadas(token);
      const pagosFiltrados = data.filter((p) => p.estado === 'pagada' || p.estado === 'autorizada');
      pagosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.fecha_pago || a.fecha_limite_pago || 0).getTime();
        const fechaB = new Date(b.fecha_pago || b.fecha_limite_pago || 0).getTime();
        return fechaB - fechaA;
      });
      setPagos(pagosFiltrados);
      // Consultar comprobantes para cada solicitud pagada
      const comprobantesObj: { [id: number]: null } = {};
      await Promise.all(
        pagosFiltrados.map(async (pago) => {
          if (pago.estado === 'pagada') {
            try {
              const comprobantes = await ComprobantesService.getBySolicitud(pago.id_solicitud, token);
              if (comprobantes && comprobantes.length > 0) {
                comprobantesObj[pago.id_solicitud] = comprobantes[0];
              }
            } catch {}
          }
        })
      );
      setComprobantes(comprobantesObj);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPagosYComprobantes();
  }, []);

  // Función para ordenar
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string | null): { date: string; time: string } => {
    if (!dateString) return { date: '-', time: '-' };
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    };
    return {
      date: date.toLocaleDateString('es-MX', dateOptions),
      time: date.toLocaleTimeString('es-MX', timeOptions)
    };
  };

  // Funciones de exportación
  const exportToCSV = () => {
    try {
      const headers = [
        'ID', 'Solicitante', 'Departamento', 'Monto', 'Tipo de Pago', 'Estado', 
        'Fecha de Solicitud', 'Hora de Solicitud', 'Comprobante'
      ];
      
      const csvContent = [
        headers.join(','),
        ...pagosFiltrados.map(pago => {
          const dateTime = formatDateTime(pago.fecha_creacion);
          const tieneComprobante = comprobantes[pago.id_solicitud];
          return [
            pago.id_solicitud,
            `"${(pago.usuario_nombre || pago.nombre_usuario || '-').replace(/"/g, '""')}"`,
            `"${(pago.departamento || '-').replace(/"/g, '""')}"`,
            pago.monto,
            `"${(pago.tipo_pago || '-').replace(/"/g, '""')}"`,
            pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
            `"${dateTime.date}"`,
            `"${dateTime.time}"`,
            tieneComprobante ? 'Con Comprobante' : 'Sin Comprobante'
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `comprobantes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Archivo CSV descargado exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar CSV');
    }
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text('Comprobantes de Pago', 20, 20);
      
      // Información adicional
      doc.setFontSize(10);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 20, 30);
      doc.text(`Total de registros: ${pagosFiltrados.length}`, 20, 35);
      
      // Preparar datos para la tabla
      const tableData = pagosFiltrados.map(pago => {
        const dateTime = formatDateTime(pago.fecha_creacion);
        const tieneComprobante = comprobantes[pago.id_solicitud];
        return [
          pago.id_solicitud.toString(),
          pago.usuario_nombre || pago.nombre_usuario || '-',
          pago.departamento || '-',
          formatCurrency(pago.monto),
          pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
          `${dateTime.date} ${dateTime.time}`,
          tieneComprobante ? 'Con Comprobante' : 'Sin Comprobante'
        ];
      });

      // Crear tabla
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        head: [['ID', 'Solicitante', 'Depto', 'Monto', 'Estado', 'Fecha/Hora', 'Comprobante']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      doc.save(`comprobantes_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Archivo PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Comprobantes de Pago');
      
      // Título
      worksheet.mergeCells('A1:I1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Comprobantes de Pago';
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center' };
      
      // Información adicional
      worksheet.getCell('A2').value = `Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`;
      worksheet.getCell('A3').value = `Total de registros: ${pagosFiltrados.length}`;
      
      // Encabezados
      const headers = ['ID', 'Solicitante', 'Departamento', 'Monto', 'Tipo Pago', 'Estado', 'Fecha Solicitud', 'Hora Solicitud', 'Comprobante'];
      const headerRow = worksheet.getRow(5);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
      });
      
      // Datos
      pagosFiltrados.forEach((pago, index) => {
        const dateTime = formatDateTime(pago.fecha_creacion);
        const tieneComprobante = comprobantes[pago.id_solicitud];
        const row = worksheet.getRow(6 + index);
        row.values = [
          pago.id_solicitud,
          pago.usuario_nombre || pago.nombre_usuario || '-',
          pago.departamento || '-',
          pago.monto,
          pago.tipo_pago || '-',
          pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
          dateTime.date,
          dateTime.time,
          tieneComprobante ? 'Con Comprobante' : 'Sin Comprobante'
        ];
      });
      
      // Ajustar anchos de columna
      worksheet.columns = [
        { width: 8 }, { width: 20 }, { width: 15 }, { width: 12 },
        { width: 15 }, { width: 12 }, { width: 12 }, { width: 10 }, { width: 15 }
      ];
      
      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `comprobantes_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  // Filtrar los pagos según el estado seleccionado, búsqueda y departamento
  const pagosFiltrados = pagos
    .filter((p) => p.estado === 'pagada') // Solo pagos pagados
    .filter(pago => {
      // Filtro por comprobante
      if (filtroEstado === 'con_comprobante') return comprobantes[pago.id_solicitud];
      if (filtroEstado === 'sin_comprobante') return !comprobantes[pago.id_solicitud];
      return true;
    })
    .filter(pago => {
      // Filtro por departamento
      if (departamentoFiltro === 'todos') return true;
      return pago.departamento === departamentoFiltro;
    })
    .filter(pago => {
      // Filtro por búsqueda
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        pago.id_solicitud.toString().includes(searchLower) ||
        (pago.usuario_nombre || pago.nombre_usuario || '').toLowerCase().includes(searchLower) ||
        (pago.departamento || '').toLowerCase().includes(searchLower) ||
        (pago.tipo_pago || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Ordenamiento
      if (!sortField) return 0;
      
      let aVal, bVal;
      switch (sortField) {
        case 'id':
          aVal = a.id_solicitud;
          bVal = b.id_solicitud;
          break;
        case 'usuario':
          aVal = a.usuario_nombre || a.nombre_usuario || '';
          bVal = b.usuario_nombre || b.nombre_usuario || '';
          break;
        case 'departamento':
          aVal = a.departamento || '';
          bVal = b.departamento || '';
          break;
        case 'monto':
          aVal = a.monto;
          bVal = b.monto;
          break;
        case 'tipo':
          aVal = a.tipo_pago || '';
          bVal = b.tipo_pago || '';
          break;
        case 'estado':
          aVal = a.estado;
          bVal = b.estado;
          break;
        case 'fecha':
          aVal = new Date(a.fecha_creacion || 0).getTime();
          bVal = new Date(b.fecha_creacion || 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // El botón 'Subir Comprobante' ya está disponible para todas las solicitudes pagadas
  // Si el backend acepta la subida para cualquier solicitud pagada, no se requiere cambio adicional aquí
  // Paginado
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
  // Ordenar: primero los que NO tienen comprobante, luego los que SÍ tienen
  const pagosOrdenados = [...pagosFiltrados].sort((a, b) => {
    const tieneComprobanteA = !!comprobantes[a.id_solicitud];
    const tieneComprobanteB = !!comprobantes[b.id_solicitud];
    if (tieneComprobanteA === tieneComprobanteB) return 0;
    return tieneComprobanteA ? 1 : -1;
  });
  const pagosPaginados = pagosOrdenados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Mensaje de éxito */}
          {successMsg && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="font-semibold text-lg">{successMsg}</span>
              </div>
            </div>
          )}
          {/* Header Profesional */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl border border-blue-500/30 mb-8">
            <div className="px-8 py-6">
              {/* Título y estadísticas */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Subir Comprobante</h1>
                    <p className="text-blue-100">Gestión de comprobantes de pago</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                    <p className="text-2xl font-bold text-white">{pagosFiltrados.length}</p>
                    <p className="text-blue-100 text-sm">Total</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                    <p className="text-2xl font-bold text-green-300">
                      {pagosFiltrados.filter(p => comprobantes[p.id_solicitud]).length}
                    </p>
                    <p className="text-blue-100 text-sm">Con Comprobante</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                    <p className="text-2xl font-bold text-yellow-300">
                      {pagosFiltrados.filter(p => !comprobantes[p.id_solicitud]).length}
                    </p>
                    <p className="text-blue-100 text-sm">Sin Comprobante</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                    <p className="text-2xl font-bold text-blue-200">
                      {formatCurrency(pagosFiltrados.reduce((sum, p) => sum + (Number(p.monto) || 0), 0))}
                    </p>
                    <p className="text-blue-100 text-sm">Total Monto</p>
                  </div>
                </div>
              </div>

              {/* Controles de búsqueda y filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                {/* Búsqueda */}
                <div className="relative">
                  <label className="block text-white text-sm font-medium mb-2">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ID, solicitante, departamento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtro por estado de comprobante */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Estado Comprobante</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'con_comprobante' | 'sin_comprobante')}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  >
                    <option value="todos" className="text-gray-800">Todos</option>
                    <option value="con_comprobante" className="text-gray-800">Con Comprobante</option>
                    <option value="sin_comprobante" className="text-gray-800">Sin Comprobante</option>
                  </select>
                </div>

                {/* Filtro por departamento */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Departamento</label>
                  <select
                    value={departamentoFiltro}
                    onChange={(e) => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                    className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  >
                    <option value="todos" className="text-gray-800">Todos</option>
                    {[...new Set(pagos.filter(p => p.estado === 'pagada').map((p: Solicitud) => p.departamento).filter(Boolean))].map((dep: string) => (
                      <option key={dep} value={dep} className="text-gray-800">{dep.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Botón de exportar */}
                <div>
                  <label className="block text-transparent text-sm font-medium mb-2">Acciones</label>
                  <Button
                    onClick={() => setShowExportModal(true)}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-green-400 animate-spin mb-4" />
              <p className="text-lg text-gray-700">Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <p className="text-lg text-red-600">{error}</p>
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
              <p className="text-lg text-gray-700">No hay pagos realizados aún.</p>
            </div>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-x-auto p-0 w-full max-w-7xl mx-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead style={{backgroundColor: '#F0F4FC'}}>
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-2">
                          Folio del pago
                          {getSortIcon('id')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('usuario')}
                      >
                        <div className="flex items-center gap-2">
                          Solicitante
                          {getSortIcon('usuario')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('departamento')}
                      >
                        <div className="flex items-center gap-2">
                          Departamento
                          {getSortIcon('departamento')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('monto')}
                      >
                        <div className="flex items-center gap-2">
                          Monto
                          {getSortIcon('monto')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('tipo')}
                      >
                        <div className="flex items-center gap-2">
                          Tipo Pago
                          {getSortIcon('tipo')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                        onClick={() => handleSort('fecha')}
                      >
                        <div className="flex items-center gap-2">
                          Fecha/Hora
                          {getSortIcon('fecha')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 divide-y divide-blue-50">
                    {pagosPaginados.map((pago, idx) => (
                      <tr
                        key={pago.id_solicitud}
                        className={`transition-colors rounded-xl ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-bold">{pago.folio}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.nombre_usuario || pago.usuario_nombre || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-sm font-semibold rounded-xl bg-blue-200 text-blue-800 shadow">{pago.departamento ? pago.departamento.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900 font-semibold">{formatCurrency(pago.monto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">{pago.tipo_pago ? pago.tipo_pago.charAt(0).toUpperCase() + pago.tipo_pago.slice(1).replace(/_/g, ' ') : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDateTime(pago.fecha_creacion).date}</span>
                            <span className="text-xs text-blue-600">{formatDateTime(pago.fecha_creacion).time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            comprobantes[pago.id_solicitud] ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {comprobantes[pago.id_solicitud] ? 'Con Comprobante' : 'Sin Comprobante'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <button
                              className="min-w-[120px] py-1.5 text-xs bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 mb-0.5"
                              onClick={() => { setSelectedPago(pago); setShowDetailModal(true); }}
                            >
                              Ver
                            </button>
                            {pago.estado === 'pagada' && (
                              comprobantes[pago.id_solicitud] ? (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  onClick={() => setVerComprobante({ open: true, pago })}
                                >
                                  Ver comprobante
                                </button>
                              ) : (
                                <button
                                  className="min-w-[120px] py-1.5 text-xs bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                                  onClick={() => {
                                    setSolicitudIdFactura(pago.id_solicitud);
                                    setModalOpen(true);
                                  }}
                                >
                                  Subir Comprobante
                                </button>
                              )
                            )}
                          </div>
                        </td>
                        {/* Modal para ver detalles de la solicitud (fuera de la tabla para evitar error de hidratación) */}
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Paginador reutilizado */}
              <div className="px-6 py-4" style={{backgroundColor: '#F0F4FC'}}>
                <Pagination
                  currentPage={pagina}
                  totalPages={totalPaginas}
                  totalItems={pagosFiltrados.length}
                  itemsPerPage={pagosPorPagina}
                  onPageChange={setPagina}
                />
              </div>
              {/* Modal para ver comprobante fuera de la tabla para evitar error de hidratación */}
              {verComprobante.open && verComprobante.pago && comprobantes[verComprobante.pago.id_solicitud] && (
                <VerComprobanteModal
                  open={verComprobante.open}
                  pago={verComprobante.pago}
                  comprobante={comprobantes[verComprobante.pago.id_solicitud]!}
                  onClose={() => setVerComprobante({ open: false, pago: null })}
                />
              )}
                <PagoDetailModal
                  isOpen={showDetailModal}
                  pago={selectedPago}
                  onClose={() => setShowDetailModal(false)}
                />
              {/* Modal para subir factura */}
              <SubirFacturaModal
                open={modalOpen}
                solicitudId={solicitudIdFactura}
                onClose={() => setModalOpen(false)}
                onSubmit={async (file, id) => {
                  try {
                    const token = localStorage.getItem('auth_token');
                    if (!token || !id) throw new Error('No hay token o id de solicitud');
                    await SolicitudesService.subirFactura(id, file, token);
                    await fetchPagosYComprobantes(); // Recargar datos tras subir comprobante
                    setSuccessMsg('¡Comprobante subido exitosamente!');
                  } catch {
                    alert('Error al subir la factura');
                  } finally {
                    setModalOpen(false);
                  }
                }}
              />
              {/* Mensaje de éxito */}
              {successMsg && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
                  <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span className="font-semibold text-lg">{successMsg}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal de Exportación Mejorado - Responsive */}
          {showExportModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto transform animate-in slide-in-from-bottom-4 duration-300 border border-gray-200/50 mx-2 sm:mx-0">
                {/* Header del modal */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-6 rounded-t-2xl border-b border-gray-200/50 sticky top-0 z-10">
                  <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 flex-1">
                      <div className="bg-gray-500/20 p-2 rounded-lg flex-shrink-0">
                        <Download className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">Exportar Comprobantes</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-tight">Selecciona el formato deseado para exportar los comprobantes</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 sm:p-6 bg-white/80">
                  {/* Sección de selección de datos */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="bg-gray-100 p-1.5 rounded-lg">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      </div>
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base">Seleccionar datos a exportar</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {/* Todos los registros */}
                      <div className="border border-gray-200 bg-gray-50/50 rounded-xl p-3 sm:p-4 text-center hover:border-gray-300 hover:bg-gray-100/50 transition-all">
                        <div className="bg-gray-400 p-2 rounded-lg w-fit mx-auto mb-2">
                          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h5 className="font-medium text-gray-800 text-xs sm:text-sm mb-1">Todos los registros</h5>
                        <p className="text-xs text-gray-600 mb-2 leading-tight">Incluye todos los elementos disponibles</p>
                        <div className="bg-white/80 rounded-lg p-1.5 border border-gray-200">
                          <p className="text-xs text-gray-500">Todos los elementos</p>
                        </div>
                      </div>

                      {/* Solo con comprobante */}
                      <div className="border border-gray-200 rounded-xl p-3 sm:p-4 text-center hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
                        <div className="bg-gray-500 p-2 rounded-lg w-fit mx-auto mb-2">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h5 className="font-medium text-gray-800 text-xs sm:text-sm mb-1">Con comprobante</h5>
                        <p className="text-xs text-gray-600 mb-2 leading-tight">Únicamente con comprobantes</p>
                        <div className="bg-white/80 rounded-lg p-1.5 border border-gray-200">
                          <p className="text-xs text-gray-600">Elementos activos</p>
                        </div>
                      </div>

                      {/* Solo sin comprobante */}
                      <div className="border border-gray-200 rounded-xl p-3 sm:p-4 text-center hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer">
                        <div className="bg-gray-500 p-2 rounded-lg w-fit mx-auto mb-2">
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h5 className="font-medium text-gray-800 text-xs sm:text-sm mb-1">Sin comprobante</h5>
                        <p className="text-xs text-gray-600 mb-2 leading-tight">Únicamente sin comprobantes</p>
                        <div className="bg-white/80 rounded-lg p-1.5 border border-gray-200">
                          <p className="text-xs text-gray-600">Elementos pendientes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de formato de exportación */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <div className="bg-gray-100 p-1.5 rounded-lg">
                        <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      </div>
                      <h4 className="font-medium text-gray-700 text-sm sm:text-base">Seleccionar formato de exportación</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {/* PDF */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:bg-gray-100/50 transition-all cursor-pointer group"
                           onClick={() => { exportToPDF(); setShowExportModal(false); }}>
                        <div className="bg-gray-600 p-2 sm:p-3 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-gray-700 transition-colors">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 text-center mb-1 text-sm sm:text-base">PDF</h5>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium text-center mb-2 leading-tight">Documento PDF profesional</p>
                        <div className="bg-white/80 border border-gray-200 rounded-lg p-2 mb-2 sm:mb-3">
                          <p className="text-xs text-gray-600 text-center leading-tight">Ideal para impresión y presentaciones oficiales</p>
                        </div>
                        <button className="w-full bg-gray-600 text-white py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Exportar PDF</span>
                        </button>
                      </div>

                      {/* Excel */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:bg-gray-100/50 transition-all cursor-pointer group"
                           onClick={() => { exportToExcel(); setShowExportModal(false); }}>
                        <div className="bg-gray-600 p-2 sm:p-3 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-gray-700 transition-colors">
                          <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 text-center mb-1 text-sm sm:text-base">Excel</h5>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium text-center mb-2 leading-tight">Hoja de cálculo editable</p>
                        <div className="bg-white/80 border border-gray-200 rounded-lg p-2 mb-2 sm:mb-3">
                          <p className="text-xs text-gray-600 text-center leading-tight">Perfecto para análisis de datos y reportes</p>
                        </div>
                        <button className="w-full bg-gray-600 text-white py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                          <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Exportar Excel</span>
                        </button>
                      </div>

                      {/* CSV */}
                      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 hover:bg-gray-100/50 transition-all cursor-pointer group"
                           onClick={() => { exportToCSV(); setShowExportModal(false); }}>
                        <div className="bg-gray-600 p-2 sm:p-3 rounded-lg w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-gray-700 transition-colors">
                          <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 text-center mb-1 text-sm sm:text-base">CSV</h5>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium text-center mb-2 leading-tight">Valores separados por comas</p>
                        <div className="bg-white/80 border border-gray-200 rounded-lg p-2 mb-2 sm:mb-3">
                          <p className="text-xs text-gray-600 text-center leading-tight">Compatible con cualquier sistema o software</p>
                        </div>
                        <button className="w-full bg-gray-600 text-white py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Exportar CSV</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer con información */}
                  <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                      <span className="font-medium">Se exportarán {pagosFiltrados.length} registros</span>
                      {searchTerm && <span className="text-gray-500 block sm:inline"> • Filtrado por: &ldquo;{searchTerm}&rdquo;</span>}
                      {filtroEstado !== 'todos' && (
                        <span className="text-gray-500 block sm:inline">
                          • {filtroEstado === 'con_comprobante' ? 'Con comprobante' : 'Sin comprobante'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}