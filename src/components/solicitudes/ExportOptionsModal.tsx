'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, X, Loader2, BarChart3 } from 'lucide-react';

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

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Download className="w-6 h-6 mr-3" />
                <div>
                  <h2 className="text-xl font-bold">Exportar Solicitudes</h2>
                  <p className="text-slate-200 text-sm">
                    Selecciona el formato para exportar {itemCount} solicitudes
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Seleccionar formato de exportación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Seleccionar formato de exportación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PDF */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-200 bg-white">
                  <div className="flex items-start mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">PDF</h4>
                      <p className="text-sm text-gray-600">
                        Documento PDF profesional
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Ideal para impresión y presentaciones oficiales
                  </p>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={downloadingFormat === 'pdf'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {downloadingFormat === 'pdf' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </>
                    )}
                  </button>
                </div>

                {/* Excel */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all duration-200 bg-white">
                  <div className="flex items-start mb-4">
                    <div className="bg-green-100 p-3 rounded-lg mr-4">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">Excel</h4>
                      <p className="text-sm text-gray-600">
                        Hoja de cálculo editable
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Perfecto para análisis de datos y reportes
                  </p>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={downloadingFormat === 'excel'}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {downloadingFormat === 'excel' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando Excel...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Excel
                      </>
                    )}
                  </button>
                </div>

                {/* CSV */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-all duration-200 bg-white">
                  <div className="flex items-start mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <FileText className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">CSV</h4>
                      <p className="text-sm text-gray-600">
                        Valores separados por comas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Compatible con cualquier sistema o software
                  </p>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={downloadingFormat === 'csv'}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {downloadingFormat === 'csv' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando CSV...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
