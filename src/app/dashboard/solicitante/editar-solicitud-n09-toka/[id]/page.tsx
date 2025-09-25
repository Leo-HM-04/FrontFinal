"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditarN09Toka from '@/components/plantillas/EditarN09Toka';
import { plantillasDisponibles } from '@/data/plantillas';
import { usePlantillaSolicitud } from '@/hooks/usePlantillaSolicitud';
import type { Solicitud } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';

export default function EditarN09TokaPage() {
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
        // Detectar plantilla N09/TOKA
        const plantillaN09Toka = plantillasDisponibles.find(p => p.id === 'tarjetas-n09-toka');
        if (plantillaN09Toka) {
          seleccionarPlantilla(plantillaN09Toka);
          // Prellenar datos desde plantilla_datos
          let datosN09Toka: Record<string, unknown> = {};
          if (s.plantilla_datos) {
            try {
              datosN09Toka = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
            } catch (err) {
              console.error('❌ Error parseando plantilla_datos N09/TOKA:', err);
            }
          }
          setTimeout(() => {
            Object.entries(datosN09Toka).forEach(([campo, valor]) => {
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

  // Renderizar el formulario de edición N09/TOKA
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Solicitud N09/TOKA</h1>
      <EditarN09Toka
        plantilla={plantillasDisponibles.find(p => p.id === 'tarjetas-n09-toka')!}
        datosPlantilla={estado.datos}
        estado={estado}
        actualizarCampo={actualizarCampo}
      />
    </div>
  );
}
