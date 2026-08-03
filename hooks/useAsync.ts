import { useState, useEffect, useCallback, useRef } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isEmpty: boolean;
  /** Veriyi yeniden yükler */
  refetch: () => void;
}

interface UseAsyncOptions<T> {
  /** İlk render'da otomatik çalıştır (varsayılan: true) */
  immediate?: boolean;
  /** Boşluk kontrolü için özel fonksiyon */
  isEmpty?: (data: T) => boolean;
}

/**
 * Herhangi bir async fonksiyonunu sarıp loading / error / empty durumlarını
 * tutarlı şekilde yönetir.
 *
 * @example
 * const { data, isLoading, isError, isEmpty, refetch } = useAsync(
 *   () => api.listings.list({ page: 1 }),
 *   { isEmpty: (d) => d.items.length === 0 }
 * );
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): AsyncState<T> {
  const { immediate = true, isEmpty: isEmptyFn } = options;

  const [status, setStatus] = useState<AsyncStatus>(
    immediate ? 'loading' : 'idle'
  );
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fn değiştiğinde stale closure sorununu önle
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const execute = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
      setStatus('success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const isEmpty = (() => {
    if (status !== 'success' || data === null) return false;
    if (isEmptyFn) return isEmptyFn(data);
    if (Array.isArray(data)) return data.length === 0;
    return false;
  })();

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    isEmpty,
    refetch: execute,
  };
}
