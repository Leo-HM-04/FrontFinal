import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live en minutos
  key: string;
}

export function useCache<T>(options: CacheOptions) {
  const { ttl = 5, key } = options; // TTL por defecto: 5 minutos
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getFromCache = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const isExpired = (now - timestamp) > (ttl * 60 * 1000);

      if (isExpired) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }, [key, ttl]);

  const setCache = useCallback((newData: T) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data: newData,
        timestamp: Date.now()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
      setData(newData);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }, [key]);

  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`cache_${key}`);
    setData(null);
  }, [key]);

  const fetchWithCache = useCallback(async (fetchFn: () => Promise<T>) => {
    setIsLoading(true);
    
    // Intentar obtener del caché primero
    const cached = getFromCache();
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return cached;
    }

    // Si no hay caché, hacer fetch
    try {
      const result = await fetchFn();
      setCache(result);
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getFromCache, setCache]);

  useEffect(() => {
    // Cargar del caché al montar
    const cached = getFromCache();
    if (cached) {
      setData(cached);
    }
  }, [getFromCache]);

  return {
    data,
    isLoading,
    setCache,
    clearCache,
    fetchWithCache
  };
}
