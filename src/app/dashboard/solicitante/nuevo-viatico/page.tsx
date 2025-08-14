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
  empresa_a_pagar?: string;
  nombre_persona: string;
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
            concepto: f.form.concepto || '',
            tipo_pago: 'viaticos',
            tipo_cuenta_destino: f.form.tipo_cuenta_destino || 'clabe',
            tipo_tarjeta: f.form.tipo_tarjeta || '',
            banco_destino: f.form.banco_destino || '',
            fecha_limite_pago: f.form.fecha_limite_pago || formatDateForAPI(getCurrentUTC6Date()),
            viatico_url: f.file || undefined,
            tipo_pago_descripcion: f.form.tipo_pago_descripcion || '',
            empresa_a_pagar: f.form.empresa_a_pagar || '',
            nombre_persona: f.form.nombre_persona || '',
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
        <div className="max-w-screen-2xl mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-2xl shadow-xl px-10 py-4 mt-8">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight text-center drop-shadow">Nuevo Viático</h1>
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
                className="relative mb-4 border border-blue-200 bg-white/95 rounded-xl shadow-lg px-6 pt-2 pb-2"
              >
                {/* Identificador del formulario */}
                <div className="absolute -top-4 left-6 bg-blue-700 text-white text-base font-bold px-4 py-1 rounded-full shadow-lg select-none">Viático {idx + 1}</div>
                {formularios.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar este formulario"
                    onClick={() => handleEliminar(idx)}
                    className="text-red-700 absolute top-3 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 font-semibold text-sm shadow transition"
                  >
                    <FaTrash className="w-4 h-4" /> Eliminar
                  </button>
                )}
                {/* Bloque: Datos bancarios */}
                <div className="mb-1 p-2 rounded-xl bg-blue-50/60 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                  {/* ORDEN: 1. Tipo de cuenta, 2. Tipo de tarjeta (si aplica), 3. Cuenta destino, 4. Banco */}
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Tipo de Cuenta Destino *</label>
                    <select name="tipo_cuenta_destino" onChange={e => {
                      const nuevos = [...formularios];
                      nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value, cuenta_destino: '', tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined };
                      nuevos[idx].errors = {};
                      setFormularios(nuevos);
                    }} required className="input input-bordered text-black uppercase text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
                      <option value="" disabled>Tipo de pago</option>
                      <option value="clabe">CLABE</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="cuenta">CUENTA</option>
                    </select>
                    {formularios[idx].errors?.tipo_cuenta_destino && (<span className="text-red-500 text-sm">{formularios[idx].errors.tipo_cuenta_destino}</span>)}
                  </div>
                  {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-bold text-base">Tipo de Tarjeta *</label>
                      <select name="tipo_tarjeta" onChange={e => handleChange(idx, e)} className="input input-bordered text-black uppercase text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="" required>
                        <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                        <option value="debito">DÉBITO</option>
                        <option value="credito">CRÉDITO</option>
                      </select>
                      {formularios[idx].errors?.tipo_tarjeta && (<span className="text-red-500 text-sm">{formularios[idx].errors.tipo_tarjeta}</span>)}
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Cuenta destino</label>
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
                    }} required className={`text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400 ${formularios[idx].errors?.cuenta_destino ? 'border-red-500' : ''}`} />
                    {formularios[idx].errors?.cuenta_destino && (<span className="text-red-500 text-sm">{formularios[idx].errors.cuenta_destino}</span>)}
                  </div>
                  {/* Selección de banco */}
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Banco Destino *</label>
                    <select name="banco_destino" value={formularios[idx].form.banco_destino || ''} onChange={e => handleChange(idx, e)} required className="input input-bordered text-black uppercase text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400">
                      <option value="" disabled>Selecciona un banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco}>{banco}</option>
                      ))}
                    </select>
                    {formularios[idx].errors?.banco_destino && (<span className="text-red-500 text-sm">{formularios[idx].errors.banco_destino}</span>)}
                  </div>
                </div>

                {/* Bloque: Datos del pago */}
                <div className="mb-1 p-2 rounded-xl bg-blue-50/60 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Monto</label>
                    <input name="monto" placeholder="Monto" type="number" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Departamento</label>
                    <select name="departamento" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
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
                      <option value="nomina">ATRACCIÓN DE TALENTO</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Fecha límite de pago</label>
                    <input name="fecha_limite_pago" type="date" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Concepto</label>
                    <input name="concepto" placeholder="Concepto" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Descripción del Pago</label>
                    <input name="tipo_pago_descripcion" placeholder="Descripción del tipo de pago" onChange={e => handleChange(idx, e)} className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                {/* Bloque: Persona y empresa */}
                <div className="mb-1 p-2 rounded-xl bg-blue-50/60 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Empresa a Pagar</label>
                    <input name="empresa_a_pagar" placeholder="Nombre de la empresa" onChange={e => handleChange(idx, e)} className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Nombre de la Persona dirigida*</label>
                    <input name="nombre_persona" placeholder="Nombre completo" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>

                {/* Bloque: Archivo comprobante */}
                <div className="mb-1 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-bold text-base">Archivo comprobante</label>
                    <input type="file" name="viatico_url" onChange={e => handleFile(idx, e)} required className="file-input file-input-bordered text-base px-3 py-2 rounded-lg border-2 border-blue-200 focus:ring-2 focus:ring-blue-400 text-blue-900 bg-white placeholder-blue-700" />
                  </div>
                  {f.mensaje && <div className="text-center text-blue-800 font-medium mt-2">{f.mensaje}</div>}
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                </div>
              </div>
            ))}
            <div className="flex flex-row justify-between items-center gap-2 mt-2">
              <button
                type="button"
                className="btn btn-outline px-4 py-1 rounded-lg border-blue-700 text-blue-700 text-base font-bold hover:bg-blue-100 hover:border-blue-800 transition shadow"
                onClick={handleAgregarOtro}
              >
                + Agregar otro
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline px-6 py-1 rounded-lg border-gray-400 text-gray-700 text-base font-bold hover:bg-gray-100 hover:border-gray-600 transition shadow"
                  onClick={() => router.push('/dashboard/solicitante/mis-viaticos')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary px-6 py-1 rounded-lg bg-blue-700 text-white text-base font-bold hover:bg-blue-800 transition shadow ${enviando ? 'opacity-60 pointer-events-none' : ''}`}
                  disabled={enviando}
                >
                  {enviando ? 'Creando...' : 'Crear todos'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
