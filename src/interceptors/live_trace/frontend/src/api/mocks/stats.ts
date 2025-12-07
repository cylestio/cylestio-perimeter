// Mock statistics data for Dashboard

export interface Stats {
  riskScore: number;
  riskChange: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  openFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  autoFixed: number;
  todayFixed: number;
  sessions: number;
  liveSessions: number;
}

export const mockStats: Stats = {
  riskScore: 52,
  riskChange: 3,
  riskLevel: 'medium',
  openFindings: 5,
  criticalCount: 1,
  highCount: 2,
  mediumCount: 1,
  lowCount: 1,
  autoFixed: 12,
  todayFixed: 3,
  sessions: 47,
  liveSessions: 2,
};

// Note: LifecycleStage icons are added in the Dashboard component
// since mock data shouldn't include React components
export interface LifecycleStageData {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  stat?: string;
}

export const mockLifecycleStages: LifecycleStageData[] = [
  { id: 'discovery', label: 'Discovery', status: 'completed', stat: '47' },
  { id: 'analysis', label: 'Analysis', status: 'completed', stat: '23' },
  { id: 'correlation', label: 'Correlation', status: 'active', stat: '5' },
  { id: 'remediation', label: 'Remediation', status: 'pending' },
  { id: 'verification', label: 'Verification', status: 'pending' },
];
