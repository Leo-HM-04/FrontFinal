"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ViaticosService } from "@/services/viaticos.service";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SolicitanteLayout } from "@/components/layout/SolicitanteLayout";
import type { Viatico as BaseViatico } from '@/services/viaticos.service';

type Viatico = BaseViatico & {
  // Identificadores
  id_viatico?: number;
  id?: number;
  folio?: string;

  // Información de estado
  estado?: string;
  fecha_creacion?: string;

  // Información bancaria
  tipo_cuenta_destino?: string;
  tipo_tarjeta?: string;
  banco_destino?: string;

  // Información de pago
  tipo_pago_descripcion?: string;

  // Información del beneficiario
  empresa_a_pagar?: string;
  nombre_persona: string;
};


function EditarViaticoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams ? searchParams.get("id") : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [viatico, setViatico] = useState<Viatico | null>(null);
  const [form, setForm] = useState<Partial<Viatico>>({});
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No se proporcionó ID de viático");
      setLoading(false);
      return;
    }
    const idNum = Number(id);
    ViaticosService.getById(idNum)
      .then((data: Viatico) => {
        setViatico(data);
        setForm({
          concepto: data.concepto,
          monto: data.monto,
          cuenta_destino: data.cuenta_destino,
          fecha_limite_pago: data.fecha_limite_pago?.slice(0, 10),
          departamento: data.departamento,
          tipo_cuenta_destino: data.tipo_cuenta_destino || '',
          tipo_tarjeta: data.tipo_tarjeta || '',
          banco_destino: data.banco_destino || '',
          tipo_pago_descripcion: data.tipo_pago_descripcion || '',
          empresa_a_pagar: data.empresa_a_pagar || '',
          nombre_persona: data.nombre_persona || '',
        });
        setError("");
      })
      .catch(() => setError("No se pudo cargar el viático"))
      .finally(() => setLoading(false));
  }, [id]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActualizando(true);

    // Validar solo campos requeridos, sin restricciones de longitud
    const newErrors: Record<string, string> = {};
    if (form.tipo_cuenta_destino === 'tarjeta' && !form.tipo_tarjeta) {
      newErrors.tipo_tarjeta = 'Selecciona el tipo de tarjeta';
    }
    if (!form.cuenta_destino) {
      newErrors.cuenta_destino = 'La cuenta destino es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMensaje("Por favor corrige los errores antes de continuar.");
      setActualizando(false);
      return;
    }

    try {
      // Ensure monto is a number before submitting
      const formData = {
        ...form,
        monto: typeof form.monto === 'string' ? Number(form.monto) : form.monto
      };
      await ViaticosService.update(Number(id), formData);
      setMensaje("Viático actualizado correctamente.");
      setTimeout(() => {
        const msg = document.getElementById('mensaje-global-exito');
        if (msg) msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => router.push("/dashboard/solicitante/mis-viaticos"), 900);
    } catch {
      setMensaje("Error al actualizar el viático.");
    } finally {
      setActualizando(false);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;
  if (!viatico) return <div className="p-8 text-red-600 font-bold">Viático no encontrado</div>;

  return (
    <ProtectedRoute requiredRoles={["solicitante"]}>
      <SolicitanteLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 p-1.5 shadow-sm">
                {/* Icono de edición */}
                <svg className="text-yellow-600 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z" />
                </svg>
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">Editar Viático</h1>
            </div>

            {mensaje && (
              <div
                id={mensaje.includes('actualizado') ? 'mensaje-global-exito' : undefined}
                className={`fixed left-1/2 top-24 z-[9999] -translate-x-1/2 mb-4 flex items-center justify-center gap-3 text-center font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl drop-shadow-2xl border-2 transition-all duration-300
                  ${mensaje.includes('actualizado') ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}
                  ${mensaje.includes('actualizado') ? 'animate-bounce-in' : ''}
                `}
                style={{ minWidth: 320, maxWidth: 600 }}
              >
                {mensaje.includes('actualizado') ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" /></svg>
                )}
                <span>{mensaje}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="bg-white rounded-lg p-6 border border-blue-200 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
                      Información Principal
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="departamento" className="block text-sm font-semibold text-blue-900 mb-1">
                          Departamento *
                        </label>
                        <select
                          name="departamento"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.departamento || ''}
                          onChange={e => setForm({ ...form, departamento: e.target.value as string })}
                          required
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

                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Concepto *</label>
                        <input
                          type="text"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.concepto || ''}
                          onChange={e => setForm({ ...form, concepto: e.target.value as string })}
                          placeholder="Descripción del viático..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-blue-900 mb-1">Monto *</label>
                          <input
                            type="number"
                            className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={form.monto || ''}
                            onChange={e => setForm({ ...form, monto: Number(e.target.value) })}
                            min={1}
                            step="0.01"
                            placeholder="Ingrese el monto..."
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-blue-900 mb-1">Fecha límite de pago *</label>
                          <input
                            type="date"
                            className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={form.fecha_limite_pago || ''}
                            onChange={e => setForm({ ...form, fecha_limite_pago: e.target.value as string })}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
                      Información del Beneficiario
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Nombre de la Persona dirigida *</label>
                        <input
                          type="text"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.nombre_persona || ''}
                          onChange={e => setForm({ ...form, nombre_persona: e.target.value })}
                          placeholder="Nombre completo..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Empresa a Pagar</label>
                        <input
                          type="text"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.empresa_a_pagar || ''}
                          onChange={e => setForm({ ...form, empresa_a_pagar: e.target.value })}
                          placeholder="Nombre de la empresa..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Tipo de Pago (Descripción)</label>
                        <input
                          type="text"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.tipo_pago_descripcion || ''}
                          onChange={e => setForm({ ...form, tipo_pago_descripcion: e.target.value })}
                          placeholder="Describe el tipo de pago..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
                      Información Bancaria
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Tipo de Cuenta Destino *</label>
                        <select
                          name="tipo_cuenta_destino"
                          className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={form.tipo_cuenta_destino || ''}
                          onChange={e => {
                            setForm({
                              ...form,
                              tipo_cuenta_destino: e.target.value as string,
                              cuenta_destino: '', // Reset cuenta_destino when type changes
                              tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined // Reset tipo_tarjeta
                            });
                            setErrors({}); // Limpiar errores cuando cambia el tipo de cuenta
                          }}
                          required
                        >
                          <option value="" disabled>SELECCIONA TIPO DE CUENTA</option>
                          <option value="clabe">CLABE</option>
                          <option value="tarjeta">TARJETA</option>
                        </select>
                      </div>

                      {/* Campos dependientes del tipo de cuenta */}
                      {form.tipo_cuenta_destino && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">
                              Cuenta Destino *
                              {form.tipo_cuenta_destino === 'clabe' && ' (18 dígitos)'}
                              {form.tipo_cuenta_destino === 'tarjeta' && ' (16 dígitos)'}
                            </label>
                            <input
                              type="text"
                              className={`w-full border rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                errors.cuenta_destino ? 'border-red-500' : 'border-blue-200'
                              }`}
                              value={form.cuenta_destino || ''}
                              onChange={e => {
                                const value = e.target.value.replace(/\D/g, ''); // Solo permite dígitos
                                const maxLength = form.tipo_cuenta_destino === 'clabe' ? 18 : 
                                               form.tipo_cuenta_destino === 'tarjeta' ? 16 : undefined;
                                if (!maxLength || value.length <= maxLength) {
                                  setForm({ ...form, cuenta_destino: value });
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.cuenta_destino;
                                    return newErrors;
                                  });
                                }
                              }}
                              placeholder={
                                form.tipo_cuenta_destino === 'clabe' ? "CLABE (18 dígitos)" :
                                form.tipo_cuenta_destino === 'tarjeta' ? "Número de tarjeta (16 dígitos)" :
                                "Cuenta destino"
                              }
                              maxLength={form.tipo_cuenta_destino === 'clabe' ? 18 : 
                                       form.tipo_cuenta_destino === 'tarjeta' ? 16 : undefined}
                              required
                            />
                            {errors.cuenta_destino && (
                              <span className="text-red-500 text-sm">{errors.cuenta_destino}</span>
                            )}
                          </div>

                          {form.tipo_cuenta_destino === 'tarjeta' && (
                            <div>
                              <label className="block text-sm font-semibold text-blue-900 mb-1">Tipo de tarjeta *</label>
                              <select
                                name="tipo_tarjeta"
                                className={`w-full border rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                  errors.tipo_tarjeta ? 'border-red-500' : 'border-blue-200'
                                }`}
                                value={form.tipo_tarjeta || ''}
                                onChange={e => {
                                  setForm({ ...form, tipo_tarjeta: e.target.value as string });
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.tipo_tarjeta;
                                    return newErrors;
                                  });
                                }}
                                required
                              >
                                <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                                <option value="debito">DÉBITO</option>
                                <option value="credito">CRÉDITO</option>
                              </select>
                              {errors.tipo_tarjeta && (
                                <span className="text-red-500 text-sm">{errors.tipo_tarjeta}</span>
                              )}
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Banco destino *</label>
                            <select
                              name="banco_destino"
                              className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={form.banco_destino || ''}
                              onChange={e => setForm({ ...form, banco_destino: e.target.value as string })}
                              required
                            >
                              <option value="" disabled>SELECCIONA BANCO</option>
                              {[
                                "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX",
                                "BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA",
                                "BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO",
                                "BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA",
                                "CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON",
                                "Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)",
                                "GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO",
                                "INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK",
                                "MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL",
                                "SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX",
                                "VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
                              ].map(banco => (
                                <option key={banco} value={banco}>{banco}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
                      Archivo Adjunto
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Archivo actual:</label>
                        {viatico.viatico_url ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <a
                                href={`${viatico.viatico_url.startsWith('/') ? '' : '/'}${viatico.viatico_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 underline break-all"
                              >
                                Ver archivo actual
                              </a>
                            </div>
                            <div className="border border-blue-200 rounded-lg bg-gray-50">
                              {/* Barra superior con información del archivo */}
                              <div className="px-4 py-2 border-b border-blue-200 flex items-center justify-between bg-blue-50">
                                <span className="text-sm font-medium text-blue-900">
                                  {viatico.viatico_url.toLowerCase().endsWith('.pdf') ? '📄 Documento PDF' : '🖼️ Imagen'}
                                </span>
                                <a
                                  href={`${viatico.viatico_url.startsWith('/') ? '' : '/'}${viatico.viatico_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <span>Abrir en nueva pestaña</span>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                              {/* Contenedor del visor con scroll si es necesario */}
                              <div className="p-3" style={{ height: '280px', overflow: 'auto' }}>
                                <div className="flex items-center justify-center h-full">
                                  {viatico.viatico_url.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                      src={`${viatico.viatico_url.startsWith('/') ? '' : '/'}${viatico.viatico_url}`}
                                      className="w-full h-full rounded border-0"
                                      title="Vista previa del PDF"
                                      style={{ minHeight: '260px' }}
                                    />
                                  ) : (
                                    <Image
                                      src={`${viatico.viatico_url.startsWith('/') ? '' : '/'}${viatico.viatico_url}`}
                                      alt="Vista previa del archivo"
                                      width={500}
                                      height={260}
                                      className="max-w-full h-auto max-h-[260px] rounded shadow-sm"
                                      style={{ objectFit: 'contain' }}
                                      unoptimized={viatico.viatico_url.includes('localhost')}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No hay archivo adjunto</span>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-1">Subir nuevo archivo (opcional):</label>
                        <input
                          type="file"
                          name="viatico_file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="block w-full text-sm text-blue-900 border border-blue-200 rounded-lg cursor-pointer bg-white focus:outline-none"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const formData = new FormData();
                              formData.append('departamento', String(form.departamento || ''));
                              formData.append('monto', String(form.monto || ''));
                              formData.append('cuenta_destino', String(form.cuenta_destino || ''));
                              formData.append('concepto', String(form.concepto || ''));
                              formData.append('tipo_pago', "viaticos");
                              formData.append('fecha_limite_pago', String(form.fecha_limite_pago || ''));
                              formData.append('tipo_cuenta_destino', String(form.tipo_cuenta_destino || ''));
                              formData.append('tipo_tarjeta', String(form.tipo_tarjeta || ''));
                              formData.append('banco_destino', String(form.banco_destino || ''));
                              formData.append('tipo_pago_descripcion', String(form.tipo_pago_descripcion || ''));
                              formData.append('empresa_a_pagar', String(form.empresa_a_pagar || ''));
                              formData.append('nombre_persona', String(form.nombre_persona || ''));
                              formData.append('viatico_file', file);
                              
                              console.log('Enviando actualización con archivo...');
                              const actualizado = await ViaticosService.updateWithFiles(
                                Number(viatico.id_viatico ?? viatico.id),
                                formData
                              );
                              console.log('Respuesta del servidor:', actualizado);
                              
                              // Actualizar el estado local con la respuesta del servidor
                              setViatico(actualizado);
                              setMensaje('Archivo actualizado correctamente.');
                            } catch (err) {
                              console.error('Error al subir archivo:', err);
                              // @ts-expect-error: Puede no tener response
                              setMensaje(err?.response?.data?.error || 'Error al subir el archivo.');
                            }
                          }}
                        />
                        <span className="text-xs text-gray-500">Formatos permitidos: PDF, PNG, JPG. Máx 10MB.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-blue-200">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 font-semibold hover:bg-gray-100 transition"
                  onClick={() => router.push("/dashboard/solicitante/mis-viaticos")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition ${actualizando ? 'opacity-60 pointer-events-none' : ''}`}
                  disabled={actualizando}
                >
                  {actualizando ? 'Actualizando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}

export default function EditarViaticoPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <EditarViaticoPageInner />
    </Suspense>
  );
}
