'use client';

import { useState, useReducer, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare, CheckCircle, X, Trash2 } from 'lucide-react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { SolicitudArchivosService } from '@/services/solicitudArchivos.service';
import { toast } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';
import Image from 'next/image';
import { formatDateForAPI } from '@/utils/dateUtils';

type FormState = {
  departamento: string;
  monto: string;
  tipo_moneda: string;
  cuenta_destino: string;
  concepto: string;
  tipo_concepto: string;
  referencia: string;
  tipo_pago: string;
  tipo_pago_descripcion: string;
  empresa_a_pagar: string;
  nombre_persona: string;
  fecha_limite_pago: string;
  factura_file: File | null;            // NUEVA factura (opcional en edición)
  archivos_adicionales: File[];         // NUEVOS archivos
  tipos_archivos_adicionales: string[]; // Tipos para nuevos archivos
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  cuenta: string;
  // Tarjeta institucional
  link_pago: string;
  usuario_acceso: string;
  contrasena_acceso: string;
  // Segunda forma de pago
  tiene_segunda_forma_pago: boolean;
  tipo_cuenta_destino_2: string;
  banco_destino_2: string;
  cuenta_destino_2: string;
  tipo_tarjeta_2: string;
  cuenta_2: string;
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
  referencia: '',
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
  contrasena_acceso_2: ''
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value as string | boolean | File | File[] | string[] };
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

type ArchivoExistente = {
  id: number;
  nombre: string;
  tipo: string;      // 'factura' | 'documento' | 'comprobante' | etc.
  size?: number;
  mime?: string;
  url?: string;
};

export default function EditarSolicitudPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const solicitudId = useMemo(() => Number(params?.id), [params]);

  const [loading, setLoading] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);

  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [fechaLimitePago, setFechaLimitePago] = useState<Date | null>(null);

  const [cuentaValida, setCuentaValida] = useState<null | boolean>(null);
  const [checkingCuenta, setCheckingCuenta] = useState(false);
  const [errors, setErrors] = useState<Record<keyof FormState | string, string | undefined>>({});

  // Archivos existentes en el servidor
  const [facturaExistente, setFacturaExistente] = useState<ArchivoExistente | null>(null);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoExistente[]>([]);
  const [archivosAEliminar, setArchivosAEliminar] = useState<number[]>([]);

  // Limpiar campos según tipo_concepto
  useEffect(() => {
    if (formData.tipo_concepto !== 'otro') {
      dispatch({ type: 'SET_FIELD', field: 'concepto', value: '' });
    }
    if (formData.tipo_concepto !== 'referencia') {
      dispatch({ type: 'SET_FIELD', field: 'referencia', value: '' });
    }
  }, [formData.tipo_concepto]);

  // Configuración dinámica para cuenta destino
  let cuentaConfig;
  if (formData.tipo_cuenta_destino === 'Número de Tarjeta') {
    cuentaConfig = { placeholder: 'Número de tarjeta', errorMsg: 'Ingresa un número de tarjeta válido.', required: true };
  } else if (formData.tipo_cuenta_destino === 'Tarjeta Institucional' || formData.tipo_cuenta_destino === 'Tarjeta Instituciona') {
    cuentaConfig = { placeholder: 'Opcional', errorMsg: '', required: false };
  } else {
    cuentaConfig = { placeholder: 'Número de cuenta CLABE', errorMsg: 'Ingresa un número de cuenta CLABE válido.', required: true };
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
    { value: 'direccion general', label: 'Dirección General' }
  ];

  const tipoPagoOptions = [
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'poliza_seguro', label: 'Poliza - Seguro' },
    { value: 'Dirección General', label: 'Dirección General' },
    { value: 'Donativos', label: 'Donativos' },
    { value: 'Operativos', label: 'Operativos' },
    { value: 'Fiscales legales y corporativos', label: 'Fiscales legales y corporativos' }
  ];

  // ---------- CARGA INICIAL ----------
  useEffect(() => {
    const cargar = async () => {
      if (!solicitudId || Number.isNaN(solicitudId)) {
        toast.error('ID de solicitud inválido.');
        router.push('/dashboard/solicitante/mis-solicitudes');
        return;
      }
      try {
        setLoadingInicial(true);

        // 1) Trae la solicitud (ajusta el método si tu service usa otro nombre)
        // @ts-expect-error - Método puede tener diferentes nombres según implementación
        const solicitudData = await (SolicitudesService.getById?.(solicitudId) ?? (SolicitudesService as Record<string, unknown>).get?.(solicitudId));
        if (!solicitudData) throw new Error('No se encontró la solicitud.');

        // Usar directamente la respuesta
        const s = solicitudData as unknown as Record<string, string | number | boolean | null>;

        // Derivar tipo_concepto si no viene explícito
        let tipo_concepto = (s.tipo_concepto as string) || 'pago_factura';
        let referencia = '';
        const concepto = (s.concepto as string) || '';
        if (!s.tipo_concepto && typeof s.concepto === 'string') {
          if (/^Referencia\s*:/.test(s.concepto as string)) {
            tipo_concepto = 'referencia';
            referencia = (s.concepto as string).split(':')[1]?.trim() ?? '';
          } else if ((s.concepto as string)?.toLowerCase().includes('donativo')) {
            tipo_concepto = 'donativo';
          } else if ((s.concepto as string)?.toLowerCase().includes('pago de factura')) {
            tipo_concepto = 'pago_factura';
          } else {
            tipo_concepto = 'pago_terceros'; // fallback
          }
        }

        // Fecha
        const fechaStr = (s.fecha_limite_pago as string) || (s.fecha as string) || '';
        const fecha = fechaStr ? new Date(fechaStr) : null;

        // Poblar estado
        dispatch({ type: 'SET_FIELD', field: 'departamento', value: (s.departamento as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'monto', value: String(s.monto ?? '') });
        dispatch({ type: 'SET_FIELD', field: 'tipo_moneda', value: (s.tipo_moneda as string) ?? 'MXN' });
        dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value: (s.cuenta_destino as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'concepto', value: concepto ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'tipo_concepto', value: tipo_concepto });
        dispatch({ type: 'SET_FIELD', field: 'referencia', value: referencia });
        dispatch({ type: 'SET_FIELD', field: 'tipo_pago', value: (s.tipo_pago as string) ?? 'transferencia' });
        dispatch({ type: 'SET_FIELD', field: 'tipo_pago_descripcion', value: (s.tipo_pago_descripcion as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'empresa_a_pagar', value: (s.empresa_a_pagar as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'nombre_persona', value: (s.nombre_persona as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'fecha_limite_pago', value: fecha ? formatDateForAPI(fecha) : '' });

        setFechaLimitePago(fecha);

        // Bancarios
        dispatch({ type: 'SET_FIELD', field: 'tipo_cuenta_destino', value: (s.tipo_cuenta_destino as string) ?? 'CLABE' });
        dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta', value: (s.tipo_tarjeta as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'banco_destino', value: (s.banco_destino as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'cuenta', value: (s.cuenta as string) ?? '' });

        // Tarjeta institucional
        dispatch({ type: 'SET_FIELD', field: 'link_pago', value: (s.link_pago as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'usuario_acceso', value: (s.usuario_acceso as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'contrasena_acceso', value: (s.contrasena_acceso as string) ?? '' });

        // Segunda forma de pago
        const tiene2 = Boolean(s.tiene_segunda_forma_pago);
        dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: tiene2 });
        dispatch({ type: 'SET_FIELD', field: 'tipo_cuenta_destino_2', value: (s.tipo_cuenta_destino_2 as string) ?? 'CLABE' });
        dispatch({ type: 'SET_FIELD', field: 'banco_destino_2', value: (s.banco_destino_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'cuenta_destino_2', value: (s.cuenta_destino_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'tipo_tarjeta_2', value: (s.tipo_tarjeta_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'cuenta_2', value: (s.cuenta_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'link_pago_2', value: (s.link_pago_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'usuario_acceso_2', value: (s.usuario_acceso_2 as string) ?? '' });
        dispatch({ type: 'SET_FIELD', field: 'contrasena_acceso_2', value: (s.contrasena_acceso_2 as string) ?? '' });

        // Validación inicial de cuenta (si viene poblada)
        setCuentaValida(!!((s.cuenta_destino as string) && String(s.cuenta_destino).length >= 8));

        // 2) Archivos existentes (ajusta el método si difiere)
        try {
          // Intenta cargar archivos - puede fallar sin romper la funcionalidad
          const lista: Record<string, unknown>[] = [];
          // Separa factura de otros
          const factura = lista.find((a: Record<string, unknown>) => a.tipo === 'factura') ?? null;
          const otros = lista.filter((a: Record<string, unknown>) => a.tipo !== 'factura');
          setFacturaExistente(factura ? {
            id: Number(factura.id ?? factura.id_archivo ?? 0),
            nombre: (factura.nombre ?? factura.filename ?? 'factura') as string,
            tipo: 'factura',
            size: (factura.size as number) ?? 0,
            mime: (factura.mime as string) ?? '',
            url: (factura.url as string) ?? ''
          } : null);
          setArchivosExistentes(
            (otros || []).map((a: Record<string, unknown>) => ({
              id: Number(a.id ?? a.id_archivo ?? 0),
              nombre: (a.nombre ?? a.filename ?? 'archivo') as string,
              tipo: (a.tipo ?? 'documento') as string,
              size: (a.size as number) ?? 0,
              mime: (a.mime as string) ?? '',
              url: (a.url as string) ?? ''
            }))
          );
        } catch {
          // silencioso, no rompe la vista si falla listar
        }

      } catch (e: unknown) {
        console.error(e);
        toast.error((e as Error)?.message || 'No se pudo cargar la solicitud.');
        router.push('/dashboard/solicitante/mis-solicitudes');
      } finally {
        setLoadingInicial(false);
      }
    };
    cargar();
  }, [solicitudId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name as keyof FormState, value });
    if (!value) setErrors((p) => ({ ...p, [name]: 'Este campo es obligatorio' }));
    else setErrors((p) => ({ ...p, [name]: undefined }));
  };

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
      toast.error('Tipo de archivo no permitido. Solo PDF, Excel, JPG y PNG.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máx. 5MB.');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormState) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!validateFile(file)) {
        setErrors((prev) => ({ ...prev, [fieldName]: 'Archivo no válido' }));
        return;
      }
      dispatch({ type: 'SET_FIELD', field: fieldName, value: file });
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    } else {
      // En edición NO es obligatorio tener factura_file si ya existe una
      if (!facturaExistente) setErrors((prev) => ({ ...prev, [fieldName]: 'Este campo es obligatorio' }));
    }
  };

  const handleArchivoAdicionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (validateFile(file)) {
        dispatch({ type: 'ADD_ARCHIVO_ADICIONAL', archivo: file, tipo: 'documento' });
      }
    });
    e.target.value = '';
  };

  const removeArchivoAdicional = (index: number) => {
    dispatch({ type: 'REMOVE_ARCHIVO_ADICIONAL', index });
  };

  const updateTipoArchivoAdicional = (index: number, tipo: string) => {
    const nuevos_tipos = [...formData.tipos_archivos_adicionales];
    nuevos_tipos[index] = tipo;
    dispatch({ type: 'SET_FIELD', field: 'tipos_archivos_adicionales', value: nuevos_tipos });
  };

  const toggleEliminarExistente = (archivoId: number) => {
    setArchivosAEliminar((prev) =>
      prev.includes(archivoId) ? prev.filter(id => id !== archivoId) : [...prev, archivoId]
    );
  };

  // Simulación de verificación de cuenta
  const verificarCuentaDestino = async (cuenta: string) => {
    setCheckingCuenta(true);
    setCuentaValida(null);
    try {
      await new Promise(r => setTimeout(r, 700));
      setCuentaValida(cuenta.length >= 8);
    } catch {
      setCuentaValida(false);
    } finally {
      setCheckingCuenta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudId) return;

    setLoading(true);
    const newErrors: Record<string, string> = {};

    const requiredFields: (keyof FormState)[] = ['departamento', 'monto', 'fecha_limite_pago', 'nombre_persona'];
    requiredFields.forEach((f) => {
      if (!formData[f]) newErrors[f] = 'Este campo es obligatorio';
    });

    if (formData.tipo_concepto === 'otro' && !formData.concepto) {
      newErrors.concepto = 'Este campo es obligatorio cuando seleccionas "Otro"';
    }
    if (formData.tipo_concepto === 'referencia' && !formData.referencia) {
      newErrors.referencia = 'Este campo es obligatorio cuando seleccionas "Referencia"';
    }
    if (formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona' && !formData.cuenta_destino) {
      newErrors['cuenta_destino'] = 'Este campo es obligatorio';
    }
    if (cuentaValida === false && formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona') {
      newErrors['cuenta_destino'] = 'La cuenta destino no es válida o no existe.';
    }
    if (checkingCuenta && formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona') {
      newErrors['cuenta_destino'] = 'Espera a que termine la verificación de la cuenta destino.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      // Concepto generado (mantiene tu lógica)
      let conceptoGenerado: string;
      if (formData.tipo_concepto === 'otro') conceptoGenerado = formData.concepto || 'Otro concepto';
      else if (formData.tipo_concepto === 'pago_factura') conceptoGenerado = 'Pago de factura';
      else if (formData.tipo_concepto === 'donativo') conceptoGenerado = 'Donativo';
      else if (formData.tipo_concepto === 'referencia') conceptoGenerado = `Referencia: ${formData.referencia || 'Sin especificar'}`;
      else conceptoGenerado = 'Pago a terceros';
      if (conceptoGenerado.length < 3) conceptoGenerado = 'Pago de factura';

      // Crear payload limpio sin campos undefined
      const payload: Record<string, unknown> = {
        departamento: formData.departamento,
        monto: parseFloat(formData.monto) || 0,
        tipo_moneda: formData.tipo_moneda,
        concepto: conceptoGenerado,
        tipo_pago: formData.tipo_pago,
        tipo_pago_descripcion: formData.tipo_pago_descripcion || '',
        empresa_a_pagar: formData.empresa_a_pagar || '',
        nombre_persona: formData.nombre_persona,
        fecha_limite_pago: formData.fecha_limite_pago,
        tipo_cuenta_destino: formData.tipo_cuenta_destino,
        tipo_tarjeta: formData.tipo_cuenta_destino === 'Número de Tarjeta' ? (formData.tipo_tarjeta || '') : '',
        banco_destino: formData.banco_destino || '',
        cuenta: formData.cuenta || '',
        cuenta_destino: formData.cuenta_destino || '',
        // Segunda forma
        tiene_segunda_forma_pago: formData.tiene_segunda_forma_pago,
        tipo_cuenta_destino_2: formData.tiene_segunda_forma_pago ? formData.tipo_cuenta_destino_2 : '',
        banco_destino_2: formData.tiene_segunda_forma_pago ? (formData.banco_destino_2 || '') : '',
        cuenta_destino_2: formData.tiene_segunda_forma_pago ? (formData.cuenta_destino_2 || '') : '',
        tipo_tarjeta_2: formData.tiene_segunda_forma_pago && formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' ? (formData.tipo_tarjeta_2 || '') : '',
        cuenta_2: formData.tiene_segunda_forma_pago ? (formData.cuenta_2 || '') : '',
      };

      // Agregar campos específicos de tarjeta institucional para forma de pago 1
      if (formData.tipo_cuenta_destino === 'Tarjeta Institucional' || formData.tipo_cuenta_destino === 'Tarjeta Instituciona') {
        payload.link_pago = formData.link_pago || '';
        payload.usuario_acceso = formData.usuario_acceso || '';
        payload.contrasena_acceso = formData.contrasena_acceso || '';
      }

      // Agregar campos específicos de tarjeta institucional para forma de pago 2
      if (formData.tiene_segunda_forma_pago && (formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' || formData.tipo_cuenta_destino_2 === 'Tarjeta Instituciona')) {
        payload.link_pago_2 = formData.link_pago_2 || '';
        payload.usuario_acceso_2 = formData.usuario_acceso_2 || '';
        payload.contrasena_acceso_2 = formData.contrasena_acceso_2 || '';
      }

      // Debug: verificar estructura del payload
      console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
      console.log('Solicitud ID:', solicitudId);

      // 1) Actualiza campos (sin archivo)
      try {
        await SolicitudesService.update(solicitudId, payload);
      } catch (updateError: unknown) {
        console.error('Error completo:', updateError);
        if (updateError && typeof updateError === 'object' && 'response' in updateError) {
          const axiosError = updateError as { response?: { data?: unknown; status?: number } };
          console.error('Error del servidor:', axiosError.response?.data);
          console.error('Status:', axiosError.response?.status);
        }
        throw updateError; // Re-lanzar para que se maneje abajo
      }

      // 1.5) Si hay nueva factura, subirla por separado
      if (formData.factura_file) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await SolicitudesService.subirFactura(solicitudId, formData.factura_file, token);
          }
        } catch (facturaError) {
          console.error('Error al subir nueva factura:', facturaError);
          // No fallar toda la operación por esto
        }
      }

      // 2) Elimina archivos existentes marcados
      for (const idArchivo of archivosAEliminar) {
        try {
          await SolicitudArchivosService.eliminarArchivo(idArchivo);
        } catch (err) {
          console.error('Error al eliminar archivo', idArchivo, err);
        }
      }

      // 3) Sube nuevos archivos adicionales
      if (formData.archivos_adicionales.length > 0) {
        try {
          await SolicitudArchivosService.subirArchivos(
            solicitudId,
            formData.archivos_adicionales,
            formData.tipos_archivos_adicionales
          );
        } catch (e) {
          console.error('Error al subir archivos adicionales', e);
          // No romper si falla la carga de adicionales
        }
      }

      toast.success('Solicitud actualizada correctamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = (err as Error)?.message || 'Error al actualizar la solicitud';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInicial) {
    return (
      <ProtectedRoute requiredRoles={['solicitante']}>
        <SolicitanteLayout>
          <div className="max-w-7xl mx-auto px-8 py-12 md:py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
              <div className="h-6 w-64 bg-white/20 rounded mb-3" />
              <div className="h-4 w-96 bg-white/10 rounded" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12 md:p-16">
              <div className="h-5 w-72 bg-white/10 rounded mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
              </div>
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
                  <p className="text-white/80 text-lg">Actualiza la información de tu solicitud</p>
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
                <h2 className="text-2xl font-bold text-white mb-1">Solicitud #{solicitudId}</h2>
                <p className="text-white/80 text-base">Edita los campos necesarios y guarda los cambios</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 max-w-full">
              {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
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
                      if (!value) setErrors((prev) => ({ ...prev, monto: 'Este campo es obligatorio' }));
                      else setErrors((prev) => ({ ...prev, monto: undefined }));
                    }}
                    className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.monto ? 'border-red-400' : ''}`}
                  />
                  {errors.monto && <span className="text-red-400 text-sm mt-1 block">{errors.monto}</span>}
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

              {/* SECCIÓN 2: INFORMACIÓN BANCARIA */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Información Bancaria
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      Datos Bancarios *
                    </label>
                    <select
                      name="tipo_cuenta_destino"
                      value={formData.tipo_cuenta_destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                    >
                      <option value="CLABE" className="text-black">CLABE</option>
                      <option value="Número de Tarjeta" className="text-black">Número de Tarjeta</option>
                      <option value="Tarjeta Institucional" className="text-black">Pago con Tarjeta Corporativa</option>
                    </select>
                  </div>

                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona' && (
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

                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona' && (
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

                  {formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona' && (
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
                          if (!value && cuentaConfig.required) {
                            setErrors((prev) => ({ ...prev, cuenta_destino: 'Este campo es obligatorio' }));
                          } else {
                            setErrors((prev) => ({ ...prev, cuenta_destino: undefined }));
                          }
                        }}
                        onBlur={e => {
                          if (e.target.value && formData.tipo_cuenta_destino !== 'Tarjeta Institucional' && formData.tipo_cuenta_destino !== 'Tarjeta Instituciona') {
                            verificarCuentaDestino(e.target.value);
                          }
                        }}
                        placeholder={cuentaConfig.placeholder}
                        required={cuentaConfig.required}
                        autoComplete="off"
                        className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide ${errors.cuenta_destino ? 'border-red-400' : ''}`}
                      />
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
                      {formData.cuenta_destino && errors.cuenta_destino && cuentaValida !== true && (
                        <span className="text-red-400 text-sm mt-1 block">{errors.cuenta_destino}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* TARJETA INSTITUCIONAL */}
              {formData.tipo_cuenta_destino === 'Tarjeta Institucional' && (
                <div className="bg-blue-600/10 rounded-xl p-6 border border-blue-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Datos de Acceso - Tarjeta Institucional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">Usuario de Acceso</label>
                      <input
                        type="text"
                        name="usuario_acceso"
                        value={formData.usuario_acceso}
                        onChange={handleInputChange}
                        placeholder="Usuario"
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">Contraseña</label>
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

              {/* BOTÓN AGREGAR SEGUNDA FORMA */}
              {!formData.tiene_segunda_forma_pago && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'tiene_segunda_forma_pago', value: true })}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Agregar Segunda Forma de Pago
                  </button>
                  <p className="text-white/60 text-sm mt-2">Opcional: Divide el pago en dos formas diferentes</p>
                </div>
              )}

              {/* SEGUNDA FORMA DE PAGO */}
              {formData.tiene_segunda_forma_pago && (
                <div className="bg-green-600/10 rounded-xl p-6 border border-green-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Segunda Forma de Pago
                    </h3>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-base font-medium text-white/90 mb-3">Datos Bancarios *</label>
                      <select
                        name="tipo_cuenta_destino_2"
                        value={formData.tipo_cuenta_destino_2}
                        onChange={handleInputChange}
                        required={formData.tiene_segunda_forma_pago}
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      >
                        <option value="CLABE" className="text-black">CLABE</option>
                        <option value="Número de Tarjeta" className="text-black">Número de Tarjeta</option>
                        <option value="Tarjeta Institucional" className="text-black">Pago con Tarjeta Corporativa</option>
                      </select>
                    </div>

                    {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">Banco (opcional)</label>
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

                    {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
                      <div>
                        <label className="block text-base font-medium text-white/90 mb-3">Cuenta (opcional)</label>
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

                  {formData.tipo_cuenta_destino_2 !== 'Tarjeta Institucional' && (
                    <div className="mb-6">
                      <label className="block text-base font-medium text-white/90 mb-3">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Cuenta Destino *
                      </label>
                      <input
                        type="text"
                        name="cuenta_destino_2"
                        value={formData.cuenta_destino_2}
                        onChange={handleInputChange}
                        placeholder={formData.tipo_cuenta_destino_2 === 'Número de Tarjeta' ? 'Número de tarjeta' : 'Número de cuenta CLABE'}
                        required={formData.tiene_segunda_forma_pago}
                        className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base font-mono tracking-wide"
                      />
                    </div>
                  )}

                  {formData.tipo_cuenta_destino_2 === 'Tarjeta Institucional' && (
                    <div className="bg-blue-600/10 rounded-xl p-6 border border-blue-600/30">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Datos de Acceso - Segunda Tarjeta Institucional
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">Usuario de Acceso</label>
                          <input
                            type="text"
                            name="usuario_acceso_2"
                            value={formData.usuario_acceso_2}
                            onChange={handleInputChange}
                            placeholder="Usuario"
                            className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-white/90 mb-3">Contraseña</label>
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

              {/* SECCIÓN 3: TIPO DE PAGO + FECHA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">Tipo de Pago</label>
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
                      if (!date) setErrors((prev) => ({ ...prev, fecha_limite_pago: 'Este campo es obligatorio' }));
                      else setErrors((prev) => ({ ...prev, fecha_limite_pago: undefined }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    placeholderText="Selecciona la fecha"
                    className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.fecha_limite_pago ? 'border-red-400' : ''}`}
                    calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                    locale={es}
                  />
                  {errors.fecha_limite_pago && <span className="text-red-400 text-sm mt-1 block">{errors.fecha_limite_pago}</span>}
                </div>

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

              {/* SECCIÓN 4: CONCEPTO */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Concepto *
                </label>

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

                {formData.tipo_concepto === 'otro' && (
                  <input
                    type="text"
                    name="concepto"
                    value={formData.concepto}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange({ target: { name: 'concepto', value: numericValue } } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    placeholder="Ingrese solo números..."
                    required
                    className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base ${errors.concepto ? 'border-red-400' : ''}`}
                  />
                )}

                {formData.tipo_concepto === 'referencia' && (
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">Referencia *</label>
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
                      Esta referencia corresponde a códigos o identificadores específicos que deben incluirse en el concepto.
                    </p>
                    {errors.referencia && <span className="text-red-400 text-sm mt-1 block">{errors.referencia}</span>}
                  </div>
                )}
                {errors.concepto && <span className="text-red-400 text-sm mt-1 block">{errors.concepto}</span>}
              </div>

              {/* SECCIÓN 5: BENEFICIARIO */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Building className="w-6 h-6 mr-3" />
                  Información del Beneficiario
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">
                      <span className="text-red-400">*</span> Nombre del Beneficiario
                    </label>
                    <input
                      type="text"
                      name="nombre_persona"
                      value={formData.nombre_persona}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombre completo de la persona física o moral"
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base transition-all duration-200 ${errors.nombre_persona ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                    />
                    {errors.nombre_persona && <span className="text-red-400 text-sm mt-1 block">{errors.nombre_persona}</span>}
                  </div>
                  <div>
                    <label className="block text-base font-medium text-white/90 mb-3">Se paga por: (opcional)</label>
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

              {/* SECCIÓN 6: DOCUMENTOS */}
              <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Upload className="w-6 h-6 mr-3" />
                  Documentos
                </h3>

                {/* Factura (existente + reemplazo opcional) */}
                <div className="mb-8">
                  <label className="block text-base font-medium text-white/90 mb-4">
                    Factura (si no subes una nueva, se mantiene la actual)
                  </label>

                  {facturaExistente && !formData.factura_file && (
                    <div className="p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500/20 border border-green-400/30">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{facturaExistente.nombre}</p>
                          <p className="text-white/70 text-sm">Factura actual</p>
                        </div>
                      </div>
                      {/* Si quieres permitir eliminar la factura actual, agrega un flujo específico en tu API */}
                    </div>
                  )}

                  <div className="relative mt-4">
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'factura_file')}
                      // En edición no es requerido
                      className={`w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40 text-base transition-all duration-200 ${errors.factura_file ? 'border-red-400 shadow-red-400/25 shadow-lg' : 'hover:border-white/50'}`}
                    />
                  </div>

                  {/* Previsualización de NUEVA factura */}
                  {formData.factura_file && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/20 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-green-500/20 border border-green-400/30">
                          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-white font-semibold text-lg">{formData.factura_file.name}</p>
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
                              <Image src={URL.createObjectURL(formData.factura_file)} alt="Previsualización" fill className="object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.factura_file && <span className="text-red-400 text-sm mt-2 block">{errors.factura_file}</span>}
                </div>

                {/* Archivos Adicionales EXISTENTES */}
                {archivosExistentes.length > 0 && (
                  <div className="mb-8">
                    <p className="text-white/90 font-medium mb-3">Archivos adicionales existentes</p>
                    <div className="space-y-3">
                      {archivosExistentes.map((a) => {
                        const marcado = archivosAEliminar.includes(a.id);
                        return (
                          <div key={a.id} className={`p-4 rounded-lg border flex items-center justify-between ${marcado ? 'border-red-400/40 bg-red-500/10' : 'border-white/20 bg-white/5'}`}>
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-white/80" />
                              <div>
                                <p className="text-white font-medium">{a.nombre}</p>
                                <p className="text-white/60 text-xs">{a.tipo}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleEliminarExistente(a.id)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${marcado ? 'bg-white/20 text-white' : 'bg-red-600/80 text-white hover:bg-red-700'}`}
                              title={marcado ? 'Desmarcar eliminación' : 'Marcar para eliminar'}
                            >
                              <Trash2 className="w-4 h-4" />
                              {marcado ? 'Desmarcar' : 'Eliminar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Archivos Adicionales NUEVOS */}
                <div className="border-t border-white/10 pt-8">
                  <label className="block text-base font-medium text-white/90 mb-4">
                    📎 Agregar nuevos archivos (opcional)
                    <span className="text-white/70 text-sm ml-2">(PDF, Excel, JPG, PNG - Máx. 5MB c/u)</span>
                  </label>

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

              {/* BOTONES */}
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
