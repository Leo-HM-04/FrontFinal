"use client";
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarRegresosTransferencia from '@/components/plantillas/EditarRegresosTransferencia';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarRegresosTransferenciaPage() {
  const router = useRouter();
  const params = useParams() ?? {};
  const solicitudId = Number(params?.id ?? 0);
  const plantillaRegresos = plantillasDisponibles.find(p => p.id === 'regresos-transferencia');
  const plantillaHook = usePlantillaSolicitud();
  const { estado, seleccionarPlantilla, actualizarCampo } = plantillaHook;


  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const s = await SolicitudesService.getById(solicitudId);

        let datosRegresos: Record<string, unknown> = {};
        if (s.plantilla_datos) {
          try {
            datosRegresos = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
          } catch (err) {
            console.error('❌ Error parseando plantilla_datos REGRESOS:', err);
          }
        }
        if (plantillaRegresos && datosRegresos.templateType === 'regresos-transferencia') {
          seleccionarPlantilla(plantillaRegresos);
          Object.entries(datosRegresos).forEach(([campo, valor]) => {
            actualizarCampo(campo, valor);
          });
        }
      } catch (err) {
        console.error('❌ Error obteniendo solicitud:', err);
      }
    }
    if (solicitudId) fetchSolicitud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudId]);

  const handleGuardar = async () => {
    try {
      await SolicitudesService.updatePlantilla({
        id: solicitudId,
        plantilla_datos: JSON.stringify(estado.datos)
      });
      alert('Cambios guardados correctamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (err) {
      alert('Error al guardar los cambios');
      console.error('Error al guardar solicitud REGRESOS:', err);
    }
  };

  return (
    <SolicitanteLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Solicitud REGRESOS EN TRANSFERENCIA</h1>
        {plantillaRegresos && (
          <EditarRegresosTransferencia
            plantilla={plantillaRegresos}
            datosPlantilla={estado.datos}
            onGuardar={handleGuardar}
            actualizarCampo={actualizarCampo}
            estado={estado}
          />
        )}
      </div>
    </SolicitanteLayout>
  );
}
