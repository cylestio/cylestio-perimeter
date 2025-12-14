import { useState, useMemo, type FC } from 'react';

import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, Shield, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { AgentStepSecurityData, AgentWorkflowSecurityCheck } from '@api/endpoints/agentWorkflow';

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
  CheckItem,
  CheckInfo,
  CheckIcon,
  CheckTitle,
  CheckValue,
  CheckStatusBadge,
  EmptyState,
} from './SecurityChecksExplorer.styles';

export interface SecurityChecksExplorerProps {
  agentSteps: AgentStepSecurityData[];
  agentWorkflowId: string;
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
  agentSteps,
  agentWorkflowId,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentAgentStep = agentSteps[currentIndex];
  const hasMultipleAgentSteps = agentSteps.length > 1;

  // Group checks by category for current agent step
  const checksByCategory = useMemo(() => {
    if (!currentAgentStep) return {};
    const grouped: Record<string, AgentWorkflowSecurityCheck[]> = {};
    currentAgentStep.checks.forEach((check) => {
      if (!grouped[check.category_id]) {
        grouped[check.category_id] = [];
      }
      grouped[check.category_id].push(check);
    });
    return grouped;
  }, [currentAgentStep]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < agentSteps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (agentSteps.length === 0) {
    return (
      <EmptyState>
        <p>No security checks available.</p>
        <p style={{ fontSize: '12px' }}>
          Security checks will appear after dynamic analysis runs.
        </p>
      </EmptyState>
    );
  }

  if (!currentAgentStep) {
    return null;
  }

  return (
    <ExplorerContainer className={className} data-testid="security-checks-explorer">
      <ExplorerHeader>
        <AgentInfo>
          <AgentLink as={Link} to={`/agent-workflow/${agentWorkflowId}/agent-step/${currentAgentStep.agent_step_id}`}>
            {currentAgentStep.agent_step_id}
            <ExternalLink size={12} />
          </AgentLink>
          {hasMultipleAgentSteps && (
            <AgentCounter>
              Agent Step {currentIndex + 1} of {agentSteps.length}
            </AgentCounter>
          )}
          {currentAgentStep.latest_check_at && (
            <LastUpdated>
              <TimeAgo timestamp={currentAgentStep.latest_check_at} />
            </LastUpdated>
          )}
        </AgentInfo>

        <SummaryBadges>
          {currentAgentStep.summary.passed > 0 && (
            <SummaryBadge $variant="passed">
              <Check size={10} />
              {currentAgentStep.summary.passed} passed
            </SummaryBadge>
          )}
          {currentAgentStep.summary.warnings > 0 && (
            <SummaryBadge $variant="warning">
              <AlertTriangle size={10} />
              {currentAgentStep.summary.warnings} warnings
            </SummaryBadge>
          )}
          {currentAgentStep.summary.critical > 0 && (
            <SummaryBadge $variant="critical">
              <X size={10} />
              {currentAgentStep.summary.critical} critical
            </SummaryBadge>
          )}
        </SummaryBadges>

        {hasMultipleAgentSteps && (
          <NavigationControls>
            <NavButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              $disabled={currentIndex === 0}
              aria-label="Previous agent step"
            >
              <ChevronLeft size={16} />
            </NavButton>
            <NavButton
              onClick={handleNext}
              disabled={currentIndex === agentSteps.length - 1}
              $disabled={currentIndex === agentSteps.length - 1}
              aria-label="Next agent step"
            >
              <ChevronRight size={16} />
            </NavButton>
          </NavigationControls>
        )}
      </ExplorerHeader>

      {currentAgentStep.checks.length === 0 ? (
        <EmptyState>
          <p>No checks for this agent step yet.</p>
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
                  {checks.map((check) => (
                    <CheckItem key={check.check_id}>
                      <CheckInfo>
                        <CheckIcon $status={check.status}>
                          {getStatusIcon(check.status)}
                        </CheckIcon>
                        <CheckTitle>{check.title}</CheckTitle>
                        {check.value && <CheckValue>({check.value})</CheckValue>}
                      </CheckInfo>
                      <CheckStatusBadge $status={check.status}>
                        {check.status}
                      </CheckStatusBadge>
                    </CheckItem>
                  ))}
                </CheckList>
              </CategoryCard>
            );
          })}
        </ChecksGrid>
      )}
    </ExplorerContainer>
  );
};
