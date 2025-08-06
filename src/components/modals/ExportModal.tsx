import React from 'react';
import { X } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all animate-fade-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              {description && <p className="text-sm text-blue-100 mt-1">{description}</p>}
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-blue-700/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PDF Card */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 flex items-center gap-3">
                  <div className="bg-blue-700 text-white p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M9 15v-2h6v2"></path>
                      <path d="M12 19v-6"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Documento PDF</h4>
                    <p className="text-xs text-blue-700">Formato ideal para imprimir</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Exportar como documento PDF con formato profesional y tablas organizadas.</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => onExportPDF('todos')}
                      variant="primary"
                      disabled={isLoading}
                      className="w-full text-sm"
                    >
                      Todos los registros
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => onExportPDF('activo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Solo activos
                      </Button>
                      <Button
                        onClick={() => onExportPDF('inactivo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      >
                        Solo inactivos
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Excel Card */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 flex items-center gap-3">
                  <div className="bg-green-700 text-white p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M8 13H10"></path>
                      <path d="M8 17H16"></path>
                      <path d="M14 13H16"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900">Excel</h4>
                    <p className="text-xs text-green-700">Hoja de cálculo editable</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Exportar como archivo Excel con formato y fórmulas para análisis de datos.</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => onExportExcel('todos')}
                      variant="primary"
                      disabled={isLoading}
                      className="w-full text-sm bg-green-600 hover:bg-green-700"
                    >
                      Todos los registros
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => onExportExcel('activo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Solo activos
                      </Button>
                      <Button
                        onClick={() => onExportExcel('inactivo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      >
                        Solo inactivos
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CSV Card */}
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 flex items-center gap-3">
                  <div className="bg-amber-600 text-white p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900">CSV</h4>
                    <p className="text-xs text-amber-700">Compatible con cualquier sistema</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">Exportar como archivo CSV (valores separados por comas) para máxima compatibilidad.</p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => onExportCSV('todos')}
                      variant="primary"
                      disabled={isLoading}
                      className="w-full text-sm bg-amber-600 hover:bg-amber-700"
                    >
                      Todos los registros
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => onExportCSV('activo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Solo activos
                      </Button>
                      <Button
                        onClick={() => onExportCSV('inactivo')}
                        variant="outline"
                        disabled={isLoading}
                        className="text-sm bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      >
                        Solo inactivos
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Los archivos exportados contienen toda la información disponible en la tabla
            </p>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="text-sm"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
