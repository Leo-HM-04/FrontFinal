'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare, CheckCircle } from 'lucide-react';
import { SolicitudesService, CreateSolicitudFormData } from '@/services/solicitudes.service';
import { toast } from 'react-hot-toast';

export default function NuevaSolicitudPage() {
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
    { value: 'transferencia', label: 'Transferencia' },
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
    
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de archivo no permitido. Solo se permiten archivos PDF, Excel, JPG y PNG.');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
    }
    
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

      // Preparar datos para el servicio
      const solicitudData: CreateSolicitudFormData = {
        departamento: formData.departamento,
        monto: formData.monto,
        cuenta_destino: formData.cuenta_destino,
        concepto: formData.concepto,
        tipo_pago: formData.tipo_pago,
        fecha_limite_pago: formData.fecha_limite_pago,
        factura: formData.factura_file,
        soporte: formData.soporte_file || undefined
      };

      const response = await SolicitudesService.createWithFiles(solicitudData);
      toast.success(response.message || 'Solicitud creada exitosamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
      
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la solicitud';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-4 py-2 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white font-montserrat">Nueva Solicitud de Pago</h1>
                  <p className="text-white/80">Completa el formulario para crear una nueva solicitud</p>
                </div>
              </div>
            </div>
          </div>
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
                    Factura * (PDF, Excel, JPG, PNG - Máx. 5MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'factura_file')}
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40"
                  />
                  {formData.factura_file && (
                    <div className="flex items-center mt-2 p-2 bg-white/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <p className="text-white/80 text-sm">
                        {formData.factura_file.name} ({(formData.factura_file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Soporte Adicional (PDF, Excel, JPG, PNG - Máx. 5MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'soporte_file')}
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40"
                  />
                  {formData.soporte_file && (
                    <div className="flex items-center mt-2 p-2 bg-white/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <p className="text-white/80 text-sm">
                        {formData.soporte_file.name} ({(formData.soporte_file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-6 py-3"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 shadow-lg border-0 px-6 py-3 font-medium"
                >
                  {loading ? 'Creando solicitud...' : 'Crear Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
