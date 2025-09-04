import React, { useState } from 'react';
import { X, FileText, Table, Database, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onExportPDF: (filter: 'todos' | 'activo' | 'inactivo') => void;
  onExportExcel: (filter: 'todos' | 'activo' | 'inactivo') => void;
  onExportCSV: (filter: 'todos' | 'activo' | 'inactivo') => void;
  isLoading?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  isLoading = false,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  if (!isOpen) return null;

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
      onClick: () => onExportPDF(selectedFilter)
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
      onClick: () => onExportExcel(selectedFilter)
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
      onClick: () => onExportCSV(selectedFilter)
    }
  ];

  const filterOptions = [
    { 
      value: 'todos' as const, 
      label: 'Todos los registros', 
      description: 'Incluye todos los elementos disponibles',
      icon: '📋'
    },
    { 
      value: 'activo' as const, 
      label: 'Solo activos', 
      description: 'Únicamente elementos activos',
      icon: '✅'
    },
    { 
      value: 'inactivo' as const, 
      label: 'Solo inactivos', 
      description: 'Únicamente elementos inactivos',
      icon: '❌'
    }
  ];

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{title}</h3>
                  {description && (
                    <p className="text-slate-200 mt-1 text-sm">{description}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-8">
            {/* Filter Selection Section */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                Seleccionar datos a exportar
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    disabled={isLoading}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${selectedFilter === option.value 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{option.label}</span>
                          {selectedFilter === option.value && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Export Format Selection */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-500">📁</span>
                Seleccionar formato de exportación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {exportOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      {/* Card Header */}
                      <div className={`${option.bgColor} p-5`}>
                        <div className="flex items-center gap-4">
                          <div className={`${option.iconBg} text-white p-3 rounded-xl shadow-md`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h5 className={`font-bold text-lg ${option.textColor}`}>
                              {option.name}
                            </h5>
                            <p className={`text-sm ${option.subtextColor} mt-1`}>
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-5">
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                          {option.detail}
                        </p>
                        
                        <Button
                          onClick={option.onClick}
                          disabled={isLoading}
                          className={`
                            w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200
                            ${option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                              option.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                              'bg-orange-600 hover:bg-orange-700 text-white'}
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md transform hover:-translate-y-0.5'}
                          `}
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Exportando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Download className="w-4 h-4" />
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
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-blue-500">ℹ️</span>
                <span>Los archivos exportados incluirán toda la información disponible según el filtro seleccionado</span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={isLoading}
                  className="px-6 py-2"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
