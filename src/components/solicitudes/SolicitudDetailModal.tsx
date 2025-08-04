

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
                Folio: <span className="font-mono text-yellow-200">{solicitud.folio || '-'}</span>
              </p>
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
                  <span className="text-sm text-blue-700/70">Descripción del tipo de pago:</span>
                  <p className="text-blue-900">{solicitud.tipo_pago_descripcion || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Empresa a pagar:</span>
                  <p className="text-blue-900">{solicitud.empresa_a_pagar || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Nombre de la persona que recibe el pago:</span>
                  <p className="text-blue-900">{solicitud.nombre_persona || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Cuenta destino:</span>
                  <p className="font-mono text-blue-900">{solicitud.cuenta_destino}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Tipo de cuenta/tarjeta:</span>
                  <p className="text-blue-900">
                    {solicitud.tipo_cuenta_destino === 'Tarjeta'
                      ? `Tarjeta${solicitud.tipo_tarjeta ? ' - ' + solicitud.tipo_tarjeta : ''}`
                      : solicitud.tipo_cuenta_destino || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Banco destino:</span>
                  <p className="text-blue-900">{solicitud.banco_destino || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-blue-700/70">Fecha límite:</span>
                  <p className="text-blue-900">{
                    solicitud.fecha_limite_pago
                      ? new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '-'
                  }</p>
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
                  <p className="text-blue-900">{solicitud.departamento ? solicitud.departamento.charAt(0).toUpperCase() + solicitud.departamento.slice(1) : '-'}</p>
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
            <div className="flex flex-col gap-4">
              {/* Previsualización de factura */}
              {solicitud.factura_url && (() => {
                const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
                const facturaUrl = solicitud.factura_url.startsWith('http')
                  ? solicitud.factura_url
                  : backendBase + solicitud.factura_url;
                const fileName = facturaUrl.split('/').pop();
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(facturaUrl);
                const isPdf = /\.pdf$/i.test(facturaUrl);
                if (isImage) {
                  return (
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-blue-700/70 mb-1">Previsualización de factura:</span>
                      <img src={facturaUrl} alt="Factura" className="max-h-48 rounded border border-blue-200 shadow" style={{objectFit: 'contain'}} />
                    </div>
                  );
                } else if (isPdf) {
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Previsualización de factura (PDF):</span>
                      <iframe src={facturaUrl} title="Factura PDF" className="w-full" style={{height: '300px', border: '1px solid #93c5fd', borderRadius: '8px'}} />
                    </div>
                  );
                } else {
                  // Otros formatos: solo mostrar nombre y botón para descargar
                  return (
                    <div className="flex flex-col items-start w-full">
                      <span className="text-sm text-blue-700/70 mb-1">Archivo adjunto:</span>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span className="text-blue-900 font-mono text-xs">{fileName}</span>
                        <span className="text-xs text-gray-500">(No se puede previsualizar, descarga para ver el contenido)</span>
                      </div>
                    </div>
                  );
                }
              })()}
              <div className="flex flex-wrap gap-3 mt-2">
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
