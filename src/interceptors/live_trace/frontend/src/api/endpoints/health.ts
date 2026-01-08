import type { HealthResponse } from '../types/health';

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch('/health');
  if (!response.ok) {
    throw new Error(`Failed to fetch health: ${response.statusText}`);
  }
  return response.json();
};
