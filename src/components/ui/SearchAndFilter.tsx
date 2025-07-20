import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './Button';

interface Filters {
  estado?: string;
  departamento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClearFilters: () => void;
  estadoOptions?: Array<{ value: string; label: string }>;
  departamentoOptions?: Array<{ value: string; label: string }>;
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  estadoOptions = [],
  departamentoOptions = []
}: SearchAndFilterProps) {
  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-light-bg-300 p-4 mb-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por ID, concepto, solicitante..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          {estadoOptions.length > 0 && (
            <select
              value={filters.estado || ''}
              onChange={(e) => onFilterChange({ ...filters, estado: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
            >
              <option value="">Todos los estados</option>
              {estadoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {departamentoOptions.length > 0 && (
            <select
              value={filters.departamento || ''}
              onChange={(e) => onFilterChange({ ...filters, departamento: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
            >
              <option value="">Todos los departamentos</option>
              {departamentoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            placeholder="Fecha desde"
            value={filters.fechaDesde || ''}
            onChange={(e) => onFilterChange({ ...filters, fechaDesde: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
          />

          <input
            type="date"
            placeholder="Fecha hasta"
            value={filters.fechaHasta || ''}
            onChange={(e) => onFilterChange({ ...filters, fechaHasta: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent text-sm"
          />

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              <span>Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Filtros activos:</span>
          {filters.estado && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-blue-100 text-primary-blue-800">
              Estado: {estadoOptions.find(o => o.value === filters.estado)?.label}
            </span>
          )}
          {filters.departamento && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-blue-100 text-secondary-blue-800">
              Depto: {filters.departamento}
            </span>
          )}
          {(filters.fechaDesde || filters.fechaHasta) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-light-bg-400 text-primary-dark">
              Fecha: {filters.fechaDesde || '...'} - {filters.fechaHasta || '...'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
