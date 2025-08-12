"use client";
import { useEffect, useState, useCallback } from 'react';
import { ViaticosService } from '@/services/viaticos.service';

export type Viatico = {
  id_viatico: number;
  folio: string;
  departamento: string;
  monto: number;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  fecha_limite_pago: string;
  estado: string;
  comentario_aprobador?: string;
  viatico_url?: string;
  tipo_pago_descripcion?: string;
  empresa_a_pagar?: string;
  nombre_persona: string;
  tipo_cuenta_destino?: string;
  tipo_tarjeta?: string;
  banco_destino?: string;
  [key: string]: string | number | boolean | undefined | null;
};

export function useViaticos() {
  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViaticos = useCallback(() => {
    setLoading(true);
    ViaticosService.getAll()
      .then(setViaticos)
      .catch((err) => setError(err.message || 'Error al obtener viáticos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchViaticos();
  }, [fetchViaticos]);

  return { viaticos, loading, error, refetch: fetchViaticos };
}

export function useViaticosPagados() {
  const [viaticos, setViaticos] = useState<Viatico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViaticos = useCallback(() => {
    setLoading(true);
    ViaticosService.getPagados()
      .then(setViaticos)
      .catch((err) => setError(err.message || 'Error al obtener viáticos pagados'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchViaticos();
  }, [fetchViaticos]);

  return { viaticos, loading, error, refetch: fetchViaticos };
}
