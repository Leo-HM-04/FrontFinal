'use client';

import { useState, useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare, CheckCircle, X } from 'lucide-react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { SolicitudArchivosService } from '@/services/solicitudArchivos.service';
import { SolicitudesN09TokaService } from '@/services/solicitudesN09Toka.service';
import SolicitudN09TokaArchivosService from '@/services/solicitudN09TokaArchivos.service';
import { toast } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';
import { formatDateForAPI } from '@/utils/dateUtils';

// Importaciones para plantillas
import { SelectorPlantillas } from '@/components/plantillas/SelectorPlantillas';
import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { obtenerPlantillasActivas, obtenerPlantillasInactivas } from '@/data/plantillas';

// Reducer para manejar el formulario
type FormState = {
  departamento: string;
  monto: string;
  tipo_moneda: string;
  cuenta_destino: string;
  concepto: string;
  tipo_concepto: string;
  referencia: string; // Nuevo campo para referencia
  tipo_pago: string;
  tipo_pago_descripcion: string;
  empresa_a_pagar: string;
  nombre_persona: string;
  fecha_limite_pago: string;
  factura_file: File | null;
  archivos_adicionales: File[];
  tipos_archivos_adicionales: string[];
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
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | File | null | boolean | File[] | string[] }
  | { type: 'ADD_ARCHIVO_ADICIONAL'; archivo: File; tipo: string }
  | { type: 'REMOVE_ARCHIVO_ADICIONAL'; index: number };

const initialState: FormState = {
  departamento: '',
  monto: '',
  tipo_moneda: 'MXN',
  cuenta_destino: '',
  concepto: '',
  tipo_concepto: 'pago_factura',
  referencia: '', // Nuevo campo para referencia
  tipo_pago: 'transferencia',
  tipo_pago_descripcion: '',
  empresa_a_pagar: '',
  nombre_persona: '',
  fecha_limite_pago: '',
  factura_file: null,
  archivos_adicionales: [],
  tipos_archivos_adicionales: [],
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

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'ADD_ARCHIVO_ADICIONAL':
      return {
        ...state,
        archivos_adicionales: [...state.archivos_adicionales, action.archivo],
        tipos_archivos_adicionales: [...state.tipos_archivos_adicionales, action.tipo]
      };
    case 'REMOVE_ARCHIVO_ADICIONAL':
      return {
        ...state,
        archivos_adicionales: state.archivos_adicionales.filter((_, i) => i !== action.index),
        tipos_archivos_adicionales: state.tipos_archivos_adicionales.filter((_, i) => i !== action.index)
      };
    default:
      return state;
  }
};

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [fechaLimitePago, setFechaLimitePago] = useState<Date | null>(null);
  const [cuentaValida, setCuentaValida] = useState<null | boolean>(null);
  const [checkingCuenta, setCheckingCuenta] = useState(false);
  const [errors, setErrors] = useState<Record<keyof FormState | string, string | undefined>>({});
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Hook para manejo de plantillas
  const {
    estado: estadoPlantilla,
    seleccionarPlantilla,
    actualizarCampo,
    validarFormulario: validarFormularioPlantilla,
    obtenerDatosParaEnvio
  } = usePlantillaSolicitud();

  // Obtener plantillas activas
  const plantillasActivas = obtenerPlantillasActivas();
  const plantillasInactivas = obtenerPlantillasInactivas();

  // Estado para controlar si se usa plantilla o formulario estándar
  const usandoPlantilla = estadoPlantilla.plantillaSeleccionada !== null;

  // Limpiar campos cuando cambie tipo_concepto
  useEffect(() => {
    if (formData.tipo_concepto !== 'otro') {
      dispatch({ type: 'SET_FIELD', field: 'concepto', value: '' });
    }
    if (formData.tipo_concepto !== 'referencia') {
      dispatch({ type: 'SET_FIELD', field: 'referencia', value: '' });
    }
  }, [formData.tipo_concepto]);

  // Función para obtener estilos de campo con errores más visuales
  const getFieldStyles = (fieldName: string, baseStyles: string) => {
    const hasError = errors[fieldName];
    const isEmptyRequired = isFormSubmitted && !formData[fieldName as keyof FormState];
    
    if (hasError || isEmptyRequired) {
      return `${baseStyles} border-red-500 bg-red-50/10 ring-2 ring-red-500/30 shadow-lg shadow-red-500/25 animate-pulse`;
    }
    
    return `${baseStyles} hover:border-white/50 focus:border-white/70`;
  };

  // Función para obtener estilos de labels con campos requeridos
  const getLabelStyles = (fieldName: string, required: boolean = false) => {
    const hasError = errors[fieldName];
    const isEmptyRequired = isFormSubmitted && required && !formData[fieldName as keyof FormState];
    
    if (hasError || isEmptyRequired) {
      return "block text-base font-bold text-red-400 mb-3 animate-pulse";
    }
    
    return "block text-base font-medium text-white/90 mb-3";
  };

  // Configuración dinámica para cuenta destino
  let cuentaConfig;
  if (formData.tipo_cuenta_destino === 'Número de Tarjeta') {
    cuentaConfig = {
      placeholder: 'Número de tarjeta',
      errorMsg: 'Ingresa un número de tarjeta válido.',
      required: true
    };
  } else if (formData.tipo_cuenta_destino === 'Tarjeta Institucional') {
    cuentaConfig = {
      placeholder: 'Opcional',
      errorMsg: '',
      required: false
    };
  } else if (formData.tipo_cuenta_destino === 'Cuenta') {
    cuentaConfig = {
      placeholder: 'Número de cuenta (8 a 10 dígitos)',
      errorMsg: 'Ingresa un número de cuenta válido.',
      required: true
    };
  } else {
    cuentaConfig = {
      placeholder: 'Número de cuenta CLABE (16 o 18 dígitos)',
      errorMsg: 'Ingresa un número de cuenta CLABE válido.',
      required: true
    };
  }

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
    { value: 'direccion general', label: 'Dirección General' },
    { value: 'asuntos corporativos', label: 'Asuntos Corporativos' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'juridico', label: 'Jurídico' }
  ];

  const tipoPagoOptions = [
    { value: 'proveedores', label: 'Proveedores' },  
    { value: 'poliza_seguro', label: 'Poliza - Seguro' },
    { value: 'Dirección General', label: 'Dirección General' },
    { value: 'Donativos', label: 'Donativos' },
    { value: 'Operativos', label: 'Operativos' },
    { value: 'Fiscales legales y corporativos', label: 'Fiscales legales y corporativos' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
    
    // Limpiar tipo_tarjeta cuando se cambie tipo_cuenta_destino
    if (name === 'tipo_cuenta_destino' && value !== 'Número de Tarjeta') {
      dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta', value: '' });
    }
    
    // Limpiar tipo_tarjeta_2 cuando se cambie tipo_cuenta_destino_2
    if (name === 'tipo_cuenta_destino_2' && value !== 'Número de Tarjeta') {
      dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta_2', value: '' });
    }
    
    // Limpiar error en tiempo real cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  // Validación para archivos adjuntos estándar (máx 5MB)
  const validateFile = (file: File) => {
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
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
      return false;
    }
    return true;
  };

  // Validación para archivos adjuntos de TUKASH (máx 10MB)
  const validateFileTukash = (file: File) => {
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
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera el límite de 10MB. Por favor selecciona archivos más pequeños.');
      return false;
    }
    return true;
  };

  const validateFileN09Toka = (file: File) => {
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
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB para esta plantilla.');
      return false;
    }
    return true;
  };

  // Funciones para manejar archivos adicionales
  const handleArchivoAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    let valid = true;
    files.forEach(file => {
      // Si la plantilla seleccionada es TUKASH, usar la validación especial
      if (usandoPlantilla && estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-tukash') {
        if (!validateFileTukash(file)) {
          valid = false;
          return;
        }
      } else {
        if (!validateFile(file)) {
          valid = false;
          return;
        }
      }
      dispatch({ 
        type: 'ADD_ARCHIVO_ADICIONAL', 
        archivo: file, 
        tipo: 'documento' 
      });
    });
    if (!valid) {
      setErrors((prev) => ({ ...prev, archivos_adicionales: 'Uno o más archivos superan el límite de 10MB o no son válidos.' }));
    } else if (files.length > 0) {
      setErrors((prev) => ({ ...prev, archivos_adicionales: undefined }));
    }
    e.target.value = '';
  };

  const removeArchivoAdicional = (index: number) => {
    dispatch({ type: 'REMOVE_ARCHIVO_ADICIONAL', index });
    
    // Si después de eliminar no quedan archivos, mostrar error
    if (formData.archivos_adicionales.length <= 1) {
      setErrors((prev) => ({ ...prev, archivos_adicionales: 'Debe subir al menos un documento' }));
    }
  };

  const updateTipoArchivoAdicional = (index: number, tipo: string) => {
    const nuevos_tipos = [...formData.tipos_archivos_adicionales];
    nuevos_tipos[index] = tipo;
    dispatch({ type: 'SET_FIELD', field: 'tipos_archivos_adicionales', value: nuevos_tipos });
  };

  // Simulación de verificación de cuenta (reemplaza por tu API real si existe)
  const verificarCuentaDestino = async (cuenta: string) => {
    setCheckingCuenta(true);
    setCuentaValida(null);
    try {
      // Aquí deberías hacer una petición real a tu backend para validar la cuenta
      // Por ejemplo: const res = await fetch(`/api/cuentas/validar?cuenta=${cuenta}`);
      // const data = await res.json();
      // setCuentaValida(data.valida);
      await new Promise(r => setTimeout(r, 700)); // Simula delay
      setCuentaValida(cuenta.length >= 8); // Ejemplo: válida si tiene 8+ caracteres
    } catch {
      setCuentaValida(false);
    } finally {
      setCheckingCuenta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsFormSubmitted(true);

    // Si se está usando la plantilla N09/TOKA, validar archivos antes de enviar
    if (usandoPlantilla && estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-n09-toka') {
      const archivos = Array.isArray(estadoPlantilla.datos.archivos_adjuntos)
        ? estadoPlantilla.datos.archivos_adjuntos as File[]
        : [];
      const archivosInvalidos = archivos.filter(file => !validateFileN09Toka(file));
      if (archivosInvalidos.length > 0) {
        toast.error('Uno o más archivos son demasiado pesados o no permitidos. Corrige antes de crear la solicitud.');
        setLoading(false);
        return;
      }
    }

    // Si se está usando una plantilla, validar con el sistema de plantillas
    if (usandoPlantilla) {
      if (!validarFormularioPlantilla()) {
        setLoading(false);
        toast.error('Por favor corrige los errores en el formulario');
        return;
      }

      try {
        const datosPlantilla = obtenerDatosParaEnvio();
        if (!datosPlantilla) {
          throw new Error('Error al obtener datos de la plantilla');
        }

        // Debug: mostrar datos de la plantilla antes del procesamiento
        console.log('🔍 [DEBUG MONTO] Datos de estadoPlantilla.datos:', estadoPlantilla.datos);
        console.log('🔍 [DEBUG MONTO] Monto encontrado:', estadoPlantilla.datos.monto);
        console.log('🔍 [DEBUG MONTO] Tipo de monto:', typeof estadoPlantilla.datos.monto);

        // Procesar archivos de la plantilla
        let archivosParaSubir: File[] = [];
  // console.log('Verificando archivos en estadoPlantilla.datos:', estadoPlantilla.datos);
        
        if (estadoPlantilla.datos.archivos_adjuntos && Array.isArray(estadoPlantilla.datos.archivos_adjuntos)) {
          archivosParaSubir = estadoPlantilla.datos.archivos_adjuntos;
          // console.log('Archivos encontrados:', archivosParaSubir.length, archivosParaSubir.map(f => f.name));
        } else {
          // console.log('No se encontraron archivos o no es un array:', estadoPlantilla.datos.archivos_adjuntos);
        }

        // Validar que hay al menos un archivo
        if (archivosParaSubir.length === 0) {
          // console.error('No hay archivos para subir. Datos completos:', estadoPlantilla.datos);
          throw new Error('Debe adjuntar al menos un archivo para la plantilla');
        }

        // Preparar datos para el nuevo servicio de plantillas
        const solicitudPlantillaData = {
          // Datos básicos de la solicitud - mapeo dinámico según la plantilla
          departamento: 'Finanzas',
          monto: (() => {
            // Proceso más robusto para obtener el monto
            const montoRaw = estadoPlantilla.datos.monto_total_cliente || 
                            estadoPlantilla.datos.monto || 
                            estadoPlantilla.datos.monto_total || 
                            '0';
            
            console.log('🔍 [DEBUG MONTO] Monto raw:', montoRaw, 'tipo:', typeof montoRaw);
            
            // Convertir a string limpio
            let montoString = String(montoRaw);
            
            // Si viene con formato de moneda, limpiarlo
            if (typeof montoRaw === 'string') {
              montoString = montoRaw.replace(/[$,\s]/g, '');
            }
            
            console.log('🔍 [DEBUG MONTO] Monto procesado:', montoString);
            return montoString;
          })(),
          tipo_moneda: String(estadoPlantilla.datos.moneda || 'MXN'),
          cuenta_destino: String(
            estadoPlantilla.datos.numero_tarjeta ||
            estadoPlantilla.datos.numero_cuenta || 
            ''
          ),
          concepto: `${estadoPlantilla.datos.asunto || 'Plantilla'} - ${
            estadoPlantilla.datos.beneficiario_tarjeta ||
            estadoPlantilla.datos.beneficiario || 
            estadoPlantilla.datos.cliente ||
            'Sin beneficiario'
          }`,
          tipo_pago: estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-tukash' ? 'tarjeta' : 'transferencia',
          tipo_cuenta_destino: estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-tukash' 
            ? 'Número de Tarjeta' 
            : String(estadoPlantilla.datos.tipo_cuenta || 'CLABE'),
          banco_destino: String(estadoPlantilla.datos.banco_destino || ''),
          nombre_persona: String(
            estadoPlantilla.datos.beneficiario_tarjeta ||
            estadoPlantilla.datos.beneficiario || 
            estadoPlantilla.datos.cliente ||
            ''
          ),
          empresa_a_pagar: String(
            estadoPlantilla.datos.cliente ||
            estadoPlantilla.datos.beneficiario || 
            ''
          ),
          fecha_limite_pago: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          
          // Datos específicos de plantilla
          plantilla_id: estadoPlantilla.plantillaSeleccionada?.id || 'unknown',
          plantilla_version: estadoPlantilla.plantillaSeleccionada?.version || '1.0',
          plantilla_datos: JSON.stringify(estadoPlantilla.datos),
          
          // Todos los archivos van juntos
          archivos: archivosParaSubir
        };

  // console.log('Datos de plantilla para enviar al nuevo servicio:', solicitudPlantillaData);
  // console.log('Archivos a enviar:', archivosParaSubir.map(f => ({ name: f.name, size: f.size, type: f.type })));
  // console.log('Datos completos de la plantilla:', estadoPlantilla.datos);
  // console.log('Plantilla seleccionada:', estadoPlantilla.plantillaSeleccionada?.id);

        // Para plantilla tarjetas-n09-toka, usar SOLO tabla específica (sin duplicado)
        if (estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-n09-toka') {
          console.log('🗃️ Creando solicitud N09/TOKA usando SOLO tabla específica (sin duplicados)...');
          
          // Convertir datos de plantilla a formato N09/TOKA
          const datosN09Toka = SolicitudesN09TokaService.convertirDatosPlantilla(estadoPlantilla.datos);
          console.log('🔄 Datos convertidos para N09/TOKA:', datosN09Toka);
          
          // Crear datos finales para N09/TOKA (SIN crear solicitud duplicada primero)
          const datosParaCrear = {
            asunto: (datosN09Toka.asunto || 'TOKA_FONDEO_AVIT') as 'PAGO_PROVEEDOR_N09' | 'TOKA_FONDEO_AVIT',
            proveedor: datosN09Toka.proveedor || datosN09Toka.beneficiario || solicitudPlantillaData.nombre_persona || solicitudPlantillaData.empresa_a_pagar || 'Sin especificar',
            cliente: datosN09Toka.cliente || '',
            beneficiario: datosN09Toka.beneficiario || solicitudPlantillaData.nombre_persona || '',
            tipo_cuenta_clabe: (datosN09Toka.tipo_cuenta_clabe || 'CLABE') as 'CLABE' | 'CUENTA',
            numero_cuenta_clabe: datosN09Toka.numero_cuenta_clabe || solicitudPlantillaData.cuenta_destino || '',
            banco_destino: datosN09Toka.banco_destino || solicitudPlantillaData.banco_destino || 'STP',
            monto: (() => {
              const montoFinal = Number(solicitudPlantillaData.monto) || 0;
              console.log('🔍 [DEBUG MONTO] Monto final para N09/TOKA:', montoFinal);
              return montoFinal;
            })(),
            tipo_moneda: (solicitudPlantillaData.tipo_moneda || 'MXN') as 'MXN' | 'USD' | 'EUR'
          };
          
          console.log('� Datos finales para crear N09/TOKA directamente:', datosParaCrear);
          
          // Crear DIRECTAMENTE en tabla N09/TOKA (sin pasar por solicitudes_pago)
          const responseN09Toka = await SolicitudesN09TokaService.crear(datosParaCrear);
          console.log('✅ Solicitud N09/TOKA creada directamente:', responseN09Toka);
          
          // Obtener el ID de la solicitud N09/TOKA creada
          let idFinal: number | undefined;
          if (responseN09Toka.success && responseN09Toka.data) {
            idFinal = responseN09Toka.data.id_solicitud;
          }
          
          console.log('� ID de solicitud N09/TOKA creada:', idFinal);
          
          // Subir archivos a tabla específica de N09/TOKA
          if (idFinal && archivosParaSubir.length > 0) {
            console.log(`📎 Subiendo ${archivosParaSubir.length} archivos a N09/TOKA...`);
            
            try {
              const tiposArchivos = new Array(archivosParaSubir.length).fill('documento');
              
              const resultadoArchivos = await SolicitudN09TokaArchivosService.subirArchivos(
                idFinal,
                archivosParaSubir,
                tiposArchivos
              );
              
              console.log('✅ Archivos N09/TOKA subidos:', resultadoArchivos);
            } catch (error) {
              console.error('❌ Error subiendo archivos N09/TOKA:', error);
              throw error;
            }
          }
          
          toast.success('Solicitud N09/TOKA creada exitosamente (tabla única)');
          
        } else {
          // Para plantillas normales (NON N09/TOKA), usar flujo estándar  
          console.log('📋 Creando solicitud de plantilla normal...');
          
          const solicitudCompleta = {
            ...solicitudPlantillaData,
            archivos: archivosParaSubir
          };
          
          console.log('� Datos de solicitud normal:', solicitudCompleta);
          
          const response = await SolicitudesService.createPlantilla(solicitudCompleta);
          console.log('✅ Solicitud normal creada:', response);
          
          toast.success('Solicitud de plantilla creada exitosamente');
        }
        
        router.push('/dashboard/solicitante/mis-solicitudes');
        
      } catch (error: unknown) {
  // console.error('Error al crear solicitud con plantilla:', error);
        
        // Log más detallado del error
        // Si necesitas depurar detalles del error del servidor, descomenta el siguiente bloque:
        // if (error && typeof error === 'object' && 'response' in error) {
        //   const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
        //   console.error('Detalles del error del servidor:', {
        //     status: axiosError.response?.status,
        //     statusText: axiosError.response?.statusText,
        //     data: axiosError.response?.data
        //   });
        // }
        
        const errorMessage = error instanceof Error ? error.message : 'Error al crear la solicitud de plantilla';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validación del formulario estándar (código original)
    const newErrors: Record<string, string> = {};
    const requiredFields = ['departamento', 'monto', 'fecha_limite_pago', 'nombre_persona'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = 'Este campo es obligatorio';
      }
    });

    // Validar que haya al menos un archivo
    if (formData.archivos_adicionales.length === 0) {
      newErrors.archivos_adicionales = 'Debe subir al menos un documento';
    }
    
    // Validar concepto solo si tipo_concepto es "otro"
    if (formData.tipo_concepto === 'otro' && !formData.concepto) {
      newErrors.concepto = 'Este campo es obligatorio cuando seleccionas "Otro"';
    }
    
    // Validar referencia solo si tipo_concepto es "referencia"
    if (formData.tipo_concepto === 'referencia' && !formData.referencia) {
      newErrors.referencia = 'Este campo es obligatorio cuando seleccionas "Referencia"';
    }
    
    // Validar cuenta_destino solo si no es Tarjeta Institucional
    if (formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && !formData.cuenta_destino) {
      newErrors['cuenta_destino'] = 'Este campo es obligatorio';
    }
    
    if (cuentaValida === false && formData.tipo_cuenta_destino !== 'Tarjeta Institucional') {
      newErrors['cuenta_destino'] = 'La cuenta destino no es válida o no existe.';
    }
    if (checkingCuenta && formData.tipo_cuenta_destino !== 'Tarjeta Institucional') {
      newErrors['cuenta_destino'] = 'Espera a que termine la verificación de la cuenta destino.';
    }

    // Validar tipo de tarjeta cuando se selecciona "Número de Tarjeta"
    if (formData.tipo_cuenta_destino === 'Número de Tarjeta' && !formData.tipo_tarjeta) {
      newErrors.tipo_tarjeta = 'Selecciona el tipo de tarjeta';
    }

    // Validar tipo de tarjeta para la segunda forma de pago
    if (formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' && !formData.tipo_tarjeta_2) {
      newErrors.tipo_tarjeta_2 = 'Selecciona el tipo de tarjeta';
    }

    // Validar dígitos de CLABE (16 o 18 dígitos)
    if (formData.tipo_cuenta_destino === 'CLABE' && formData.cuenta_destino) {
      const clabePattern = /^\d{16}$|^\d{18}$/;
      if (!clabePattern.test(formData.cuenta_destino)) {
        newErrors.cuenta_destino = 'La CLABE debe tener 16 o 18 dígitos';
      }
    }

    // Validar dígitos de Cuenta (8 a 10 dígitos)
    if (formData.tipo_cuenta_destino === 'Cuenta' && formData.cuenta_destino) {
      const cuentaPattern = /^\d{8,10}$/;
      if (!cuentaPattern.test(formData.cuenta_destino)) {
        newErrors.cuenta_destino = 'El número de cuenta debe tener entre 8 y 10 dígitos';
      }
    }

    // Validar dígitos de Número de Tarjeta (máximo 16 dígitos)
    if (formData.tipo_cuenta_destino === 'Número de Tarjeta' && formData.cuenta_destino) {
      const tarjetaPattern = /^\d{1,16}$/;
      if (!tarjetaPattern.test(formData.cuenta_destino)) {
        newErrors.cuenta_destino = 'El número de tarjeta debe tener máximo 16 dígitos';
      }
    }

    // Validar dígitos de CLABE para segunda forma de pago (16 o 18 dígitos)
    if (formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'CLABE' && formData.cuenta_destino_2) {
      const clabePattern = /^\d{16}$|^\d{18}$/;
      if (!clabePattern.test(formData.cuenta_destino_2)) {
        newErrors.cuenta_destino_2 = 'La CLABE debe tener 16 o 18 dígitos';
      }
    }

    // Validar dígitos de Cuenta para segunda forma de pago (8 a 10 dígitos)
    if (formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Cuenta' && formData.cuenta_destino_2) {
      const cuentaPattern = /^\d{8,10}$/;
      if (!cuentaPattern.test(formData.cuenta_destino_2)) {
        newErrors.cuenta_destino_2 = 'El número de cuenta debe tener entre 8 y 10 dígitos';
      }
    }

    // Validar dígitos de Número de Tarjeta para segunda forma de pago (máximo 16 dígitos)
    if (formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' && formData.cuenta_destino_2) {
      const tarjetaPattern = /^\d{1,16}$/;
      if (!tarjetaPattern.test(formData.cuenta_destino_2)) {
        newErrors.cuenta_destino_2 = 'El número de tarjeta debe tener máximo 16 dígitos';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      
      // Scroll al primer campo con error con animación suave
      setTimeout(() => {
        // Buscar específicamente campos de cuenta con errores de dígitos
        const errorFields = Object.keys(newErrors);
        let targetField = null;
        
        // Priorizar errores de validación de dígitos
        const digitErrorFields = errorFields.filter(field => 
          (field === 'cuenta_destino' || field === 'cuenta_destino_2') &&
          (newErrors[field]?.includes('dígitos') || newErrors[field]?.includes('CLABE'))
        );
        
        if (digitErrorFields.length > 0) {
          // Buscar el campo específico con error de dígitos
          targetField = document.querySelector(`input[name="${digitErrorFields[0]}"]`);
        } else {
          // Buscar cualquier campo con error
          targetField = document.querySelector('.animate-pulse') || 
                       document.querySelector(`input[name="${errorFields[0]}"]`) ||
                       document.querySelector(`select[name="${errorFields[0]}"]`);
        }
        
        if (targetField) {
          targetField.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Resaltar el campo con error
          (targetField as HTMLElement).focus();
          
          // Mostrar mensaje específico para errores de dígitos
          if (digitErrorFields.length > 0) {
            const fieldName = digitErrorFields[0];
            const errorMessage = newErrors[fieldName];
            
            // Crear toast temporal con el mensaje de error
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
            toast.textContent = `Error: ${errorMessage}`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
              if (document.body.contains(toast)) {
                document.body.removeChild(toast);
              }
            }, 4000);
          }
        }
      }, 100);
      
      // Toast con información más visual
      toast.error(
        `❌ Faltan ${Object.keys(newErrors).length} campo(s) obligatorio(s)`,
        {
          duration: 4000,
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold'
          }
        }
      );
      return;
    }
    
    try {
      // Verificar que haya al menos un archivo
      if (formData.archivos_adicionales.length === 0) {
        throw new Error('Debe subir al menos un documento.');
      }
      
  // console.log('FormData antes de enviar:', formData);
      
      // Generar concepto basado en tipo_concepto
      let conceptoGenerado: string;
      if (formData.tipo_concepto === 'otro') {
        conceptoGenerado = formData.concepto || 'Otro concepto';
      } else if (formData.tipo_concepto === 'pago_factura') {
        conceptoGenerado = 'Pago de factura';
      } else if (formData.tipo_concepto === 'donativo') {
        conceptoGenerado = 'Donativo';
      } else if (formData.tipo_concepto === 'referencia') {
        conceptoGenerado = `Referencia: ${formData.referencia || 'Sin especificar'}`;
      } else {
        conceptoGenerado = 'Pago a terceros';
      }
      
      // Asegurar que el concepto tenga al menos 3 caracteres
      if (conceptoGenerado.length < 3) {
        conceptoGenerado = 'Pago de factura'; // Fallback
      }
      

      
      const solicitudData = {
      departamento: formData.departamento,
      monto: formData.monto,
      tipo_moneda: formData.tipo_moneda,
      cuenta_destino: formData.tipo_cuenta_destino === 'Tarjeta Institucional' ? (formData.cuenta_destino || null) : formData.cuenta_destino,
      concepto: conceptoGenerado,
      tipo_pago: formData.tipo_pago,
      tipo_pago_descripcion: formData.tipo_pago_descripcion,
      empresa_a_pagar: formData.empresa_a_pagar,
      nombre_persona: formData.nombre_persona,
      fecha_limite_pago: formData.fecha_limite_pago,
      factura: formData.archivos_adicionales[0] as File,
      tipo_cuenta_destino: formData.tipo_cuenta_destino,
      tipo_tarjeta: formData.tipo_cuenta_destino === 'Número de Tarjeta' ? formData.tipo_tarjeta : '',
      banco_destino: formData.banco_destino,
      cuenta: formData.cuenta || null,
      // Campos de tarjeta institucional
      link_pago: formData.tipo_cuenta_destino === 'Tarjeta Institucional' ? formData.link_pago || null : null,
      usuario_acceso: formData.tipo_cuenta_destino === 'Tarjeta Institucional' ? formData.usuario_acceso || null : null,
      contrasena_acceso: formData.tipo_cuenta_destino === 'Tarjeta Institucional' ? formData.contrasena_acceso || null : null,
      // Campos de segunda forma de pago
      tiene_segunda_forma_pago: formData.tiene_segunda_forma_pago,
      tipo_cuenta_destino_2: formData.tiene_segunda_forma_pago ? formData.tipo_cuenta_destino_2 : '',
      banco_destino_2: formData.tiene_segunda_forma_pago ? formData.banco_destino_2 : '',
      cuenta_destino_2: formData.tiene_segunda_forma_pago 
        ? (formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' ? (formData.cuenta_destino_2 || null) : formData.cuenta_destino_2) 
        : '',
      tipo_tarjeta_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' ? formData.tipo_tarjeta_2 : '',
      cuenta_2: formData.tiene_segunda_forma_pago ? (formData.cuenta_2 || null) : null,
      // Campos de segunda tarjeta institucional
      link_pago_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' ? (formData.link_pago_2 || null) : null,
      usuario_acceso_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' ? (formData.usuario_acceso_2 || null) : null,
      contrasena_acceso_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' ? (formData.contrasena_acceso_2 || null) : null
      };
      
      const response = await SolicitudesService.createWithFiles(solicitudData);
  // console.log('✅ Solicitud principal creada, response:', response);
  // console.log('🔍 DEBUGGING RESPONSE:');
  // console.log('📋 typeof response:', typeof response);
  // console.log('📋 response keys:', response ? Object.keys(response as Record<string, unknown>) : 'response is null/undefined');
  // console.log('📋 response.id_solicitud:', (response as Record<string, unknown>)?.id_solicitud);
  // console.log('📋 response data:', JSON.stringify(response, null, 2));
      
      // Debug: verificar archivos adicionales
  // console.log('🔍 VERIFICANDO ARCHIVOS ADICIONALES:');
      console.log('📋 formData.archivos_adicionales:', formData.archivos_adicionales);
      console.log('📋 Length:', formData.archivos_adicionales.length);
      console.log('📋 formData.tipos_archivos_adicionales:', formData.tipos_archivos_adicionales);
      
      // Subir archivos adicionales si los hay
      if (formData.archivos_adicionales.length > 0) {
        console.log('🚀 INICIANDO SUBIDA DE ARCHIVOS ADICIONALES');
        
        try {
          // Obtener el ID de la solicitud creada - con más debugging
          let solicitudId = (response as Record<string, unknown>)?.id_solicitud as number | undefined;
          
          // Si no está en response directamente, verificar si está en response.data
          if (!solicitudId && (response as Record<string, unknown>)?.data) {
            console.log('📋 Verificando response.data:', (response as Record<string, unknown>).data);
            solicitudId = ((response as Record<string, unknown>).data as Record<string, unknown>)?.id_solicitud as number | undefined;
          }
          
          console.log('📋 Solicitud ID final obtenido:', solicitudId);
          
          if (solicitudId) {
            // Verificar si es solicitud TOKA para usar el servicio correcto
            if (estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-n09-toka') {
              console.log('📤 LLAMANDO a SolicitudN09TokaArchivosService.subirArchivos (TOKA)');
              // Para TOKA, forzar todos los archivos como comprobante_pago
              const tiposParaToka = formData.tipos_archivos_adicionales.map(() => 'comprobante_pago');
              await SolicitudN09TokaArchivosService.subirArchivos(
                solicitudId,
                formData.archivos_adicionales,
                tiposParaToka
              );
              console.log('✅ Archivos adicionales TOKA subidos exitosamente');
            } else {
              console.log('📤 LLAMANDO a SolicitudArchivosService.subirArchivos (Normal)');
              await SolicitudArchivosService.subirArchivos(
                solicitudId,
                formData.archivos_adicionales,
                formData.tipos_archivos_adicionales
              );
              console.log('✅ Archivos adicionales subidos exitosamente');
            }
          } else {
            console.error('❌ No se pudo obtener el ID de la solicitud');
          }
        } catch (archivoError) {
          console.error('❌ Error al subir archivos adicionales:', archivoError);
          // No fallar la solicitud principal por esto
        }
      } else {
        console.log('ℹ️ No hay archivos adicionales para subir');
      }
      
      let successMsg = 'Solicitud creada exitosamente';
      if (response && typeof response === 'object' && 'message' in response && typeof (response as { message?: string }).message === 'string') {
        successMsg = (response as { message: string }).message;
      }
      
      if (formData.archivos_adicionales.length > 0) {
        successMsg += ` con ${formData.archivos_adicionales.length} archivo(s) adicional(es)`;
      }
      
      toast.success(successMsg);
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (err: unknown) {
      console.error('Error:', err);
      let errorMessage = 'Error al crear la solicitud';
      if (typeof err === 'object' && err !== null) {
        type ErrorDetail = { message: string };
        const errorObj = err as { response?: { data?: { message?: string, details?: ErrorDetail[] } }, message?: string };
        if (errorObj.response?.data?.details && Array.isArray(errorObj.response.data.details)) {
          errorMessage = errorObj.response.data.details.map((d: ErrorDetail) => d.message).join(' | ');
        } else {
          errorMessage = errorObj.response?.data?.message || errorObj.message || errorMessage;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handler para guardar desde FormularioPlantilla (sin evento)
  const handleGuardarPlantilla = async () => {
    const syntheticEvent = {
      preventDefault: () => {}
    } as React.FormEvent;
    await handleSubmit(syntheticEvent);
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-12 lg:py-16 w-full">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-8 mb-8 sm:mb-12 border border-white/20 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Nueva Solicitud de Pago</h1>
                  <p className="text-white/80 text-lg">Completa el formulario para crear una nueva solicitud</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Plantillas */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8 w-full">
            <SelectorPlantillas
              plantillas={plantillasActivas}
              plantillasInactivas={plantillasInactivas}
              plantillaSeleccionada={estadoPlantilla.plantillaSeleccionada}
              onSeleccionar={seleccionarPlantilla}
            />
          </div>

          {/* Formulario dinámico basado en plantilla o estándar */}
          {usandoPlantilla ? (
            // Formulario de plantilla
            <div className="space-y-8 w-full">
              <FormularioPlantilla
                plantilla={estadoPlantilla.plantillaSeleccionada!}
                datos={estadoPlantilla.datos}
                errores={estadoPlantilla.errores}
                camposVisibles={estadoPlantilla.camposVisibles}
                onCambiarCampo={actualizarCampo}
                onGuardar={handleGuardarPlantilla}
              />
              
              {/* Botón de envío para plantilla */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Enviando solicitud...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Enviar Solicitud</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Formulario estándar (código original)
            <>
              {/* Mensaje informativo sobre días de pago - SOLO para formulario estándar */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-orange-800 text-sm">
                        Días de Pago de Proveedores
                      </h4>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-orange-700 text-sm leading-relaxed">
                      <strong>Los pagos de proveedores se procesan únicamente los días lunes de cada semana.</strong> Ten esto en cuenta al planificar tus solicitudes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-8 md:p-12 lg:p-16 w-full">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 sm:mb-12">
                <div className="p-3 sm:p-4 rounded-full bg-white/20">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Solicitud de Pago</h2>
                  <p className="text-white/80 text-sm sm:text-base">Completa todos los campos para crear tu solicitud</p>
              </div>
            </div>

            {/* BANNER DE ERRORES */}
            {isFormSubmitted && Object.keys(errors).length > 0 && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 mb-8 backdrop-blur-sm animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="text-4xl animate-bounce">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-bold text-lg mb-2">
                      ¡Atención! Hay {Object.keys(errors).length} campo(s) que requieren tu atención
                    </h3>
                    <p className="text-red-300 text-sm mb-3">
                      Por favor, revisa y completa los siguientes campos obligatorios:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(errors).map(([field, message]) => (
                        <div key={field} className="flex items-center space-x-2 text-red-300 text-sm">
                          <span className="text-red-400">•</span>
                          <span className="font-semibold capitalize">
                            {field.replace('_', ' ')}: 
                          </span>
                          <span>{message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormSubmitted(false)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Ocultar este mensaje"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10 w-full">
              {/* SECCIÓN 1: INFORMACIÓN BÁSICA - 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {/* Departamento */}
                <div>
                  <label className={getLabelStyles('departamento', true)}>
                    <Building className="w-4 h-4 inline mr-2" />
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    required
                    className={getFieldStyles('departamento', 'w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200')}
                  >
                    <option value="" className="text-gray-900">Seleccionar departamento</option>
                    {departamentoOptions.map(dept => (
                      <option key={dept.value} value={dept.value} className="text-gray-900">
                        {dept.label}
                      </option>
                    ))}
                  </select>
                  {errors.departamento && (
                    <div className="mt-2 flex items-center space-x-2 animate-bounce">
                      <span className="text-red-400 text-2xl">⚠️</span>
                      <span className="text-red-400 text-sm font-bold">{errors.departamento}</span>
                    </div>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <label className={getLabelStyles('monto', true)}>
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
                      // Limpiar error cuando el usuario empieza a escribir
                      if (errors.monto) {
                        setErrors((prev) => ({ ...prev, monto: undefined }));
                      }
                    }}
                    className={getFieldStyles('monto', 'w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200')}
                  />  
                  {errors.monto && (
                    <div className="mt-2 flex items-center space-x-2 animate-bounce">
                      <span className="text-red-400 text-2xl">💰</span>
                      <span className="text-red-400 text-sm font-bold">{errors.monto}</span>
                    </div>
                  )}
                </div>

                {/* Tipo de Moneda */}
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Tipo de Moneda *
                  </label>
                  <select
                    name="tipo_moneda"
                    value={formData.tipo_moneda}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    <option value="MXN" className="bg-blue-900 text-white">MXN (Peso Mexicano)</option>
                    <option value="USD" className="bg-blue-900 text-white">USD (Dólar Americano)</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN 2: INFORMACIÓN BANCARIA - 4 columnas para mejor aprovechamiento */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 w-full">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Información Bancaria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {/* “Información Bancaria” */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Información Bancaria *
                    </label>
                    <select
                      name="tipo_cuenta_destino"
                      value={formData.tipo_cuenta_destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                    >
                      <option value="CLABE" className="text-black">CLABE</option>
                      <option value="Cuenta" className="text-black">Número de Cuenta</option>
                      <option value="Número de Tarjeta" className="text-black">Número de Tarjeta</option>
                      <option value="Tarjeta Institucional" className="text-black">Pago con Tarjeta Corporativa</option>
                    </select>
                  </div>

                  {/* Tipo de Tarjeta - Solo mostrar cuando se selecciona "Número de Tarjeta" */}
                  {formData.tipo_cuenta_destino === 'Número de Tarjeta' && (
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Tipo de Tarjeta *
                      </label>
                      <select
                        name="tipo_tarjeta"
                        value={formData.tipo_tarjeta}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                      >
                        <option value="" className="text-black">Selecciona el tipo</option>
                        <option value="debito" className="text-black">Débito</option>
                        <option value="credito" className="text-black">Crédito</option>
                      </select>
                      {errors.tipo_tarjeta && (
                        <p className="text-red-400 text-sm mt-1">{errors.tipo_tarjeta}</p>
                      )}
                    </div>
                  )}

                  {/* Banco - Solo mostrar si NO es Tarjeta Institucional */}
                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && (
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Banco Destino (opcional)
                      </label>
                      <select
                        name="banco_destino"
                        value={formData.banco_destino}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                      >
                        <option value="" className="text-black">Selecciona banco</option>
                        {bancoOptions.map(banco => (
                          <option key={banco} value={banco} className="text-black">{banco}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Cuenta (opcional) - Solo mostrar si NO es Tarjeta Institucional */}
                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && (
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
                        className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm font-mono tracking-wide"
                      />
                    </div>
                  )}

                  {/* Cuenta Destino - Solo mostrar si NO es Tarjeta Institucional */}
                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && (
                    <div className="md:col-span-2 lg:col-span-4">
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
                          
                          // Validar en tiempo real según el tipo de cuenta
                          if (value) {
                            if (formData.tipo_cuenta_destino === 'CLABE') {
                              const clabePattern = /^\d{18}$/;
                              if (!clabePattern.test(value) && value.length <= 18) {
                                setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                              } else if (!clabePattern.test(value) && value.length > 18) {
                                setErrors((prev) => ({ ...prev, cuenta_destino: 'La CLABE debe tener exactamente 18 dígitos' }));
                              }
                            } else if (formData.tipo_cuenta_destino === 'Número de Tarjeta') {
                              const tarjetaPattern = /^\d{1,16}$/;
                              if (!tarjetaPattern.test(value)) {
                                setErrors((prev) => ({ ...prev, cuenta_destino: 'El número de tarjeta debe tener máximo 16 dígitos' }));
                              } else {
                                setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                              }
                            } else {
                              setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                            }
                          } else if (!value && cuentaConfig.required) {
                            setErrors((prev) => ({ ...prev, cuenta_destino: 'Este campo es obligatorio' }));
                          } else {
                            setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                          }
                        }}
                        pattern={
                          formData.tipo_cuenta_destino === 'CLABE' ? '[0-9]{18}' : 
                          formData.tipo_cuenta_destino === 'Número de Tarjeta' ? '[0-9]{1,16}' : 
                          undefined
                        }
                        maxLength={
                          formData.tipo_cuenta_destino === 'CLABE' ? 18 : 
                          formData.tipo_cuenta_destino === 'Número de Tarjeta' ? 16 : 
                          undefined
                        }
                        onBlur={e => {
                          if (e.target.value && formData.tipo_cuenta_destino !== 'Tarjeta Institucional') {
                            verificarCuentaDestino(e.target.value);
                          }
                        }}
                        placeholder={cuentaConfig.placeholder}
                        required={cuentaConfig.required}
                        autoComplete="off"
                        className={getFieldStyles('cuenta_destino', 'w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide transition-all duration-200')}
                      />
                      {/* Estados de validación */}
                      <div className="mt-2 flex items-center gap-4">
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
                      
                      {/* Texto de ayuda para requisitos de dígitos */}
                      {formData.tipo_cuenta_destino && (
                        <div className="mt-2">
                          {formData.tipo_cuenta_destino === 'CLABE' && (
                            <p className="text-white/60 text-sm flex items-center">
                              <span className="mr-2">💡</span>
                              La CLABE debe tener exactamente 18 dígitos
                            </p>
                          )}
                          {formData.tipo_cuenta_destino === 'Número de Tarjeta' && (
                            <p className="text-white/60 text-sm flex items-center">
                              <span className="mr-2">💳</span>
                              El número de tarjeta debe tener máximo 16 dígitos
                            </p>
                          )}
                        </div>
                      )}
                      
                      {formData.cuenta_destino && errors.cuenta_destino && cuentaValida !== true && (
                        <div className="mt-2 flex items-center space-x-2 animate-bounce">
                          <span className="text-red-400 text-2xl">🏦</span>
                          <span className="text-red-400 text-sm font-bold">{errors.cuenta_destino}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2.4: CAMPOS DE TARJETA INSTITUCIONAL (CONDICIONAL) */}
              {formData.tipo_cuenta_destino === 'Tarjeta Institucional' && (
                <div className="bg-blue-600/10 rounded-xl p-4 sm:p-6 border border-blue-600/30 w-full">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Datos de Acceso - Tarjeta Institucional
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Link de Pago */}
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Link de Pago
                      </label>
                      <input
                        type="url"
                        name="link_pago"
                        value={formData.link_pago}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      />
                    </div>

                    {/* Usuario */}
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Usuario de Acceso
                      </label>
                      <input
                        type="text"
                        name="usuario_acceso"
                        value={formData.usuario_acceso}
                        onChange={handleInputChange}
                        placeholder="Usuario"
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      />
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        name="contrasena_acceso"
                        value={formData.contrasena_acceso}
                        onChange={handleInputChange}
                        placeholder="Contraseña"
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÓN PARA AGREGAR SEGUNDA FORMA DE PAGO */}
              {!formData.tiene_segunda_forma_pago && (
                <div className="text-center w-full">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: true })}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Agregar Segunda Forma de Pago
                  </button>
                  <p className="text-white/60 text-sm mt-2">
                    Opcional: Divide el pago en dos formas diferentes
                  </p>
                </div>
              )}

              {/* SECCIÓN 2.6: SEGUNDA FORMA DE PAGO (CONDICIONAL) */}
              {formData.tiene_segunda_forma_pago && (
                <div className="bg-green-600/10 rounded-xl p-4 sm:p-6 border border-green-600/30 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Segunda Forma de Pago
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: false });
                        // Limpiar todos los campos de segunda forma de pago
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">
                        Datos Bancarios *
                      </label>
                      <select
                        name="tipo_cuenta_destino_2"
                        value={formData.tipo_cuenta_destino_2}
                        onChange={handleInputChange}
                        required={formData.tiene_segunda_forma_pago}
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      >
                        <option value="CLABE" className="text-black">CLABE</option>
                        <option value="Cuenta" className="text-black">Número de Cuenta</option>
                        <option value="Número de Tarjeta" className="text-black">Número de Tarjeta</option>
                        <option value="Tarjeta Institucional" className="text-black">Pago con Tarjeta Corporativa</option>
                      </select>
                    </div>

                    {/* Tipo de Tarjeta 2 - Solo mostrar cuando se selecciona "Número de Tarjeta" */}
                    {formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' && (
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          <CreditCard className="w-4 h-4 inline mr-2" />
                          Tipo de Tarjeta *
                        </label>
                        <select
                          name="tipo_tarjeta_2"
                          value={formData.tipo_tarjeta_2}
                          onChange={handleInputChange}
                          required={formData.tiene_segunda_forma_pago}
                          className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                        >
                          <option value="" className="text-black">Selecciona el tipo</option>
                          <option value="debito" className="text-black">Débito</option>
                          <option value="credito" className="text-black">Crédito</option>
                        </select>
                        {errors.tipo_tarjeta_2 && (
                          <p className="text-red-400 text-sm mt-1">{errors.tipo_tarjeta_2}</p>
                        )}
                      </div>
                    )}

                    {/* Banco 2 - Solo mostrar si NO es Tarjeta Institucional */}
                    {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">
                          Banco (opcional)
                        </label>
                        <select
                          name="banco_destino_2"
                          value={formData.banco_destino_2}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                        >
                          <option value="" className="text-black">Selecciona banco</option>
                          {bancoOptions.map(banco => (
                            <option key={banco} value={banco} className="text-black">{banco}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Cuenta 2 (opcional) - Solo mostrar si NO es Tarjeta Institucional */}
                    {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
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
                          className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide"
                        />
                      </div>
                    )}
                  </div>

                  {/* Cuenta Destino 2 - Solo mostrar si NO es Tarjeta Institucional */}
                  {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
                    <div className="mb-6 w-full">
                      <label className="block text-base font-medium text-white/90 mb-3">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Cuenta Destino *
                      </label>
                      <input
                        type="text"
                        name="cuenta_destino_2"
                        value={formData.cuenta_destino_2}
                        onChange={e => {
                          const { name, value } = e.target;
                          dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
                          
                          // Validar en tiempo real según el tipo de cuenta
                          if (value) {
                            if (formData.tipo_cuenta_destino_2 === 'CLABE') {
                              const clabePattern = /^\d{16,18}$/;
                              if (!clabePattern.test(value) && value.length <= 18) {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: undefined }));
                              } else if (!clabePattern.test(value) && value.length > 18) {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: 'La CLABE debe tener entre 16 y 18 dígitos' }));
                              }
                            } else if (formData.tipo_cuenta_destino_2 === 'Cuenta') {
                              const cuentaPattern = /^\d{8,10}$/;
                              if (!cuentaPattern.test(value) && value.length <= 10) {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: undefined }));
                              } else if (!cuentaPattern.test(value) && value.length > 10) {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: 'El número de cuenta debe tener entre 8 y 10 dígitos' }));
                              }
                            } else if (formData.tipo_cuenta_destino_2 === 'Número de Tarjeta') {
                              const tarjetaPattern = /^\d{1,16}$/;
                              if (!tarjetaPattern.test(value)) {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: 'El número de tarjeta debe tener máximo 16 dígitos' }));
                              } else {
                                setErrors((prev) => ({ ...prev, cuenta_destino_2: undefined }));
                              }
                            } else {
                              setErrors((prev) => ({ ...prev, cuenta_destino_2: undefined }));
                            }
                          } else {
                            setErrors((prev) => ({ ...prev, cuenta_destino_2: undefined }));
                          }
                        }}
                        pattern={
                          formData.tipo_cuenta_destino_2 === 'CLABE' ? '[0-9]{16,18}' : 
                          formData.tipo_cuenta_destino_2 === 'Cuenta' ? '[0-9]{8,10}' : 
                          formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' ? '[0-9]{1,16}' : 
                          undefined
                        }
                        maxLength={
                          formData.tipo_cuenta_destino_2 === 'CLABE' ? 18 : 
                          formData.tipo_cuenta_destino_2 === 'Cuenta' ? 10 : 
                          formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' ? 16 : 
                          undefined
                        }
                        placeholder={
                          formData.tipo_cuenta_destino_2 === 'CLABE' 
                            ? 'Número de cuenta CLABE (16-18 dígitos)' 
                            : formData.tipo_cuenta_destino_2 === 'Cuenta' 
                            ? 'Número de cuenta (8-10 dígitos)' 
                            : formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' 
                            ? 'Número de tarjeta (máx. 16 dígitos)' 
                            : 'Selecciona el tipo de cuenta primero'
                        }
                        required={formData.tiene_segunda_forma_pago}
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide"
                      />
                      
                      {/* Texto de ayuda para requisitos de dígitos */}
                      {formData.tipo_cuenta_destino_2 && (
                        <div className="mt-2">
                          {formData.tipo_cuenta_destino_2 === 'CLABE' && (
                            <p className="text-white/60 text-sm flex items-center">
                              <span className="mr-2">💡</span>
                              La CLABE debe tener entre 16 y 18 dígitos
                            </p>
                          )}
                          {formData.tipo_cuenta_destino_2 === 'Cuenta' && (
                            <p className="text-white/60 text-sm flex items-center">
                              <span className="mr-2">🏦</span>
                              El número de cuenta debe tener entre 8 y 10 dígitos
                            </p>
                          )}
                          {formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' && (
                            <p className="text-white/60 text-sm flex items-center">
                              <span className="mr-2">💳</span>
                              El número de tarjeta debe tener máximo 16 dígitos
                            </p>
                          )}
                        </div>
                      )}
                      
                      {errors.cuenta_destino_2 && (
                        <div className="mt-2 flex items-center space-x-2 animate-bounce">
                          <span className="text-red-400 text-2xl">🏦</span>
                          <span className="text-red-400 text-sm font-bold">{errors.cuenta_destino_2}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CAMPOS DE TARJETA INSTITUCIONAL PARA SEGUNDA FORMA DE PAGO */}
                  {formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' && (
                    <div className="bg-blue-600/10 rounded-xl p-4 sm:p-6 border border-blue-600/30 w-full">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Datos de Acceso - Segunda Tarjeta Institucional
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Link de Pago 2 */}
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">
                            Link de Pago
                          </label>
                          <input
                            type="url"
                            name="link_pago_2"
                            value={formData.link_pago_2}
                            onChange={handleInputChange}
                            placeholder="https://..."
                            className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                          />
                        </div>

                        {/* Usuario 2 */}
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">
                            Usuario de Acceso
                          </label>
                          <input
                            type="text"
                            name="usuario_acceso_2"
                            value={formData.usuario_acceso_2}
                            onChange={handleInputChange}
                            placeholder="Usuario"
                            className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                          />
                        </div>

                        {/* Contraseña 2 */}
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">
                            Contraseña
                          </label>
                          <input
                            type="password"
                            name="contrasena_acceso_2"
                            value={formData.contrasena_acceso_2}
                            onChange={handleInputChange}
                            placeholder="Contraseña"
                            className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN 3: INFORMACIÓN DEL PAGO - 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {/* Tipo de Pago */}
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
                    className={getFieldStyles('fecha_limite_pago', 'w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200')}
                    calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                    locale={es}
                  />
                  {errors.fecha_limite_pago && (
                    <div className="mt-2 flex items-center space-x-2 animate-bounce">
                      <span className="text-red-400 text-2xl">📅</span>
                      <span className="text-red-400 text-sm font-bold">{errors.fecha_limite_pago}</span>
                    </div>
                  )}
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
                      placeholder="Agrega una breve descripción que identifique el pago"
                      rows={3}
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base"
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
                
                {/* Dropdown para tipo de concepto */}
                <select
                  name="tipo_concepto"
                  value={formData.tipo_concepto}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base mb-4"
                >
                  <option value="pago_factura" className="bg-blue-900 text-white">Pago de factura</option>
                  <option value="pago_terceros" className="bg-blue-900 text-white">Pago a terceros</option>
                  <option value="donativo" className="bg-blue-900 text-white">Donativo</option>
                  <option value="referencia" className="bg-blue-900 text-white">Referencia</option>
                  <option value="otro" className="bg-blue-900 text-white">Otro</option>
                </select>

                {/* Campo de texto condicional para "Otro" - SOLO NÚMEROS */}
                {formData.tipo_concepto === 'otro' && (
                  <input
                    type="text"
                    name="concepto"
                    value={formData.concepto}
                    onChange={(e) => {
                      // Solo permitir números
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange({
                        target: {
                          name: 'concepto',
                          value: numericValue
                        }
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    placeholder="Ingrese solo números..."
                    required
                    className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.concepto ? 'border-red-400' : ''}`}
                  />
                )}

                {/* Campo de referencia condicional para "Referencia" */}
                {formData.tipo_concepto === 'referencia' && (
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Referencia *
                    </label>
                    <input
                      type="text"
                      name="referencia"
                      value={formData.referencia}
                      onChange={handleInputChange}
                      placeholder="Ingrese el código o identificador de referencia..."
                      required
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.referencia ? 'border-red-400' : ''}`}
                    />
                    <p className="text-white/60 text-sm mt-2">
                      Esta referencia corresponde a códigos o identificadores específicos que deben incluirse en el concepto para acreditar correctamente el pago.
                    </p>
                    {errors.referencia && <span className="text-red-400 text-sm mt-1 block">{errors.referencia}</span>}
                  </div>
                )}
                
                {errors.concepto && <span className="text-red-400 text-sm mt-1 block">{errors.concepto}</span>}
              </div>

              {/* SECCIÓN 5: INFORMACIÓN DEL BENEFICIARIO - 2 columnas */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-8 border border-white/10 w-full">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-3" />
                  Información del Beneficiario
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {/* Nombre de la persona (obligatorio) */}
                  <div>
                    <label className={getLabelStyles('nombre_persona', true)}>
                      <span className="text-red-400">*</span> Nombre del Beneficiario
                    </label>
                    <input
                      type="text"
                      name="nombre_persona"
                      value={formData.nombre_persona}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre completo de la persona física o moral que recibe directamente el pago"
                      className={getFieldStyles('nombre_persona', 'w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200')}
                    />
                    {errors.nombre_persona && (
                      <div className="mt-2 flex items-center space-x-2 animate-bounce">
                        <span className="text-red-400 text-2xl">👤</span>
                        <span className="text-red-400 text-sm font-bold">{errors.nombre_persona}</span>
                      </div>
                    )}
                  </div>

                  {/* Empresa (opcional) */}
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Se paga por: (opcional)
                    </label>
                    <input
                      type="text"
                      name="empresa_a_pagar"
                      value={formData.empresa_a_pagar}
                      onChange={handleInputChange}
                      placeholder="Empresa desde la cual se efectuará el pago"
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 hover:border-white/50"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 6: DOCUMENTOS - Ancho completo con previsualización mejorada */}
              <div className="bg-white/5 rounded-xl p-4 sm:p-8 border border-white/10 w-full">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Upload className="w-6 h-6 mr-3" />
                  Documentos Requeridos
                </h3>

                {/* Archivos (antes "Adicionales", ahora principal) */}
                <div>
                  <label className="block text-base font-medium text-white/90 mb-4">
                    <span className="text-red-400">*</span> Documentos 
                    <span className="text-white/70 text-sm ml-2">(PDF, Excel, JPG, PNG - Máx. 5MB c/u)</span>
                  </label>
                  
                  {/* Botón para agregar archivos */}
                  <div className="mb-6">
                    <input
                      type="file"
                      id="archivos-documentos"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleArchivoAdicionalChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="archivos-documentos"
                      className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all duration-200 cursor-pointer"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Agregar Documentos
                    </label>
                  </div>

                  {/* Mostrar error si no hay archivos */}
                  {errors.archivos_adicionales && (
                    <div className="mb-4 flex items-center space-x-2 animate-bounce">
                      <span className="text-red-400 text-2xl">📄</span>
                      <span className="text-red-400 text-sm font-bold">{errors.archivos_adicionales}</span>
                    </div>
                  )}

                  {/* Lista de archivos */}
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
                              
                              {/* Selector de tipo */}
                              <select
                                value={formData.tipos_archivos_adicionales[index] || (estadoPlantilla.plantillaSeleccionada?.id === 'tarjetas-n09-toka' ? 'comprobante_pago' : 'documento')}
                                onChange={(e) => updateTipoArchivoAdicional(index, e.target.value)}
                                className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-sm"
                              >
                                <option value="documento" className="bg-blue-900 text-white">Documento</option>
                                <option value="comprobante" className="bg-blue-900 text-white">Comprobante</option>
                                <option value="comprobante_pago" className="bg-blue-900 text-white">Comprobante de Pago</option>
                                <option value="contrato" className="bg-blue-900 text-white">Contrato</option>
                                <option value="identificacion" className="bg-blue-900 text-white">Identificación</option>
                                <option value="otro" className="bg-blue-900 text-white">Otro</option>
                              </select>
                            </div>
                            
                            {/* Botón eliminar */}
                            <button
                              type="button"
                              onClick={() => removeArchivoAdicional(index)}
                              className="ml-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colores"
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
                    (formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && !formData.cuenta_destino) ||
                    (formData.tipo_concepto === 'otro' && !formData.concepto) ||
                    !formData.fecha_limite_pago ||
                    formData.archivos_adicionales.length === 0 ||
                    (cuentaValida === false && formData.tipo_cuenta_destino !== 'Tarjeta Institucional') ||
                    (checkingCuenta && formData.tipo_cuenta_destino !== 'Tarjeta Institucional')
                  }
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105 shadow-xl border-0 px-10 py-4 font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      Creando solicitud...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Crear Solicitud
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
          </>
          )}
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
