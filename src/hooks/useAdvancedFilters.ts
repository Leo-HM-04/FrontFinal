import { useState, useMemo } from 'react';
import { User, Solicitud, PlantillaRecurrente } from '@/types';


interface FilterState {
  search: string;
  estado?: string;
  rol?: string;
  departamento?: string;
  tipo_pago?: string;
  frecuencia?: string;
  activo?: string; // 'activo', 'inactivo' o undefined
  fechaDesde?: string;
  fechaHasta?: string;
  montoMin?: number;
  montoMax?: number;
}

export function useAdvancedFilters<T extends User | Solicitud | PlantillaRecurrente>(
  data: T[],
  type: 'usuarios' | 'solicitudes' | 'recurrentes'
) {
  const [filters, setFilters] = useState<FilterState>({
    search: ''
  });

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (type === 'usuarios') {
          const user = item as User;
          const searchText = `${user.nombre} ${user.email} ${user.rol}`.toLowerCase();
          if (!searchText.includes(searchTerm)) return false;
        } else if (type === 'solicitudes') {
          const solicitud = item as Solicitud;
          const searchText = `${solicitud.id_solicitud} ${solicitud.departamento} ${solicitud.concepto} ${solicitud.estado}`.toLowerCase();
          if (!searchText.includes(searchTerm)) return false;
        } else if (type === 'recurrentes') {
          const rec = item as PlantillaRecurrente;
          const searchText = `${rec.id_recurrente} ${rec.departamento} ${rec.concepto} ${rec.estado} ${rec.tipo_pago} ${rec.frecuencia} ${rec.nombre_usuario ?? ''}`.toLowerCase();
          if (!searchText.includes(searchTerm)) return false;
        }
      }

      // Filtros específicos para usuarios
      if (type === 'usuarios') {
        const user = item as User;
        if (filters.rol && user.rol !== filters.rol) return false;
        if (filters.fechaDesde) {
          const userDate = new Date(user.creado_en);
          const fromDate = new Date(filters.fechaDesde);
          if (userDate < fromDate) return false;
        }
        if (filters.fechaHasta) {
          const userDate = new Date(user.creado_en);
          const toDate = new Date(filters.fechaHasta);
          toDate.setHours(23, 59, 59, 999);
          if (userDate > toDate) return false;
        }
      }

      // Filtros para solicitudes
      if (type === 'solicitudes') {
        const solicitud = item as Solicitud;
        if (filters.estado && solicitud.estado !== filters.estado) return false;
        if (filters.departamento && solicitud.departamento !== filters.departamento) return false;
        if (filters.montoMin && solicitud.monto < filters.montoMin) return false;
        if (filters.montoMax && solicitud.monto > filters.montoMax) return false;
        if (filters.fechaDesde) {
          const solicitudDate = new Date(solicitud.fecha_creacion);
          const fromDate = new Date(filters.fechaDesde);
          if (solicitudDate < fromDate) return false;
        }
        if (filters.fechaHasta) {
          const solicitudDate = new Date(solicitud.fecha_creacion);
          const toDate = new Date(filters.fechaHasta);
          toDate.setHours(23, 59, 59, 999);
          if (solicitudDate > toDate) return false;
        }
      }

      // Filtros para recurrentes
      if (type === 'recurrentes') {
        const rec = item as PlantillaRecurrente;
        if (filters.estado && rec.estado !== filters.estado) return false;
        if (filters.departamento && rec.departamento !== filters.departamento) return false;
        if (filters.tipo_pago && rec.tipo_pago !== filters.tipo_pago) return false;
        if (filters.frecuencia && rec.frecuencia !== filters.frecuencia) return false;
        if (filters.activo) {
          if (filters.activo === 'activo' && !rec.activo) return false;
          if (filters.activo === 'inactivo' && rec.activo) return false;
        }
        if (filters.montoMin && rec.monto < filters.montoMin) return false;
        if (filters.montoMax && rec.monto > filters.montoMax) return false;
        if (filters.fechaDesde) {
          const recDate = new Date(rec.created_at);
          const fromDate = new Date(filters.fechaDesde);
          if (recDate < fromDate) return false;
        }
        if (filters.fechaHasta) {
          const recDate = new Date(rec.created_at);
          const toDate = new Date(filters.fechaHasta);
          toDate.setHours(23, 59, 59, 999);
          if (recDate > toDate) return false;
        }
      }

      // Filtros específicos para solicitudes
      if (type === 'solicitudes') {
        const solicitud = item as Solicitud;
        
        if (filters.estado && solicitud.estado !== filters.estado) return false;
        
        if (filters.departamento && solicitud.departamento !== filters.departamento) return false;
        
        if (filters.montoMin && solicitud.monto < filters.montoMin) return false;
        
        if (filters.montoMax && solicitud.monto > filters.montoMax) return false;
        
        if (filters.fechaDesde) {
          const solicitudDate = new Date(solicitud.fecha_creacion);
          const fromDate = new Date(filters.fechaDesde);
          if (solicitudDate < fromDate) return false;
        }
        
        if (filters.fechaHasta) {
          const solicitudDate = new Date(solicitud.fecha_creacion);
          const toDate = new Date(filters.fechaHasta);
          toDate.setHours(23, 59, 59, 999);
          if (solicitudDate > toDate) return false;
        }
      }

      return true;
    });
  }, [data, filters, type]);

  const resetFilters = () => {
    setFilters({ search: '' });
  };

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return {
    filters,
    filteredData,
    resetFilters,
    updateFilters
  };
}
