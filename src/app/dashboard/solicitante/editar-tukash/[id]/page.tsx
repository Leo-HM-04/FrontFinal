"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarTukash from '@/components/plantillas/EditarTukash';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import { obtenerDatosPlantilla } from '@/utils/plantillasLabels';
import type { Solicitud } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarTukashPage() {
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
          // Forzar plantilla TUKASH si templateType es tarjetas-tukash
          let datosTukash: Record<string, unknown> = {};
          if (s.plantilla_datos) {
            try {
              datosTukash = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
            } catch (err) {
              console.error('❌ Error parseando plantilla_datos TUKASH:', err);
            }
          }
          if (datosTukash.templateType === 'tarjetas-tukash') {
            const plantillaTukash = plantillasDisponibles.find(p => p.id === 'tarjetas-tukash');
            if (plantillaTukash) {
              seleccionarPlantilla(plantillaTukash);
              // Mapeo robusto de campos
              if (datosTukash.beneficiario && !datosTukash.beneficiario_tarjeta) {
                datosTukash.beneficiario_tarjeta = datosTukash.beneficiario;
              }
              if (datosTukash.monto && !datosTukash.monto_total_tukash) {
                datosTukash.monto_total_tukash = datosTukash.monto;
              }
              setTimeout(() => {
                Object.entries(datosTukash).forEach(([campo, valor]) => {
                  actualizarCampo(campo, valor);
                });
              }, 100);
            }
          }
        } catch (err) {
          console.error('❌ Error obteniendo solicitud:', err);
        }
      }
      if (solicitudId) fetchSolicitud();
    }, [solicitudId]);

  // Renderizar el formulario de edición TUKASH
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Solicitud TUKASH</h1>
      <EditarTukash
        plantilla={plantillasDisponibles.find(p => p.id === 'tarjetas-tukash')!}
        datosPlantilla={estado.datos}
      />
    </div>
  );
}
