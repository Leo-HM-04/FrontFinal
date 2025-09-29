import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud, EstadoPlantilla } from '@/types/plantillas';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';

interface EditarPolizasProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
  actualizarCampo: (campoId: string, valor: unknown) => void;
  estado: EstadoPlantilla;
}

export default function EditarPolizas({ plantilla, datosPlantilla, onGuardar, actualizarCampo, estado }: EditarPolizasProps) {
  return (
    <SolicitanteLayout>
      <FormularioPlantilla
        plantilla={plantilla}
        datos={estado.datos}
        errores={estado.errores}
        camposVisibles={estado.camposVisibles}
        onCambiarCampo={actualizarCampo}
        onGuardar={onGuardar}
      />
    </SolicitanteLayout>
  );
}
