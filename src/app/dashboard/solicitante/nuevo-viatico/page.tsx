
"use client";
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViaticosService } from '@/services/viaticos.service';
import { FaTrash } from 'react-icons/fa';

export default function NuevoViaticoPage() {
  type FormState = {
    form: any;
    file: File | null;
    mensaje: string;
  };
  const [formularios, setFormularios] = useState<FormState[]>([
    { form: {}, file: null, mensaje: '' }
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

  const handleSubmitTodos = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos = [...formularios];
    let huboError = false;
    await Promise.all(
      nuevos.map(async (f, idx) => {
        if (!f.file) {
          nuevos[idx].mensaje = 'Adjunta un archivo';
          huboError = true;
          return;
        }
        try {
          const id_usuario = localStorage.getItem('id_usuario');
          const { viatico_url, ...formSinArchivo } = f.form;
          const data = {
            ...formSinArchivo,
            id_usuario: id_usuario || undefined,
            tipo_pago: 'viaticos',
          };
          await ViaticosService.createWithFile({ ...data, viatico_url: f.file });
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
    setFormularios([...formularios, { form: {}, file: null, mensaje: '' }]);
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
                {/* 1. Departamento y Concepto */}
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
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Concepto</label>
                  <input name="concepto" placeholder="Concepto" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>
                {/* 2. Monto y Fecha límite de pago */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Monto</label>
                  <input name="monto" placeholder="Monto" type="number" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Fecha límite de pago</label>
                  <input name="fecha_limite_pago" type="date" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>
                {/* 3. Datos bancarios */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Cuenta destino</label>
                  <input name="cuenta_destino" placeholder="Cuenta destino" onChange={e => handleChange(idx, e)} required className="input input-bordered" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Tipo de cuenta</label>
                  <select
                    name="tipo_cuenta_destino"
                    onChange={e => handleChange(idx, e)}
                    required
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
                    <option value="" disabled>SELECCIONA TIPO DE CUENTA</option>
                    <option value="debito">DÉBITO</option>
                    <option value="credito">CRÉDITO</option>
                    <option value="nomina">NÓMINA</option>
                    <option value="cheques">CHEQUES</option>
                    <option value="ahorro">AHORRO</option>
                    <option value="inversion">INVERSIÓN</option>
                    <option value="vale">VALE</option>
                    <option value="otra">OTRA</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Tipo de tarjeta</label>
                  <select
                    name="tipo_tarjeta"
                    onChange={e => handleChange(idx, e)}
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
                    <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                    <option value="debito">DÉBITO</option>
                    <option value="credito">CRÉDITO</option>
                    <option value="nomina">NÓMINA</option>
                    <option value="vale">VALE</option>
                    <option value="otra">OTRA</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900 font-medium">Banco destino</label>
                  <select
                    name="banco_destino"
                    className="input input-bordered text-black uppercase"
                    defaultValue=""
                  >
                    <option value="" disabled>SELECCIONA BANCO</option>
                    <option value="bbva">BBVA</option>
                    <option value="banamex">BANAMEX</option>
                    <option value="santander">SANTANDER</option>
                    <option value="banorte">BANORTE</option>
                    <option value="hsbc">HSBC</option>
                    <option value="scotiabank">SCOTIABANK</option>
                    <option value="inbursa">INBURSA</option>
                    <option value="banco azteca">BANCO AZTECA</option>
                    <option value="banregio">BANREGIO</option>
                    <option value="bancoppel">BANCOPPEL</option>
                    <option value="afirme">AFIRME</option>
                    <option value="ci banco">CI BANCO</option>
                    <option value="bajio">BANCO DEL BAJÍO</option>
                    <option value="otro">OTRO</option>
                  </select>
                </div>
                {/* 4. Archivo comprobante */}
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
