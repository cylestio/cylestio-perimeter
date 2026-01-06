import type { SessionResponse, SessionsListResponse, SessionTagsResponse, LiveSessionStatus } from '../types/session';

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
  agent_workflow_id?: string;
  agent_id?: string;
  status?: LiveSessionStatus;
  cluster_id?: string;
  /** Array of tag filters, e.g., ["user:alice", "env:prod"] */
  tags?: string[];
  limit?: number;
  offset?: number;
}

export const fetchSessions = async (params?: FetchSessionsParams): Promise<SessionsListResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.agent_workflow_id) {
    searchParams.set('agent_workflow_id', params.agent_workflow_id);
  }
  if (params?.agent_id) {
    searchParams.set('agent_id', params.agent_id);
  }
  if (params?.status) {
    searchParams.set('status', params.status);
  }
  if (params?.cluster_id) {
    searchParams.set('cluster_id', params.cluster_id);
  }
  if (params?.tags && params.tags.length > 0) {
    // Pass as comma-separated string
    searchParams.set('tags', params.tags.join(','));
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

export interface FetchSessionTagsParams {
  agent_workflow_id?: string;
}

export const fetchSessionTags = async (params?: FetchSessionTagsParams): Promise<SessionTagsResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.agent_workflow_id) {
    searchParams.set('agent_workflow_id', params.agent_workflow_id);
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/api/sessions/tags?${queryString}` : '/api/sessions/tags';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch session tags: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
};
