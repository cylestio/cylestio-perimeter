import { useState, useMemo, type FC } from 'react';

import { AlertTriangle, Clock, Zap, Layers, XCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

import type { AgentAnalytics } from '@api/types/agent';

import { Section } from '@ui/layout/Section';
import { StatsBar, type Stat } from '@ui/data-display';

import {
  Container,
  StatsTable,
  TableRow,
  TableCell,
  EmptyMessage,
  FailureBadge,
  SuccessBadge,
  ToolName,
  UnusedTableRow,
  UnusedToolName,
  UnusedBadge,
  SortableHeader,
  SortIndicator,
  DurationBarCell,
  ShowMoreToggle,
} from './ToolUsageAnalytics.styles';

export interface ToolUsageAnalyticsProps {
  analytics: AgentAnalytics;
  availableTools?: string[];
  className?: string;
}

const formatMs = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
};

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

type SortColumn = 'tool' | 'executions' | 'successRate' | 'avgDuration' | 'maxDuration';
type SortDirection = 'asc' | 'desc';

const VISIBLE_ROWS = 10;

export const ToolUsageAnalytics: FC<ToolUsageAnalyticsProps> = ({
  analytics,
  availableTools = [],
  className,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('executions');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAll, setShowAll] = useState(false);

  const { tools } = analytics;

  // Sort tools based on current sort column and direction (must be before early return)
  const sortedTools = useMemo(() => {
    if (!tools || tools.length === 0) return [];
    return [...tools].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortColumn) {
        case 'tool':
          aVal = a.tool.toLowerCase();
          bVal = b.tool.toLowerCase();
          break;
        case 'executions':
          aVal = a.executions;
          bVal = b.executions;
          break;
        case 'successRate':
          aVal = 1 - a.failure_rate;
          bVal = 1 - b.failure_rate;
          break;
        case 'avgDuration':
          aVal = a.avg_duration_ms;
          bVal = b.avg_duration_ms;
          break;
        case 'maxDuration':
          aVal = a.max_duration_ms;
          bVal = b.max_duration_ms;
          break;
        default:
          aVal = a.executions;
          bVal = b.executions;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [tools, sortColumn, sortDirection]);

  // Calculate unused tools
  const usedToolNames = new Set(tools?.map((t) => t.tool) || []);
  const unusedTools = availableTools.filter((t) => !usedToolNames.has(t)).sort();
  const unusedCount = unusedTools.length;
  const toolUtilization =
    availableTools.length > 0 ? (usedToolNames.size / availableTools.length) * 100 : 100;

  if (!tools || tools.length === 0) {
    return (
      <Section className={className}>
        <Section.Header>
          <Section.Title>Tool Usage Analytics</Section.Title>
        </Section.Header>
        <Section.Content>
          <EmptyMessage>No tool usage data available</EmptyMessage>
        </Section.Content>
      </Section>
    );
  }

  // Calculate totals and max values for percentage calculations
  const totalExecutions = tools.reduce((sum, t) => sum + t.executions, 0);
  const totalFailures = tools.reduce((sum, t) => sum + t.failures, 0);
  const maxAvgDuration = Math.max(...tools.map((t) => t.avg_duration_ms));
  const maxMaxDuration = Math.max(...tools.map((t) => t.max_duration_ms));

  // Paginated tools for display
  const visibleTools = showAll ? sortedTools : sortedTools.slice(0, VISIBLE_ROWS);
  const hiddenCount = sortedTools.length - VISIBLE_ROWS;

  // Handle column header click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return <SortIndicator>{sortDirection === 'asc' ? '▲' : '▼'}</SortIndicator>;
  };

  // Calculate average success rate
  const avgSuccessRate =
    tools.length > 0
      ? tools.reduce((sum, t) => sum + (1 - t.failure_rate), 0) / tools.length
      : 1;

  // Calculate average duration
  const avgDuration =
    tools.filter((t) => t.avg_duration_ms > 0).length > 0
      ? tools
          .filter((t) => t.avg_duration_ms > 0)
          .reduce((sum, t) => sum + t.avg_duration_ms, 0) /
        tools.filter((t) => t.avg_duration_ms > 0).length
      : 0;

  // Build stats array for StatsBar
  const utilizationColor = toolUtilization >= 70 ? 'green' : toolUtilization >= 40 ? 'orange' : 'red';
  const unusedColor = unusedCount > 0 ? 'red' : 'green';

  const stats: (Stat | 'divider')[] = [];

  // Group 1: Tool Utilization (only if availableTools is provided)
  if (availableTools.length > 0) {
    stats.push(
      { icon: <Layers size={18} />, value: `${toolUtilization.toFixed(0)}%`, label: 'Tool Utilization', iconColor: utilizationColor, valueColor: utilizationColor },
      { icon: <XCircle size={18} />, value: unusedCount, label: 'Unused Tools', iconColor: unusedColor, valueColor: unusedColor },
      'divider'
    );
  }

  // Group 2: Executions
  stats.push(
    { icon: <Zap size={18} />, value: totalExecutions.toLocaleString(), label: 'Total Executions', iconColor: 'cyan' },
    { icon: <Clock size={18} />, value: formatMs(avgDuration), label: 'Avg Duration', iconColor: 'orange', valueColor: 'orange' },
    'divider'
  );

  // Group 3: Success/Failures
  stats.push({ icon: <CheckCircle size={18} />, value: formatPercent(avgSuccessRate), label: 'Avg Success Rate', iconColor: 'green', valueColor: 'green' });
  if (totalFailures > 0) {
    stats.push({ icon: <AlertTriangle size={18} />, value: totalFailures, label: 'Total Failures', iconColor: 'red', valueColor: 'red' });
  }

  return (
    <Section className={className}>
      <Section.Header>
        <Section.Title>Tool Usage Analytics</Section.Title>
      </Section.Header>
      <Section.Content>
        <Container>
          <StatsBar stats={stats} />

          {/* Tool Usage Table */}
          <StatsTable>
            <thead>
              <tr>
                <SortableHeader
                  $active={sortColumn === 'tool'}
                  onClick={() => handleSort('tool')}
                >
                  Tool{renderSortIndicator('tool')}
                </SortableHeader>
                <SortableHeader
                  $align="right"
                  $active={sortColumn === 'executions'}
                  onClick={() => handleSort('executions')}
                >
                  Executions{renderSortIndicator('executions')}
                </SortableHeader>
                <SortableHeader
                  $align="right"
                  $active={sortColumn === 'successRate'}
                  onClick={() => handleSort('successRate')}
                >
                  Success Rate{renderSortIndicator('successRate')}
                </SortableHeader>
                <SortableHeader
                  $align="right"
                  $active={sortColumn === 'avgDuration'}
                  onClick={() => handleSort('avgDuration')}
                >
                  Avg Duration{renderSortIndicator('avgDuration')}
                </SortableHeader>
                <SortableHeader
                  $align="right"
                  $active={sortColumn === 'maxDuration'}
                  onClick={() => handleSort('maxDuration')}
                >
                  Max Duration{renderSortIndicator('maxDuration')}
                </SortableHeader>
              </tr>
            </thead>
            <tbody>
              {visibleTools.map((tool) => {
                const successRate = 1 - tool.failure_rate;
                const avgDurationPercent = maxAvgDuration > 0 ? (tool.avg_duration_ms / maxAvgDuration) * 100 : 0;
                const maxDurationPercent = maxMaxDuration > 0 ? (tool.max_duration_ms / maxMaxDuration) * 100 : 0;
                return (
                  <TableRow key={tool.tool}>
                    <TableCell>
                      <ToolName>{tool.tool}</ToolName>
                    </TableCell>
                    <TableCell $align="right" $mono>
                      {tool.executions}
                    </TableCell>
                    <TableCell $align="right">
                      {successRate >= 1 ? (
                        <SuccessBadge>100%</SuccessBadge>
                      ) : successRate >= 0.9 ? (
                        <SuccessBadge>{formatPercent(successRate)}</SuccessBadge>
                      ) : (
                        <FailureBadge>
                          {formatPercent(successRate)}
                          {tool.failures > 0 && ` (${tool.failures} failed)`}
                        </FailureBadge>
                      )}
                    </TableCell>
                    <DurationBarCell
                      $align="right"
                      $percent={avgDurationPercent}
                      $isSlow={tool.avg_duration_ms > 1000}
                    >
                      <span>{tool.avg_duration_ms > 0 ? formatMs(tool.avg_duration_ms) : '-'}</span>
                    </DurationBarCell>
                    <DurationBarCell
                      $align="right"
                      $percent={maxDurationPercent}
                      $isSlow={tool.max_duration_ms > 2000}
                    >
                      <span>{tool.max_duration_ms > 0 ? formatMs(tool.max_duration_ms) : '-'}</span>
                    </DurationBarCell>
                  </TableRow>
                );
              })}
              {/* Unused tools - only show when showAll or total <= VISIBLE_ROWS */}
              {(showAll || sortedTools.length <= VISIBLE_ROWS) &&
                unusedTools.map((toolName) => (
                  <UnusedTableRow key={toolName} $unused>
                    <TableCell>
                      <UnusedToolName>{toolName}</UnusedToolName>
                    </TableCell>
                    <TableCell $align="right" $mono>
                      0
                    </TableCell>
                    <TableCell $align="right">
                      <UnusedBadge>unused</UnusedBadge>
                    </TableCell>
                    <TableCell $align="right">-</TableCell>
                    <TableCell $align="right">-</TableCell>
                  </UnusedTableRow>
                ))}
            </tbody>
          </StatsTable>
          {/* Show more/less toggle */}
          {hiddenCount > 0 && (
            <ShowMoreToggle onClick={() => setShowAll(!showAll)}>
              {showAll ? (
                <>
                  <ChevronUp size={16} />
                  Hide {hiddenCount} tools
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Show {hiddenCount} more tools
                </>
              )}
            </ShowMoreToggle>
          )}
        </Container>
      </Section.Content>
    </Section>
  );
};
