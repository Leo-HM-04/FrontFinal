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
  const plantillaTukash = plantillasDisponibles.find(p => p.id === 'tarjetas-tukash');
  const plantillaHook = usePlantillaSolicitud();
  const { estado, seleccionarPlantilla, actualizarCampo } = plantillaHook;
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  // Prellenado solo si el estado está vacío
  useEffect(() => {
    async function fetchSolicitud() {
      try {
        const s = await SolicitudesService.getById(solicitudId);
        setSolicitud(s);
        let datosTukash: Record<string, unknown> = {};
        if (s.plantilla_datos) {
          try {
            datosTukash = typeof s.plantilla_datos === 'string' ? JSON.parse(s.plantilla_datos) : s.plantilla_datos;
          } catch (err) {
            console.error('❌ Error parseando plantilla_datos TUKASH:', err);
          }
        }
        if (
          plantillaTukash &&
          datosTukash.templateType === 'tarjetas-tukash' &&
          Object.keys(estado.datos).length === 0
        ) {
          seleccionarPlantilla(plantillaTukash);
          // Mapeo robusto de campos
          if (datosTukash.beneficiario && !datosTukash.beneficiario_tarjeta) {
            datosTukash.beneficiario_tarjeta = datosTukash.beneficiario;
          }
          if (datosTukash.monto && !datosTukash.monto_total_tukash) {
            datosTukash.monto_total_tukash = datosTukash.monto;
          }
          setTimeout(() => {
            if (datosTukash.asunto) actualizarCampo('asunto', datosTukash.asunto);
            if (datosTukash.numero_tarjeta) actualizarCampo('numero_tarjeta', datosTukash.numero_tarjeta);
            if (datosTukash.monto_total_cliente) actualizarCampo('monto_total_cliente', datosTukash.monto_total_cliente);
            if (datosTukash.monto_total_tukash) actualizarCampo('monto_total_tukash', datosTukash.monto_total_tukash);
            if (datosTukash.archivos_adjuntos) actualizarCampo('archivos_adjuntos', datosTukash.archivos_adjuntos);
            Object.entries(datosTukash).forEach(([campo, valor]) => {
              if (!["asunto","numero_tarjeta","monto_total_cliente","monto_total_tukash","archivos_adjuntos"].includes(campo)) {
                actualizarCampo(campo, valor);
              }
            });
          }, 100);
        }
      } catch (err) {
        console.error('❌ Error obteniendo solicitud:', err);
      }
    }
    if (solicitudId) fetchSolicitud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.error('Error al guardar solicitud TUKASH:', err);
    }
  };

  return (
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
  );
}
