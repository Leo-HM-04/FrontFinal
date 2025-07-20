

import React from 'react';
import { X, ExternalLink, DollarSign, Building, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Solicitud } from '@/types';

interface SolicitudDetailModalProps {
  solicitud: Solicitud | null;
  isOpen: boolean;
  onClose: () => void;
  showActions?: boolean;
  userRole?: string;
}

export function SolicitudDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: SolicitudDetailModalProps) {


  if (!isOpen || !solicitud) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      autorizada: 'bg-green-100 text-green-800 border-green-200',
      rechazada: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo degradado oscuro/transparente */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-blue-900/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up border border-blue-200">
        {/* Botón de cerrar (X) flotante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-400 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Solicitud #{solicitud.id_solicitud}
              </h2>
              <p className="text-blue-100 mt-1">
                Creada el {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(solicitud.estado)}`}> 
              {solicitud.estado.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="p-6">
          {/* Información Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4 bg-white/80 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-700" />
                Información Financiera
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-blue-700/70">Monto:</span>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(solicitud.monto)}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Cuenta Destino:</span>
                  <p className="font-mono text-blue-900">{solicitud.cuenta_destino}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Fecha Límite:</span>
                  <p className="text-blue-900">{new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white/80 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-700" />
                Información Organizacional
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-blue-700/70">Departamento:</span>
                  <p className="text-blue-900">{solicitud.departamento}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Solicitante:</span>
                  <p className="text-blue-900">{solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}</p>
                </div>
                {solicitud.aprobador_nombre && (
                  <div>
                    <span className="text-sm text-blue-700/70">Aprobado por:</span>
                    <p className="text-blue-900">{solicitud.aprobador_nombre}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          {/* Concepto */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-700" />
              Concepto
            </h3>
            <p className="text-blue-900 leading-relaxed">{solicitud.concepto}</p>
          </Card>
          {/* Documentos */}
          <Card className="p-4 mb-6 bg-white/90 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-blue-700" />
              Documentos Adjuntos
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
                  const facturaUrl = solicitud.factura_url.startsWith('http')
                    ? solicitud.factura_url
                    : backendBase + solicitud.factura_url;
                  window.open(facturaUrl, '_blank');
                }}
                className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Factura</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              {solicitud.soporte_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(solicitud.soporte_url, '_blank')}
                  className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Soporte</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
