"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViaticosService } from '@/services/viaticos.service';
import { FaTrash, FaDownload, FaFileWord, FaClipboardList, FaBolt } from 'react-icons/fa';
import { formatDateForAPI, getCurrentUTC6Date } from '@/utils/dateUtils';

// Si no existe el tipo Viatico, defínelo aquí o impórtalo desde '@/types/viatico'
type Viatico = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  fecha_limite_pago: string;
  viatico_url?: string;
  id_usuario?: string;
  tipo_pago_descripcion?: string;
  nombre_persona: string;
  cuenta: string;
  banco_cuenta: string;
};

type FormState = {
  form: Partial<Viatico>;
  file: File | null;
  mensaje: string;
  errors: Record<string, string>;
};

export default function NuevoViaticoPage() {
  const [formularios, setFormularios] = useState<FormState[]>([
    { form: {}, file: null, mensaje: '', errors: {} }
  ]);
  const [mensajeGlobal, setMensajeGlobal] = useState<string>('');
  const [exito, setExito] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const router = useRouter();

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const nuevos = [...formularios];
    nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value };
    setFormularios(nuevos);
  };

  const handleFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const nuevos = [...formularios];
      nuevos[idx].file = e.target.files[0];
      setFormularios(nuevos);
    }
  };

  const bancoOptions = [
    "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
  ];

  const handleSubmitTodos = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const nuevos = [...formularios];
    let huboError = false;

    // Validar todos los formularios antes de enviar
    nuevos.forEach((f, idx) => {
      const errors: Record<string, string> = {};
      // Validar archivo
      if (!f.file) {
        errors.file = 'Adjunta un archivo';
        huboError = true;
      }
      // Solo validar que tenga un valor en cuenta_destino
      if (!f.form.cuenta_destino) {
        errors.cuenta_destino = 'Ingresa el número de cuenta, tarjeta o CLABE';
        huboError = true;
      }
      
      // Validar dígitos de CLABE (18 dígitos exactos)
      if (f.form.tipo_cuenta_destino === 'clabe' && f.form.cuenta_destino) {
        const clabePattern = /^\d{18}$/;
        if (!clabePattern.test(f.form.cuenta_destino)) {
          errors.cuenta_destino = 'La CLABE debe tener exactamente 18 dígitos';
          huboError = true;
        }
      }

      // Validar dígitos de Número de Tarjeta (máximo 16 dígitos)
      if (f.form.tipo_cuenta_destino === 'tarjeta' && f.form.cuenta_destino) {
        const tarjetaPattern = /^\d{1,16}$/;
        if (!tarjetaPattern.test(f.form.cuenta_destino)) {
          errors.cuenta_destino = 'El número de tarjeta debe tener máximo 16 dígitos';
          huboError = true;
        }
      }
      
      if (f.form.tipo_cuenta_destino === 'tarjeta' && !f.form.tipo_tarjeta) {
        errors.tipo_tarjeta = 'Selecciona el tipo de tarjeta';
        huboError = true;
      }
      // Validar campos cuenta y banco_cuenta
      if (f.form.cuenta && f.form.cuenta.trim() !== '' && !f.form.banco_cuenta) {
        errors.banco_cuenta = 'Especifica el banco al que pertenece la cuenta';
        huboError = true;
      }
      nuevos[idx].errors = errors;
    });

    if (huboError) {
      setFormularios(nuevos);
      setMensajeGlobal('Por favor corrige los errores antes de continuar.');
      setExito(false);
      setEnviando(false);
      return;
    }

    // Si no hay errores, proceder con el envío
    await Promise.all(
      nuevos.map(async (f, idx) => {
        try {
          const data = {
            departamento: f.form.departamento || '',
            monto: parseFloat(f.form.monto || '0'),
            cuenta_destino: f.form.cuenta_destino || '',
            concepto: 'Pago a terceros', // Siempre fijo
            tipo_pago: 'viaticos',
            tipo_cuenta_destino: f.form.tipo_cuenta_destino || 'clabe',
            tipo_tarjeta: f.form.tipo_tarjeta || '',
            banco_destino: f.form.banco_destino || '',
            fecha_limite_pago: f.form.fecha_limite_pago || formatDateForAPI(getCurrentUTC6Date()),
            viatico_url: f.file || undefined,
            tipo_pago_descripcion: f.form.tipo_pago_descripcion || '',
            nombre_persona: f.form.nombre_persona || '',
            cuenta: f.form.cuenta || '',
            banco_cuenta: f.form.banco_cuenta || '',
          };
          await ViaticosService.createWithFile(data);
          nuevos[idx].mensaje = 'Viático creado correctamente';
        } catch {
          nuevos[idx].mensaje = 'Error al crear viático';
          huboError = true;
        }
      })
    );
    setFormularios(nuevos);
    if (!huboError) {
      setMensajeGlobal('¡Todos los viáticos fueron creados exitosamente! Redirigiendo...');
      setExito(true);
      setEnviando(false);
      // Scroll al mensaje de éxito
      setTimeout(() => {
        const msg = document.getElementById('mensaje-global-exito');
        if (msg) msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => {
        router.push('/dashboard/solicitante/mis-viaticos');
      }, 700);
    } else {
      setMensajeGlobal('Hubo errores al crear algunos viáticos. Revisa los mensajes.');
      setExito(false);
      setEnviando(false);
      
      // Scroll al primer campo con error de dígitos y mostrar toast
      setTimeout(() => {
        // Buscar errores de dígitos específicamente
        const digitErrors = formularios.filter((f) => {
          const error = f.errors?.cuenta_destino;
          return error && (error.includes('dígitos') || error.includes('CLABE'));
        });
        
        if (digitErrors.length > 0) {
          // Encontrar el índice del primer error de dígitos
          const errorIndex = formularios.findIndex((f) => {
            const error = f.errors?.cuenta_destino;
            return error && (error.includes('dígitos') || error.includes('CLABE'));
          });
          
          if (errorIndex >= 0) {
            const targetField = document.querySelector(`input[name="cuenta_destino"]:nth-of-type(${errorIndex + 1})`);
            if (targetField) {
              targetField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              (targetField as HTMLElement).focus();
              
              // Mostrar toast con el mensaje de error
              const errorMessage = formularios[errorIndex].errors?.cuenta_destino;
              if (errorMessage) {
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
                toast.textContent = `Viático ${errorIndex + 1}: ${errorMessage}`;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                  if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                  }
                }, 4000);
              }
            }
          }
        }
      }, 100);
    }
  };

  const handleAgregarOtro = () => {
    setFormularios([...formularios, { form: {}, file: null, mensaje: '', errors: {} }]);
  };

  const handleEliminar = (idx: number) => {
    if (formularios.length === 1) return;
    setFormularios(formularios.filter((_, i) => i !== idx));
  };

  // Función para manejar la descarga de la plantilla
  const handleDescargarPlantilla = async () => {
    try {
      // Por ahora descargamos un archivo temporal mientras llega la plantilla oficial
      const response = await fetch('/plantilla-viaticos-temporal.txt');
      
      if (!response.ok) {
        setMensajeGlobal('La plantilla estará disponible próximamente. Por favor contacta al administrador.');
        setExito(false);
        return;
      }

      // Si existe, proceder con la descarga
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Instrucciones_Viaticos_Temporal.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Mensaje de éxito
      setMensajeGlobal('¡Instrucciones descargadas! La plantilla oficial de Word estará disponible próximamente.');
      setExito(true);
      
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      setMensajeGlobal('Error al descargar las instrucciones. Intenta nuevamente.');
      setExito(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg px-8 py-6 mt-6 border border-blue-100">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Nuevo Viático</h1>
            <p className="text-blue-600">Completa los campos necesarios para crear tu viático</p>
          </div>

          {/* Sección de Descarga de Plantilla - PROMINENTE */}
          <div className="mb-8 relative">
            {/* Fondo con gradiente y bordes llamativos */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-2xl border-4 border-blue-300 transform hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
              {/* Efectos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              {/* Contenido principal */}
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-white/20 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
                      <FaFileWord className="text-4xl text-white drop-shadow-lg" />
                    </div>
                    <div className="text-center lg:text-left">
                      <h3 className="text-2xl font-bold mb-3 flex items-center justify-center lg:justify-start gap-2">
                        <FaClipboardList className="text-yellow-200" /> 
                        <span className="bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent">Formato Recomendado</span>
                      </h3>
                      <p className="text-blue-50 text-base lg:text-lg leading-relaxed font-medium">
                        <strong className="text-white">Usa el formato recomendado para solicitar tus viáticos</strong>, 
                        si aún no lo tienes, <strong className="text-yellow-200">¡descarga las instrucciones aquí!</strong>
                        <br />
                        <small className="text-blue-200">*Plantilla oficial de Word próximamente</small>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleDescargarPlantilla}
                      className="group bg-white text-blue-700 font-bold py-4 px-8 rounded-2xl shadow-xl hover:bg-yellow-50 hover:text-blue-800 transform hover:scale-110 hover:-rotate-1 transition-all duration-300 flex items-center gap-3 text-xl border-4 border-white/20 hover:border-yellow-200"
                    >
                      <FaDownload className="text-2xl group-hover:animate-bounce" />
                      <span>Descargar Guía</span>
                    </button>
                  </div>
                </div>
                
                {/* Mensaje importante con animación */}
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center bg-yellow-400/20 border-2 border-yellow-300/30 rounded-full px-6 py-3 text-base backdrop-blur-sm">
                    <FaBolt className="animate-pulse mr-3 text-xl text-yellow-200" />
                    <span className="font-bold text-yellow-100">¡IMPORTANTE!</span>
                    <span className="ml-2 text-blue-100">Usa esta plantilla para agilizar tu solicitud y evitar rechazos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {mensajeGlobal && (
            <div
              id={exito ? 'mensaje-global-exito' : undefined}
              className={`fixed left-1/2 top-24 z-[9999] -translate-x-1/2 mb-4 flex items-center justify-center gap-3 text-center font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl drop-shadow-2xl border-2 transition-all duration-300
                ${exito ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}
                ${exito ? 'animate-bounce-in' : ''}
              `}
              style={{ minWidth: 320, maxWidth: 600 }}
            >
              {exito ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" /></svg>
              )}
              <span>{mensajeGlobal}</span>
            </div>
          )}
          <form onSubmit={handleSubmitTodos}>
            {formularios.map((f, idx) => (
              <div
                key={idx}
                className="relative mb-4 sm:mb-6 border border-blue-200 bg-blue-50/30 rounded-xl p-4 sm:p-6"
              >
                {/* Identificador simple */}
                <div className="absolute -top-3 left-4 bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Viático {idx + 1}
                </div>
                {formularios.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar este formulario"
                    onClick={() => handleEliminar(idx)}
                    className="text-red-600 absolute top-2 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <FaTrash className="w-3 h-3" /> Eliminar
                  </button>
                )}
                
                {/* Campos organizados en grid simple */}
                <div className="mt-4 space-y-4">
                  {/* Primera fila: Datos bancarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Tipo de Cuenta *</label>
                      <select name="tipo_cuenta_destino" onChange={e => {
                        const nuevos = [...formularios];
                        nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value, cuenta_destino: '', tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined };
                        nuevos[idx].errors = {};
                        setFormularios(nuevos);
                      }} required className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="clabe">CLABE</option>
                        <option value="tarjeta">Número de Tarjeta</option>
                      </select>
                      {formularios[idx].errors?.tipo_cuenta_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.tipo_cuenta_destino}</span>)}
                    </div>
                    
                    {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-blue-900 font-medium text-sm">Tipo de Tarjeta *</label>
                        <select name="tipo_tarjeta" onChange={e => handleChange(idx, e)} className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="" required>
                          <option value="" disabled>Tipo de tarjeta</option>
                          <option value="debito">DÉBITO</option>
                          <option value="credito">CRÉDITO</option>
                        </select>
                        {formularios[idx].errors?.tipo_tarjeta && (<span className="text-red-600 text-xs">{formularios[idx].errors.tipo_tarjeta}</span>)}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Cuenta Destino *</label>
                      <input 
                        name="cuenta_destino" 
                        placeholder={formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? 'Número de tarjeta' : 'Número de cuenta CLABE'} 
                        value={formularios[idx].form.cuenta_destino || ''} 
                        pattern={
                          formularios[idx].form.tipo_cuenta_destino === 'clabe' ? '[0-9]{18}' : 
                          formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? '[0-9]{1,16}' : 
                          undefined
                        }
                        maxLength={
                          formularios[idx].form.tipo_cuenta_destino === 'clabe' ? 18 : 
                          formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? 16 : 
                          undefined
                        }
                        onChange={e => {
                        const value = e.target.value;
                        const nuevos = [...formularios];
                        nuevos[idx].form = { ...nuevos[idx].form, cuenta_destino: value };
                        
                        // Validar en tiempo real según el tipo de cuenta
                        if (!value) {
                          nuevos[idx].errors = { ...nuevos[idx].errors, cuenta_destino: 'Campo requerido' };
                        } else {
                          const errorsObj = { ...(nuevos[idx].errors || {}) };
                          
                          // Validar dígitos según el tipo
                          if (formularios[idx].form.tipo_cuenta_destino === 'clabe') {
                            const clabePattern = /^\d{18}$/;
                            if (!clabePattern.test(value) && value.length <= 18) {
                              delete errorsObj.cuenta_destino;
                            } else if (!clabePattern.test(value) && value.length > 18) {
                              errorsObj.cuenta_destino = 'La CLABE debe tener exactamente 18 dígitos';
                            }
                          } else if (formularios[idx].form.tipo_cuenta_destino === 'tarjeta') {
                            const tarjetaPattern = /^\d{1,16}$/;
                            if (!tarjetaPattern.test(value)) {
                              errorsObj.cuenta_destino = 'El número de tarjeta debe tener máximo 16 dígitos';
                            } else {
                              delete errorsObj.cuenta_destino;
                            }
                          } else {
                            delete errorsObj.cuenta_destino;
                          }
                          
                          nuevos[idx].errors = errorsObj;
                        }
                        setFormularios(nuevos);
                      }} required className={`text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 font-mono ${formularios[idx].errors?.cuenta_destino ? 'border-red-400' : ''}`} />
                      
                      {/* Texto de ayuda para requisitos de dígitos */}
                      {formularios[idx].form.tipo_cuenta_destino && (
                        <div className="mt-1">
                          {formularios[idx].form.tipo_cuenta_destino === 'clabe' && (
                            <p className="text-blue-600 text-xs flex items-center">
                              <span className="mr-1">💡</span>
                              La CLABE debe tener exactamente 18 dígitos
                            </p>
                          )}
                          {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                            <p className="text-blue-600 text-xs flex items-center">
                              <span className="mr-1">💳</span>
                              El número de tarjeta debe tener máximo 16 dígitos
                            </p>
                          )}
                        </div>
                      )}
                      
                      {formularios[idx].errors?.cuenta_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.cuenta_destino}</span>)}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Banco Destino *</label>
                      <select name="banco_destino" value={formularios[idx].form.banco_destino || ''} onChange={e => handleChange(idx, e)} required className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400">
                        <option value="" disabled>Selecciona banco</option>
                        {bancoOptions.map(banco => (
                          <option key={banco} value={banco}>{banco}</option>
                        ))}
                      </select>
                      {formularios[idx].errors?.banco_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.banco_destino}</span>)}
                    </div>
                  </div>
                  
                  {/* Cuenta adicional (opcional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex flex-col gap-1">
                      <label className="text-green-800 font-medium text-sm">No. De Cuenta  (opcional)</label>
                      <input 
                        name="cuenta" 
                        placeholder="No. De Cuenta" 
                        value={formularios[idx].form.cuenta || ''} 
                        onChange={e => handleChange(idx, e)} 
                        className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-400" 
                      />
                    </div>
                    
                    {formularios[idx].form.cuenta && formularios[idx].form.cuenta.trim() !== '' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-green-800 font-medium text-sm">Banco de la Cuenta *</label>
                        <select 
                          name="banco_cuenta" 
                          value={formularios[idx].form.banco_cuenta || ''} 
                          onChange={e => handleChange(idx, e)} 
                          required
                          className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-400" 
                        >
                          <option value="" disabled>Selecciona banco</option>
                          {bancoOptions.map(banco => (
                            <option key={banco} value={banco}>{banco}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Segunda fila: Datos del pago */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Monto *</label>
                      <input name="monto" placeholder="0.00" type="number" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Departamento *</label>
                      <select name="departamento" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
                        <option value="" disabled>Selecciona departamento</option>
                        <option value="contabilidad">CONTABILIDAD</option>
                        <option value="facturacion">FACTURACIÓN</option>
                        <option value="cobranza">COBRANZA</option>
                        <option value="vinculacion">VINCULACIÓN</option>
                        <option value="administracion">ADMINISTRACIÓN</option>
                        <option value="ti">TI</option>
                        <option value="automatizaciones">AUTOMATIZACIONES</option>
                        <option value="comercial">COMERCIAL</option>
                        <option value="atencion a clientes">ATENCIÓN A CLIENTES</option>
                        <option value="tesoreria">TESORERÍA</option>
                        <option value="nomina">NÓMINA</option>
                        <option value="atraccion de talento">ATRACCIÓN DE TALENTO</option>
                        <option value="direccion general">DIRECCIÓN GENERAL</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Fecha Límite *</label>
                      <input
                        name="fecha_limite_pago"
                        type="date"
                        min={getTodayDate()}
                        onChange={e => handleChange(idx, e)}
                        required
                        className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400"
                        onFocus={e => e.target.showPicker && e.target.showPicker()}
                      />
                    </div>
                  </div>
                  
                  {/* Tercera fila: Beneficiario y descripción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Nombre del Beneficiario *</label>
                      <input name="nombre_persona" placeholder="Nombre completo" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Descripción del viático (opcional)</label>
                      <input name="tipo_pago_descripcion" placeholder="Descripción del uso o destino del viático" onChange={e => handleChange(idx, e)} className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  
                  {/* Archivo */}
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-medium text-sm">Archivo Comprobante *</label>
                    <input type="file" name="viatico_url" onChange={e => handleFile(idx, e)} required className="file-input file-input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 text-blue-900 bg-white" />
                  </div>
                  
                  {/* Concepto fijo */}
                  <input name="concepto" value="Pago a terceros" readOnly hidden />
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                  {f.mensaje && <div className="text-center text-red-800 font-medium mt-3 p-2 bg-red-50 rounded-lg">{f.mensaje}</div>}
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                </div>
              </div>
            ))}
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-blue-200">
              <button
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg border border-blue-600 text-blue-700 font-medium hover:bg-blue-50 transition-colors text-sm sm:text-base"
                onClick={handleAgregarOtro}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Otro Viático
              </button>
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  onClick={() => router.push('/dashboard/solicitante/mis-viaticos')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors ${enviando ? 'opacity-60 pointer-events-none' : ''}`}
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Crear Todos los Viáticos
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
