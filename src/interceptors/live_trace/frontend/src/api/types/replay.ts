// API Types for replay endpoints

export interface ReplayConfig {
  api_key_available: boolean;
  api_key_source?: string;
  api_key_masked?: string;
  base_url: string;
  provider_type: 'openai' | 'anthropic';
}

export interface ModelsResponse {
  models: {
    openai: string[];
    anthropic: string[];
  };
  error?: string;
}

export interface ReplayRequestData {
  model: string;
  messages: Array<{
    role: string;
    content: unknown;
  }>;
  temperature?: number;
  max_tokens?: number;
  system?: string;
  tools?: unknown[];
}

export interface ReplayRequest {
  provider: 'openai' | 'anthropic';
  base_url?: string;
  request_data: ReplayRequestData;
  api_key?: string;
}

export interface ReplayTokenUsage {
  prompt_tokens?: number;
  input_tokens?: number;
  completion_tokens?: number;
  output_tokens?: number;
  total_tokens: number;
}

export interface ReplayContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  name?: string;
  input?: unknown;
}

export interface ReplayParsedResponse {
  model: string;
  finish_reason: string;
  usage: ReplayTokenUsage;
  content: ReplayContentBlock[];
}

export interface ReplayCost {
  input: number;
  output: number;
  total: number;
}

export interface ReplayResponse {
  parsed: ReplayParsedResponse;
  raw_response: unknown;
  elapsed_ms: number;
  cost?: ReplayCost;
  error?: string;
  details?: string;
}
