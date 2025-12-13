import { useState, useMemo, type FC } from 'react';

import { AlertTriangle, Check, ChevronLeft, ChevronRight, ChevronRight as Chevron, Clock, ExternalLink, Shield, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { AgentSecurityCheck, SystemPromptSecurityData as AgentSecurityData } from '@api/endpoints/agent';

import { TimeAgo } from '@ui/core';

import {
  ExplorerContainer,
  ExplorerHeader,
  AgentInfo,
  AgentLink,
  AgentCounter,
  LastUpdated,
  NavigationControls,
  NavButton,
  SummaryBadges,
  SummaryBadge,
  ChecksGrid,
  CategoryCard,
  CategoryHeader,
  CategoryTitle,
  CategoryCount,
  CheckList,
  CheckItemContainer,
  CheckItem,
  CheckDetails,
  CheckDescription,
  CheckEvidence,
  EvidenceLabel,
  EvidenceContent,
  RecommendationsList,
  RecommendationItem,
  ExpandIcon,
  CheckInfo,
  CheckIcon,
  CheckTitle,
  CheckValue,
  CheckStatusBadge,
  EmptyState,
} from './SecurityChecksExplorer.styles';

export interface SecurityChecksExplorerProps {
  agents: AgentSecurityData[];
  agentId: string;
  className?: string;
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  RESOURCE_MANAGEMENT: 'Resource Management',
  ENVIRONMENT: 'Environment',
  BEHAVIORAL: 'Behavioral',
};

// Category order
const CATEGORY_ORDER = ['RESOURCE_MANAGEMENT', 'ENVIRONMENT', 'BEHAVIORAL'];

// Get icon for a category
const getCategoryIcon = (categoryId: string) => {
  switch (categoryId) {
    case 'RESOURCE_MANAGEMENT':
      return <Clock size={14} />;
    case 'ENVIRONMENT':
      return <Shield size={14} />;
    case 'BEHAVIORAL':
      return <AlertTriangle size={14} />;
    default:
      return <Shield size={14} />;
  }
};

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <Check size={12} />;
    case 'warning':
      return <AlertTriangle size={12} />;
    case 'critical':
      return <X size={12} />;
    default:
      return <Check size={12} />;
  }
};

export const SecurityChecksExplorer: FC<SecurityChecksExplorerProps> = ({
  agents,
  agentId,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const currentAgent = agents[currentIndex];
  const hasMultipleAgents = agents.length > 1;

  const toggleCheckExpanded = (checkId: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  // Group checks by category for current agent
  const checksByCategory = useMemo(() => {
    if (!currentAgent) return {};
    const grouped: Record<string, AgentSecurityCheck[]> = {};
    currentAgent.checks.forEach((check) => {
      if (!grouped[check.category_id]) {
        grouped[check.category_id] = [];
      }
      grouped[check.category_id].push(check);
    });
    return grouped;
  }, [currentAgent]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < agents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (agents.length === 0) {
    return (
      <EmptyState>
        <p>No security checks available.</p>
        <p style={{ fontSize: '12px' }}>
          Security checks will appear after dynamic analysis runs.
        </p>
      </EmptyState>
    );
  }

  if (!currentAgent) {
    return null;
  }

  return (
    <ExplorerContainer className={className} data-testid="security-checks-explorer">
      <ExplorerHeader>
        <AgentInfo>
          <AgentLink as={Link} to={`/agent/${agentId}/system-prompt/${currentAgent.system_prompt_id}`}>
            {currentAgent.system_prompt_id}
            <ExternalLink size={12} />
          </AgentLink>
          {hasMultipleAgents && (
            <AgentCounter>
              System prompt {currentIndex + 1} of {agents.length}
            </AgentCounter>
          )}
          {currentAgent.latest_check_at && (
            <LastUpdated>
              <TimeAgo timestamp={currentAgent.latest_check_at} />
            </LastUpdated>
          )}
        </AgentInfo>

        <SummaryBadges>
          {currentAgent.summary.passed > 0 && (
            <SummaryBadge $variant="passed">
              <Check size={10} />
              {currentAgent.summary.passed} passed
            </SummaryBadge>
          )}
          {currentAgent.summary.warnings > 0 && (
            <SummaryBadge $variant="warning">
              <AlertTriangle size={10} />
              {currentAgent.summary.warnings} warnings
            </SummaryBadge>
          )}
          {currentAgent.summary.critical > 0 && (
            <SummaryBadge $variant="critical">
              <X size={10} />
              {currentAgent.summary.critical} critical
            </SummaryBadge>
          )}
        </SummaryBadges>

        {hasMultipleAgents && (
          <NavigationControls>
            <NavButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              $disabled={currentIndex === 0}
              aria-label="Previous system prompt"
            >
              <ChevronLeft size={16} />
            </NavButton>
            <NavButton
              onClick={handleNext}
              disabled={currentIndex === agents.length - 1}
              $disabled={currentIndex === agents.length - 1}
              aria-label="Next system prompt"
            >
              <ChevronRight size={16} />
            </NavButton>
          </NavigationControls>
        )}
      </ExplorerHeader>

      {currentAgent.checks.length === 0 ? (
        <EmptyState>
          <p>No checks for this system prompt yet.</p>
        </EmptyState>
      ) : (
        <ChecksGrid>
          {CATEGORY_ORDER.map((categoryId) => {
            const checks = checksByCategory[categoryId];
            if (!checks || checks.length === 0) return null;

            return (
              <CategoryCard key={categoryId}>
                <CategoryHeader>
                  <CategoryTitle>
                    {getCategoryIcon(categoryId)}
                    {CATEGORY_LABELS[categoryId] || categoryId}
                  </CategoryTitle>
                  <CategoryCount>{checks.length} checks</CategoryCount>
                </CategoryHeader>
                <CheckList>
                  {checks.map((check) => {
                    const isExpanded = expandedChecks.has(check.check_id);
                    const hasDetails = check.description || check.evidence || (check.recommendations && check.recommendations.length > 0);
                    
                    return (
                      <CheckItemContainer key={check.check_id}>
                        <CheckItem 
                          onClick={() => hasDetails && toggleCheckExpanded(check.check_id)}
                          $expanded={isExpanded}
                          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
                        >
                          <CheckInfo>
                            <CheckIcon $status={check.status}>
                              {getStatusIcon(check.status)}
                            </CheckIcon>
                            <CheckTitle>{check.title}</CheckTitle>
                            {check.value && <CheckValue>({check.value})</CheckValue>}
                          </CheckInfo>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckStatusBadge $status={check.status}>
                              {check.status}
                            </CheckStatusBadge>
                            {hasDetails && (
                              <ExpandIcon $expanded={isExpanded}>
                                <Chevron size={12} />
                              </ExpandIcon>
                            )}
                          </div>
                        </CheckItem>
                        
                        {hasDetails && (
                          <CheckDetails $expanded={isExpanded}>
                            {check.description && (
                              <CheckDescription>{check.description}</CheckDescription>
                            )}
                            
                            {check.evidence && Object.keys(check.evidence).length > 0 && (
                              <CheckEvidence>
                                <EvidenceLabel>Evidence</EvidenceLabel>
                                <EvidenceContent>
                                  {JSON.stringify(check.evidence, null, 2)}
                                </EvidenceContent>
                              </CheckEvidence>
                            )}
                            
                            {check.recommendations && check.recommendations.length > 0 && (
                              <CheckEvidence>
                                <EvidenceLabel>Recommendations</EvidenceLabel>
                                <RecommendationsList>
                                  {check.recommendations.map((rec, idx) => (
                                    <RecommendationItem key={idx}>{rec}</RecommendationItem>
                                  ))}
                                </RecommendationsList>
                              </CheckEvidence>
                            )}
                          </CheckDetails>
                        )}
                      </CheckItemContainer>
                    );
                  })}
                </CheckList>
              </CategoryCard>
            );
          })}
        </ChecksGrid>
      )}
    </ExplorerContainer>
  );
};
