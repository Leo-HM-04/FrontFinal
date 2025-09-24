/**
 * Mapeo de etiquetas de campos por plantilla para mostrar en el modal
 * Permite personalizar los nombres de los campos sin cambiar la estructura de BD
 */

import type { Solicitud } from '@/types/index';

export interface EtiquetasCampo {
  [key: string]: string;
}

export interface MapeoPlantilla {
  nombre: string;
  etiquetas: EtiquetasCampo;
  camposOcultos?: string[];
  camposRequeridos?: string[];
}

// Mapeo de etiquetas por plantilla
export const MAPEO_PLANTILLAS: Record<string, MapeoPlantilla> = {
  'pago-sua-internas': {
    nombre: 'PAGO SUA INTERNAS',
    etiquetas: {
      // Campos bancarios
      'tipo_cuenta_destino': 'Forma de Pago',
      'banco_destino': 'Banco',
      'cuenta_destino': 'Número de Cuenta',
      'fecha_limite_pago': 'Fecha Límite de Pago',
      
      // Información general
      'empresa_a_pagar': 'Se paga por',
      'nombre_persona': 'Nombre del Beneficiario',
      'concepto': 'Concepto del Pago',
      'monto': 'Monto Total',
      
      // Campos adicionales que podrían venir de plantilla_datos
      'asunto': 'Asunto',
      'empresa': 'Se paga por',  // Campo de la plantilla que debe mostrarse como "Se paga por"
      'cliente': 'Cliente',
      'linea_captura': 'Línea de Captura',
      'fecha_limite': 'Fecha Límite',
      'numero_empleado': 'Número de Empleado',
      'dias_pagar': 'Días a Pagar',
      'imss': 'IMSS',
      'infonavit': 'INFONAVIT'
    },
    camposOcultos: ['cuenta', 'banco_cuenta'] // No mostrar cuenta adicional
  },

  'tukash': {
    nombre: 'SOLICITUD DE PAGO TUKASH',
    etiquetas: {
      'tipo_cuenta_destino': 'Tipo de Tarjeta',
      'banco_destino': 'Banco Emisor',
      'cuenta_destino': 'Número de Tarjeta',
      'fecha_limite_pago': 'Fecha Límite de Pago',
      'empresa_a_pagar': 'Empresa que Solicita',
      'nombre_persona': 'Titular de la Tarjeta',
      'concepto': 'Concepto del Pago',
      'monto': 'Monto a Pagar',
      'asunto': 'Asunto',
      'cliente': 'Cliente',
      'numero_empleado': 'Número de Empleado',
      'dias_pagar': 'Días a Pagar',
      'tarjeta_tipo': 'Tipo de Tarjeta',
      'tarjeta_numero': 'Número de Tarjeta',
      'tarjeta_banco': 'Banco Emisor',
      'tarjeta_monto': 'Monto de la Tarjeta'
    },
    camposOcultos: ['cuenta', 'banco_cuenta']
  },
  'pago-sua-frenshetsi': {
    nombre: 'PAGO SUA FRENSHETSI',
    etiquetas: {
      'tipo_cuenta_destino': 'Forma de Pago',
      'banco_destino': 'Banco',
      'cuenta_destino': 'Número de Cuenta',
      'fecha_limite_pago': 'Fecha Límite de Pago',
      
      'empresa_a_pagar': 'Se paga por',
      'nombre_persona': 'Nombre del Beneficiario',
      'concepto': 'Concepto del Pago',
      'monto': 'Monto Total',
      
      'asunto': 'Asunto',
      'empresa': 'Se paga por',  // Campo de la plantilla que debe mostrarse como "Se paga por"
      'cliente': 'Cliente',
      'linea_captura': 'Línea de Captura',
      'fecha_limite': 'Fecha Límite',
      'numero_empleado': 'Número de Empleado',
      'dias_pagar': 'Días a Pagar',
      'imss': 'IMSS',
      'infonavit': 'INFONAVIT'
    },
    camposOcultos: ['cuenta', 'banco_cuenta']
  },

  'pago-comisiones': {
    nombre: 'PAGO COMISIONES',
    etiquetas: {
      'tipo_cuenta_destino': 'Método de Pago',
      'banco_destino': 'Institución Bancaria',
      'cuenta_destino': 'CLABE/Cuenta Destino',
      'fecha_limite_pago': 'Fecha Límite',
      
      'empresa_a_pagar': 'Beneficiario/Empresa',
      'nombre_persona': 'Persona que Recibe',
      'concepto': 'Concepto de Comisión',
      'monto': 'Monto de Comisión',
      
      'asunto': 'Asunto',
      'cliente': 'Cliente',
      'porcentaje_comision': 'Porcentaje de Comisión',
      'base_comision': 'Base para Comisión'
    },
    camposOcultos: ['cuenta', 'banco_cuenta']
  },

  'pago-polizasp': {
    nombre: 'PAGO PÓLIZAS',
    etiquetas: {
      'tipo_cuenta_destino': 'Método de Pago Principal',
      'banco_destino': 'Banco Principal',
      'cuenta_destino': 'Cuenta Principal',
      'fecha_limite_pago': 'Fecha Límite de Pago',
      
      'empresa_a_pagar': 'GNP Seguros',
      'nombre_persona': 'Asegurado/Beneficiario',
      'concepto': 'Concepto de Póliza',
      'monto': 'Prima Total',
      
      'asunto': 'Asunto',
      'cliente': 'Cliente/Asegurado',
      'numero_poliza': 'Número de Póliza',
      'tipo_seguro': 'Tipo de Seguro',
      'vigencia_desde': 'Vigencia Desde',
      'vigencia_hasta': 'Vigencia Hasta'
    }
  },

  'regresos-transferencia': {
    nombre: 'REGRESOS EN TRANSFERENCIA',
    etiquetas: {
      'tipo_cuenta_destino': 'Método de Transferencia',
      'banco_destino': 'Banco Destino',
      'cuenta_destino': 'Cuenta de Regreso',
      'fecha_limite_pago': 'Fecha de Procesamiento',
      
      'empresa_a_pagar': 'Cliente',
      'nombre_persona': 'Beneficiario del Regreso',
      'concepto': 'Motivo del Regreso',
      'monto': 'Monto a Regresar',
      
      'asunto': 'Asunto',
      'cliente': 'Cliente',
      'motivo_regreso': 'Motivo del Regreso',
      'fecha_original': 'Fecha de Pago Original'
    }
  },

  'regresos-efectivo': {
    nombre: 'REGRESOS EN EFECTIVO',
    etiquetas: {
      'tipo_cuenta_destino': 'Tipo de Entrega',
      'banco_destino': 'Método de Pago',
      'cuenta_destino': 'Forma de Entrega',
      'fecha_limite_pago': 'Fecha de Entrega',
      
      'empresa_a_pagar': 'Cliente',
      'nombre_persona': 'Persona que Recibe',
      'concepto': 'Concepto del Regreso',
      'monto': 'Monto Total en Efectivo',
      
      'asunto': 'Asunto',
      'cliente': 'Cliente',
      'persona_recibe': 'Persona que Recibe',
      'fecha_entrega': 'Fecha de Entrega',
      'monto_efectivo': 'Monto en Efectivo',
      'viaticos': 'Viáticos',
      'elementos_adicionales': 'Elementos Adicionales'
    },
    camposOcultos: ['cuenta', 'banco_cuenta', 'cuenta_destino_2', 'banco_destino_2']
  }
};

// Función para obtener las etiquetas de una plantilla
export function obtenerEtiquetasPlantilla(plantillaId: string | null): MapeoPlantilla | null {
  if (!plantillaId) return null;
  return MAPEO_PLANTILLAS[plantillaId] || null;
}

// Función para obtener la etiqueta de un campo específico
export function obtenerEtiquetaCampo(plantillaId: string | null, campo: string): string {
  const mapeo = obtenerEtiquetasPlantilla(plantillaId);
  if (!mapeo) return campo; // Si no hay mapeo, devolver el nombre original
  
  return mapeo.etiquetas[campo] || campo;
}

// Función para verificar si un campo debe ocultarse
export function esCampoOculto(plantillaId: string | null, campo: string): boolean {
  const mapeo = obtenerEtiquetasPlantilla(plantillaId);
  if (!mapeo || !mapeo.camposOcultos) return false;
  
  return mapeo.camposOcultos.includes(campo);
}

// Función para detectar el ID de plantilla desde tipo_pago_descripcion
export function detectarPlantillaId(solicitud: Solicitud): string | null {
  // 1. Detectar por plantilla_datos.templateType si existe y es válido
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      if (plantillaData.templateType && typeof plantillaData.templateType === 'string' && plantillaData.templateType !== 'NORMAL') {
        return plantillaData.templateType;
      }
    } catch (e) {
      // Si falla el parseo, ignorar
    }
  }

  // 2. Detectar por tipo_pago_descripcion
  if (solicitud.tipo_pago_descripcion && solicitud.tipo_pago_descripcion.startsWith('Plantilla:')) {
    const plantillaParte = solicitud.tipo_pago_descripcion.split('Plantilla:')[1]?.trim();
    if (plantillaParte) {
      if (plantillaParte.includes('-')) {
        return plantillaParte;
      }
      const nombreAId: Record<string, string> = {
        'PAGO SUA INTERNAS': 'pago-sua-internas',
        'PAGO SUA FRENSHETSI': 'pago-sua-frenshetsi',
        'PAGO COMISIONES': 'pago-comisiones',
        'PAGO POLIZAS': 'pago-polizas',
        'REGRESOS EN TRANSFERENCIA': 'regresos-transferencia',
        'REGRESOS EN EFECTIVO': 'regresos-efectivo',
        'SOLICITUD DE PAGO TARJETAS N09 Y TOKA': 'tarjetas-n09-toka',
        'PAGO TUKASH': 'tukash'
      };
      return nombreAId[plantillaParte] || null;
    }
  }

  return null;
}

// Función para obtener datos adicionales de plantilla_datos
export function obtenerDatosPlantilla(solicitud: Solicitud): Record<string, unknown> {
  if (!solicitud.plantilla_datos) return {};
  
  try {
    return JSON.parse(solicitud.plantilla_datos);
  } catch (error) {
    console.error('Error parseando plantilla_datos:', error);
    return {};
  }
}