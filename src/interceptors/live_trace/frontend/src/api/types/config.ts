// API Types for /api/config endpoint

export type StorageMode = 'memory' | 'sqlite';

export interface ConfigResponse {
  provider_type: string;
  provider_base_url: string;
  proxy_host: string;
  proxy_port: number;
  storage_mode: StorageMode;
  db_path: string | null;
}
