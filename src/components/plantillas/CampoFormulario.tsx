import React, { useCallback } from 'react';
import { CampoPlantilla } from '@/types/plantillas';
import { NumericFormat } from 'react-number-format';

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
    const valorNum = Number(valor || 0);

    switch (campo.tipo) {
      case 'texto':
      case 'email':
      case 'telefono':
        return (
          <input
            type={campo.tipo === 'email' ? 'email' : campo.tipo === 'telefono' ? 'tel' : 'text'}
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
        );

      case 'numero':
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
        return (
          <textarea
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            placeholder={campo.placeholder}
            rows={4}
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
        return (
          <input
            type="date"
            value={valorStr}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} px-3 py-2`}
            aria-describedby={error ? `${campo.id}-error` : undefined}
          />
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
