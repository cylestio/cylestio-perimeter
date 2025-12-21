import { useState, type FC } from 'react';

import { AlertTriangle, Check, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { AgentSecurityData } from '@api/endpoints/agentWorkflow';
import type { DynamicSecurityCheck, DynamicCategoryId, DynamicCategoryDefinition } from '@api/types/security';

import { TimeAgo } from '@ui/core';

import { DynamicChecksGrid } from '@domain/security';

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
  EmptyState,
} from './SecurityChecksExplorer.styles';

export interface SecurityChecksExplorerProps {
  agents: AgentSecurityData[];
  agentWorkflowId: string;
  className?: string;
}

// Category definitions for display
const CATEGORY_DEFINITIONS: Record<DynamicCategoryId, DynamicCategoryDefinition> = {
  RESOURCE_MANAGEMENT: {
    name: 'Resource Management',
    description: 'Token and tool usage boundaries',
    icon: 'bar-chart',
    order: 1,
  },
  ENVIRONMENT: {
    name: 'Environment & Supply Chain',
    description: 'Model version pinning and tool adoption',
    icon: 'settings',
    order: 2,
  },
  BEHAVIORAL: {
    name: 'Behavioral Stability',
    description: 'Behavioral consistency and predictability',
    icon: 'brain',
    order: 3,
  },
  PRIVACY_COMPLIANCE: {
    name: 'Privacy & PII Compliance',
    description: 'PII exposure detection and reporting',
    icon: 'lock',
    order: 4,
  },
};

export const SecurityChecksExplorer: FC<SecurityChecksExplorerProps> = ({
  agents,
  agentWorkflowId,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentAgent = agents[currentIndex];
  const hasMultipleAgents = agents.length > 1;

  // Convert checks to DynamicSecurityCheck format
  const dynamicChecks: DynamicSecurityCheck[] = currentAgent?.checks.map((check) => ({
    ...check,
    category_id: check.category_id as DynamicCategoryId,
    status: check.status === 'passed' || check.status === 'warning' || check.status === 'critical'
      ? check.status
      : 'passed',
  })) || [];

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
          <AgentLink as={Link} to={`/agent-workflow/${agentWorkflowId}/agent/${currentAgent.agent_id}`}>
            {currentAgent.agent_id}
            <ExternalLink size={12} />
          </AgentLink>
          {hasMultipleAgents && (
            <AgentCounter>
              Agent {currentIndex + 1} of {agents.length}
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
              aria-label="Previous agent"
            >
              <ChevronLeft size={16} />
            </NavButton>
            <NavButton
              onClick={handleNext}
              disabled={currentIndex === agents.length - 1}
              $disabled={currentIndex === agents.length - 1}
              aria-label="Next agent"
            >
              <ChevronRight size={16} />
            </NavButton>
          </NavigationControls>
        )}
      </ExplorerHeader>

      <DynamicChecksGrid
        checks={dynamicChecks}
        categoryDefinitions={CATEGORY_DEFINITIONS}
        groupBy="category"
        variant="list"
        clickable={true}
        showSummary={false}
        agentWorkflowId={agentWorkflowId}
      />
    </ExplorerContainer>
  );
};
