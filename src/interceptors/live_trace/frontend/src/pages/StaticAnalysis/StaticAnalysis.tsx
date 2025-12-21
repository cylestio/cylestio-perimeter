import { useCallback, useEffect, useState, type FC } from 'react';

import { Shield, FileSearch, AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { 
  fetchStaticSummary, 
  fetchAnalysisSessions, 
  fetchCorrelationSummary,
  type AnalysisSession,
  type CorrelationSummaryResponse,
} from '@api/endpoints/agentWorkflow';
import type { 
  StaticSummaryResponse, 
  SecurityCheck,
  CheckStatus,
} from '@api/types/findings';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { 
  ScanStatusCard, 
  SecurityCheckCard, 
  GateProgress,
} from '@domain/security';

import { CorrelationSummary } from '@domain/correlation';

import { usePageMeta } from '../../context';
import {
  PageStats,
  StatBadge,
  StatValue,
  SecurityChecksGrid,
  ChecksSectionHeader,
  ChecksSectionTitle,
  ChecksSectionSubtitle,
  EmptyContent,
  ErrorContent,
  RetryButton,
} from './StaticAnalysis.styles';

export interface StaticAnalysisProps {
  className?: string;
}

export const StaticAnalysis: FC<StaticAnalysisProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // State
  const [staticSummary, setStaticSummary] = useState<StaticSummaryResponse | null>(null);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [correlationData, setCorrelationData] = useState<CorrelationSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch static summary (which includes security check categories)
  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) return;

    setLoading(true);
    setError(null);

    try {
      const [summaryData, sessionsData, correlationSummary] = await Promise.all([
        fetchStaticSummary(agentWorkflowId),
        fetchAnalysisSessions(agentWorkflowId),
        fetchCorrelationSummary(agentWorkflowId).catch(() => null), // Graceful fallback
      ]);

      setStaticSummary(summaryData);
      setCorrelationData(correlationSummary);
      
      // Filter to only STATIC and AUTOFIX sessions
      const filteredSessions = (sessionsData.sessions || []).filter(
        (session) => session.session_type === 'STATIC' || session.session_type === 'AUTOFIX'
      );
      setAnalysisSessions(filteredSessions);
    } catch (err) {
      console.error('Failed to fetch static analysis data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agent Workflows', href: '/' },
      { label: agentWorkflowId || '', href: `/agent-workflow/${agentWorkflowId}` },
      { label: 'Static Analysis' },
    ],
  });

  // Loading state
  if (loading) {
    return (
      <Page className={className} data-testid="static-analysis">
        <PageHeader
          title="Static Analysis"
          description={`Agent Workflow: ${agentWorkflowId}`}
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <OrbLoader size="lg" />
        </div>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page className={className} data-testid="static-analysis">
        <PageHeader
          title="Static Analysis"
          description={`Agent Workflow: ${agentWorkflowId}`}
        />
        <ErrorContent>
          <AlertTriangle size={48} />
          <p>Failed to load static analysis data</p>
          <p style={{ fontSize: '12px', color: 'var(--color-white50)' }}>{error}</p>
          <RetryButton onClick={fetchData}>Retry</RetryButton>
        </ErrorContent>
      </Page>
    );
  }

  // Calculate totals
  const totalFindings = staticSummary?.checks.reduce((acc, c) => acc + c.findings_count, 0) || 0;
  const totalScans = analysisSessions.length;
  const checkStatuses = staticSummary?.checks.map(c => ({ status: c.status as CheckStatus })) || [];
  const failedChecks = staticSummary?.summary.failed || 0;
  const categoriesCount = staticSummary?.checks.length || 0;

  return (
    <Page className={className} data-testid="static-analysis">
      {/* Header */}
      <PageHeader
        title="Static Analysis"
        description={`Agent Workflow: ${agentWorkflowId}`}
        actions={
          <PageStats>
            <StatBadge>
              <FileSearch size={14} />
              <StatValue>{totalScans}</StatValue> scans
            </StatBadge>
            <StatBadge>
              <Shield size={14} />
              <StatValue>{totalFindings}</StatValue> findings
            </StatBadge>
            {failedChecks > 0 && (
              <Badge variant="critical">
                {failedChecks} {failedChecks === 1 ? 'check' : 'checks'} failing
              </Badge>
            )}
          </PageStats>
        }
      />

      {/* Scan Status Card */}
      <Section>
        <ScanStatusCard
          lastScan={staticSummary?.last_scan || null}
          summary={staticSummary?.summary || null}
          severityCounts={staticSummary?.severity_counts}
          checkStatuses={checkStatuses}
          scanHistory={staticSummary?.scan_history}
          historicalSummary={staticSummary?.historical_summary}
        />
      </Section>

      {/* Phase 5: Correlation Summary Card - Show when correlation data exists */}
      {correlationData && (correlationData.is_correlated || correlationData.uncorrelated > 0) && (
        <Section>
          <CorrelationSummary
            validated={correlationData.validated}
            unexercised={correlationData.unexercised}
            theoretical={correlationData.theoretical}
            uncorrelated={correlationData.uncorrelated}
            sessionsCount={correlationData.sessions_count}
          />
        </Section>
      )}

      {/* Security Checks - Security check categories */}
      <Section>
        <Section.Header>
          <ChecksSectionHeader>
            <ChecksSectionTitle>
              <Shield size={18} />
              Security Checks
            </ChecksSectionTitle>
            <ChecksSectionSubtitle>
              {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'} evaluated for AI agent security
            </ChecksSectionSubtitle>
          </ChecksSectionHeader>
          {staticSummary?.summary && (
            <GateProgress
              checks={checkStatuses}
              gateStatus={staticSummary.summary.gate_status}
              showStats={false}
            />
          )}
        </Section.Header>
        <Section.Content>
          {staticSummary?.checks && staticSummary.checks.length > 0 ? (
            <SecurityChecksGrid>
              {staticSummary.checks.map((check) => (
                <SecurityCheckCard
                  key={check.category_id}
                  check={check as SecurityCheck}
                  defaultExpanded={check.status === 'FAIL'}
                />
              ))}
            </SecurityChecksGrid>
          ) : (
            <EmptyState
              title="No scans yet"
              description="Run a security scan to see security check categories evaluated."
            />
          )}
        </Section.Content>
      </Section>

      {/* Empty state when no findings */}
      {totalFindings === 0 && staticSummary?.last_scan && (
        <Section>
          <EmptyContent>
            <Shield size={48} />
            <h3>No Security Issues Found</h3>
            <p>
              All {categoriesCount} security checks passed. Your agent is ready for production.
            </p>
          </EmptyContent>
        </Section>
      )}
    </Page>
  );
};
