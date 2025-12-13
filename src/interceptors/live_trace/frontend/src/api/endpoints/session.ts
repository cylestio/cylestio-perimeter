import type { SessionResponse, SessionsListResponse, LiveSessionStatus } from '../types/session';

export const fetchSession = async (sessionId: string): Promise<SessionResponse> => {
  const response = await fetch(`/api/session/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};

export interface FetchSessionsParams {
  agent_id?: string;
  system_prompt_id?: string;
  status?: LiveSessionStatus;
  limit?: number;
  offset?: number;
}

export const fetchSessions = async (params?: FetchSessionsParams): Promise<SessionsListResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.agent_id) {
    searchParams.set('agent_id', params.agent_id);
  }
  if (params?.system_prompt_id) {
    searchParams.set('system_prompt_id', params.system_prompt_id);
  }
  if (params?.status) {
    searchParams.set('status', params.status);
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.offset !== undefined) {
    searchParams.set('offset', params.offset.toString());
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/sessions/list?${queryString}` : '/api/sessions/list';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
