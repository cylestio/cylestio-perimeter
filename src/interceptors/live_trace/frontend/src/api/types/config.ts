// API Types for /api/config endpoint

export interface ConfigResponse {
  provider_type: string;
  provider_base_url: string;
  proxy_host: string;
  proxy_port: number;
}
