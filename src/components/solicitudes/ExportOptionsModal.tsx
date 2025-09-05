'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, X, Loader2, Filter, BarChart3, Database } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  itemCount?: number;
}

export function ExportOptionsModal({ isOpen, onClose, onExport, itemCount = 0 }: ExportOptionsModalProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [selectedDataFilter, setSelectedDataFilter] = useState('todos');
  
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
                  <h2 className="text-xl font-bold">Exportar Mis Solicitudes</h2>
                  <p className="text-slate-200 text-sm">
                    Selecciona el formato y filtro deseado para exportar tus solicitudes
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
            {/* Seleccionar datos a exportar */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Seleccionar datos a exportar
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Todos los registros */}
                <div
                  onClick={() => setSelectedDataFilter('todos')}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${selectedDataFilter === 'todos' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
                  {selectedDataFilter === 'todos' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="bg-blue-500/20 p-3 rounded-lg mb-4 w-fit">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Todos los registros</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Incluye todos los elementos disponibles
                    </p>
                    <p className="text-xs text-gray-500">Todos los elementos</p>
                  </div>
                </div>

                {/* Solo activos */}
                <div
                  onClick={() => setSelectedDataFilter('activos')}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${selectedDataFilter === 'activos' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                    }
                  `}
                >
                  {selectedDataFilter === 'activos' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="bg-green-500/20 p-3 rounded-lg mb-4 w-fit">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Solo activos</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Únicamente elementos activos
                    </p>
                    <p className="text-xs text-gray-500">Elementos activos</p>
                  </div>
                </div>

                {/* Solo inactivos */}
                <div
                  onClick={() => setSelectedDataFilter('inactivos')}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${selectedDataFilter === 'inactivos' 
                      ? 'border-gray-500 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-400'
                    }
                  `}
                >
                  {selectedDataFilter === 'inactivos' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div className="bg-gray-500/20 p-3 rounded-lg mb-4 w-fit">
                      <Database className="w-6 h-6 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Solo inactivos</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Únicamente elementos inactivos
                    </p>
                    <p className="text-xs text-gray-500">Elementos inactivos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seleccionar formato de exportación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Seleccionar formato de exportación
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PDF */}
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-start mb-4">
                    <div className="bg-blue-500/20 p-3 rounded-lg mr-4">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">PDF</h4>
                      <p className="text-sm text-gray-600 mb-4">
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all duration-200">
                  <div className="flex items-start mb-4">
                    <div className="bg-green-500/20 p-3 rounded-lg mr-4">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Excel</h4>
                      <p className="text-sm text-gray-600 mb-4">
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-all duration-200">
                  <div className="flex items-start mb-4">
                    <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                      <Database className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">CSV</h4>
                      <p className="text-sm text-gray-600 mb-4">
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
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
