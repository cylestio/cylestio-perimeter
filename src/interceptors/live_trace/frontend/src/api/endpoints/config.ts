import type { ConfigResponse } from '../types/config';

export const fetchConfig = async (): Promise<ConfigResponse> => {
  const response = await fetch('/api/config');
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }
  return response.json();
};
