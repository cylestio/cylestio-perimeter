import { useCallback, useEffect, useState, useMemo, type FC } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import styled from 'styled-components';

import { RecommendationsIcon } from '@constants/pageIcons';
import { 
  fetchRecommendations, 
  fetchGateStatus,
  completeFix,
  dismissRecommendation,
  type GateStatusResponse,
} from '@api/endpoints/agentWorkflow';
import type { 
  Recommendation, 
  SecurityCheckCategory,
  FindingSeverity,
} from '@api/types/findings';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { Tabs, type Tab } from '@ui/navigation/Tabs';
import { ToggleGroup } from '@ui/navigation/ToggleGroup';

import { DismissModal, type DismissType } from '@domain/recommendations/DismissModal';
import {
  SummaryStatsBar,
  SeverityProgressBar,
  IssueCard,
  CategoryDonut,
  SourceDistribution,
  DetectionTimeline,
} from '@domain/recommendations/dashboard';

import { usePageMeta } from '../../context';

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

const TabContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: ${({ theme }) => theme.spacing[4]};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const FilterLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

const ActiveFilter = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white};
    margin: 0 0 ${({ theme }) => theme.spacing[2]};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.white50};
    margin: 0;
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.red};
`;

// Types
export interface RecommendationsProps {
  className?: string;
}

type DashboardTab = 'overview' | 'by-severity' | 'resolved';

// Component
export const Recommendations: FC<RecommendationsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  // State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [gateStatus, setGateStatus] = useState<GateStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedSeverity, setSelectedSeverity] = useState<FindingSeverity | 'ALL'>('ALL');
  
  // Filter state (from charts)
  const [selectedCategory, setSelectedCategory] = useState<SecurityCheckCategory | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<'STATIC' | 'DYNAMIC' | null>(null);

  // Dismiss modal state
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissingRecId, setDismissingRecId] = useState<string | null>(null);
  const [dismissType, setDismissType] = useState<'DISMISSED' | 'IGNORED'>('DISMISSED');

  // Set page meta
  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Security Dashboard' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Security Dashboard' }],
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
    const interval = setInterval(() => fetchData(), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Computed data
  const isResolved = (status: string) => 
    ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(status);

  const pendingRecommendations = useMemo(() => 
    recommendations.filter(r => !isResolved(r.status)),
    [recommendations]
  );

  const resolvedRecommendations = useMemo(() => 
    recommendations.filter(r => isResolved(r.status)),
    [recommendations]
  );

  // Filter by severity, category, file
  const filteredByTab = useMemo(() => {
    let filtered = activeTab === 'resolved' 
      ? resolvedRecommendations 
      : pendingRecommendations;

    if (selectedSeverity !== 'ALL') {
      filtered = filtered.filter(r => r.severity === selectedSeverity);
    }

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (selectedSource) {
      filtered = filtered.filter(r => {
        if (selectedSourceType === 'STATIC') {
          return r.file_path === selectedSource;
        } else {
          return (r.file_path || 'Runtime Detection') === selectedSource;
        }
      });
    }

    return filtered;
  }, [activeTab, pendingRecommendations, resolvedRecommendations, selectedSeverity, selectedCategory, selectedSource, selectedSourceType]);

  // Severity counts for pills
  const severityCounts = useMemo(() => ({
    CRITICAL: pendingRecommendations.filter(r => r.severity === 'CRITICAL').length,
    HIGH: pendingRecommendations.filter(r => r.severity === 'HIGH').length,
    MEDIUM: pendingRecommendations.filter(r => r.severity === 'MEDIUM').length,
    LOW: pendingRecommendations.filter(r => r.severity === 'LOW').length,
  }), [pendingRecommendations]);

  // Handlers
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

  const handleOpenDismiss = (recId: string, type: 'DISMISSED' | 'IGNORED' = 'DISMISSED') => {
    setDismissingRecId(recId);
    setDismissType(type);
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

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSource(null);
    setSelectedSourceType(null);
  };

  const handleSourceClick = (source: string | null, type: 'STATIC' | 'DYNAMIC') => {
    if (source === null) {
      setSelectedSource(null);
      setSelectedSourceType(null);
    } else {
      setSelectedSource(source);
      setSelectedSourceType(type);
    }
  };

  // Blocking counts
  const blockingCritical = severityCounts.CRITICAL;
  const blockingHigh = severityCounts.HIGH;

  // Tab config
  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'by-severity', label: 'By Severity', count: pendingRecommendations.length },
    { id: 'resolved', label: 'Resolved', count: resolvedRecommendations.length },
  ];

  // Severity pills for By Severity tab
  const severityOptions = [
    { id: 'ALL', label: 'All', active: selectedSeverity === 'ALL' },
    { id: 'CRITICAL', label: `Critical (${severityCounts.CRITICAL})`, active: selectedSeverity === 'CRITICAL' },
    { id: 'HIGH', label: `High (${severityCounts.HIGH})`, active: selectedSeverity === 'HIGH' },
    { id: 'MEDIUM', label: `Medium (${severityCounts.MEDIUM})`, active: selectedSeverity === 'MEDIUM' },
    { id: 'LOW', label: `Low (${severityCounts.LOW})`, active: selectedSeverity === 'LOW' },
  ];

  // Loading state
  if (loading) {
    return (
      <Page className={className} data-testid="security-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <OrbLoader size="lg" />
        </div>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page className={className} data-testid="security-dashboard">
        <PageHeader
          icon={<RecommendationsIcon size={24} />}
          title="Security Dashboard"
          description="AI-powered security analysis and recommendations"
        />
        <ErrorState>
          <p>{error}</p>
          <RefreshButton onClick={() => fetchData()}>
            <RefreshCw size={14} />
            Retry
          </RefreshButton>
        </ErrorState>
      </Page>
    );
  }

  return (
    <Page className={className} data-testid="security-dashboard">
      <PageHeader
        icon={<RecommendationsIcon size={24} />}
        title="Security Dashboard"
        description="AI-powered security analysis and recommendations"
        actions={
          <RefreshButton onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        }
      />

      <Section>
        <Section.Content>
          <DashboardContainer>
            {/* Tabs Navigation */}
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => {
                setActiveTab(tabId as DashboardTab);
                clearFilters();
                setSelectedSeverity('ALL');
              }}
              variant="pills"
            />

            {/* Overview Tab */}
            {activeTab === 'overview' && gateStatus && (
              <TabContent>
                {/* Summary Stats */}
                <SummaryStatsBar
                  recommendations={recommendations}
                  gateStatus={gateStatus.gate_status}
                  blockingCritical={blockingCritical}
                  blockingHigh={blockingHigh}
                />

                {/* Progress Bar */}
                <div style={{ marginTop: '20px' }}>
                  <SeverityProgressBar recommendations={recommendations} />
                </div>

                {/* Charts Row */}
                <ChartsGrid style={{ marginTop: '20px' }}>
                  <CategoryDonut
                    recommendations={recommendations}
                    selectedCategory={selectedCategory}
                    onCategoryClick={setSelectedCategory}
                  />
                  <SourceDistribution
                    recommendations={recommendations}
                    selectedSource={selectedSource}
                    onSourceClick={handleSourceClick}
                  />
                </ChartsGrid>

                {/* Timeline */}
                <div style={{ marginTop: '20px' }}>
                  <DetectionTimeline recommendations={recommendations} />
                </div>

                {/* Active Filters and Filtered Issues */}
                {(selectedCategory || selectedSource) && (
                  <>
                    <FiltersRow style={{ marginTop: '20px' }}>
                      <FilterLabel>Filters:</FilterLabel>
                      {selectedCategory && (
                        <ActiveFilter onClick={() => setSelectedCategory(null)}>
                          Category: {selectedCategory} ✕
                        </ActiveFilter>
                      )}
                      {selectedSource && (
                        <ActiveFilter onClick={() => { setSelectedSource(null); setSelectedSourceType(null); }}>
                          {selectedSourceType}: {selectedSource.split('/').pop()} ✕
                        </ActiveFilter>
                      )}
                    </FiltersRow>

                    <div style={{ marginTop: '16px' }}>
                      <SectionHeader>
                        <SectionTitle>Filtered Issues ({filteredByTab.length})</SectionTitle>
                      </SectionHeader>
                      
                      {filteredByTab.length > 0 ? (
                        <IssuesList>
                          {filteredByTab.map(rec => (
                            <IssueCard
                              key={rec.recommendation_id}
                              recommendation={rec}
                              onMarkFixed={() => handleMarkFixed(rec.recommendation_id)}
                              onDismiss={(type) => handleOpenDismiss(rec.recommendation_id, type)}
                            />
                          ))}
                        </IssuesList>
                      ) : (
                        <EmptyState>
                          <h3>No issues match filters</h3>
                          <p>Try adjusting your filter criteria.</p>
                        </EmptyState>
                      )}
                    </div>
                  </>
                )}
              </TabContent>
            )}

            {/* By Severity Tab */}
            {activeTab === 'by-severity' && (
              <TabContent>
                <ToggleGroup
                  options={severityOptions}
                  onChange={(val) => setSelectedSeverity(val as FindingSeverity | 'ALL')}
                />

                <div style={{ marginTop: '20px' }}>
                  {filteredByTab.length > 0 ? (
                    <IssuesList>
                      {filteredByTab.map(rec => (
                        <IssueCard
                          key={rec.recommendation_id}
                          recommendation={rec}
                          onMarkFixed={() => handleMarkFixed(rec.recommendation_id)}
                          onDismiss={(type) => handleOpenDismiss(rec.recommendation_id, type)}
                        />
                      ))}
                    </IssuesList>
                  ) : (
                    <EmptyState>
                      <h3>No issues found</h3>
                      <p>
                        {selectedSeverity === 'ALL' 
                          ? 'No pending issues to display.'
                          : `No ${selectedSeverity.toLowerCase()} severity issues.`
                        }
                      </p>
                    </EmptyState>
                  )}
                </div>
              </TabContent>
            )}

            {/* Resolved Tab */}
            {activeTab === 'resolved' && (
              <TabContent>
                {resolvedRecommendations.length > 0 ? (
                  <>
                    <FiltersRow>
                      <FilterLabel>
                        Fixed: {resolvedRecommendations.filter(r => r.status === 'FIXED' || r.status === 'VERIFIED').length}
                      </FilterLabel>
                      <FilterLabel>|</FilterLabel>
                      <FilterLabel>
                        Dismissed: {resolvedRecommendations.filter(r => r.status === 'DISMISSED' || r.status === 'IGNORED').length}
                      </FilterLabel>
                      <FilterLabel>|</FilterLabel>
                      <FilterLabel>
                        Total: {resolvedRecommendations.length}
                      </FilterLabel>
                    </FiltersRow>

                    <IssuesList>
                      {resolvedRecommendations.map(rec => (
                        <IssueCard
                          key={rec.recommendation_id}
                          recommendation={rec}
                        />
                      ))}
                    </IssuesList>
                  </>
                ) : (
                  <EmptyState>
                    <h3>No resolved issues</h3>
                    <p>Issues that are fixed or dismissed will appear here.</p>
                  </EmptyState>
                )}
              </TabContent>
            )}
          </DashboardContainer>
        </Section.Content>
      </Section>

      {/* Dismiss Modal */}
      {dismissModalOpen && dismissingRecId && (
        <DismissModal
          recommendationId={dismissingRecId}
          defaultType={dismissType}
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
