import { useRef } from 'react';

/**
 * Hook that returns true only on the first call when data becomes available.
 * Useful for triggering one-time actions after initial data load.
 *
 * @param isLoaded Whether the data has loaded (e.g., !loading && data !== null)
 * @returns true only once, when isLoaded first becomes true
 */
export function useIsInitialLoad(isLoaded: boolean): boolean {
  const hasTriggeredRef = useRef(false);

  if (isLoaded && !hasTriggeredRef.current) {
    hasTriggeredRef.current = true;
    return true;
  }

  return false;
}
