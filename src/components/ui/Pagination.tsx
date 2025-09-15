import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showPageSizeSelector?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 1; // Solo 1 página a cada lado para móvil
    const range = [];
    const rangeWithDots = [];

    // En móvil, solo mostrar página actual y adyacentes
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Mostrar siempre la paginación, incluso si solo hay una página
  return (
    <div className="w-full bg-white border-t border-gray-200 rounded-b-xl">
      {/* Información de registros */}
      <div className="px-2 sm:px-6 py-2 sm:py-4">
        <div className="text-xs sm:text-sm text-gray-700 font-medium text-center">
          Mostrando {startItem} a {endItem} de {totalItems} resultados
        </div>
      </div>

      {/* Paginador Móvil - Ultra compacto */}
      <div className="flex sm:hidden items-center justify-center gap-1 px-1 py-2 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          <ChevronLeft className="w-3 h-3" />
        </Button>
        
        <div className="flex items-center">
          <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium">
            {currentPage}/{totalPages}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Paginador Desktop - Completo */}
      <div className="hidden sm:flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-2 mx-4">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500 font-medium text-sm">...</span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg border-2 transition-all duration-200 font-semibold text-sm ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                      : 'bg-gray-100 text-blue-600 border-gray-300 hover:bg-blue-100 hover:border-blue-400 shadow-sm hover:shadow-md'
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
