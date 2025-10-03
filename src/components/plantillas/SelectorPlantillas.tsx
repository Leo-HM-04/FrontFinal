import React, { useState } from 'react';
import { PlantillaSolicitud } from '@/types/plantillas';
import { FileText, Clock, Wrench } from 'lucide-react';

interface SelectorPlantillasProps {
  plantillas: PlantillaSolicitud[];
  plantillasInactivas?: PlantillaSolicitud[];
  plantillaSeleccionada: PlantillaSolicitud | null;
  onSeleccionar: (plantilla: PlantillaSolicitud | null) => void;
  className?: string;
}

export const SelectorPlantillas: React.FC<SelectorPlantillasProps> = ({
  plantillas,
  plantillasInactivas = [],
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
        className="cursor-pointer bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-base sm:text-lg">
                {plantillaSeleccionada ? (
                  typeof plantillaSeleccionada.icono === 'string' ? (
                    plantillaSeleccionada.icono
                  ) : plantillaSeleccionada.icono ? (
                    <plantillaSeleccionada.icono className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  )
                ) : (
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                {plantillaSeleccionada ? plantillaSeleccionada.nombre : 'Seleccionar Plantilla'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {plantillaSeleccionada 
                  ? 'Plantilla personalizada' 
                  : 'Toca para ver opciones'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {plantillaSeleccionada && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeleccionar(null);
                }}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium px-2 sm:px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                Quitar
              </button>
            )}
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sección expandible con las plantillas */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top duration-300 ease-out">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Selecciona una plantilla o usa el formulario estándar:
              </p>
            </div>
      
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {/* Opción para formulario estándar */}
        <div
          onClick={() => handleSeleccionar(null)}
          className={`relative cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
            !plantillaSeleccionada
              ? 'border-blue-500 bg-blue-50 shadow'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="p-2 sm:p-3">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-sm sm:text-base">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight truncate">
                  Formulario Estándar
                </h4>
                <p className="text-xs text-gray-500 truncate">Sistema general</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              Formulario tradicional con campos personalizables
            </p>
            {!plantillaSeleccionada && (
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="p-2 sm:p-3">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded flex items-center justify-center ${
                  plantilla.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {typeof plantilla.icono === 'string' ? (
                    <span className="text-sm sm:text-base">{plantilla.icono}</span>
                  ) : plantilla.icono ? (
                    <plantilla.icono className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  ) : (
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight truncate">
                    {plantilla.nombre}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {plantilla.categoria || 'Sin categoría'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1 sm:mb-2 line-clamp-2">
                {plantilla.descripcion}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>v{plantilla.version}</span>
                <span className="truncate">{plantilla.metadatos?.usosFrecuentes || 0} usos</span>
              </div>
              {plantillaSeleccionada?.id === plantilla.id && (
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Plantillas en desarrollo (desactivadas) */}
        {plantillasInactivas.length > 0 && (
          <>
            {plantillasInactivas.map((plantilla) => (
              <div
                key={`inactive-${plantilla.id}`}
                className="relative rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 opacity-75 cursor-not-allowed"
              >
                <div className="p-2 sm:p-3">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded flex items-center justify-center">
                      <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-orange-800 text-xs sm:text-sm leading-tight truncate">
                        {plantilla.nombre}
                      </h4>
                      <p className="text-xs text-orange-600 truncate">
                        En desarrollo
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700 mb-1 sm:mb-2 line-clamp-2">
                    {plantilla.descripcion}
                  </p>
                  <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">Próximamente disponible</span>
                  </div>
                  
                  {/* Icono de desarrollo */}
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <Wrench className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Overlay con mensaje profesional */}
                <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                  <div className="text-center p-2">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-xs sm:text-sm font-semibold text-orange-800">
                      En Desarrollo
                    </p>
                    <p className="text-xs text-orange-700">
                      Estará disponible pronto
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
          </div>
        </div>
      )}
      
      {plantillaSeleccionada && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">
                Plantilla: {plantillaSeleccionada.nombre}
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 line-clamp-2">
                {plantillaSeleccionada.descripcion}
              </p>
              <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-2">
                {plantillaSeleccionada.secciones.slice(0, 2).map((seccion) => (
                  <span
                    key={seccion.id}
                    className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {seccion.titulo} ({seccion.campos.length})
                  </span>
                ))}
                {plantillaSeleccionada.secciones.length > 2 && (
                  <span className="text-xs text-blue-700">
                    +{plantillaSeleccionada.secciones.length - 2} más
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
