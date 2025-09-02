"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViaticosService } from '@/services/viaticos.service';
import { FaTrash } from 'react-icons/fa';
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
    }
  };

  const handleAgregarOtro = () => {
    setFormularios([...formularios, { form: {}, file: null, mensaje: '', errors: {} }]);
  };

  const handleEliminar = (idx: number) => {
    if (formularios.length === 1) return;
    setFormularios(formularios.filter((_, i) => i !== idx));
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-screen-2xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl shadow-2xl px-12 py-8 mt-8 border border-blue-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-5xl font-extrabold text-blue-900 mb-2 tracking-tight drop-shadow-sm">Nuevo Viático</h1>
            <p className="text-blue-700 text-lg font-medium">Crea uno o múltiples viáticos de forma rápida y sencilla</p>
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
                className="relative mb-8 border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl shadow-xl px-8 pt-6 pb-6 hover:shadow-2xl transition-all duration-300"
              >
                {/* Identificador del formulario mejorado */}
                <div className="absolute -top-5 left-8 bg-gradient-to-r from-blue-700 to-blue-600 text-white text-lg font-bold px-6 py-2 rounded-full shadow-xl border-2 border-white">
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Viático {idx + 1}
                  </span>
                </div>
                {formularios.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar este formulario"
                    onClick={() => handleEliminar(idx)}
                    className="text-red-600 absolute top-4 right-6 z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FaTrash className="w-4 h-4" /> Eliminar
                  </button>
                )}
                
                {/* Título de sección mejorado */}
                <div className="mt-4 mb-6">
                  <h3 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    Datos Bancarios
                  </h3>
                  <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  {/* ORDEN: 1. Datos bancarios, 2. Tipo de tarjeta (si aplica), 3. Cuenta destino, 4. Banco */}
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tipo de Cuenta *
                    </label>
                    <select name="tipo_cuenta_destino" onChange={e => {
                      const nuevos = [...formularios];
                      nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value, cuenta_destino: '', tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined };
                      nuevos[idx].errors = {};
                      setFormularios(nuevos);
                    }} required className="input input-bordered text-black uppercase text-lg px-4 py-3 rounded-xl border-2 border-blue-300 focus:ring-4 focus:ring-blue-400/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all" defaultValue="">
                      <option value="" disabled>Selecciona una opción</option>
                      <option value="clabe">CLABE</option>
                      <option value="tarjeta">Número de Tarjeta</option>
                    </select>
                    {formularios[idx].errors?.tipo_cuenta_destino && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.tipo_cuenta_destino}</span>)}
                  </div>
                  {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-blue-900 font-bold text-lg flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Tipo de Tarjeta *
                      </label>
                      <select name="tipo_tarjeta" onChange={e => handleChange(idx, e)} className="input input-bordered text-black uppercase text-lg px-4 py-3 rounded-xl border-2 border-blue-300 focus:ring-4 focus:ring-blue-400/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all" defaultValue="" required>
                        <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                        <option value="debito">DÉBITO</option>
                        <option value="credito">CRÉDITO</option>
                      </select>
                      {formularios[idx].errors?.tipo_tarjeta && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.tipo_tarjeta}</span>)}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cuenta Destino *
                    </label>
                    <input name="cuenta_destino" placeholder="Número de cuenta, tarjeta o CLABE" value={formularios[idx].form.cuenta_destino || ''} onChange={e => {
                      const value = e.target.value;
                      const nuevos = [...formularios];
                      nuevos[idx].form = { ...nuevos[idx].form, cuenta_destino: value };
                      // Solo validar si está vacío
                      if (!value) {
                        nuevos[idx].errors = { ...nuevos[idx].errors, cuenta_destino: 'La cuenta destino es requerida' };
                      } else {
                        const errorsObj = { ...(nuevos[idx].errors || {}) };
                        delete errorsObj.cuenta_destino;
                        nuevos[idx].errors = errorsObj;
                      }
                      setFormularios(nuevos);
                    }} required className={`text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-blue-300 focus:ring-4 focus:ring-blue-400/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all ${formularios[idx].errors?.cuenta_destino ? 'border-red-400 focus:border-red-500' : ''}`} />
                    {formularios[idx].errors?.cuenta_destino && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.cuenta_destino}</span>)}
                  </div>
                  {/* Selección de banco */}
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Banco Destino *
                    </label>
                    <select name="banco_destino" value={formularios[idx].form.banco_destino || ''} onChange={e => handleChange(idx, e)} required className="input input-bordered text-black uppercase text-lg px-4 py-3 rounded-xl border-2 border-blue-300 focus:ring-4 focus:ring-blue-400/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all">
                      <option value="" disabled>Selecciona un banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco}>{banco}</option>
                      ))}
                    </select>
                    {formularios[idx].errors?.banco_destino && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.banco_destino}</span>)}
                  </div>
                </div>

                {/* Sección: Cuenta Adicional */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-green-800 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    Cuenta Adicional (Opcional)
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-green-600 to-green-400 rounded-full mb-6"></div>
                </div>
                
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-green-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cuenta Adicional
                    </label>
                    <input 
                      name="cuenta" 
                      placeholder="Ingresa número de cuenta adicional" 
                      value={formularios[idx].form.cuenta || ''} 
                      onChange={e => handleChange(idx, e)} 
                      className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-green-300 focus:ring-4 focus:ring-green-400/50 focus:border-green-500 shadow-sm hover:shadow-md transition-all" 
                    />
                    {formularios[idx].errors?.cuenta && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.cuenta}</span>)}
                  </div>
                  
                  {formularios[idx].form.cuenta && formularios[idx].form.cuenta.trim() !== '' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-green-900 font-bold text-lg flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Banco de la Cuenta *
                      </label>
                      <select 
                        name="banco_cuenta" 
                        value={formularios[idx].form.banco_cuenta || ''} 
                        onChange={e => handleChange(idx, e)} 
                        required
                        className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-green-300 focus:ring-4 focus:ring-green-400/50 focus:border-green-500 shadow-sm hover:shadow-md transition-all" 
                      >
                        <option value="" disabled>Selecciona un banco</option>
                        {bancoOptions.map(banco => (
                          <option key={banco} value={banco}>{banco}</option>
                        ))}
                      </select>
                      {formularios[idx].errors?.banco_cuenta && (<span className="text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">{formularios[idx].errors.banco_cuenta}</span>)}
                    </div>
                  )}
                </div>

                {/* Sección: Datos del Pago */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-purple-800 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    Información del Pago
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mb-6"></div>
                </div>
                
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-purple-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Monto *
                    </label>
                    <input name="monto" placeholder="Monto del viático" type="number" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-400/50 focus:border-purple-500 shadow-sm hover:shadow-md transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-purple-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Departamento *
                    </label>
                    <select name="departamento" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-400/50 focus:border-purple-500 shadow-sm hover:shadow-md transition-all" defaultValue="">
                      <option value="" disabled>SELECCIONA UN DEPARTAMENTO</option>
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
                  <div className="flex flex-col gap-2">
                    <label className="text-purple-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M3 21V11a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM8 15h8" />
                      </svg>
                      Fecha Límite de Pago *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        name="fecha_limite_pago"
                        type="date"
                        onChange={e => handleChange(idx, e)}
                        required
                        className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-purple-300 focus:ring-4 focus:ring-purple-400/50 focus:border-purple-500 shadow-sm hover:shadow-md transition-all pr-12"
                        onFocus={e => e.target.showPicker && e.target.showPicker()}
                        style={{ minWidth: 220 }}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 transition-colors"
                        onClick={e => {
                          const input = (e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement);
                          if (input && input.showPicker) input.showPicker();
                          input?.focus();
                        }}
                        aria-label="Abrir calendario"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="#f3e8ff"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 2v4M16 2v4M3 10h18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sección: Detalles Adicionales */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-indigo-800 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Detalles Adicionales
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full mb-6"></div>
                </div>
                
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-indigo-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Concepto
                    </label>
                    <input 
                      name="concepto" 
                      value="Pago a terceros" 
                      readOnly 
                      className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-gray-300 bg-gray-100 cursor-not-allowed shadow-sm" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-indigo-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Descripción del Viático
                    </label>
                    <input name="tipo_pago_descripcion" placeholder="Descripción del uso o destino del viático" onChange={e => handleChange(idx, e)} className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-indigo-300 focus:ring-4 focus:ring-indigo-400/50 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all" />
                  </div>
                </div>

                {/* Sección: Beneficiario */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-orange-800 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    Datos del Beneficiario
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full mb-6"></div>
                </div>
                
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 shadow-inner">
                  <div className="flex flex-col gap-2">
                    <label className="text-orange-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Nombre del Beneficiario *
                    </label>
                    <input name="nombre_persona" placeholder="Nombre completo de la persona que recibe directamente el pago" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-lg px-4 py-3 rounded-xl border-2 border-orange-300 focus:ring-4 focus:ring-orange-400/50 focus:border-orange-500 shadow-sm hover:shadow-md transition-all" />
                  </div>
                </div>

                {/* Sección: Archivo Comprobante */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-red-800 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    Archivo Comprobante
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-red-600 to-red-400 rounded-full mb-6"></div>
                </div>
                
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 shadow-inner">
                  <div className="flex flex-col gap-2">
                    <label className="text-red-900 font-bold text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Archivo Comprobante *
                    </label>
                    <input type="file" name="viatico_url" onChange={e => handleFile(idx, e)} required className="file-input file-input-bordered text-lg px-4 py-3 rounded-xl border-2 border-red-300 focus:ring-4 focus:ring-red-400/50 focus:border-red-500 text-red-900 bg-white placeholder-red-700 shadow-sm hover:shadow-md transition-all" />
                  </div>
                  {f.mensaje && <div className="text-center text-red-800 font-medium mt-3 p-2 bg-red-50 rounded-lg">{f.mensaje}</div>}
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                </div>
              </div>
            ))}
            
            {/* Botones de acción mejorados */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 pt-8 border-t-2 border-blue-200">
              <button
                type="button"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-blue-600 text-blue-700 text-lg font-bold hover:bg-blue-50 hover:border-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={handleAgregarOtro}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Otro Viático
              </button>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-gray-400 text-gray-700 text-lg font-bold hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => router.push('/dashboard/solicitante/mis-viaticos')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${enviando ? 'opacity-60 pointer-events-none animate-pulse' : ''}`}
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
