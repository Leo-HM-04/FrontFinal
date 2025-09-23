import { useEffect } from 'react';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud } from '@/types/plantillas';

interface EditarN09TokaProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
}

export default function EditarN09Toka({ plantilla, datosPlantilla }: EditarN09TokaProps) {
  const {
    estado,
    seleccionarPlantilla,
    actualizarCampo
  } = usePlantillaSolicitud();

  // Selecciona la plantilla y prellena los datos al montar
  useEffect(() => {
    if (plantilla) {
      seleccionarPlantilla(plantilla);
      setTimeout(() => {
        Object.entries(datosPlantilla).forEach(([campo, valor]) => {
          actualizarCampo(campo, valor);
        });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla]);

  return (
    <FormularioPlantilla
      plantilla={plantilla}
      datos={estado.datos}
      errores={estado.errores}
      camposVisibles={estado.camposVisibles}
      onCambiarCampo={actualizarCampo}
    />
  );
}
