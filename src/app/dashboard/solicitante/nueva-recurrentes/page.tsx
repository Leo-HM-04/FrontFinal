'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Calendar, DollarSign, Building, CreditCard, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RecurrentesService } from '@/services/recurrentes.service';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';
import { formatDateForAPI } from '@/utils/dateUtils';

// Estado inicial
type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_pago_descripcion: string;
  empresa_a_pagar: string;
  nombre_persona: string;
  frecuencia: string;
  siguiente_fecha: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  cuenta: string;
  banco_cuenta: string;
};

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: '',
  tipo_pago_descripcion: '',
  empresa_a_pagar: '',
  nombre_persona: '',
  frecuencia: '',
  siguiente_fecha: '',
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: '',
  banco_destino: '',
  cuenta: '',
  banco_cuenta: ''
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

// Opciones del formulario
const bancoOptions = [
  "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
];

const departamentoOptions = [
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'facturacion', label: 'Facturación' },
  { value: 'cobranza', label: 'Cobranza' },
  { value: 'vinculacion', label: 'Vinculación' },
  { value: 'administracion', label: 'Administración' },
  { value: 'ti', label: 'TI' },
  { value: 'automatizaciones', label: 'Automatizaciones' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'atencion a clientes', label: 'Atención a Clientes' },
  { value: 'tesoreria', label: 'Tesorería' },
  { value: 'nomina', label: 'Nómina' },
  { value: 'atraccion de talento', label: 'Atracción de Talento' },
  { value: 'direccion general', label: 'Dirección General' }
];

const tipoPagoOptions = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'factura', label: 'Factura' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'tarjeta_institucional', label: 'Tarjeta Institucional' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'administrativos', label: 'Administrativos' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'poliza_seguro', label: 'Poliza - Seguro' },
  { value: 'Dirección General', label: 'Dirección General' },
  { value: 'Donativos', label: 'Donativos' },
  { value: 'Operativos', label: 'Operativos' },
  { value: 'Fiscales legales y corporativos', label: 'Fiscales legales y corporativos' }
];

const frecuenciaOptions = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' }
];

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [siguienteFecha, setSiguienteFecha] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<keyof FormState | string, string | undefined>>({});

  // Configuración dinámica para cuenta destino
  let cuentaConfig;
  if (formData.tipo_cuenta_destino === 'Número de Tarjeta') {
    cuentaConfig = {
      placeholder: 'Número de tarjeta',
      errorMsg: 'Ingresa un número de tarjeta válido.'
    };
  } else {
    cuentaConfig = {
      placeholder: 'Número de cuenta CLABE',
      errorMsg: 'Ingresa un número de cuenta CLABE válido.'
    };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  // handleSubmit duplicado y bucle innecesario eliminado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validación de campos obligatorios
    const newErrors: Record<string, string> = {};
    const requiredFields = [
      { field: 'departamento', label: 'Departamento' },
      { field: 'monto', label: 'Monto' },
      { field: 'cuenta_destino', label: 'Cuenta destino' },
      { field: 'concepto', label: 'Concepto' },
      { field: 'tipo_pago', label: 'Tipo de pago' },
      { field: 'frecuencia', label: 'Frecuencia' },
      { field: 'siguiente_fecha', label: 'Siguiente fecha' },
      { field: 'nombre_persona', label: 'Nombre de la persona' }
    ];
    
    requiredFields.forEach(({ field, label }) => {
      if (!formData[field as keyof FormState]) {
        newErrors[field] = `${label} es obligatorio`;
      }
    });
    
    // Validar cuenta adicional: si se llena cuenta, banco_cuenta es obligatorio
    if (formData.cuenta && formData.cuenta.trim() !== '') {
      if (!formData.banco_cuenta || formData.banco_cuenta.trim() === '') {
        newErrors['banco_cuenta'] = 'Si agregas una cuenta, debes seleccionar el banco al que pertenece';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      // Convertir formData a FormData si el backend espera FormData
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          fd.append(key, value.toString());
        }
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
        <div className="max-w-7xl mx-auto px-8 py-12 md:py-16">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-4 rounded-full bg-white/20">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Nueva Plantilla Recurrente</h1>
                  <p className="text-white/80 text-lg">Configura pagos automáticos periódicos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12 md:p-16">
            <div className="flex items-center space-x-4 mb-12">
              <div className="p-4 rounded-full bg-white/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Plantilla Recurrente</h2>
                <p className="text-white/80 text-base">Completa todos los campos para crear tu plantilla</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 max-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 w-full">
                {/* Columna izquierda: datos bancarios */}
                <div className="flex-1 space-y-8">
                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Datos Bancarios *
                    </label>
                    <select
                      name="tipo_cuenta_destino"
                      value={formData.tipo_cuenta_destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                    >
                      <option value="CLABE" className="text-black">CLABE</option>
                      <option value="Número de Tarjeta" className="text-black">Número de Tarjeta</option>
                    </select>
                  </div>

                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Banco (opcional)
                    </label>
                    <select
                      name="banco_destino"
                      value={formData.banco_destino}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                    >
                      <option value="" className="text-black">Selecciona banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco} className="text-black">{banco}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Cuenta Destino *
                    </label>
                    <input
                      type="text"
                      name="cuenta_destino"
                      value={formData.cuenta_destino}
                      onChange={e => {
                        const value = e.target.value;
                        dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value });
                        // Solo validar si está vacío
                        if (!value) {
                          setErrors((prev) => ({ ...prev, cuenta_destino: 'Este campo es obligatorio' }));
                        } else {
                          setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                        }
                      }}
                      placeholder={cuentaConfig.placeholder}
                      required
                      autoComplete="off"
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.cuenta_destino ? 'border-red-400' : ''}`}
                    />
                    {formData.cuenta_destino && errors.cuenta_destino && (
                      <span className="text-red-400 text-sm mt-1 block">{errors.cuenta_destino}</span>
                    )}
                  </div>

                  {/* SECCIÓN: CUENTA ADICIONAL (OPCIONAL) */}
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Cuenta Adicional (Opcional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Campo Cuenta */}
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Número de Cuenta (Opcional)
                        </label>
                        <input
                          type="text"
                          name="cuenta"
                          value={formData.cuenta}
                          onChange={handleInputChange}
                          placeholder="Ingresa el número de cuenta adicional"
                          className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide"
                        />
                        <p className="text-white/60 text-xs mt-1">
                          Campo opcional para agregar una cuenta bancaria adicional
                        </p>
                      </div>

                      {/* Banco de la Cuenta (condicional) */}
                      {formData.cuenta && formData.cuenta.trim() !== '' && (
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">
                            Banco al que pertenece *
                          </label>
                          <select
                            name="banco_cuenta"
                            value={formData.banco_cuenta}
                            onChange={handleInputChange}
                            required={!!(formData.cuenta && formData.cuenta.trim() !== '')}
                            className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                          >
                            <option value="" className="text-black">Selecciona el banco</option>
                            {bancoOptions.map(banco => (
                              <option key={banco} value={banco} className="text-black">{banco}</option>
                            ))}
                          </select>
                          {formData.cuenta && formData.cuenta.trim() !== '' && !formData.banco_cuenta && (
                            <span className="text-red-400 text-sm mt-1 block">
                              Selecciona el banco al que pertenece la cuenta
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Columna derecha: datos de la recurrencia */}
                <div className="flex-1 space-y-8">
                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <Building className="w-4 h-4 inline mr-2" />
                      Departamento *
                    </label>
                    <select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.departamento ? 'border-red-400' : ''}`}
                    >
                      <option value="" className="text-gray-900">Seleccionar departamento</option>
                      {departamentoOptions.map(dept => (
                        <option key={dept.value} value={dept.value} className="text-gray-900">
                          {dept.label}
                        </option>
                      ))}
                    </select>
                    {errors.departamento && <span className="text-red-400 text-sm mt-1 block">{errors.departamento}</span>}
                  </div>

                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Monto *
                    </label>
                    <NumericFormat
                      value={formData.monto}
                      name="monto"
                      thousandSeparator="," 
                      decimalSeparator="."
                      allowNegative={false}
                      allowLeadingZeros={false}
                      decimalScale={2}
                      fixedDecimalScale
                      placeholder="0.00"
                      required
                      onValueChange={({ value }) => {
                        dispatch({ type: 'SET_FIELD', field: 'monto', value });
                        if (!value) {
                          setErrors((prev) => ({ ...prev, monto: 'Este campo es obligatorio' }));
                        } else {
                          setErrors((prev) => ({ ...prev, monto: undefined }));
                        }
                      }}
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.monto ? 'border-red-400' : ''}`}
                    />  
                    {errors.monto && <span className="text-red-400 text-sm mt-1 block">{errors.monto}</span>}
                  </div>

                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Tipo de Pago *
                    </label>
                    <select
                      name="tipo_pago"
                      value={formData.tipo_pago}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.tipo_pago ? 'border-red-400' : ''}`}
                    >
                      <option value="" className="text-gray-900">Selecciona tipo de pago</option>
                      {tipoPagoOptions.map(tipo => (
                        <option key={tipo.value} value={tipo.value} className="text-gray-900">
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipo_pago && <span className="text-red-400 text-sm mt-1 block">{errors.tipo_pago}</span>}
                    
                    {/* Mostrar descripción solo si hay tipo de pago seleccionado y no está vacío */}
                    {formData.tipo_pago !== '' && (
                      <div className="mt-6">
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Descripción del tipo de pago
                        </label>
                        <textarea
                          name="tipo_pago_descripcion"
                          value={formData.tipo_pago_descripcion}
                          onChange={handleInputChange}
                          placeholder="Agrega una breve descripción que identifique el pago"
                          rows={3}
                          className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mb-0">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Frecuencia *
                    </label>
                    <select
                      name="frecuencia"
                      value={formData.frecuencia}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.frecuencia ? 'border-red-400' : ''}`}
                    >
                      <option value="" className="text-gray-900">Selecciona frecuencia</option>
                      {frecuenciaOptions.map(freq => (
                        <option key={freq.value} value={freq.value} className="text-gray-900">
                          {freq.label}
                        </option>
                      ))}
                    </select>
                    {errors.frecuencia && <span className="text-red-400 text-sm mt-1 block">{errors.frecuencia}</span>}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Siguiente Fecha de Ejecución *
                    </label>
                    <div className="relative w-full flex items-center">
                      <DatePicker
                        selected={siguienteFecha}
                        onChange={(date: Date | null) => {
                          setSiguienteFecha(date);
                          dispatch({ type: 'SET_FIELD', field: 'siguiente_fecha', value: formatDateForAPI(date) });
                          if (!date) {
                            setErrors((prev) => ({ ...prev, siguiente_fecha: 'Este campo es obligatorio' }));
                          } else {
                            setErrors((prev) => ({ ...prev, siguiente_fecha: undefined }));
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        minDate={new Date()}
                        placeholderText="Selecciona la fecha"
                        className={`w-full px-5 py-4 pr-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.siguiente_fecha ? 'border-red-400' : ''}`}
                        calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                        locale={es}
                      />
                      <span className="absolute right-4 pointer-events-none">
                        <Calendar className="w-5 h-5 text-white/70" />
                      </span>
                    </div>
                    {errors.siguiente_fecha && <span className="text-red-400 text-sm mt-1 block">{errors.siguiente_fecha}</span>}
                  </div>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Concepto *
                </label>
                <textarea
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleInputChange}
                  placeholder="Describe el concepto del pago..."
                  required
                  rows={5}
                  className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base ${errors.concepto ? 'border-red-400' : ''}`}
                />
                {errors.concepto && <span className="text-red-400 text-sm mt-1 block">{errors.concepto}</span>}
              </div>

              {/* Empresa a pagar (opcional) */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  Empresa a pagar (opcional)
                </label>
                <input
                  type="text"
                  name="empresa_a_pagar"
                  value={formData.empresa_a_pagar}
                  onChange={handleInputChange}
                  placeholder="Nombre de la empresa"
                  className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                />
              </div>

              {/* Nombre de la persona (obligatorio) */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  Nombre de la persona que recibe el pago *
                </label>
                <input
                  type="text"
                  name="nombre_persona"
                  value={formData.nombre_persona}
                  onChange={handleInputChange}
                  required
                  placeholder="Nombre completo de la persona"
                  className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.nombre_persona ? 'border-red-400' : ''}`}
                />
                {errors.nombre_persona && <span className="text-red-400 text-sm mt-1 block">{errors.nombre_persona}</span>}
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-6 pt-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-10 py-5 text-lg rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 px-10 py-5 text-lg rounded-xl shadow"
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