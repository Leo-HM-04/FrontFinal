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

  // Configuración dinámica para cuenta destino
  const cuentaConfig = (form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta'
    ? {
        maxLength: 16,
        pattern: '^\d{16}$',
        placeholder: 'Número de tarjeta (16 dígitos)',
        errorMsg: 'La tarjeta debe tener exactamente 16 dígitos.'
      }
    : {
        maxLength: 18,
        pattern: '^\d{18}$',
        placeholder: 'Número de cuenta CLABE (18 dígitos)',
        errorMsg: 'La cuenta CLABE debe tener exactamente 18 dígitos.'
      };

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
                        <CreditCard className="inline w-4 h-4 mr-2" />
                        Tipo de Cuenta Destino *
                      </label>
                      <select
                        name="tipo_cuenta_destino"
                        value={form.tipo_cuenta_destino || "CLABE"}
                        onChange={handleInputChange}
                        required
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="CLABE" className="text-black">CLABE</option>
                        <option value="Tarjeta" className="text-black">Tarjeta</option>
                      </select>
                    </div>

                    {(form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta' && (
                      <div>
                        <label className="text-white/90 block mb-3 font-medium">
                          Tipo de Tarjeta *
                        </label>
                        <select
                          name="tipo_tarjeta"
                          value={form.tipo_tarjeta || ""}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                        >
                          <option value="" className="text-black">Selecciona tipo</option>
                          <option value="Débito" className="text-black">Débito</option>
                          <option value="Crédito" className="text-black">Crédito</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        Banco (opcional)
                      </label>
                      <select
                        name="banco_destino"
                        value={form.banco_destino || ""}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      >
                        <option value="" className="text-black">Selecciona banco</option>
                        {bancoOptions.map(banco => (
                          <option key={banco} value={banco} className="text-black">
                            {banco}
                          </option>
                        ))}
                      </select>
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
                        onChange={e => {
                          const maxLen = cuentaConfig.maxLength;
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, maxLen);
                          setForm(prev => ({ ...prev, cuenta_destino: value }));
                        }}
                        required
                        placeholder={cuentaConfig.placeholder}
                        maxLength={cuentaConfig.maxLength}
                        inputMode="numeric"
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      />
                    </div>

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
                        Empresa a pagar (opcional)
                      </label>
                      <input
                        type="text"
                        name="empresa_a_pagar"
                        value={form.empresa_a_pagar || ""}
                        onChange={handleInputChange}
                        placeholder="Nombre de la empresa"
                        className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30"
                      />
                    </div>

                    <div>
                      <label className="text-white/90 block mb-3 font-medium">
                        Nombre de la persona que recibe el pago *
                      </label>
                      <input
                        type="text"
                        name="nombre_persona"
                        value={form.nombre_persona || ""}
                        onChange={handleInputChange}
                        required
                        placeholder="Nombre completo de la persona"
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
                      
                      {/* Mostrar descripción solo si hay tipo de pago seleccionado y no está vacío */}
                      {(form.tipo_pago || '') !== '' && (
                        <div className="mt-4">
                          <label className="text-white/90 block mb-3 font-medium">
                            Descripción del tipo de pago
                          </label>
                          <textarea
                            name="tipo_pago_descripcion"
                            value={form.tipo_pago_descripcion || ""}
                            onChange={handleInputChange}
                            placeholder="Agrega una descripción para el tipo de pago..."
                            rows={2}
                            className="w-full px-5 py-4 bg-white/20 text-white rounded-lg border border-white/30 resize-none"
                          />
                        </div>
                      )}
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

