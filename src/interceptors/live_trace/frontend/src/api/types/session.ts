// API Types for /api/session/:id endpoint

export interface SessionEvent {
  id: string;
  name: string;
  event_type?: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  description?: string;
  details?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  timestamp: string;
  level: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface SessionDetail {
  id: string;
  agent_id: string;
  agent_workflow_id?: string | null;
  is_active: boolean;
  is_completed: boolean;
  model?: string | null;
  provider?: string | null;
  created_at: string;
  last_activity: string;
  duration_minutes: number;
  total_events: number;
  message_count: number;
  total_tokens: number;
  tool_uses: number;
  errors: number;
  error_rate: number;
  system_prompt?: string | null;
  available_tools?: string[];
  tool_usage_details?: Record<string, number>;
  avg_response_time_ms?: number;
  tags?: Record<string, string>;
}

export interface SessionResponse {
  session: SessionDetail;
  timeline: TimelineEvent[];
  events: SessionEvent[];
  error?: string;
}

// Types for /api/sessions/list endpoint

export type LiveSessionStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export interface SessionListItem {
  id: string;
  id_short: string;
  agent_id: string;
  agent_id_short: string | null;
  agent_workflow_id: string | null;
  created_at: string;
  last_activity: string;
  last_activity_relative: string;
  duration_minutes: number;
  is_active: boolean;
  is_completed: boolean;
  status: LiveSessionStatus;
  message_count: number;
  tool_uses: number;
  errors: number;
  total_tokens: number;
  error_rate: number;
  tags?: Record<string, string>;
}

export interface SessionsListFilters {
  agent_workflow_id?: string;
  agent_id?: string;
  status?: LiveSessionStatus;
  tag?: string;
  limit: number;
  offset: number;
}

export interface SessionsListResponse {
  sessions: SessionListItem[];
  total_count: number;
  filters: SessionsListFilters;
}

// Types for /api/sessions/tags endpoint

export interface SessionTagValue {
  value: string;
  count: number;
}

export interface SessionTagSuggestion {
  key: string;
  values: SessionTagValue[];
}

export interface SessionTagsResponse {
  tags: SessionTagSuggestion[];
}
