'use client';

import { useEffect, useState } from 'react';
import type { Solicitud } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Eye } from 'lucide-react';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import { toast } from 'react-hot-toast';

export default function HistorialPagosPage() {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
  const [pagos, setPagos] = useState<Solicitud[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<'todas' | 'pagada' | 'autorizada'>('todas');
  const [departamentoFiltro, setDepartamentoFiltro] = useState<string>('todos');
  const [pagina, setPagina] = useState(1);
  const pagosPorPagina = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para exportación
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) throw new Error('No hay token de autenticación');
        const { SolicitudesService } = await import('@/services/solicitudes.service');
        const data = await SolicitudesService.getAutorizadasYPagadas(token);
        // Ordenar por fecha_pago (pagada) o fecha_limite_pago (autorizada), de más reciente a más antigua
        const pagosFiltrados = data.filter((p) => p.estado === 'pagada' || p.estado === 'autorizada');
        pagosFiltrados.sort((a, b) => {
          // Usar fecha_pago si existe, si no usar fecha_limite_pago
          const fechaA = new Date(a.fecha_pago || a.fecha_limite_pago || 0).getTime();
          const fechaB = new Date(b.fecha_pago || b.fecha_limite_pago || 0).getTime();
          return fechaB - fechaA; // Más reciente primero
        });
        setPagos(pagosFiltrados);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchPagos();
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
      day: '2-digit',
      timeZone: 'America/Mexico_City'
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Mexico_City'
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
        'ID', 'Solicitante', 'Beneficiario', 'Departamento', 'Monto', 
        'Cuenta Destino', 'Concepto', 'Estado', 'Fecha de Solicitud', 'Hora de Solicitud'
      ];
      
      const csvContent = [
        headers.join(','),
        ...pagosFiltrados.map(pago => {
          const dateTime = formatDateTime(pago.fecha_creacion);
          return [
            pago.id_solicitud,
            `"${(pago.usuario_nombre || pago.nombre_usuario || '-').replace(/"/g, '""')}"`,
            `"${(pago.nombre_persona || '-').replace(/"/g, '""')}"`,
            `"${(pago.departamento || '-').replace(/"/g, '""')}"`,
            pago.monto,
            `"${pago.cuenta_destino.replace(/"/g, '""')}"`,
            `"${pago.concepto.replace(/"/g, '""')}"`,
            pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
            `"${dateTime.date}"`,
            `"${dateTime.time}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_pagos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Archivo CSV descargado exitosamente');
    } catch {
  // console.error('Error al exportar CSV:', error);
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
      doc.text('Historial de Pagos', 20, 20);
      
      // Información adicional
      doc.setFontSize(10);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 20, 30);
      doc.text(`Total de registros: ${pagosFiltrados.length}`, 20, 35);
      
      // Preparar datos para la tabla
      const tableData = pagosFiltrados.map(pago => {
        const dateTime = formatDateTime(pago.fecha_creacion);
        return [
          pago.id_solicitud.toString(),
          pago.usuario_nombre || pago.nombre_usuario || '-',
          pago.nombre_persona || '-',
          pago.departamento || '-',
          formatCurrency(pago.monto),
          pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
          `${dateTime.date} ${dateTime.time}`
        ];
      });

      // Crear tabla
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (doc as any).autoTable({
        head: [['ID', 'Solicitante', 'Beneficiario', 'Depto', 'Monto', 'Estado', 'Fecha/Hora']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      doc.save(`historial_pagos_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Archivo PDF descargado exitosamente');
    } catch {
  // console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historial de Pagos');
      
      // Título
      worksheet.mergeCells('A1:J1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Historial de Pagos';
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center' };
      
      // Información adicional
      worksheet.getCell('A2').value = `Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`;
      worksheet.getCell('A3').value = `Total de registros: ${pagosFiltrados.length}`;
      
      // Encabezados
      const headers = ['ID', 'Solicitante', 'Beneficiario', 'Departamento', 'Monto', 'Cuenta Destino', 'Concepto', 'Estado', 'Fecha Solicitud', 'Hora Solicitud'];
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
        const row = worksheet.getRow(6 + index);
        row.values = [
          pago.id_solicitud,
          pago.usuario_nombre || pago.nombre_usuario || '-',
          pago.nombre_persona || '-',
          pago.departamento || '-',
          pago.monto,
          pago.cuenta_destino,
          pago.concepto,
          pago.estado === 'pagada' ? 'Pagada' : 'Autorizada',
          dateTime.date,
          dateTime.time
        ];
      });
      
      // Ajustar anchos de columna
      worksheet.columns = [
        { width: 8 }, { width: 20 }, { width: 20 }, { width: 15 },
        { width: 12 }, { width: 20 }, { width: 30 }, { width: 12 },
        { width: 12 }, { width: 10 }
      ];
      
      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Archivo Excel descargado exitosamente');
    } catch {
  // console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  // Filtrar los pagos según el estado seleccionado
  // Filtrar por estado y departamento
  const pagosFiltradosPorEstado = estadoFiltro === 'todas'
    ? pagos
    : pagos.filter((p) => p.estado === estadoFiltro);
  let pagosFiltrados = departamentoFiltro === 'todos'
    ? pagosFiltradosPorEstado
    : pagosFiltradosPorEstado.filter((p) => p.departamento === departamentoFiltro);

  // Aplicar ordenamiento
  if (sortField) {
    pagosFiltrados = [...pagosFiltrados].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valueA: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let valueB: any;

      switch (sortField) {
        case 'id':
          valueA = a.id_solicitud;
          valueB = b.id_solicitud;
          break;
        case 'solicitante':
          valueA = (a.usuario_nombre || a.nombre_usuario || '').toLowerCase();
          valueB = (b.usuario_nombre || b.nombre_usuario || '').toLowerCase();
          break;
        case 'beneficiario':
          valueA = (a.nombre_persona || '').toLowerCase();
          valueB = (b.nombre_persona || '').toLowerCase();
          break;
        case 'departamento':
          valueA = (a.departamento || '').toLowerCase();
          valueB = (b.departamento || '').toLowerCase();
          break;
        case 'monto':
          valueA = a.monto;
          valueB = b.monto;
          break;
        case 'concepto':
          valueA = a.concepto.toLowerCase();
          valueB = b.concepto.toLowerCase();
          break;
        case 'estado':
          valueA = a.estado;
          valueB = b.estado;
          break;
        case 'fecha_creacion':
          valueA = new Date(a.fecha_creacion || 0).getTime();
          valueB = new Date(b.fecha_creacion || 0).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginado
  const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);
  const pagosPaginados = pagosFiltrados.slice((pagina - 1) * pagosPorPagina, pagina * pagosPorPagina);

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Historial de Pagos</h1>
              <p className="text-blue-100 text-sm">
                Consulta el historial completo de pagos autorizados y procesados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <p className="text-white/90 text-sm font-medium">
                  Total: <span className="text-white font-semibold">{pagos.length}</span> pagos
                </p>
              </div>
              <Button
                onClick={() => setShowExportModal(true)}
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 focus:ring-white/50"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros mejorados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtro Estado */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Filtrar por estado</label>
              <div className="relative">
                <select
                  value={estadoFiltro}
                  onChange={e => { 
                    setEstadoFiltro(e.target.value as 'todas' | 'pagada' | 'autorizada'); 
                    setPagina(1); 
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todas">Todas</option>
                  <option value="pagada">Pagadas</option>
                  <option value="autorizada">Autorizadas</option>
                </select>
              </div>
            </div>
            {/* Filtro Departamento */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Filtrar por departamento</label>
              <div className="relative">
                <select
                  value={departamentoFiltro}
                  onChange={e => { setDepartamentoFiltro(e.target.value); setPagina(1); }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="todos">Todos</option>
                  {[...new Set(pagosFiltradosPorEstado.map(p => p.departamento).filter(Boolean))].map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
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
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead style={{backgroundColor: '#F0F4FC'}}>
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center gap-1">
                            ID
                            {getSortIcon('id')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('solicitante')}
                        >
                          <div className="flex items-center gap-1">
                            Solicitante
                            {getSortIcon('solicitante')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('beneficiario')}
                        >
                          <div className="flex items-center gap-1">
                            Beneficiario
                            {getSortIcon('beneficiario')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('departamento')}
                        >
                          <div className="flex items-center gap-1">
                            Departamento
                            {getSortIcon('departamento')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('monto')}
                        >
                          <div className="flex items-center gap-1">
                            Monto
                            {getSortIcon('monto')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Cuenta Destino</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('concepto')}
                        >
                          <div className="flex items-center gap-1">
                            Concepto
                            {getSortIcon('concepto')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('fecha_creacion')}
                        >
                          <div className="flex items-center gap-1">
                            Fecha Solicitud
                            {getSortIcon('fecha_creacion')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Hora Solicitud</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleSort('estado')}
                        >
                          <div className="flex items-center gap-1">
                            Estado
                            {getSortIcon('estado')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-blue-700 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagosPaginados.map((pago) => (
                        <tr
                          key={pago.id_solicitud}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{pago.id_solicitud}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.usuario_nombre || pago.nombre_usuario || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pago.nombre_persona || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {pago.departamento || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(pago.monto)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={pago.cuenta_destino}>
                              {pago.cuenta_destino}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={pago.concepto}>
                              {pago.concepto}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(pago.fecha_creacion).date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(pago.fecha_creacion).time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              pago.estado === 'pagada' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {pago.estado === 'pagada' ? 'Pagada' : 'Autorizada'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-2 focus:ring-blue-300"
                              onClick={() => { 
                                setSelectedPago(pago); 
                                setShowDetailModal(true); 
                              }}
                              type="button"
                            >
                              <Eye className="w-4 h-4 mr-1" /> 
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Paginador con mejor diseño */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((pagina - 1) * pagosPorPagina) + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagina * pagosPorPagina, pagosFiltrados.length)}
                    </span> de{' '}
                    <span className="font-medium">{pagosFiltrados.length}</span> resultados
                  </div>
                  <Pagination
                    currentPage={pagina}
                    totalPages={totalPaginas}
                    totalItems={pagosFiltrados.length}
                    itemsPerPage={pagosPorPagina}
                    onPageChange={setPagina}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {/* Modal de detalle */}
        <PagoDetailModal
          isOpen={showDetailModal}
          pago={selectedPago}
          onClose={() => setShowDetailModal(false)}
        />

        {/* Modal de Exportación */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-white relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Exportar Mis Solicitudes</h2>
                    <p className="text-blue-100 text-sm mt-1">Selecciona el formato y filtro deseado para exportar tus solicitudes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8">
                {/* Sección Filtros */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Seleccionar datos a exportar</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Todos los registros */}
                    <div className="relative group">
                      <input
                        type="radio"
                        id="todos"
                        name="filtro"
                        className="sr-only"
                        defaultChecked
                      />
                      <label
                        htmlFor="todos"
                        className="block p-6 border-2 border-blue-200 bg-blue-50 rounded-2xl cursor-pointer hover:border-blue-300 transition-all group-hover:shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">Todos los registros</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Incluye todos los elementos disponibles</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-4 text-xs text-blue-700 font-medium">Todos los elementos</div>
                      </label>
                    </div>

                    {/* Solo pagadas */}
                    <div className="relative group">
                      <input
                        type="radio"
                        id="pagadas"
                        name="filtro"
                        className="sr-only"
                      />
                      <label
                        htmlFor="pagadas"
                        className="block p-6 border-2 border-gray-200 bg-white rounded-2xl cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all group-hover:shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">Solo pagadas</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Únicamente elementos completados</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white"></div>
                        </div>
                        <div className="mt-4 text-xs text-green-700 font-medium">Elementos completados</div>
                      </label>
                    </div>

                    {/* Solo autorizadas */}
                    <div className="relative group">
                      <input
                        type="radio"
                        id="autorizadas"
                        name="filtro"
                        className="sr-only"
                      />
                      <label
                        htmlFor="autorizadas"
                        className="block p-6 border-2 border-gray-200 bg-white rounded-2xl cursor-pointer hover:border-yellow-300 hover:bg-yellow-50 transition-all group-hover:shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">Solo autorizadas</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Únicamente elementos pendientes</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white"></div>
                        </div>
                        <div className="mt-4 text-xs text-yellow-700 font-medium">Elementos pendientes</div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sección Formatos */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Seleccionar formato de exportación</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PDF */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-red-800 mb-1">PDF</h4>
                          <p className="text-sm text-red-600 font-medium">Documento PDF profesional</p>
                        </div>
                      </div>
                      <p className="text-sm text-red-700 mb-6 leading-relaxed">
                        Ideal para impresión y presentaciones oficiales
                      </p>
                      <button
                        onClick={() => {
                          exportToPDF();
                          setShowExportModal(false);
                        }}
                        className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar PDF
                      </button>
                    </div>

                    {/* Excel */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-green-800 mb-1">Excel</h4>
                          <p className="text-sm text-green-600 font-medium">Hoja de cálculo editable</p>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 mb-6 leading-relaxed">
                        Perfecto para análisis de datos y reportes
                      </p>
                      <button
                        onClick={() => {
                          exportToExcel();
                          setShowExportModal(false);
                        }}
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar Excel
                      </button>
                    </div>

                    {/* CSV */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-orange-800 mb-1">CSV</h4>
                          <p className="text-sm text-orange-600 font-medium">Valores separados por comas</p>
                        </div>
                      </div>
                      <p className="text-sm text-orange-700 mb-6 leading-relaxed">
                        Compatible con cualquier sistema o software
                      </p>
                      <button
                        onClick={() => {
                          exportToCSV();
                          setShowExportModal(false);
                        }}
                        className="w-full bg-orange-600 text-white font-semibold py-3 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PagadorLayout>
    </ProtectedRoute>
  );
}