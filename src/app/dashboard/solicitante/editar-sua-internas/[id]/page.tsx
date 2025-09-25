"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarSuaInternas from '@/components/plantillas/EditarSuaInternas';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import type { Solicitud } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarSuaInternasPage() {
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
        // Detectar plantilla SUA INTERNAS
        const plantilla = plantillasDisponibles.find(p => p.id === 'pago-sua-internas');
        if (plantilla) {
          seleccionarPlantilla(plantilla);
          // Prellenar datos desde plantilla_datos
          let datos: Record<string, unknown> = {};
          if (s.plantilla_datos) {
            try {
              datos = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
            } catch (err) {
              console.error('❌ Error parseando plantilla_datos SUA INTERNAS:', err);
            }
          }
          setTimeout(() => {
            Object.entries(datos).forEach(([campo, valor]) => {
              actualizarCampo(campo, valor);
            });
          }, 100);
        }
      } catch (err) {
        console.error('❌ Error obteniendo solicitud:', err);
      }
    }
    if (solicitudId) fetchSolicitud();
  }, [solicitudId]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Pago SUA INTERNAS</h1>
      <EditarSuaInternas
        plantilla={plantillasDisponibles.find(p => p.id === 'pago-sua-internas')!}
        datosPlantilla={estado.datos}
        estado={estado}
        actualizarCampo={actualizarCampo}
      />
    </div>
  );
}
