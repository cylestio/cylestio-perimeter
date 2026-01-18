import { useState, useMemo, type FC } from 'react';

import { Shield } from 'lucide-react';

import type {
  DynamicCategoryId,
  DynamicCategoryDefinition,
  AgentCheckStatus,
  AggregatedCheck,
} from '@api/types/security';
import {
  aggregateChecksByType,
  groupAggregatedByCategory,
  type AgentDataForAggregation,
} from '@api/types/security';
import {
  DYNAMIC_CATEGORY_ORDER,
  DYNAMIC_CATEGORY_ICONS,
} from '@constants/securityChecks';

import { AggregatedCheckItem } from '../AggregatedCheckItem';
import { AgentStatusList } from '../AgentStatusList';
import { DynamicCheckDrawer } from '../DynamicCheckDrawer/DynamicCheckDrawer';

import {
  Container,
  SummaryBar,
  SummaryItem,
  SummaryCount,
  SummaryLabel,
  SummaryDivider,
  CategoryGroup,
  CategoryHeader,
  CategoryIcon,
  CategoryName,
  CategoryBadge,
  ChecksList,
  EmptyState,
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from './AllAgentsChecksView.styles';

export interface AllAgentsChecksViewProps {
  /** List of agents with their checks */
  agents: AgentDataForAggregation[];
  /** Category definitions from API */
  categoryDefinitions?: Record<DynamicCategoryId, DynamicCategoryDefinition>;
  /** Agent workflow ID for session links */
  agentWorkflowId?: string;
  /** Additional class name */
  className?: string;
}

/**
 * AllAgentsChecksView shows aggregated security checks across all agents.
 * Groups checks by category, each check showing how many agents have issues.
 * Expanding a check shows per-agent status; clicking an agent opens the drawer.
 */
export const AllAgentsChecksView: FC<AllAgentsChecksViewProps> = ({
  agents,
  categoryDefinitions,
  agentWorkflowId,
  className,
}) => {
  // Expansion state
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  // Drawer state
  const [selectedAgent, setSelectedAgent] = useState<AgentCheckStatus | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Aggregate checks by type
  const aggregatedChecks = useMemo(() => aggregateChecksByType(agents), [agents]);

  // Group by category
  const groupedChecks = useMemo(
    () => groupAggregatedByCategory(aggregatedChecks),
    [aggregatedChecks]
  );

  // Calculate combined summary
  const combinedSummary = useMemo(() => {
    let total = 0;
    let critical = 0;
    let warning = 0;
    let passed = 0;

    for (const agent of agents) {
      for (const check of agent.checks) {
        total++;
        if (check.status === 'critical') critical++;
        else if (check.status === 'warning') warning++;
        else if (check.status === 'passed') passed++;
      }
    }

    return { total, critical, warning, passed };
  }, [agents]);

  // Toggle check expansion
  const toggleCheck = (checkType: string) => {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkType)) {
        next.delete(checkType);
      } else {
        next.add(checkType);
      }
      return next;
    });
  };

  // Handle agent click
  const handleAgentClick = (agent: AgentCheckStatus) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedAgent(null), 200);
  };

  // Empty state
  if (aggregatedChecks.length === 0) {
    return (
      <EmptyState className={className}>
        <EmptyIcon>
          <Shield />
        </EmptyIcon>
        <EmptyTitle>No Security Checks</EmptyTitle>
        <EmptyDescription>No security checks have been run yet.</EmptyDescription>
      </EmptyState>
    );
  }

  // Render category group
  const renderCategoryGroup = (categoryId: DynamicCategoryId) => {
    const categoryChecks = groupedChecks[categoryId];
    if (!categoryChecks || categoryChecks.length === 0) return null;

    const CategoryIconComponent = DYNAMIC_CATEGORY_ICONS[categoryId];
    const categoryDef = categoryDefinitions?.[categoryId];
    const hasIssues = categoryChecks.some((c: AggregatedCheck) => c.summary.issues > 0);

    return (
      <CategoryGroup key={categoryId}>
        <CategoryHeader>
          {CategoryIconComponent && (
            <CategoryIcon>
              <CategoryIconComponent />
            </CategoryIcon>
          )}
          <CategoryName>
            {categoryDef?.name || categoryId.replace(/_/g, ' ')}
          </CategoryName>
          <CategoryBadge $hasIssues={hasIssues}>
            {categoryChecks.length} check{categoryChecks.length !== 1 ? 's' : ''}
          </CategoryBadge>
        </CategoryHeader>
        <ChecksList>
          {categoryChecks.map((check: AggregatedCheck) => (
            <AggregatedCheckItem
              key={check.check_type}
              check={check}
              expanded={expandedChecks.has(check.check_type)}
              onToggle={() => toggleCheck(check.check_type)}
            >
              <AgentStatusList agents={check.agents} onAgentClick={handleAgentClick} />
            </AggregatedCheckItem>
          ))}
        </ChecksList>
      </CategoryGroup>
    );
  };

  return (
    <Container className={className}>
      {/* Summary Bar */}
      <SummaryBar>
        <SummaryItem>
          <SummaryCount $color="total">{combinedSummary.total}</SummaryCount>
          <SummaryLabel>Total</SummaryLabel>
        </SummaryItem>
        <SummaryDivider />
        <SummaryItem>
          <SummaryCount $color="critical">{combinedSummary.critical}</SummaryCount>
          <SummaryLabel>Critical</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryCount $color="warning">{combinedSummary.warning}</SummaryCount>
          <SummaryLabel>Warning</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryCount $color="passed">{combinedSummary.passed}</SummaryCount>
          <SummaryLabel>Passed</SummaryLabel>
        </SummaryItem>
      </SummaryBar>

      {/* Categories */}
      {DYNAMIC_CATEGORY_ORDER.map(renderCategoryGroup)}

      {/* Drawer */}
      <DynamicCheckDrawer
        check={selectedAgent?.check || null}
        categoryDefinition={
          selectedAgent
            ? categoryDefinitions?.[selectedAgent.check.category_id as DynamicCategoryId]
            : undefined
        }
        open={drawerOpen}
        onClose={handleDrawerClose}
        agentWorkflowId={agentWorkflowId}
      />
    </Container>
  );
};
