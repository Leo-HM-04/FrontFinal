import React, { useState } from 'react';
import { X, FileText, Table, Database, Download, Check, Loader2, BarChart3, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportRecurrenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onExportPDF: (filter: 'todos' | 'activo' | 'inactivo', period: string) => void;
  onExportExcel: (filter: 'todos' | 'activo' | 'inactivo', period: string) => void;
  onExportCSV: (filter: 'todos' | 'activo' | 'inactivo', period: string) => void;
  isLoading?: boolean;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const ExportRecurrenteModal: React.FC<ExportRecurrenteModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  isLoading = false,
  selectedPeriod,
  onPeriodChange,
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: 'pdf' | 'excel' | 'csv', exportFn: () => void) => {
    setDownloadingFormat(format);
    try {
      exportFn();
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 2000);
    } catch {
      setDownloadingFormat(null);
    }
  };

  const exportOptions = [
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Documento PDF profesional',
      detail: 'Ideal para impresión y presentaciones oficiales',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-900',
      subtextColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-300 hover:bg-blue-25',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => handleExport('pdf', () => onExportPDF('todos', selectedPeriod))
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Hoja de cálculo editable',
      detail: 'Perfecto para análisis de datos y reportes',
      icon: Table,
      color: 'green',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
      textColor: 'text-green-900',
      subtextColor: 'text-green-700',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-300 hover:bg-green-25',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      onClick: () => handleExport('excel', () => onExportExcel('todos', selectedPeriod))
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Valores separados por comas',
      detail: 'Compatible con cualquier sistema o software',
      icon: Database,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-900',
      subtextColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-300 hover:bg-orange-25',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => handleExport('csv', () => onExportCSV('todos', selectedPeriod))
    }
  ];

  const filterOptions = [
    { value: 'dia', label: 'Último día', description: 'Recurrentes del último día', icon: Calendar, count: 'Período: Último día' },
    { value: 'semana', label: 'Última semana', description: 'Recurrentes de la última semana', icon: Calendar, count: 'Período: Última semana' },
    { value: 'mes', label: 'Último mes', description: 'Recurrentes del último mes', icon: Calendar, count: 'Período: Último mes' },
    { value: 'año', label: 'Último año', description: 'Recurrentes del último año', icon: Calendar, count: 'Período: Último año' },
    { value: 'total', label: 'Todo el historial', description: 'Todos los recurrentes disponibles', icon: Calendar, count: 'Período: Todo el historial' }
  ];

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'dia': return 'Último día';
      case 'semana': return 'Última semana';
      case 'mes': return 'Último mes';
      case 'año': return 'Último año';
      case 'total': return 'Todo el historial';
      default: return 'Período seleccionado';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]" 
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Download className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{title}</h3>
                  <p className="text-slate-200 mt-1 text-sm">
                    {description}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/20 transition-all duration-200"
                disabled={isLoading || downloadingFormat !== null}
              >
                <X size={22} />
              </button>
            </div>
          </div>
          {/* Controles de exportación */}
          <div className="p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-md">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-blue-900 text-sm font-medium">Exportar como:</span>
                  <select
                    value={downloadingFormat || exportOptions[0].id}
                    onChange={e => {
                      setDownloadingFormat(e.target.value);
                    }}
                    className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-2 border-l border-blue-100">
                  <span className="text-blue-900 text-sm font-medium">Período:</span>
                  <select
                    value={selectedPeriod}
                    onChange={e => onPeriodChange(e.target.value)}
                    className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-all"
                  >
                    <option value="dia">Último día</option>
                    <option value="semana">Última semana</option>
                    <option value="mes">Último mes</option>
                    <option value="año">Último año</option>
                    <option value="total">Todo el historial</option>
                  </select>
                </div>
                <Button
                  onClick={() => {
                    if (downloadingFormat === 'pdf') {
                      onExportPDF('todos', selectedPeriod);
                    } else if (downloadingFormat === 'excel') {
                      onExportExcel('todos', selectedPeriod);
                    } else if (downloadingFormat === 'csv') {
                      onExportCSV('todos', selectedPeriod);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg inline-flex items-center gap-2 transition-all duration-200 border border-blue-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span>Exportando recurrentes del período: <strong>{getPeriodLabel()}</strong></span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={isLoading || downloadingFormat !== null}
                  className="px-8 py-2.5 font-medium"
                >
                  {downloadingFormat ? 'Descargando...' : 'Cancelar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
