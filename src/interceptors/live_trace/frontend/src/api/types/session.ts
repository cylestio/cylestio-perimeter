// API Types for /api/session/:id endpoint

export interface SessionEvent {
  id: string;
  event_type: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  description?: string;
  details?: Record<string, unknown>;
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
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  last_activity: string;
  duration_minutes: number;
  total_events: number;
  message_count: number;
  total_tokens: number;
  tool_uses: number;
  errors: number;
  error_rate: number;
}

export interface SessionResponse {
  session: SessionDetail;
  timeline: TimelineEvent[];
  events: SessionEvent[];
  error?: string;
}
