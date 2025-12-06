import type {
  ReplayConfig,
  ModelsResponse,
  ReplayRequest,
  ReplayResponse,
} from '../types/replay';

export const fetchReplayConfig = async (): Promise<ReplayConfig> => {
  const response = await fetch('/api/replay/config');
  if (!response.ok) {
    throw new Error(`Failed to fetch replay config: ${response.statusText}`);
  }
  return response.json();
};

export const fetchModels = async (): Promise<ModelsResponse> => {
  const response = await fetch('/api/models');
  if (!response.ok) {
    // Models endpoint is optional - return empty on failure
    return { models: { openai: [], anthropic: [] } };
  }
  const data = await response.json();
  if (data.error) {
    return { models: { openai: [], anthropic: [] } };
  }
  return data;
};

export const sendReplay = async (request: ReplayRequest): Promise<ReplayResponse> => {
  const response = await fetch('/api/replay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error + (data.details ? '\n' + data.details : ''));
  }
  return data;
};
