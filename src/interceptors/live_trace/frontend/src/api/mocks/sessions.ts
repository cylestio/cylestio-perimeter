// Mock session data

export type SessionStatus = 'active' | 'completed' | 'failed';
export type EventType = 'tool_call' | 'finding' | 'info' | 'warning' | 'error';

export interface SessionEvent {
  id: string;
  type: EventType;
  name: string;
  timestamp: string;
  details?: string;
}

export interface Session {
  id: string;
  agent: string;
  agentInitials: string;
  startTime: string;
  endTime?: string;
  duration: number; // ms
  requestCount: number;
  findingsCount: number;
  status: SessionStatus;
  events: SessionEvent[];
}

export const mockSessions: Session[] = [
  {
    id: 'session_abc123',
    agent: 'CustomerAgent',
    agentInitials: 'CA',
    startTime: '2024-01-15T10:30:00Z',
    endTime: '2024-01-15T10:35:20Z',
    duration: 320000,
    requestCount: 47,
    findingsCount: 2,
    status: 'completed',
    events: [
      { id: 'e1', type: 'tool_call', name: 'search_customer', timestamp: '2024-01-15T10:30:05Z' },
      { id: 'e2', type: 'tool_call', name: 'get_orders', timestamp: '2024-01-15T10:30:12Z' },
      { id: 'e3', type: 'finding', name: 'SQL Injection detected', timestamp: '2024-01-15T10:30:15Z', details: 'Critical' },
      { id: 'e4', type: 'tool_call', name: 'update_customer', timestamp: '2024-01-15T10:31:00Z' },
      { id: 'e5', type: 'warning', name: 'Rate limit approaching', timestamp: '2024-01-15T10:32:30Z' },
      { id: 'e6', type: 'info', name: 'Session completed', timestamp: '2024-01-15T10:35:20Z' },
    ],
  },
  {
    id: 'session_def456',
    agent: 'DataAgent',
    agentInitials: 'DA',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T09:45:00Z',
    duration: 2700000,
    requestCount: 156,
    findingsCount: 1,
    status: 'completed',
    events: [
      { id: 'e1', type: 'tool_call', name: 'fetch_data', timestamp: '2024-01-15T09:00:10Z' },
      { id: 'e2', type: 'tool_call', name: 'process_records', timestamp: '2024-01-15T09:15:00Z' },
      { id: 'e3', type: 'finding', name: 'Hardcoded API Key', timestamp: '2024-01-15T09:20:00Z', details: 'High' },
      { id: 'e4', type: 'info', name: 'Processing complete', timestamp: '2024-01-15T09:45:00Z' },
    ],
  },
  {
    id: 'session_ghi789',
    agent: 'FileAgent',
    agentInitials: 'FA',
    startTime: '2024-01-15T11:00:00Z',
    duration: 0,
    requestCount: 12,
    findingsCount: 0,
    status: 'active',
    events: [
      { id: 'e1', type: 'tool_call', name: 'scan_directory', timestamp: '2024-01-15T11:00:05Z' },
      { id: 'e2', type: 'tool_call', name: 'analyze_file', timestamp: '2024-01-15T11:01:00Z' },
    ],
  },
  {
    id: 'session_jkl012',
    agent: 'APIAgent',
    agentInitials: 'AA',
    startTime: '2024-01-15T08:00:00Z',
    endTime: '2024-01-15T08:02:30Z',
    duration: 150000,
    requestCount: 5,
    findingsCount: 0,
    status: 'failed',
    events: [
      { id: 'e1', type: 'tool_call', name: 'test_endpoint', timestamp: '2024-01-15T08:00:10Z' },
      { id: 'e2', type: 'error', name: 'Connection timeout', timestamp: '2024-01-15T08:02:30Z' },
    ],
  },
];

export const getActiveSessions = () => mockSessions.filter((s) => s.status === 'active');
export const getSessionById = (id: string) => mockSessions.find((s) => s.id === id);
