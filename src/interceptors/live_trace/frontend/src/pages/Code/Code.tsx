import { useCallback, useEffect, useState, type FC } from 'react';

import { Code2, AlertTriangle, TrendingUp, TrendingDown, Shield, RefreshCcw, CheckCircle, Zap, GitCompare, CheckCircle2, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { fetchCodeAnalysis, fetchHealthTrend, fetchScanComparison, type CodeAnalysisResponse, type HealthTrendResponse, type ScanComparisonResponse } from '@api/endpoints/code';
import type { DevCategory } from '@api/types/code';

import { Badge } from '@ui/core/Badge';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { EmptyState } from '@ui/feedback/EmptyState';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { CodeCheckCard } from '@domain/code';
import { CorrelationSummary } from '@domain/correlation';
import { HealthTrendChart } from '@domain/metrics/HealthTrendChart';

import { usePageMeta } from '../../context';
import {
  PageStats,
  StatBadge,
  StatValue,
  CodeChecksGrid,
  ChecksSectionHeader,
  ChecksSectionTitle,
  ChecksSectionSubtitle,
  HealthScoreSection,
  HealthScoreHeader,
  HealthScoreMain,
  HealthScoreRing,
  HealthScoreValue,
  HealthScoreInfo,
  HealthScoreLabel,
  HealthScoreTrend,
  DimensionsGrid,
  DimensionCard,
  DimensionLabel,
  DimensionValue,
  DimensionIssues,
  EmptyContent,
  ErrorContent,
  RetryButton,
  SuggestionCard,
  SuggestionIcon,
  SuggestionContent,
  SuggestionText,
  SuggestionGain,
  ScanComparisonSection,
  ScanComparisonHeader,
  ScanComparisonTitle,
  ScanComparisonGrid,
  ScanStatCard,
  ScanStatValue,
  ScanStatLabel,
  HealthDeltaBadge,
  TrendSection,
} from './Code.styles';

export interface CodeProps {
  className?: string;
}

const getCategoryIcon = (category: DevCategory) => {
  switch (category) {
    case 'AVAILABILITY':
      return <RefreshCcw size={18} />;
    case 'RELIABILITY':
      return <CheckCircle size={18} />;
    case 'INEFFICIENCY':
      return <Zap size={18} />;
    default:
      return <Code2 size={18} />;
  }
};

const getCategoryName = (category: DevCategory) => {
  switch (category) {
    case 'AVAILABILITY':
      return 'Availability';
    case 'RELIABILITY':
      return 'Reliability';
    case 'INEFFICIENCY':
      return 'Efficiency';
    default:
      return category;
  }
};

const getCategoryDescription = (category: DevCategory) => {
  switch (category) {
    case 'AVAILABILITY':
      return 'Network resilience, retry logic, timeout handling';
    case 'RELIABILITY':
      return 'Error handling, output validation, tool configuration';
    case 'INEFFICIENCY':
      return 'Resource usage, token optimization, loop bounds';
    default:
      return '';
  }
};

const getHealthColor = (score: number): 'green' | 'orange' | 'red' => {
  if (score >= 80) return 'green';
  if (score >= 50) return 'orange';
  return 'red';
};

const getTrendText = (trend: string, delta: number): string => {
  if (trend === 'improving') return `+${delta.toFixed(0)}% from last scan`;
  if (trend === 'declining') return `${delta.toFixed(0)}% from last scan`;
  return 'Stable';
};

export const Code: FC<CodeProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // State
  const [codeAnalysis, setCodeAnalysis] = useState<CodeAnalysisResponse | null>(null);
  const [healthTrend, setHealthTrend] = useState<HealthTrendResponse | null>(null);
  const [scanComparison, setScanComparison] = useState<ScanComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch code analysis data
  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [analysisData, trendData, comparisonData] = await Promise.all([
        fetchCodeAnalysis(agentWorkflowId),
        fetchHealthTrend(agentWorkflowId).catch(() => null),
        fetchScanComparison(agentWorkflowId).catch(() => null),
      ]);

      setCodeAnalysis(analysisData);
      setHealthTrend(trendData);
      setScanComparison(comparisonData);
    } catch (err) {
      console.error('Failed to fetch code analysis data:', err);
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
      { label: 'Code Analysis' },
    ],
  });

  // Loading state
  if (loading) {
    return (
      <Page className={className} data-testid="code-analysis">
        <PageHeader
          title="Code Analysis"
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
      <Page className={className} data-testid="code-analysis">
        <PageHeader
          title="Code Analysis"
          description={`Agent Workflow: ${agentWorkflowId}`}
        />
        <ErrorContent>
          <AlertTriangle size={48} />
          <p>Failed to load code analysis data</p>
          <p style={{ fontSize: '12px', color: 'var(--color-white50)' }}>{error}</p>
          <RetryButton onClick={fetchData}>Retry</RetryButton>
        </ErrorContent>
      </Page>
    );
  }

  // Calculate totals
  const healthScore = codeAnalysis?.health_score;
  const totalFindings = codeAnalysis?.total_findings || 0;
  const openFindings = codeAnalysis?.open_findings || 0;
  const categories = codeAnalysis?.categories || [];
  const categoriesWithIssues = categories.filter(c => c.total_findings > 0).length;

  return (
    <Page className={className} data-testid="code-analysis">
      {/* Header */}
      <PageHeader
        title="Code Analysis"
        description={`Agent Workflow: ${agentWorkflowId}`}
        actions={
          <PageStats>
            <StatBadge>
              <Code2 size={14} />
              <StatValue>{totalFindings}</StatValue> findings
            </StatBadge>
            {openFindings > 0 && (
              <Badge variant="medium">
                {openFindings} open
              </Badge>
            )}
          </PageStats>
        }
      />

      {/* Health Score Section */}
      {healthScore && (
        <Section>
          <HealthScoreSection>
            <HealthScoreHeader>
              <HealthScoreMain>
                <HealthScoreRing $color={getHealthColor(healthScore.overall)}>
                  <HealthScoreValue>{Math.round(healthScore.overall)}%</HealthScoreValue>
                </HealthScoreRing>
                <HealthScoreInfo>
                  <HealthScoreLabel>Code Health Score</HealthScoreLabel>
                  <HealthScoreTrend $trend={healthScore.trend}>
                    {getTrendText(healthScore.trend, healthScore.trend_delta)}
                  </HealthScoreTrend>
                </HealthScoreInfo>
              </HealthScoreMain>

              {healthScore.suggested_improvement && (
                <SuggestionCard>
                  <SuggestionIcon>
                    <TrendingUp size={16} />
                  </SuggestionIcon>
                  <SuggestionContent>
                    <SuggestionText>{healthScore.suggested_improvement.action}</SuggestionText>
                    <SuggestionGain>
                      +{healthScore.suggested_improvement.potential_gain}% health improvement
                    </SuggestionGain>
                  </SuggestionContent>
                </SuggestionCard>
              )}
            </HealthScoreHeader>

            <DimensionsGrid>
              <DimensionCard $color="cyan">
                <DimensionLabel>
                  <Shield size={12} style={{ marginRight: '4px' }} />
                  Security
                </DimensionLabel>
                <DimensionValue>{Math.round(healthScore.dimensions.security)}%</DimensionValue>
                <DimensionIssues $hasIssues={healthScore.issue_counts.security > 0}>
                  {healthScore.issue_counts.security > 0
                    ? `${healthScore.issue_counts.security} issues`
                    : 'No issues'}
                </DimensionIssues>
              </DimensionCard>

              <DimensionCard $color="green">
                <DimensionLabel>
                  <RefreshCcw size={12} style={{ marginRight: '4px' }} />
                  Availability
                </DimensionLabel>
                <DimensionValue>{Math.round(healthScore.dimensions.availability)}%</DimensionValue>
                <DimensionIssues $hasIssues={healthScore.issue_counts.availability > 0}>
                  {healthScore.issue_counts.availability > 0
                    ? `${healthScore.issue_counts.availability} issues`
                    : 'No issues'}
                </DimensionIssues>
              </DimensionCard>

              <DimensionCard $color="orange">
                <DimensionLabel>
                  <CheckCircle size={12} style={{ marginRight: '4px' }} />
                  Reliability
                </DimensionLabel>
                <DimensionValue>{Math.round(healthScore.dimensions.reliability)}%</DimensionValue>
                <DimensionIssues $hasIssues={healthScore.issue_counts.reliability > 0}>
                  {healthScore.issue_counts.reliability > 0
                    ? `${healthScore.issue_counts.reliability} issues`
                    : 'No issues'}
                </DimensionIssues>
              </DimensionCard>

              <DimensionCard $color="purple">
                <DimensionLabel>
                  <Zap size={12} style={{ marginRight: '4px' }} />
                  Efficiency
                </DimensionLabel>
                <DimensionValue>{Math.round(healthScore.dimensions.efficiency)}%</DimensionValue>
                <DimensionIssues $hasIssues={healthScore.issue_counts.efficiency > 0}>
                  {healthScore.issue_counts.efficiency > 0
                    ? `${healthScore.issue_counts.efficiency} issues`
                    : 'No issues'}
                </DimensionIssues>
              </DimensionCard>
            </DimensionsGrid>
          </HealthScoreSection>
        </Section>
      )}

      {/* Correlation Summary - show when correlation data exists */}
      {codeAnalysis?.correlation_summary?.has_correlation && (
        <Section>
          <CorrelationSummary
            validated={codeAnalysis.correlation_summary.validated_count}
            unexercised={codeAnalysis.correlation_summary.unexercised_count}
            theoretical={0}
            uncorrelated={openFindings - (codeAnalysis.correlation_summary.validated_count + codeAnalysis.correlation_summary.unexercised_count)}
            sessionsCount={codeAnalysis.correlation_summary.runs_analyzed}
          />
        </Section>
      )}

      {/* Health Trend Chart - show when trend data exists */}
      {healthTrend && healthTrend.snapshots.length > 0 && (
        <Section>
          <TrendSection>
            <HealthTrendChart
              snapshots={healthTrend.snapshots}
              periodDays={healthTrend.period_days}
              trend={healthTrend.trend}
              delta={healthTrend.delta}
              showDimensions={true}
            />
          </TrendSection>
        </Section>
      )}

      {/* Scan Comparison - show when comparison data exists */}
      {scanComparison && (scanComparison.fixed_findings.length > 0 || scanComparison.new_findings.length > 0) && (
        <Section>
          <ScanComparisonSection>
            <ScanComparisonHeader>
              <ScanComparisonTitle>
                <GitCompare size={18} />
                Changes Since Last Scan
              </ScanComparisonTitle>
              {scanComparison.health_delta !== 0 && (
                <HealthDeltaBadge $positive={scanComparison.health_delta > 0}>
                  {scanComparison.health_delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {scanComparison.health_delta > 0 ? '+' : ''}{scanComparison.health_delta.toFixed(0)}% health
                </HealthDeltaBadge>
              )}
            </ScanComparisonHeader>

            <ScanComparisonGrid>
              <ScanStatCard $type="fixed">
                <CheckCircle2 size={24} />
                <ScanStatValue $type="fixed">{scanComparison.fixed_findings.length}</ScanStatValue>
                <ScanStatLabel>Issues Fixed</ScanStatLabel>
              </ScanStatCard>

              <ScanStatCard $type="new">
                <AlertCircle size={24} />
                <ScanStatValue $type="new">{scanComparison.new_findings.length}</ScanStatValue>
                <ScanStatLabel>New Issues</ScanStatLabel>
              </ScanStatCard>

              <ScanStatCard $type="delta">
                <Code2 size={24} />
                <ScanStatValue $type="delta">{scanComparison.fixed_findings.length - scanComparison.new_findings.length}</ScanStatValue>
                <ScanStatLabel>Net Change</ScanStatLabel>
              </ScanStatCard>
            </ScanComparisonGrid>
          </ScanComparisonSection>
        </Section>
      )}

      {/* Code Quality Checks */}
      <Section>
        <Section.Header>
          <ChecksSectionHeader>
            <ChecksSectionTitle>
              <Code2 size={18} />
              Developer Checks
            </ChecksSectionTitle>
            <ChecksSectionSubtitle>
              {categoriesWithIssues} of {categories.length} categories with findings
            </ChecksSectionSubtitle>
          </ChecksSectionHeader>
        </Section.Header>
        <Section.Content>
          {categories.length > 0 ? (
            <CodeChecksGrid>
              {categories.map((category) => (
                <CodeCheckCard
                  key={category.category}
                  category={category.category}
                  name={getCategoryName(category.category)}
                  description={getCategoryDescription(category.category)}
                  icon={getCategoryIcon(category.category)}
                  findingsCount={category.total_findings}
                  openCount={category.by_status?.OPEN || 0}
                  findings={category.findings}
                  healthPenalty={category.health_penalty}
                  defaultExpanded={category.total_findings > 0 && (category.by_status?.OPEN || 0) > 0}
                />
              ))}
            </CodeChecksGrid>
          ) : (
            <EmptyState
              title="No analysis yet"
              description="Run a code analysis scan to see developer checks evaluated."
            />
          )}
        </Section.Content>
      </Section>

      {/* Empty state when no findings */}
      {totalFindings === 0 && categories.length > 0 && (
        <Section>
          <EmptyContent>
            <Code2 size={48} />
            <h3>No Code Issues Found</h3>
            <p>
              All {categories.length} developer checks passed. Your agent code is well-structured.
            </p>
          </EmptyContent>
        </Section>
      )}
    </Page>
  );
};
