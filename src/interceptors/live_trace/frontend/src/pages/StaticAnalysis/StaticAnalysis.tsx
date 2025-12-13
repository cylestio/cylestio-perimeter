import { useCallback, useEffect, useState, type FC } from 'react';

import { Shield } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { fetchStaticSummary } from '@api/endpoints/agent';
import type { StaticAnalysisSummary, StaticCheckCategory, Finding } from '@api/types/findings';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Section } from '@ui/layout/Section';

import { FindingCard } from '@domain/findings';
import { 
  ScanStatusCard, 
  SecurityCheckCard,
  type CheckStatus,
  type GateStatus,
} from '@domain/security';

import { usePageMeta } from '../../context';
import {
  StaticAnalysisLayout,
  PageHeader,
  PageInfo,
  PageTitle,
  PageSubtitle,
  PageStats,
  StatBadge,
  StatValue,
  EmptyContent,
} from './StaticAnalysis.styles';

export interface StaticAnalysisProps {
  className?: string;
}

/**
 * StaticAnalysis page - Shows security scan results with categorized checks
 * 
 * Layout:
 * 1. Scan Status Card - Last scan info, gate progress, severity summary
 * 2. Security Checks Section - 5 categories with pass/fail status
 * 3. Findings Detail Section - Individual findings with filters
 */
export const StaticAnalysis: FC<StaticAnalysisProps> = ({ className }) => {
  const { agentId } = useParams<{ agentId: string }>();

  // State
  const [staticSummary, setStaticSummary] = useState<StaticAnalysisSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch static summary for this agent
  const fetchData = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaticSummary(agentId);
      setStaticSummary(data);
    } catch (err) {
      console.error('Failed to fetch static summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set breadcrumbs
  usePageMeta({
    breadcrumbs: [
      { label: 'Agents', href: '/' },
      { label: agentId || '', href: `/agent/${agentId}` },
      { label: 'Static Analysis' },
    ],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <StaticAnalysisLayout className={className}>
        <EmptyContent>
          <p>Error loading static analysis data: {error}</p>
          <button onClick={fetchData} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </EmptyContent>
      </StaticAnalysisLayout>
    );
  }

  // Calculate stats for display
  const totalFindings = staticSummary?.summary?.total_findings || 0;
  const checksCount = staticSummary?.checks?.length || 0;
  const passedCount = staticSummary?.summary?.passed || 0;

  // Build check statuses for gate progress
  const checkStatuses: { status: CheckStatus }[] = (staticSummary?.checks || []).map((check) => ({
    status: check.status as CheckStatus,
  }));

  const gateStatus: GateStatus = staticSummary?.summary?.gate_status || 'BLOCKED';

  // Build severity counts
  const severityCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  
  (staticSummary?.checks || []).forEach((check) => {
    (check.findings || []).forEach((finding) => {
      if (finding.status === 'OPEN') {
        const sev = finding.severity as keyof typeof severityCounts;
        if (sev in severityCounts) {
          severityCounts[sev]++;
        }
      }
    });
  });

  // Render finding card for SecurityCheckCard
  const renderFinding = (finding: Finding) => (
    <FindingCard key={finding.finding_id} finding={finding} />
  );

  return (
    <StaticAnalysisLayout className={className} data-testid="static-analysis">
      {/* Header */}
      <PageHeader>
        <PageInfo>
          <PageTitle>Static Analysis</PageTitle>
          <PageSubtitle>Agent: {agentId}</PageSubtitle>
        </PageInfo>
        <PageStats>
          <StatBadge>
            <Shield size={14} />
            <StatValue>{checksCount}</StatValue> checks
          </StatBadge>
          <StatBadge>
            <StatValue>{totalFindings}</StatValue> findings
          </StatBadge>
        </PageStats>
      </PageHeader>

      {/* Scan Status Card */}
      <ScanStatusCard
        lastScan={staticSummary?.last_scan ? {
          timestamp: staticSummary.last_scan.timestamp,
          scannedBy: staticSummary.last_scan.scanned_by,
          filesAnalyzed: staticSummary.last_scan.files_analyzed || undefined,
          durationMs: staticSummary.last_scan.duration_ms || undefined,
        } : null}
        checks={checkStatuses}
        gateStatus={gateStatus}
        severityCounts={severityCounts}
      />

      {/* Security Checks Section */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Shield size={16} />}>
            Security Checks ({passedCount}/{checksCount} passed)
          </Section.Title>
        </Section.Header>
        <Section.Content>
          {staticSummary?.checks && staticSummary.checks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staticSummary.checks.map((check: StaticCheckCategory) => (
                <SecurityCheckCard
                  key={check.category_id}
                  categoryId={check.category_id}
                  name={check.name}
                  status={check.status}
                  owaspLlm={check.owasp_llm}
                  cwe={check.cwe ? (Array.isArray(check.cwe) ? check.cwe : [check.cwe]) : undefined}
                  soc2Controls={check.soc2_controls || undefined}
                  findingsCount={check.findings_count}
                  maxSeverity={check.max_severity}
                  findings={check.findings}
                  renderFinding={renderFinding}
                />
              ))}
            </div>
          ) : (
            <EmptyContent>
              <p>No security checks found.</p>
              <p style={{ fontSize: '12px' }}>
                Run a security scan using the MCP tools to analyze your agent.
              </p>
            </EmptyContent>
          )}
        </Section.Content>
      </Section>
    </StaticAnalysisLayout>
  );
};
