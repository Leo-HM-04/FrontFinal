import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { FileText, FileSpreadsheet, FileDown, X } from 'lucide-react';

interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'excel' | 'csv', rango: string, estado?: string) => void;
}

export function ExportOptions({ isOpen, onClose, onExport }: ExportOptionsProps) {
  const [selectedRange, setSelectedRange] = useState('total');
  const [selectedState, setSelectedState] = useState('todos');

  const ranges = [
    { id: 'dia', label: 'Último día' },
    { id: 'semana', label: 'Última semana' },
    { id: 'mes', label: 'Último mes' },
    { id: 'año', label: 'Último año' },
    { id: 'total', label: 'Todo el historial' }
  ];

  const estados = [
    { id: 'todos', label: 'Todos los estados' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'autorizada', label: 'Autorizada' },
    { id: 'rechazada', label: 'Rechazada' },
    { id: 'procesada', label: 'Procesada' },
    { id: 'cancelada', label: 'Cancelada' },
    { id: 'revisada', label: 'Revisada' },
    { id: 'pagada', label: 'Pagada' },
    { id: 'vencida', label: 'Vencida' }
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    onExport(format, selectedRange, selectedState === 'todos' ? undefined : selectedState);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-2xl bg-white p-0 shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-lg font-semibold text-white flex items-center">
                <FileDown className="w-5 h-5 mr-2" />
                Opciones de Exportación
              </Dialog.Title>
              <button 
                onClick={onClose} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Selector de Rango */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Período a exportar
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ranges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedRange(range.id)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                        selectedRange === range.id
                          ? 'bg-blue-100 border-blue-500 text-blue-800 font-semibold shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Estado de solicitudes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {estados.map((estado) => (
                    <button
                      key={estado.id}
                      onClick={() => setSelectedState(estado.id)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                        selectedState === estado.id
                          ? 'bg-blue-100 border-blue-500 text-blue-800 font-semibold shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {estado.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de Exportación */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <Button
                  variant="primary"
                  onClick={() => handleExport('pdf')}
                  className="bg-red-600 text-white hover:bg-red-700 font-medium shadow-md transition-all"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleExport('excel')}
                  className="bg-green-600 text-white hover:bg-green-700 font-medium shadow-md transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleExport('csv')}
                  className="bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-md transition-all"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
