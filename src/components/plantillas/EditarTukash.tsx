

import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud } from '@/types/plantillas';
import { EstadoPlantilla } from '@/types/plantillas';
interface EditarTukashProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
  actualizarCampo: (campoId: string, valor: unknown) => void;
  estado: EstadoPlantilla;
}

export default function EditarTukash({ plantilla, onGuardar, actualizarCampo, estado }: EditarTukashProps) {
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
