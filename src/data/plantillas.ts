import { PlantillaSolicitud } from '@/types/plantillas';

// Plantilla para SOLICITUD DE PAGO TARJETAS N09 Y TOKA
export const plantillaTarjetasN09Toka: PlantillaSolicitud = {
  id: 'tarjetas-n09-toka',
  nombre: 'SOLICITUD DE PAGO TARJETAS N09 Y TOKA',
  descripcion: 'Plantilla especializada para pagos a proveedores de tarjetas N09 y fondeo de tarjeta AVIT',
  version: '1.0',
  activa: true,
  icono: '💳',
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
              etiqueta: 'TOKA PARA FONDEO TARJETA AVIT 020925',
              descripcion: 'Para fondeo de la tarjeta AVIT mediante TOKA'
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
          id: 'beneficiario',
          nombre: 'beneficiario',
          tipo: 'texto',
          etiqueta: 'Beneficiario',
          placeholder: 'Ej. COMERCIALIZADORA DEDAI SA DE CV',
          ayuda: 'Nombre completo del beneficiario del pago. Para el pago de las tarjetas N09 y TOKA se realiza pago al proveedor de las tarjetas, quien es quien realiza el fondeo a la tarjeta.',
          valorPorDefecto: '',
          validaciones: {
            requerido: true,
            minLength: 5,
            maxLength: 200,
            mensaje: 'El beneficiario es requerido y debe tener entre 5 y 200 caracteres'
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
              descripcion: 'Clave Bancaria Estandarizada (18 dígitos)'
            },
            {
              valor: 'CUENTA',
              etiqueta: 'Número de Cuenta',
              descripcion: 'Número de cuenta bancaria (máximo 18 dígitos)'
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
          placeholder: '646014342400009000.00',
          ayuda: 'Número de la cuenta destino a realizar el depósito',
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
          etiqueta: 'Monto',
          placeholder: '$56,250.36',
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
          etiqueta: 'Documentos',
          ayuda: 'Dos archivos un excel con el cálculo de las comisiones y una imagen o pdf con el comprobante del pago. Implementar la opción de arrastrar archivos a recuadro para subir',
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
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};

// Lista de todas las plantillas disponibles
export const plantillasDisponibles: PlantillaSolicitud[] = [
  plantillaTarjetasN09Toka
  // Aquí se pueden agregar más plantillas en el futuro
];

// Función para obtener una plantilla por ID
export const obtenerPlantillaPorId = (id: string): PlantillaSolicitud | null => {
  return plantillasDisponibles.find(plantilla => plantilla.id === id) || null;
};

// Función para obtener plantillas activas
export const obtenerPlantillasActivas = (): PlantillaSolicitud[] => {
  return plantillasDisponibles.filter(plantilla => plantilla.activa);
};
