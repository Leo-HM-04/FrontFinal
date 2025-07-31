import { useState, useCallback } from 'react';

export interface UserPaginationState {
  currentPage: number;
  itemsPerPage: number;
}

export interface UseUserPaginationResult {
  getPage: (userId: string | number) => number;
  getItemsPerPage: (userId: string | number) => number;
  setPage: (userId: string | number, page: number) => void;
  setItemsPerPage: (userId: string | number, items: number) => void;
  resetAll: () => void;
}

/**
 * Hook para manejar paginación local por usuario.
 * - currentPage e itemsPerPage por cada userId.
 * - Tipado estricto, sin any.
 */
export function useUserPagination(
  userIds: Array<string | number>,
  defaultItemsPerPage: number = 5
): UseUserPaginationResult {
  const [state, setState] = useState<Record<string, UserPaginationState>>(() => {
    const initial: Record<string, UserPaginationState> = {};
    userIds.forEach(id => {
      initial[String(id)] = { currentPage: 1, itemsPerPage: defaultItemsPerPage };
    });
    return initial;
  });

  const getPage = useCallback((userId: string | number) => {
    return state[String(userId)]?.currentPage || 1;
  }, [state]);

  const getItemsPerPage = useCallback((userId: string | number) => {
    return state[String(userId)]?.itemsPerPage || defaultItemsPerPage;
  }, [state, defaultItemsPerPage]);

  const setPage = useCallback((userId: string | number, page: number) => {
    setState(prev => ({
      ...prev,
      [String(userId)]: {
        ...prev[String(userId)],
        currentPage: page
      }
    }));
  }, []);

  const setItemsPerPage = useCallback((userId: string | number, items: number) => {
    setState(prev => ({
      ...prev,
      [String(userId)]: {
        ...prev[String(userId)],
        itemsPerPage: items
      }
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({});
  }, []);

  return { getPage, getItemsPerPage, setPage, setItemsPerPage, resetAll };
}
