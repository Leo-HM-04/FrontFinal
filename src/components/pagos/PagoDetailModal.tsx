'use client';

import { Button } from '@/components/ui/Button';
import { PagoProcesado } from '@/utils/exportUtils';
import { CreditCard, FileText, Calendar, Clock, User, Building, Landmark, Hash, Tag } from 'lucide-react';

interface PagoDetailModalProps {
  isOpen: boolean;
  pago: PagoProcesado | null;
  onClose: () => void;
}

export function PagoDetailModal({ isOpen, pago, onClose }: PagoDetailModalProps) {
  if (!isOpen || !pago) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-3xl m-4 z-[10000] animate-slide-up overflow-y-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button 
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition-colors" 
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 rounded-full bg-blue-100">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800" id="modal-title">Detalles del Pago</h2>
            <p className="text-gray-500">ID: #{pago.id_pago}</p>
          </div>
        </div>

        {/* Información de Estado */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
          <div className="flex justify-between">
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Estado:</span>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
            </span>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Información del Solicitante
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Solicitante:</p>
                <p className="font-medium text-gray-800">{pago.solicitante}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Departamento:</p>
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-blue-600 mr-1" />
                  <p className="font-medium text-gray-800">{pago.departamento}</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-3 pt-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Fechas
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Fecha de Aprobación:</p>
                <p className="font-medium text-gray-800">{formatDate(pago.fecha_aprobacion)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha de Pago:</p>
                <p className="font-medium text-gray-800">{formatDate(pago.fecha_pago)}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Información de Pago
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Monto:</p>
                <p className="font-bold text-xl text-green-700">{formatCurrency(pago.monto)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Concepto:</p>
                <p className="font-medium text-gray-800">{pago.concepto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Método de Pago:</p>
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 text-blue-600 mr-1" />
                  <p className="font-medium text-gray-800">{pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Banco Destino:</p>
                <div className="flex items-center">
                  <Landmark className="w-4 h-4 text-blue-600 mr-1" />
                  <p className="font-medium text-gray-800">{pago.banco_destino}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuenta Destino:</p>
                <p className="font-medium text-gray-800">{pago.cuenta_destino}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Comprobante */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Información del Comprobante
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ID de Comprobante:</p>
              <div className="flex items-center">
                <Hash className="w-4 h-4 text-blue-600 mr-1" />
                <p className="font-medium text-gray-800">{pago.comprobante_id}</p>
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(`/api/comprobantes/${pago.comprobante_id}`, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Comprobante
            </Button>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
          >
            Cerrar
          </Button>
          <Button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <FileText className="w-4 h-4 mr-2" />
            Imprimir Detalle
          </Button>
        </div>
      </div>
    </div>
  );
}
