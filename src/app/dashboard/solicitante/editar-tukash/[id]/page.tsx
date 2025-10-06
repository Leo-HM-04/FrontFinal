"use client";
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import EditarTukash from '@/components/plantillas/EditarTukash';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import type { Solicitud } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarTukashPage() {
  const router = useRouter();
  const params = useParams() ?? {};
  const solicitudId = Number(params?.id ?? 0);
  const plantillaTukash = plantillasDisponibles.find(p => p.id === 'tarjetas-tukash');
  const plantillaHook = usePlantillaSolicitud();
  const { estado, seleccionarPlantilla, actualizarCampo } = plantillaHook;
  // const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const s = await SolicitudesService.getById(solicitudId);
        // setSolicitud(s);
        let datosTukash: Record<string, unknown> = {};
        if (s.plantilla_datos) {
          try {
            datosTukash = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
          } catch (_err) {
            // Si hay error, datosTukash queda vacío
          }
        }
        if (plantillaTukash) {
          seleccionarPlantilla(plantillaTukash, datosTukash);
        }
      } catch (_err) {
        // Si hay error, no autocompleta
      }
    }
    if (solicitudId) fetchSolicitud();
  }, [solicitudId, plantillaTukash, seleccionarPlantilla]);

  // Handler para guardar cambios
  const handleGuardar = async () => {
    try {
      console.log('Datos que se guardarán en plantilla_datos:', estado.datos);
      await SolicitudesService.updatePlantilla({
        id: solicitudId,
        plantilla_datos: JSON.stringify(estado.datos)
      });
      alert('Cambios guardados correctamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (_err) {
      alert('Error al guardar los cambios');
      console.error('Error al guardar solicitud TUKASH:', _err);
    }
  };

  return (
    <SolicitanteLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Editar Solicitud TUKASH</h1>
        {plantillaTukash && (
          <EditarTukash
            plantilla={plantillaTukash}
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
