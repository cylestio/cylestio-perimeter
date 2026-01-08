// API Types for /health endpoint

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}
