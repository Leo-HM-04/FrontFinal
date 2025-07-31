import { useState, useCallback } from 'react';

export interface GroupPaginationState {
  currentPage: number;
  totalPages: number;
}

export interface UseGroupPaginationResult {
  getPage: (groupId: string | number) => number;
  getTotalPages: (groupId: string | number) => number;
  goToPage: (groupId: string | number, page: number) => void;
  resetAll: () => void;
}

/**
 * Hook para manejar paginación local por grupo (por ejemplo, por usuario).
 * - Mantiene currentPage y totalPages por cada groupId.
 * - No usa any, todo tipado estricto.
 */
export function useGroupPagination<T extends object>(
  groups: Record<string, T[]>,
  itemsPerPage: number
): UseGroupPaginationResult {
  const [pages, setPages] = useState<Record<string, number>>({});

  const getPage = useCallback((groupId: string | number) => {
    return pages[groupId as string] || 1;
  }, [pages]);

  const getTotalPages = useCallback((groupId: string | number) => {
    const arr = groups[groupId as string] || [];
    return Math.max(1, Math.ceil(arr.length / itemsPerPage));
  }, [groups, itemsPerPage]);

  const goToPage = useCallback((groupId: string | number, page: number) => {
    setPages(prev => ({ ...prev, [groupId]: page }));
  }, []);

  const resetAll = useCallback(() => {
    setPages({});
  }, []);

  return { getPage, getTotalPages, goToPage, resetAll };
}
