"use client";
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarComisiones from '@/components/plantillas/EditarComisiones';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarComisionesPage() {
  const router = useRouter();
  const params = useParams() ?? {};
  const solicitudId = Number(params?.id ?? 0);
  const { estado, seleccionarPlantilla, actualizarCampo } = usePlantillaSolicitud();

  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const s = await SolicitudesService.getById(solicitudId);
        // Detectar plantilla COMISIONES
        const plantilla = plantillasDisponibles.find(p => p.id === 'pago-comisiones');
        if (plantilla) {
          let datos: Record<string, unknown> = {};
          if (s.plantilla_datos) {
            try {
              datos = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
            } catch (err) {
              // Si hay error, datos queda vacío
            }
          }
          seleccionarPlantilla(plantilla, datos);
        }
      } catch (err) {
        console.error('❌ Error obteniendo solicitud:', err);
      }
    }
    if (solicitudId) fetchSolicitud();
  }, [solicitudId, actualizarCampo, seleccionarPlantilla]);

  // Handler para guardar cambios
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
      console.error('Error al guardar solicitud COMISIONES:', err);
    }
  };

  return (
    <SolicitanteLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Pago de Comisiones</h1>
        <EditarComisiones
          plantilla={plantillasDisponibles.find(p => p.id === 'pago-comisiones')!}
          datosPlantilla={estado.datos}
          estado={estado}
          actualizarCampo={actualizarCampo}
          onGuardar={handleGuardar}
        />
      </div>
    </SolicitanteLayout>
  );
}
