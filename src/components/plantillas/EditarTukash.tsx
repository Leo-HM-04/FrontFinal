
import { useEffect } from 'react';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud } from '@/types/plantillas';
interface EditarTukashProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
}

export default function EditarTukash({ plantilla, datosPlantilla, onGuardar }: EditarTukashProps) {
  const {
    estado,
    seleccionarPlantilla,
    actualizarCampo
  } = usePlantillaSolicitud();

  // Selecciona la plantilla y prellena los datos al montar
  useEffect(() => {
    // Solo prellenar si el estado está vacío (no hay datos previos del usuario)
    if (
      plantilla &&
      datosPlantilla &&
      Object.keys(datosPlantilla).length > 0 &&
      Object.keys(estado.datos).length === 0
    ) {
      seleccionarPlantilla(plantilla);
      setTimeout(() => {
        Object.entries(datosPlantilla).forEach(([campo, valor]) => {
          actualizarCampo(campo, valor);
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla, datosPlantilla, estado.datos]);

  return (
    <FormularioPlantilla
      plantilla={plantilla}
      datos={estado.datos}
      errores={estado.errores}
      camposVisibles={estado.camposVisibles}
      onCambiarCampo={actualizarCampo}
      onGuardar={onGuardar}
    />
  );
}
