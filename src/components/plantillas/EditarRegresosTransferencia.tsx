import React from 'react';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';

import { FormularioPlantilla } from '@/components/plantillas/FormularioPlantilla';
import { PlantillaSolicitud, EstadoPlantilla } from '@/types/plantillas';

interface EditarRegresosTransferenciaProps {
  plantilla: PlantillaSolicitud;
  datosPlantilla: Record<string, unknown>;
  onGuardar?: () => void;
  actualizarCampo: (campoId: string, valor: unknown) => void;
  estado: EstadoPlantilla;
}

export default function EditarRegresosTransferencia({ plantilla, onGuardar, actualizarCampo, estado }: EditarRegresosTransferenciaProps) {
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
