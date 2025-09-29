"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarPolizas from '@/components/plantillas/EditarPolizas';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import type { Solicitud } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarPolizasPage() {
  const router = useRouter();
  const params = useParams() ?? {};
  const solicitudId = Number(params?.id ?? 0);
  const { estado, seleccionarPlantilla, actualizarCampo } = usePlantillaSolicitud();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const s = await SolicitudesService.getById(solicitudId);
        setSolicitud(s);
        // Detectar plantilla POLIZAS
        const plantilla = plantillasDisponibles.find(p => p.id === 'pago-polizas-gnp');
        if (plantilla) {
          seleccionarPlantilla(plantilla);
          // Prellenar datos desde plantilla_datos
          let datos: Record<string, unknown> = {};
          if (s.plantilla_datos) {
            try {
              datos = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
            } catch (err) {
              console.error('\u274c Error parseando plantilla_datos POLIZAS:', err);
            }
          }
          Object.entries(datos).forEach(([campo, valor]) => {
            actualizarCampo(campo, valor);
          });
        }
      } catch (err) {
        console.error('❌ Error obteniendo solicitud:', err);
      }
    }
    if (solicitudId) fetchSolicitud();
  }, [solicitudId]);

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
      console.error('Error al guardar solicitud POLIZAS:', err);
    }
  };

  return (
    <SolicitanteLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Pago de Pólizas</h1>
        <EditarPolizas
          plantilla={plantillasDisponibles.find(p => p.id === 'pago-polizas-gnp')!}
          datosPlantilla={estado.datos}
          estado={estado}
          actualizarCampo={actualizarCampo}
          onGuardar={handleGuardar}
        />
      </div>
    </SolicitanteLayout>
  );
}
