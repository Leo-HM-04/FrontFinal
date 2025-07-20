'use client';

import React from 'react';
import { AlertTriangle,  } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName,
  loading = false 
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-200/60 backdrop-blur-[3px] animate-fade-in">
      <div className="bg-white/90 rounded-3xl shadow-2xl max-w-3xl w-full p-0 relative animate-fade-in border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/90 to-blue-400/80 px-10 py-4 flex items-center gap-4 mb-6 border-b border-blue-200 shadow">
          <div className="flex items-center justify-center bg-white rounded-full shadow-lg w-16 h-16">
            <AlertTriangle className="w-9 h-9 text-red-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow">{title}</h2>
            <p className="text-blue-100 text-sm mt-1">{message}</p>
          </div>
          <button
            className="absolute top-4 right-6 text-white/70 hover:text-white text-3xl font-bold transition"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-10 pb-6">
          {itemName && (
            <div className="bg-red-50/80 border border-red-100 p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-red-700 font-semibold">Elemento a eliminar:</p>
                <p className="text-sm font-bold text-red-900">{itemName}</p>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-red-100/80 to-white/80 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 font-semibold">
              Advertencia <span className="font-normal">Haz esto solo si estas completamente seguro!</span>
            </span>
          </div>
          <div className="flex justify-end space-x-3 mt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-red-400 text-red-700 hover:bg-red-50"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
