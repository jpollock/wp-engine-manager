import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Logger } from '@/lib/logger';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T>(initialData: T | null = null) {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const request = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await api.fetch<T>(endpoint, options);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      Logger.error(`API Hook Error: ${endpoint}`, error);
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, []);

  return {
    ...state,
    request,
  };
}