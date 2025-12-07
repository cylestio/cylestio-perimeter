// Mock findings data

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'open' | 'fixed' | 'ignored';
export type FindingSource = 'static' | 'dynamic';
export type CorrelationStatus = 'confirmed' | 'potential' | 'unconfirmed';

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
  };
  source: FindingSource;
  status: FindingStatus;
  correlationStatus: CorrelationStatus;
  createdAt: string;
  updatedAt: string;
  agent: string;
}

export const mockFindings: Finding[] = [
  {
    id: 'f1',
    severity: 'critical',
    title: 'SQL Injection in search_customer',
    description: 'User input is passed directly to database query without sanitization. This could allow an attacker to execute arbitrary SQL commands.',
    location: { file: 'agent.py', line: 156 },
    source: 'dynamic',
    status: 'open',
    correlationStatus: 'confirmed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    agent: 'CustomerAgent',
  },
  {
    id: 'f2',
    severity: 'high',
    title: 'Hardcoded API Key in Configuration',
    description: 'API key is hardcoded in the source code instead of using environment variables.',
    location: { file: 'config.py', line: 42 },
    source: 'static',
    status: 'open',
    correlationStatus: 'confirmed',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T14:20:00Z',
    agent: 'DataAgent',
  },
  {
    id: 'f3',
    severity: 'high',
    title: 'Insecure File Upload Handling',
    description: 'File uploads are not validated for type or size, potentially allowing malicious files.',
    location: { file: 'upload_handler.py', line: 89 },
    source: 'dynamic',
    status: 'open',
    correlationStatus: 'potential',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
    agent: 'FileAgent',
  },
  {
    id: 'f4',
    severity: 'medium',
    title: 'Missing Rate Limiting on API',
    description: 'API endpoint lacks rate limiting, making it vulnerable to DoS attacks.',
    location: { file: 'api_routes.py', line: 234 },
    source: 'static',
    status: 'fixed',
    correlationStatus: 'confirmed',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-14T11:30:00Z',
    agent: 'APIAgent',
  },
  {
    id: 'f5',
    severity: 'low',
    title: 'Debug Mode Enabled',
    description: 'Debug mode is enabled in production configuration.',
    location: { file: 'settings.py', line: 12 },
    source: 'static',
    status: 'open',
    correlationStatus: 'unconfirmed',
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T08:00:00Z',
    agent: 'ConfigAgent',
  },
];

export const getFindingsBySeverity = (severity: Severity) =>
  mockFindings.filter((f) => f.severity === severity);

export const getOpenFindings = () =>
  mockFindings.filter((f) => f.status === 'open');
