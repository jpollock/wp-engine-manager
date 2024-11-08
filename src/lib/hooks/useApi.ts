// src/lib/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Logger } from '@/lib/logger';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  request: (endpoint: string, options?: RequestInit) => Promise<T>;
}
function isError(error: unknown): error is Error {
    return error instanceof Error;
  }


  
export function useApi<T>(): ApiResponse<T> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await api.fetch<T>(endpoint, options);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      Logger.error(`API Hook Error: ${endpoint}`, isError(error) ? error : new Error(String(error)));
      const apiError = error instanceof Error ? error : new Error('Unknown error occurred');
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  return {
    ...state,
    request,
  };
}