import React, { useCallback } from 'react';
import { CampoPlantilla } from '@/types/plantillas';
import { NumericFormat } from 'react-number-format';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { formatDateForAPI } from '@/utils/dateUtils';
import { obtenerOpcionesBancos } from '@/data/bancos';

interface CampoFormularioProps {
  campo: CampoPlantilla;
  valor: unknown;
  error?: string;
  onChange: (valor: unknown) => void;
  esVisible: boolean;
  className?: string;
}

export const CampoFormulario: React.FC<CampoFormularioProps> = ({
  campo,
  valor,
  error,
  onChange,
  esVisible,
  className = ''
}) => {
  // Estados para campos especiales
  // const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('');
  const bancoOptions = [
    "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
  ];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onChange(files);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onChange(files);
  }, [onChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  if (!esVisible) {
    return null;
  }

  const anchoClase = {
    'completo': 'col-span-full',
    'medio': 'col-span-6',
    'tercio': 'col-span-4',
    'cuarto': 'col-span-3'
  }[campo.estilos?.ancho || 'completo'];

  const renderInput = () => {
    const baseClasses = `block w-full rounded-lg border transition-colors ${
      error 
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    } focus:ring-2 focus:ring-opacity-50`;

    const valorStr = String(valor || '');
    // const valorNum = Number(valor || 0);

    switch (campo.tipo) {
      case 'texto':
      case 'email':
      case 'telefono':
        const esReadOnly = campo.estilos?.soloLectura || false;
        return (
          <input
            type={campo.tipo === 'email' ? 'email' : campo.tipo === 'telefono' ? 'tel' : 'text'}
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            readOnly={esReadOnly}
            className={`${baseClasses} px-3 py-2 ${esReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'numero':
        // Si el campo tiene formato de moneda, usar NumericFormat
        if (campo.estilos?.formato === 'moneda') {
          return (
            <NumericFormat
              value={valorStr}
              onValueChange={(values) => {
                console.log('🔍 [DEBUG CAMPO MONTO] Valor ingresado:', values.value);
                onChange(values.value);
              }}
              thousandSeparator=","
              decimalSeparator="."
              prefix="$"
              placeholder={campo.placeholder || "$0.00"}
              className={`${baseClasses} px-3 py-2`}
              allowNegative={false}
              decimalScale={2}
              aria-describedby={error ? `${campo.id}-error` : undefined}
            />
          );
        }
        // Para números normales
        return (
          <input
            type="number"
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'cuenta_clabe':
        return (
          <input
            type="text"
            value={valorStr}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, '');
              onChange(soloNumeros);
            }}
            placeholder={campo.placeholder}
            className={`${baseClasses} px-3 py-2 font-mono`}
            maxLength={18}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'moneda':
        return (
          <NumericFormat
            value={valorStr}
            onValueChange={(values) => onChange(values.value)}
            thousandSeparator=","
            decimalSeparator="."
            prefix="$"
            placeholder={campo.placeholder || "$0.00"}
            className={`${baseClasses} px-3 py-2`}
            allowNegative={false}
            decimalScale={2}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'textarea':
        const filas = campo.estilos?.filas || 4;
        return (
          <textarea
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            rows={filas}
            className={`${baseClasses} px-3 py-2 resize-vertical`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'select':
      case 'banco':
        const opciones = campo.tipo === 'banco' ? 
          bancoOptions.map(banco => ({ valor: banco, etiqueta: banco })) : 
          campo.opciones || [];

        return (
          <select
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          >
            <option value="">Seleccione una opción</option>
            {opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {campo.opciones?.map((opcion) => (
              <div key={opcion.valor} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`${campo.id}-${opcion.valor}`}
                    type="radio"
                    name={campo.id}
                    value={opcion.valor}
                    checked={valorStr === opcion.valor}
                    onChange={(e) => onChange(e.target.value)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`${campo.id}-${opcion.valor}`} className="font-medium text-gray-700">
                    {opcion.etiqueta}
                  </label>
                  {opcion.descripcion && (
                    <p className="text-gray-500 text-xs mt-1">{opcion.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        const valorArray = Array.isArray(valor) ? valor as string[] : [];
        return (
          <div className="space-y-3">
            {campo.opciones?.map((opcion) => (
              <div key={opcion.valor} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`${campo.id}-${opcion.valor}`}
                    type="checkbox"
                    value={opcion.valor}
                    checked={valorArray.includes(opcion.valor)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...valorArray, opcion.valor]);
                      } else {
                        onChange(valorArray.filter((v: string) => v !== opcion.valor));
                      }
                    }}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`${campo.id}-${opcion.valor}`} className="font-medium text-gray-700">
                    {opcion.etiqueta}
                  </label>
                  {opcion.descripcion && (
                    <p className="text-gray-500 text-xs mt-1">{opcion.descripcion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'archivo':
        const archivos = Array.isArray(valor) ? valor as File[] : [];
        return (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed rounded-lg px-6 py-4 transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor={campo.id} className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Arrastra archivos aquí o{' '}
                      <span className="text-blue-600 hover:text-blue-500">selecciona archivos</span>
                    </span>
                  </label>
                  <input
                    id={campo.id}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, JPG, PNG, Excel, Word hasta 10MB
                  </p>
                </div>
              </div>
            </div>
            
            {archivos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Archivos seleccionados:</h4>
                {archivos.map((file: File, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nuevosArchivos = archivos.filter((_: File, i: number) => i !== index);
                        onChange(nuevosArchivos);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'fecha':
        const fechaValue = valor instanceof Date ? valor : (valor ? new Date(valor as string) : null);
        return (
          <div className="relative">
            <DatePicker
              selected={fechaValue}
              onChange={(date: Date | null) => {
                if (date) {
                  // Ajustar la fecha para compensar la zona horaria local y evitar desfase
                  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                  const localDate = new Date(date.getTime() - userTimezoneOffset);
                  onChange(formatDateForAPI(localDate));
                } else {
                  onChange('');
                }
              }}
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              placeholderText={campo.placeholder || "Selecciona la fecha"}
              className={`${baseClasses} px-3 py-2 w-full`}
              calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg border border-gray-300"
              locale={es}
              aria-describedby={error ? `${campo.id}-error` : undefined}
              showPopperArrow={false}
              popperClassName="z-50"
            />
          </div>
        );

      case 'selector_cuenta':
        // Extraer valores del objeto o inicializar
        const valorCuenta = typeof valor === 'object' && valor !== null ? valor as {tipo: string, numero: string} : {tipo: '', numero: ''};
        const tipoSeleccionado = valorCuenta.tipo || '';
        const numeroIngresado = valorCuenta.numero || '';

        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange({tipo: 'clabe', numero: ''}); // Limpiar el número cuando cambia el tipo
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  tipoSeleccionado === 'clabe'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                CLABE (16-18 dígitos)
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({tipo: 'cuenta', numero: ''}); // Limpiar el número cuando cambia el tipo
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  tipoSeleccionado === 'cuenta'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                CUENTA (8-10 dígitos)
              </button>
            </div>

            {tipoSeleccionado && (
              <input
                type="text"
                value={numeroIngresado}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '');
                  onChange({tipo: tipoSeleccionado, numero: soloNumeros});
                }}
                placeholder={`Ingrese el número de ${tipoSeleccionado.toUpperCase()}`}
                className={`${baseClasses} px-3 py-2 font-mono`}
                maxLength={tipoSeleccionado === 'clabe' ? 18 : 10}
                pattern={tipoSeleccionado === 'clabe' ? '[0-9]{16,18}' : '[0-9]{8,10}'}
                aria-describedby={error ? `${campo.id}-error` : undefined}
              />
            )}

            {tipoSeleccionado && (
              <p className="text-xs text-gray-500">
                {tipoSeleccionado === 'clabe' 
                  ? 'CLABE: 16 o 18 dígitos y CUENTA: 8 o 10 dígitos.'
                  : 'Número de cuenta destino a realizar el depósito, puede ser Nº de cuenta o CLABE interbancaria.'
                }
              </p>
            )}
          </div>
        );

      case 'select_banco':
        const opcionesBancos = obtenerOpcionesBancos();

        return (
          <select
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          >
            <option value="">Seleccione el banco</option>
            {opcionesBancos.map((banco) => (
              <option key={banco.valor} value={banco.valor}>
                {banco.etiqueta}
              </option>
            ))}
          </select>
        );

      case 'archivos':
        const archivosMultiples = Array.isArray(valor) ? valor as File[] : [];
        return (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed rounded-lg px-6 py-4 transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-4">
                  <label htmlFor={campo.id} className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Arrastra archivos aquí o{' '}
                      <span className="text-blue-600 hover:text-blue-500">selecciona múltiples archivos</span>
                    </span>
                  </label>
                  <input
                    id={campo.id}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-describedby={error ? `${campo.id}-error` : undefined}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Implementar la opción de arrastrar archivos a recuadro para subir
                  </p>
                </div>
              </div>
            </div>

            {archivosMultiples.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Archivos seleccionados:</h4>
                <ul className="space-y-2">
                  {archivosMultiples.map((archivo, index) => (
                    <li key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-900 font-medium">{archivo.name}</span>
                        <span className="text-xs text-gray-500">({Math.round(archivo.size / 1024)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nuevosArchivos = archivosMultiples.filter((_, i) => i !== index);
                          onChange(nuevosArchivos);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'metodos_pago_dinamicos':
        // Valor es un array de métodos de pago
        const metodosPago = Array.isArray(valor) ? valor as Array<{banco_destino: string, convenio: string, referencia: string}> : [];
        const maximo = campo.estilos?.maximo || 4;

        const agregarMetodoPago = () => {
          if (metodosPago.length < maximo) {
            const nuevosMetodos = [...metodosPago, {banco_destino: '', convenio: '', referencia: ''}];
            onChange(nuevosMetodos);
          }
        };

        const actualizarMetodoPago = (index: number, campo: string, valor: string) => {
          const nuevosMetodos = [...metodosPago];
          nuevosMetodos[index] = {...nuevosMetodos[index], [campo]: valor};
          onChange(nuevosMetodos);
        };

        const eliminarMetodoPago = (index: number) => {
          const nuevosMetodos = metodosPago.filter((_, i) => i !== index);
          onChange(nuevosMetodos);
        };

        const opcionesBancosMetodos = obtenerOpcionesBancos();

        return (
          <div className="space-y-6">
            {/* Métodos de pago existentes */}
            {metodosPago.map((metodo, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Método de Pago {index + 1}</h4>
                  {metodosPago.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarMetodoPago(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Banco Destino */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={metodo.banco_destino}
                      onChange={(e) => actualizarMetodoPago(index, 'banco_destino', e.target.value)}
                      className={`${baseClasses} px-3 py-2`}
                    >
                      <option value="">Seleccione el banco</option>
                      {opcionesBancosMetodos.map((banco) => (
                        <option key={banco.valor} value={banco.valor}>
                          {banco.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Convenio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Convenio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={metodo.convenio}
                      onChange={(e) => actualizarMetodoPago(index, 'convenio', e.target.value)}
                      placeholder="Ej. CIE 1234567"
                      className={`${baseClasses} px-3 py-2`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej. CIE 1234567</p>
                  </div>

                  {/* Referencia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={metodo.referencia}
                      onChange={(e) => {
                        // Solo números, máximo 20 dígitos
                        const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 20);
                        actualizarMetodoPago(index, 'referencia', soloNumeros);
                      }}
                      placeholder="Ej. 11112222333344445555"
                      maxLength={20}
                      className={`${baseClasses} px-3 py-2 font-mono`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Hasta 20 dígitos máximo</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón para agregar nuevo método */}
            {metodosPago.length < maximo && (
              <button
                type="button"
                onClick={agregarMetodoPago}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-gray-600 font-medium">
                    Agregar otro método de pago ({metodosPago.length}/{maximo})
                  </span>
                </div>
              </button>
            )}

            {/* Mensaje inicial si no hay métodos */}
            {metodosPago.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay métodos de pago configurados</p>
                <button
                  type="button"
                  onClick={agregarMetodoPago}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Agregar primer método de pago
                </button>
              </div>
            )}
          </div>
        );

      case 'cuentas_dinamicas':
        // Valor es un array de cuentas de transferencia
        const cuentasTransferencia = Array.isArray(valor) ? valor as Array<{
          beneficiario: string,
          tipo_cuenta: string,
          numero_cuenta: string,
          banco_destino: string,
          monto: string,
          tipo_tarjeta?: string
        }> : [];
        const maximoCuentas = campo.estilos?.maximo || 3;

        const agregarCuentaTransferencia = () => {
          if (cuentasTransferencia.length < maximoCuentas) {
            const nuevasCuentas = [...cuentasTransferencia, {
              beneficiario: '',
              tipo_cuenta: '',
              numero_cuenta: '',
              banco_destino: '',
              monto: '',
              tipo_tarjeta: ''
            }];
            onChange(nuevasCuentas);
          }
        };

        const actualizarCuentaTransferencia = (index: number, campo: string, valor: string) => {
          const nuevasCuentas = [...cuentasTransferencia];
          nuevasCuentas[index] = {...nuevasCuentas[index], [campo]: valor};
          onChange(nuevasCuentas);
        };

        const eliminarCuentaTransferencia = (index: number) => {
          const nuevasCuentas = cuentasTransferencia.filter((_, i) => i !== index);
          onChange(nuevasCuentas);
        };

        const opcionesBancosCuentas = obtenerOpcionesBancos();

        const getValidacionTipoCuenta = (tipoCuenta: string) => {
          switch (tipoCuenta) {
            case 'clabe':
              return { maxLength: 18, pattern: '[0-9]{16,18}', placeholder: '16-18 dígitos' };
            case 'cuenta':
              return { maxLength: 10, pattern: '[0-9]{8,10}', placeholder: '8-10 dígitos' };
            case 'tarjeta':
              return { maxLength: 16, pattern: '[0-9]{13,16}', placeholder: 'Máximo 16 dígitos' };
            default:
              return { maxLength: 20, pattern: '[0-9]*', placeholder: 'Seleccione tipo primero' };
          }
        };

        return (
          <div className="space-y-6">
            {/* Cuentas existentes */}
            {cuentasTransferencia.map((cuenta, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">CUENTA {index + 1}</h4>
                  {cuentasTransferencia.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarCuentaTransferencia(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Fila 1: Beneficiario */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beneficiario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cuenta.beneficiario}
                      onChange={(e) => actualizarCuentaTransferencia(index, 'beneficiario', e.target.value)}
                      placeholder="Ej. JUAN DOMINGUEZ CRUZ"
                      className={`${baseClasses} px-3 py-2 w-full`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ej. JUAN DOMINGUEZ CRUZ</p>
                  </div>

                  {/* Fila 2: Información Bancaria y CLABE */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tipo de Cuenta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Información Bancaria <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cuenta.tipo_cuenta}
                        onChange={(e) => {
                          const nuevasCuentas = [...cuentasTransferencia];
                          nuevasCuentas[index] = {
                            ...nuevasCuentas[index], 
                            tipo_cuenta: e.target.value,
                            numero_cuenta: '', // Limpiar número al cambiar tipo
                            tipo_tarjeta: '' // Limpiar tipo de tarjeta también
                          };
                          onChange(nuevasCuentas);
                        }}
                        className={`${baseClasses} px-3 py-2 w-full`}
                      >
                        <option value="">Seleccione tipo</option>
                        <option value="cuenta">CUENTA</option>
                        <option value="clabe">CLABE</option>
                        <option value="tarjeta">TARJETA</option>
                      </select>
                    </div>

                    {/* Número de Cuenta/CLABE/Tarjeta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CLABE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cuenta.numero_cuenta}
                        onChange={(e) => {
                          if (cuenta.tipo_cuenta) {
                            const validacion = getValidacionTipoCuenta(cuenta.tipo_cuenta);
                            const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, validacion.maxLength);
                            actualizarCuentaTransferencia(index, 'numero_cuenta', soloNumeros);
                          }
                        }}
                        placeholder={cuenta.tipo_cuenta ? getValidacionTipoCuenta(cuenta.tipo_cuenta).placeholder : 'Seleccione el tipo de información bancaria'}
                        maxLength={cuenta.tipo_cuenta ? getValidacionTipoCuenta(cuenta.tipo_cuenta).maxLength : 20}
                        disabled={!cuenta.tipo_cuenta}
                        className={`${baseClasses} px-3 py-2 w-full font-mono ${
                          !cuenta.tipo_cuenta ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {cuenta.tipo_cuenta === 'clabe' && 'CLABE: 16 o 18 dígitos'}
                        {cuenta.tipo_cuenta === 'cuenta' && 'CUENTA: 8 o 10 dígitos'}
                        {cuenta.tipo_cuenta === 'tarjeta' && 'TARJETA: Máximo 16 dígitos'}
                        {!cuenta.tipo_cuenta && 'Seleccione el tipo de información bancaria'}
                      </p>
                    </div>

                    {/* Tipo de Tarjeta (solo visible cuando es tarjeta) */}
                    {cuenta.tipo_cuenta === 'tarjeta' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Tarjeta <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={cuenta.tipo_tarjeta || ''}
                          onChange={(e) => actualizarCuentaTransferencia(index, 'tipo_tarjeta', e.target.value)}
                          className={`${baseClasses} px-3 py-2 w-full`}
                        >
                          <option value="">Seleccione tipo</option>
                          <option value="debito">Débito</option>
                          <option value="credito">Crédito</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cuenta.monto}
                          onChange={(e) => {
                            // Formato de moneda básico
                            const valor = e.target.value.replace(/[^\d.,]/g, '');
                            actualizarCuentaTransferencia(index, 'monto', valor);
                          }}
                          placeholder="Ej. 56,000.00"
                          className={`${baseClasses} px-3 py-2 w-full`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ej. 56,000.00</p>
                      </div>
                    )}
                  </div>

                  {/* Fila 3: Monto (cuando es tarjeta) */}
                  {cuenta.tipo_cuenta === 'tarjeta' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cuenta.monto}
                          onChange={(e) => {
                            // Formato de moneda básico
                            const valor = e.target.value.replace(/[^\d.,]/g, '');
                            actualizarCuentaTransferencia(index, 'monto', valor);
                          }}
                          placeholder="Ej. 56,000.00"
                          className={`${baseClasses} px-3 py-2 w-full`}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ej. 56,000.00</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banco Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={cuenta.banco_destino}
                      onChange={(e) => actualizarCuentaTransferencia(index, 'banco_destino', e.target.value)}
                      className={`${baseClasses} px-3 py-2 w-full`}
                    >
                      <option value="">Seleccione el banco</option>
                      {opcionesBancosCuentas.map((banco) => (
                        <option key={banco.valor} value={banco.valor}>
                          {banco.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón para agregar nueva cuenta */}
            {cuentasTransferencia.length < maximoCuentas && (
              <button
                type="button"
                onClick={agregarCuentaTransferencia}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-gray-600 font-medium">
                    Agregar otra cuenta ({cuentasTransferencia.length}/{maximoCuentas})
                  </span>
                </div>
              </button>
            )}

            {/* Mensaje inicial si no hay cuentas */}
            {cuentasTransferencia.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay cuentas de transferencia configuradas</p>
                <button
                  type="button"
                  onClick={agregarCuentaTransferencia}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Agregar primera cuenta de transferencia
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );
    }
  };

  return (
    <div className={`${anchoClase} ${className}`}>
      <label htmlFor={campo.id} className="block text-sm font-medium text-gray-700 mb-2">
        {campo.etiqueta}
        {campo.validaciones?.requerido && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      
      {renderInput()}
      
      {campo.ayuda && (
        <p className="mt-1 text-sm text-gray-500">{campo.ayuda}</p>
      )}
      
      {error && (
        <p id={`${campo.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
