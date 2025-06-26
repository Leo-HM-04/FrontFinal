import React from 'react';
import { X, ExternalLink, Calendar, DollarSign, Building, FileText, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Solicitud } from '@/types';

interface SolicitudDetailModalProps {
  solicitud: Solicitud | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: number, comentario?: string) => void;
  onReject?: (id: number, comentario?: string) => void;
  showActions?: boolean;
  userRole?: string;
}

export function SolicitudDetailModal({ 
  solicitud, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  showActions = false,
  userRole
}: SolicitudDetailModalProps) {
  const [comentario, setComentario] = React.useState('');

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Solicitud #{solicitud.id_solicitud}
              </h2>
              <p className="text-primary-blue-100 mt-1">
                Creada el {new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(solicitud.estado)}`}>
                {solicitud.estado.toUpperCase()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-white border-white hover:bg-white hover:text-primary-blue"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Información Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-blue" />
                Información Financiera
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Monto:</span>
                  <p className="text-2xl font-bold text-primary-blue">{formatCurrency(solicitud.monto)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cuenta Destino:</span>
                  <p className="font-mono text-gray-900">{solicitud.cuenta_destino}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Fecha Límite:</span>
                  <p className="text-gray-900">{new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
                <Building className="w-5 h-5 mr-2 text-secondary-blue" />
                Información Organizacional
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Departamento:</span>
                  <p className="text-gray-900">{solicitud.departamento}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Solicitante:</span>
                  <p className="text-gray-900">{solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}</p>
                </div>
                {solicitud.aprobador_nombre && (
                  <div>
                    <span className="text-sm text-gray-600">Aprobado por:</span>
                    <p className="text-gray-900">{solicitud.aprobador_nombre}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Concepto */}
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-blue" />
              Concepto
            </h3>
            <p className="text-gray-900 leading-relaxed">{solicitud.concepto}</p>
          </Card>

          {/* Documentos */}
          <Card className="p-4 mb-6">
            <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-secondary-blue" />
              Documentos Adjuntos
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(solicitud.factura_url, '_blank')}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Factura</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              {solicitud.soporte_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(solicitud.soporte_url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Soporte</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>

          {/* Comentarios del Aprobador */}
          {solicitud.comentario_aprobador && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-light-bg-50 to-light-bg-100">
              <h3 className="text-lg font-semibold text-primary-dark mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary-blue" />
                Comentario del Aprobador
              </h3>
              <p className="text-gray-900 italic">"{solicitud.comentario_aprobador}"</p>
              {solicitud.fecha_revision && (
                <p className="text-sm text-gray-500 mt-2">
                  Revisado el {new Date(solicitud.fecha_revision).toLocaleDateString('es-CO')}
                </p>
              )}
            </Card>
          )}

          {/* Acciones para Aprobadores */}
          {showActions && solicitud.estado === 'pendiente' && userRole === 'aprobador' && (
            <Card className="p-4 bg-gradient-to-r from-light-bg-50 to-primary-blue-50">
              <h3 className="text-lg font-semibold text-primary-dark mb-3">
                Acciones de Aprobación
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-primary-dark mb-2">
                  Comentario (Opcional)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="Agrega un comentario sobre tu decisión..."
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => onApprove?.(solicitud.id_solicitud, comentario)}
                >
                  <span>✓ Autorizar Solicitud</span>
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => onReject?.(solicitud.id_solicitud, comentario)}
                >
                  <span>✗ Rechazar Solicitud</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
