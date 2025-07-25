"use client";


import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RecurrentesService } from "@/services/recurrentes.service";
import { Button } from "@/components/ui/Button";
import { SolicitanteLayout } from "@/components/layout/SolicitanteLayout";
import { PlantillaRecurrente } from "@/types";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import { FileText, Building, DollarSign, CreditCard, Calendar, MessageSquare, Repeat } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';


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
  'atencion a clientes', 'tesoreria', 'nomina'
];
const frecuencias = ['diaria', 'semanal', 'quincenal', 'mensual'];

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const data = await RecurrentesService.obtenerPorId(id);
        setForm(data);
        // Normaliza fecha para el datepicker
        if (data.siguiente_fecha) {
          setFechaInicio(new Date(data.siguiente_fecha));
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
    setForm((prev) => ({ ...prev, siguiente_fecha: date ? date.toISOString().split('T')[0] : '' }));
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
        formData.append("frecuencia", form.frecuencia || "");
        formData.append("siguiente_fecha", form.siguiente_fecha || "");
        formData.append("fact_recurrente", file);
        if (!RecurrentesService.editarConArchivo) {
          throw new Error('Falta el método editarConArchivo en RecurrentesService');
        }
        await RecurrentesService.editarConArchivo(id, formData);
      } else {
        await RecurrentesService.editar(id, {
          departamento: form.departamento || "",
          monto: form.monto ?? 0,
          cuenta_destino: form.cuenta_destino || "",
          concepto: form.concepto || "",
          tipo_pago: form.tipo_pago || "",
          frecuencia: form.frecuencia || "",
          siguiente_fecha: form.siguiente_fecha || "",
        });
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
        <div className="max-w-screen-xl mx-auto px-12 py-12 md:py-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 mb-12 border border-white/20 w-full text-left shadow-xl">
            <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Editar Plantilla Recurrente</h1>
            <p className="text-white/80 text-lg">Modifica los campos necesarios y guarda los cambios</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-14 md:p-20 w-full text-left shadow-xl">
            {loading ? (
              <div className="text-center text-blue-200">Cargando...</div>
            ) : error ? (
              <div className="bg-red-100 text-red-800 border border-red-300 p-4 rounded mb-4">{error}</div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full items-start">
                  {/* Columna Izquierda */}
                  <div className="flex-1 space-y-8 w-full md:max-w-[600px]">
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <Building className="inline w-4 h-4 mr-2" />
                        Departamento *
                      </label>
                      <select
                        name="departamento"
                        value={form.departamento || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="">Selecciona departamento</option>
                        {departamentos.map(dep => (
                          <option key={dep} value={dep} className="text-black">
                            {dep.charAt(0).toUpperCase() + dep.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <DollarSign className="inline w-4 h-4 mr-2" />
                        Monto *
                      </label>
                      <NumericFormat
                        value={form.monto || ""}
                        name="monto"
                        thousandSeparator="," 
                        decimalSeparator="."
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        placeholder="0.00"
                        onValueChange={handleMontoChange}
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <CreditCard className="inline w-4 h-4 mr-2" />
                        Cuenta Destino *
                      </label>
                      <input
                        type="text"
                        name="cuenta_destino"
                        value={form.cuenta_destino || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <MessageSquare className="inline w-4 h-4 mr-2" />
                        Concepto *
                      </label>
                      <textarea
                        name="concepto"
                        value={form.concepto || ""}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                        placeholder="Describe el motivo del pago..."
                      />
                    </div>
                  </div>
                  {/* Columna Derecha */}
                  <div className="flex-1 space-y-8 w-full md:max-w-[600px]">
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        Tipo de Pago *
                      </label>
                      <select
                        name="tipo_pago"
                        value={form.tipo_pago || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="">Selecciona tipo de pago</option>
                        {tipoPagoOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="text-black">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <Repeat className="inline w-4 h-4 mr-2" />
                        Frecuencia *
                      </label>
                      <select
                        name="frecuencia"
                        value={form.frecuencia || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="">Selecciona frecuencia</option>
                        {frecuencias.map(f => (
                          <option key={f} value={f} className="text-black">
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        <Calendar className="inline w-4 h-4 mr-2" />
                        Fecha de Inicio *
                      </label>
                      <DatePicker
                        selected={fechaInicio}
                        onChange={handleFechaChange}
                        dateFormat="yyyy-MM-dd"
                        minDate={new Date()}
                        placeholderText="Selecciona la fecha"
                        locale={es}
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-white/90 block mb-3 font-medium">
                    <FileText className="inline w-4 h-4 mr-2" />
                    Factura (PDF o imagen)
                  </label>
                  {form.fact_recurrente && (
                    <div className="mb-2 text-white/80 text-sm">
                      Archivo actual: <a href={form.fact_recurrente} target="_blank" rel="noopener noreferrer" className="underline text-blue-200">Ver archivo</a>
                    </div>
                  )}
                  <input
                    type="file"
                    name="fact_recurrente"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                  />
                </div>
                <div className="flex justify-end space-x-8 pt-12">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-8 py-4 text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 text-base"
                  >
                    Guardar Cambios
                  </Button>
                </div>
                {success && <div className="bg-green-100 text-green-800 border border-green-300 p-3 rounded mt-4">{success}</div>}
              </form>
            )}
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}

