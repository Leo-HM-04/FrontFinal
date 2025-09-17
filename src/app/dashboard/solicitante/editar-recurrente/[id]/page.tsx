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
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'factura', label: 'Factura' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'tarjeta_institucional', label: 'Tarjeta Institucional' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'administrativos', label: 'Administrativos' },
  { value: 'comisiones', label: 'Comisiones' },
  { value: 'poliza_seguro', label: 'Poliza - Seguro' },
  { value: 'Dirección General', label: 'Dirección General' },
  { value: 'Donativos', label: 'Donativos' },
  { value: 'Operativos', label: 'Operativos' },
  { value: 'Fiscales legales y corporativos', label: 'Fiscales legales y corporativos' }
];
const departamentos = [
  'contabilidad', 'facturacion', 'cobranza', 'vinculacion',
  'administracion', 'ti', 'automatizaciones', 'comercial',
  'atencion a clientes', 'tesoreria', 'nomina', 'atraccion de talento',
  'direccion general'
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          {/* Header responsivo */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-blue-200 shadow-lg">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <span className="bg-yellow-400 text-blue-900 rounded-full p-2 sm:p-2.5">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Editar Viático Recurrente
              </h1>
            </div>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg">
              Modifica los campos necesarios y guarda los cambios
            </p>
          </div>

          {/* Formulario responsivo */}
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 md:p-8 shadow-lg">
            {loading ? (
              <div className="text-center text-gray-500 py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm sm:text-base">Cargando plantilla...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 border border-red-300 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
                {/* Grid responsivo del formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Departamento */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Departamento *
                    </label>
                    <select 
                      name="departamento" 
                      value={form.departamento || ""} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">Selecciona departamento</option>
                      {departamentos.map(dep => (
                        <option key={dep} value={dep}>
                          {dep.charAt(0).toUpperCase() + dep.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monto */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  {/* Empresa a pagar */}
                  <div className="md:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Empresa a pagar (opcional)
                    </label>
                    <input 
                      type="text" 
                      name="empresa_a_pagar" 
                      value={form.empresa_a_pagar || ""} 
                      onChange={handleInputChange} 
                      placeholder="Nombre de la empresa" 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  {/* Nombre de la persona */}
                  <div className="md:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Nombre de la persona que recibe el pago *
                    </label>
                    <input 
                      type="text" 
                      name="nombre_persona" 
                      value={form.nombre_persona || ""} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Nombre completo de la persona" 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  {/* Concepto */}
                  <div className="md:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Concepto *
                    </label>
                    <textarea 
                      name="concepto" 
                      value={form.concepto || ""} 
                      onChange={handleInputChange} 
                      required 
                      rows={3} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none" 
                      placeholder="Describe el motivo del pago..." 
                    />
                  </div>

                  {/* Tipo de Cuenta Destino */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Tipo de Cuenta Destino *
                    </label>
                    <select 
                      name="tipo_cuenta_destino" 
                      value={form.tipo_cuenta_destino || "CLABE"} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="CLABE">CLABE</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>

                  {/* Tipo de Tarjeta (condicional) */}
                  {(form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta' && (
                    <div className="md:col-span-1">
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        Tipo de Tarjeta *
                      </label>
                      <select 
                        name="tipo_tarjeta" 
                        value={form.tipo_tarjeta || ""} 
                        onChange={handleInputChange} 
                        required 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      >
                        <option value="">Selecciona tipo</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                      </select>
                    </div>
                  )}

                  {/* Banco */}
                  <div className={`${(form.tipo_cuenta_destino || 'CLABE') === 'Tarjeta' ? 'md:col-span-2' : 'md:col-span-1'}`}>
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Banco (opcional)
                    </label>
                    <select 
                      name="banco_destino" 
                      value={form.banco_destino || ""} 
                      onChange={handleInputChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">Selecciona banco</option>
                      {bancoOptions.map(banco => (
                        <option key={banco} value={banco}>{banco}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cuenta Destino */}
                  <div className="md:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Cuenta Destino *
                    </label>
                    <input 
                      type="text" 
                      name="cuenta_destino" 
                      value={form.cuenta_destino || ""} 
                      onChange={e => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setForm(prev => ({ ...prev, cuenta_destino: value }));
                      }} 
                      required 
                      placeholder={cuentaConfig.placeholder} 
                      inputMode="numeric" 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  {/* Tipo de Pago */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Tipo de Pago *
                    </label>
                    <select 
                      name="tipo_pago" 
                      value={form.tipo_pago || ""} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">Selecciona tipo de pago</option>
                      {tipoPagoOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Frecuencia */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Frecuencia *
                    </label>
                    <select 
                      name="frecuencia" 
                      value={form.frecuencia || ""} 
                      onChange={handleInputChange} 
                      required 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    >
                      <option value="">Selecciona frecuencia</option>
                      {frecuencias.map(f => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descripción del tipo de pago (condicional) */}
                  {(form.tipo_pago || '') !== '' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                        Descripción del tipo de pago
                      </label>
                      <textarea 
                        name="tipo_pago_descripcion" 
                        value={form.tipo_pago_descripcion || ""} 
                        onChange={handleInputChange} 
                        placeholder="Agrega una breve descripción que identifique el pago" 
                        rows={2} 
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none" 
                      />
                    </div>
                  )}

                  {/* Fecha de Inicio */}
                  <div className="md:col-span-1">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Fecha de Inicio *
                    </label>
                    <DatePicker 
                      selected={fechaInicio} 
                      onChange={handleFechaChange} 
                      dateFormat="yyyy-MM-dd" 
                      minDate={new Date()} 
                      placeholderText="Selecciona la fecha" 
                      locale={es} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    />
                  </div>

                  {/* Archivo Adjunto */}
                  <div className="md:col-span-2">
                    <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Archivo Adjunto
                    </label>
                    {form.fact_recurrente && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          <span className="font-medium">Archivo actual:</span>
                        </p>
                        <a 
                          href={form.fact_recurrente} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Ver archivo actual
                        </a>
                      </div>
                    )}
                    <input 
                      type="file" 
                      name="fact_recurrente" 
                      accept=".pdf,image/*" 
                      onChange={handleFileChange} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                  </div>
                </div>

                {/* Botones responsivos */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full sm:w-auto bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow order-2 sm:order-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-lg shadow order-1 sm:order-2"
                  >
                    Guardar Cambios
                  </Button>
                </div>

                {/* Mensaje de éxito responsivo */}
                {success && (
                  <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3 text-center font-medium text-sm sm:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg bg-green-50 border-2 border-green-300 text-green-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
                    </svg>
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

