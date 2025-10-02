import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { X, ExternalLink, DollarSign, FileText, FileCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Solicitud, Comprobante } from '@/types';
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';
import { SolicitudesService } from '@/services/solicitudes.service';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { 
  detectarPlantillaId, 
  esCampoOculto, 
  obtenerDatosPlantilla,
  obtenerEtiquetasPlantilla 
} from '@/utils/plantillasLabels';
import { bancosMexico } from '@/data/bancos';
import { obtenerNombreBanco } from '@/utils/bancos';
import '@/styles/modal.css';
import { PlantillaN09TokaDetailModal } from '@/components/plantillas/PlantillaN09TokaDetailModal';
import { SolicitudN09TokaData } from '@/services/solicitudesN09Toka.service';
import { PlantillaTukashDetailModal } from '@/components/plantillas/PlantillaTukashDetailModal';
import { SolicitudTukashData } from '@/types/plantillaTukash';
import { PlantillaSuaInternasDetailModal } from '@/components/plantillas/PlantillaSuaInternasDetailModal';
import { SolicitudSuaInternasData } from '@/types/plantillaSuaInternas';
import { PlantillaSuaFrenshetsiDetailModal } from '../plantillas/PlantillaSuaFrenshetsiDetailModal';
import { SolicitudSuaFrenshetsiData } from '@/types/plantillaSuaFrenshetsi';
import { PlantillaComisionesDetailModal } from '../plantillas/PlantillaComisionesDetailModal';
import { SolicitudComisionesData } from '@/types/plantillaComisiones';
import { PlantillaPolizasDetailModal, SolicitudPolizasData } from '@/components/plantillas/PlantillaPolizasDetailModal';

interface SolicitudDetailModalProps {
  solicitud: Solicitud | null;
  isOpen: boolean;
  onClose: () => void;
  showActions?: boolean;
  userRole?: string;
}

interface LoadingState {
  comprobantes: boolean;
  archivos: boolean;
}

interface ErrorState {
  comprobantes: string | null;
  archivos: string | null;
}

// Utilidades para construcción de URLs
const buildFileUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

// Utilidades para formateo de datos bancarios
const formatBankInfo = (bankCode: string): string => {
  if (!bankCode) return '-';
  return obtenerNombreBanco(bankCode);
};

const formatBankInfoAbreviado = (bankCode: string): string => {
  if (!bankCode) return '-';
  return obtenerNombreBanco(bankCode);
};

const formatAccountType = (tipoStr: string, tipoTarjeta?: string): string => {
  if (!tipoStr) return '-';
  
  if (tipoStr === 'Número de Tarjeta') {
    const tipoFormatted = tipoTarjeta 
      ? ` - ${tipoTarjeta === 'debito' ? 'Débito' : tipoTarjeta === 'credito' ? 'Crédito' : tipoTarjeta}`
      : '';
    return `Número de Tarjeta${tipoFormatted}`;
  }
  
  if (tipoStr === 'Tarjeta Institucional' || tipoStr === 'Tarjeta Instituciona') {
    return 'Tarjeta Institucional';
  }
  
  return tipoStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Hook personalizado para manejo de errores
const useErrorHandler = () => {
  const handleError = useCallback((error: unknown): string => {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      
      if (err.response && typeof err.response === 'object' && err.response !== null) {
        const response = err.response as Record<string, unknown>;
        if (typeof response.status === 'number') {
          const status = response.status;
          
          switch (status) {
            case 401:
            case 403:
              return 'No tiene permisos para ver esta información. Solo el pagador o administrador puede acceder.';
            case 404:
              return 'No se encontró la información solicitada.';
            case 500:
              return 'Error interno del servidor. Intente nuevamente más tarde.';
            default:
              return `Error del servidor (${status}). Intente nuevamente más tarde.`;
          }
        }
      }
      
      if (err.request) {
        return 'No se pudo establecer conexión con el servidor. Verifique su conexión a internet.';
      }
      
      if (typeof err.message === 'string') {
        return `Error: ${err.message}`;
      }
    }
    
    return 'Ocurrió un error inesperado. Intente nuevamente.';
  }, []);
  
  return { handleError };
};

// Componente para mostrar estados de carga
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
    <span className="text-blue-600 text-sm">{message}</span>
  </div>
);

// Componente para mostrar errores
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
    {message}
  </div>
);

// Componente para campos de información
const InfoField: React.FC<{
  label: string;
  value: string | null | undefined;
  variant?: 'default' | 'mono';
  className?: string;
}> = ({ label, value, variant = 'default', className = '' }) => (
  <div className={`bg-white/80 p-3 rounded border border-blue-100 ${className}`}>
    <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">
      {label}
    </span>
    <p className={`text-blue-900 font-medium text-sm ${variant === 'mono' ? 'font-mono' : ''}`}>
      {value || '-'}
    </p>
  </div>
);

// Componente para mostrar contraseñas
const PasswordField: React.FC<{
  label: string;
  value: string;
  isVisible: boolean;
  onToggle: () => void;
}> = ({ label, value, isVisible, onToggle }) => (
  <div className="bg-white/90 p-3 rounded border border-blue-100">
    <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-1 font-medium">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <p className="text-blue-900 font-medium font-mono text-sm flex-1">
        {isVisible ? value : '••••••••'}
      </p>
      <button
        onClick={onToggle}
        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

// Componente para previsualización de archivos
const FilePreview: React.FC<{
  url: string;
  fileName: string;
  alt?: string;
  height?: string;
}> = ({ url, fileName, alt, height = 'h-40' }) => {
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  if (isImage) {
    return (
      <div className={`relative w-full ${height} group overflow-hidden rounded border border-blue-200 shadow-sm bg-white/90`}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100 animate-pulse" />
        <Image
          src={url}
          alt={alt || fileName}
          fill
          className="object-contain bg-white/80 transition-all duration-300 group-hover:scale-[1.02]"
          onLoad={(e) => {
            const parent = (e.target as HTMLImageElement).parentElement;
            const loadingBg = parent?.querySelector('div');
            if (loadingBg) loadingBg.classList.add('opacity-0');
          }}
          quality={85}
        />
        <div 
          className="absolute inset-0 bg-blue-900/0 hover:bg-blue-900/5 transition-colors duration-300 cursor-zoom-in"
          onClick={() => window.open(url, '_blank')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.open(url, '_blank');
            }
          }}
          aria-label="Abrir imagen en nueva ventana"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
        <iframe 
          src={url} 
          title={alt || fileName}
          className="w-full" 
          style={{ height: '200px' }} 
        />
        <div className="bg-blue-50/80 p-2 text-xs text-center text-blue-700">
          Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 rounded border border-blue-200">
      <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-blue-900 font-medium text-sm break-words">
          Archivo: {fileName}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Haga clic en &quot;Ver completo&quot; para abrir el archivo
        </p>
      </div>
    </div>
  );
};

// Función para detectar si una solicitud es N09/TOKA
function isN09TokaSolicitud(solicitud: Solicitud | null): boolean {
  if (!solicitud) return false;
  
  // 1. Verificar si tiene el campo tipo_plantilla directamente
  const solicitudExtendida = solicitud as Solicitud & { tipo_plantilla?: string };
  if (solicitudExtendida.tipo_plantilla === 'N09_TOKA') return true;
  
  // 2. Usar la función de detección de plantilla existente
  const plantillaId = detectarPlantillaId(solicitud);
  if (plantillaId === 'N09_TOKA') return true;
  
  // 3. Verificar en plantilla_datos
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      return plantillaData.templateType === 'tarjetas-n09-toka' || 
             plantillaData.isN09Toka === true || 
             (plantillaData.beneficiario && plantillaData.numero_cuenta_clabe) ||
             (plantillaData.tipo_cuenta_clabe && plantillaData.asunto);
    } catch {
      return false;
    }
  }
  
  return false;
}

// Función para detectar si una solicitud es TUKASH
function isTukashSolicitud(solicitud: Solicitud | null): boolean {
  if (!solicitud) return false;
  
  console.log(`🔍 [TUKASH DETECCIÓN] Analizando solicitud ID: ${solicitud.id_solicitud}`);
  
  // 1. Verificar si tiene el campo tipo_plantilla directamente
  const solicitudExtendida = solicitud as Solicitud & { tipo_plantilla?: string };
  console.log(`🔍 [TUKASH DETECCIÓN] tipo_plantilla: ${solicitudExtendida.tipo_plantilla}`);
  if (solicitudExtendida.tipo_plantilla === 'TUKASH') {
    console.log('✅ [TUKASH DETECCIÓN] Detectada por tipo_plantilla = TUKASH');
    return true;
  }
  
  // 2. Usar la función de detección de plantilla existente
  const plantillaId = detectarPlantillaId(solicitud);
  console.log(`🔍 [TUKASH DETECCIÓN] plantillaId detectado: ${plantillaId}`);
  if (plantillaId === 'tarjetas-tukash') {
    console.log('✅ [TUKASH DETECCIÓN] Detectada por plantillaId = tarjetas-tukash');
    return true;
  }
  
  // 3. Verificar en plantilla_datos
  console.log(`🔍 [TUKASH DETECCIÓN] plantilla_datos existe: ${!!solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      console.log(`🔍 [TUKASH DETECCIÓN] plantilla_datos contenido:`, plantillaData);
      
      const esTukash = plantillaData.templateType === 'tarjetas-tukash' || 
             plantillaData.isTukash === true || 
             (plantillaData.numero_tarjeta && plantillaData.beneficiario_tarjeta) ||
             (plantillaData.monto_total_cliente && plantillaData.monto_total_tukash) ||
             (plantillaData.asunto === 'TUKASH');
      
      if (esTukash) {
        console.log('✅ [TUKASH DETECCIÓN] Detectada por datos de plantilla');
        return true;
      }
    } catch {
      console.log('❌ [TUKASH DETECCIÓN] Error parseando plantilla_datos');
      return false;
    }
  }
  
  // 4. Detección adicional por tipo_pago_descripcion
  console.log(`🔍 [TUKASH DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && solicitud.tipo_pago_descripcion.includes('tarjetas-tukash')) {
    console.log('✅ [TUKASH DETECCIÓN] Detectada por tipo_pago_descripcion contiene tarjetas-tukash');
    return true;
  }
  
  // 5. Detección por concepto que contenga TUKASH
  console.log(`🔍 [TUKASH DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && solicitud.concepto.toUpperCase().includes('TUKASH')) {
    console.log('✅ [TUKASH DETECCIÓN] Detectada por concepto contiene TUKASH');
    return true;
  }
  
  // 6. Detección por nombre_persona o empresa_a_pagar que contenga TUKASH
  console.log(`🔍 [TUKASH DETECCIÓN] nombre_persona: ${solicitud.nombre_persona}`);
  console.log(`🔍 [TUKASH DETECCIÓN] empresa_a_pagar: ${solicitud.empresa_a_pagar}`);
  if ((solicitud.nombre_persona && solicitud.nombre_persona.toUpperCase().includes('TUKASH')) ||
      (solicitud.empresa_a_pagar && solicitud.empresa_a_pagar.toUpperCase().includes('TUKASH'))) {
    console.log('✅ [TUKASH DETECCIÓN] Detectada por nombre_persona o empresa_a_pagar contiene TUKASH');
    return true;
  }
  
  console.log('❌ [TUKASH DETECCIÓN] No detectada como TUKASH');
  return false;
}

// Función para detectar si una solicitud es SUA INTERNAS
function isSuaInternasSolicitud(solicitud: Solicitud | null): boolean {
  if (!solicitud) return false;
  
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] Analizando solicitud ID: ${solicitud.id_solicitud}`);
  
  // 1. Verificar si tiene el campo tipo_plantilla directamente
  const solicitudExtendida = solicitud as Solicitud & { tipo_plantilla?: string };
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] tipo_plantilla: ${solicitudExtendida.tipo_plantilla}`);
  if (solicitudExtendida.tipo_plantilla === 'SUA_INTERNAS' || solicitudExtendida.tipo_plantilla === 'pago-sua-internas') {
    console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por tipo_plantilla');
    return true;
  }
  
  // 2. Usar la función de detección de plantilla existente
  const plantillaId = detectarPlantillaId(solicitud);
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] plantillaId detectado: ${plantillaId}`);
  if (plantillaId === 'pago-sua-internas') {
    console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por plantillaId = pago-sua-internas');
    return true;
  }
  
  // 3. Verificar en plantilla_datos
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] plantilla_datos existe: ${!!solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      console.log(`🔍 [SUA INTERNAS DETECCIÓN] plantilla_datos contenido:`, plantillaData);
      
      const esSuaInternas = plantillaData.templateType === 'pago-sua-internas' || 
             plantillaData.isSuaInternas === true || 
             (plantillaData.empresa && plantillaData.linea_captura) ||
             (plantillaData.asunto && plantillaData.asunto.includes('SUA INTERNAS'));
      
      if (esSuaInternas) {
        console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por datos de plantilla');
        return true;
      }
    } catch {
      console.log('❌ [SUA INTERNAS DETECCIÓN] Error parseando plantilla_datos');
      return false;
    }
  }
  
  // 4. Detección adicional por tipo_pago_descripcion
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && solicitud.tipo_pago_descripcion.includes('pago-sua-internas')) {
    console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por tipo_pago_descripcion contiene pago-sua-internas');
    return true;
  }
  
  // 5. Detección por concepto que contenga SUA INTERNAS
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && solicitud.concepto.toUpperCase().includes('SUA INTERNAS')) {
    console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por concepto contiene SUA INTERNAS');
    return true;
  }
  
  // 6. Detección por empresa_a_pagar específica de IMSS
  console.log(`🔍 [SUA INTERNAS DETECCIÓN] empresa_a_pagar: ${solicitud.empresa_a_pagar}`);
  if (solicitud.empresa_a_pagar && (solicitud.empresa_a_pagar.includes('IMSS') || solicitud.empresa_a_pagar.includes('SISTEMA_IMSS'))) {
    console.log('✅ [SUA INTERNAS DETECCIÓN] Detectada por empresa_a_pagar relacionada con IMSS');
    return true;
  }
  
  console.log('❌ [SUA INTERNAS DETECCIÓN] No detectada como SUA INTERNAS');
  return false;
}

// Función para detectar si una solicitud es SUA FRENSHETSI
function isSuaFrenshetsiSolicitud(solicitud: Solicitud | null): boolean {
  if (!solicitud) return false;
  
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] Analizando solicitud ID: ${solicitud.id_solicitud}`);
  
  // 1. Verificar si tiene el campo tipo_plantilla directamente
  const solicitudExtendida = solicitud as Solicitud & { tipo_plantilla?: string };
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] tipo_plantilla: ${solicitudExtendida.tipo_plantilla}`);
  if (solicitudExtendida.tipo_plantilla === 'SUA_FRENSHETSI' || solicitudExtendida.tipo_plantilla === 'pago-sua-frenshetsi') {
    console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por tipo_plantilla');
    return true;
  }
  
  // 2. Usar la función de detección de plantilla existente
  const plantillaId = detectarPlantillaId(solicitud);
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] plantillaId detectado: ${plantillaId}`);
  if (plantillaId === 'pago-sua-frenshetsi') {
    console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por plantillaId = pago-sua-frenshetsi');
    return true;
  }
  
  // 3. Verificar en plantilla_datos
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] plantilla_datos existe: ${!!solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
      console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] plantilla_datos contenido:`, plantillaData);
      
      const esSuaFrenshetsi = plantillaData.templateType === 'pago-sua-frenshetsi' || 
             plantillaData.isSuaFrenshetsi === true || 
             (plantillaData.empresa === 'FRENSHETSI' && plantillaData.linea_captura) ||
             (plantillaData.asunto && plantillaData.asunto.includes('FRENSHETSI'));
      
      if (esSuaFrenshetsi) {
        console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por datos de plantilla');
        return true;
      }
    } catch {
      console.log('❌ [SUA FRENSHETSI DETECCIÓN] Error parseando plantilla_datos');
    }
  }
  
  // 4. Verificar por tipo_pago_descripcion
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && solicitud.tipo_pago_descripcion.includes('FRENSHETSI')) {
    console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por tipo_pago_descripcion');
    return true;
  }
  
  // 5. Verificar por concepto que contenga FRENSHETSI
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && solicitud.concepto.includes('FRENSHETSI')) {
    console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por concepto');
    return true;
  }
  
  // 6. Verificar si empresa_a_pagar es FRENSHETSI
  const solicitudConEmpresa = solicitud as Solicitud & { empresa_a_pagar?: string };
  console.log(`🔍 [SUA FRENSHETSI DETECCIÓN] empresa_a_pagar: ${solicitudConEmpresa.empresa_a_pagar}`);
  if (solicitudConEmpresa.empresa_a_pagar === 'FRENSHETSI') {
    console.log('✅ [SUA FRENSHETSI DETECCIÓN] Detectada por empresa_a_pagar = FRENSHETSI');
    return true;
  }
  
  console.log('❌ [SUA FRENSHETSI DETECCIÓN] No se detectó como SUA FRENSHETSI');
  return false;
}

// Función para detectar si una solicitud es PAGO COMISIONES
function isComisionesSolicitud(solicitud: Solicitud | null): boolean {
  if (!solicitud) return false;
  
  console.log(`🔍 [COMISIONES DETECCIÓN] Analizando solicitud ID: ${solicitud.id_solicitud}`);
  
  // Cast para acceder a campos extendidos
  const solicitudExtendida = solicitud as Solicitud & { tipo_plantilla?: string };
  
  // 1. Verificar por tipo_plantilla
  console.log(`🔍 [COMISIONES DETECCIÓN] tipo_plantilla: ${solicitudExtendida.tipo_plantilla}`);
  if (solicitudExtendida.tipo_plantilla === 'PAGO_COMISIONES' || solicitudExtendida.tipo_plantilla === 'pago-comisiones') {
    console.log('✅ [COMISIONES DETECCIÓN] Detectada por tipo_plantilla');
    return true;
  }
  
  // 2. Verificar por plantillaId en plantilla_datos
  const plantillaId = detectarPlantillaId(solicitud);
  console.log(`🔍 [COMISIONES DETECCIÓN] plantillaId detectado: ${plantillaId}`);
  if (plantillaId === 'pago-comisiones') {
    console.log('✅ [COMISIONES DETECCIÓN] Detectada por plantillaId = pago-comisiones');
    return true;
  }
  
  // 3. Verificar por contenido de plantilla_datos
  console.log(`🔍 [COMISIONES DETECCIÓN] plantilla_datos existe: ${!!solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = JSON.parse(solicitud.plantilla_datos);
      console.log(`🔍 [COMISIONES DETECCIÓN] plantilla_datos contenido:`, plantillaData);
      
      const esComisiones = plantillaData.templateType === 'pago-comisiones' || 
             plantillaData.isComisiones === true || 
             (plantillaData.porcentaje_comision && plantillaData.periodo_comision) ||
             plantillaData.tipo_comision;
      
      if (esComisiones) {
        console.log('✅ [COMISIONES DETECCIÓN] Detectada por análisis de plantilla_datos');
        return true;
      }
    } catch (error) {
      console.log('⚠️ [COMISIONES DETECCIÓN] Error parseando plantilla_datos:', error);
    }
  }
  
  // 4. Verificar por tipo_pago_descripcion
  console.log(`🔍 [COMISIONES DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && (
      solicitud.tipo_pago_descripcion.includes('COMISION') || 
      solicitud.tipo_pago_descripcion.includes('COMISIONES')
    )) {
    console.log('✅ [COMISIONES DETECCIÓN] Detectada por tipo_pago_descripcion');
    return true;
  }
  
  // 5. Verificar por concepto que contenga COMISION o COMISIONES
  console.log(`🔍 [COMISIONES DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && (
      solicitud.concepto.includes('COMISION') || 
      solicitud.concepto.includes('COMISIONES')
    )) {
    console.log('✅ [COMISIONES DETECCIÓN] Detectada por concepto');
    return true;
  }
  
  console.log('❌ [COMISIONES DETECCIÓN] No se detectó como PAGO COMISIONES');
  return false;
}

// Función auxiliar para detectar si es PAGO POLIZAS
function isPolizasSolicitud(solicitud: Solicitud & { tipo_plantilla?: string }): boolean {
  console.log(`🔍 [POLIZAS DETECCIÓN] Iniciando detección para solicitud ${solicitud.id_solicitud}`);
  
  // 1. Verificar por plantilla_id directamente
  const plantillaId = detectarPlantillaId(solicitud);
  console.log(`🔍 [POLIZAS DETECCIÓN] plantillaId detectado: ${plantillaId}`);
  
  if (plantillaId === 'pago-polizas-gnp') {
    console.log('✅ [POLIZAS DETECCIÓN] Detectada por plantillaId = pago-polizas-gnp');
    return true;
  }

  // 2. Verificar por tipo_plantilla
  console.log(`🔍 [POLIZAS DETECCIÓN] tipo_plantilla: ${solicitud.tipo_plantilla}`);
  if (solicitud.tipo_plantilla === 'PAGO_POLIZAS' || solicitud.tipo_plantilla === 'pago-polizas-gnp') {
    console.log('✅ [POLIZAS DETECCIÓN] Detectada por tipo_plantilla');
    return true;
  }

  // 3. Verificar por análisis de plantilla_datos
  console.log(`🔍 [POLIZAS DETECCIÓN] plantilla_datos: ${solicitud.plantilla_datos}`);
  if (solicitud.plantilla_datos) {
    try {
      const plantillaData = typeof solicitud.plantilla_datos === 'string' 
        ? JSON.parse(solicitud.plantilla_datos) 
        : solicitud.plantilla_datos;
      
      console.log('🔍 [POLIZAS DETECCIÓN] Datos parseados de plantilla_datos:', plantillaData);
      
      // Buscar indicadores de pólizas
      const esPolizas = plantillaData.templateType === 'pago-polizas-gnp' || 
             plantillaData.isPolizas === true || 
             (plantillaData.titular_cuenta && plantillaData.empresa_emisora) ||
             plantillaData.tipo_poliza;
      
      if (esPolizas) {
        console.log('✅ [POLIZAS DETECCIÓN] Detectada por análisis de plantilla_datos');
        return true;
      }
    } catch (error) {
      console.log('⚠️ [POLIZAS DETECCIÓN] Error parseando plantilla_datos:', error);
    }
  }
  
  // 4. Verificar por tipo_pago_descripcion
  console.log(`🔍 [POLIZAS DETECCIÓN] tipo_pago_descripcion: ${solicitud.tipo_pago_descripcion}`);
  if (solicitud.tipo_pago_descripcion && (
      solicitud.tipo_pago_descripcion.includes('POLIZA') || 
      solicitud.tipo_pago_descripcion.includes('POLIZAS') ||
      solicitud.tipo_pago_descripcion.includes('GNP') ||
      solicitud.tipo_pago_descripcion.includes('ZURICH') ||
      solicitud.tipo_pago_descripcion.includes('AXA')
    )) {
    console.log('✅ [POLIZAS DETECCIÓN] Detectada por tipo_pago_descripcion');
    return true;
  }
  
  // 5. Verificar por concepto que contenga POLIZA o aseguradoras
  console.log(`🔍 [POLIZAS DETECCIÓN] concepto: ${solicitud.concepto}`);
  if (solicitud.concepto && (
      solicitud.concepto.includes('POLIZA') || 
      solicitud.concepto.includes('POLIZAS') ||
      solicitud.concepto.includes('GNP') ||
      solicitud.concepto.includes('ZURICH') ||
      solicitud.concepto.includes('AXA') ||
      solicitud.concepto.includes('QUALITAS') ||
      solicitud.concepto.includes('ALLIANZ')
    )) {
    console.log('✅ [POLIZAS DETECCIÓN] Detectada por concepto');
    return true;
  }
  
  console.log('❌ [POLIZAS DETECCIÓN] No se detectó como PAGO POLIZAS');
  return false;
}

export function SolicitudDetailModal({ 
  solicitud, 
  isOpen, 
  onClose
}: SolicitudDetailModalProps) {
  // Estados
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  
  const [loading, setLoading] = useState<LoadingState>({
    comprobantes: false,
    archivos: false,
  });
  
  const [errors, setErrors] = useState<ErrorState>({
    comprobantes: null,
    archivos: null,
  });

  // Hooks personalizados
  const { handleError } = useErrorHandler();

  // Datos computados
  const plantillaData = useMemo(() => {
    if (!solicitud) return { plantillaId: null, mapeoPlantilla: null, datosPlantilla: {} };
    const plantillaId = detectarPlantillaId(solicitud);
    const mapeoPlantilla = obtenerEtiquetasPlantilla(plantillaId);
    const datosPlantilla = obtenerDatosPlantilla(solicitud);
    return { plantillaId, mapeoPlantilla, datosPlantilla };
  }, [solicitud]);

  // Funciones de utilidad específicas para la plantilla
  const debeOcultarse = useCallback(
    (campo: string) => esCampoOculto(plantillaData.plantillaId, campo),
    [plantillaData.plantillaId]
  );

  // Función para formatear moneda
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Función para obtener color del estado
  const getEstadoColor = useCallback((estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      autorizada: 'bg-green-100 text-green-800 border-green-200',
      rechazada: 'bg-red-100 text-red-800 border-red-200',
      pagada: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  // Funciones para obtener archivos
  const fetchArchivos = useCallback(async () => {
    if (!solicitud) return;
    setLoading(prev => ({ ...prev, archivos: true }));
    setErrors(prev => ({ ...prev, archivos: null }));
    try {
      const data = await SolicitudArchivosService.obtenerArchivos(solicitud.id_solicitud);
      setArchivos(data);
    } catch (error) {
      const errorMessage = handleError(error);
      setErrors(prev => ({ ...prev, archivos: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, archivos: false }));
    }
  }, [solicitud, handleError]);

  const fetchComprobantes = useCallback(async () => {
    if (!solicitud) return;
    setLoading(prev => ({ ...prev, comprobantes: true }));
    setErrors(prev => ({ ...prev, comprobantes: null }));
    try {
      const data = await SolicitudesService.getComprobantes(solicitud.id_solicitud);
      setComprobantes(data);
    } catch (error) {
      const errorMessage = handleError(error);
      setErrors(prev => ({ ...prev, comprobantes: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, comprobantes: false }));
    }
  }, [solicitud, handleError]);

  // Efectos
  useEffect(() => {
    if (isOpen && solicitud) {
      fetchArchivos();
      if (solicitud.estado === 'pagada') {
        fetchComprobantes();
      }
    }
  }, [isOpen, solicitud, fetchArchivos, fetchComprobantes]);

  // Resetear estados al cerrar
  useEffect(() => {
    if (!isOpen) {
      setComprobantes([]);
      setArchivos([]);
      setShowPassword1(false);
      setShowPassword2(false);
      setLoading({ comprobantes: false, archivos: false });
      setErrors({ comprobantes: null, archivos: null });
    }
  }, [isOpen]);

  // Datos computados para el modal
  // const modalData = useMemo(() => {
  //   if (!solicitud || !plantillaData.mapeoPlantilla) return null;
  //   
  //   return Object.entries(plantillaData.datosPlantilla)
  //     .filter(([campo]) => !debeOcultarse(campo))
  //     .map(([campo, valor]) => ({
  //       campo,
  //       valor,
  //       etiqueta: plantillaData.mapeoPlantilla?.[campo as keyof typeof plantillaData.mapeoPlantilla] || campo
  //     }));
  // }, [solicitud, plantillaData, debeOcultarse]);

  // const bancoDestinoNombre = useMemo(() => {
  //   return solicitud?.banco_destino ? formatBankInfo(solicitud.banco_destino) : '-';
  // }, [solicitud?.banco_destino]);

  // const montoFormateado = useMemo(() => {
  //   return solicitud?.monto ? formatCurrency(Number(solicitud.monto)) : '-';
  // }, [solicitud?.monto, formatCurrency]);

  // Verificaciones adicionales
  const hasCuentaAdicional = useMemo(() => {
    if (!solicitud) return false;
    if (debeOcultarse('cuenta') && debeOcultarse('banco_cuenta')) return false;
    const cuentaValida = solicitud.cuenta && solicitud.cuenta.trim() !== '';
    const bancoValido = solicitud.banco_cuenta && solicitud.banco_cuenta.trim() !== '';
    return cuentaValida || bancoValido;
  }, [solicitud, debeOcultarse]);

  const esTarjetaInstitucional = useMemo(() => {
    if (!solicitud) return false;
    return solicitud.tipo_cuenta_destino === 'Tarjeta Institucional' || 
           solicitud.tipo_cuenta_destino === 'Tarjeta Instituciona';
  }, [solicitud]);

  const tieneAccesoTarjetaInst = useMemo(() => {
    if (!solicitud) return false;
    return !!(solicitud.link_pago || solicitud.usuario_acceso || solicitud.contrasena_acceso);
  }, [solicitud]);

  // Función para manejar teclas de escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Renderizado condicional del modal N09/TOKA
  if (isOpen && solicitud && isN09TokaSolicitud(solicitud)) {
    let solicitudN09Toka: SolicitudN09TokaData | null = null;
    if (typeof solicitud === 'object' && solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        solicitudN09Toka = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto || 'TOKA_FONDEO_AVIT',
          cliente: plantillaData.cliente || '',
          beneficiario: plantillaData.beneficiario || '',
          proveedor: plantillaData.proveedor || '',
          tipo_cuenta_clabe: plantillaData.tipo_cuenta_clabe || 'CLABE',
          numero_cuenta_clabe: plantillaData.numero_cuenta_clabe || '',
          banco_destino: plantillaData.banco_destino || '',
          monto: Number(plantillaData.monto) || 0,
          tipo_moneda: (plantillaData.tipo_moneda || 'MXN'),
          estado: solicitud.estado || '',
          fecha_creacion: solicitud.fecha_creacion || '',
          fecha_actualizacion: plantillaData.fecha_actualizacion || solicitud.updated_at || '',
          fecha_limite_pago: plantillaData.fecha_limite_pago || solicitud.fecha_limite_pago || '',
          usuario_creacion: plantillaData.usuario_creacion || solicitud.usuario_nombre || '',
          usuario_actualizacion: plantillaData.usuario_actualizacion || '',
        };
      } catch {
        solicitudN09Toka = null;
      }
    }
    if (solicitudN09Toka) {
      return (
        <PlantillaN09TokaDetailModal
          solicitud={solicitudN09Toka}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  // Renderizado condicional del modal TUKASH
  if (isOpen && solicitud && isTukashSolicitud(solicitud)) {
    let solicitudTukash: SolicitudTukashData | null = null;
    
    // Intentar obtener datos de plantilla_datos primero
    if (typeof solicitud === 'object' && solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        // Usar datos de plantilla si están disponibles, sino usar campos de la base de datos
        solicitudTukash = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto || 'TUKASH',
          cliente: plantillaData.cliente || '',
          beneficiario_tarjeta: plantillaData.beneficiario_tarjeta || '',
          numero_tarjeta: plantillaData.numero_tarjeta || '',
          monto_total_cliente: plantillaData.monto_total_cliente || Number(solicitud.monto) || 0,
          monto_total_tukash: plantillaData.monto_total_tukash || Number(solicitud.monto2) || Number(solicitud.monto) || 0,
          estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
          fecha_creacion: solicitud.fecha_creacion || '',
          fecha_actualizacion: solicitud.updated_at || '',
          usuario_creacion: solicitud.usuario_nombre || '',
          usuario_actualizacion: '',
        };
      } catch {
        solicitudTukash = null;
      }
    }
    
    // Si no hay plantilla_datos o falló el parsing, construir desde campos básicos de la solicitud
    if (!solicitudTukash) {
      console.log('🔧 [TUKASH] Construyendo datos desde campos básicos de la solicitud');
      console.log('🔧 [TUKASH] solicitud.monto:', solicitud.monto);
      console.log('🔧 [TUKASH] solicitud.monto2:', solicitud.monto2);
      
      // Extraer información de TUKASH desde campos básicos
      const asunto = solicitud.concepto?.includes('TUKASH') ? 'TUKASH' : 'TUKASH';
      const cliente = solicitud.empresa_a_pagar || '';
      const beneficiario_tarjeta = solicitud.nombre_persona || '';
      const numero_tarjeta = solicitud.cuenta_destino || solicitud.cuenta || ''; // Usar cuenta_destino o cuenta como número de tarjeta
      const monto_total_cliente = Number(solicitud.monto) || 0;
      // Usar monto2 para el monto TUKASH si está disponible, sino usar monto
      const monto_total_tukash = Number(solicitud.monto2) || Number(solicitud.monto) || 0;
      
      console.log('🔧 [TUKASH] monto_total_cliente calculado:', monto_total_cliente);
      console.log('🔧 [TUKASH] monto_total_tukash calculado:', monto_total_tukash);
      
      // Crear solicitud extendida con campos adicionales
      solicitudTukash = {
        id_solicitud: solicitud.id_solicitud,
        asunto,
        cliente,
        beneficiario_tarjeta,
        numero_tarjeta,
        monto_total_cliente,
        monto_total_tukash,
        estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
        fecha_creacion: solicitud.fecha_creacion || '',
        fecha_actualizacion: solicitud.updated_at || '',
        usuario_creacion: solicitud.usuario_nombre || '',
        usuario_actualizacion: '',
        // Campos adicionales
        folio: solicitud.folio || '',
      };
      
      console.log('🔧 [TUKASH] Datos construidos:', solicitudTukash);
    }
    
    if (solicitudTukash) {
      console.log('✅ [TUKASH] Mostrando modal TUKASH con datos:', solicitudTukash);
      return (
        <PlantillaTukashDetailModal
          solicitud={solicitudTukash}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  // Renderizado condicional del modal SUA INTERNAS
  if (isOpen && solicitud && isSuaInternasSolicitud(solicitud)) {
    let solicitudSuaInternas: SolicitudSuaInternasData | null = null;
    
    // Intentar obtener datos de plantilla_datos primero
    if (typeof solicitud === 'object' && solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        
        // Extraer datos del concepto si no están en plantilla_datos
        const datosExtraidos = extraerDatosSuaDelConcepto(solicitud.concepto || '');
        console.log('📄 [SUA INTERNAS EXTRACCION] Datos extraídos del concepto:', datosExtraidos);
        
        // Usar datos de plantilla si están disponibles, sino usar campos de la base de datos
        solicitudSuaInternas = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto || datosExtraidos.asunto || '',
          empresa: plantillaData.empresa || datosExtraidos.empresa || '',
          monto: plantillaData.monto || Number(solicitud.monto) || 0,
          fecha_limite: plantillaData.fecha_limite || '',
          linea_captura: plantillaData.linea_captura || datosExtraidos.linea_captura || '',
          archivos_adjuntos: plantillaData.archivos_adjuntos || [],
          estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
          fecha_creacion: solicitud.fecha_creacion || '',
          fecha_actualizacion: solicitud.updated_at || '',
          usuario_creacion: solicitud.usuario_nombre || '',
          usuario_actualizacion: '',
        };
      } catch {
        solicitudSuaInternas = null;
      }
    }
    
    // Si no hay plantilla_datos o falló el parsing, construir desde campos básicos de la solicitud
    if (!solicitudSuaInternas) {
      console.log('🔧 [SUA INTERNAS] Construyendo datos desde campos básicos de la solicitud');
      
      // Extraer información de SUA INTERNAS desde campos básicos usando la función de extracción
      const datosExtraidos = extraerDatosSuaDelConcepto(solicitud.concepto || '');
      console.log('📄 [SUA INTERNAS FALLBACK] Datos extraídos del concepto:', datosExtraidos);
      
      const asunto = datosExtraidos.asunto || '';
      const empresa = datosExtraidos.empresa || solicitud.empresa_a_pagar || solicitud.nombre_persona || '';
      const monto = Number(solicitud.monto) || 0;
      const fecha_limite = solicitud.fecha_limite_pago || '';
      const linea_captura = datosExtraidos.linea_captura || '';
      
      // Crear solicitud extendida con campos adicionales
      solicitudSuaInternas = {
        id_solicitud: solicitud.id_solicitud,
        asunto,
        empresa,
        monto,
        fecha_limite,
        linea_captura,
        archivos_adjuntos: [],
        estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
        fecha_creacion: solicitud.fecha_creacion || '',
        fecha_actualizacion: solicitud.updated_at || '',
        usuario_creacion: solicitud.usuario_nombre || '',
        usuario_actualizacion: '',
        // Campos adicionales
        folio: solicitud.folio || '',
      };
      
      console.log('🔧 [SUA INTERNAS] Datos construidos:', solicitudSuaInternas);
    }
    
    if (solicitudSuaInternas) {
      console.log('✅ [SUA INTERNAS] Mostrando modal SUA INTERNAS con datos:', solicitudSuaInternas);
      return (
        <PlantillaSuaInternasDetailModal
          solicitud={solicitudSuaInternas}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  // Verificar si es una solicitud PAGO COMISIONES
  if (isComisionesSolicitud(solicitud)) {
    console.log('🎯 [COMISIONES] Detectada solicitud PAGO COMISIONES, procesando datos...');
    
    let solicitudComisiones: SolicitudComisionesData | null = null;
    
    // Verificar que solicitud no sea null
    if (!solicitud) return null;
    
    // Intentar obtener datos desde plantilla_datos
    if (solicitud.plantilla_datos) {
      try {
        const plantillaData = JSON.parse(solicitud.plantilla_datos);
        console.log('📝 [COMISIONES] Datos de plantilla encontrados:', plantillaData);
        
        // Usar datos de plantilla si están disponibles
        solicitudComisiones = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto || '',
          empresa: plantillaData.empresa || '',
          cliente: plantillaData.cliente || '',
          monto: plantillaData.monto || Number(solicitud.monto) || 0,
          porcentaje_comision: plantillaData.porcentaje_comision,
          fecha_limite: plantillaData.fecha_limite || '',
          periodo_comision: plantillaData.periodo_comision,
          archivos_adjuntos: plantillaData.archivos_adjuntos || [],
          estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
          fecha_creacion: solicitud.fecha_creacion || '',
          fecha_actualizacion: solicitud.updated_at || '',
          usuario_creacion: solicitud.usuario_nombre || '',
          usuario_actualizacion: '',
          // Información bancaria
          banco_destino: plantillaData.banco_destino || solicitud.banco_destino || '',
          cuenta_destino: plantillaData.cuenta_destino || solicitud.cuenta_destino || '',
          tipo_cuenta_destino: plantillaData.tipo_cuenta_destino || solicitud.tipo_cuenta_destino || '',
          beneficiario: plantillaData.beneficiario || solicitud.nombre_persona || '',
        };
      } catch {
        console.log('❌ [COMISIONES] Error parseando plantilla_datos, usando datos base');
      }
    }
    
    // Si no se pudo mapear desde plantilla_datos, usar datos básicos de la solicitud
    if (!solicitudComisiones) {
      console.log('🔄 [COMISIONES] Construyendo desde datos básicos de solicitud...');
      
      // Extraer información del concepto si está presente
      let asunto = solicitud.concepto || 'PAGO COMISIONES';
      let cliente = '';
      let empresa = '';
      let porcentaje_comision: number | undefined;
      let periodo_comision = '';
      
      // Intentar extraer información del concepto
      if (solicitud.concepto) {
        console.log('🔍 [COMISIONES] Analizando concepto:', solicitud.concepto);
        
        // Extraer solo el asunto principal (primera parte)
        const asuntoMatch = solicitud.concepto.match(/^([^-]+)(?:\s*-)?/);
        if (asuntoMatch) {
          asunto = asuntoMatch[1].trim();
          console.log('✅ [COMISIONES] Asunto extraído:', asunto);
        }
        
        // Buscar Cliente: en el concepto
        const clienteMatch = solicitud.concepto.match(/Cliente:\s*([^-\n,]+)/i);
        if (clienteMatch) {
          cliente = clienteMatch[1].trim();
          console.log('✅ [COMISIONES] Cliente encontrado:', cliente);
        }
        
        // Buscar Empresa: en el concepto
        const empresaMatch = solicitud.concepto.match(/Empresa:\s*([^-\n,]+)/i);
        if (empresaMatch) {
          empresa = empresaMatch[1].trim();
          console.log('✅ [COMISIONES] Empresa encontrada:', empresa);
        }
        
        // Buscar porcentaje de comisión
        const porcentajeMatch = solicitud.concepto.match(/(\d+(?:\.\d+)?)%/);
        if (porcentajeMatch) {
          porcentaje_comision = parseFloat(porcentajeMatch[1]);
          console.log('✅ [COMISIONES] Porcentaje encontrado:', porcentaje_comision);
        }
        
        // Buscar periodo (mensual, trimestral, etc.)
        const periodoMatch = solicitud.concepto.match(/periodo:\s*([^-\n,]+)/i);
        if (periodoMatch) {
          periodo_comision = periodoMatch[1].trim();
          console.log('✅ [COMISIONES] Periodo encontrado:', periodo_comision);
        }
      }
      
      // Si no se encontraron en el concepto, usar campos alternativos
      if (!cliente) {
        cliente = solicitud.empresa_a_pagar || solicitud.nombre_persona || '';
      }
      if (!empresa) {
        empresa = solicitud.empresa_a_pagar || '';
      }
      
      solicitudComisiones = {
        id_solicitud: solicitud.id_solicitud,
        asunto,
        empresa,
        cliente,
        monto: Number(solicitud.monto) || 0,
        porcentaje_comision,
        fecha_limite: solicitud.fecha_limite_pago || '',
        periodo_comision,
        archivos_adjuntos: [],
        estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
        fecha_creacion: solicitud.fecha_creacion || '',
        fecha_actualizacion: solicitud.updated_at || '',
        usuario_creacion: solicitud.usuario_nombre || '',
        usuario_actualizacion: '',
        // Información bancaria
        banco_destino: solicitud.banco_destino || '',
        cuenta_destino: solicitud.cuenta_destino || '',
        tipo_cuenta_destino: solicitud.tipo_cuenta_destino || '',
        beneficiario: solicitud.nombre_persona || '',
      };
      
      console.log('🔧 [COMISIONES] Datos construidos:', solicitudComisiones);
    }
    
    if (solicitudComisiones) {
      console.log('✅ [COMISIONES] Mostrando modal PAGO COMISIONES con datos:', solicitudComisiones);
      return (
        <PlantillaComisionesDetailModal
          solicitud={solicitudComisiones}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  // Función para extraer información del concepto de SUA (Internas y Frenshetsi)
function extraerDatosSuaDelConcepto(concepto: string) {
  const datos = {
    asunto: concepto,
    empresa: '',
    linea_captura: ''
  };

  if (!concepto) return datos;

  console.log('🔍 [SUA EXTRACCION] Analizando concepto:', concepto);

  // Patrón para detectar: "Asunto - Línea de Captura: número"
  const patronLineaCaptura = /^(.+?)\s*-\s*Línea de Captura:\s*(.+)$/i;
  const matchLineaCaptura = concepto.match(patronLineaCaptura);
  
  if (matchLineaCaptura) {
    datos.asunto = matchLineaCaptura[1].trim();
    datos.linea_captura = matchLineaCaptura[2].trim();
    console.log('✅ [SUA EXTRACCION] Patrón línea de captura detectado:', datos);
    return datos;
  }

  // Patrón alternativo para: "Asunto - Cliente: nombre"
  const patronCliente = /^(.+?)\s*-\s*Cliente:\s*(.+)$/i;
  const matchCliente = concepto.match(patronCliente);
  
  if (matchCliente) {
    datos.asunto = matchCliente[1].trim();
    datos.empresa = matchCliente[2].trim();
    console.log('✅ [SUA EXTRACCION] Patrón cliente detectado:', datos);
    return datos;
  }

  // Si no match ningún patrón, buscar solo línea de captura dentro del texto
  const patronSoloLineaCaptura = /Línea de Captura:\s*([A-Z0-9-]+)/i;
  const matchSoloLinea = concepto.match(patronSoloLineaCaptura);
  
  if (matchSoloLinea) {
    datos.linea_captura = matchSoloLinea[1].trim();
    datos.asunto = concepto.replace(patronSoloLineaCaptura, '').trim().replace(/\s*-\s*$/, '');
    console.log('✅ [SUA EXTRACCION] Solo línea de captura detectada:', datos);
  }

  return datos;
}



// Función para extraer información del concepto de pólizas
function extraerDatosDelConcepto(concepto: string) {
  const datos = {
    asunto: concepto,
    empresa_emisora: '',
    convenio: ''
  };

  if (!concepto) return datos;

  console.log('🔍 [POLIZAS EXTRACCION] Analizando concepto:', concepto);

  // Patrón para detectar: "Asunto - Empresa - Convenio: número"
  const patronCompleto = /^(.+?)\s*-\s*([^-]+?)\s*-\s*Convenio:\s*(.+)$/i;
  const matchCompleto = concepto.match(patronCompleto);
  
  if (matchCompleto) {
    datos.asunto = matchCompleto[1].trim();
    datos.empresa_emisora = matchCompleto[2].trim();
    datos.convenio = matchCompleto[3].trim();
    console.log('✅ [POLIZAS EXTRACCION] Patrón completo detectado:', datos);
    return datos;
  }

  // Patrón alternativo para: "Asunto - Empresa"
  const patronEmpresa = /^(.+?)\s*-\s*([^-]+)$/;
  const matchEmpresa = concepto.match(patronEmpresa);
  
  if (matchEmpresa) {
    datos.asunto = matchEmpresa[1].trim();
    datos.empresa_emisora = matchEmpresa[2].trim();
    console.log('✅ [POLIZAS EXTRACCION] Patrón empresa detectado:', datos);
    return datos;
  }

  // Si no match ningún patrón, solo buscar convenio
  const patronConvenio = /Convenio:\s*(.+?)(?:\s|$)/i;
  const matchConvenio = concepto.match(patronConvenio);
  
  if (matchConvenio) {
    datos.convenio = matchConvenio[1].trim();
    datos.asunto = concepto.replace(patronConvenio, '').trim();
    console.log('✅ [POLIZAS EXTRACCION] Solo convenio detectado:', datos);
  }

  return datos;
}

// Verificar si es una solicitud PAGO POLIZAS
  if (solicitud && isPolizasSolicitud(solicitud)) {
    console.log('🎯 [POLIZAS] Detectada solicitud PAGO POLIZAS, procesando datos...');
    
    let solicitudPolizas: SolicitudPolizasData | null = null;
    
    // Intentar mapear los datos desde plantilla_datos primero
    if (typeof solicitud === 'object' && solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        console.log('📄 [POLIZAS] Datos de plantilla encontrados:', plantillaData);
        // Extraer datos del concepto solo si el campo no existe en plantilla_datos
        const datosExtraidos = extraerDatosDelConcepto(solicitud.concepto || '');
        console.log('📄 [POLIZAS EXTRACCION] Datos extraídos del concepto:', datosExtraidos);
        // Usar SIEMPRE los datos de plantilla_datos si existen, solo usar base si no existe el campo
        solicitudPolizas = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto ?? datosExtraidos.asunto ?? '',
          titular_poliza: plantillaData.titular_poliza ?? plantillaData.aseguradora ?? solicitud.empresa_a_pagar ?? '',
          empresa_emisora: plantillaData.empresa_emisora ?? datosExtraidos.empresa_emisora ?? '',
          banco_destino: plantillaData.metodos_pago?.[0]?.banco_destino ? obtenerNombreBanco(plantillaData.metodos_pago[0].banco_destino) : (solicitud.banco_destino ? obtenerNombreBanco(solicitud.banco_destino) : ''),
          convenio: plantillaData.metodos_pago?.[0]?.convenio ?? datosExtraidos.convenio ?? '',
          referencia: plantillaData.metodos_pago?.[0]?.referencia ?? solicitud.cuenta_destino ?? '',
          numero_poliza: plantillaData.numero_poliza ?? '',
          monto: plantillaData.monto ?? (solicitud.monto !== undefined ? Number(solicitud.monto) : 0),
          tipo_movimiento: plantillaData.tipo_movimiento ?? '',
          nombre_solicitante: plantillaData.nombre_solicitante ?? solicitud.usuario_nombre ?? '',
          email_solicitante: plantillaData.email_solicitante ?? '',
          gerencia_solicitante: plantillaData.gerencia_solicitante ?? '',
          // Campos de la base de datos
          folio: solicitud.folio ?? '',
          departamento: solicitud.departamento ?? '',
          estado: (solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') ?? 'pendiente',
          concepto: solicitud.concepto ?? '',
          observaciones: solicitud.comentario_aprobador ?? '',
          // Campos de auditoría
          fecha_creacion: solicitud.fecha_creacion ?? '',
          fecha_actualizacion: solicitud.updated_at ?? '',
          usuario_creacion: solicitud.usuario_nombre ?? '',
          usuario_actualizacion: solicitud.aprobador_nombre ?? '',
        };
        console.log('🔧 [POLIZAS] Datos construidos desde plantilla (prioridad plantilla_datos):', solicitudPolizas);
      } catch (error) {
        console.error('❌ [POLIZAS] Error al parsear plantilla_datos:', error);
        // Fallback a datos base si falla el parsing
      }
    }
    
    // Si no tenemos datos de plantilla o falló el parsing, usar datos base
    if (!solicitudPolizas) {
      console.log('📋 [POLIZAS] Usando datos base de la solicitud...');
      
      // Extraer datos del concepto
      const datosExtraidos = extraerDatosDelConcepto(solicitud.concepto || '');
      console.log('📄 [POLIZAS EXTRACCION FALLBACK] Datos extraídos del concepto:', datosExtraidos);
      
      solicitudPolizas = {
        id_solicitud: solicitud.id_solicitud,
        asunto: datosExtraidos.asunto || '',
        titular_poliza: solicitud.empresa_a_pagar || '',
        empresa_emisora: datosExtraidos.empresa_emisora || '',
        banco_destino: obtenerNombreBanco(solicitud.banco_destino || ''),
        convenio: datosExtraidos.convenio || '',
        referencia: solicitud.cuenta_destino || '',
        numero_poliza: '',
        monto: Number(solicitud.monto) || 0,
        tipo_movimiento: '',
        nombre_solicitante: solicitud.usuario_nombre || '',
        email_solicitante: '',
        gerencia_solicitante: '',
        // Campos de la base de datos
        folio: solicitud.folio || '',
        departamento: solicitud.departamento || '',
        estado: solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada' || 'pendiente',
        concepto: solicitud.concepto || '',
        observaciones: solicitud.comentario_aprobador || '',
        // Campos de auditoría
        fecha_creacion: solicitud.fecha_creacion || '',
        fecha_actualizacion: solicitud.updated_at || '',
        usuario_creacion: solicitud.usuario_nombre || '',
        usuario_actualizacion: solicitud.aprobador_nombre || '',
      };
      
      console.log('🔧 [POLIZAS] Datos construidos:', solicitudPolizas);
    }
    
    if (solicitudPolizas) {
      console.log('✅ [POLIZAS] Mostrando modal PAGO POLIZAS con datos:', solicitudPolizas);
      return (
        <PlantillaPolizasDetailModal
          solicitud={solicitudPolizas}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  // Verificar si es una solicitud SUA FRENSHETSI
  if (isSuaFrenshetsiSolicitud(solicitud)) {
    console.log('🎯 [SUA FRENSHETSI] Detectada solicitud SUA FRENSHETSI, procesando datos...');
    
    let solicitudSuaFrenshetsi: SolicitudSuaFrenshetsiData | null = null;
    
    // Verificar que solicitud no sea null
    if (!solicitud) return null;
    
    // Intentar mapear los datos desde plantilla_datos primero
    if (typeof solicitud === 'object' && solicitud.plantilla_datos) {
      try {
        const plantillaData = typeof solicitud.plantilla_datos === 'string' ? JSON.parse(solicitud.plantilla_datos) : solicitud.plantilla_datos;
        console.log('📄 [SUA FRENSHETSI] Datos de plantilla encontrados:', plantillaData);
        
        // Extraer datos del concepto si no están en plantilla_datos
        const datosExtraidos = extraerDatosSuaDelConcepto(solicitud.concepto || '');
        console.log('📄 [SUA FRENSHETSI EXTRACCION] Datos extraídos del concepto:', datosExtraidos);
        
        // Usar datos de plantilla si están disponibles, sino usar campos de la base de datos
        solicitudSuaFrenshetsi = {
          id_solicitud: solicitud.id_solicitud,
          asunto: plantillaData.asunto || datosExtraidos.asunto || '',
          empresa: plantillaData.empresa || 'FRENSHETSI',
          cliente: plantillaData.cliente || datosExtraidos.empresa || '',
          monto: plantillaData.monto || Number(solicitud.monto) || 0,
          fecha_limite: plantillaData.fecha_limite || '',
          linea_captura: plantillaData.linea_captura || datosExtraidos.linea_captura || '',
          archivos_adjuntos: plantillaData.archivos_adjuntos || [],
          estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
          fecha_creacion: solicitud.fecha_creacion || '',
          fecha_actualizacion: solicitud.updated_at || '',
          usuario_creacion: solicitud.usuario_nombre || '',
          usuario_actualizacion: '',
        };
      } catch {
        console.log('❌ [SUA FRENSHETSI] Error parseando plantilla_datos, usando datos base');
      }
    }
    
    // Si no se pudo mapear desde plantilla_datos, usar datos básicos de la solicitud
    if (!solicitudSuaFrenshetsi) {
      console.log('🔄 [SUA FRENSHETSI] Construyendo desde datos básicos de solicitud...');
      
      // Extraer información del concepto usando la función unificada
      const datosExtraidos = extraerDatosSuaDelConcepto(solicitud.concepto || '');
      console.log('� [SUA FRENSHETSI FALLBACK] Datos extraídos del concepto:', datosExtraidos);
      
      const asunto = datosExtraidos.asunto || 'PAGO SUA FRENSHETSI';
      const cliente = datosExtraidos.empresa || solicitud.empresa_a_pagar || solicitud.nombre_persona || '';
      const linea_captura = datosExtraidos.linea_captura || '';
      
      solicitudSuaFrenshetsi = {
        id_solicitud: solicitud.id_solicitud,
        asunto,
        empresa: 'FRENSHETSI',
        cliente,
        monto: Number(solicitud.monto) || 0,
        fecha_limite: solicitud.fecha_limite_pago || '',
        linea_captura,
        archivos_adjuntos: [],
        estado: (solicitud.estado === 'autorizada' ? 'aprobada' : solicitud.estado as 'pendiente' | 'aprobada' | 'rechazada' | 'pagada') || 'pendiente',
        fecha_creacion: solicitud.fecha_creacion || '',
        fecha_actualizacion: solicitud.updated_at || '',
        usuario_creacion: solicitud.usuario_nombre || '',
        usuario_actualizacion: '',
      };
      
      console.log('🔧 [SUA FRENSHETSI] Datos construidos:', solicitudSuaFrenshetsi);
    }
    
    if (solicitudSuaFrenshetsi) {
      console.log('✅ [SUA FRENSHETSI] Mostrando modal SUA FRENSHETSI con datos:', solicitudSuaFrenshetsi);
      return (
        <PlantillaSuaFrenshetsiDetailModal
          solicitud={solicitudSuaFrenshetsi}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    }
    // Si no se pudo mapear, mostrar modal estándar
  }

  if (!isOpen || !solicitud) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
      />
      
      {/* Modal container */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[98vw] sm:max-w-6xl xl:max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden border border-white/20 backdrop-blur-sm">
        
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 z-30 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-2 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>

        {/* Contenedor con scroll */}
        <div className="overflow-y-auto max-h-[98vh] sm:max-h-[95vh] scrollbar-thin scrollbar-track-blue-50 scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400">
          
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-12 sm:translate-x-12 lg:-translate-y-16 lg:translate-x-16" />
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6 sm:translate-y-8 sm:-translate-x-8 lg:translate-y-12 lg:-translate-x-12" />
            
            <div className="relative z-10 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                  Solicitud #{solicitud.id_solicitud}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 space-y-1 sm:space-y-0">
                  <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                    Folio: <span className="font-mono text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded-md text-xs sm:text-sm">{solicitud.folio || '-'}</span>
                  </p>
                  <time className="text-blue-200 text-sm sm:text-base">
                    Creada el {formatDateForDisplay(solicitud.fecha_creacion)}
                  </time>
                </div>
              </div>
              <div className="flex justify-start sm:justify-end">
                <span className={`inline-flex px-3 py-2 sm:px-4 text-sm sm:text-base lg:text-lg font-bold rounded-lg sm:rounded-xl border-2 ${getEstadoColor(solicitud.estado)} backdrop-blur-sm`}> 
                  {solicitud.estado.toUpperCase()}
                </span>
              </div>
            </div>
          </header>

          {/* Mensaje de rechazo - Solo visible cuando la solicitud está rechazada */}
          {solicitud.estado === 'rechazada' && solicitud.comentario_aprobador && (
            <div className="mx-3 sm:mx-6 lg:mx-8 mb-4 sm:mb-6">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6 shadow-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-red-800 mb-2">
                      📝 Motivo del Rechazo
                    </h3>
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-red-200 shadow-sm">
                      <p className="text-sm sm:text-base text-red-900 leading-relaxed whitespace-pre-wrap">
                        {solicitud.comentario_aprobador}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium">
                      💡 Revisa los comentarios del aprobador y realiza las correcciones necesarias para reenviar tu solicitud.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
            
            {/* Resumen ejecutivo */}
            <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl rounded-xl sm:rounded-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-1">
                  <span className="text-xs sm:text-sm uppercase tracking-wider text-blue-100 font-bold block mb-1 sm:mb-2">
                    Monto total
                  </span>
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                      {formatCurrency(solicitud.monto)}
                    </p>
                    {solicitud.tipo_moneda && (
                      <span className="text-sm sm:text-base font-bold text-yellow-300 bg-yellow-400/20 px-2 py-1 rounded border border-yellow-400/30">
                        {solicitud.tipo_moneda.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-16 sm:w-20 lg:w-24" />
                </div>
                
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <span className="text-xs uppercase tracking-wider text-blue-100 block mb-1">Estado</span>
                    <p className="font-bold text-white">{solicitud.estado.toUpperCase()}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <span className="text-xs uppercase tracking-wider text-blue-100 block mb-1">Departamento</span>
                    <p className="font-medium text-white">
                      {solicitud.departamento ? 
                        solicitud.departamento.charAt(0).toUpperCase() + solicitud.departamento.slice(1) : 
                        '-'
                      }
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <span className="text-xs uppercase tracking-wider text-blue-100 block mb-1">Solicitante</span>
                    <p className="font-medium text-white text-sm">
                      {solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                    <span className="text-xs uppercase tracking-wider text-blue-100 block mb-1">Beneficiario</span>
                    <p className="font-medium text-white text-sm">{solicitud.nombre_persona || '-'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              
              {/* Contenido principal */}
              <div className="space-y-4 sm:space-y-6">
                
                {/* Concepto */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-lg rounded-xl sm:rounded-2xl">
                  <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-3 sm:mb-4 flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg sm:rounded-xl mr-3">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                    </div>
                    Concepto
                  </h2>
                  <div className="bg-white/80 p-3 sm:p-4 rounded-lg border border-green-100">
                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base font-medium">
                      {solicitud.concepto}
                    </p>
                  </div>
                </Card>

                {/* Información de pago principal */}
                <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
                  <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 sm:mb-6 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg sm:rounded-xl mr-3">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                    </div>
                    Información de Pago
                  </h2>
                  
                  {/* Información básica */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <InfoField
                        label="Se paga por"
                        value={solicitud.empresa_a_pagar}
                        className="bg-blue-50/50 border-blue-100"
                      />
                    <InfoField
                      label="Fecha límite"
                      value={solicitud.fecha_limite_pago ? formatDateForDisplay(solicitud.fecha_limite_pago) : null}
                      className="bg-blue-50/50 border-blue-100"
                    />
                  </div>
                  
                  {/* Información bancaria principal */}
                  <div className="bg-blue-50/40 rounded-lg p-3 sm:p-4 border border-blue-100/80 mb-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                      Datos Bancarios Principales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoField
                        label="Tipo de cuenta"
                        value={solicitud.tipo_cuenta_destino ? formatAccountType(solicitud.tipo_cuenta_destino, solicitud.tipo_tarjeta) : '-'}
                      />
                      <InfoField
                        label="Banco destino"
                        value={solicitud.banco_destino ? formatBankInfoAbreviado(solicitud.banco_destino) : '-'}
                      />
                      <InfoField
                        label="Cuenta destino"
                        value={solicitud.cuenta_destino?.replace(/_/g, ' ')}
                        variant="mono"
                        className="sm:col-span-2"
                      />
                    </div>
                  </div>

                  {/* Cuenta adicional */}
                  {hasCuentaAdicional && (
                    <div className="bg-purple-50/40 rounded-lg p-3 sm:p-4 border border-purple-100/80 mb-4">
                      <h3 className="text-sm font-medium text-purple-800 mb-3">Cuenta Adicional</h3>
                      <div className="bg-white/80 p-3 rounded border border-purple-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="font-mono text-purple-900 font-medium text-sm">
                            {solicitud.cuenta || '-'}
                          </p>
                          {solicitud.banco_cuenta && (
                            <>
                              <span className="text-purple-600 hidden sm:inline">|</span>
                              <span className="text-xs text-purple-600">
                                Banco: {solicitud.banco_cuenta ? formatBankInfo(solicitud.banco_cuenta) : '-'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información de acceso para Tarjeta Institucional */}
                  {esTarjetaInstitucional && tieneAccesoTarjetaInst && (
                    <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-lg p-3 sm:p-4 border border-blue-200/60 mb-4">
                      <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                        Acceso - Tarjeta Institucional
                      </h3>
                      
                      {solicitud.link_pago && (
                        <InfoField
                          label="Link de pago"
                          value={solicitud.link_pago}
                          className="mb-3"
                        />
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {solicitud.usuario_acceso && (
                          <InfoField
                            label="Usuario"
                            value={solicitud.usuario_acceso}
                            variant="mono"
                          />
                        )}
                        
                        {solicitud.contrasena_acceso && (
                          <PasswordField
                            label="Contraseña"
                            value={solicitud.contrasena_acceso}
                            isVisible={showPassword1}
                            onToggle={() => setShowPassword1(!showPassword1)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Descripción del tipo de pago */}
                  {solicitud.tipo_pago_descripcion && (
                    <InfoField
                      label="Descripción del tipo de pago"
                      value={solicitud.tipo_pago_descripcion}
                      className="bg-gray-50/80 border-gray-200"
                    />
                  )}
                </Card>

                {/* Segunda forma de pago */}
                {solicitud.tiene_segunda_forma_pago && (
                  <Card className="p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 shadow-lg rounded-xl sm:rounded-2xl">
                    <h2 className="text-lg sm:text-xl font-bold text-emerald-900 mb-4 flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg sm:rounded-xl mr-3">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                      </div>
                      Segunda Forma de Pago
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <InfoField
                        label="Tipo de cuenta"
                        value={solicitud.tipo_cuenta_destino_2 ? formatAccountType(solicitud.tipo_cuenta_destino_2, solicitud.tipo_tarjeta_2) : '-'}
                        className="bg-white/80 border-emerald-100"
                      />
                      <InfoField
                        label="Banco"
                        value={solicitud.banco_destino_2 ? formatBankInfo(solicitud.banco_destino_2) : '-'}
                        className="bg-white/80 border-emerald-100"
                      />
                      <InfoField
                        label="Cuenta"
                        value={solicitud.cuenta_destino_2}
                        variant="mono"
                        className="sm:col-span-2 bg-white/80 border-emerald-100"
                      />

                      {(solicitud.cuenta_2 || solicitud.banco_cuenta_2) && (
                        <div className="sm:col-span-2 bg-white/80 p-3 rounded border border-emerald-100">
                          <span className="text-xs uppercase tracking-wider text-emerald-700/70 block mb-1 font-medium">
                            Cuenta adicional
                          </span>
                          <div className="flex gap-2 items-center">
                            <p className="font-mono text-emerald-900 font-medium text-sm">
                              {solicitud.cuenta_2 || '-'}
                            </p>
                            {solicitud.banco_cuenta_2 && (
                              <>
                                <span className="text-emerald-600">|</span>
                                <span className="text-xs text-emerald-600">
                                  Banco: {formatBankInfo(solicitud.banco_cuenta_2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información de acceso segunda forma */}
                    {(solicitud.tipo_cuenta_destino_2 === 'Tarjeta Institucional' || 
                      solicitud.tipo_cuenta_destino_2 === 'Tarjeta Instituciona') && 
                     (solicitud.link_pago_2 || solicitud.usuario_acceso_2 || solicitud.contrasena_acceso_2) && (
                      <div className="mt-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded p-3 border border-blue-200/40">
                        <span className="text-xs font-medium text-blue-800 mb-3 block">
                          Información de acceso
                        </span>

                        {solicitud.link_pago_2 && (
                          <InfoField
                            label="Link de pago"
                            value={solicitud.link_pago_2}
                            className="mb-3"
                          />
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {solicitud.usuario_acceso_2 && (
                            <InfoField
                              label="Usuario"
                              value={solicitud.usuario_acceso_2}
                              variant="mono"
                            />
                          )}
                          
                          {solicitud.contrasena_acceso_2 && (
                            <PasswordField
                              label="Contraseña"
                              value={solicitud.contrasena_acceso_2}
                              isVisible={showPassword2}
                              onToggle={() => setShowPassword2(!showPassword2)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/*
                Diagnóstico de datos de plantilla SIEMPRE visible
                <Card className="p-5 mb-8 bg-white border border-yellow-300 shadow rounded-xl">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 mr-2 text-yellow-700" />
                    <h2 className="text-lg font-bold text-yellow-800">Diagnóstico de Plantilla</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-900 mb-4">
                    <div>
                      <span className="font-semibold">ID de Plantilla:</span>
                      <span className="ml-2 font-mono text-yellow-900">{String(plantillaData.plantillaId)}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Descripción de Pago:</span>
                      <span className="ml-2 font-mono text-yellow-900">{String(solicitud?.tipo_pago_descripcion)}</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold block mb-1">Mapeo de Plantilla:</span>
                    {plantillaData.mapeoPlantilla && typeof plantillaData.mapeoPlantilla === 'object' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-yellow-50 rounded p-3 border border-yellow-200">
                        {Object.entries(plantillaData.mapeoPlantilla.etiquetas || {}).map(([campo, etiqueta]) => (
                          <div key={campo} className="flex flex-col mb-1">
                            <span className="text-xs text-yellow-700 font-semibold">{campo.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className="text-sm text-yellow-900">{String(etiqueta)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="italic text-yellow-700">No disponible</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold block mb-1">Datos de Plantilla:</span>
                    {plantillaData.datosPlantilla && typeof plantillaData.datosPlantilla === 'object' && Object.keys(plantillaData.datosPlantilla).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-yellow-50 rounded p-3 border border-yellow-200">
                        {Object.entries(plantillaData.datosPlantilla).map(([campo, valor]) => (
                          <div key={campo} className="flex flex-col mb-1">
                            <span className="text-xs text-yellow-700 font-semibold">{campo.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className="text-sm text-yellow-900">{String(valor)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="italic text-yellow-700">No disponible</span>
                    )}
                  </div>
                </Card>
                */}

              </div>
            </div>

            {/* Sección de documentos */}
            <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <ExternalLink className="w-6 h-6 text-blue-700" />
                </div>
                Documentos Adjuntos
              </h2>
              
              <div className="space-y-4">
                {/* Factura principal */}
                {solicitud.factura_url ? (
                  <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <span className="text-sm text-blue-700 mb-2 flex items-center font-medium">
                      <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                      Previsualización de factura:
                    </span>
                    <div className="mt-2">
                      <FilePreview 
                        url={buildFileUrl(solicitud.factura_url)}
                        fileName={solicitud.factura_url.split('/').pop() || ''}
                        alt="Factura principal"
                      />
                    </div>
                  </div>
                ) : (
                  !solicitud.tipo_pago_descripcion?.startsWith('Plantilla:') && (
                    <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 flex items-center font-medium">
                        <FileText className="w-4 h-4 mr-1.5 text-gray-500" />
                        No hay factura adjunta
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Esta solicitud no tiene documentos adjuntos</p>
                    </div>
                  )
                )}

                {/* Botones de acción para documentos principales */}
                <div className="flex w-full justify-end mt-6">
                  {(solicitud.factura_url || solicitud.soporte_url) ? (
                    <div className="flex gap-3 items-end">
                      {solicitud.factura_url && (
                        <Button
                          size="lg"
                          onClick={() => window.open(buildFileUrl(solicitud.factura_url), '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 flex items-center gap-2 text-base min-w-[160px]"
                        >
                          <FileText className="w-5 h-5" />
                          Ver Factura
                          <ExternalLink className="w-5 h-5" />
                        </Button>
                      )}
                      {solicitud.soporte_url && (
                        <Button
                          size="lg"
                          onClick={() => solicitud.soporte_url && window.open(buildFileUrl(solicitud.soporte_url), '_blank')}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 flex items-center gap-2 text-base min-w-[160px]"
                        >
                          <FileText className="w-5 h-5" />
                          Ver Soporte
                          <ExternalLink className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg">
                      {solicitud.tipo_pago_descripcion?.startsWith('Plantilla:') 
                        ? 'Los archivos de la plantilla se están cargando...' 
                        : 'No hay documentos adjuntos disponibles'
                      }
                    </div>
                  )}
                </div>
              
                {/* Sección de comprobantes de pago */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                    <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
                    Comprobantes de Pago
                  </h3>
                    
                  {loading.comprobantes ? (
                    <LoadingSpinner message="Cargando comprobantes..." />
                  ) : errors.comprobantes ? (
                    <ErrorMessage message={errors.comprobantes} />
                  ) : comprobantes.length === 0 ? (
                    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl p-8 border border-blue-200/30 shadow-sm text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <FileCheck className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-blue-900 mb-2">Comprobantes Pendientes</h4>
                      <p className="text-sm text-blue-700 leading-relaxed max-w-md mx-auto">
                        El comprobante de pago aparecerá aquí una vez que la solicitud sea marcada como pagada
                      </p>
                      <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100/50 rounded-lg border border-blue-200/50">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                        <span className="text-xs font-medium text-blue-800">Estado: Esperando comprobantes</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comprobantes.map((comprobante) => {
                        const comprobanteUrl = buildFileUrl(comprobante.ruta_archivo);
                        const fileName = comprobante.nombre_archivo || comprobanteUrl.split('/').pop() || '';
                        
                        return (
                          <div key={comprobante.id_comprobante} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center bg-white/80 px-3 py-1.5 rounded-md w-fit">
                                  <span className="text-xs text-blue-800 font-semibold">
                                    {comprobante.nombre_usuario || `Usuario ${comprobante.usuario_subio}`}
                                  </span>
                                </div>
                                {comprobante.comentario && (
                                  <div className="mt-2 bg-white/60 p-2 rounded border-l-3 border-blue-300">
                                    <p className="text-xs text-gray-700 italic">&ldquo;{comprobante.comentario}&rdquo;</p>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => window.open(comprobanteUrl, '_blank')}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 ml-3"
                                disabled={!comprobanteUrl}
                              >
                                Ver completo
                              </Button>
                            </div>
                            
                            <FilePreview 
                              url={comprobanteUrl}
                              fileName={fileName}
                              alt={`Comprobante de ${comprobante.nombre_usuario || 'usuario'}: ${fileName}`}
                              height="h-36"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}