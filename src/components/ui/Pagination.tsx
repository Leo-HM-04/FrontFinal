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
    const delta = window.innerWidth < 640 ? 1 : 2; // Menos páginas en móvil
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
    <div className="flex flex-col gap-2 sm:gap-4 p-2 sm:p-3 lg:p-6 bg-white border-t border-gray-200 rounded-b-xl">
      {/* Información de registros - más compacta en móvil */}
      <div className="text-xs sm:text-sm text-gray-700 font-medium text-center">
        Mostrando {startItem} a {endItem} de {totalItems} resultados
      </div>

      {/* Layout móvil vs desktop completamente diferente */}
      <div className="flex flex-col sm:hidden gap-2">
        {/* Versión móvil simplificada */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="w-3 h-3" />
            Primera
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            
            <span className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded min-w-[60px] text-center">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 disabled:opacity-50"
          >
            Última
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Versión desktop (oculta en móvil) */}
      <div className="hidden sm:flex items-center justify-center gap-2">
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

        {/* Números de página para desktop */}
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
