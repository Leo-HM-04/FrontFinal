'use client';

import { Button } from '@/components/ui/Button';
import { PagoProcesado } from '@/utils/exportUtils';
import { FileText, Download, Printer, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { descargarComprobante } from '@/services/pagos.service';

interface ComprobanteViewModalProps {
  isOpen: boolean;
  pago: PagoProcesado | null;
  onClose: () => void;
}

export function ComprobanteViewModal({ isOpen, pago, onClose }: ComprobanteViewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
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
        className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl m-4 z-[10000] animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button 
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 transition-colors" 
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="text-center mb-6">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800" id="modal-title">Comprobante de Pago</h2>
          <p className="text-gray-500">ID: {pago.comprobante_id}</p>
        </div>
        
        {/* Contenido del comprobante */}
        <div className="border-2 border-blue-100 rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 uppercase">BECHAPRA</h3>
            <p className="text-gray-500">Comprobante Oficial de Pago</p>
          </div>
          
          <table className="w-full mb-6">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Comprobante :</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.comprobante_id}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Fecha de Pago:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{formatDate(pago.fecha_pago)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">ID Solicitud:</td>
                <td className="py-2 font-medium text-gray-800 text-right">#{pago.id_solicitud}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Solicitante:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.solicitante}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Departamento:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.departamento}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Concepto:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.concepto}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Banco Destino:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.banco_destino}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Cuenta Destino:</td>
                <td className="py-2 font-medium text-gray-800 text-right">{pago.cuenta_destino}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 text-gray-500">Método de Pago:</td>
                <td className="py-2 font-medium text-gray-800 text-right">
                  {pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1)}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Monto:</td>
                <td className="py-2 font-bold text-xl text-green-700 text-right">{formatCurrency(pago.monto)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="border-t-2 border-dotted border-gray-200 pt-6 mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">Este documento certifica que el pago ha sido procesado correctamente.</p>
            <p className="font-bold text-gray-700">¡GRACIAS!</p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button 
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            onClick={async () => {
              try {
                setIsDownloading(true);
                // Usamos el servicio para descargar el comprobante
                const resultado = await descargarComprobante(pago);
                
                if (resultado) {
                  toast.success('Comprobante descargado correctamente');
                } else {
                  // Si el servicio falla, intentamos con el método alternativo
                  const nombreArchivo = `comprobante_${pago.comprobante_id}_${Date.now()}`;
                  
                  // Simular un click para descargar
                  const link = document.createElement('a');
                  link.href = `/api/comprobantes/${pago.comprobante_id}`;
                  link.setAttribute("download", `${nombreArchivo}.pdf`);
                  
                  // Esta es la clave: guardar el PDF en una nueva ventana
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  toast.success('Comprobante descargado correctamente');
                }
              } catch (error) {
                console.error('Error al generar el PDF:', error);
                toast.error('Error al descargar el comprobante');
              } finally {
                setIsDownloading(false);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
