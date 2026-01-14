import { useCallback, useEffect, useState, type FC } from 'react';

import { Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  fetchStaticSummary,
  fetchAnalysisSessions,
  type AnalysisSession,
} from '@api/endpoints/agentWorkflow';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import { fetchConfig } from '@api/endpoints/config';
import type { IDEConnectionStatus } from '@api/types/ide';
import type { ConfigResponse } from '@api/types/config';
import type { StaticSummaryResponse } from '@api/types/findings';
import { StaticAnalysisIcon } from '@constants/pageIcons';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { IDEConnectionBanner, IDESetupSection } from '@domain/ide';
import { ScanOverviewCard, ScanHistoryTable } from '@domain/security';

import { usePageMeta } from '../../context';

export interface StaticAnalysisProps {
  className?: string;
}

export const StaticAnalysis: FC<StaticAnalysisProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const navigate = useNavigate();

  // IDE Connection state
  const [connectionStatus, setConnectionStatus] = useState<IDEConnectionStatus | null>(null);
  const [serverConfig, setServerConfig] = useState<ConfigResponse | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);

  // Static analysis state
  const [staticSummary, setStaticSummary] = useState<StaticSummaryResponse | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch IDE connection status
  const fetchConnectionStatus = useCallback(async () => {
    if (!agentWorkflowId || agentWorkflowId === 'unassigned') {
      setConnectionStatus({
        has_activity: false,
        last_seen: null,
        ide: null,
      });
      setConnectionLoading(false);
      return;
    }

    try {
      const status = await fetchIDEConnectionStatus(agentWorkflowId);
      setConnectionStatus(status);
    } catch {
      setConnectionStatus({
        has_activity: false,
        last_seen: null,
        ide: null,
      });
    } finally {
      setConnectionLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch server config for MCP URL
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchConfig();
        setServerConfig(config);
      } catch {
        setServerConfig(null);
      }
    };
    loadConfig();
  }, []);

  // Fetch static analysis data
  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) return;

    try {
      const [summaryData, sessionsData] = await Promise.all([
        fetchStaticSummary(agentWorkflowId).catch(() => null),
        fetchAnalysisSessions(agentWorkflowId),
      ]);

      setStaticSummary(summaryData);

      // Filter to only STATIC and AUTOFIX sessions
      const filteredSessions = (sessionsData.sessions || []).filter(
        (session) => session.session_type === 'STATIC' || session.session_type === 'AUTOFIX'
      );
      setAnalysisSessions(filteredSessions);
    } catch (err) {
      console.error('Failed to fetch static analysis data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [agentWorkflowId]);

  // Poll connection status every 5s
  useEffect(() => {
    fetchConnectionStatus();
    const interval = setInterval(fetchConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchConnectionStatus]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for in-progress scans every 3s
  useEffect(() => {
    const hasInProgress = analysisSessions.some((s) => s.status === 'IN_PROGRESS');
    if (hasInProgress) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [analysisSessions, fetchData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '', href: `/agent-workflow/${agentWorkflowId}` },
      { label: 'Static Analysis' },
    ],
  });

  // Handlers
  const handleViewSession = (sessionId: string) => {
    navigate(`/agent-workflow/${agentWorkflowId}/static-analysis/${sessionId}`);
  };

  const handleViewLatestResults = () => {
    const latestCompleted = analysisSessions.find((s) => s.status === 'COMPLETED');
    if (latestCompleted) {
      handleViewSession(latestCompleted.session_id);
    }
  };

  // Derived state
  const hasScans = analysisSessions.length > 0;
  const isScanning = analysisSessions.some((s) => s.status === 'IN_PROGRESS');
  const latestCompletedScan = analysisSessions.find((s) => s.status === 'COMPLETED');
  const hasConnection = connectionStatus?.has_activity ?? false;

  // Loading state
  if (connectionLoading || dataLoading) {
    return (
      <Page className={className} data-testid="static-analysis">
        <PageHeader
          icon={<StaticAnalysisIcon size={24} />}
          title="Static Analysis"
          description="AI-powered security scanning for your agent code"
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <OrbLoader size="lg" />
        </div>
      </Page>
    );
  }

  return (
    <Page className={className} data-testid="static-analysis">
      <PageHeader
        icon={<StaticAnalysisIcon size={24} />}
        title="Static Analysis"
        description="AI-powered security scanning for your agent code"
      />

      {/* Main Content - depends on state */}
      {!hasScans ? (
        // Empty state: Explanation first, then connection status, then setup instructions
        <>
          <ScanOverviewCard
            isScanning={false}
            className=""
          />
          <IDEConnectionBanner
            connectionStatus={connectionStatus}
            isLoading={connectionLoading}
          />
          <IDESetupSection
            connectionStatus={connectionStatus}
            serverConfig={serverConfig}
          />
        </>
      ) : (
        // Has scans: Show overview card + connection status + collapsible instructions + history
        <>
          <ScanOverviewCard
            isScanning={isScanning}
            gateStatus={staticSummary?.summary?.gate_status}
            lastScanTime={latestCompletedScan?.created_at}
            totalFindings={staticSummary?.checks?.reduce((acc, c) => acc + c.findings_count, 0) || 0}
            severityCounts={staticSummary?.severity_counts}
            checksPassed={staticSummary?.summary?.passed || 0}
            checksTotal={(staticSummary?.summary?.passed || 0) + (staticSummary?.summary?.failed || 0) + (staticSummary?.summary?.info || 0)}
            onViewDetails={latestCompletedScan ? handleViewLatestResults : undefined}
            latestScanId={latestCompletedScan?.session_id}
          />

          {/* IDE Connection Status Banner */}
          <IDEConnectionBanner
            connectionStatus={connectionStatus}
            isLoading={connectionLoading}
          />

          {/* Collapsible Setup Instructions */}
          <IDESetupSection
            connectionStatus={connectionStatus}
            serverConfig={serverConfig}
            collapsible
            defaultExpanded={!hasConnection}
          />

          {/* Scan History Table */}
          <Section>
            <Section.Header>
              <Section.Title icon={<Clock size={16} />}>Scan History</Section.Title>
            </Section.Header>
            <Section.Content noPadding>
              <ScanHistoryTable
                sessions={analysisSessions}
                onViewSession={handleViewSession}
                emptyMessage="No scans yet"
                emptyDescription="Connect your IDE and run a security scan to see results here."
              />
            </Section.Content>
          </Section>
        </>
      )}
    </Page>
  );
};
