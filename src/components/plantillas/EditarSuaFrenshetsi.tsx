import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud, EstadoPlantilla } from '@/types/plantillas';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';

interface EditarSuaFrenshetsiProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
  actualizarCampo: (campoId: string, valor: unknown) => void;
  estado: EstadoPlantilla;
}

export default function EditarSuaFrenshetsi({ plantilla, onGuardar, actualizarCampo, estado }: EditarSuaFrenshetsiProps) {
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
