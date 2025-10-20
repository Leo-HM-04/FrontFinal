'use client';

import { useEffect, useState } from 'react';
import type { Solicitud, SolicitudEstado } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, FileSpreadsheet, Search, X } from 'lucide-react';
import { SubirFacturaModal } from '@/components/pagos/SubirFacturaModal';
import { VerComprobanteModal } from '@/components/pagos/VerComprobanteModal';
import type { Comprobante } from '@/components/pagos/VerComprobanteModal';
import { SolicitudesService } from '@/services/solicitudes.service';
import { subirComprobante } from '@/services/pagosService';
import { PlantillaTukashDetailModal } from '@/components/plantillas/PlantillaTukashDetailModal';
import { PlantillaN09TokaDetailModal } from '@/components/plantillas/PlantillaN09TokaDetailModal';
import { SolicitudDetailModal } from '@/components/solicitudes/SolicitudDetailModal';
import { isN09TokaSolicitud } from '@/utils/solicitudUtils';
import { SolicitudTukashData } from '@/types/plantillaTukash';
import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
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
      // 1. Solicitudes estándar
      const data = await SolicitudesService.getAutorizadasYPagadas(token);
      // 2. Solicitudes de plantillas pagadas
      const plantillas = await SolicitudesService.getAllUnified();
      const plantillasPagadas = plantillas.filter((p) => p.estado === 'pagada');
      // 3. Unir ambas listas y eliminar duplicados por id_solicitud
      const solicitudesCombinadas = [...data.filter((p) => p.estado === 'pagada' || p.estado === 'autorizada'), ...plantillasPagadas];
      const solicitudesUnicas = Object.values(
        solicitudesCombinadas.reduce((acc, solicitud) => {
          acc[solicitud.id_solicitud] = solicitud;
          return acc;
        }, {} as { [id: number]: Solicitud })
      );
      solicitudesUnicas.sort((a, b) => {
        const fechaA = new Date(a.fecha_pago || a.fecha_limite_pago || 0).getTime();
        const fechaB = new Date(b.fecha_pago || b.fecha_limite_pago || 0).getTime();
        return fechaB - fechaA;
      });
      setPagos(solicitudesUnicas);
      // Consultar comprobantes para cada solicitud pagada
      const comprobantesObj: { [id: number]: Comprobante | null } = {};
      await Promise.all(
        solicitudesUnicas.map(async (pago: Solicitud) => {
          if (pago.estado === 'pagada') {
            
            // Para TODAS las solicitudes (incluye TOKA): Buscar comprobantes reales de pago
            // Primero verificar si la solicitud tiene soporte_url (nuevo sistema)
            if (pago.soporte_url) {
              comprobantesObj[pago.id_solicitud] = {
                ruta_archivo: pago.soporte_url,
                nombre_archivo: 'Comprobante de pago',
                fecha_subida: pago.fecha_actualizacion || pago.fecha_pago
              };
            } else {
              // Verificar si es solicitud TOKA antes de buscar comprobantes
              try {
                // Detectar si es solicitud TOKA
                const isTokaResponse = await fetch(`/api/solicitudes-n09-toka/por-solicitud/${pago.id_solicitud}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (isTokaResponse.ok) {
                  const tokaData = await isTokaResponse.json();
                  if (tokaData.success && tokaData.data) {
                    console.log(`🎯 Solicitud ${pago.id_solicitud} es TOKA - buscando comprobantes específicos`);
                    // Es TOKA - buscar en su tabla específica
                    const { default: SolicitudN09TokaArchivosService } = await import('@/services/solicitudN09TokaArchivos.service');
                    const archivos = await SolicitudN09TokaArchivosService.obtenerArchivos(tokaData.data.id_solicitud_n09_toka);
                    
                    const comprobante = archivos.find(archivo => 
                      archivo.tipo_archivo === 'comprobante_pago' || 
                      archivo.nombre_archivo.toLowerCase().includes('comprobante')
                    );
                    
                    if (comprobante) {
                      comprobantesObj[pago.id_solicitud] = {
                        ruta_archivo: comprobante.ruta_archivo,
                        nombre_archivo: comprobante.nombre_archivo,
                        fecha_subida: comprobante.fecha_subida
                      };
                    }
                    return; // Salir temprano, ya procesamos TOKA
                  }
                }
                
                // No es TOKA - usar método estándar
                console.log(`📝 Solicitud ${pago.id_solicitud} es estándar - buscando comprobantes normales`);
                const comprobantes = await ComprobantesService.getBySolicitud(pago.id_solicitud, token);
                if (comprobantes && comprobantes.length > 0) {
                  comprobantesObj[pago.id_solicitud] = comprobantes[0];
                }
              } catch (error) {
                console.error(`Error obteniendo comprobantes para solicitud ${pago.id_solicitud}:`, error);
              }
            }
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
    } catch  {
  // console.error('Error al exportar PDF:', error);
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
    } catch {
  // console.error('Error al exportar a Excel:', error);
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

  // Función para detectar si una solicitud es TUKASH
  function isTukashSolicitud(solicitud: Solicitud): boolean {
    if (solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        return plantillaData.templateType === 'tarjetas-tukash' || plantillaData.isTukash === true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // Función para mapear Solicitud a SolicitudTukashData
  function mapSolicitudToTukashData(solicitud: Solicitud): SolicitudTukashData {
    // Mapear estado: convertir 'autorizada' a 'aprobada' para compatibilidad
    const mapearEstadoTukash = (estado: SolicitudEstado): 'pendiente' | 'aprobada' | 'rechazada' | 'pagada' | undefined => {
      if (estado === 'autorizada') return 'aprobada';
      return estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
    };

    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      return {
        id_solicitud: solicitud.id_solicitud,
        folio: solicitud.folio || undefined,
        asunto: plantillaData?.asunto || 'TUKASH',
        cliente: plantillaData?.cliente || '',
        beneficiario_tarjeta: plantillaData?.beneficiario_tarjeta || '',
        numero_tarjeta: plantillaData?.numero_tarjeta || '',
        monto_total_cliente: plantillaData?.monto_total_cliente || solicitud.monto || 0,
        monto_total_tukash: plantillaData?.monto_total_tukash || 0,
        estado: mapearEstadoTukash(solicitud.estado),
        fecha_creacion: solicitud.fecha_creacion,
        usuario_creacion: '',
        usuario_actualizacion: '',
        // ✅ Agregado: Incluir soporte_url desde la solicitud original
        soporte_url: (solicitud as Solicitud & { soporte_url?: string }).soporte_url,
      };
    } catch {
      return {
        id_solicitud: solicitud.id_solicitud,
        folio: solicitud.folio || undefined,
        asunto: 'TUKASH',
        cliente: '',
        beneficiario_tarjeta: '',
        numero_tarjeta: '',
        monto_total_cliente: solicitud.monto || 0,
        monto_total_tukash: 0,
        estado: mapearEstadoTukash(solicitud.estado),
        fecha_creacion: solicitud.fecha_creacion,
        usuario_creacion: '',
        usuario_actualizacion: '',
        // ✅ Agregado: Incluir soporte_url desde la solicitud original
        soporte_url: (solicitud as Solicitud & { soporte_url?: string }).soporte_url,
      };
    }
  }

  // Función para mapear Solicitud a SolicitudN09TokaData
  function mapSolicitudToN09TokaData(solicitud: Solicitud): SolicitudN09TokaData {
    // Mapear estado: convertir 'autorizada' a 'aprobada' para compatibilidad
    const mapearEstado = (estado: SolicitudEstado): 'pendiente' | 'aprobada' | 'rechazada' | 'pagada' | undefined => {
      if (estado === 'autorizada') return 'aprobada';
      return estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada';
    };

    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      return {
        id_solicitud: solicitud.id_solicitud,
        monto: solicitud.monto,
        estado: mapearEstado(solicitud.estado),
        fecha_creacion: solicitud.fecha_creacion,
        usuario_creacion: '',
        usuario_actualizacion: '',
        ...plantillaData,
      };
    } catch {
      return {
        id_solicitud: solicitud.id_solicitud,
        monto: solicitud.monto,
        estado: mapearEstado(solicitud.estado),
        fecha_creacion: solicitud.fecha_creacion,
        usuario_creacion: '',
        usuario_actualizacion: '',
        // Valores por defecto requeridos para SolicitudN09TokaData
        asunto: 'PAGO_PROVEEDOR_N09',
        cliente: '',
        beneficiario: '',
        tipo_cuenta_clabe: 'CLABE',
        numero_cuenta_clabe: '',
        banco_destino: '',
        tipo_moneda: 'MXN',
      };
    }
  }

  // Función para renderizar el modal correcto según plantilla
  function renderPlantillaModal() {
    if (!showDetailModal || !selectedPago) return null;
    
    console.log('🔍 SUBIR-COMPROBANTE - Detectando tipo para solicitud:', selectedPago.id_solicitud);
    console.log('📄 SUBIR-COMPROBANTE - Datos plantilla:', selectedPago.plantilla_datos);
    
    // Detectar N09/TOKA primero
    const isN09Toka = isN09TokaSolicitud(selectedPago);
    console.log('🔍 SUBIR-COMPROBANTE - ¿Es N09/TOKA?:', isN09Toka);
    
    if (isN09Toka) {
      console.log('✅ SUBIR-COMPROBANTE - Mostrando modal N09/TOKA');
      return (
        <PlantillaN09TokaDetailModal
          solicitud={mapSolicitudToN09TokaData(selectedPago)}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      );
    }
    
    // Detectar TUKASH
    const isTukash = isTukashSolicitud(selectedPago);
    console.log('🔍 SUBIR-COMPROBANTE - ¿Es TUKASH?:', isTukash);
    
    if (isTukash) {
      console.log('✅ SUBIR-COMPROBANTE - Mostrando modal TUKASH');
      return (
        <PlantillaTukashDetailModal
          solicitud={mapSolicitudToTukashData(selectedPago)}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      );
    }
    
    // Para solicitudes estándar
    console.log('✅ SUBIR-COMPROBANTE - Mostrando modal estándar');
    return (
      <SolicitudDetailModal
        solicitud={selectedPago}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        userRole="pagador"
      />
    );
  }

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
            <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
              {/* Título y estadísticas */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="bg-white/20 p-2 lg:p-3 rounded-xl">
                    <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Subir Comprobante</h1>
                    <p className="text-blue-100 text-sm lg:text-base">Gestión de comprobantes de pago</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center border border-white/20">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white break-words">{pagosFiltrados.length}</p>
                    <p className="text-blue-100 text-xs sm:text-sm">Total</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center border border-white/20">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-300 break-words">
                      {pagosFiltrados.filter(p => comprobantes[p.id_solicitud]).length}
                    </p>
                    <p className="text-blue-100 text-xs sm:text-sm">Con Comprobante</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center border border-white/20">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-300 break-words">
                      {pagosFiltrados.filter(p => !comprobantes[p.id_solicitud]).length}
                    </p>
                    <p className="text-blue-100 text-xs sm:text-sm">Sin Comprobante</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 text-center border border-white/20 col-span-2 lg:col-span-1">
                    <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-blue-200 leading-tight break-words overflow-hidden">
                      {formatCurrency(pagosFiltrados.reduce((sum, p) => sum + (Number(p.monto) || 0), 0))}
                    </p>
                    <p className="text-blue-100 text-xs sm:text-sm">Total Monto</p>
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
                    <option value="CONTABILIDAD" className="text-gray-800">CONTABILIDAD</option>
                    <option value="FACTURACIÓN" className="text-gray-800">FACTURACIÓN</option>
                    <option value="COBRANZA" className="text-gray-800">COBRANZA</option>
                    <option value="VINCULACIÓN" className="text-gray-800">VINCULACIÓN</option>
                    <option value="ADMINISTRACIÓN" className="text-gray-800">ADMINISTRACIÓN</option>
                    <option value="TI" className="text-gray-800">TI</option>
                    <option value="AUTOMATIZACIONES" className="text-gray-800">AUTOMATIZACIONES</option>
                    <option value="COMERCIAL" className="text-gray-800">COMERCIAL</option>
                    <option value="ATENCIÓN A CLIENTES" className="text-gray-800">ATENCIÓN A CLIENTES</option>
                    <option value="TESORERÍA" className="text-gray-800">TESORERÍA</option>
                    <option value="NÓMINA" className="text-gray-800">NÓMINA</option>
                    <option value="ATRACCIÓN DE TALENTO" className="text-gray-800">ATRACCIÓN DE TALENTO</option>
                    <option value="DIRECCIÓN GENERAL" className="text-gray-800">DIRECCIÓN GENERAL</option>
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
                {renderPlantillaModal()}
              {/* Modal para subir factura */}
              <SubirFacturaModal
                open={modalOpen}
                solicitudId={solicitudIdFactura}
                onClose={() => setModalOpen(false)}
                onSubmit={async (file, id) => {
                  try {
                    if (!id) throw new Error('No hay id de solicitud');
                    console.log(`🎯 Usando pagosService.subirComprobante para solicitud ${id}`);
                    
                    // 🔧 USAR EL NUEVO SERVICIO QUE MANEJA TOKA
                    await subirComprobante(id, file);
                    
                    await fetchPagosYComprobantes(); // Recargar datos tras subir comprobante
                    setSuccessMsg('¡Comprobante subido exitosamente!');
                  } catch (error) {
                    console.error('❌ Error en SubirFacturaModal:', error);
                    const errorMsg = error instanceof Error ? error.message : 'Error desconocido al subir comprobante';
                    setError(errorMsg);
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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 p-0 sm:p-4 sm:flex sm:items-center sm:justify-center">
              <div className="bg-white/95 backdrop-blur-md shadow-xl w-full h-full sm:max-w-2xl sm:w-full sm:max-h-[90vh] sm:h-auto overflow-y-auto transform animate-in slide-in-from-bottom-4 duration-300 border-0 sm:border sm:border-gray-200/50 sm:rounded-2xl">
                {/* Header del modal */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 border-b border-gray-200/50 sticky top-0 z-10 sm:rounded-t-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-gray-500/20 p-2 rounded-lg flex-shrink-0 hidden sm:block">
                        <Download className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl font-semibold text-gray-800 leading-tight">Exportar Comprobantes</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-tight">Selecciona el formato deseado</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-white/80">
                  {/* Sección de selección de datos */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gray-100 p-1 rounded-lg">
                        <Download className="w-3 h-3 text-gray-600" />
                      </div>
                      <h4 className="font-medium text-gray-700 text-sm">Datos a exportar</h4>
                    </div>
                    
                    <div className="space-y-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
                      {/* Todos los registros */}
                      <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 hover:bg-gray-100/50 transition-all sm:block sm:text-center">
                        <div className="bg-gray-400 p-2 rounded-lg flex-shrink-0 sm:w-fit sm:mx-auto sm:mb-2">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <h5 className="font-medium text-gray-800 text-sm mb-1">Todos los registros</h5>
                          <p className="text-xs text-gray-600 leading-tight sm:mb-2">Incluye todos los elementos</p>
                          <div className="bg-white/80 rounded p-1 border border-gray-200 mt-2 sm:mt-0 hidden sm:block">
                            <p className="text-xs text-gray-500">Todos los elementos</p>
                          </div>
                        </div>
                      </div>

                      {/* Solo con comprobante */}
                      <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer sm:block sm:text-center">
                        <div className="bg-gray-500 p-2 rounded-lg flex-shrink-0 sm:w-fit sm:mx-auto sm:mb-2">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <h5 className="font-medium text-gray-800 text-sm mb-1">Con comprobante</h5>
                          <p className="text-xs text-gray-600 leading-tight sm:mb-2">Con comprobantes</p>
                          <div className="bg-white/80 rounded p-1 border border-gray-200 mt-2 sm:mt-0 hidden sm:block">
                            <p className="text-xs text-gray-600">Elementos activos</p>
                          </div>
                        </div>
                      </div>

                      {/* Solo sin comprobante */}
                      <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer sm:block sm:text-center">
                        <div className="bg-gray-500 p-2 rounded-lg flex-shrink-0 sm:w-fit sm:mx-auto sm:mb-2">
                          <X className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <h5 className="font-medium text-gray-800 text-sm mb-1">Sin comprobante</h5>
                          <p className="text-xs text-gray-600 leading-tight sm:mb-2">Sin comprobantes</p>
                          <div className="bg-white/80 rounded p-1 border border-gray-200 mt-2 sm:mt-0 hidden sm:block">
                            <p className="text-xs text-gray-600">Elementos pendientes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de formato de exportación */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gray-100 p-1 rounded-lg">
                        <FileSpreadsheet className="w-3 h-3 text-gray-600" />
                      </div>
                      <h4 className="font-medium text-gray-700 text-sm">Formato de exportación</h4>
                    </div>
                    
                    <div className="space-y-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
                      {/* PDF */}
                      <button 
                        onClick={() => { exportToPDF(); setShowExportModal(false); }}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-100/50 transition-all group text-left sm:text-center">
                        <div className="flex items-center gap-3 sm:block">
                          <div className="bg-gray-600 p-2 rounded-lg flex-shrink-0 group-hover:bg-gray-700 transition-colors sm:w-fit sm:mx-auto sm:mb-2">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 sm:flex-none">
                            <h5 className="font-semibold text-gray-800 text-sm mb-1">PDF</h5>
                            <p className="text-xs text-gray-600 leading-tight">Documento profesional</p>
                          </div>
                        </div>
                      </button>

                      {/* Excel */}
                      <button 
                        onClick={() => { exportToExcel(); setShowExportModal(false); }}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-100/50 transition-all group text-left sm:text-center">
                        <div className="flex items-center gap-3 sm:block">
                          <div className="bg-gray-600 p-2 rounded-lg flex-shrink-0 group-hover:bg-gray-700 transition-colors sm:w-fit sm:mx-auto sm:mb-2">
                            <FileSpreadsheet className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 sm:flex-none">
                            <h5 className="font-semibold text-gray-800 text-sm mb-1">Excel</h5>
                            <p className="text-xs text-gray-600 leading-tight">Hoja de cálculo</p>
                          </div>
                        </div>
                      </button>

                      {/* CSV */}
                      <button 
                        onClick={() => { exportToCSV(); setShowExportModal(false); }}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-100/50 transition-all group text-left sm:text-center">
                        <div className="flex items-center gap-3 sm:block">
                          <div className="bg-gray-600 p-2 rounded-lg flex-shrink-0 group-hover:bg-gray-700 transition-colors sm:w-fit sm:mx-auto sm:mb-2">
                            <Download className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 sm:flex-none">
                            <h5 className="font-semibold text-gray-800 text-sm mb-1">CSV</h5>
                            <p className="text-xs text-gray-600 leading-tight">Valores separados</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Footer con información */}
                  <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 leading-tight">
                      <span className="font-medium">{pagosFiltrados.length} registros</span>
                      {searchTerm && <span className="text-gray-500 block sm:inline"> • Filtrado: &ldquo;{searchTerm}&rdquo;</span>}
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