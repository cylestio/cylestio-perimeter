import { useCallback, useEffect, useState, useMemo, type FC } from 'react';

import { 
  ClipboardList, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { 
  fetchRecommendations, 
  fetchGateStatus,
  fetchIdeStatus,
  dismissRecommendation,
  fetchRecommendationAuditLog,
  type AuditLogEntry,
} from '@api/endpoints/agent';
import type { 
  Recommendation, 
  RecommendationStatus,
  GateStatus,
} from '@api/types/findings';
import { buildAgentBreadcrumbs } from '@utils/breadcrumbs';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Section } from '@ui/layout/Section';
import { Modal } from '@ui/overlays/Modal';
import { Button } from '@ui/core/Button';

import { 
  RecommendationCard,
  DismissModal,
  ProgressSummary,
  AuditTrail,
  type DismissType,
} from '@domain/recommendations';

import { usePageMeta } from '../../context';
import {
  RecommendationsLayout,
  PageHeader,
  PageInfo,
  PageTitle,
  PageSubtitle,
  AgentBadge,
  FilterTabsRow,
  FilterTabs,
  FilterTab,
  FilterCount,
  FixAllButton,
  RecommendationsList,
  SectionHeader,
  SectionTitle,
  SectionCount,
  ResolvedSection,
  ResolvedList,
  ResolvedItem,
  ResolvedId,
  ResolvedStatus,
  ResolvedTitle,
  ResolvedDate,
  EmptyState,
  EvidenceContent,
  EvidenceSection,
  EvidenceLabel,
  EvidenceCode,
  EvidenceText,
} from './Recommendations.styles';

export interface RecommendationsProps {
  className?: string;
}

type TabFilter = 'all' | 'pending' | 'resolved';

const isResolvedStatus = (status: RecommendationStatus): boolean => {
  return ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(status);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const Recommendations: FC<RecommendationsProps> = ({ className }) => {
  const { agentId } = useParams<{ agentId: string }>();

  // Data state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [gateStatus, setGateStatus] = useState<GateStatus | null>(null);
  const [ideConnected, setIdeConnected] = useState(false);
  const [ideType, setIdeType] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');

  // Modal state
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [selectedRecForDismiss, setSelectedRecForDismiss] = useState<Recommendation | null>(null);
  
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedRecForEvidence, setSelectedRecForEvidence] = useState<Recommendation | null>(null);
  const [auditLogEntries, setAuditLogEntries] = useState<AuditLogEntry[]>([]);
  const [loadingAuditLog, setLoadingAuditLog] = useState(false);
  
  // Copy state for "Fix All" button
  const [fixAllCopied, setFixAllCopied] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch recommendations, gate status, and IDE status in parallel
      const [recsResponse, gateResponse, ideResponse] = await Promise.all([
        fetchRecommendations(agentId),
        fetchGateStatus(agentId),
        fetchIdeStatus(agentId).catch(() => null),
      ]);

      setRecommendations(recsResponse.recommendations);
      setGateStatus(gateResponse);
      
      if (ideResponse) {
        setIdeConnected(ideResponse.is_connected);
        setIdeType(ideResponse.connected_ide?.ide_type);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  usePageMeta({
    breadcrumbs: agentId
      ? buildAgentBreadcrumbs(agentId, { label: 'Recommendations' })
      : [{ label: 'Agents', href: '/' }, { label: 'Recommendations' }],
  });

  // Computed values
  const { pendingRecs, resolvedRecs, fixingRecs } = useMemo(() => {
    const pending: Recommendation[] = [];
    const resolved: Recommendation[] = [];
    const fixing: Recommendation[] = [];

    for (const rec of recommendations) {
      if (rec.status === 'FIXING') {
        fixing.push(rec);
      } else if (isResolvedStatus(rec.status)) {
        resolved.push(rec);
      } else {
        pending.push(rec);
      }
    }

    return { pendingRecs: pending, resolvedRecs: resolved, fixingRecs: fixing };
  }, [recommendations]);

  const filteredRecs = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return [...fixingRecs, ...pendingRecs];
      case 'resolved':
        return resolvedRecs;
      default:
        return recommendations;
    }
  }, [activeTab, pendingRecs, resolvedRecs, fixingRecs, recommendations]);

  // Handlers
  const handleViewEvidence = useCallback(async (rec: Recommendation) => {
    setSelectedRecForEvidence(rec);
    setEvidenceModalOpen(true);
    setLoadingAuditLog(true);
    
    try {
      const response = await fetchRecommendationAuditLog(rec.recommendation_id);
      setAuditLogEntries(response.audit_log);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
      setAuditLogEntries([]);
    } finally {
      setLoadingAuditLog(false);
    }
  }, []);

  const handleDismissClick = useCallback((rec: Recommendation) => {
    setSelectedRecForDismiss(rec);
    setDismissModalOpen(true);
  }, []);

  const handleDismissConfirm = useCallback(async (type: DismissType, reason: string) => {
    if (!selectedRecForDismiss) return;

    try {
      await dismissRecommendation(selectedRecForDismiss.recommendation_id, {
        reason,
        dismiss_type: type,
      });
      
      // Refresh data
      await fetchData();
      
      setDismissModalOpen(false);
      setSelectedRecForDismiss(null);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  }, [selectedRecForDismiss, fetchData]);

  const handleMarkFixed = useCallback((rec: Recommendation) => {
    // For now, just show the command to use in Cursor
    // The actual fix will be done through the MCP tools
    const command = `Fix security issue ${rec.recommendation_id}`;
    navigator.clipboard.writeText(command);
  }, []);

  const handleFixAll = useCallback(() => {
    // Get all pending/fixing recommendation IDs
    const pendingIds = [...fixingRecs, ...pendingRecs].map(rec => rec.recommendation_id);
    
    if (pendingIds.length === 0) return;
    
    // Generate a prompt to fix all issues
    const prompt = `Fix security issues ${pendingIds.join(', ')}`;
    navigator.clipboard.writeText(prompt);
    
    // Show copied feedback
    setFixAllCopied(true);
    setTimeout(() => setFixAllCopied(false), 2000);
  }, [fixingRecs, pendingRecs]);

  // Render loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <RecommendationsLayout className={className}>
        <EmptyState>
          <AlertCircle size={48} />
          <h3>Error loading recommendations</h3>
          <p>{error}</p>
          <Button onClick={fetchData} style={{ marginTop: '16px' }}>
            Try Again
          </Button>
        </EmptyState>
      </RecommendationsLayout>
    );
  }

  // Calculate counts
  const pendingCount = pendingRecs.length + fixingRecs.length;
  const resolvedCount = resolvedRecs.length;
  const totalCount = recommendations.length;

  return (
    <RecommendationsLayout className={className} data-testid="recommendations">
      {/* Header */}
      <PageHeader>
        <PageInfo>
          <PageTitle>
            <ClipboardList size={24} style={{ marginRight: '8px' }} />
            Recommendations
          </PageTitle>
          <PageSubtitle>
            Fix security issues to unblock Production deployment
          </PageSubtitle>
        </PageInfo>
        {agentId && <AgentBadge>{agentId}</AgentBadge>}
      </PageHeader>

      {/* Progress Summary */}
      {gateStatus && (
        <ProgressSummary
          gateStatus={gateStatus}
          totalRecommendations={totalCount}
          resolvedCount={resolvedCount}
          ideConnected={ideConnected}
          ideType={ideType}
        />
      )}

      {/* Filter Tabs */}
      <FilterTabsRow>
        <FilterTabs>
          <FilterTab
            $active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={14} />
            Pending
            <FilterCount>{pendingCount}</FilterCount>
          </FilterTab>
          <FilterTab
            $active={activeTab === 'resolved'}
            onClick={() => setActiveTab('resolved')}
          >
            <CheckCircle2 size={14} />
            Resolved
            <FilterCount>{resolvedCount}</FilterCount>
          </FilterTab>
          <FilterTab
            $active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            <Filter size={14} />
            All
            <FilterCount>{totalCount}</FilterCount>
          </FilterTab>
        </FilterTabs>
        
        {pendingCount > 0 && (
          <FixAllButton onClick={handleFixAll} disabled={fixAllCopied}>
            {fixAllCopied ? (
              <>
                <Check size={14} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Fix All Prompt
              </>
            )}
          </FixAllButton>
        )}
      </FilterTabsRow>

      {/* Recommendations List */}
      <Section>
        <Section.Content>
          {filteredRecs.length > 0 ? (
            <>
              {/* Pending/Fixing Recommendations */}
              {activeTab !== 'resolved' && (
                <>
                  {fixingRecs.length > 0 && (
                    <>
                      <SectionHeader>
                        <SectionTitle>
                          <Clock size={16} style={{ color: '#eab308' }} />
                          In Progress
                        </SectionTitle>
                        <SectionCount>{fixingRecs.length}</SectionCount>
                      </SectionHeader>
                      <RecommendationsList>
                        {fixingRecs.map((rec) => (
                          <RecommendationCard
                            key={rec.recommendation_id}
                            recommendation={rec}
                            connectedIde={ideConnected ? (ideType as any) : null}
                            onViewEvidence={handleViewEvidence}
                            onMarkFixed={handleMarkFixed}
                            onDismiss={handleDismissClick}
                          />
                        ))}
                      </RecommendationsList>
                    </>
                  )}

                  {pendingRecs.length > 0 && (
                    <>
                      <SectionHeader style={{ marginTop: fixingRecs.length > 0 ? '24px' : 0 }}>
                        <SectionTitle>
                          <AlertCircle size={16} style={{ color: '#ef4444' }} />
                          Pending Fixes
                        </SectionTitle>
                        <SectionCount>{pendingRecs.length}</SectionCount>
                      </SectionHeader>
                      <RecommendationsList>
                        {pendingRecs.map((rec) => (
                          <RecommendationCard
                            key={rec.recommendation_id}
                            recommendation={rec}
                            connectedIde={ideConnected ? (ideType as any) : null}
                            onViewEvidence={handleViewEvidence}
                            onMarkFixed={handleMarkFixed}
                            onDismiss={handleDismissClick}
                          />
                        ))}
                      </RecommendationsList>
                    </>
                  )}
                </>
              )}

              {/* Resolved Recommendations */}
              {(activeTab === 'resolved' || activeTab === 'all') && resolvedRecs.length > 0 && (
                <ResolvedSection style={{ marginTop: activeTab === 'all' ? '24px' : 0 }}>
                  <SectionHeader>
                    <SectionTitle>
                      <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                      Resolved
                    </SectionTitle>
                    <SectionCount>{resolvedRecs.length}</SectionCount>
                  </SectionHeader>
                  
                  {activeTab === 'resolved' ? (
                    <RecommendationsList>
                      {resolvedRecs.map((rec) => (
                        <RecommendationCard
                          key={rec.recommendation_id}
                          recommendation={rec}
                          connectedIde={ideConnected ? (ideType as any) : null}
                          onViewEvidence={handleViewEvidence}
                        />
                      ))}
                    </RecommendationsList>
                  ) : (
                    <ResolvedList>
                      {resolvedRecs.slice(0, 5).map((rec) => (
                        <ResolvedItem key={rec.recommendation_id}>
                          <ResolvedStatus>
                            <CheckCircle2 size={14} />
                            {rec.status}
                          </ResolvedStatus>
                          <ResolvedId>{rec.recommendation_id}</ResolvedId>
                          <ResolvedTitle>{rec.title}</ResolvedTitle>
                          {rec.fixed_at && (
                            <ResolvedDate>{formatDate(rec.fixed_at)}</ResolvedDate>
                          )}
                        </ResolvedItem>
                      ))}
                      {resolvedRecs.length > 5 && (
                        <div style={{ padding: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          +{resolvedRecs.length - 5} more resolved
                        </div>
                      )}
                    </ResolvedList>
                  )}
                </ResolvedSection>
              )}
            </>
          ) : (
            <EmptyState>
              {activeTab === 'pending' ? (
                <>
                  <CheckCircle2 size={48} />
                  <h3>No pending recommendations</h3>
                  <p>
                    {resolvedCount > 0
                      ? 'All security issues have been addressed. Great job!'
                      : 'Run a security scan to identify issues in your agent code.'}
                  </p>
                </>
              ) : activeTab === 'resolved' ? (
                <>
                  <Clock size={48} />
                  <h3>No resolved recommendations yet</h3>
                  <p>Fix pending issues to see them appear here.</p>
                </>
              ) : (
                <>
                  <ClipboardList size={48} />
                  <h3>No recommendations</h3>
                  <p>
                    Run a security scan on your agent code to generate recommendations.
                  </p>
                </>
              )}
            </EmptyState>
          )}
        </Section.Content>
      </Section>

      {/* Dismiss Modal */}
      <DismissModal
        open={dismissModalOpen}
        recommendationId={selectedRecForDismiss?.recommendation_id || ''}
        recommendationTitle={selectedRecForDismiss?.title}
        onConfirm={handleDismissConfirm}
        onCancel={() => {
          setDismissModalOpen(false);
          setSelectedRecForDismiss(null);
        }}
      />

      {/* Evidence Modal */}
      <Modal
        open={evidenceModalOpen}
        onClose={() => {
          setEvidenceModalOpen(false);
          setSelectedRecForEvidence(null);
          setAuditLogEntries([]);
        }}
        title={`Evidence - ${selectedRecForEvidence?.recommendation_id || ''}`}
        size="lg"
      >
        {selectedRecForEvidence && (
          <EvidenceContent>
            {/* Description */}
            {selectedRecForEvidence.description && (
              <EvidenceSection>
                <EvidenceLabel>Description</EvidenceLabel>
                <EvidenceText>{selectedRecForEvidence.description}</EvidenceText>
              </EvidenceSection>
            )}

            {/* Code Snippet */}
            {selectedRecForEvidence.code_snippet && (
              <EvidenceSection>
                <EvidenceLabel>Code Snippet</EvidenceLabel>
                <EvidenceCode>{selectedRecForEvidence.code_snippet}</EvidenceCode>
              </EvidenceSection>
            )}

            {/* Fix Hints */}
            {selectedRecForEvidence.fix_hints && (
              <EvidenceSection>
                <EvidenceLabel>Fix Guidance</EvidenceLabel>
                <EvidenceText>{selectedRecForEvidence.fix_hints}</EvidenceText>
              </EvidenceSection>
            )}

            {/* Fix Notes (if fixed) */}
            {selectedRecForEvidence.fix_notes && (
              <EvidenceSection>
                <EvidenceLabel>Fix Notes</EvidenceLabel>
                <EvidenceText>{selectedRecForEvidence.fix_notes}</EvidenceText>
              </EvidenceSection>
            )}

            {/* Audit Trail */}
            <EvidenceSection>
              <EvidenceLabel>Audit Trail</EvidenceLabel>
              {loadingAuditLog ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <OrbLoader size="sm" />
                </div>
              ) : (
                <AuditTrail entries={auditLogEntries} />
              )}
            </EvidenceSection>
          </EvidenceContent>
        )}
      </Modal>
    </RecommendationsLayout>
  );
};
