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
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

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
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-white border-t border-gray-200 rounded-b-xl">
      {/* Información de registros */}
      <div className="text-sm text-gray-700 font-medium">
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">

        {/* Controles de paginación */}
        <div className="flex items-center gap-2 w-full justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-2 mx-4">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-500 font-medium">...</span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg border-2 transition-all duration-200 font-semibold ${
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
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
