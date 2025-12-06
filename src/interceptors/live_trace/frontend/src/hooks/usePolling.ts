import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePollingOptions {
  /** Polling interval in milliseconds */
  interval?: number;
  /** Whether to start polling immediately */
  enabled?: boolean;
}

interface UsePollingResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for polling data from an async function at regular intervals
 * @param fetchFn Async function that returns the data
 * @param options Polling options
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
): UsePollingResult<T> {
  const { interval = 2000, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (isMounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    isMounted.current = true;

    if (enabled) {
      fetchData();
      const intervalId = setInterval(fetchData, interval);
      return () => {
        isMounted.current = false;
        clearInterval(intervalId);
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchData, interval, enabled]);

  return { data, error, loading, refetch: fetchData };
}
