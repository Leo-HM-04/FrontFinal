import { PlantillaSolicitud } from '@/types/plantillas';
import { 
  CreditCard, 
  Building, 
  ArrowLeftRight, 
  Banknote,
  Shield,
  FileText
} from 'lucide-react';

/**
 * SISTEMA DE PLANTILLAS DE SOLICITUDES
 * 
 * Este archivo contiene todas las plantillas disponibles para crear solicitudes
 * de pago en el sistema. Cada plantilla define su estructura, validaciones y
 * configuraciones específicas.
 * 
 * Última actualización: 08 de Octubre 2025
 * @version 2.0.0
 */

// ============================================================================
// PLANTILLAS DE PAGOS CORPORATIVOS
// ============================================================================

/**
 * Plantilla: SOLICITUD DE PAGO TARJETAS N09 Y TOKA
 * 
 * Propósito: Gestionar pagos a proveedores de tarjetas N09 y fondeo de tarjetas TOKA
 * Departamentos: Tesorería, Finanzas
 * Uso frecuente: Pagos corporativos recurrentes
 */
export const plantillaTarjetasN09Toka: PlantillaSolicitud = {
  id: 'tarjetas-n09-toka',
  nombre: 'SOLICITUD DE PAGO TARJETAS N09 Y TOKA',
  descripcion: 'Plantilla especializada para pagos a proveedores de tarjetas N09 y fondeo de tarjeta TOKA',
  version: '2.0.0',
  activa: true,
  icono: CreditCard,
  color: 'blue',
  categoria: 'Pagos Corporativos',
  secciones: [
    {
      id: 'informacion-basica',
      titulo: 'Información Básica',
      descripcion: 'Datos principales de la solicitud',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'radio',
          etiqueta: 'Asunto',
          ayuda: 'Seleccione el tipo de pago requerido',
          valorPorDefecto: '',
          opciones: [
            {
              valor: 'PAGO_PROVEEDOR_N09',
              etiqueta: 'PAGO A PROVEEDOR DE TARJETA N09',
              descripcion: 'Para pagos directos al proveedor de tarjetas N09'
            },
            {
              valor: 'TOKA_FONDEO_AVIT',
              etiqueta: 'PAGO PARA FONDEO DE TARJETA TOKA',
              descripcion: 'Para fondeo de la tarjeta TOKA'
            }
          ],
          validaciones: {
            requerido: true,
            mensaje: 'Debe seleccionar un tipo de asunto'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'cliente',
          nombre: 'cliente',
          tipo: 'texto',
          etiqueta: 'Cliente',
          placeholder: 'Ingrese el nombre del cliente (ej. ROCALLOSA)',
          ayuda: 'Nombre del cliente para el cual se realiza el pago',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 3,
            maxLength: 100,
            mensaje: 'El cliente es requerido y debe tener entre 3 y 100 caracteres'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'beneficiario',
          nombre: 'beneficiario',
          tipo: 'texto',
          etiqueta: 'Se paga por',
          placeholder: 'Ingrese el nombre de la empresa o persona beneficiaria del pago',
          ayuda: 'Nombre completo del beneficiario del pago. Para el pago de las tarjetas N09 y TOKA se realiza pago al proveedor de las tarjetas, quien es quien realiza el fondeo a la tarjeta.',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 5,
            maxLength: 200,
            mensaje: 'El beneficiario es requerido y debe tener entre 5 y 200 caracteres'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'datos-bancarios',
      titulo: 'Datos Bancarios',
      descripcion: 'Información de la cuenta destino',
      campos: [
        {
          id: 'tipo_cuenta',
          nombre: 'tipo_cuenta',
          tipo: 'radio',
          etiqueta: 'Tipo de Cuenta',
          ayuda: 'Seleccione si utilizará CLABE o número de cuenta',
          valorPorDefecto: 'CLABE',
          opciones: [
            {
              valor: 'CLABE',
              etiqueta: 'CLABE Interbancaria',
              descripcion: 'Clave Bancaria Estandarizada (16 o 18 dígitos)'
            },
            {
              valor: 'CUENTA',
              etiqueta: 'Número de Cuenta',
              descripcion: 'Número de cuenta bancaria (8 a 10 dígitos)'
            }
          ],
          validaciones: {
            requerido: true
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'numero_cuenta',
          nombre: 'numero_cuenta',
          tipo: 'cuenta_clabe',
          etiqueta: 'CUENTA/CLABE',
          placeholder: 'Ingrese CLABE (18 dígitos) o número de cuenta (10 dígitos)',
          ayuda: 'Número de la cuenta destino a realizar el depósito. CLABE: 16 o 18 dígitos. Cuenta: 8 a 10 dígitos.',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            soloNumeros: true,
            mensaje: 'Ingrese un número de cuenta válido'
          },
          dependencias: [
            {
              campo: 'tipo_cuenta',
              valor: 'CLABE',
              accion: 'mostrar'
            },
            {
              campo: 'tipo_cuenta', 
              valor: 'CUENTA',
              accion: 'mostrar'
            }
          ],
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'banco_destino',
          nombre: 'banco_destino',
          tipo: 'banco',
          etiqueta: 'Banco Destino',
          ayuda: 'Seleccione el banco de destino de la transferencia',
          valorPorDefecto: 'STP',
          validaciones: {
            requerido: true,
            mensaje: 'Debe seleccionar un banco'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'monto-pago',
      titulo: 'Información del Pago',
      descripcion: 'Detalles del monto a transferir',
      campos: [
        {
          id: 'monto',
          nombre: 'monto',
          tipo: 'moneda',
          etiqueta: 'Monto Total',
          placeholder: 'Ingrese el monto total del pago (ej. $56,250.36)',
          ayuda: 'Monto a pagar al proveedor',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'El monto es requerido y debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'moneda',
          nombre: 'moneda',
          tipo: 'select',
          etiqueta: 'Moneda',
          valorPorDefecto: 'MXN',
          opciones: [
            { valor: 'MXN', etiqueta: 'Pesos Mexicanos (MXN)' },
            { valor: 'USD', etiqueta: 'Dólares Americanos (USD)' },
            { valor: 'EUR', etiqueta: 'Euros (EUR)' }
          ],
          validaciones: {
            requerido: true
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'documentos',
      titulo: 'Archivos Adjuntos',
      descripcion: 'Documentos de soporte para la solicitud',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivo',
          etiqueta: 'Documentos de soporte',
          ayuda: 'Adjunta solo documentos de soporte (ejemplo: cotizaciones, facturas, contratos, excel de cálculo, etc). El comprobante de pago solo lo sube el pagador cuando la solicitud está pagada.',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe adjuntar al menos un archivo'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'amplio'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 10 * 1024 * 1024, // 10MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// PLANTILLAS DE TARJETAS CORPORATIVAS
// ============================================================================

/**
 * Plantilla: SOLICITUD DE PAGO TARJETAS TUKASH
 * 
 * Propósito: Gestionar pagos y fondeo exclusivo de tarjetas TUKASH
 * Departamentos: Tesorería, Finanzas
 * Características: Validación de número de tarjeta, montos duales
 */
export const plantillaTarjetasTukash: PlantillaSolicitud = {
  id: 'tarjetas-tukash',
  nombre: 'SOLICITUD DE PAGO TARJETAS TUKASH',
  descripcion: 'Plantilla especializada para pagos y fondeo de tarjetas TUKASH',
  version: '2.0.0',
  activa: true,
  icono: CreditCard,
  color: 'green',
  categoria: 'Pagos Corporativos',
  secciones: [
    {
      id: 'informacion-basica',
      titulo: 'Información Básica',
      descripcion: 'Datos principales de la solicitud TUKASH',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'select',
          etiqueta: 'Asunto',
          ayuda: 'Ej. SOLICITUD PAGO A TUKASH FONDEO',
          valorPorDefecto: '',
          opciones: [
            {
              valor: 'TUKASH',
              etiqueta: 'TUKASH',
              descripcion: 'Solicitud de pago para fondeo TUKASH'
            }
          ],
          validaciones: {
            requerido: true,
            mensaje: 'Debe seleccionar el asunto TUKASH'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'cliente',
          nombre: 'cliente',
          tipo: 'texto',
          etiqueta: 'Cliente',
          placeholder: 'Ingrese el nombre del cliente correspondiente',
          ayuda: 'Nombre del cliente correspondiente',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre del cliente'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'beneficiario_tarjeta',
          nombre: 'beneficiario_tarjeta',
          tipo: 'texto',
          etiqueta: 'Se paga por',
          placeholder: 'Ingrese el nombre completo de la persona beneficiaria',
          ayuda: 'Nombre completo del beneficiario de la tarjeta',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 3,
            mensaje: 'Ingrese el nombre completo del beneficiario'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ]
    },
    {
      id: 'datos-tarjeta',
      titulo: 'Datos de Tarjeta',
      descripcion: 'Información específica de la tarjeta TUKASH',
      campos: [
        {
          id: 'numero_tarjeta',
          nombre: 'numero_tarjeta',
          tipo: 'texto',
          etiqueta: 'Número de Tarjeta',
          placeholder: 'Ingrese los 16 dígitos de la tarjeta',
          ayuda: 'Número de tarjeta TUKASH (máximo 16 dígitos)',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            soloNumeros: true,
            maxLength: 16,
            minLength: 13,
            mensaje: 'Ingrese un número de tarjeta válido (13-16 dígitos)'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ]
    },
    {
      id: 'montos',
      titulo: 'Montos',
      descripcion: 'Cantidades para el fondeo',
      campos: [
        {
          id: 'monto_total_cliente',
          nombre: 'monto_total_cliente',
          tipo: 'moneda',
          etiqueta: 'Monto Total del Cliente',
          placeholder: 'Ingrese la cantidad a fondear al cliente',
          ayuda: 'Cantidad a fondear al cliente',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Ingrese el monto total del cliente'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'monto_total_tukash',
          nombre: 'monto_total_tukash',
          tipo: 'moneda',
          etiqueta: 'Monto Total de Tukash',
          placeholder: 'Ingrese la cantidad a depositar en TUKASH',
          ayuda: 'Cantidad a depositar en la cuenta TUKASH',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Ingrese el monto total TUKASH'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ]
    },
    {
      id: 'archivos',
      titulo: 'Documentos',
      descripcion: 'Archivos adjuntos requeridos',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivo',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Seleccione o arrastre los documentos necesarios. Formatos permitidos: PDF, JPG, PNG, XLSX, DOCX',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe adjuntar al menos un documento'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ]
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.docx', '.xls', '.doc'],
    tamanoMaximoArchivo: 10 * 1024 * 1024, // 10MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// PLANTILLAS DE PAGOS FISCALES E IMSS
// ============================================================================

/**
 * Plantilla: PAGO SUA INTERNAS
 * 
 * Propósito: Gestionar pagos de impuestos IMSS para empresas internas
 * Departamentos: Seguridad Social, Contabilidad, Tesorería
 * Características: Línea de captura IMSS, fecha límite, archivos ZIP
 */
export const plantillaPagoSuaInternas: PlantillaSolicitud = {
  id: 'pago-sua-internas',
  nombre: 'PAGO SUA INTERNAS',
  descripcion: 'Plantilla especializada para pagos de impuestos relacionados con el IMSS enviados por el Departamento de Seguridad Social',
  version: '2.0.0',
  activa: true,
  icono: FileText,
  color: 'purple',
  categoria: 'Pagos Fiscales',
  secciones: [
    {
      id: 'informacion-basica',
      titulo: 'Información Básica',
      descripcion: 'Datos principales del pago SUA INTERNAS',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'texto',
          etiqueta: 'Asunto',
          placeholder: 'Ingrese el asunto del pago (ej. PAGO SUA INTERNAS JULIO 2025)',
          ayuda: 'Ej. PAGO SUA INTERNAS JULIO 2025',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 5,
            maxLength: 150,
            mensaje: 'El asunto es requerido y debe tener entre 5 y 150 caracteres'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'empresa',
          nombre: 'empresa',
          tipo: 'texto',
          etiqueta: 'Se paga por',
          placeholder: 'Ingrese el nombre de la empresa (ej. MINBERLOC)',
          ayuda: 'Identifica a la empresa a la que corresponde el pago del impuesto. Ej. MINBERLOC',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            maxLength: 100,
            mensaje: 'La empresa es requerida y debe tener entre 2 y 100 caracteres'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'monto',
          nombre: 'monto',
          tipo: 'moneda',
          etiqueta: 'Monto Total',
          placeholder: 'Ingrese el monto total conforme a SIPARE',
          ayuda: 'El monto a pagar señalado en SIPARE se encuentra en los documentos contenidos en el archivo ZIP recibido',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'El monto es requerido y debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'fechas-captura',
      titulo: 'Fechas y Línea de Captura',
      descripcion: 'Información temporal y datos de captura del IMSS',
      campos: [
        {
          id: 'fecha_limite',
          nombre: 'fecha_limite',
          tipo: 'fecha',
          etiqueta: 'Fecha Límite',
          ayuda: 'Fecha límite para pagar el impuesto',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'La fecha límite es requerida'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'linea_captura',
          nombre: 'linea_captura',
          tipo: 'texto',
          etiqueta: 'Línea de Captura',
          placeholder: 'Ingrese la línea de captura proporcionada por el IMSS',
          ayuda: 'Corresponde a la línea de captura proporcionada por el IMSS para realizar el pago del impuesto. Este código se incluirá automáticamente en el concepto del pago.',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            maxLength: 200,
            patron: '^[A-Z0-9-]+$',
            mensaje: 'La línea de captura es requerida y debe contener solo letras mayúsculas, números y guiones'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'documentos',
      titulo: 'Archivos Adjuntos',
      descripcion: 'Documentos de soporte para el pago SUA INTERNAS',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivo',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Archivo ZIP que contiene 6 documentos en formato PDF con la información necesaria para efectuar el pago del impuesto. Selecciona o arrastra los documentos necesarios.',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe adjuntar al menos un archivo ZIP con los documentos necesarios'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'amplio'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.zip', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB (mayor por los archivos ZIP)
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

/**
 * Plantilla: PAGO SUA FRENSHETSI
 * 
 * Propósito: Gestionar pagos de impuestos IMSS específicos para FRENSHETSI
 * Departamentos: Seguridad Social, Contabilidad, Tesorería
 * Características: Empresa fija (FRENSHETSI), cliente variable, línea de captura
 */
export const plantillaPagoSuaFrenshetsi: PlantillaSolicitud = {
  id: 'pago-sua-frenshetsi',
  nombre: 'PAGO SUA FRENSHETSI',
  descripcion: 'Plantilla especializada para pagos de impuestos SUA FRENSHETSI relacionados con el IMSS enviados por el Departamento de Seguridad Social',
  version: '2.0.0',
  activa: true,
  icono: Building,
  color: 'indigo',
  categoria: 'Pagos Fiscales',
  secciones: [
    {
      id: 'informacion-basica',
      titulo: 'Información Básica',
      descripcion: 'Datos principales del pago SUA FRENSHETSI',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'texto',
          etiqueta: 'Asunto',
          placeholder: 'Ingrese el asunto del pago (ej. PAGO SUA FRENSHETSI JULIO 2025)',
          ayuda: 'Ej. PAGO SUA FRENSHETSI JULIO 2025',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 5,
            maxLength: 150,
            mensaje: 'El asunto es requerido y debe tener entre 5 y 150 caracteres'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'empresa',
          nombre: 'empresa',
          tipo: 'texto',
          etiqueta: 'Se paga por',
          placeholder: 'Empresa fija: FRENSHETSI',
          ayuda: 'Empresa fija para pagos SUA FRENSHETSI',
          valorPorDefecto: 'FRENSHETSI',
          validaciones: {
            requerido: true,
            mensaje: 'La empresa FRENSHETSI es requerida'
          },
          estilos: {
            ancho: 'medio',
            soloLectura: true
          }
        },
        {
          id: 'cliente',
          nombre: 'cliente',
          tipo: 'texto',
          etiqueta: 'Cliente',
          placeholder: 'Ingrese el nombre del cliente (ej. ROCALLOSA)',
          ayuda: 'Identifica al cliente correspondiente. Ej. ROCALLOSA',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            maxLength: 100,
            mensaje: 'El cliente es requerido y debe tener entre 2 y 100 caracteres'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'monto',
          nombre: 'monto',
          tipo: 'moneda',
          etiqueta: 'Monto Total',
          placeholder: 'Ingrese el monto total conforme a SIPARE',
          ayuda: 'El monto a pagar señalado en SIPARE se encuentra en los documentos contenidos en el archivo ZIP recibido',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'El monto es requerido y debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'fechas-captura',
      titulo: 'Fechas y Línea de Captura',
      descripcion: 'Información temporal y datos de captura del IMSS',
      campos: [
        {
          id: 'fecha_limite',
          nombre: 'fecha_limite',
          tipo: 'fecha',
          etiqueta: 'Fecha Límite',
          ayuda: 'Fecha límite para pagar el impuesto',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'La fecha límite es requerida'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'linea_captura',
          nombre: 'linea_captura',
          tipo: 'texto',
          etiqueta: 'Línea de Captura',
          placeholder: 'Ingrese la línea de captura proporcionada por el IMSS',
          ayuda: 'Corresponde a la línea de captura proporcionada por el IMSS para realizar el pago del impuesto. Este código se incluirá automáticamente en el concepto del pago.',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            maxLength: 200,
            patron: '^[A-Z0-9-]+$',
            mensaje: 'La línea de captura es requerida y debe contener solo letras mayúsculas, números y guiones'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'documentos',
      titulo: 'Archivos Adjuntos',
      descripcion: 'Documentos de soporte para el pago SUA FRENSHETSI',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivo',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Archivo ZIP que contiene 6 documentos en formato PDF con la información necesaria para efectuar el pago del impuesto. Selecciona o arrastra los documentos necesarios.',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe adjuntar al menos un archivo ZIP con los documentos necesarios'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'amplio'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.zip', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB (mayor por los archivos ZIP)
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// PLANTILLAS DE COMISIONES Y COMPENSACIONES
// ============================================================================

/**
 * Plantilla: PAGO COMISIONES
 * 
 * Propósito: Gestionar pagos de comisiones a empleados y colaboradores
 * Departamentos: Recursos Humanos, Tesorería, Finanzas
 * Características: Cliente generador, beneficiario, datos bancarios
 */
export const plantillaPagoComisiones: PlantillaSolicitud = {
  id: 'pago-comisiones',
  nombre: 'PAGO COMISIONES',
  descripcion: 'Plantilla para solicitudes de pago de comisiones',
  version: '2.0.0',
  activa: true,
  categoria: 'pagos',
  icono: Banknote,
  secciones: [
    {
      id: 'datos-generales',
      titulo: 'Datos de Comisión',
      descripcion: 'Información general del pago de comisión',
      campos: [
        {
          id: 'tipo_pago',
          nombre: 'tipo_pago',
          tipo: 'select',
          etiqueta: 'Tipo de Pago',
          ayuda: 'Seleccione el tipo de pago',
          valorPorDefecto: 'pago_comision',
          validaciones: {
            requerido: true,
            mensaje: 'Seleccione el tipo de pago'
          },
          opciones: [
            { valor: 'pago_comision', etiqueta: 'pago de comisión' }
          ],
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'cliente_comision',
          nombre: 'cliente_comision',
          tipo: 'texto',
          etiqueta: 'Cliente por el cual se genera la comisión',
          placeholder: 'Ingrese el nombre del cliente que genera la comisión',
          ayuda: 'Cliente por el cual se genera la comisión',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre del cliente'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'textarea',
          etiqueta: 'Asunto',
          placeholder: 'Ingrese una descripción detallada del asunto de la comisión',
          ayuda: 'Ej. Solicitud de Pago de Comisión Juan Dominguez Banch Services | Movimiento 02 de septiembre 2025',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            mensaje: 'El asunto debe tener al menos 10 caracteres'
          },
          estilos: {
            filas: 3,
            ancho: 'completo'
          }
        },
        {
          id: 'beneficiario',
          nombre: 'beneficiario',
          tipo: 'texto',
          etiqueta: 'Se paga por',
          placeholder: 'Ingrese el nombre completo de quien recibe el pago',
          ayuda: 'Ej. JUAN DOMINGUEZ',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre del beneficiario'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'cuenta_clabe',
          nombre: 'cuenta_clabe',
          tipo: 'selector_cuenta',
          etiqueta: 'CUENTA/CLABE',
          ayuda: 'Seleccione el tipo de cuenta interbancaria',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Debe seleccionar tipo de cuenta e ingresar el número'
          },
          opciones: [
            { valor: 'clabe', etiqueta: 'CLABE (16-18 dígitos)' },
            { valor: 'cuenta', etiqueta: 'CUENTA (8-10 dígitos)' }
          ],
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'banco_destino',
          nombre: 'banco_destino',
          tipo: 'select_banco',
          etiqueta: 'Banco Destino',
          placeholder: 'Selecciona el banco',
          ayuda: 'Banco destino al que pertenece la cuenta o clabe proporcionada',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Seleccione el banco destino'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'monto',
          nombre: 'monto',
          tipo: 'numero',
          etiqueta: 'Monto Total',
          placeholder: 'Ej. 56,000.00',
          ayuda: 'Monto a pagar a la cuenta',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minimo: 0.01,
            mensaje: 'El monto debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio',
            formato: 'moneda'
          }
        },
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivos',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Dos archivos excel con el cálculo de las comisiones y una imagen o pdf con el comprobante del pago',
          valorPorDefecto: '',
          validaciones: {
            requerido: false
          },
          estilos: {
            ancho: 'completo',
            multiple: true
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'amplio'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// PLANTILLAS DE SEGUROS Y PÓLIZAS
// ============================================================================

/**
 * Plantilla: PAGO POLIZAS
 * 
 * Propósito: Gestionar pagos de pólizas de seguros a diversas aseguradoras
 * Departamentos: Administración, Tesorería, Seguros
 * Características: Múltiples aseguradoras, métodos de pago dinámicos (máx 4)
 */
export const plantillaPagoPolizasGnp: PlantillaSolicitud = {
  id: 'pago-polizas-gnp',
  nombre: 'PAGO POLIZAS',
  descripcion: 'Plantilla para solicitudes de pago de pólizas y otras aseguradoras',
  version: '2.0.0',
  activa: true,
  categoria: 'pagos',
  icono: Shield,
  secciones: [
    {
      id: 'datos-generales',
      titulo: 'Datos Generales',
      descripcion: 'Información general del pago de pólizas',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'textarea',
          etiqueta: 'Asunto',
          placeholder: 'Describe el asunto del pago',
          ayuda: 'Ej. Recibo de pago 1/1 // Seguro Vida GNP // Corporativo Banch',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            mensaje: 'El asunto debe tener al menos 10 caracteres'
          },
          estilos: {
            filas: 3,
            ancho: 'completo'
          }
        },
        {
          id: 'titular_cuenta',
          nombre: 'titular_cuenta',
          tipo: 'select',
          etiqueta: 'Titular de la Cuenta',
          ayuda: 'Seleccione la aseguradora correspondiente',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Seleccione el titular de la cuenta'
          },
          opciones: [
            { valor: 'gnp', etiqueta: 'GNP' },
            { valor: 'zurich', etiqueta: 'ZURICH' },
            { valor: 'axa', etiqueta: 'AXA' },
            { valor: 'seguros_monterrey', etiqueta: 'Seguros Monterrey' },
            { valor: 'qualitas', etiqueta: 'Qualitas' },
            { valor: 'allianz', etiqueta: 'Allianz' }
          ],
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'empresa_emisora',
          nombre: 'empresa_emisora',
          tipo: 'texto',
          etiqueta: 'Empresa Emisora del Pago',
          placeholder: 'Nombre de la empresa emisora',
          ayuda: 'Ej. CORPORATIVO BANCH',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre de la empresa emisora'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'metodos-pago',
      titulo: 'Métodos de Pago',
      descripcion: 'Configure los métodos de pago (máximo 4)',
      campos: [
        {
          id: 'metodos_pago',
          nombre: 'metodos_pago',
          tipo: 'metodos_pago_dinamicos',
          etiqueta: 'Métodos de Pago',
          ayuda: 'Agregue hasta 4 métodos de pago diferentes',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe agregar al menos un método de pago'
          },
          estilos: {
            ancho: 'completo',
            maximo: 4
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'amplio'
      }
    },
    {
      id: 'datos-finales',
      titulo: 'Datos Finales',
      descripcion: 'Monto y archivos adjuntos',
      campos: [
        {
          id: 'monto',
          nombre: 'monto',
          tipo: 'numero',
          etiqueta: 'Monto Total',
          placeholder: 'Ej. 56,000.00',
          ayuda: 'Monto a pagar al proveedor',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minimo: 0.01,
            mensaje: 'El monto debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio',
            formato: 'moneda'
          }
        },
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivos',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Dos o tres documentos en formato PDF que contengan los datos de pago y la carátula de la póliza',
          valorPorDefecto: '',
          validaciones: {
            requerido: false
          },
          estilos: {
            ancho: 'completo',
            multiple: true
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// PLANTILLAS DE REGRESOS Y REEMBOLSOS
// ============================================================================

/**
 * Plantilla: REGRESOS EN TRANSFERENCIA
 * 
 * Propósito: Gestionar devoluciones de fondos mediante transferencia bancaria
 * Departamentos: Tesorería, Atención a Clientes
 * Características: Cuentas dinámicas (máx 3), datos bancarios completos
 */
export const plantillaRegresosTransferencia: PlantillaSolicitud = {
  id: 'regresos-transferencia',
  nombre: 'REGRESOS EN TRANSFERENCIA',
  descripcion: 'Plantilla para solicitudes de regreso de transferencias bancarias',
  version: '2.0.0',
  activa: true,
  categoria: 'regresos',
  icono: ArrowLeftRight,
  secciones: [
    {
      id: 'datos-generales',
      titulo: 'Datos Generales',
      descripcion: 'Información general del regreso de transferencia',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'texto',
          etiqueta: 'Asunto',
          placeholder: 'Describe el asunto del regreso',
          ayuda: 'Ej. Solicitud de regreso Juan Dominguez 123456',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            mensaje: 'El asunto debe tener al menos 10 caracteres'
          },
          estilos: {
            ancho: 'completo'
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'normal'
      }
    },
    {
      id: 'cuentas-transferencia',
      titulo: 'Cuentas de Transferencia',
      descripcion: 'Configure las cuentas de destino (máximo 3)',
      campos: [
        {
          id: 'cuentas_transferencia',
          nombre: 'cuentas_transferencia',
          tipo: 'cuentas_dinamicas',
          etiqueta: 'Cuentas de Transferencia',
          ayuda: 'Agregue hasta 3 cuentas de transferencia diferentes',
          valorPorDefecto: [],
          validaciones: {
            requerido: true,
            mensaje: 'Debe agregar al menos una cuenta de transferencia'
          },
          estilos: {
            ancho: 'completo',
            maximo: 3
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'amplio'
      }
    },
    {
      id: 'archivos-adjuntos',
      titulo: 'Documentación',
      descripcion: 'Archivos de soporte',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivos',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Dos archivos excel con el cálculo de las comisiones y una imagen o pdf con el comprobante del pago',
          valorPorDefecto: '',
          validaciones: {
            requerido: false
          },
          estilos: {
            ancho: 'completo',
            multiple: true
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'normal'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

/**
 * Plantilla: REGRESOS EN EFECTIVO
 * 
 * Propósito: Gestionar devoluciones de fondos en efectivo con viáticos
 * Departamentos: Tesorería, Atención a Clientes
 * Características: Montos efectivo + viáticos, elementos adicionales, fecha entrega
 */
export const plantillaRegresosEfectivo: PlantillaSolicitud = {
  id: 'regresos-efectivo',
  nombre: 'REGRESOS EN EFECTIVO',
  descripcion: 'Plantilla para solicitudes de regreso en efectivo',
  version: '2.0.0',
  activa: true,
  categoria: 'regresos',
  icono: Banknote,
  secciones: [
    {
      id: 'datos-generales',
      titulo: 'Datos Generales',
      descripcion: 'Información general del regreso en efectivo',
      campos: [
        {
          id: 'asunto',
          nombre: 'asunto',
          tipo: 'texto',
          etiqueta: 'Asunto',
          placeholder: 'Describe el asunto del regreso',
          ayuda: 'Ej. Solicitud Regreso en Efectivo - BANCH',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 10,
            mensaje: 'El asunto debe tener al menos 10 caracteres'
          },
          estilos: {
            ancho: 'completo'
          }
        },
        {
          id: 'cliente',
          nombre: 'cliente',
          tipo: 'texto',
          etiqueta: 'Cliente',
          placeholder: 'Nombre del cliente',
          ayuda: 'Ej. ROCALLOSA',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre del cliente'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'persona_recibe',
          nombre: 'persona_recibe',
          tipo: 'texto',
          etiqueta: 'Persona que Recibe',
          placeholder: 'Nombre de la persona que recibe',
          ayuda: 'Ej. Juan Domínguez',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 2,
            mensaje: 'Ingrese el nombre de la persona que recibe'
          },
          estilos: {
            ancho: 'medio'
          }
        },
        {
          id: 'fecha_entrega',
          nombre: 'fecha_entrega',
          tipo: 'fecha',
          etiqueta: 'Fecha de Entrega',
          ayuda: 'Fecha de entrega de efectivo de Tesorería a Atención a Clientes',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            mensaje: 'Seleccione la fecha de entrega'
          },
          estilos: {
            ancho: 'medio'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'montos',
      titulo: 'Montos',
      descripcion: 'Montos de efectivo y viáticos',
      campos: [
        {
          id: 'monto_efectivo',
          nombre: 'monto_efectivo',
          tipo: 'numero',
          etiqueta: 'Monto Total en Efectivo',
          placeholder: 'Ej. 56,000.00',
          ayuda: 'Monto que tesorería debe entregar en efectivo',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minimo: 0.01,
            mensaje: 'El monto efectivo debe ser mayor a 0'
          },
          estilos: {
            ancho: 'medio',
            formato: 'moneda'
          }
        },
        {
          id: 'viaticos',
          nombre: 'viaticos',
          tipo: 'numero',
          etiqueta: 'Viáticos',
          placeholder: 'Ej. 500.00',
          ayuda: 'Son los viáticos en efectivo que se entregarán a la persona que hará la entrega del efectivo',
          valorPorDefecto: '',
          validaciones: {
            requerido: false,
            minimo: 0,
            mensaje: 'Los viáticos deben ser mayor o igual a 0'
          },
          estilos: {
            ancho: 'medio',
            formato: 'moneda'
          }
        }
      ],
      estilos: {
        columnas: 2,
        espaciado: 'normal'
      }
    },
    {
      id: 'adicionales',
      titulo: 'Adicionales',
      descripcion: 'Elementos adicionales opcionales',
      campos: [
        {
          id: 'elementos_adicionales',
          nombre: 'elementos_adicionales',
          tipo: 'textarea',
          etiqueta: 'Adicionales',
          placeholder: 'Ej. 1 TARJETA BANORTE, 1 TOKEN BANORTE, Cheque de viaje',
          ayuda: 'Describa los elementos adicionales que se entregan junto con el efectivo (opcional)',
          valorPorDefecto: '',
          validaciones: {
            requerido: false
          },
          estilos: {
            ancho: 'completo',
            filas: 3
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'normal'
      }
    },
    {
      id: 'documentacion',
      titulo: 'Documentación',
      descripcion: 'Archivos de soporte',
      campos: [
        {
          id: 'archivos_adjuntos',
          nombre: 'archivos_adjuntos',
          tipo: 'archivos',
          etiqueta: 'Archivos Adjuntos',
          ayuda: 'Dos archivos excel con el cálculo de las comisiones y una imagen o pdf con el comprobante del pago',
          valorPorDefecto: '',
          validaciones: {
            requerido: false
          },
          estilos: {
            ancho: 'completo',
            multiple: true
          }
        }
      ],
      estilos: {
        columnas: 1,
        espaciado: 'normal'
      }
    }
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.doc', '.docx'],
    tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// ============================================================================
// REGISTRO Y GESTIÓN DE PLANTILLAS
// ============================================================================

/**
 * Lista completa de todas las plantillas disponibles en el sistema
 * 
 * @constant plantillasDisponibles
 * @type {PlantillaSolicitud[]}
 * @description Array que contiene todas las plantillas registradas.
 *              Se usa como fuente única de verdad para el sistema de plantillas.
 */
export const plantillasDisponibles: PlantillaSolicitud[] = [
  plantillaTarjetasN09Toka,
  plantillaTarjetasTukash,
  plantillaPagoSuaInternas,
  plantillaPagoSuaFrenshetsi,
  plantillaPagoComisiones,
  plantillaPagoPolizasGnp,
  plantillaRegresosTransferencia,
  plantillaRegresosEfectivo
];

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Obtiene una plantilla específica por su ID único
 * 
 * @param {string} id - ID único de la plantilla
 * @returns {PlantillaSolicitud | null} La plantilla encontrada o null
 * @example
 * const plantilla = obtenerPlantillaPorId('tarjetas-n09-toka');
 */
export const obtenerPlantillaPorId = (id: string): PlantillaSolicitud | null => {
  return plantillasDisponibles.find(plantilla => plantilla.id === id) || null;
};

/**
 * Obtiene todas las plantillas activas del sistema
 * 
 * @returns {PlantillaSolicitud[]} Array de plantillas activas
 * @example
 * const activas = obtenerPlantillasActivas();
 */
export const obtenerPlantillasActivas = (): PlantillaSolicitud[] => {
  return plantillasDisponibles.filter(plantilla => plantilla.activa);
};

/**
 * Obtiene todas las plantillas (activas e inactivas)
 * 
 * @returns {PlantillaSolicitud[]} Array de todas las plantillas
 * @example
 * const todas = obtenerTodasLasPlantillas();
 */
export const obtenerTodasLasPlantillas = (): PlantillaSolicitud[] => {
  return plantillasDisponibles;
};

/**
 * Obtiene todas las plantillas inactivas del sistema
 * 
 * @returns {PlantillaSolicitud[]} Array de plantillas inactivas
 * @example
 * const inactivas = obtenerPlantillasInactivas();
 */
export const obtenerPlantillasInactivas = (): PlantillaSolicitud[] => {
  return plantillasDisponibles.filter(plantilla => !plantilla.activa);
};

/**
 * Obtiene plantillas filtradas por categoría
 * 
 * @param {string} categoria - Categoría de las plantillas
 * @returns {PlantillaSolicitud[]} Array de plantillas de la categoría
 * @example
 * const pagosFiscales = obtenerPlantillasPorCategoria('Pagos Fiscales');
 */
export const obtenerPlantillasPorCategoria = (categoria: string): PlantillaSolicitud[] => {
  return plantillasDisponibles.filter(plantilla => plantilla.categoria === categoria);
};

/**
 * Valida si una plantilla existe y está activa
 * 
 * @param {string} id - ID de la plantilla a validar
 * @returns {boolean} true si existe y está activa, false en caso contrario
 * @example
 * if (validarPlantillaActiva('tarjetas-n09-toka')) {
 *   // procesar solicitud
 * }
 */
export const validarPlantillaActiva = (id: string): boolean => {
  const plantilla = obtenerPlantillaPorId(id);
  return plantilla !== null && plantilla.activa;
};

/**
 * Obtiene estadísticas generales de las plantillas
 * 
 * @returns {Object} Objeto con estadísticas del sistema
 */
export const obtenerEstadisticasPlantillas = () => {
  return {
    total: plantillasDisponibles.length,
    activas: plantillasDisponibles.filter(p => p.activa).length,
    inactivas: plantillasDisponibles.filter(p => !p.activa).length,
    categorias: [...new Set(plantillasDisponibles.map(p => p.categoria))],
    ultimaActualizacion: new Date().toISOString()
  };
};
