"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SolicitanteLayout } from "@/components/layout/SolicitanteLayout";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es";
import { NumericFormat } from "react-number-format";
import { SolicitudesService } from "@/services/solicitudes.service";
import { Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare, CheckCircle } from "lucide-react";
import { Solicitud } from "@/types";
import { format } from "date-fns";

type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  fecha_limite_pago: string;
  factura_file: File | null;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | File | null }
  | { type: 'SET_ALL'; payload: Partial<FormState> };

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: 'transferencia',
  fecha_limite_pago: '',
  factura_file: null,
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: '',
  banco_destino: ''
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ALL':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default function EditarSolicitudPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const idNum = id ? Number(id) : undefined;
  const [loading, setLoading] = useState(false);
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [fechaLimitePago, setFechaLimitePago] = useState<Date | null>(null);
  const [cuentaValida, setCuentaValida] = useState<boolean | null>(null);
  const [checkingCuenta, setCheckingCuenta] = useState(false);
  const [estado, setEstado] = useState<string>('');
  const [facturaUrl, setFacturaUrl] = useState<string | null>(null);

  // Construir URL absoluta para la factura si es necesario
  const facturaLink = facturaUrl
    ? facturaUrl.startsWith('http')
      ? facturaUrl
      : `http://localhost:4000/uploads/facturas/${facturaUrl.replace(/^.*[\\\/]/, '')}`
    : null;

  // Opciones (puedes sincronizarlas igual que en nueva solicitud)
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
    { value: 'nomina', label: 'Nómina' }
  ];
  const tipoPagoOptions = [
    { value: 'viaticos', label: 'Viáticos' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'factura', label: 'Factura' },
    { value: 'nominas', label: 'Nóminas' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'administrativos', label: 'Administrativos' }
  ];

  useEffect(() => {
    if (!idNum) return;
    const fetchSolicitud = async () => {
      setLoading(true);
      try {
        const data: Solicitud = await SolicitudesService.getById(idNum);
        // Forzar valores válidos para los campos clave
        const tipo_cuenta_destino = (data.tipo_cuenta_destino === undefined || data.tipo_cuenta_destino === null || data.tipo_cuenta_destino === '') ? 'CLABE' : data.tipo_cuenta_destino;
        const tipo_tarjeta = (data.tipo_tarjeta === undefined || data.tipo_tarjeta === null) ? '' : data.tipo_tarjeta;
        const banco_destino = (data.banco_destino === undefined || data.banco_destino === null) ? '' : data.banco_destino;
        dispatch({ type: 'SET_ALL', payload: {
          departamento: data.departamento || '',
          monto: String(data.monto ?? ''),
          cuenta_destino: data.cuenta_destino || '',
          concepto: data.concepto || '',
          tipo_pago: data.tipo_pago || 'transferencia',
          fecha_limite_pago: data.fecha_limite_pago || '',
          factura_file: null,
          tipo_cuenta_destino,
          tipo_tarjeta,
          banco_destino
        }});
        setFacturaUrl(data.factura_url || null);
        setFechaLimitePago(data.fecha_limite_pago ? new Date(data.fecha_limite_pago) : null);
        setEstado(data.estado ?? '');
      } catch {
        toast.error('No se pudo cargar la solicitud');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitud();
  }, [idNum, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
    // Reset tipo_tarjeta si cambia tipo_cuenta_destino
    if (name === 'tipo_cuenta_destino' && value === 'CLABE') {
      dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta', value: '' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormState) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!validateFile(file)) return;
      dispatch({ type: 'SET_FIELD', field: fieldName, value: file });
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo PDF, Excel, JPG y PNG.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
      return false;
    }
    return true;
  };

  const verificarCuentaDestino = async (cuenta: string) => {
    setCheckingCuenta(true);
    setCuentaValida(null);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      setCuentaValida(cuenta.length >= 8);
    } catch {
      setCuentaValida(false);
    } finally {
      setCheckingCuenta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (cuentaValida === false) {
      toast.error('La cuenta destino no es válida o no existe.');
      setLoading(false);
      return;
    }
    if (checkingCuenta) {
      toast.error('Espera a que termine la verificación de la cuenta destino.');
      setLoading(false);
      return;
    }
    try {
      const requiredFields: (keyof FormState)[] = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'fecha_limite_pago', 'tipo_cuenta_destino'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          toast.error(`Por favor completa el campo: ${field}`);
          setLoading(false);
          return;
        }
      }
      // Validación especial para concepto
      if (!formData.concepto || formData.concepto.trim().length < 3) {
        toast.error('Debes actualizar el campo concepto para poder guardar los cambios.');
        setLoading(false);
        return;
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
      const solicitudData = {
        departamento: formData.departamento,
        monto: formData.monto,
        cuenta_destino: formData.cuenta_destino,
        concepto: formData.concepto,
        tipo_pago: formData.tipo_pago,
        fecha_limite_pago: formData.fecha_limite_pago
          ? format(new Date(formData.fecha_limite_pago), "yyyy-MM-dd")
          : "",
        factura: formData.factura_file ?? undefined,
        tipo_cuenta_destino: formData.tipo_cuenta_destino,
        tipo_tarjeta: formData.tipo_cuenta_destino === 'Tarjeta' ? formData.tipo_tarjeta : '',
        banco_destino: formData.banco_destino
      };
      await SolicitudesService.updateWithFiles(idNum!, solicitudData);
      toast.success('Solicitud actualizada exitosamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch {
      toast.error('Error al actualizar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Si la solicitud no está pendiente, no permitir edición
  if (estado && estado.toLowerCase() !== 'pendiente') {
    return (
      <ProtectedRoute requiredRoles={['solicitante']}>
        <SolicitanteLayout>
          <div className="max-w-2xl mx-auto px-6 py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">No editable</h2>
              <p className="text-white/80">Solo puedes editar solicitudes en estado <b>Pendiente</b>.</p>
              <Button className="mt-8" onClick={() => router.push('/dashboard/solicitante/mis-solicitudes')}>Volver</Button>
            </div>
          </div>
        </SolicitanteLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* <Button type="button" variant="outline" onClick={() => router.back()} className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-6 py-2 text-base">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button> */}
                <div>
                  <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Editar Solicitud</h1>
                  <p className="text-white/80 text-lg">Modifica los campos necesarios y guarda los cambios</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-10 md:p-14">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Tipo de Cuenta Destino *
                  </label>
                  <select
                    name="tipo_cuenta_destino"
                    value={formData.tipo_cuenta_destino}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    <option value="CLABE" className="text-black">CLABE</option>
                    <option value="Tarjeta" className="text-black">Tarjeta</option>
                  </select>
                </div>
                {formData.tipo_cuenta_destino === 'Tarjeta' && (
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">Tipo de Tarjeta *</label>
                    <select
                      name="tipo_tarjeta"
                      value={formData.tipo_tarjeta}
                      onChange={handleInputChange}
                      required
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                    >
                      <option value="" className="text-black">Selecciona tipo</option>
                      <option value="Débito" className="text-black">Débito</option>
                      <option value="Crédito" className="text-black">Crédito</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">Banco Destino (opcional)</label>
                  <select
                    name="banco_destino"
                    value={formData.banco_destino}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    <option value="" className="text-black">Selecciona banco</option>
                    <option value="BBVA" className="text-black">BBVA</option>
                    <option value="Banorte" className="text-black">Banorte</option>
                    <option value="Santander" className="text-black">Santander</option>
                    <option value="Citibanamex" className="text-black">Citibanamex</option>
                    <option value="HSBC" className="text-black">HSBC</option>
                    <option value="Scotiabank" className="text-black">Scotiabank</option>
                    <option value="Inbursa" className="text-black">Inbursa</option>
                    <option value="Banco Azteca" className="text-black">Banco Azteca</option>
                    <option value="Bancoppel" className="text-black">Bancoppel</option>
                    <option value="Afirme" className="text-black">Afirme</option>
                    <option value="Banregio" className="text-black">Banregio</option>
                    <option value="Banjército" className="text-black">Banjército</option>
                    <option value="Banco del Bajío" className="text-black">Banco del Bajío</option>
                    <option value="Banco Multiva" className="text-black">Banco Multiva</option>
                    <option value="Banco Famsa" className="text-black">Banco Famsa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Building className="w-4 h-4 inline mr-2" />
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    <option value="" className="text-gray-900">Seleccionar departamento</option>
                    {departamentoOptions.map(dept => (
                      <option key={dept.value} value={dept.value} className="text-gray-900">{dept.label}</option>
                    ))}
                  </select>
                </div>
                <div>
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
                    onValueChange={({ value }) => dispatch({ type: 'SET_FIELD', field: 'monto', value })}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <CreditCard className="w-4 h-4 inline mr-2" />
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
                      setCuentaValida(null);
                    }}
                    onBlur={e => verificarCuentaDestino(e.target.value)}
                    placeholder={formData.tipo_cuenta_destino === 'Tarjeta' ? 'Número de tarjeta (16 dígitos)' : 'Número de cuenta CLABE (18 dígitos)'}
                    required
                    maxLength={formData.tipo_cuenta_destino === 'Tarjeta' ? 16 : 18}
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  />
                  {checkingCuenta && (
                    <span className="text-blue-300 text-sm ml-2">Verificando cuenta...</span>
                  )}
                  {cuentaValida === false && !checkingCuenta && (
                    <span className="text-red-400 text-sm ml-2">Cuenta no válida o no existe</span>
                  )}
                  {cuentaValida === true && !checkingCuenta && (
                    <span className="text-green-400 text-sm ml-2">Cuenta válida</span>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    Tipo de Pago
                  </label>
                  <select
                    name="tipo_pago"
                    value={formData.tipo_pago}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    {tipoPagoOptions.map(tipo => (
                      <option key={tipo.value} value={tipo.value} className="text-gray-900">{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha Límite de Pago *
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={fechaLimitePago}
                      onChange={(date) => {
                        setFechaLimitePago(date);
                        dispatch({ type: 'SET_FIELD', field: 'fecha_limite_pago', value: date ? date.toISOString().split('T')[0] : '' });
                      }}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      placeholderText="Selecciona la fecha"
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                      locale={es}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Calendar className="w-5 h-5 text-white/70" />
                    </span>
                  </div>
                </div>
              </div>
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
                  className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Factura * (PDF, Excel, JPG, PNG - Máx. 5MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                    onChange={e => handleFileChange(e, 'factura_file')}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40 text-base"
                  />
                  {formData.factura_file ? (
                    <div className="flex items-center mt-3 p-3 bg-white/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <p className="text-white/80 text-sm">
                        {formData.factura_file.name} ({(formData.factura_file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  ) : facturaUrl ? (
                    <div className="flex items-center mt-3 p-3 bg-white/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-blue-400 mr-2" />
                      <a href={facturaLink!} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline text-sm">
                        Ver factura actual
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-end space-x-6 pt-10">
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
                  className="bg-green-600 text-white hover:bg-green-700 shadow-lg border-0 px-8 py-4 font-medium text-base"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
