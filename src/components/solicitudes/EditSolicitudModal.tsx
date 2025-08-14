'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Building, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Solicitud } from '@/types';
import { toast } from 'react-hot-toast';
import { getCurrentUTC6Date, formatDateForDisplay } from '@/utils/dateUtils';

interface EditSolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: Solicitud | null;
  onSolicitudUpdated: (solicitud: Solicitud) => void;
}

interface EditSolicitudData {
  departamento: string;
  monto: number;
  cuenta_destino: string;
  factura_url: string;
  concepto: string;
  fecha_limite_pago: string;
  soporte_url?: string;
}

export function EditSolicitudModal({ isOpen, onClose, solicitud, onSolicitudUpdated }: EditSolicitudModalProps) {
  const [formData, setFormData] = useState<EditSolicitudData>({
    departamento: '',
    monto: 0,
    cuenta_destino: '',
    factura_url: '',
    concepto: '',
    fecha_limite_pago: '',
    soporte_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<EditSolicitudData>>({});

  useEffect(() => {
    if (solicitud) {
      setFormData({
        departamento: solicitud.departamento,
        monto: solicitud.monto,
        cuenta_destino: solicitud.cuenta_destino,
        factura_url: solicitud.factura_url,
        concepto: solicitud.concepto,
        fecha_limite_pago: solicitud.fecha_limite_pago.split('T')[0], // Formato YYYY-MM-DD
        soporte_url: solicitud.soporte_url || ''
      });
    }
  }, [solicitud]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
    if (errors[name as keyof EditSolicitudData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<EditSolicitudData> = {};

    if (!formData.departamento.trim()) {
      newErrors.departamento = 'El departamento es requerido';
    }

    if (!formData.cuenta_destino.trim()) {
      newErrors.cuenta_destino = 'La cuenta destino es requerida';
    }

    if (!formData.factura_url.trim()) {
      newErrors.factura_url = 'La URL de factura es requerida';
    }

    if (!formData.concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }

    if (!formData.fecha_limite_pago) {
      newErrors.fecha_limite_pago = 'La fecha límite es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitud || !validateForm()) return;

    if (solicitud.estado !== 'pendiente') {
      toast.error('Solo se pueden editar solicitudes pendientes');
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada al servicio para actualizar la solicitud
      // Como el backend no tiene endpoint de actualización, simulamos la respuesta
      const updatedSolicitud: Solicitud = {
        ...solicitud,
        ...formData,
        updated_at: getCurrentUTC6Date().toISOString()
      };
      
      onSolicitudUpdated(updatedSolicitud);
      toast.success('Solicitud actualizada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error updating solicitud:', error);
      toast.error('Error al actualizar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setErrors({});
  };

  if (!isOpen || !solicitud) return null;

  const canEdit = solicitud.estado === 'pendiente';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-blue to-secondary-blue text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Editar Solicitud #{solicitud.id_solicitud}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-white border-white hover:bg-white hover:text-primary-blue"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!canEdit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Nota:</strong> Esta solicitud ya no se puede editar porque su estado es &quot;{solicitud.estado}&quot;.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              error={errors.departamento}
              icon={<Building className="w-5 h-5 text-gray-400" />}
              placeholder="Ej: Recursos Humanos"
              disabled={!canEdit}
            />

            <Input
              label="Monto"
              name="monto"
              type="number"
              value={formData.monto}
              onChange={handleInputChange}
              min="1"
              icon={<DollarSign className="w-5 h-5 text-gray-400" />}
              placeholder="1000000"
              disabled={!canEdit}
            />
          </div>

          <Input
            label="Cuenta Destino"
            name="cuenta_destino"
            value={formData.cuenta_destino}
            onChange={handleInputChange}
            error={errors.cuenta_destino}
            placeholder="Número de cuenta"
            disabled={!canEdit}
          />

          <Input
            label="URL de Factura"
            name="factura_url"
            type="url"
            value={formData.factura_url}
            onChange={handleInputChange}
            error={errors.factura_url}
            placeholder="https://ejemplo.com/factura.pdf"
            disabled={!canEdit}
          />

          <Input
            label="Fecha Límite de Pago"
            name="fecha_limite_pago"
            type="date"
            value={formData.fecha_limite_pago}
            onChange={handleInputChange}
            error={errors.fecha_limite_pago}
            icon={<Calendar className="w-5 h-5 text-gray-400" />}
            disabled={!canEdit}
          />

          <div>
            <label className="block text-sm font-medium text-primary-dark mb-2">
              Concepto
            </label>
            <textarea
              name="concepto"
              value={formData.concepto}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                errors.concepto ? 'border-red-500' : ''
              } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Describe el concepto del pago..."
              disabled={!canEdit}
            />
            {errors.concepto && <p className="mt-1 text-sm text-red-600">{errors.concepto}</p>}
          </div>

          <Input
            label="URL de Soporte (Opcional)"
            name="soporte_url"
            type="url"
            value={formData.soporte_url}
            onChange={handleInputChange}
            placeholder="https://ejemplo.com/soporte.pdf"
            disabled={!canEdit}
          />

          {/* Estado actual */}
          <div className="bg-light-bg-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-primary-dark mb-2">Estado Actual</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                solicitud.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                solicitud.estado === 'autorizada' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {solicitud.estado.toUpperCase()}
              </span>
              <span className="text-gray-600">
                Creada: {formatDateForDisplay(solicitud.fecha_creacion)}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              {canEdit ? 'Cancelar' : 'Cerrar'}
            </Button>
            {canEdit && (
              <Button
                type="submit"
                loading={loading}
              >
                Actualizar Solicitud
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
