'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FileText, Building, DollarSign, CreditCard, Calendar, MessageSquare, Repeat } from 'lucide-react';
import { RecurrentesService } from '@/services/recurrentes.service';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';
import { formatDateForAPI } from '@/utils/dateUtils';

// Estado y tipos
type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_pago_descripcion: string;
  empresa_a_pagar: string;
  nombre_persona: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  frecuencia: string;
  siguiente_fecha: string;
  activo: boolean;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | boolean };

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: '',
  tipo_pago_descripcion: '',
  empresa_a_pagar: '',
  nombre_persona: '',
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: '',
  banco_destino: '',
  frecuencia: '',
  siguiente_fecha: '',
  activo: true,
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

const tipoPagoOptions = [
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
  'atencion a clientes', 'tesoreria', 'nomina', 'atraccion de talento',
  'direccion general'
];

const frecuencias = ['diario', 'semanal', 'quincenal', 'mensual'];

const bancoOptions = [
  "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
];

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);

  // Configuración dinámica para cuenta destino - SIN RESTRICCIONES DE LONGITUD
  let cuentaConfig;
  if (formData.tipo_cuenta_destino === 'Tarjeta') {
    cuentaConfig = {
      placeholder: 'Número de tarjeta',
      errorMsg: 'Ingresa un número de tarjeta válido.'
    };
  } else if (formData.tipo_cuenta_destino === 'Cuenta') {
    cuentaConfig = {
      placeholder: 'Número de cuenta',
      errorMsg: 'Ingresa un número de cuenta válido.'
    };
  } else {
    cuentaConfig = {
      placeholder: 'Número de cuenta CLABE',
      errorMsg: 'Ingresa un número de cuenta CLABE válido.'
    };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Type guard para asegurar que name es keyof FormState
    if (Object.prototype.hasOwnProperty.call(initialState, name)) {
      const field = name as keyof FormState;
      if (type === 'select-one') {
        dispatch({ type: 'SET_FIELD', field, value: String(value) });
      } else {
        dispatch({ type: 'SET_FIELD', field, value });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requiredFields = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'tipo_pago', 'frecuencia', 'siguiente_fecha', 'nombre_persona'] as (keyof FormState)[];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Campo obligatorio faltante: ${field}`);
        setLoading(false);
        return;
      }
    }
    
    // Validación de tipo tarjeta si es necesario
    if (formData.tipo_cuenta_destino === 'Tarjeta' && !formData.tipo_tarjeta) {
      toast.error('Tipo de tarjeta es obligatorio cuando seleccionas Tarjeta');
      setLoading(false);
      return;
    }
    
    if (!facturaFile) {
      toast.error('Debes subir el archivo de la factura');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'activo') {
          data.append(key, formData.activo ? '1' : '0');
        } else {
          data.append(key, String(value));
        }
      });
      data.append('fact_recurrente', facturaFile);

      const response = await RecurrentesService.crearRecurrente(data);
      let successMsg = 'Plantilla recurrente creada exitosamente';
      if (response && typeof response === 'object' && 'message' in response && typeof (response as { message?: string }).message === 'string') {
        successMsg = (response as { message: string }).message;
      }
      toast.success(successMsg);
      router.push('/dashboard/solicitante/mis-recurrentes');
    } catch  {
      toast.error('Error al crear plantilla recurrente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-10 mb-12 border border-white/20 w-full text-left">
            <h1 className="text-3xl font-bold text-white font-montserrat mb-1 flex items-center gap-3">
              <Repeat className="w-8 h-8 text-blue-300" /> Nueva Plantilla Recurrente
            </h1>
            <p className="text-white/80 text-lg">Completa el formulario para crear una nueva plantilla</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 w-full">
            {/* Sección de Datos Básicos */}
            <div className="bg-white/10 rounded-xl border border-white/20 p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 w-full items-start shadow-lg text-left">
              <div className="col-span-2 mb-2">
                <h2 className="text-xl font-semibold text-blue-200 flex items-center gap-2 mb-2">
                  <FileText className="w-6 h-6" /> Datos de la Plantilla
                </h2>
                <hr className="border-blue-400/30 mb-2" />
              </div>
              
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <CreditCard className="inline w-4 h-4 mr-2" /> Tipo de Cuenta Destino *
                </label>
                <select
                  name="tipo_cuenta_destino"
                  value={formData.tipo_cuenta_destino}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                >
                  <option value="CLABE" className="text-black">CLABE</option>
                  <option value="Tarjeta" className="text-black">Tarjeta</option>
                  <option value="Cuenta" className="text-black">Cuenta</option>
                </select>
              </div>

              {formData.tipo_cuenta_destino === 'Tarjeta' && (
                <div className="text-left">
                  <label className="text-white/90 block mb-3 font-medium text-left">
                    Tipo de Tarjeta *
                  </label>
                  <select
                    name="tipo_tarjeta"
                    value={formData.tipo_tarjeta}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                  >
                    <option value="" className="text-black">Selecciona tipo</option>
                    <option value="Débito" className="text-black">Débito</option>
                    <option value="Crédito" className="text-black">Crédito</option>
                  </select>
                </div>
              )}

              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  Banco (opcional)
                </label>
                <select
                  name="banco_destino"
                  value={formData.banco_destino}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                >
                  <option value="" className="text-black">Selecciona banco</option>
                  {bancoOptions.map(banco => (
                    <option key={banco} value={banco} className="text-black text-left">
                      {banco}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <CreditCard className="inline w-4 h-4 mr-2" /> Cuenta Destino *
                </label>
                <input
                  type="text"
                  name="cuenta_destino"
                  value={formData.cuenta_destino}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value });
                  }}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                  placeholder={cuentaConfig.placeholder}
                  inputMode="numeric"
                />
              </div>

              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  Factura (PDF o imagen) *
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={e => setFacturaFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left file:text-left file:pl-0"
                />
              </div>
              
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <Building className="inline w-4 h-4 mr-2" /> Departamento *
                </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                >
                  <option value="" className="text-black">Selecciona departamento</option>
                  {departamentos.map(dep => (
                    <option key={dep} value={dep} className="text-black text-left">
                      {dep.charAt(0).toUpperCase() + dep.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <DollarSign className="inline w-4 h-4 mr-2" /> Monto *
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
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                  inputMode="decimal"
                />
              </div>

              <div className="col-span-2 text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  Empresa a pagar (opcional)
                </label>
                <input
                  type="text"
                  name="empresa_a_pagar"
                  value={formData.empresa_a_pagar}
                  onChange={handleInputChange}
                  placeholder="Nombre de la empresa"
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                />
              </div>

              <div className="col-span-2 text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  Nombre de la persona que recibe el pago *
                </label>
                <input
                  type="text"
                  name="nombre_persona"
                  value={formData.nombre_persona}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre completo de la persona"
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                />
              </div>
              
              <div className="col-span-2 flex items-center mt-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'activo', value: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="activo" className="text-white/80 text-left">Activo</label>
              </div>
            </div>

            {/* Sección de Configuración */}
            <div className="bg-white/10 rounded-xl border border-white/20 p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 w-full items-start shadow-lg text-left">
              <div className="col-span-2 mb-2">
                <h2 className="text-xl font-semibold text-blue-200 flex items-center gap-2 mb-2">
                  <Repeat className="w-6 h-6" /> Configuración de Recurrencia
                </h2>
                <hr className="border-blue-400/30 mb-2" />
              </div>
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  Tipo de Pago *
                </label>
                <select
                  name="tipo_pago"
                  value={formData.tipo_pago}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                >
                  <option value="">Selecciona tipo de pago</option>
                  {tipoPagoOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="text-black text-left">
                      {opt.label}
                    </option>
                  ))}
                </select>
                
                {/* Mostrar descripción solo si hay tipo de pago seleccionado y no está vacío */}
                {formData.tipo_pago !== '' && (
                  <div className="mt-4">
                    <label className="text-white/90 block mb-3 font-medium text-left">
                      Descripción del tipo de depa
                    </label>
                    <textarea
                      name="tipo_pago_descripcion"
                      value={formData.tipo_pago_descripcion}
                      onChange={handleInputChange}
                      placeholder="Agrega una breve descripción que identifique el pago"
                      rows={2}
                      className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left resize-none"
                    />
                  </div>
                )}
              </div>
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <Repeat className="inline w-4 h-4 mr-2" /> Frecuencia *
                </label>
                <select
                  name="frecuencia"
                  value={formData.frecuencia}
                  onChange={handleInputChange}
                  required
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                >
                  <option value="">Selecciona frecuencia</option>
                  {frecuencias.map(f => (
                    <option key={f} value={f} className="text-black text-left">
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-left">
                <label className="text-white/90 block mb-3 font-medium text-left">
                  <Calendar className="inline w-4 h-4 mr-2" /> Fecha de Inicio *
                </label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={(date: Date | null) => {
                    setFechaInicio(date);
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'siguiente_fecha',
                      value: formatDateForAPI(date)
                    });
                  }}
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  placeholderText="Selecciona la fecha"
                  locale={es}
                  className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                />
              </div>
            </div>

            {/* Sección de Concepto */}
            <div className="bg-white/10 rounded-xl border border-white/20 p-6 md:p-10 w-full shadow-lg text-left">
              <h2 className="text-xl font-semibold text-blue-200 flex items-center gap-2 mb-2">
                <MessageSquare className="w-6 h-6" /> Concepto del Pago
              </h2>
              <hr className="border-blue-400/30 mb-4" />
              <textarea
                name="concepto"
                value={formData.concepto}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 text-left"
                placeholder="Describe el motivo del pago..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-6 pt-6">
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
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}