'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SolicitudesService } from '@/services/solicitudes.service';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { NumericFormat } from 'react-number-format';
import Image from 'next/image';
import { 
  FileText, 
  Upload, 
  Save, 
  Calendar, 
  Building2, 
  User, 
  CreditCard, 
  CheckCircle, 
  X,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';

// Tipos expandidos para incluir todos los campos del formulario de crear
interface FormState {
  // Campos básicos
  departamento: string;
  monto: string;
  moneda: string;
  tipo_moneda: 'MXN' | 'USD';
  concepto: string;
  tipo_concepto: 'producto' | 'servicio' | 'otro';
  fecha_limite_pago: Date | null;
  nombre_persona: string;
  
  // Campos del formulario de crear que no estaban en editar
  referencia: string;
  
  // Información bancaria principal
  tipo_pago: 'cuenta' | 'tarjeta_institucional';
  tipo_cuenta_destino: 'CLABE' | 'Tarjeta';
  banco_destino: string;
  cuenta_destino: string;
  tipo_tarjeta: string;
  cuenta: string;
  
  // Campos específicos de tarjeta institucional
  link_pago: string;
  usuario_acceso: string;
  contrasena_acceso: string;
  
  // Segunda forma de pago
  tiene_segunda_forma_pago: boolean;
  tipo_cuenta_destino_2: 'CLABE' | 'Tarjeta';
  banco_destino_2: string;
  cuenta_destino_2: string;
  tipo_tarjeta_2: string;
  cuenta_2: string;
  link_pago_2: string;
  usuario_acceso_2: string;
  contrasena_acceso_2: string;
  
  // Archivos
  factura_file: File | null;
  archivos_adicionales: File[];
  tipos_archivos_adicionales: string[];
  
  // Observaciones
  observaciones: string;
}

// Tipos para las acciones del reducer
type FormAction = 
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | number | boolean | Date | File | null }
  | { type: 'SET_MULTIPLE_FIELDS'; fields: Partial<FormState> }
  | { type: 'RESET_SEGUNDA_FORMA_PAGO' }
  | { type: 'ADD_ARCHIVO_ADICIONAL'; file: File }
  | { type: 'REMOVE_ARCHIVO_ADICIONAL'; index: number }
  | { type: 'UPDATE_TIPO_ARCHIVO_ADICIONAL'; index: number; tipo: string };

// Reducer para manejar el estado del formulario
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_MULTIPLE_FIELDS':
      return { ...state, ...action.fields };
    case 'RESET_SEGUNDA_FORMA_PAGO':
      return {
        ...state,
        tiene_segunda_forma_pago: false,
        tipo_cuenta_destino_2: 'CLABE',
        banco_destino_2: '',
        cuenta_destino_2: '',
        tipo_tarjeta_2: '',
        cuenta_2: '',
        link_pago_2: '',
        usuario_acceso_2: '',
        contrasena_acceso_2: ''
      };
    case 'ADD_ARCHIVO_ADICIONAL':
      return {
        ...state,
        archivos_adicionales: [...state.archivos_adicionales, action.file],
        tipos_archivos_adicionales: [...state.tipos_archivos_adicionales, 'documento']
      };
    case 'REMOVE_ARCHIVO_ADICIONAL':
      const newArchivos = state.archivos_adicionales.filter((_, index) => index !== action.index);
      const newTipos = state.tipos_archivos_adicionales.filter((_, index) => index !== action.index);
      return {
        ...state,
        archivos_adicionales: newArchivos,
        tipos_archivos_adicionales: newTipos
      };
    case 'UPDATE_TIPO_ARCHIVO_ADICIONAL':
      const updatedTipos = [...state.tipos_archivos_adicionales];
      updatedTipos[action.index] = action.tipo;
      return {
        ...state,
        tipos_archivos_adicionales: updatedTipos
      };
    default:
      return state;
  }
}

const initialFormState: FormState = {
  departamento: '',
  monto: '',
  moneda: '',
  tipo_moneda: 'MXN',
  concepto: '',
  tipo_concepto: 'producto',
  fecha_limite_pago: null,
  nombre_persona: '',
  referencia: '',
  tipo_pago: 'cuenta',
  tipo_cuenta_destino: 'CLABE',
  banco_destino: '',
  cuenta_destino: '',
  tipo_tarjeta: '',
  cuenta: '',
  link_pago: '',
  usuario_acceso: '',
  contrasena_acceso: '',
  tiene_segunda_forma_pago: false,
  tipo_cuenta_destino_2: 'CLABE',
  banco_destino_2: '',
  cuenta_destino_2: '',
  tipo_tarjeta_2: '',
  cuenta_2: '',
  link_pago_2: '',
  usuario_acceso_2: '',
  contrasena_acceso_2: '',
  factura_file: null,
  archivos_adicionales: [],
  tipos_archivos_adicionales: [],
  observaciones: ''
};

interface ArchivoExistente {
  id: number;
  archivo_url: string;
  tipo: string;
  nombre_archivo?: string;
}

// Tipos para errores de validación
interface FormErrors {
  factura_file?: string;
  [key: string]: string | undefined;
}

export default function EditarSolicitudPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, dispatch] = useReducer(formReducer, initialFormState);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [cuentaValida, setCuentaValida] = useState<boolean | null>(null);
  const [checkingCuenta, setCheckingCuenta] = useState(false);
  const [facturaUrl, setFacturaUrl] = useState<string | null>(null);
  const [facturaLink, setFacturaLink] = useState<string | null>(null);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoExistente[]>([]);

  // Opciones para departamentos y bancos
  const departamentosOptions = [
    'Tecnologías de la Información',
    'Recursos Humanos',
    'Contabilidad',
    'Operaciones',
    'Ventas',
    'Marketing',
    'Administración',
    'Logística',
    'Compras',
    'Mantenimiento'
  ];

  const bancoOptions = [
    'BBVA México',
    'Banamex',
    'Santander',
    'Banorte',
    'HSBC',
    'Scotiabank',
    'Inbursa',
    'Azteca',
    'Afirme',
    'BanBajío',
    'Banco del Bajío',
    'Banco Multiva',
    'Banco Autofin',
    'Banco Compartamos',
    'Hey Banco',
    'Nu México',
    'Klar',
    'Otro'
  ];

  // Cargar datos de la solicitud
  useEffect(() => {
    const cargarSolicitud = async () => {
      if (!params?.id) return;
      
      try {
        setLoadingData(true);
        const solicitudData = await SolicitudesService.getById(Number(params.id));
        
        // Mapear datos de la respuesta al estado del formulario (solo campos existentes)
        dispatch({ 
          type: 'SET_MULTIPLE_FIELDS', 
          fields: {
            departamento: solicitudData.departamento || '',
            monto: solicitudData.monto?.toString() || '',
            concepto: solicitudData.concepto || '',
            fecha_limite_pago: solicitudData.fecha_limite_pago ? new Date(solicitudData.fecha_limite_pago) : null,
            nombre_persona: solicitudData.nombre_persona || '',
            tipo_cuenta_destino: (solicitudData.tipo_cuenta_destino as 'CLABE' | 'Tarjeta') || 'CLABE',
            banco_destino: solicitudData.banco_destino || '',
            cuenta_destino: solicitudData.cuenta_destino || '',
            tipo_tarjeta: solicitudData.tipo_tarjeta || '',
            cuenta: solicitudData.cuenta || '',
            tiene_segunda_forma_pago: Boolean(solicitudData.cuenta_destino_2),
            tipo_cuenta_destino_2: (solicitudData.tipo_cuenta_destino_2 as 'CLABE' | 'Tarjeta') || 'CLABE',
            banco_destino_2: solicitudData.banco_destino_2 || '',
            cuenta_destino_2: solicitudData.cuenta_destino_2 || '',
            tipo_tarjeta_2: solicitudData.tipo_tarjeta_2 || '',
            cuenta_2: solicitudData.cuenta_2 || ''
          }
        });

        // Configurar URL de factura
        if (solicitudData.factura_url) {
          setFacturaUrl(solicitudData.factura_url);
          setFacturaLink(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${solicitudData.factura_url}`);
        }
      } catch (error) {
        console.error('Error al cargar solicitud:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (params?.id) {
      cargarSolicitud();
    }
  }, [params?.id]);

  // Validaciones
  const validateCuenta = useCallback(async (cuenta: string, tipo: string) => {
    if (!cuenta) {
      setCuentaValida(null);
      return;
    }

    setCheckingCuenta(true);
    
    try {
      // Validación básica de formato
      if (tipo === 'CLABE') {
        if (cuenta.length === 18 && /^\d+$/.test(cuenta)) {
          setCuentaValida(true);
        } else {
          setCuentaValida(false);
        }
      } else if (tipo === 'Tarjeta') {
        if (cuenta.length >= 13 && cuenta.length <= 19 && /^\d+$/.test(cuenta)) {
          setCuentaValida(true);
        } else {
          setCuentaValida(false);
        }
      }
    } catch {
      setCuentaValida(false);
    } finally {
      setCheckingCuenta(false);
    }
  }, []);

  useEffect(() => {
    if (formData.cuenta_destino) {
      validateCuenta(formData.cuenta_destino, formData.tipo_cuenta_destino);
    }
  }, [formData.cuenta_destino, formData.tipo_cuenta_destino, validateCuenta]);

  // Manejadores de eventos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, [field]: 'El archivo debe ser menor a 5MB' });
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, [field]: 'Tipo de archivo no permitido' });
        return;
      }

      dispatch({ type: 'SET_FIELD', field: field as keyof FormState, value: file });
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleArchivoAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size <= 5 * 1024 * 1024) {
        dispatch({ type: 'ADD_ARCHIVO_ADICIONAL', file });
      }
    });
  };

  const removeArchivoAdicional = (index: number) => {
    dispatch({ type: 'REMOVE_ARCHIVO_ADICIONAL', index });
  };

  const updateTipoArchivoAdicional = (index: number, tipo: string) => {
    dispatch({ type: 'UPDATE_TIPO_ARCHIVO_ADICIONAL', index, tipo });
  };

  const removeArchivoExistente = async (archivoId: number) => {
    try {
      // Placeholder para cuando esté disponible el servicio
      console.log('Eliminar archivo:', archivoId);
      setArchivosExistentes(prev => prev.filter(archivo => archivo.id !== archivoId));
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.id) return;
    
    setLoading(true);

    try {
      // Preparar datos para actualizar (solo campos que soporta el backend actual)
      const updateData = {
        departamento: formData.departamento,
        monto: parseFloat(formData.monto),
        cuenta_destino: formData.cuenta_destino,
        concepto: formData.concepto,
        tipo_pago: formData.tipo_pago,
        fecha_limite_pago: formData.fecha_limite_pago?.toISOString().split('T')[0] || '',
        nombre_persona: formData.nombre_persona,
        tipo_cuenta_destino: formData.tipo_cuenta_destino,
        banco_destino: formData.banco_destino,
        tipo_tarjeta: formData.tipo_tarjeta,
        cuenta: formData.cuenta
      };

      // Usar update regular en lugar de updateWithFiles por ahora
      await SolicitudesService.update(Number(params.id), updateData);

      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (error) {
      console.error('Error al actualizar solicitud:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <SolicitanteLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
              </div>
            </div>
          </div>
        </SolicitanteLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SolicitanteLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <button
                  onClick={() => router.push('/dashboard/solicitante/mis-solicitudes')}
                  className="absolute left-0 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-4xl font-bold text-white">Editar Solicitud</h1>
              </div>
              <p className="text-xl text-white/80">Actualiza la información de tu solicitud de pago</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 max-w-full">
              {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Building2 className="w-6 h-6 mr-3" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      🏢 Departamento *
                    </label>
                    <select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    >
                      <option value="" className="text-black">Selecciona departamento</option>
                      {departamentosOptions.map(dept => (
                        <option key={dept} value={dept} className="text-black">{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      💰 Monto y Moneda *
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <NumericFormat
                          name="monto"
                          value={formData.monto}
                          onValueChange={(values) => {
                            dispatch({ type: 'SET_FIELD', field: 'monto', value: values.value });
                          }}
                          thousandSeparator=","
                          decimalSeparator="."
                          prefix={formData.tipo_moneda === 'USD' ? '$' : '$'}
                          placeholder="0.00"
                          allowNegative={false}
                          decimalScale={2}
                          required
                          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-semibold transition-all duration-200 hover:border-white/50"
                        />
                      </div>
                      <select
                        name="tipo_moneda"
                        value={formData.tipo_moneda}
                        onChange={handleInputChange}
                        className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                      >
                        <option value="MXN" className="text-black">MXN</option>
                        <option value="USD" className="text-black">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      📋 Tipo de Concepto *
                    </label>
                    <select
                      name="tipo_concepto"
                      value={formData.tipo_concepto}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    >
                      <option value="producto" className="text-black">Producto</option>
                      <option value="servicio" className="text-black">Servicio</option>
                      <option value="otro" className="text-black">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      📝 Referencia (Opcional)
                    </label>
                    <input
                      type="text"
                      name="referencia"
                      value={formData.referencia}
                      onChange={handleInputChange}
                      placeholder="Número de referencia o identificador"
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CONCEPTO Y FECHAS */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Calendar className="w-6 h-6 mr-3" />
                  Concepto y Fechas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      📄 Concepto *
                    </label>
                    <textarea
                      name="concepto"
                      value={formData.concepto}
                      onChange={handleInputChange}
                      placeholder={
                        formData.tipo_concepto === 'producto' 
                          ? "Describe el producto que se va a adquirir..."
                          : formData.tipo_concepto === 'servicio'
                          ? "Describe el servicio que se va a contratar..."
                          : "Describe el concepto del pago..."
                      }
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      📅 Fecha Límite de Pago *
                    </label>
                    <div className="relative">
                      <DatePicker
                        selected={formData.fecha_limite_pago}
                        onChange={(date) => dispatch({ type: 'SET_FIELD', field: 'fecha_limite_pago', value: date })}
                        dateFormat="dd/MM/yyyy"
                        minDate={new Date()}
                        placeholderText="Selecciona fecha límite"
                        required
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: BENEFICIARIO */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <User className="w-6 h-6 mr-3" />
                  Información del Beneficiario
                </h3>
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    👤 Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre_persona"
                    value={formData.nombre_persona}
                    onChange={handleInputChange}
                    placeholder="Nombre completo del beneficiario"
                    required
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50"
                  />
                </div>
              </div>

              {/* SECCIÓN 4: INFORMACIÓN BANCARIA */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3" />
                  Información Bancaria
                </h3>
                
                <div className="mb-6">
                  <label className="block text-base font-medium text-white/90 mb-4">
                    💳 Tipo de Pago *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200">
                      <input
                        type="radio"
                        name="tipo_pago"
                        value="cuenta"
                        checked={formData.tipo_pago === 'cuenta'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-white/90">💳 Cuenta Bancaria/Tarjeta</span>
                    </label>
                    <label className="flex items-center p-4 bg-white/10 rounded-lg border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200">
                      <input
                        type="radio"
                        name="tipo_pago"
                        value="tarjeta_institucional"
                        checked={formData.tipo_pago === 'tarjeta_institucional'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-3 text-white/90">🏢 Tarjeta Institucional</span>
                    </label>
                  </div>
                </div>

                {formData.tipo_pago === 'cuenta' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    </div>

                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Cuenta Destino *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="cuenta_destino"
                          value={formData.cuenta_destino}
                          onChange={handleInputChange}
                          placeholder={formData.tipo_cuenta_destino === 'Tarjeta' ? 'Número de tarjeta' : 'Número de cuenta CLABE'}
                          required
                          className={`w-full px-4 py-3 bg-white/20 backdrop-blur-sm border rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-mono tracking-wide transition-all duration-200 ${
                            cuentaValida === false 
                              ? 'border-red-400 focus:ring-red-400' 
                              : cuentaValida === true 
                              ? 'border-green-400 focus:ring-green-400' 
                              : 'border-white/30 hover:border-white/50'
                          }`}
                        />
                        
                        {checkingCuenta && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        )}
                        
                        {!checkingCuenta && cuentaValida === true && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                        )}
                        
                        {!checkingCuenta && cuentaValida === false && (
                          <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400" />
                        )}
                      </div>
                      
                      {cuentaValida === false && (
                        <p className="text-red-400 text-sm mt-2">
                          {formData.tipo_cuenta_destino === 'CLABE' 
                            ? 'La CLABE debe tener exactamente 18 dígitos'
                            : 'El número de tarjeta debe tener entre 13 y 19 dígitos'
                          }
                        </p>
                      )}
                    </div>

                    {formData.tipo_cuenta_destino === 'Tarjeta' && (
                      <div>
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
                  </div>
                )}

                {formData.tipo_pago === 'tarjeta_institucional' && (
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
                )}
              </div>

              {/* SECCIÓN 5: SEGUNDA FORMA DE PAGO */}
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
                        onClick={() => dispatch({ type: 'RESET_SEGUNDA_FORMA_PAGO' })}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                    
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
                    </div>

                    <div>
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

                    {formData.tipo_cuenta_destino_2 === 'Tarjeta' && (
                      <div>
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

              {/* SECCIÓN 6: DOCUMENTOS */}
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
                  
                  {/* Previsualización de nueva factura */}
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

                {/* Archivos Adicionales */}
                <div className="mt-8 border-t border-white/10 pt-8">
                  <label className="block text-base font-medium text-white/90 mb-4">
                    📎 Archivos Adicionales (Opcional)
                    <span className="text-white/70 text-sm ml-2">(PDF, Excel, JPG, PNG - Máx. 5MB c/u)</span>
                  </label>
                  
                  {/* Botón para agregar archivos */}
                  <div className="mb-6">
                    <input
                      type="file"
                      id="archivos-adicionales"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleArchivoAdicionalChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="archivos-adicionales"
                      className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all duration-200 cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Agregar Archivos
                    </label>
                  </div>

                  {/* Lista de archivos existentes */}
                  {archivosExistentes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-4">Archivos existentes:</h4>
                      <div className="space-y-4">
                        {archivosExistentes.map((archivo, index) => (
                          <div key={index} className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-400/20 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 rounded-full bg-blue-500/20 border border-blue-400/30">
                                  <FileText className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{archivo.archivo_url.split('/').pop()}</p>
                                  <p className="text-blue-300 text-sm">Tipo: {archivo.tipo}</p>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => removeArchivoExistente(archivo.id)}
                                className="ml-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lista de archivos adicionales nuevos */}
                  {formData.archivos_adicionales.length > 0 && (
                    <div className="space-y-4">
                      {formData.archivos_adicionales.map((archivo, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-2 rounded-full bg-blue-500/20 border border-blue-400/30">
                                <FileText className="w-5 h-5 text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{archivo.name}</p>
                                <p className="text-white/70 text-sm">
                                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              
                              <select
                                value={formData.tipos_archivos_adicionales[index] || 'documento'}
                                onChange={(e) => updateTipoArchivoAdicional(index, e.target.value)}
                                className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-sm"
                              >
                                <option value="documento" className="bg-blue-900 text-white">Documento</option>
                                <option value="comprobante" className="bg-blue-900 text-white">Comprobante</option>
                                <option value="contrato" className="bg-blue-900 text-white">Contrato</option>
                                <option value="identificacion" className="bg-blue-900 text-white">Identificación</option>
                                <option value="otro" className="bg-blue-900 text-white">Otro</option>
                              </select>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeArchivoAdicional(index)}
                              className="ml-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 7: OBSERVACIONES */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <label className="block text-base font-medium text-white/90 mb-3">
                  💬 Observaciones (Opcional)
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  placeholder="Información adicional sobre la solicitud..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm transition-all duration-200 hover:border-white/50 resize-none"
                />
              </div>

              {/* BOTÓN DE ENVÍO */}
              <div className="flex justify-center pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6 mr-3" />
                      Actualizar Solicitud
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
