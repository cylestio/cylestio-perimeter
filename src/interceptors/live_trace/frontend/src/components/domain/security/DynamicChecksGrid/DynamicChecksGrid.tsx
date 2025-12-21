import { useState, useMemo, type FC } from 'react';

import { Shield } from 'lucide-react';

import type {
  DynamicSecurityCheck,
  DynamicCategoryId,
  DynamicCategoryDefinition,
  DynamicChecksSummary,
} from '@api/types/security';
import {
  groupChecksByCategory,
  calculateChecksSummary,
} from '@api/types/security';
import {
  DYNAMIC_CATEGORY_ORDER,
  DYNAMIC_CATEGORY_ICONS,
} from '@constants/securityChecks';

import { DynamicCheckItem } from '../DynamicCheckItem/DynamicCheckItem';
import { DynamicCheckDrawer } from '../DynamicCheckDrawer/DynamicCheckDrawer';

import {
  GridContainer,
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
  ChecksGrid,
  EmptyState,
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from './DynamicChecksGrid.styles';

// Types
export type GroupBy = 'category' | 'status' | 'none';
export type LayoutVariant = 'list' | 'grid';

export interface DynamicChecksGridProps {
  /** Security checks to display */
  checks: DynamicSecurityCheck[];
  /** Category definitions from API (for display names) */
  categoryDefinitions?: Record<DynamicCategoryId, DynamicCategoryDefinition>;
  /** How to group the checks */
  groupBy?: GroupBy;
  /** Layout variant */
  variant?: LayoutVariant;
  /** Whether checks are clickable (opens drawer) */
  clickable?: boolean;
  /** Show summary bar */
  showSummary?: boolean;
  /** Filter to specific statuses */
  statusFilter?: DynamicSecurityCheck['status'][];
  /** Agent workflow ID for session links */
  agentWorkflowId?: string;
  /** External click handler (if not using built-in drawer) */
  onCheckClick?: (check: DynamicSecurityCheck) => void;
  /** Additional class name */
  className?: string;
}

/**
 * DynamicChecksGrid displays a collection of security checks
 * with optional grouping, filtering, and detail drawer.
 *
 * Features:
 * - Group by category, status, or show flat list
 * - Grid or list layout
 * - Summary bar with counts
 * - Built-in drawer for check details
 */
export const DynamicChecksGrid: FC<DynamicChecksGridProps> = ({
  checks,
  categoryDefinitions,
  groupBy = 'category',
  variant = 'list',
  clickable = true,
  showSummary = true,
  statusFilter,
  agentWorkflowId,
  onCheckClick,
  className,
}) => {
  const [selectedCheck, setSelectedCheck] = useState<DynamicSecurityCheck | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter checks by status if specified
  const filteredChecks = useMemo(() => {
    if (!statusFilter || statusFilter.length === 0) return checks;
    return checks.filter((check) => statusFilter.includes(check.status));
  }, [checks, statusFilter]);

  // Calculate summary
  const summary: DynamicChecksSummary = useMemo(
    () => calculateChecksSummary(filteredChecks),
    [filteredChecks]
  );

  // Group checks
  const groupedChecks = useMemo(() => {
    if (groupBy === 'none') {
      return { all: filteredChecks };
    }

    if (groupBy === 'status') {
      const groups: Record<string, DynamicSecurityCheck[]> = {
        critical: [],
        warning: [],
        analyzing: [],
        passed: [],
      };
      for (const check of filteredChecks) {
        groups[check.status]?.push(check);
      }
      return groups;
    }

    // Group by category
    return groupChecksByCategory(filteredChecks);
  }, [filteredChecks, groupBy]);

  // Handle check click
  const handleCheckClick = (check: DynamicSecurityCheck) => {
    if (onCheckClick) {
      onCheckClick(check);
    } else {
      setSelectedCheck(check);
      setDrawerOpen(true);
    }
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
    // Delay clearing selected check for animation
    setTimeout(() => setSelectedCheck(null), 200);
  };

  // Render checks list/grid
  const renderChecks = (checksToRender: DynamicSecurityCheck[]) => {
    const ChecksContainer = variant === 'grid' ? ChecksGrid : ChecksList;

    return (
      <ChecksContainer>
        {checksToRender.map((check) => (
          <DynamicCheckItem
            key={check.check_id}
            check={check}
            variant="compact"
            clickable={clickable}
            onClick={clickable ? handleCheckClick : undefined}
          />
        ))}
      </ChecksContainer>
    );
  };

  // Render grouped checks
  const renderGroupedChecks = () => {
    if (groupBy === 'none') {
      return renderChecks(filteredChecks);
    }

    if (groupBy === 'status') {
      const statusOrder = ['critical', 'warning', 'analyzing', 'passed'] as const;
      const statusGroups = groupedChecks as Record<string, DynamicSecurityCheck[]>;
      return statusOrder.map((status) => {
        const statusChecks = statusGroups[status] || [];
        if (statusChecks.length === 0) return null;

        return (
          <CategoryGroup key={status}>
            <CategoryHeader>
              <CategoryName style={{ textTransform: 'capitalize' }}>
                {status === 'analyzing' ? 'In Progress' : status}
              </CategoryName>
              <CategoryBadge
                $hasIssues={status === 'critical' || status === 'warning'}
              >
                {statusChecks.length}
              </CategoryBadge>
            </CategoryHeader>
            {renderChecks(statusChecks)}
          </CategoryGroup>
        );
      });
    }

    // Group by category
    return DYNAMIC_CATEGORY_ORDER.map((categoryId) => {
      const categoryChecks =
        (groupedChecks as Record<DynamicCategoryId, DynamicSecurityCheck[]>)[categoryId] || [];
      if (categoryChecks.length === 0) return null;

      const CategoryIconComponent = DYNAMIC_CATEGORY_ICONS[categoryId];
      const categoryDef = categoryDefinitions?.[categoryId];
      const hasIssues = categoryChecks.some(
        (c) => c.status === 'critical' || c.status === 'warning'
      );

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
          {renderChecks(categoryChecks)}
        </CategoryGroup>
      );
    });
  };

  // Empty state
  if (filteredChecks.length === 0) {
    return (
      <EmptyState className={className}>
        <EmptyIcon>
          <Shield />
        </EmptyIcon>
        <EmptyTitle>No Security Checks</EmptyTitle>
        <EmptyDescription>
          {statusFilter
            ? 'No checks match the selected filter.'
            : 'No security checks have been run yet.'}
        </EmptyDescription>
      </EmptyState>
    );
  }

  return (
    <GridContainer className={className}>
      {/* Summary Bar */}
      {showSummary && (
        <SummaryBar>
          <SummaryItem>
            <SummaryCount $color="total">{summary.total}</SummaryCount>
            <SummaryLabel>Total</SummaryLabel>
          </SummaryItem>
          <SummaryDivider />
          <SummaryItem>
            <SummaryCount $color="critical">{summary.critical}</SummaryCount>
            <SummaryLabel>Critical</SummaryLabel>
          </SummaryItem>
          <SummaryItem>
            <SummaryCount $color="warning">{summary.warnings}</SummaryCount>
            <SummaryLabel>Warning</SummaryLabel>
          </SummaryItem>
          <SummaryItem>
            <SummaryCount $color="passed">{summary.passed}</SummaryCount>
            <SummaryLabel>Passed</SummaryLabel>
          </SummaryItem>
        </SummaryBar>
      )}

      {/* Checks */}
      {renderGroupedChecks()}

      {/* Detail Drawer */}
      {!onCheckClick && (
        <DynamicCheckDrawer
          check={selectedCheck}
          categoryDefinition={
            selectedCheck
              ? categoryDefinitions?.[selectedCheck.category_id as DynamicCategoryId]
              : undefined
          }
          open={drawerOpen}
          onClose={handleDrawerClose}
          agentWorkflowId={agentWorkflowId}
        />
      )}
    </GridContainer>
  );
};
