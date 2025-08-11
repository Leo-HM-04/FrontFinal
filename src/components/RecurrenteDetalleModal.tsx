import React, { useState, useEffect, useCallback } from 'react';
import { FileCheck, Building, BadgeDollarSign, CreditCard, StickyNote, Repeat2, X, User2 } from 'lucide-react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import '@/styles/modal.css';

interface RecurrenteDetalleModalProps {
  open: boolean;
  onClose: () => void;
  recurrente: {
    id?: string;
    departamento: string;
    monto: string;
    cuenta_destino: string;
    concepto: string;
    tipo_pago: string;
    tipo_pago_descripcion?: string;
    empresa_a_pagar?: string;
    nombre_persona?: string;
    tipo_cuenta_destino?: string;
    tipo_tarjeta?: string;
    banco_destino?: string;
    frecuencia: string;
    siguiente_fecha: string;
    activo: boolean;
    fact_recurrente?: string;
    nombre_usuario?: string;
    estado?: string;
  } | null;
}

interface ComprobanteRecurrente {
  id: number;
  con_recurrente: string;
  fecha_pago: string;
  usuario_pago: string;
  comentario?: string;
}

export const RecurrenteDetalleModal: React.FC<RecurrenteDetalleModalProps> = ({ open, onClose, recurrente }) => {
  const [comprobantes, setComprobantes] = useState<ComprobanteRecurrente[]>([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

  // Función para obtener comprobantes de pago
  const fetchComprobantes = useCallback(async () => {
    if (!recurrente?.id || (recurrente.estado !== 'pagado' && recurrente.estado !== 'pagada')) return;
    
    console.log('🔍 Fetching comprobantes for recurrente ID:', recurrente.id);
    console.log('🔍 Estado actual:', recurrente.estado);
    
    setLoadingComprobantes(true);
    setErrorComprobantes(null);
    
    try {
      const url = `http://46.202.177.106:4000/api/recurrentes/${recurrente.id}/comprobantes`;
      console.log('🔍 URL de la petición:', url);
      
      // Obtener el token de autenticación de las cookies
      const token = Cookies.get('auth_token');
      console.log('🔍 Token encontrado:', token ? '✅ Sí' : '❌ No');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('🔍 Datos recibidos:', data);
      setComprobantes(data);
    } catch (error) {
      console.error('❌ Error fetching comprobantes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrorComprobantes(`Error al cargar los comprobantes: ${errorMessage}`);
    } finally {
      setLoadingComprobantes(false);
    }
  }, [recurrente?.id, recurrente?.estado]);

  // Cargar comprobantes cuando se abre el modal y está en estado pagado
  useEffect(() => {
    if (open && (recurrente?.estado === 'pagado' || recurrente?.estado === 'pagada')) {
      fetchComprobantes();
    }
  }, [open, recurrente?.id, recurrente?.estado, fetchComprobantes]);

  // Early return después de todos los hooks
  if (!open || !recurrente) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Construir URL absoluta para la factura si es solo el nombre del archivo
  const getFacturaUrl = (factura?: string) => {
    if (!factura) return undefined;
    if (/^https?:\/\//.test(factura)) return factura;
    // Si ya empieza con /uploads, anteponer el host
    if (factura.startsWith('/uploads')) return `http://46.202.177.106:4000${factura}`;
    // Si es solo el nombre del archivo
    return `http://46.202.177.106:4000/uploads/RECURRENTE/${factura}`;
  };

  // Construir URL para comprobantes de pago
  const getComprobanteUrl = (comprobante?: string) => {
    if (!comprobante) return undefined;
    if (/^https?:\/\//.test(comprobante)) return comprobante;
    // Si ya empieza con /uploads, anteponer el host
    if (comprobante.startsWith('/uploads')) return `http://46.202.177.106:4000${comprobante}`;
    // Si es solo el nombre del archivo
    return `http://46.202.177.106:4000/uploads/comprobante-recurrentes/${comprobante}`;
  };
  
  // Función para obtener logo del banco
  const getBancoLogo = (bancoNombre?: string): string | undefined => {
    if (!bancoNombre) return undefined;
    
    const nombreNormalizado = bancoNombre.toLowerCase().trim();
    
    // Mapeo de nombres de bancos a sus logos
    const bancosLogos: Record<string, string> = {
      'bbva': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BBVA_logo.svg/200px-BBVA_logo.svg.png',
      'bancomer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BBVA_logo.svg/200px-BBVA_logo.svg.png',
      'banamex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Citibanamex_Logo.png/200px-Citibanamex_Logo.png',
      'citibanamex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Citibanamex_Logo.png/200px-Citibanamex_Logo.png',
      'santander': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/200px-Banco_Santander_Logotipo.svg.png',
      'hsbc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/200px-HSBC_logo_%282018%29.svg.png',
      'banorte': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Banorte_Logo.svg/200px-Banorte_Logo.svg.png',
      'scotiabank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Scotiabank_logo.svg/200px-Scotiabank_logo.svg.png',
      'inbursa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Inbursa_logo.svg/200px-Inbursa_logo.svg.png',
      'afirme': 'https://www.afirme.com/Imagenes/Banco/LogoAfirme.png',
      'banco azteca': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Banco_Azteca_logo.svg/200px-Banco_Azteca_logo.svg.png',
      'banjercito': 'https://upload.wikimedia.org/wikipedia/commons/8/83/Logobanjercito.png',
      'banregio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Logo_Banregio.svg/200px-Logo_Banregio.svg.png',
      'bx+': 'https://www.bxmas.com/assets/uploads/configuracion/logoHeader.png',
      'hey banco': 'https://d1.awsstatic.com/logos/customers/mexico/heybancologo.2ea4f2befc051a0c9914931f4e2bd894d8eee989.png',
      'nu bank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/200px-Nubank_logo_2021.svg.png',
      'nubank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/200px-Nubank_logo_2021.svg.png',
      'mercadopago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/MercadoPago.svg/200px-MercadoPago.svg.png',
      'mercado pago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/MercadoPago.svg/200px-MercadoPago.svg.png',
    };
    
    // Buscar coincidencias parciales en el nombre del banco
    for (const [banco, logo] of Object.entries(bancosLogos)) {
      if (nombreNormalizado.includes(banco)) {
        return logo;
      }
    }
    
    // Logo genérico para bancos no reconocidos
    return 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-indigo-900/70 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-sm animate-slide-up">
        {/* Contenedor con scroll interno */}
        <div className="overflow-y-auto max-h-[90vh] modal-scroll">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-700 text-white p-8 relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-white/20 rounded-2xl shadow-lg">
              <Repeat2 className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Plantilla Recurrente #{recurrente.id}
              </h2>
              <div className="flex flex-wrap gap-4 items-center text-blue-100 text-lg">
                <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                  <User2 className="w-5 h-5" /> 
                  {recurrente.nombre_usuario || 'Usuario no especificado'}
                </span>
                <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                  <Building className="w-5 h-5" /> 
                  {recurrente.departamento}
                </span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <span className={`inline-flex items-center px-4 py-2 text-lg font-bold rounded-xl border-2 backdrop-blur-sm ${
                recurrente.activo ? 'bg-green-100/20 text-green-300 border-green-300' : 'bg-red-100/20 text-red-300 border-red-300'
              }`}>
                {recurrente.activo ? 'ACTIVO' : 'INACTIVO'}
              </span>
              {recurrente.estado && (
                <div>
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-bold rounded-lg ${
                    recurrente.estado === 'pendiente' ? 'bg-yellow-100/20 text-yellow-300 border border-yellow-300' :
                    recurrente.estado === 'aprobada' ? 'bg-green-100/20 text-green-300 border border-green-300' :
                    'bg-red-100/20 text-red-300 border border-red-300'
                  }`}>
                    {recurrente.estado.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal mejorado */}
        <div className="p-8 space-y-8">
          {/* Información Principal - 3 columnas para ser más ancho */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Card de Información Financiera */}
            <div className="xl:col-span-2 p-6 bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <BadgeDollarSign className="w-6 h-6 text-blue-700" />
                </div>
                Información Financiera
              </h3>
              
              {/* Monto destacado */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-2xl border border-green-300/50 mb-6 shadow-lg">
                <span className="text-sm uppercase tracking-wider text-green-100 font-bold block mb-2">Monto Recurrente</span>
                <p className="text-4xl font-black text-white tracking-tight">${parseFloat(recurrente.monto).toLocaleString('es-MX')}</p>
                <div className="mt-2 h-1 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full w-24"></div>
              </div>
              
              {/* Grid de información financiera */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Cuenta Destino</span>
                  <p className="font-mono text-blue-900 font-medium text-sm">{recurrente.cuenta_destino}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Tipo de Pago</span>
                  <p className="text-blue-900 font-medium text-sm capitalize">{recurrente.tipo_pago}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Frecuencia</span>
                  <p className="text-blue-900 font-medium text-sm capitalize">{recurrente.frecuencia}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <span className="text-xs uppercase tracking-wider text-blue-700/70 block mb-2 font-medium">Próxima Fecha</span>
                  <p className="text-blue-900 font-medium text-sm">{formatDate(recurrente.siguiente_fecha)}</p>
                </div>
              </div>
            </div>
            
            {/* Card de Estado y Control */}
            <div className="p-6 bg-gradient-to-br from-white to-indigo-50/30 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-indigo-100 rounded-xl mr-3">
                  <Repeat2 className="w-6 h-6 text-indigo-700" />
                </div>
                Estado y Control
              </h3>
              
              {/* Estado de actividad */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-2xl border border-indigo-300/50 mb-6 shadow-lg">
                <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-indigo-100">Estado Actual</span>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-3 shadow-lg ${recurrente.activo ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <p className="font-black text-2xl text-white tracking-tight">{recurrente.activo ? 'ACTIVO' : 'INACTIVO'}</p>
                </div>
                <div className={`mt-2 h-1 rounded-full w-20 ${recurrente.activo ? 'bg-gradient-to-r from-green-400 to-green-300' : 'bg-gradient-to-r from-red-400 to-red-300'}`}></div>
              </div>
              
              {/* Información de estado */}
              <div className="space-y-4">
                {recurrente.estado && (
                  <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/80 shadow-sm">
                    <span className="text-xs uppercase tracking-wider text-indigo-700/70 block mb-2 font-medium">Estado de Aprobación</span>
                    <p className="text-indigo-900 font-medium capitalize">{recurrente.estado}</p>
                  </div>
                )}
                
                <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/80 shadow-sm">
                  <span className="text-xs uppercase tracking-wider text-indigo-700/70 block mb-2 font-medium">Departamento</span>
                  <p className="text-indigo-900 font-medium">{recurrente.departamento}</p>
                </div>
              </div>
            </div>
          </div>

          
          {/* Información de Cuenta y Beneficiario */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Card de Información de Cuenta */}
            <div className="p-6 bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-purple-100 rounded-xl mr-3">
                  <CreditCard className="w-6 h-6 text-purple-700" />
                </div>
                Información de Cuenta
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-2 font-medium">Tipo de Cuenta</span>
                  <p className="text-purple-900 font-medium">{recurrente.tipo_cuenta_destino || 'No especificado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-2 font-medium">Tipo de Tarjeta</span>
                  <p className="text-purple-900 font-medium">{recurrente.tipo_tarjeta || 'No aplica'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <div className="flex items-center gap-3">
                    {recurrente.banco_destino && getBancoLogo(recurrente.banco_destino) ? (
                      <Image 
                        src={getBancoLogo(recurrente.banco_destino) || 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png'} 
                        alt={`Logo de ${recurrente.banco_destino}`}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain rounded"
                        unoptimized
                      />
                    ) : (
                      <Building className="w-6 h-6 text-purple-600" />
                    )}
                    <div className="flex-1">
                      <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-1 font-medium">Banco</span>
                      <p className="text-purple-900 font-medium">{recurrente.banco_destino || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <span className="text-xs uppercase tracking-wider text-purple-700/70 block mb-2 font-medium">Descripción del Pago</span>
                  <p className="text-purple-900 font-medium">{recurrente.tipo_pago_descripcion || 'Sin descripción adicional'}</p>
                </div>
              </div>
            </div>
            
            {/* Card de Información del Beneficiario */}
            <div className="p-6 bg-gradient-to-br from-white to-teal-50/30 border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-teal-100 rounded-xl mr-3">
                  <User2 className="w-6 h-6 text-teal-700" />
                </div>
                Información del Beneficiario
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-100">
                  <span className="text-xs uppercase tracking-wider text-teal-700/70 block mb-2 font-medium">Persona</span>
                  <p className="text-teal-900 font-medium">{recurrente.nombre_persona || 'No especificado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-100">
                  <span className="text-xs uppercase tracking-wider text-teal-700/70 block mb-2 font-medium">Empresa</span>
                  <p className="text-teal-900 font-medium">{recurrente.empresa_a_pagar || 'No especificado'}</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-teal-100">
                  <span className="text-xs uppercase tracking-wider text-teal-700/70 block mb-2 font-medium">Usuario Responsable</span>
                  <p className="text-teal-900 font-medium">{recurrente.nombre_usuario || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          
          {/* Concepto y Documentos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Concepto - 1 columna */}
            <div className="p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <StickyNote className="w-6 h-6 text-green-700" />
                </div>
                Concepto
              </h3>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50 shadow-inner">
                <p className="text-gray-800 leading-relaxed text-base font-medium break-words">{recurrente.concepto}</p>
              </div>
            </div>
            
            {/* Documentos - 2 columnas */}
            <div className="lg:col-span-2 p-6 bg-gradient-to-br from-white to-amber-50/30 border border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                <div className="p-2 bg-amber-100 rounded-xl mr-3">
                  <FileCheck className="w-6 h-6 text-amber-700" />
                </div>
                Documentos Adjuntos
              </h3>
              
              <div className="space-y-4">
                {recurrente.fact_recurrente ? (
                  <div className="bg-white p-4 rounded-xl border border-amber-200/50 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Factura Adjunta
                      </span>
                      <a 
                        href={getFacturaUrl(recurrente.fact_recurrente)} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl px-4 py-2 text-sm font-medium"
                      >
                        Ver Documento Completo
                      </a>
                    </div>
                    
                    {/* Previsualización mejorada */}
                    <div className="border border-amber-200 rounded-xl overflow-hidden shadow-inner">
                      {recurrente.fact_recurrente.toLowerCase().endsWith('.pdf') ? (
                        <div className="relative h-64 bg-gray-50">
                          <iframe 
                            src={`${getFacturaUrl(recurrente.fact_recurrente)}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-0"
                            title="Vista previa de factura"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-100/90 to-transparent p-2">
                            <p className="text-xs text-center text-amber-800">Vista previa limitada • Haga clic en &quot;Ver Documento Completo&quot; para abrir el PDF completo</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4 bg-white">
                          <Image
                            src={getFacturaUrl(recurrente.fact_recurrente) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik01IDh2LTNoMTR2M2gtMTR6bTAgMTJoMTR2LTloLTE0djl6bTAtMTVoMTRjLjU1MiAwIDEgLjQ0OCAxIDFzLS40NDggMS0xIDFoLTE0Yy0uNTUyIDAtMS0uNDQ4LTEtMXMuNDQ4LTEgMS0xem0wIDE2Yy0uNTUyIDAtMS0uNDQ4LTEtMXYtMTBjMC0uNTUyLjQ0OC0xIDEtMWgxNGMuNTUyIDAgMSAuNDQ4IDEgMXYxMGMwIC41NTItLjQ0OCAxLTEgMWgtMTR6IiBmaWxsPSIjOTJhNGJkIi8+PC9zdmc+'}
                            alt="Vista previa de factura"
                            className="max-h-48 object-contain rounded-lg"
                            width={400}
                            height={192}
                            style={{ objectFit: 'contain' }}
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200 text-center">
                    <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <span className="text-gray-600 font-medium block mb-1">No hay documentos adjuntos</span>
                    <p className="text-sm text-gray-500">Esta plantilla recurrente no tiene archivos adjuntos</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Comprobantes de Pago - Solo si está pagado */}
          {(recurrente.estado === 'pagado' || recurrente.estado === 'pagada') && (
            <div className="p-6 bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center">
                <div className="p-2 bg-green-100 rounded-xl mr-3">
                  <FileCheck className="w-6 h-6 text-green-700" />
                </div>
                Comprobantes de Pago
              </h3>
              
              {loadingComprobantes ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-green-700">Cargando comprobantes...</span>
                </div>
              ) : errorComprobantes ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <span className="text-red-600 font-medium">{errorComprobantes}</span>
                </div>
              ) : comprobantes.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {comprobantes.map((comprobante) => (
                    <div key={comprobante.id} className="bg-white p-4 rounded-xl border border-green-200/50 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Comprobante #{comprobante.id}
                        </span>
                        <a 
                          href={getComprobanteUrl(comprobante.con_recurrente)} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg px-3 py-1 text-xs font-medium"
                        >
                          Ver
                        </a>
                      </div>
                      
                      {/* Información del comprobante */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-xs text-green-600 font-medium">Fecha de Pago</span>
                          <p className="text-sm text-gray-800">{formatDate(comprobante.fecha_pago)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-green-600 font-medium">Usuario</span>
                          <p className="text-sm text-gray-800">{comprobante.usuario_pago}</p>
                        </div>
                        {comprobante.comentario && (
                          <div>
                            <span className="text-xs text-green-600 font-medium">Comentario</span>
                            <p className="text-sm text-gray-800">{comprobante.comentario}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Preview del comprobante */}
                      <div className="border border-green-200 rounded-lg overflow-hidden">
                        {comprobante.con_recurrente.toLowerCase().endsWith('.pdf') ? (
                          <div className="relative h-32 bg-gray-50">
                            <iframe 
                              src={`${getComprobanteUrl(comprobante.con_recurrente)}#toolbar=0&navpanes=0`}
                              className="w-full h-full border-0"
                              title={`Vista previa comprobante ${comprobante.id}`}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-100/90 to-transparent p-1">
                              <p className="text-xs text-center text-green-800">PDF Preview</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-2 bg-white h-32">
                            <Image
                              src={getComprobanteUrl(comprobante.con_recurrente) || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik01IDh2LTNoMTR2M2gtMTR6bTAgMTJoMTR2LTloLTE0djl6bTAtMTVoMTRjLjU1MiAwIDEgLjQ0OCAxIDFzLS40NDggMS0xIDFoLTE0Yy0uNTUyIDAtMS0uNDQ4LTEtMXMuNDQ4LTEgMS0xem0wIDE2Yy0uNTUyIDAtMS0uNDQ4LTEtMXYtMTBjMC0uNTUyLjQ0OC0xIDEtMWgxNGMuNTUyIDAgMSAuNDQ4IDEgMXYxMGMwIC41NTItLjQ0OCAxLTEgMWgtMTR6IiBmaWxsPSIjOTJhNGJkIi8+PC9zdmc+'}
                              alt={`Comprobante ${comprobante.id}`}
                              className="max-h-28 object-contain rounded"
                              width={200}
                              height={112}
                              style={{ objectFit: 'contain' }}
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200 text-center">
                  <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <span className="text-gray-600 font-medium block mb-1">No hay comprobantes de pago</span>
                  <p className="text-sm text-gray-500">Aún no se han subido comprobantes para este pago recurrente</p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
    
  );
};
