import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud, EstadoPlantilla } from '@/types/plantillas';

interface EditarRegresosTransferenciaProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
  actualizarCampo: (campoId: string, valor: unknown) => void;
  estado: EstadoPlantilla;
}

export default function EditarRegresosTransferencia({ plantilla, datosPlantilla, onGuardar, actualizarCampo, estado }: EditarRegresosTransferenciaProps) {
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
