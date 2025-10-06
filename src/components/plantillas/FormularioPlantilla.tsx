import React from 'react';
import { PlantillaSolicitud, SeccionPlantilla } from '@/types/plantillas';
import { CampoFormulario } from './CampoFormulario';
import { FileText } from 'lucide-react';

interface FormularioPlantillaProps {
  plantilla: PlantillaSolicitud;
  datos: Record<string, unknown>;
  errores: Record<string, string>;
  camposVisibles: Set<string>;
  onCambiarCampo: (campoId: string, valor: unknown) => void;
  className?: string;
  onGuardar?: () => void;
}

export const FormularioPlantilla: React.FC<FormularioPlantillaProps> = ({
  plantilla,
  datos,
  errores,
  camposVisibles,
  onCambiarCampo,
  className = '',
  onGuardar
}) => {
  // const [guardando, setGuardando] = useState(false);

  // const handleGuardar = async () => {
  //   if (typeof onGuardar === 'function') {
  //     setGuardando(true);
  //     await Promise.resolve(onGuardar());
  //     setGuardando(false);
  //   } else {
  //     alert('Función de guardar no implementada');
  //   }
  // };

  const renderSeccion = (seccion: SeccionPlantilla) => {
    const camposVisiblesEnSeccion = seccion.campos.filter(campo => 
      camposVisibles.has(campo.id)
    );

    if (camposVisiblesEnSeccion.length === 0) {
      return null;
    }

    const espaciado = seccion.estilos?.espaciado || 'normal';
    const espaciadoClase = {
      'compacto': 'gap-4',
      'normal': 'gap-6',
      'amplio': 'gap-8'
    }[espaciado];

    // Responsive grid: 1 col móvil, 2 col tablet, 4 col desktop
    const gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    return (
      <div key={seccion.id} className="bg-white rounded-2xl border border-blue-400 w-full mb-8 shadow-lg">
        <div className="bg-blue-600 rounded-t-2xl px-4 sm:px-8 py-4">
          <h3 className="text-xl font-bold text-white">
            {seccion.titulo}
          </h3>
          {seccion.descripcion && (
            <p className="text-white/90 text-base mt-1">
              {seccion.descripcion}
            </p>
          )}
        </div>
        <div className="p-4 sm:p-8 md:p-12 lg:p-16 text-black">
          <div className={`grid ${gridCols} ${espaciadoClase} w-full`}>
            {seccion.campos.map((campo) => (
              <CampoFormulario
                key={campo.id}
                campo={campo}
                valor={datos[campo.id]}
                error={errores[campo.id]}
                onChange={(valor) => onCambiarCampo(campo.id, valor)}
                esVisible={camposVisibles.has(campo.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-12 lg:py-16 w-full space-y-8 ${className}`}>
      {/* Header de la plantilla */}
      <div className="bg-blue-600 rounded-2xl border border-blue-700 p-4 sm:p-8 mb-8 w-full shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            {typeof plantilla.icono === 'string' ? (
              <span className="text-xl text-white">{plantilla.icono}</span>
            ) : plantilla.icono ? (
              <plantilla.icono className="w-6 h-6 text-white" />
            ) : (
              <FileText className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">
              {plantilla.nombre}
            </h2>
            <p className="text-white/90 mb-3">
              {plantilla.descripcion}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {plantilla.categoria}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Versión {plantilla.version}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {plantilla.secciones.reduce((total, seccion) => total + seccion.campos.length, 0)} campos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="bg-white rounded-2xl border border-blue-400 p-4 sm:p-8 mb-8 w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-black">Progreso del formulario</span>
          <span className="text-sm text-gray-700">
            {Object.keys(datos).length} de {camposVisibles.size} campos completados
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${camposVisibles.size > 0 ? (Object.keys(datos).filter(key => 
                datos[key] !== '' && datos[key] !== null && datos[key] !== undefined
              ).length / camposVisibles.size) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Secciones del formulario */}
      {plantilla.secciones.map(renderSeccion)}

      {/* Información adicional */}
      {plantilla.configuracion && (
        <div className="bg-white rounded-2xl border border-blue-400 p-4 sm:p-8 mb-8 w-full">
          <h4 className="text-sm font-medium text-black mb-2">
            Información de la plantilla
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
            {plantilla.configuracion.permiteArchivosMultiples && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Permite múltiples archivos</span>
              </div>
            )}
            {plantilla.configuracion.tamanoMaximoArchivo && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>
                  Tamaño máximo: {(plantilla.configuracion.tamanoMaximoArchivo / (1024 * 1024)).toFixed(0)}MB
                </span>
              </div>
            )}
            {plantilla.configuracion.tiposArchivosPermitidos && (
              <div className="flex items-center gap-2 col-span-full">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>
                  Tipos permitidos: {plantilla.configuracion.tiposArchivosPermitidos.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón Cancelar */}
      <div className="flex justify-end mt-8">
        <button
          type="button"
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl shadow transition-all duration-200"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard/solicitante/mis-solicitudes';
            }
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
