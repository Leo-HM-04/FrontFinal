import React, { useState } from 'react';
import { X, FileText, Table, Database, Download, Check, Loader2, BarChart3, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportViaticoModalProps {
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

export const ExportViaticoModal: React.FC<ExportViaticoModalProps> = ({
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
      // Simular tiempo de descarga para mejor UX
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
    { 
      value: 'dia' as const, 
      label: 'Último día', 
      description: 'Viáticos del último día',
      icon: Calendar,
      count: 'Período: Último día'
    },
    { 
      value: 'semana' as const, 
      label: 'Última semana', 
      description: 'Viáticos de la última semana',
      icon: Calendar,
      count: 'Período: Última semana'
    },
    { 
      value: 'mes' as const, 
      label: 'Último mes', 
      description: 'Viáticos del último mes',
      icon: Calendar,
      count: 'Período: Último mes'
    },
    { 
      value: 'año' as const, 
      label: 'Último año', 
      description: 'Viáticos del último año',
      icon: Calendar,
      count: 'Período: Último año'
    },
    { 
      value: 'total' as const, 
      label: 'Todo el historial', 
      description: 'Todos los viáticos disponibles',
      icon: Calendar,
      count: 'Período: Todo el historial'
    }
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl transform transition-all animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Download className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{title}</h3>
                  <p className="text-slate-200 mt-1 text-sm">
                    Período seleccionado: <span className="font-semibold text-blue-200">{getPeriodLabel()}</span>
                  </p>
                  {description && (
                    <p className="text-slate-300 mt-1 text-xs">{description}</p>
                  )}
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
          
          {/* Content */}
          <div className="p-8">
            {/* Filter Selection Section */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Seleccionar período de exportación
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filterOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onPeriodChange(option.value)}
                      disabled={isLoading || downloadingFormat !== null}
                      className={`
                        relative p-5 rounded-xl border-2 transition-all duration-300 text-left overflow-hidden
                        ${selectedPeriod === option.value 
                          ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25 hover:shadow-md'
                        }
                        ${isLoading || downloadingFormat !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {/* Selection indicator */}
                      {selectedPeriod === option.value && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-blue-500 rounded-full p-1">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-xl transition-colors
                          ${selectedPeriod === option.value 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-base">
                            {option.label}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {option.description}
                          </p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                              {option.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-10"></div>

            {/* Export Format Selection */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">
                  Seleccionar formato de exportación
                </h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {exportOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isDownloading = downloadingFormat === option.id;
                  const isDisabled = isLoading || (downloadingFormat !== null && !isDownloading);
                  
                  return (
                    <div 
                      key={option.id} 
                      className={`
                        bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-all duration-300
                        ${isDownloading ? 'ring-2 ring-blue-400 shadow-xl transform scale-[1.02]' : option.borderColor}
                        ${!isDisabled ? 'hover:shadow-xl hover:transform hover:scale-[1.02]' : 'opacity-75'}
                      `}
                    >
                      {/* Card Header */}
                      <div className={`${option.bgColor} p-6 relative`}>
                        {isDownloading && (
                          <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex items-center justify-center">
                            <div className="bg-white rounded-full p-3 shadow-lg">
                              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className={`${option.iconBg} text-white p-4 rounded-xl shadow-lg`}>
                            <IconComponent className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <h5 className={`font-bold text-xl ${option.textColor}`}>
                              {option.name}
                            </h5>
                            <p className={`text-sm ${option.subtextColor} mt-1`}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-6">
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                          {option.detail}
                        </p>
                        
                        <Button
                          onClick={option.onClick}
                          disabled={isDisabled}
                          className={`
                            w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300
                            ${option.buttonColor} text-white shadow-md
                            ${!isDisabled ? 'hover:shadow-lg transform hover:-translate-y-1' : ''}
                            ${isDownloading ? 'bg-blue-500 hover:bg-blue-500' : ''}
                          `}
                        >
                          {isDownloading ? (
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Descargando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              <Download className="w-5 h-5" />
                              <span>Exportar {option.name}</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
                <span>Exportando viáticos del período: <strong>{getPeriodLabel()}</strong></span>
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
