'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  itemCount?: number;
}

export function ExportOptionsModal({ isOpen, onClose, onExport, itemCount = 0 }: ExportOptionsModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setDownloadingFormat(format);
    try {
      onExport(format);
      // Simular tiempo de descarga para mejor UX
      setTimeout(() => {
        setDownloadingFormat(null);
        onClose();
      }, 2000);
    } catch {
      setDownloadingFormat(null);
    }
  };

  const exportOptions = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Formato más compatible',
      icon: FileText,
      bgColor: 'bg-green-500/20',
      iconColor: 'text-green-400',
      onClick: () => handleExport('csv')
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Formato para hojas de cálculo',
      icon: FileSpreadsheet,
      bgColor: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      onClick: () => handleExport('excel')
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Con marca de agua',
      icon: FileText,
      bgColor: 'bg-red-500/20',
      iconColor: 'text-red-400',
      onClick: () => handleExport('pdf')
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Exportar Solicitudes</h2>
                <p className="text-blue-100">
                  Selecciona el formato para exportar {itemCount} solicitudes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Export Options */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Download className="w-5 h-5 mr-2 text-blue-600" />
                Formatos de exportación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isDownloading = downloadingFormat === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      onClick={isDownloading ? undefined : option.onClick}
                      className={`
                        relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group
                        ${isDownloading 
                          ? 'border-blue-300 bg-blue-50 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`${option.bgColor} p-4 rounded-full mb-4 transition-transform group-hover:scale-110`}>
                          {isDownloading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          ) : (
                            <IconComponent className={`w-8 h-8 ${option.iconColor}`} />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {option.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isDownloading ? 'Generando archivo...' : option.description}
                        </p>
                      </div>
                      
                      {isDownloading && (
                        <div className="absolute inset-0 bg-blue-50/80 rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-blue-600 font-medium">Descargando...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Se exportarán {itemCount} solicitudes en el formato seleccionado
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-2"
              disabled={downloadingFormat !== null}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
