import { useState, useMemo } from 'react';
import { User, Solicitud } from '@/types';

interface FilterState {
  search: string;
  estado?: string;
  rol?: string;
  departamento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  montoMin?: number;
  montoMax?: number;
}

export function useAdvancedFilters<T extends User | Solicitud>(data: T[], type: 'usuarios' | 'solicitudes') {
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
        } else {
          const solicitud = item as Solicitud;
          const searchText = `${solicitud.id_solicitud} ${solicitud.departamento} ${solicitud.concepto} ${solicitud.estado}`.toLowerCase();
          if (!searchText.includes(searchTerm)) return false;
        }
      }

      // Filtros específicos para usuarios
      if (type === 'usuarios') {
        const user = item as User;
        
        if (filters.rol && user.rol !== filters.rol) return false;
        
        if (filters.fechaDesde) {
          const userDate = new Date(user.created_at);
          const fromDate = new Date(filters.fechaDesde);
          if (userDate < fromDate) return false;
        }
        
        if (filters.fechaHasta) {
          const userDate = new Date(user.created_at);
          const toDate = new Date(filters.fechaHasta);
          toDate.setHours(23, 59, 59, 999); // Incluir todo el día
          if (userDate > toDate) return false;
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
