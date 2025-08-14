"use client";


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RecurrentesService } from "@/services/recurrentes.service";
import { Button } from "@/components/ui/Button";
import { SolicitanteLayout } from "@/components/layout/SolicitanteLayout";
import { PlantillaRecurrente } from "@/types";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import { FileText } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';
import { formatDateForAPI, parseBackendDateForForm } from '@/utils/dateUtils';

// Opciones igual que en crear
const tipoPagoOptions = [
  { value: 'viaticos', label: 'Viáticos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'factura', label: 'Factura' },
  { value: 'nominas', label: 'Nóminas' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'administrativos', label: 'Administrativos' }
];
const departamentos = [
  'contabilidad', 'facturacion', 'cobranza', 'vinculacion',
  'administracion', 'ti', 'automatizaciones', 'comercial',
  'atencion a clientes', 'tesoreria', 'nomina', 'atraccion de talento'
];
const frecuencias = ['diaria', 'semanal', 'quincenal', 'mensual'];

const bancoOptions = [
  "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
];

export default function EditarRecurrentePage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<Partial<PlantillaRecurrente>>({});
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);

  // Configuración dinámica para cuenta destino - SIN RESTRICCIONES DE LONGITUD
  const cuentaConfig = (form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta'
    ? {
        placeholder: 'Número de tarjeta',
        errorMsg: 'Ingresa un número de tarjeta válido.'
      }
    : {
        placeholder: 'Número de cuenta CLABE',
        errorMsg: 'Ingresa un número de cuenta CLABE válido.'
      };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await RecurrentesService.obtenerPorId(id);
        setForm(data);
        // Normaliza fecha para el datepicker
        if (data.siguiente_fecha) {
          setFechaInicio(parseBackendDateForForm(data.siguiente_fecha));
        }
      } catch {
        setError("No se pudo cargar la plantilla");
      } finally {
        setLoading(false);
      }
    };
    if (id !== undefined) fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // NumericFormat para monto
  const handleMontoChange = (values: { value: string }) => {
    setForm((prev) => ({ ...prev, monto: values.value === '' ? undefined : Number(values.value) }));
  };

  // DatePicker para siguiente_fecha
  const handleFechaChange = (date: Date | null) => {
    setFechaInicio(date);
    setForm((prev) => ({ ...prev, siguiente_fecha: formatDateForAPI(date) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (!id) throw new Error('ID inválido');
      if (file) {
        const formData = new FormData();
        formData.append("departamento", form.departamento || "");
        formData.append("monto", String(form.monto ?? ""));
        formData.append("cuenta_destino", form.cuenta_destino || "");
        formData.append("concepto", form.concepto || "");
        formData.append("tipo_pago", form.tipo_pago || "");
        formData.append("tipo_pago_descripcion", form.tipo_pago_descripcion || "");
        formData.append("empresa_a_pagar", form.empresa_a_pagar || "");
        formData.append("nombre_persona", form.nombre_persona || "");
        formData.append("tipo_cuenta_destino", form.tipo_cuenta_destino || "CLABE");
        formData.append("tipo_tarjeta", form.tipo_tarjeta || "");
        formData.append("banco_destino", form.banco_destino || "");
        formData.append("frecuencia", form.frecuencia || "");
        formData.append("siguiente_fecha", form.siguiente_fecha || "");
        formData.append("fact_recurrente", file);
        if (!RecurrentesService.editarConArchivo) {
          throw new Error('Falta el método editarConArchivo en RecurrentesService');
        }
        await RecurrentesService.editarConArchivo(id, formData);
      } else {
        // Enviar todos los campos incluyendo los nuevos
        const updateData = {
          departamento: form.departamento || "",
          monto: form.monto ?? 0,
          cuenta_destino: form.cuenta_destino || "",
          concepto: form.concepto || "",
          tipo_pago: form.tipo_pago || "",
          tipo_pago_descripcion: form.tipo_pago_descripcion || "",
          empresa_a_pagar: form.empresa_a_pagar || "",
          nombre_persona: form.nombre_persona || "",
          tipo_cuenta_destino: form.tipo_cuenta_destino || "CLABE",
          tipo_tarjeta: form.tipo_tarjeta || "",
          banco_destino: form.banco_destino || "",
          frecuencia: form.frecuencia || "",
          siguiente_fecha: form.siguiente_fecha || "",
        };
        await RecurrentesService.editar(id, updateData);
      }
      setSuccess("Plantilla actualizada correctamente");
      toast.success("Plantilla actualizada correctamente");
      setTimeout(() => router.push("/dashboard/solicitante/mis-recurrentes"), 1200);
    } catch {
      setError("Error al actualizar la plantilla");
      toast.error("Error al actualizar la plantilla");
    }
  };

  return (
    <ProtectedRoute requiredRoles={["solicitante"]}>
      <SolicitanteLayout>
        <div className="max-w-screen-lg mx-auto px-6 py-10">
          <div className="bg-gradient-to-br from-blue-700/60 via-blue-400/30 to-blue-100/10 rounded-2xl p-8 mb-8 border border-blue-200 w-full text-left shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-yellow-400 text-blue-900 rounded-full p-2"><FileText className="w-6 h-6" /></span>
              <h1 className="text-3xl font-bold text-blue-900 font-montserrat">Editar Viático Recurrente</h1>
            </div>
            <p className="text-blue-900/80 text-lg">Modifica los campos necesarios y guarda los cambios</p>
          </div>
          <div className="bg-white/95 rounded-2xl border border-blue-200 p-8 w-full text-left shadow-xl">
            {loading ? (
              <div className="text-center text-blue-200">Cargando...</div>
            ) : error ? (
              <div className="bg-red-100 text-red-800 border border-red-300 p-4 rounded mb-4">{error}</div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Departamento *</label>
                    <select name="departamento" value={form.departamento || ""} onChange={handleInputChange} required className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <option value="">Selecciona departamento</option>
                      {departamentos.map(dep => (
                        <option key={dep} value={dep} className="text-blue-900">{dep.charAt(0).toUpperCase() + dep.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Monto *</label>
                    <NumericFormat value={form.monto || ""} name="monto" thousandSeparator="," decimalSeparator="." decimalScale={2} fixedDecimalScale allowNegative={false} placeholder="0.00" onValueChange={handleMontoChange} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Empresa a pagar (opcional)</label>
                    <input type="text" name="empresa_a_pagar" value={form.empresa_a_pagar || ""} onChange={handleInputChange} placeholder="Nombre de la empresa" className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Nombre de la persona que recibe el pago *</label>
                    <input type="text" name="nombre_persona" value={form.nombre_persona || ""} onChange={handleInputChange} required placeholder="Nombre completo de la persona" className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Concepto *</label>
                    <textarea name="concepto" value={form.concepto || ""} onChange={handleInputChange} required rows={3} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" placeholder="Describe el motivo del pago..." />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Tipo de Cuenta Destino *</label>
                    <select name="tipo_cuenta_destino" value={form.tipo_cuenta_destino || "CLABE"} onChange={handleInputChange} required className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <option value="CLABE" className="text-blue-900">CLABE</option>
                      <option value="Tarjeta" className="text-blue-900">Tarjeta</option>
                    </select>
                  </div>
                  {(form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta' && (
                    <div>
                      <label className="text-blue-900 block mb-2 font-semibold">Tipo de Tarjeta *</label>
                      <select name="tipo_tarjeta" value={form.tipo_tarjeta || ""} onChange={handleInputChange} required className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                        <option value="" className="text-blue-900">Selecciona tipo</option>
                        <option value="Débito" className="text-blue-900">Débito</option>
                        <option value="Crédito" className="text-blue-900">Crédito</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Banco (opcional)</label>
                    <select name="banco_destino" value={form.banco_destino || ""} onChange={handleInputChange} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <option value="" className="text-blue-900">Selecciona banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco} className="text-blue-900">{banco}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Cuenta Destino *</label>
                    <input type="text" name="cuenta_destino" value={form.cuenta_destino || ""} onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setForm(prev => ({ ...prev, cuenta_destino: value }));
                    }} required placeholder={cuentaConfig.placeholder} inputMode="numeric" className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Tipo de Pago *</label>
                    <select name="tipo_pago" value={form.tipo_pago || ""} onChange={handleInputChange} required className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <option value="">Selecciona tipo de pago</option>
                      {tipoPagoOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="text-blue-900">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {(form.tipo_pago || '') !== '' && (
                    <div>
                      <label className="text-blue-900 block mb-2 font-semibold">Descripción del tipo de pago</label>
                      <textarea name="tipo_pago_descripcion" value={form.tipo_pago_descripcion || ""} onChange={handleInputChange} placeholder="Agrega una descripción para el tipo de pago..." rows={2} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 resize-none" />
                    </div>
                  )}
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Frecuencia *</label>
                    <select name="frecuencia" value={form.frecuencia || ""} onChange={handleInputChange} required className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
                      <option value="">Selecciona frecuencia</option>
                      {frecuencias.map(f => (
                        <option key={f} value={f} className="text-blue-900">{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Fecha de Inicio *</label>
                    <DatePicker selected={fechaInicio} onChange={handleFechaChange} dateFormat="yyyy-MM-dd" minDate={new Date()} placeholderText="Selecciona la fecha" locale={es} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                  <div>
                    <label className="text-blue-900 block mb-2 font-semibold">Archivo Adjunto</label>
                    {form.fact_recurrente && (
                      <div className="mb-2 text-blue-900/80 text-sm">
                        Archivo actual: <a href={form.fact_recurrente} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">Ver archivo actual</a>
                      </div>
                    )}
                    <input type="file" name="fact_recurrente" accept=".pdf,image/*" onChange={handleFileChange} className="w-full px-4 py-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200" />
                  </div>
                </div>
                <div className="flex justify-end space-x-6 pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="bg-gray-100 text-blue-900 border-gray-300 hover:bg-gray-200 px-8 py-3 text-base font-bold rounded-lg shadow"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-700 text-white hover:bg-blue-800 px-8 py-3 text-base font-bold rounded-lg shadow"
                  >
                    Guardar Cambios
                  </Button>
                </div>
                {success && (
                  <div className="mt-6 flex items-center justify-center gap-3 text-center font-bold text-lg px-6 py-3 rounded-xl shadow-lg drop-shadow-lg border-2 bg-green-50 border-green-400 text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                    <span>{success}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}

