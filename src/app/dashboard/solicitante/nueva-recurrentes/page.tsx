'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Building, DollarSign, CreditCard, Calendar, MessageSquare, Repeat } from 'lucide-react';
import { RecurrentesService } from '@/services/recurrentes.service';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';

// Estado inicial
type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  frecuencia: string;
  siguiente_fecha: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
};

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: '',
  frecuencia: '',
  siguiente_fecha: '',
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: ''
};

type FormAction = { type: 'SET_FIELD'; field: keyof FormState; value: string };
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

const tipoPagoOptions = [
  { value: 'viaticos', label: 'Viáticos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'factura', label: 'Factura' },
  { value: 'nominas', label: 'Nóminas' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'administrativos', label: 'Administrativos' }
];

const departamentos = [
  'contabilidad', 'facturacion', 'cobranza', 'vinculacion',
  'administracion', 'ti', 'automatizaciones', 'comercial',
  'atencion a clientes', 'tesoreria', 'nomina'
];

const frecuencias = ['diaria', 'semanal', 'quincenal', 'mensual'];

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
    // Reset tipo_tarjeta si cambia tipo_cuenta_destino
    if (name === 'tipo_cuenta_destino' && value === 'CLABE') {
      dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta', value: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requiredFields = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'tipo_pago', 'frecuencia', 'siguiente_fecha', 'tipo_cuenta_destino'] as const;
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Campo obligatorio faltante: ${field}`);
        setLoading(false);
        return;
      }
    }
    // Validación dinámica de cuenta destino
    const cuenta = formData.cuenta_destino.replace(/[^0-9]/g, '');
    if (formData.tipo_cuenta_destino === 'CLABE' && cuenta.length !== 18) {
      toast.error('La cuenta CLABE debe tener exactamente 18 dígitos.');
      setLoading(false);
      return;
    }
    if (formData.tipo_cuenta_destino === 'Tarjeta' && cuenta.length !== 16) {
      toast.error('La tarjeta debe tener exactamente 16 dígitos.');
      setLoading(false);
      return;
    }

    try {
      // Convertir formData a FormData si el backend espera FormData
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value);
      });
      const response = await RecurrentesService.crearRecurrente(fd);
      let successMsg = 'Plantilla recurrente creada exitosamente';
      if (response && typeof response === 'object' && 'message' in response && typeof (response as { message?: string }).message === 'string') {
        successMsg = (response as { message: string }).message;
      }
      toast.success(successMsg);
      router.push('/dashboard/solicitante/mis-recurrentes');
    } catch (error: unknown) {
      console.error('Error:', error);
      let errorMsg = 'Error al crear plantilla recurrente';
      if (typeof error === 'object' && error !== null) {
        const errObj = error as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="w-full px-0 py-12 md:py-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-8 mb-12 border border-white/20 w-full text-left">
            <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Nueva Plantilla Recurrente</h1>
            <p className="text-white/80 text-lg">Completa el formulario para crear una nueva plantilla</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-10 w-full text-left">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full items-start">
                {/* Columna Izquierda */}
                <div className="flex-1 space-y-8 w-full md:max-w-[600px]">
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <CreditCard className="inline w-4 h-4 mr-2" />
                      Tipo de Cuenta Destino *
                    </label>
                    <select
                      name="tipo_cuenta_destino"
                      value={formData.tipo_cuenta_destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    >
                      <option value="CLABE" className="text-black">CLABE</option>
                      <option value="Tarjeta" className="text-black">Tarjeta</option>
                    </select>
                  </div>
                  {formData.tipo_cuenta_destino === 'Tarjeta' && (
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">Tipo de Tarjeta *</label>
                      <select
                        name="tipo_tarjeta"
                        value={formData.tipo_tarjeta}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="" className="text-black">Selecciona tipo</option>
                        <option value="Débito" className="text-black">Débito</option>
                        <option value="Crédito" className="text-black">Crédito</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <Building className="inline w-4 h-4 mr-2" />
                      Departamento *
                    </label>
                    <select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    >
                      <option value="">Selecciona departamento</option>
                      {departamentos.map(dep => (
                        <option key={dep} value={dep} className="text-black">
                          {dep.charAt(0).toUpperCase() + dep.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <DollarSign className="inline w-4 h-4 mr-2" />
                      Monto *
                    </label>
                    <NumericFormat
                      value={formData.monto}
                      name="monto"
                      thousandSeparator="," 
                      decimalSeparator="."
                      decimalScale={2}
                      fixedDecimalScale
                      allowNegative={false}
                      placeholder="0.00"
                      onValueChange={({ value }) => dispatch({ type: 'SET_FIELD', field: 'monto', value })}
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <CreditCard className="inline w-4 h-4 mr-2" />
                      Cuenta Destino *
                    </label>
                    <input
                      type="text"
                      name="cuenta_destino"
                      value={formData.cuenta_destino}
                      onChange={e => {
                        let value = e.target.value.replace(/[^0-9]/g, '');
                        const maxLen = formData.tipo_cuenta_destino === 'Tarjeta' ? 16 : 18;
                        value = value.slice(0, maxLen);
                        dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value });
                      }}
                      required
                      maxLength={formData.tipo_cuenta_destino === 'Tarjeta' ? 16 : 18}
                      inputMode="numeric"
                      autoComplete="off"
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      placeholder={formData.tipo_cuenta_destino === 'Tarjeta' ? 'Número de tarjeta (16 dígitos)' : 'Número de cuenta CLABE (18 dígitos)'}
                    />
                  </div>
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <MessageSquare className="inline w-4 h-4 mr-2" />
                      Concepto *
                    </label>
                    <textarea
                      name="concepto"
                      value={formData.concepto}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      placeholder="Describe el motivo del pago..."
                    />
                  </div>
                </div>
                {/* Columna Derecha */}
                <div className="flex-1 space-y-8 w-full md:max-w-[600px]">
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      Tipo de Pago *
                    </label>
                    <select
                      name="tipo_pago"
                      value={formData.tipo_pago}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    >
                      <option value="">Selecciona tipo de pago</option>
                      {tipoPagoOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-black">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <Repeat className="inline w-4 h-4 mr-2" />
                      Frecuencia *
                    </label>
                    <select
                      name="frecuencia"
                      value={formData.frecuencia}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    >
                      <option value="">Selecciona frecuencia</option>
                      {frecuencias.map(f => (
                        <option key={f} value={f} className="text-black">
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/90 block mb-3 font-medium">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Fecha de Inicio *
                    </label>
                    <DatePicker
                      selected={fechaInicio}
                      onChange={(date: Date | null) => {
                        setFechaInicio(date);
                        dispatch({
                          type: 'SET_FIELD',
                          field: 'siguiente_fecha',
                          value: date ? date.toISOString().split('T')[0] : ''
                        });
                      }}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      placeholderText="Selecciona la fecha"
                      locale={es}
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-8 pt-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-8 py-4 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 text-base"
                >
                  {loading ? 'Guardando...' : 'Crear Plantilla'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}