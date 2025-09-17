import React, { useState } from 'react';
import { PlantillaSolicitud } from '@/types/plantillas';

interface SelectorPlantillasProps {
  plantillas: PlantillaSolicitud[];
  plantillaSeleccionada: PlantillaSolicitud | null;
  onSeleccionar: (plantilla: PlantillaSolicitud | null) => void;
  className?: string;
}

export const SelectorPlantillas: React.FC<SelectorPlantillasProps> = ({
  plantillas,
  plantillaSeleccionada,
  onSeleccionar,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleSeleccionar = (plantilla: PlantillaSolicitud | null) => {
    onSeleccionar(plantilla);
    // Opcional: colapsar después de seleccionar
    setIsExpanded(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botón principal para expandir/colapsar la selección de plantillas */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">
                {plantillaSeleccionada ? (plantillaSeleccionada.icono || '📋') : '📋'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {plantillaSeleccionada ? plantillaSeleccionada.nombre : 'Seleccionar Plantilla de Solicitud'}
              </h3>
              <p className="text-sm text-gray-500">
                {plantillaSeleccionada 
                  ? 'Plantilla personalizada seleccionada' 
                  : 'Haz clic para ver opciones disponibles'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {plantillaSeleccionada && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeleccionar(null);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Quitar
              </button>
            )}
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sección expandible con las plantillas */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top duration-300 ease-out">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="mb-3">
              <p className="text-sm text-gray-600 font-medium">
                Selecciona una plantilla o usa el formulario estándar:
              </p>
            </div>
      
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {/* Opción para formulario estándar */}
        <div
          onClick={() => handleSeleccionar(null)}
          className={`relative cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
            !plantillaSeleccionada
              ? 'border-blue-500 bg-blue-50 shadow'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-base">📄</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Formulario Estándar
                </h4>
                <p className="text-xs text-gray-500">Sistema general</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Utiliza el formulario tradicional con campos personalizables
            </p>
            {!plantillaSeleccionada && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plantillas disponibles */}
        {plantillas.map((plantilla) => (
          <div
            key={plantilla.id}
            onClick={() => handleSeleccionar(plantilla)}
            className={`relative cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
              plantillaSeleccionada?.id === plantilla.id
                ? 'border-blue-500 bg-blue-50 shadow'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                  plantilla.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <span className="text-base">{plantilla.icono || '📋'}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">
                    {plantilla.nombre}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {plantilla.categoria || 'Sin categoría'}
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                {plantilla.descripcion}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>v{plantilla.version}</span>
                <span>{plantilla.metadatos?.usosFrecuentes || 0} usos</span>
              </div>
              {plantillaSeleccionada?.id === plantilla.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
          </div>
        </div>
      )}
      
      {plantillaSeleccionada && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                Plantilla seleccionada: {plantillaSeleccionada.nombre}
              </h4>
              <p className="text-sm text-blue-700">
                {plantillaSeleccionada.descripcion}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {plantillaSeleccionada.secciones.map((seccion) => (
                  <span
                    key={seccion.id}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {seccion.titulo} ({seccion.campos.length} campos)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
