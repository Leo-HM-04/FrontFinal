'use client';

import React from 'react';
import { FileText, FileSpreadsheet, Download, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  itemCount?: number;
}

export function ExportOptionsModal({ isOpen, onClose, onExport, itemCount = 0 }: ExportOptionsModalProps) {
  if (!isOpen) return null;
  // Handle export click with format
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    onExport(format);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl max-w-md w-full animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Exportar Solicitudes</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-white/80 mb-6">
            Selecciona el formato para exportar {itemCount} solicitudes:
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {/* CSV Option */}
            <div 
              className="flex flex-col items-center bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-200"
              onClick={() => handleExport('csv')}
            >
              <div className="bg-green-500/20 p-3 rounded-full mb-3">
                <FileText className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="font-bold text-white mb-1">CSV</h4>
              <p className="text-xs text-center text-white/60">Formato más compatible</p>
            </div>
            
            {/* Excel Option */}
            <div 
              className="flex flex-col items-center bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-200"
              onClick={() => handleExport('excel')}
            >
              <div className="bg-blue-500/20 p-3 rounded-full mb-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="font-bold text-white mb-1">Excel</h4>
              <p className="text-xs text-center text-white/60">Formato para hojas de cálculo</p>
            </div>
            
            {/* PDF Option */}
            <div 
              className="flex flex-col items-center bg-white/5 hover:bg-white/10 rounded-xl p-6 cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-200"
              onClick={() => handleExport('pdf')}
            >
              <div className="bg-red-500/20 p-3 rounded-full mb-3">
                <FileText className="w-8 h-8 text-red-400" />
              </div>
              <h4 className="font-bold text-white mb-1">PDF</h4>
              <p className="text-xs text-center text-white/60">Con marca de agua</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/20 flex justify-between">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="text-white/80 border-white/20 hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={() => handleExport('csv')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar a CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
