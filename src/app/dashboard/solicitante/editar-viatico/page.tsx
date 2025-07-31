"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ViaticosService } from "@/services/viaticos.service";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SolicitanteLayout } from "@/components/layout/SolicitanteLayout";
import { Suspense } from "react";
import type { Viatico as BaseViatico } from '@/services/viaticos.service';

type Viatico = BaseViatico & {
  id_viatico?: number;
  folio?: string;
  estado?: string;
  fecha_creacion?: string;
};


function EditarViaticoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [viatico, setViatico] = useState<Viatico | null>(null);
  const [form, setForm] = useState<Partial<Viatico>>({});

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
        });
        setError("");
      })
      .catch(() => setError("No se pudo cargar el viático"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await ViaticosService.update(Number(id), form);
      setMensaje("Viático actualizado correctamente.");
      setTimeout(() => router.push("/dashboard/solicitante/mis-viaticos"), 1500);
    } catch {
      setMensaje("Error al actualizar el viático.");
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;
  if (!viatico) return <div className="p-8 text-red-600 font-bold">Viático no encontrado</div>;

  return (
    <ProtectedRoute requiredRoles={["solicitante"]}>
      <SolicitanteLayout>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 p-2 shadow-sm">
              {/* Icono de edición */}
              <svg className="text-yellow-600 w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z" /></svg>
            </span>
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Editar Viático</h1>
          </div>
          {mensaje && (
            <div className={`mb-6 text-center font-bold text-lg ${mensaje.includes('actualizado') ? 'text-green-700' : 'text-red-700'}`}>{mensaje}</div>
          )}
          <form className="bg-white rounded-xl p-8 border border-blue-200 shadow-md flex flex-col gap-6" onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Departamento</label>
                <select
                  name="departamento"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.departamento || ''}
                  onChange={e => setForm({ ...form, departamento: e.target.value })}
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
                <label className="block text-sm font-semibold text-blue-900 mb-1">Concepto</label>
                <input
                  type="text"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.concepto || ''}
                  onChange={e => setForm({ ...form, concepto: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Monto</label>
                <input
                  type="number"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.monto || ''}
                  onChange={e => setForm({ ...form, monto: e.target.value })}
                  min={1}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Fecha límite de pago</label>
                <input
                  type="date"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.fecha_limite_pago || ''}
                  onChange={e => setForm({ ...form, fecha_limite_pago: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Cuenta destino</label>
                <input
                  type="text"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.cuenta_destino || ''}
                  onChange={e => setForm({ ...form, cuenta_destino: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Tipo de cuenta</label>
                <select
                  name="tipo_cuenta_destino"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.tipo_cuenta_destino || ''}
                  onChange={e => setForm({ ...form, tipo_cuenta_destino: e.target.value })}
                  required
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
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Tipo de tarjeta</label>
                <select
                  name="tipo_tarjeta"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.tipo_tarjeta || ''}
                  onChange={e => setForm({ ...form, tipo_tarjeta: e.target.value })}
                >
                  <option value="" disabled>SELECCIONA TIPO DE TARJETA</option>
                  <option value="debito">DÉBITO</option>
                  <option value="credito">CRÉDITO</option>
                  <option value="nomina">NÓMINA</option>
                  <option value="vale">VALE</option>
                  <option value="otra">OTRA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Banco destino</label>
                <select
                  name="banco_destino"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2 text-blue-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.banco_destino || ''}
                  onChange={e => setForm({ ...form, banco_destino: e.target.value })}
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
            </div>
            {/* Sección para subir/reemplazar archivo */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-blue-900 mb-1">Archivo actual:</label>
              {viatico.viatico_url ? (
                <a
                  href={viatico.viatico_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline break-all"
                >
                  Ver archivo actual
                </a>
              ) : (
                <span className="text-gray-500">No hay archivo adjunto</span>
              )}
              <div className="mt-2">
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
                      await ViaticosService.updateWithFiles(
                        Number(viatico.id_viatico ?? viatico.id),
                        {
                          departamento: form.departamento || '',
                          monto: form.monto || '',
                          cuenta_destino: form.cuenta_destino || '',
                          concepto: form.concepto || '',
                          tipo_pago: "viaticos",
                          fecha_limite_pago: form.fecha_limite_pago || '',
                          tipo_cuenta_destino: form.tipo_cuenta_destino || '',
                          tipo_tarjeta: form.tipo_tarjeta || '',
                          banco_destino: form.banco_destino || '',
                          viatico_url: file
                        }
                      );
                      // Refrescar el viatico desde el backend para asegurar la URL correcta
                      const idNum = Number(viatico.id_viatico || viatico.id);
                      const actualizado = await ViaticosService.getById(idNum);
                      setViatico(actualizado);
                      setMensaje('Archivo actualizado correctamente.');
                    } catch (err) {
                      // @ts-expect-error: Puede no tener response
                      setMensaje(err?.response?.data?.error || 'Error al subir el archivo.');
                    }
                  }}
                />
                <span className="text-xs text-gray-500">Formatos permitidos: PDF, PNG, JPG. Máx 10MB.</span>
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-8">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-400 bg-white text-gray-800 font-semibold hover:bg-gray-100 transition"
                onClick={() => router.push("/dashboard/solicitante/mis-viaticos")}
              >Cancelar</button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition"
              >Guardar</button>
            </div>
          </form>
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
