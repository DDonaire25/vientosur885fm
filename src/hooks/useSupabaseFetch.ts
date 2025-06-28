import { useState, useEffect, useCallback } from 'react';

interface UseSupabaseFetchOptions {
  retryCount?: number;
  retryDelay?: number; // ms
}

export function useSupabaseFetch<T = any>(
  fetcher: () => Promise<{ data: T | null; error: any }>,
  deps: any[] = [],
  options: UseSupabaseFetchOptions = {}
) {
  const { retryCount = 2, retryDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let attempts = 0;
    while (attempts <= retryCount) {
      const { data, error } = await fetcher();
      if (!error) {
        setData(data);
        setLoading(false);
        return;
      }
      attempts++;
      if (attempts > retryCount) {
        setError(error);
        setLoading(false);
        return;
      }
      await new Promise(res => setTimeout(res, retryDelay));
    }
  }, deps); // eslint-disable-line

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, deps);

  return { data, error, loading, refetch: fetchData };
}

// Ejemplo de uso:
// const { data: user, error, loading } = useSupabaseFetch(
//   () => supabase.from('usuarios').select('*').eq('id', userId).single(),
//   [userId]
// );
