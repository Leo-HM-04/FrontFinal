"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViaticosService } from '@/services/viaticos.service';
import { FaTrash } from 'react-icons/fa';

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

      // Validar cuenta según el tipo
      if (f.form.tipo_cuenta_destino === 'clabe') {
        if (!f.form.cuenta_destino || f.form.cuenta_destino.length !== 18) {
          errors.cuenta_destino = 'La CLABE debe tener 18 dígitos';
          huboError = true;
        }
      } else if (f.form.tipo_cuenta_destino === 'tarjeta') {
        if (!f.form.tipo_tarjeta) {
          errors.tipo_tarjeta = 'Selecciona el tipo de tarjeta';
          huboError = true;
        }
        if (!f.form.cuenta_destino || f.form.cuenta_destino.length !== 16) {
          errors.cuenta_destino = 'El número de tarjeta debe tener 16 dígitos';
          huboError = true;
        }
      }

      nuevos[idx].errors = errors;
    });

    if (huboError) {
      setFormularios(nuevos);
      setMensajeGlobal('Por favor corrige los errores antes de continuar.');
      setExito(false);
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
            fecha_limite_pago: f.form.fecha_limite_pago || new Date().toISOString().split('T')[0],
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
      setTimeout(() => {
        router.push('/dashboard/solicitante/mis-viaticos');
      }, 1800);
    } else {
      setMensajeGlobal('Hubo errores al crear algunos viáticos. Revisa los mensajes.');
      setExito(false);
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
        <div className="max-w-7xl mx-auto bg-white/90 rounded-2xl shadow-lg px-24 py-10 mt-8">
          <h1 className="text-3xl font-extrabold text-blue-800 mb-8 tracking-tight">Nuevo Viático</h1>
          {mensajeGlobal && (
            <div className={`mb-6 text-center font-bold text-lg ${exito ? 'text-green-700' : 'text-red-700'}`}>{mensajeGlobal}</div>
          )}
          <form onSubmit={handleSubmitTodos}>
            {formularios.map((f, idx) => (
              <div
                key={idx}
                className="relative grid grid-cols-1 md:grid-cols-3 gap-x-14 gap-y-4 mb-10 border border-blue-200 bg-white/80 rounded-xl shadow-sm px-4 pt-8 pb-6"
              >
                {/* Identificador del formulario */}
                <div className="absolute -top-5 left-4 bg-blue-700 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md select-none">Viático {idx + 1}</div>
                {formularios.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar este formulario"
                    onClick={() => handleEliminar(idx)}
                    className="absolute top-2 right-4 z-10 flex items-center gap-1 px-3 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-xs shadow transition"
                  >
                    <FaTrash className="w-3 h-3" /> Eliminar
                  </button>
                )}
                {/* 1. Tipo de cuenta y datos bancarios */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Tipo de Cuenta Destino *</label>
                  <select
                    name="tipo_cuenta_destino"
                    onChange={e => {
                      const nuevos = [...formularios];
                      nuevos[idx].form = { 
                        ...nuevos[idx].form, 
                        [e.target.name]: e.target.value,
                        cuenta_destino: '', // Reset cuenta_destino when type changes
                        tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined // Reset tipo_tarjeta
                      };
                      nuevos[idx].errors = {}; // Clear previous errors
                      setFormularios(nuevos);
                    }}
                    required
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
                    <option value="" disabled>Tipo de pago</option>
                    <option value="clabe">CLABE</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                  {formularios[idx].errors?.tipo_cuenta_destino && (
                    <span className="text-red-500 text-sm">{formularios[idx].errors.tipo_cuenta_destino}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">
                    Cuenta destino
                    {formularios[idx].form.tipo_cuenta_destino === 'clabe' && ' (18 dígitos)'}
                    {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && ' (16 dígitos)'}
                  </label>
                  <input 
                    name="cuenta_destino" 
                    placeholder={
                      formularios[idx].form.tipo_cuenta_destino === 'clabe' ? "CLABE (18 dígitos)" :
                      formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? "Número de tarjeta (16 dígitos)" :
                      "Cuenta destino"
                    }
                    value={formularios[idx].form.cuenta_destino || ''}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, ''); // Solo permite dígitos
                      const nuevos = [...formularios];
                      nuevos[idx].form = { ...nuevos[idx].form, cuenta_destino: value };
                      
                      // Validaciones específicas
                      if (nuevos[idx].form.tipo_cuenta_destino === 'clabe') {
                        if (value.length > 0 && value.length !== 18) {
                          nuevos[idx].errors = { ...nuevos[idx].errors, cuenta_destino: 'La CLABE debe tener 18 dígitos' };
                        } else {
                          const { cuenta_destino: _, ...otherErrors } = nuevos[idx].errors || {};
                          nuevos[idx].errors = otherErrors;
                        }
                      } else if (nuevos[idx].form.tipo_cuenta_destino === 'tarjeta') {
                        if (value.length > 0 && value.length !== 16) {
                          nuevos[idx].errors = { ...nuevos[idx].errors, cuenta_destino: 'El número de tarjeta debe tener 16 dígitos' };
                        } else {
                          const { cuenta_destino: _, ...otherErrors } = nuevos[idx].errors || {};
                          nuevos[idx].errors = otherErrors;
                        }
                      }
                      
                      setFormularios(nuevos);
                    }}
                    maxLength={formularios[idx].form.tipo_cuenta_destino === 'clabe' ? 18 : 
                             formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? 16 : undefined}
                    required 
                    className={`input input-bordered ${formularios[idx].errors?.cuenta_destino ? 'border-red-500' : ''}`}
                  />
                  {formularios[idx].errors?.cuenta_destino && (
                    <span className="text-red-500 text-sm">{formularios[idx].errors.cuenta_destino}</span>
                  )}
                </div>

                {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-900 font-medium">Tipo de tarjeta</label>
                    <select
                      name="tipo_tarjeta"
                      onChange={e => handleChange(idx, e)}
                      className="input input-bordered text-black uppercase"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                      <option value="debito">DÉBITO</option>
                      <option value="credito">CRÉDITO</option>
                    </select>
                    {formularios[idx].errors?.tipo_tarjeta && (
                      <span className="text-red-500 text-sm">{formularios[idx].errors.tipo_tarjeta}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Banco destino</label>
                  <select
                    name="banco_destino"
                    onChange={e => handleChange(idx, e)}
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
                    <option value="" className="text-black">Selecciona banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco} className="text-black">{banco}</option>
                      ))}
                  </select>
                </div>

                {/* 2. Monto */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Monto</label>
                  <input name="monto" placeholder="Monto" type="number" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>

                {/* 3. Departamento */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Departamento</label>
                  <select
                    name="departamento"
                    onChange={e => handleChange(idx, e)}
                    required
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
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
                  </select>
                </div>

                {/* 4. Fecha límite de pago */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Fecha límite de pago</label>
                  <input name="fecha_limite_pago" type="date" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>

                {/* 5. Concepto */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Concepto</label>
                  <input name="concepto" placeholder="Concepto" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>

                {/* Nuevos campos */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Tipo de Pago (Descripción)</label>
                  <input 
                    name="tipo_pago_descripcion" 
                    placeholder="Descripción del tipo de pago" 
                    onChange={e => handleChange(idx, e)} 
                    className="input input-bordered" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Empresa a Pagar</label>
                  <input 
                    name="empresa_a_pagar" 
                    placeholder="Nombre de la empresa" 
                    onChange={e => handleChange(idx, e)} 
                    className="input input-bordered" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Nombre de la Persona *</label>
                  <input 
                    name="nombre_persona" 
                    placeholder="Nombre completo" 
                    onChange={e => handleChange(idx, e)} 
                    required
                    className="input input-bordered" 
                  />
                </div>

                {/* 6. Archivo comprobante */}
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-blue-900 font-medium">Archivo comprobante</label>
                  <input type="file" name="viatico_url" onChange={e => handleFile(idx, e)} required className="file-input file-input-bordered" />
                </div>
                {f.mensaje && <div className="md:col-span-3 text-center text-blue-800 font-medium mt-2">{f.mensaje}</div>}
                <input name="tipo_pago" value="viaticos" readOnly hidden />
              </div>
            ))}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
              <button
                type="button"
                className="btn btn-outline px-6 py-2 rounded-lg border-blue-700 text-blue-700 font-semibold hover:bg-blue-50 hover:border-blue-800 transition"
                onClick={handleAgregarOtro}
              >
                Agregar otro
              </button>
              <button
                type="submit"
                className="btn btn-primary px-8 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
              >
                Crear todos
              </button>
            </div>
          </form>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
