import type { DashboardResponse } from '../types/dashboard';

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  // Uses relative URL - in dev, Vite proxy forwards to backend
  // In production, configure your server to handle /api routes
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }
  return response.json();
};
