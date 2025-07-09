'use client';

import React, { useState } from 'react';
import { Filter, X, Search, Download, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

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

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport?: () => void;
  onReset: () => void;
  type: 'usuarios' | 'solicitudes' | 'pagos' | 'pagosHistorial';
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onExport, 
  onReset, 
  type 
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  const estadoOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'autorizada', label: 'Autorizada' },
    { value: 'rechazada', label: 'Rechazada' }
  ];

  const rolOptions = [
    { value: 'admin_general', label: 'Administrador' },
    { value: 'solicitante', label: 'Solicitante' },
    { value: 'aprobador', label: 'Aprobador' },
    { value: 'pagador_banca', label: 'Pagador' }
  ];

  const departamentoOptions = [
    { value: 'administracion', label: 'Administración' },
    { value: 'atencion_clientes', label: 'Atención a Clientes' },
    { value: 'automatizaciones', label: 'Automatizaciones' },
    { value: 'cobranza', label: 'Cobranza' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'contabilidad', label: 'Contabilidad' },
    { value: 'facturacion', label: 'Facturación' },
    { value: 'nomina', label: 'Nómina' },
    { value: 'tesoreria', label: 'Tesorería' },
    { value: 'ti', label: 'TI' },
    { value: 'vinculacion', label: 'Vinculación' }
  ];


  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 mb-6 animate-slide-up">
      {/* Header de filtros */}
      <div className="p-4 border-b border-white/20">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Búsqueda principal */}
          <div className="relative flex-1 w-full lg:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar ${type === 'usuarios' ? 'usuarios' : 'solicitudes'}...`}
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
            />
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 ${
                hasActiveFilters ? 'border-white/60 bg-white/30' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length}
                </span>
              )}
            </Button>

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center space-x-2 bg-green-500 text-white border-green-500 hover:bg-green-500"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </Button>
            )}

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="flex items-center space-x-2 bg-red-500 text-red-100 border-red-900 hover:bg-red-900"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Limpiar</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="p-4 bg-white/5 backdrop-blur-sm animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {type === 'usuarios' && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Rol</label>
                <select
                  value={filters.rol || ''}
                  onChange={(e) => updateFilter('rol', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                >
                  <option value="" className="text-gray-900">Todos los roles</option>
                  {rolOptions.map(option => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === 'solicitudes' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Estado</label>
                  <select
                    value={filters.estado || ''}
                    onChange={(e) => updateFilter('estado', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                  >
                    <option value="" className="text-gray-900">Todos los estados</option>
                    {estadoOptions.map(option => (
                      <option key={option.value} value={option.value} className="text-gray-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Departamento</label>
                  <select
                    value={filters.departamento || ''}
                    onChange={(e) => updateFilter('departamento', e.target.value || undefined)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                  >
                    <option value="" className="text-gray-900">Todos los departamentos</option>
                    {departamentoOptions.map(option => (
                      <option key={option.value} value={option.value} className="text-gray-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Monto Mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.montoMin || ''}
                    onChange={(e) => updateFilter('montoMin', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Monto Máximo</label>
                  <input
                    type="number"
                    placeholder="999999999"
                    value={filters.montoMax || ''}
                    onChange={(e) => updateFilter('montoMax', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={filters.fechaDesde || ''}
                onChange={(e) => updateFilter('fechaDesde', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={filters.fechaHasta || ''}
                onChange={(e) => updateFilter('fechaHasta', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm"
              />
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-white/80 font-medium">Filtros activos:</span>
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || value === '') return null;
                  
                  let displayValue = value.toString();
                  if (key === 'estado' && type === 'solicitudes') {
                    displayValue = estadoOptions.find(o => o.value === value)?.label || value.toString();
                  } else if (key === 'rol' && type === 'usuarios') {
                    displayValue = rolOptions.find(o => o.value === value)?.label || value.toString();
                  }

                  return (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30"
                    >
                      {key}: {displayValue}
                      <button
                        onClick={() => updateFilter(key as keyof FilterState, undefined)}
                        className="ml-2 hover:text-white/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
