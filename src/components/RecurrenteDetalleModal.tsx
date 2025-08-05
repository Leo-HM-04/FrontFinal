import React from 'react';
import { FileCheck, Building, BadgeDollarSign, Banknote, CreditCard, CalendarDays, StickyNote, Repeat2, X, CircleCheck, CircleX, User2 } from 'lucide-react';

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

export const RecurrenteDetalleModal: React.FC<RecurrenteDetalleModalProps> = ({ open, onClose, recurrente }) => {
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
    if (factura.startsWith('/uploads')) return `http://localhost:4000${factura}`;
    // Si es solo el nombre del archivo
    return `http://localhost:4000/uploads/RECURRENTE/${factura}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up border border-blue-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-full p-2 shadow-lg transition-all duration-200"
          aria-label="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabecera azul con icono */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-2xl px-8 py-6 flex items-center gap-4">
          <Repeat2 className="w-12 h-12 text-white bg-blue-400/30 rounded-full p-2 shadow" />
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-3">
              Plantilla #{recurrente.id}
              <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${recurrente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                {recurrente.activo ? 'Activo' : 'Inactivo'}
              </span>
              {recurrente.estado && (
                <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  recurrente.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  recurrente.estado === 'aprobada' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {recurrente.estado}
                </span>
              )}
            </h2>
            <div className="flex flex-wrap gap-4 items-center text-white/90 text-base font-medium">
              <span className="flex items-center gap-2">
                <User2 className="w-5 h-5" /> Usuario:
                <span className="font-normal">{recurrente.nombre_usuario || '-'}</span>
              </span>
              <span className="flex items-center gap-2">
                <Building className="w-5 h-5" /> Departamento:
                <span className="font-normal">{recurrente.departamento}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de detalles ordenada */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <BadgeDollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-blue-900">Monto:</span>
              <span className="ml-auto text-lg font-bold text-blue-900">${parseFloat(recurrente.monto).toLocaleString('es-MX')}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-blue-900">Cuenta Destino:</span>
              <span className="ml-auto text-blue-900">{recurrente.cuenta_destino}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Banknote className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-900">Tipo de Pago:</span>
              <span className="ml-auto capitalize text-blue-900">{recurrente.tipo_pago}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <Repeat2 className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-900">Frecuencia:</span>
              <span className="ml-auto capitalize text-blue-900">{recurrente.frecuencia}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
              <CalendarDays className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-blue-900">Siguiente Fecha:</span>
              <span className="ml-auto text-blue-900">{formatDate(recurrente.siguiente_fecha)}</span>
            </div>

            {/* Datos de Cuenta - Nuevos campos */}
            <div className="md:col-span-2 mt-2 mb-2">
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Información de Cuenta
              </h3>
            </div>

            {/* Tipo de Cuenta */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-blue-900">Tipo de Cuenta:</span>
              <span className="ml-auto text-blue-900">{recurrente.tipo_cuenta_destino || 'No especificado'}</span>
            </div>
            
            {/* Tipo de Tarjeta */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-blue-900">Tipo de Tarjeta:</span>
              <span className="ml-auto text-blue-900">{recurrente.tipo_tarjeta || 'No aplica'}</span>
            </div>
            
            {/* Banco con Logo */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              {recurrente.banco_destino && getBancoLogo(recurrente.banco_destino) ? (
                <img 
                  src={getBancoLogo(recurrente.banco_destino)} 
                  alt={`Logo de ${recurrente.banco_destino}`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png';
                  }}
                />
              ) : (
                <Building className="w-5 h-5 text-indigo-600" />
              )}
              <span className="font-semibold text-blue-900">Banco:</span>
              <span className="ml-auto text-blue-900">{recurrente.banco_destino || 'No especificado'}</span>
            </div>

            {/* Beneficiario - Nuevos campos */}
            <div className="md:col-span-2 mt-4 mb-2">
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                <User2 className="w-5 h-5 text-teal-600" /> Información del Beneficiario
              </h3>
            </div>
            
            {/* Persona */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
              <User2 className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-blue-900">Persona:</span>
              <span className="ml-auto text-blue-900">{recurrente.nombre_persona || 'No especificado'}</span>
            </div>
            
            {/* Empresa */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
              <Building className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-blue-900">Empresa:</span>
              <span className="ml-auto text-blue-900">{recurrente.empresa_a_pagar || 'No especificado'}</span>
            </div>
            
            {/* Descripción del Pago */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 md:col-span-2">
              <StickyNote className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-blue-900">Descripción del Pago:</span>
              <span className="ml-auto text-blue-900">{recurrente.tipo_pago_descripcion || 'Sin descripción adicional'}</span>
            </div>
            
            {/* Campos adicionales que podríamos añadir según necesidades específicas */}
            {recurrente.estado && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                <CalendarDays className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-blue-900">Estado de Aprobación:</span>
                <span className="ml-auto capitalize text-blue-900">{recurrente.estado}</span>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
              <CircleCheck className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-blue-900">Estado:</span>
              <span className="ml-auto flex items-center gap-2">
                {recurrente.activo
                  ? <CircleCheck className="w-4 h-4 text-green-600" />
                  : <CircleX className="w-4 h-4 text-red-500" />}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${recurrente.activo ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {recurrente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 md:col-span-2">
              <FileCheck className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-900">Factura:</span>
              <span className="ml-auto">
                {recurrente.fact_recurrente
                  ? <a href={getFacturaUrl(recurrente.fact_recurrente)} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Ver archivo</a>
                  : <span className="italic text-gray-400">No adjunta</span>}
              </span>
            </div>

            {/* Previsualización de la factura */}
            {recurrente.fact_recurrente && (
              <div className="md:col-span-2 mt-2">
                <div className="border border-blue-100 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 py-2 px-4 flex items-center justify-between">
                    <span className="font-medium text-blue-800 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Previsualización del documento
                    </span>
                    <a 
                      href={getFacturaUrl(recurrente.fact_recurrente)} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-full transition-colors"
                    >
                      Abrir completo
                    </a>
                  </div>
                  <div className="p-2 bg-gray-50">
                    {recurrente.fact_recurrente.toLowerCase().endsWith('.pdf') ? (
                      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                        <iframe 
                          src={`${getFacturaUrl(recurrente.fact_recurrente)}#toolbar=0&navpanes=0`}
                          className="absolute inset-0 w-full h-full border-0"
                          title="Vista previa de factura"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 bg-white">
                        <img 
                          src={getFacturaUrl(recurrente.fact_recurrente)} 
                          alt="Vista previa de factura"
                          className="max-h-60 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik01IDh2LTNoMTR2M2gtMTR6bTAgMTJoMTR2LTloLTE0djl6bTAtMTVoMTRjLjU1MiAwIDEgLjQ0OCAxIDFzLS40NDggMS0xIDFoLTE0Yy0uNTUyIDAtMS0uNDQ4LTEtMXMuNDQ4LTEgMS0xem0wIDE2Yy0uNTUyIDAtMS0uNDQ4LTEtMXYtMTBjMC0uNTUyLjQ0OC0xIDEtMWgxNGMuNTUyIDAgMSAuNDQ4IDEgMXYxMGMwIC41NTItLjQ0OCAxLTEgMWgtMTR6IiBmaWxsPSIjOTJhNGJkIi8+PC9zdmc+';
                            target.style.padding = '2rem';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mb-2 font-semibold text-blue-900 flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-pink-500" /> Concepto:
          </div>
          <div className="text-blue-900 bg-blue-50 rounded-lg p-4 mb-2 break-words shadow-inner border border-blue-100">
            {recurrente.concepto}
          </div>
        </div>
      </div>
    </div>
  );
};
