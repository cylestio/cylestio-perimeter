import { useCallback, useEffect, useState, useMemo, type FC } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, RefreshCw } from 'lucide-react';

import { RecommendationsIcon } from '@constants/pageIcons';
import { 
  fetchRecommendations, 
  fetchGateStatus,
  completeFix,
  dismissRecommendation,
  type RecommendationsResponse,
  type GateStatusResponse,
} from '@api/endpoints/agentWorkflow';
import type { 
  Recommendation, 
  SecurityCheckCategory,
  RecommendationStatus,
  GateStatus,
} from '@api/types/findings';
import { SECURITY_CHECK_CATEGORIES } from '@api/types/findings';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { RecommendationCard } from '@domain/recommendations/RecommendationCard';
import { DismissModal, type DismissType } from '@domain/recommendations/DismissModal';
import { ProgressSummary } from '@domain/recommendations/ProgressSummary';

import { usePageMeta } from '../../context';
import {
  FiltersBar,
  FilterGroup,
  FilterLabel,
  FilterSelect,
  FilterCheckbox,
  RefreshButton,
  RecommendationsList,
  SectionTitle,
  EmptyState,
  ErrorState,
  RetryButton,
} from './Recommendations.styles';

export interface RecommendationsProps {
  className?: string;
}

type SourceFilter = 'ALL' | 'STATIC' | 'DYNAMIC';
type StatusFilter = 'ALL' | 'PENDING' | 'FIXING' | 'FIXED' | 'VERIFIED' | 'DISMISSED' | 'IGNORED';
type CategoryFilter = 'ALL' | SecurityCheckCategory;

export const Recommendations: FC<RecommendationsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters from URL
  const sourceFilter = (searchParams.get('source') as SourceFilter) || 'ALL';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'ALL';
  const categoryFilter = (searchParams.get('category') as CategoryFilter) || 'ALL';
  const blockingOnly = searchParams.get('blocking') === 'true';

  // Dismiss modal state
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissingRecId, setDismissingRecId] = useState<string | null>(null);

  // Set page meta
  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Recommendations' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Recommendations' }],
  });

  // Fetch data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (!agentWorkflowId) {
      setLoading(false);
      return;
    }

    if (showRefreshing) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const [recsData, gateData] = await Promise.all([
        fetchRecommendations(agentWorkflowId, { limit: 500 }),
        fetchGateStatus(agentWorkflowId),
      ]);
      setRecommendations(recsData.recommendations);
      setGateStatus(gateData);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentWorkflowId]);

  useEffect(() => {
    fetchData();
    // Poll for updates every 5 seconds to catch status changes from /fix commands
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Source filter
    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(r => r.source_type === sourceFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    // Blocking only filter
    if (blockingOnly) {
      filtered = filtered.filter(r => 
        r.severity === 'CRITICAL' || r.severity === 'HIGH'
      );
    }

    return filtered;
  }, [recommendations, sourceFilter, statusFilter, categoryFilter, blockingOnly]);

  // Severity sort order: CRITICAL > HIGH > MEDIUM > LOW
  const SEVERITY_ORDER: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const sortBySeverity = (a: Recommendation, b: Recommendation) => {
    const aOrder = SEVERITY_ORDER[a.severity] ?? 99;
    const bOrder = SEVERITY_ORDER[b.severity] ?? 99;
    return aOrder - bOrder;
  };

  // Group recommendations by status, sorted by severity
  const groupedRecommendations = useMemo(() => {
    const pending = filteredRecommendations
      .filter(r => ['PENDING', 'FIXING'].includes(r.status))
      .sort(sortBySeverity);
    const resolved = filteredRecommendations
      .filter(r => ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(r.status))
      .sort(sortBySeverity);
    return { pending, resolved };
  }, [filteredRecommendations]);

  // Update filter in URL
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'ALL' || value === 'false') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  // Handle mark as fixed
  const handleMarkFixed = async (recId: string) => {
    try {
      await completeFix(recId, {
        fix_notes: 'Marked as fixed manually',
        fix_method: 'MANUAL',
      });
      await fetchData(true);
    } catch (err) {
      console.error('Failed to mark as fixed:', err);
    }
  };

  // Handle dismiss
  const handleOpenDismiss = (recId: string, type: DismissType) => {
    setDismissingRecId(recId);
    setDismissModalOpen(true);
  };

  const handleDismissConfirm = async (type: DismissType, reason: string) => {
    if (!dismissingRecId) return;
    
    try {
      await dismissRecommendation(dismissingRecId, {
        reason,
        dismiss_type: type,
      });
      setDismissModalOpen(false);
      setDismissingRecId(null);
      await fetchData(true);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  // Navigate to finding
  const handleViewFinding = (findingId: string) => {
    navigate(`/agent-workflow/${agentWorkflowId}/static-analysis?finding=${findingId}`);
  };

  // Loading state
  if (loading) {
    return (
      <Page className={className} data-testid="recommendations">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <OrbLoader size="lg" />
        </div>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page className={className} data-testid="recommendations">
        <PageHeader
          icon={<RecommendationsIcon size={24} />}
          title="Recommendations"
          description="Security recommendations and fix workflow"
        />
        <ErrorState>
          <p>{error}</p>
          <RetryButton onClick={() => fetchData()}>
            <RefreshCw size={14} />
            Retry
          </RetryButton>
        </ErrorState>
      </Page>
    );
  }

  // Count blocking issues
  const blockingCritical = recommendations.filter(r => 
    r.severity === 'CRITICAL' && ['PENDING', 'FIXING'].includes(r.status)
  ).length;
  const blockingHigh = recommendations.filter(r => 
    r.severity === 'HIGH' && ['PENDING', 'FIXING'].includes(r.status)
  ).length;

  return (
    <Page className={className} data-testid="recommendations">
      <PageHeader
        icon={<RecommendationsIcon size={24} />}
        title="Recommendations"
        description="AI-powered security recommendations with fix workflow"
        actions={
          <RefreshButton onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        }
      />

      {/* Progress Summary */}
      {gateStatus && (
        <Section>
          <Section.Content>
            <ProgressSummary
              gateStatus={gateStatus.gate_status}
              recommendations={recommendations}
              blockingCritical={blockingCritical}
              blockingHigh={blockingHigh}
            />
          </Section.Content>
        </Section>
      )}

      {/* Filters */}
      <Section>
        <Section.Content>
          <FiltersBar>
            <FilterGroup>
              <Filter size={14} />
              <FilterLabel>Source:</FilterLabel>
              <FilterSelect
                value={sourceFilter}
                onChange={(e) => updateFilter('source', e.target.value)}
              >
                <option value="ALL">All Sources</option>
                <option value="STATIC">Static Scan</option>
                <option value="DYNAMIC">Dynamic Scan</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Category:</FilterLabel>
              <FilterSelect
                value={categoryFilter}
                onChange={(e) => updateFilter('category', e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {SECURITY_CHECK_CATEGORIES.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Status:</FilterLabel>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="FIXING">Fixing</option>
                <option value="FIXED">Fixed</option>
                <option value="VERIFIED">Verified</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="IGNORED">Ignored</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterCheckbox
                type="checkbox"
                id="blocking-only"
                checked={blockingOnly}
                onChange={(e) => updateFilter('blocking', String(e.target.checked))}
              />
              <FilterLabel htmlFor="blocking-only" style={{ cursor: 'pointer' }}>
                Blocking Only
              </FilterLabel>
            </FilterGroup>
          </FiltersBar>
        </Section.Content>
      </Section>

      {/* Pending Recommendations */}
      {groupedRecommendations.pending.length > 0 && (
        <Section>
          <Section.Header>
            <Section.Title>
              <SectionTitle $variant="pending">
                PENDING FIXES ({groupedRecommendations.pending.length})
              </SectionTitle>
            </Section.Title>
          </Section.Header>
          <Section.Content>
            <RecommendationsList>
              {groupedRecommendations.pending.map((rec) => (
                <RecommendationCard
                  key={rec.recommendation_id}
                  recommendation={rec}
                  onMarkFixed={() => handleMarkFixed(rec.recommendation_id)}
                  onDismiss={(type) => handleOpenDismiss(rec.recommendation_id, type)}
                  onViewFinding={handleViewFinding}
                />
              ))}
            </RecommendationsList>
          </Section.Content>
        </Section>
      )}

      {/* Resolved Recommendations */}
      {groupedRecommendations.resolved.length > 0 && (
        <Section>
          <Section.Header>
            <Section.Title>
              <SectionTitle $variant="resolved">
                RESOLVED ({groupedRecommendations.resolved.length})
              </SectionTitle>
            </Section.Title>
          </Section.Header>
          <Section.Content>
            <RecommendationsList>
              {groupedRecommendations.resolved.map((rec) => (
                <RecommendationCard
                  key={rec.recommendation_id}
                  recommendation={rec}
                  showFixAction={false}
                  onViewFinding={handleViewFinding}
                />
              ))}
            </RecommendationsList>
          </Section.Content>
        </Section>
      )}

      {/* Empty State */}
      {filteredRecommendations.length === 0 && (
        <Section>
          <Section.Content>
            <EmptyState>
              {recommendations.length === 0 ? (
                <>
                  <h3>No recommendations yet</h3>
                  <p>
                    Run a security scan on your agent code to generate recommendations.
                    Use <code>/scan</code> in your IDE chat.
                  </p>
                </>
              ) : (
                <>
                  <h3>No recommendations match filters</h3>
                  <p>Try adjusting your filter criteria.</p>
                </>
              )}
            </EmptyState>
          </Section.Content>
        </Section>
      )}

      {/* Dismiss Modal */}
      {dismissModalOpen && dismissingRecId && (
        <DismissModal
          recommendationId={dismissingRecId}
          onConfirm={handleDismissConfirm}
          onCancel={() => {
            setDismissModalOpen(false);
            setDismissingRecId(null);
          }}
        />
      )}
    </Page>
  );
};
