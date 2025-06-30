'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function NuevaSolicitudPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    departamento: '',
    monto: '',
    cuenta_destino: '',
    concepto: '',
    tipo_pago: 'transferencia',
    fecha_limite_pago: '',
    factura_file: null as File | null,
    soporte_file: null as File | null,
  });

  const departamentoOptions = [
    'Recursos Humanos',
    'Tecnología', 
    'Finanzas',
    'Marketing',
    'Operaciones',
    'Legal'
  ];

  const tipoPagoOptions = [
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'efectivo', label: 'Efectivo' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'factura_file' | 'soporte_file') => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.departamento || !formData.monto || !formData.cuenta_destino || !formData.concepto || !formData.fecha_limite_pago) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      if (!formData.factura_file) {
        toast.error('Por favor adjunta la factura');
        return;
      }

      // Crear FormData para envío con archivos
      const submitData = new FormData();
      submitData.append('departamento', formData.departamento);
      submitData.append('monto', formData.monto);
      submitData.append('cuenta_destino', formData.cuenta_destino);
      submitData.append('concepto', formData.concepto);
      submitData.append('tipo_pago', formData.tipo_pago);
      submitData.append('fecha_limite_pago', formData.fecha_limite_pago);
      
      if (formData.factura_file) {
        submitData.append('factura', formData.factura_file);
      }
      if (formData.soporte_file) {
        submitData.append('soporte', formData.soporte_file);
      }

      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      if (response.ok) {
        toast.success('Solicitud creada exitosamente');
        router.push('/dashboard/solicitante/mis-solicitudes');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al crear la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <div className="min-h-screen font-sans" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-6 py-3 rounded-xl font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div className="h-8 w-px bg-white/30"></div>
                <div>
                  <h1 className="text-xl font-bold text-white">Nueva Solicitud de Pago</h1>
                  <p className="text-white/80 text-sm">Crear una nueva solicitud</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 rounded-full bg-white/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Solicitud de Pago</h2>
                <p className="text-white/80">Completa todos los campos para crear tu solicitud</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    <option value="" className="text-gray-900">Seleccionar departamento</option>
                    {departamentoOptions.map(dept => (
                      <option key={dept} value={dept} className="text-gray-900">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Monto *
                  </label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Cuenta Destino *
                  </label>
                  <input
                    type="text"
                    name="cuenta_destino"
                    value={formData.cuenta_destino}
                    onChange={handleInputChange}
                    placeholder="Número de cuenta"
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Tipo de Pago
                  </label>
                  <select
                    name="tipo_pago"
                    value={formData.tipo_pago}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  >
                    {tipoPagoOptions.map(tipo => (
                      <option key={tipo.value} value={tipo.value} className="text-gray-900">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha Límite de Pago *
                  </label>
                  <input
                    type="date"
                    name="fecha_limite_pago"
                    value={formData.fecha_limite_pago}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Concepto *
                </label>
                <textarea
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleInputChange}
                  placeholder="Describe el concepto del pago..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none"
                />
              </div>

              {/* Archivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Factura * (PDF, JPG, PNG)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'factura_file')}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40"
                  />
                  {formData.factura_file && (
                    <p className="text-white/80 text-sm mt-1">
                      Archivo: {formData.factura_file.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Soporte Adicional (Opcional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'soporte_file')}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40"
                  />
                  {formData.soporte_file && (
                    <p className="text-white/80 text-sm mt-1">
                      Archivo: {formData.soporte_file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 px-6 py-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-blue-600 hover:bg-white/90 px-6 py-3 font-medium"
                >
                  {loading ? 'Creando...' : 'Crear Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
