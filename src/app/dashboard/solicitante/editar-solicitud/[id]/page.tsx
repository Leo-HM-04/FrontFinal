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
import Image from "next/image";
import { Solicitud } from "@/types";
import { formatDateForAPI, parseBackendDateForForm } from '@/utils/dateUtils';

type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_pago_descripcion: string;
  empresa_a_pagar: string;
  nombre_persona: string;
  fecha_limite_pago: string;
  factura_file: File | null;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  cuenta: string;
  // Campos para tarjeta institucional
  link_pago: string;
  usuario_acceso: string;
  contrasena_acceso: string;
  // Campos para segunda forma de pago
  tiene_segunda_forma_pago: boolean;
  tipo_cuenta_destino_2: string;
  banco_destino_2: string;
  cuenta_destino_2: string;
  tipo_tarjeta_2: string;
  cuenta_2: string;
  // Campos para segunda tarjeta institucional
  link_pago_2: string;
  usuario_acceso_2: string;
  contrasena_acceso_2: string;
};

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | File | null | boolean }
  | { type: 'SET_ALL'; payload: Partial<FormState> };

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: 'transferencia',
  tipo_pago_descripcion: '',
  empresa_a_pagar: '',
  nombre_persona: '',
  fecha_limite_pago: '',
  factura_file: null,
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: '',
  banco_destino: '',
  cuenta: '',
  // Campos para tarjeta institucional
  link_pago: '',
  usuario_acceso: '',
  contrasena_acceso: '',
  // Campos para segunda forma de pago
  tiene_segunda_forma_pago: false,
  tipo_cuenta_destino_2: 'CLABE',
  banco_destino_2: '',
  cuenta_destino_2: '',
  tipo_tarjeta_2: '',
  cuenta_2: '',
  // Campos para segunda tarjeta institucional
  link_pago_2: '',
  usuario_acceso_2: '',
  contrasena_acceso_2: ''
};

const bancoOptions = [
  "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
];


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
  const [errors, setErrors] = useState<Record<keyof FormState | string, string | undefined>>({});

  // Configuración dinámica para cuenta destino - SIN RESTRICCIONES DE LONGITUD
  const cuentaConfig = formData.tipo_cuenta_destino === 'Tarjeta'
    ? {
        placeholder: 'Número de tarjeta',
        errorMsg: 'Ingresa un número de tarjeta válido.'
      }
    : {
        placeholder: 'Número de cuenta CLABE',
        errorMsg: 'Ingresa un número de cuenta CLABE válido.'
      };

  // Construir URL absoluta para la factura si es necesario
  const facturaLink = facturaUrl
    ? facturaUrl.startsWith('http')
      ? facturaUrl
      : `/uploads/facturas/${facturaUrl.replace(/^.*[\\\/]/, '')}`
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
    { value: 'poliza_seguro', label: 'Poliza - Seguro' }
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
          tipo_pago_descripcion: data.tipo_pago_descripcion || '',
          empresa_a_pagar: data.empresa_a_pagar || '',
          nombre_persona: data.nombre_persona || '',
          fecha_limite_pago: data.fecha_limite_pago || '',
          factura_file: null,
          tipo_cuenta_destino,
          tipo_tarjeta,
          banco_destino,
          cuenta: data.cuenta || '',
          // Campos para tarjeta institucional
          link_pago: data.link_pago || '',
          usuario_acceso: data.usuario_acceso || '',
          contrasena_acceso: data.contrasena_acceso || '',
          // Campos para segunda forma de pago
          tiene_segunda_forma_pago: data.tiene_segunda_forma_pago || false,
          tipo_cuenta_destino_2: data.tipo_cuenta_destino_2 || 'CLABE',
          banco_destino_2: data.banco_destino_2 || '',
          cuenta_destino_2: data.cuenta_destino_2 || '',
          tipo_tarjeta_2: data.tipo_tarjeta_2 || '',
          cuenta_2: data.cuenta_2 || '',
          // Campos para segunda tarjeta institucional
          link_pago_2: data.link_pago_2 || '',
          usuario_acceso_2: data.usuario_acceso_2 || '',
          contrasena_acceso_2: data.contrasena_acceso_2 || ''
        }});
        setFacturaUrl(data.factura_url || null);
        setFechaLimitePago(data.fecha_limite_pago ? parseBackendDateForForm(data.fecha_limite_pago) : null);
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
    // Reset tipo_tarjeta_2 si cambia tipo_cuenta_destino_2
    if (name === 'tipo_cuenta_destino_2' && value === 'CLABE') {
      dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta_2', value: '' });
    }
    // Validación en tiempo real - Solo verificar si está vacío
    if (!value) {
      setErrors((prev) => ({ ...prev, [name]: 'Este campo es obligatorio' }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormState) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!validateFile(file)) {
        setErrors((prev) => ({ ...prev, factura_file: 'Archivo no válido' }));
        return;
      }
      dispatch({ type: 'SET_FIELD', field: fieldName, value: file });
      setErrors((prev) => ({ ...prev, factura_file: undefined }));
    } else {
      setErrors((prev) => ({ ...prev, factura_file: 'Este campo es obligatorio' }));
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
      const requiredFields: (keyof FormState)[] = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'fecha_limite_pago', 'tipo_cuenta_destino', 'nombre_persona'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          toast.error(`Por favor completa el campo: ${field}`);
          setLoading(false);
          return;
        }
      }

      // Validar campos de tarjeta institucional si es necesario
      if (formData.tipo_pago === 'tarjeta_institucional') {
        if (!formData.link_pago || !formData.usuario_acceso || !formData.contrasena_acceso) {
          toast.error('Completa todos los campos de la tarjeta institucional');
          setLoading(false);
          return;
        }
      }

      // Validar segunda forma de pago si está habilitada
      if (formData.tiene_segunda_forma_pago) {
        if (!formData.cuenta_destino_2) {
          toast.error('Completa la cuenta destino de la segunda forma de pago');
          setLoading(false);
          return;
        }
        if (formData.tipo_cuenta_destino_2 === 'Tarjeta' && !formData.tipo_tarjeta_2) {
          toast.error('Selecciona el tipo de tarjeta para la segunda forma de pago');
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
      // No validar longitud específica de cuenta destino
      const solicitudData = {
        departamento: formData.departamento,
        monto: formData.monto,
        cuenta_destino: formData.cuenta_destino,
        concepto: formData.concepto,
        tipo_pago: formData.tipo_pago,
        tipo_pago_descripcion: (formData.tipo_pago_descripcion !== undefined && formData.tipo_pago_descripcion !== null) ? String(formData.tipo_pago_descripcion) : '',
        empresa_a_pagar: (formData.empresa_a_pagar !== undefined && formData.empresa_a_pagar !== null) ? String(formData.empresa_a_pagar) : '',
        nombre_persona: (formData.nombre_persona !== undefined && formData.nombre_persona !== null) ? String(formData.nombre_persona) : '',
        fecha_limite_pago: fechaLimitePago ? formatDateForAPI(fechaLimitePago) : "",
        factura: formData.factura_file ?? undefined,
        tipo_cuenta_destino: formData.tipo_cuenta_destino,
        tipo_tarjeta: formData.tipo_cuenta_destino === 'Tarjeta' ? formData.tipo_tarjeta : '',
        banco_destino: formData.banco_destino,
        cuenta: formData.cuenta,
        // Campos para tarjeta institucional
        link_pago: formData.tipo_pago === 'tarjeta_institucional' ? formData.link_pago : '',
        usuario_acceso: formData.tipo_pago === 'tarjeta_institucional' ? formData.usuario_acceso : '',
        contrasena_acceso: formData.tipo_pago === 'tarjeta_institucional' ? formData.contrasena_acceso : '',
        // Campos para segunda forma de pago
        tiene_segunda_forma_pago: formData.tiene_segunda_forma_pago,
        tipo_cuenta_destino_2: formData.tiene_segunda_forma_pago ? formData.tipo_cuenta_destino_2 : '',
        banco_destino_2: formData.tiene_segunda_forma_pago ? formData.banco_destino_2 : '',
        cuenta_destino_2: formData.tiene_segunda_forma_pago ? formData.cuenta_destino_2 : '',
        tipo_tarjeta_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Tarjeta' ? formData.tipo_tarjeta_2 : '',
        cuenta_2: formData.tiene_segunda_forma_pago ? formData.cuenta_2 : '',
        // Campos para segunda tarjeta institucional
        link_pago_2: formData.tiene_segunda_forma_pago ? formData.link_pago_2 : '',
        usuario_acceso_2: formData.tiene_segunda_forma_pago ? formData.usuario_acceso_2 : '',
        contrasena_acceso_2: formData.tiene_segunda_forma_pago ? formData.contrasena_acceso_2 : ''
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
        <div className="max-w-7xl mx-auto px-8 py-12 md:py-16">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Editar Solicitud de Pago</h1>
                  <p className="text-white/80 text-lg">Modifica los campos necesarios y guarda los cambios</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12 md:p-16">
            <div className="flex items-center space-x-4 mb-12">
              <div className="p-4 rounded-full bg-white/20">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Editar Solicitud</h2>
                <p className="text-white/80 text-base">Actualiza la información de tu solicitud</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 max-w-full">
              {/* SECCIÓN 1: INFORMACIÓN BÁSICA - 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Departamento */}
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

                {/* Monto */}
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
              </div>

              {/* SECCIÓN 2: INFORMACIÓN BANCARIA - 4 columnas para incluir cuenta */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3" />
                  Información Bancaria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Datos Bancarios */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Datos Bancarios *
                    </label>
                    <select
                      name="tipo_cuenta_destino"
                      value={formData.tipo_cuenta_destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    >
                      <option value="CLABE" className="text-black">CLABE</option>
                      <option value="Tarjeta" className="text-black">Tarjeta</option>
                    </select>
                  </div>

                  {/* Banco (opcional) */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Banco (opcional)
                    </label>
                    <select
                      name="banco_destino"
                      value={formData.banco_destino}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    >
                      <option value="" className="text-black">Selecciona banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco} className="text-black">{banco}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cuenta (opcional) */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Cuenta (opcional)
                    </label>
                    <input
                      type="text"
                      name="cuenta"
                      value={formData.cuenta}
                      onChange={handleInputChange}
                      placeholder="Número de cuenta"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    />
                  </div>

                  {/* Cuenta Destino */}
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
                        const value = e.target.value;
                        dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value });
                        setCuentaValida(null);
                        // Solo validar si está vacío
                        if (!value) {
                          setErrors((prev) => ({ ...prev, cuenta_destino: 'Este campo es obligatorio' }));
                        } else {
                          setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                        }
                      }}
                      onBlur={e => verificarCuentaDestino(e.target.value)}
                      placeholder={cuentaConfig.placeholder}
                      required
                      autoComplete="off"
                      className={`w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-mono tracking-wide transition-all duration-200 ${errors.cuenta_destino ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                    />
                  </div>
                </div>

                {/* Tipo de Tarjeta (cuando se selecciona Tarjeta) */}
                {formData.tipo_cuenta_destino === 'Tarjeta' && (
                  <div className="mt-6">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Tipo de Tarjeta *
                    </label>
                    <select
                      name="tipo_tarjeta"
                      value={formData.tipo_tarjeta}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50 max-w-xs"
                    >
                      <option value="" className="text-black">Selecciona tipo</option>
                      <option value="Débito" className="text-black">Débito</option>
                      <option value="Crédito" className="text-black">Crédito</option>
                    </select>
                  </div>
                )}

                {/* Estados de validación de cuenta destino */}
                <div className="mt-4 flex items-center gap-4">
                  {checkingCuenta && (
                    <span className="text-blue-300 text-sm flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Verificando cuenta...
                    </span>
                  )}
                  {cuentaValida === false && !checkingCuenta && (
                    <span className="text-red-400 text-sm">❌ Cuenta no válida</span>
                  )}
                  {cuentaValida === true && !checkingCuenta && (
                    <span className="text-green-400 text-sm">✅ Cuenta válida</span>
                  )}
                </div>
                {formData.cuenta_destino && errors.cuenta_destino && cuentaValida !== true && (
                  <span className="text-red-400 text-sm mt-1 block">{errors.cuenta_destino}</span>
                )}
              </div>

              {/* SECCIÓN 3: INFORMACIÓN DEL PAGO - 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tipo de Pago */}
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    Tipo de Pago
                  </label>
                  <select
                    name="tipo_pago"
                    value={formData.tipo_pago}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 hover:border-white/50"
                  >
                    <option value="" className="text-gray-900">Selecciona tipo de pago</option>
                    {tipoPagoOptions.map(tipo => (
                      <option key={tipo.value} value={tipo.value} className="text-gray-900">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha Límite */}
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha Límite de Pago *
                  </label>
                  <DatePicker
                    selected={fechaLimitePago}
                    onChange={(date: Date | null) => {
                      setFechaLimitePago(date);
                      dispatch({ type: 'SET_FIELD', field: 'fecha_limite_pago', value: formatDateForAPI(date) });
                      if (!date) {
                        setErrors((prev) => ({ ...prev, fecha_limite_pago: 'Este campo es obligatorio' }));
                      } else {
                        setErrors((prev) => ({ ...prev, fecha_limite_pago: undefined }));
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    placeholderText="Selecciona la fecha"
                    className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 ${errors.fecha_limite_pago ? 'border-red-400' : 'hover:border-white/50'}`}
                    calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                    locale={es}
                  />
                  {errors.fecha_limite_pago && <span className="text-red-400 text-sm mt-1 block">{errors.fecha_limite_pago}</span>}
                </div>

                {/* Descripción del tipo de pago (condicional) - Ocupa ambas columnas */}
                {formData.tipo_pago !== '' && (
                  <div className="lg:col-span-2">
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Descripción del tipo de pago
                    </label>
                    <textarea
                      name="tipo_pago_descripcion"
                      value={formData.tipo_pago_descripcion}
                      onChange={handleInputChange}
                      placeholder="Agrega una descripción para el tipo de pago..."
                      rows={3}
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base transition-all duration-200 hover:border-white/50"
                    />
                  </div>
                )}
              </div>

              {/* SECCIÓN 4: CONCEPTO - Ancho completo */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Concepto *
                </label>
                <textarea
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleInputChange}
                  placeholder="Describe detalladamente el concepto del pago..."
                  required
                  rows={4}
                  className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base transition-all duration-200 ${errors.concepto ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                />
                {errors.concepto && <span className="text-red-400 text-sm mt-1 block">{errors.concepto}</span>}
              </div>

              {/* SECCIÓN 5: INFORMACIÓN DEL BENEFICIARIO - 2 columnas */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-3" />
                  Información del Beneficiario
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Nombre de la persona (obligatorio) */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <span className="text-red-400">*</span> Nombre de la persona
                    </label>
                    <input
                      type="text"
                      name="nombre_persona"
                      value={formData.nombre_persona}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre completo de la persona"
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 ${errors.nombre_persona ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                    />
                    {errors.nombre_persona && <span className="text-red-400 text-sm mt-1 block">{errors.nombre_persona}</span>}
                  </div>

                  {/* Empresa (opcional) */}
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
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 hover:border-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: INFORMACIÓN DE TARJETA INSTITUCIONAL (CONDICIONAL) */}
              {formData.tipo_pago === 'tarjeta_institucional' && (
                <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <CreditCard className="w-6 h-6 mr-3" />
                    Información de Tarjeta Institucional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Link de Pago *
                      </label>
                      <input
                        type="url"
                        name="link_pago"
                        value={formData.link_pago}
                        onChange={handleInputChange}
                        placeholder="https://ejemplo.com/pago"
                        required
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Usuario de Acceso *
                      </label>
                      <input
                        type="text"
                        name="usuario_acceso"
                        value={formData.usuario_acceso}
                        onChange={handleInputChange}
                        placeholder="Usuario"
                        required
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Contraseña de Acceso *
                      </label>
                      <input
                        type="password"
                        name="contrasena_acceso"
                        value={formData.contrasena_acceso}
                        onChange={handleInputChange}
                        placeholder="Contraseña"
                        required
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 7: SEGUNDA FORMA DE PAGO (OPCIONAL) */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3" />
                  Segunda Forma de Pago (Opcional)
                </h3>
                
                <div className="mb-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tiene_segunda_forma_pago}
                      onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: e.target.checked })}
                      className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-white/90 text-base">Agregar segunda forma de pago</span>
                  </label>
                </div>

                {formData.tiene_segunda_forma_pago && (
                  <div className="space-y-8 border-t border-white/10 pt-8">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">Segunda Forma de Pago</h4>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: false });
                          dispatch({ type: 'SET_FIELD', field: 'tipo_cuenta_destino_2', value: 'CLABE' });
                          dispatch({ type: 'SET_FIELD', field: 'banco_destino_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'cuenta_destino_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'cuenta_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'link_pago_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'usuario_acceso_2', value: '' });
                          dispatch({ type: 'SET_FIELD', field: 'contrasena_acceso_2', value: '' });
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    {/* Información Bancaria 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Datos Bancarios *
                        </label>
                        <select
                          name="tipo_cuenta_destino_2"
                          value={formData.tipo_cuenta_destino_2}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                        >
                          <option value="CLABE" className="text-black">CLABE</option>
                          <option value="Tarjeta" className="text-black">Tarjeta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Banco (opcional)
                        </label>
                        <select
                          name="banco_destino_2"
                          value={formData.banco_destino_2}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                        >
                          <option value="" className="text-black">Selecciona banco</option>
                          {bancoOptions.map(banco => (
                            <option key={banco} value={banco} className="text-black">{banco}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Cuenta (opcional)
                        </label>
                        <input
                          type="text"
                          name="cuenta_2"
                          value={formData.cuenta_2}
                          onChange={handleInputChange}
                          placeholder="Número de cuenta"
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-base font-medium text-white/90 mb-3">
                          <CreditCard className="w-4 h-4 inline mr-2" />
                          Cuenta Destino *
                        </label>
                        <input
                          type="text"
                          name="cuenta_destino_2"
                          value={formData.cuenta_destino_2}
                          onChange={handleInputChange}
                          placeholder={formData.tipo_cuenta_destino_2 === 'Tarjeta' ? 'Número de tarjeta' : 'Número de cuenta CLABE'}
                          required
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-mono tracking-wide transition-all duration-200 hover:border-white/50"
                        />
                      </div>
                    </div>

                    {/* Tipo de Tarjeta 2 (cuando se selecciona Tarjeta) */}
                    {formData.tipo_cuenta_destino_2 === 'Tarjeta' && (
                      <div className="mb-6">
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Tipo de Tarjeta *
                        </label>
                        <select
                          name="tipo_tarjeta_2"
                          value={formData.tipo_tarjeta_2}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50 max-w-xs"
                        >
                          <option value="" className="text-black">Selecciona tipo</option>
                          <option value="Débito" className="text-black">Débito</option>
                          <option value="Crédito" className="text-black">Crédito</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECCIÓN 8: DOCUMENTOS - Ancho completo con previsualización mejorada */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Upload className="w-6 h-6 mr-3" />
                  Documentos
                </h3>
                <div>
                  <label className="block text-base font-medium text-white/90 mb-4">
                    Factura (opcional - solo si deseas cambiarla)
                    <span className="text-white/70 text-sm ml-2">(PDF, Excel, JPG, PNG - Máx. 5MB)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'factura_file')}
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40 text-base transition-all duration-200 ${errors.factura_file ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                    />
                  </div>
                  
                  {/* Previsualización mejorada */}
                  {formData.factura_file ? (
                    <div className="mt-6 p-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-green-500/20 border border-green-400/30">
                          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-white font-semibold text-lg">
                                {formData.factura_file.name}
                              </p>
                              <p className="text-white/70 text-sm">
                                {formData.factura_file.type === 'application/pdf' && '📄 Documento PDF'}
                                {formData.factura_file.type.includes('excel') && '📊 Archivo Excel'}
                                {formData.factura_file.type.startsWith('image/') && '🖼️ Imagen'}
                              </p>
                            </div>
                            <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                              {(formData.factura_file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          
                          {/* Previsualización según tipo */}
                          {formData.factura_file.type.startsWith('image/') && (
                            <div className="mt-4 w-64 h-48 relative bg-white/10 rounded-lg overflow-hidden border border-white/20">
                              <Image
                                src={URL.createObjectURL(formData.factura_file)}
                                alt="Previsualización"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          
                          {(formData.factura_file.type === 'application/pdf' || formData.factura_file.type.includes('excel')) && (
                            <div className="mt-4 flex items-center space-x-4 p-4 bg-white/10 rounded-lg border border-white/20">
                              <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                                <Upload className="w-8 h-8 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-white font-semibold">Nuevo archivo listo</p>
                                <p className="text-white/70 text-sm">
                                  {formData.factura_file.type === 'application/pdf' ? 'Documento PDF' : 'Archivo Excel'} seleccionado
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : facturaUrl ? (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-400/20 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-blue-500/20 border border-blue-400/30">
                          <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-3">
                            <p className="text-white font-semibold text-lg">Factura actual</p>
                            <p className="text-blue-300 text-sm">Archivo existente en el sistema</p>
                          </div>
                          
                          {/* Previsualización según tipo */}
                          {(() => {
                            const ext = facturaUrl.split('.').pop()?.toLowerCase();
                            if (["png", "jpg", "jpeg"].includes(ext || "")) {
                              return (
                                <div className="mt-4 w-64 h-48 relative bg-white/10 rounded-lg overflow-hidden border border-blue-400/20">
                                  <Image
                                    src={facturaLink!}
                                    alt="Factura actual"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              );
                            }
                            if (ext === "pdf") {
                              return (
                                <div className="mt-4 flex items-center space-x-4 p-4 bg-white/10 rounded-lg border border-blue-400/20">
                                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/30">
                                    <Upload className="w-8 h-8 text-red-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">Documento PDF</p>
                                    <a href={facturaLink!} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline text-sm">Ver documento actual</a>
                                  </div>
                                </div>
                              );
                            }
                            if (["xls", "xlsx"].includes(ext || "")) {
                              return (
                                <div className="mt-4 flex items-center space-x-4 p-4 bg-white/10 rounded-lg border border-blue-400/20">
                                  <div className="p-3 rounded-lg bg-green-500/20 border border-green-400/30">
                                    <Upload className="w-8 h-8 text-green-400" />
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">Archivo Excel</p>
                                    <a href={facturaLink!} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline text-sm">Descargar archivo actual</a>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <a href={facturaLink!} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline text-sm block mt-3">Ver factura actual</a>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {errors.factura_file && <span className="text-red-400 text-sm mt-2 block">{errors.factura_file}</span>}
                </div>
              </div>

              {/* Botones mejorados */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/solicitante/mis-solicitudes')}
                  className="bg-gray-600/80 text-white border-gray-500 hover:bg-gray-700 hover:scale-105 px-8 py-4 text-base font-medium transition-all duration-200 backdrop-blur-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.departamento ||
                    !formData.monto ||
                    !formData.cuenta_destino ||
                    !formData.concepto ||
                    !formData.fecha_limite_pago ||
                    !formData.nombre_persona ||
                    cuentaValida === false ||
                    checkingCuenta
                  }
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 shadow-xl border-0 px-10 py-4 font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Guardando cambios...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
