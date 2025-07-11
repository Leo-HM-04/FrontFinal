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
  onItemsPerPageChange,
  showPageSizeSelector = true
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
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white border-t border-gray-200 shadow-sm rounded-b-xl">
      {/* Información de registros */}
      <div className="text-sm text-gray-600">
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
        {/* Selector de cantidad por página */}
        {onItemsPerPageChange && showPageSizeSelector && (
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <span className="text-xs text-gray-500">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={e => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 rounded border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {[5].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {/* Controles de paginación */}
        <div className="flex items-center gap-1 w-full justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-full border-none text-blue-600 hover:bg-blue-500 disabled:text-gray-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-400">...</span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-150 font-bold shadow-md ${
                      currentPage === page 
                        ? '!bg-blue-600 !text-white !border-blue-600 !shadow-lg !scale-110' 
                        : 'text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-400'
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
            className="flex items-center gap-1 px-3 py-2 rounded-full border-none text-blue-600 hover:bg-blue-100 disabled:text-gray-400"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
