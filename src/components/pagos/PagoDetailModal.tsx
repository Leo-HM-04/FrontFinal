'use client';

import { Button } from '@/components/ui/Button';
import type { Solicitud } from '@/types/index';
import { CreditCard, FileText, Clock, User, Building, Tag } from 'lucide-react';

interface PagoDetailModalProps {
  isOpen: boolean;
  pago: Solicitud | null;
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
            <p className="text-gray-500">ID: #{pago.id_solicitud}</p>
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
                <p className="font-medium text-gray-800">{pago.nombre_usuario || '-'}</p>
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
                <p className="text-sm text-gray-500">Fecha de creación:</p>
                <p className="font-medium text-gray-800">{formatDate(pago.fecha_creacion)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha límite de pago:</p>
                <p className="font-medium text-gray-800">{formatDate(pago.fecha_limite_pago)}</p>
              </div>
              {pago.fecha_revision && (
                <div>
                  <p className="text-sm text-gray-500">Fecha de revisión:</p>
                  <p className="font-medium text-gray-800">{formatDate(pago.fecha_revision)}</p>
                </div>
              )}
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
                <p className="text-sm text-gray-500">Tipo de pago:</p>
                <p className="font-medium text-gray-800">{pago.tipo_pago || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cuenta destino:</p>
                <p className="font-medium text-gray-800">{pago.cuenta_destino}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de Factura y Soporte */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Archivos Adjuntos
          </h3>
          <div className="flex flex-col gap-2">
            {pago.factura_url && (
              <div>
                <span className="font-medium">Factura: </span>
                <a href={`http://localhost:4000/uploads/facturas/${pago.factura_url.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver archivo</a>
              </div>
            )}
            {pago.soporte_url && (
              <div>
                <span className="font-medium">Soporte: </span>
                <a href={pago.soporte_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver archivo</a>
              </div>
            )}
          </div>
        </div>

        {/* Comentario del aprobador */}
        {pago.comentario_aprobador && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-100">
            <span className="font-medium text-yellow-800">Comentario del aprobador:</span>
            <span className="ml-2 text-yellow-900">{pago.comentario_aprobador}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6"
          >
            Cerrar
          </Button>
          {pago.estado === 'pagada' && !pago.soporte_url && (
            <a
              href={`/dashboard/pagador/pagos/subir-comprobante?id=${pago.id_solicitud}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" /> Subir Comprobante
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
