import { useState, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Wrench,
  Tag,
  // Brain,    // TODO: Uncomment when Behavioral Insights is implemented
  // Shield,   // TODO: Uncomment when Security Checks is implemented
  // Activity, // TODO: Uncomment if Metrics section header is restored
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';
import { Text } from '@ui/core/Text';
import { Section } from '@ui/layout/Section';
import { KeyValueList } from '@ui/data-display/KeyValueList';
import { ProgressBar } from '@ui/feedback/ProgressBar';

import { SessionTags } from '@domain/sessions';

import type { SessionEvent } from '@api/types/session';
import type { ModelInfo } from '@api/types/replay';

import {
  SidebarContainer,
  MetricsGrid,
  MetricBox,
  MetricLabel,
  MetricValue,
  MetricDetail,
  UtilizationHeader,
  ToolsList,
  ToolItem,
  ToolName,
  ToolUsage,
  ToolCount,
  ToolUnused,
  // TODO: Uncomment when Behavioral Insights is implemented
  // OutlierReasons,
  // OutlierReason,
  // TODO: Uncomment when Security Checks is implemented
  // SecuritySummary,
  // SecurityCheckList,
  // SecurityCheckItemWrapper,
  // SecurityCheckStatus,
  // SecurityCheckName,
  StatusBadgeWrapper,
  // SectionHeaderStyled,  // TODO: Uncomment when sections with variants are implemented
} from './SessionSidebarInfo.styles';

// ====================================================
// TYPES
// ====================================================

interface TokenBreakdown {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface SessionSidebarInfoProps {
  /** Session ID */
  sessionId?: string;
  /** Agent/System Prompt ID */
  agentId?: string;
  /** Agent workflow ID (for navigation links) */
  agentWorkflowId?: string;
  /** Whether the session is currently active */
  isActive?: boolean;
  /** Total tokens used in the session */
  totalTokens?: number;
  /** Number of messages in the session */
  messageCount?: number;
  /** Duration of the session in minutes */
  durationMinutes?: number;
  /** Number of tool uses */
  toolUses?: number;
  /** Number of errors */
  errors?: number;
  /** Error rate (0-100) */
  errorRate?: number;
  /** Model name (e.g., 'claude-sonnet-4-20250514') */
  model?: string;
  /** Provider name (e.g., 'anthropic', 'openai') */
  provider?: string;
  /** Raw events from the session API (for computing metrics) */
  events?: SessionEvent[];
  /** List of available tools for this session */
  availableTools?: string[];
  /** Tool usage details: { toolName: callCount } */
  toolUsageDetails?: Record<string, number>;
  /** Model pricing info from /api/models (for cost calculation) */
  modelPricing?: ModelInfo;
  /** Session tags */
  tags?: Record<string, string>;
  className?: string;
}

// ====================================================
// METRIC COMPUTATION HELPERS
// ====================================================

/**
 * Compute input/output token breakdown from session events.
 * Sums tokens from all llm.call.finish events.
 */
function computeTokenBreakdown(events: SessionEvent[]): TokenBreakdown {
  let inputTokens = 0;
  let outputTokens = 0;

  for (const event of events) {
    if (event.name === 'llm.call.finish' && event.attributes) {
      const attrs = event.attributes;
      inputTokens += (attrs['llm.usage.input_tokens'] as number) || 0;
      outputTokens += (attrs['llm.usage.output_tokens'] as number) || 0;
    }
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Compute estimated cost based on model pricing and token counts.
 * Pricing is per 1M tokens.
 */
function computeCost(
  pricing: ModelInfo | undefined,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  if (!pricing) {
    return { inputCost: 0, outputCost: 0, totalCost: 0 };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Compute average latency from llm.call.finish events.
 */
function computeAvgLatency(events: SessionEvent[]): number {
  let totalLatency = 0;
  let count = 0;

  for (const event of events) {
    if (event.name === 'llm.call.finish' && event.attributes) {
      const duration = event.attributes['llm.response.duration_ms'] as number;
      if (typeof duration === 'number') {
        totalLatency += duration;
        count++;
      }
    }
  }

  return count > 0 ? Math.round(totalLatency / count) : 0;
}

// ====================================================
// MOCK DATA - Commented out until features are implemented
// See: src/api/TODO_SESSION_SIDEBAR_API.md
// ====================================================

// TODO: Phase 2 - Tool header estimation
// const MOCK_TOOL_HEADER_ESTIMATE = {
//   estimatedHeaderTokens: 2840,
//   estimatedHeaderCost: 0.0142,
// };

// TODO: Phase 3 - Behavioral Insights
// const MOCK_BEHAVIORAL_INSIGHTS = {
//   status: 'cluster' as 'cluster' | 'outlier',
//   cluster: {
//     name: 'Standard Workflow',
//     size: 45,
//     percentage: 67,
//     avgDuration: 4.2,
//     avgTokens: 14500,
//   },
//   outlier: {
//     severity: 'medium' as 'high' | 'medium' | 'low',
//     causes: [
//       'Token usage 2.3x above cluster average',
//       'Unusual tool sequence: write_file called before read_file',
//     ],
//   },
// };

// TODO: Phase 4 - Security Checks
// const MOCK_SECURITY_CHECKS = {
//   summary: {
//     passed: 5,
//     warnings: 1,
//     critical: 0,
//   },
//   checks: [
//     { name: 'PII Detection', status: 'passed' as const },
//     { name: 'Prompt Injection', status: 'passed' as const },
//     { name: 'Token Budget', status: 'warning' as const, value: '89% used' },
//     { name: 'Tool Scope', status: 'passed' as const },
//     { name: 'Output Validation', status: 'passed' as const },
//   ],
// };

// ====================================================
// HELPER FUNCTIONS
// ====================================================

function formatCurrency(value: number): string {
  return `$${value.toFixed(4)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes.toFixed(1)}m`;
}

function truncateId(id: string, length: number = 16): string {
  if (id.length <= length) return id;
  return id.substring(0, length) + '...';
}

// ====================================================
// COMPONENT
// ====================================================

const INITIAL_TOOLS_SHOWN = 3;

export const SessionSidebarInfo: FC<SessionSidebarInfoProps> = ({
  sessionId,
  // agentId - reserved for future use (agent details link)
  agentWorkflowId,
  isActive = false,
  totalTokens,
  messageCount,
  durationMinutes,
  toolUses,
  // errors,     // TODO: Uncomment when Security Checks is implemented
  // errorRate - reserved for future use (error trend display)
  model,
  provider,
  events = [],
  availableTools = [],
  toolUsageDetails = {},
  modelPricing,
  tags,
  className,
}) => {
  const navigate = useNavigate();
  const [showAllTools, setShowAllTools] = useState(false);

  // Extract session tag and filter it from other tags
  const sessionTag = tags?.session;
  const filteredTags = useMemo(() => {
    if (!tags) return undefined;
    const { session: _, ...rest } = tags;
    return Object.keys(rest).length > 0 ? rest : undefined;
  }, [tags]);

  // Handle session tag click - navigate to sessions page with filter
  const handleSessionTagClick = () => {
    if (sessionTag && agentWorkflowId) {
      navigate(`/agent-workflow/${agentWorkflowId}/sessions?session=${encodeURIComponent(sessionTag)}`);
    }
  };

  // Compute token breakdown from events
  const tokenBreakdown = useMemo(
    () => computeTokenBreakdown(events),
    [events]
  );

  // Compute cost using pricing from /api/models
  const costEstimate = useMemo(
    () => computeCost(modelPricing, tokenBreakdown.inputTokens, tokenBreakdown.outputTokens),
    [modelPricing, tokenBreakdown.inputTokens, tokenBreakdown.outputTokens]
  );

  const avgLatency = useMemo(
    () => computeAvgLatency(events),
    [events]
  );

  // Calculate tool utilization percentage
  const usedToolsCount = Object.keys(toolUsageDetails).length;
  const totalToolsCount = availableTools.length;
  const utilizationPercentage = totalToolsCount > 0
    ? Math.round((usedToolsCount / totalToolsCount) * 100)
    : 0;

  // Sort tools: used first (by count), then unused
  const sortedTools = [...availableTools].sort((a, b) => {
    const countA = toolUsageDetails[a] || 0;
    const countB = toolUsageDetails[b] || 0;
    if (countA === 0 && countB === 0) return a.localeCompare(b);
    if (countA === 0) return 1;
    if (countB === 0) return -1;
    return countB - countA;
  });

  // Tools to display (limited or all)
  const displayedTools = showAllTools
    ? sortedTools
    : sortedTools.slice(0, INITIAL_TOOLS_SHOWN);
  const hasMoreTools = sortedTools.length > INITIAL_TOOLS_SHOWN;

  // Prepare metadata items for KeyValueList
  const metadataItems = [
    {
      key: 'Session ID',
      value: sessionId ? truncateId(sessionId) : '—',
      mono: true,
    },
    ...(sessionTag ? [{
      key: 'Session',
      value: (
        <span
          onClick={handleSessionTagClick}
          style={{
            color: 'var(--color-cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
          }}
        >
          {sessionTag}
        </span>
      ),
    }] : []),
    {
      key: 'Model',
      value: model || 'Unknown',
      mono: true,
    },
    {
      key: 'Status',
      value: (
        <StatusBadgeWrapper>
          {isActive ? (
            <Badge variant="success">ACTIVE</Badge>
          ) : (
            <Badge variant="info">COMPLETE</Badge>
          )}
          {provider && (
            <Badge variant="info">{provider.toUpperCase()}</Badge>
          )}
        </StatusBadgeWrapper>
      ),
    },
  ];

  // TODO: Phase 2 - Tool header estimation
  // const toolEstimateItems = [
  //   {
  //     key: 'Est. tool header tokens',
  //     value: formatNumber(MOCK_TOOL_HEADER_ESTIMATE.estimatedHeaderTokens),
  //     mono: true,
  //   },
  //   {
  //     key: 'Est. header cost',
  //     value: (
  //       <Text color="green" weight="bold" mono>
  //         {formatCurrency(MOCK_TOOL_HEADER_ESTIMATE.estimatedHeaderCost)}
  //       </Text>
  //     ),
  //   },
  // ];

  return (
    <SidebarContainer className={className}>
      {/* ====== SESSION METADATA ====== */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Server size={14} />}>Session Info</Section.Title>
        </Section.Header>
        <Section.Content>
          <KeyValueList items={metadataItems} size="sm" />
        </Section.Content>
      </Section>

      {/* ====== SESSION TAGS ====== */}
      {filteredTags && Object.keys(filteredTags).length > 0 && (
        <Section>
          <Section.Header>
            <Section.Title icon={<Tag size={14} />}>Tags</Section.Title>
          </Section.Header>
          <Section.Content>
            <SessionTags tags={filteredTags} maxTags={10} />
          </Section.Content>
        </Section>
      )}

      {/* ====== OPERATIONAL METRICS ====== */}
      <MetricsGrid>
        <MetricBox>
          <MetricLabel>Est. Cost</MetricLabel>
          <MetricValue>
            {costEstimate.totalCost > 0
              ? formatCurrency(costEstimate.totalCost)
              : '—'}
          </MetricValue>
          {costEstimate.totalCost > 0 && (
            <>
              <MetricDetail>{formatCurrency(costEstimate.inputCost)} in</MetricDetail>
              <MetricDetail>{formatCurrency(costEstimate.outputCost)} out</MetricDetail>
            </>
          )}
        </MetricBox>
        <MetricBox>
          <MetricLabel>Tokens</MetricLabel>
          <MetricValue>
            {totalTokens !== undefined
              ? formatNumber(totalTokens)
              : '—'}
          </MetricValue>
          {tokenBreakdown.totalTokens > 0 && (
            <>
              <MetricDetail>{formatNumber(tokenBreakdown.inputTokens)} in</MetricDetail>
              <MetricDetail>{formatNumber(tokenBreakdown.outputTokens)} out</MetricDetail>
            </>
          )}
        </MetricBox>
        <MetricBox>
          <MetricLabel>Avg Latency</MetricLabel>
          <MetricValue>{avgLatency > 0 ? `${avgLatency}ms` : '—'}</MetricValue>
        </MetricBox>
        <MetricBox>
          <MetricLabel>Duration</MetricLabel>
          <MetricValue>
            {durationMinutes !== undefined
              ? formatDuration(durationMinutes)
              : '—'}
          </MetricValue>
          {messageCount !== undefined && (
            <MetricDetail>{messageCount} messages</MetricDetail>
          )}
        </MetricBox>
      </MetricsGrid>

      {/* ====== BEHAVIORAL INSIGHTS ====== */}
      {/* TODO: Phase 3 - Uncomment when Behavioral Insights API is implemented
      <Section>
        <SectionHeaderStyled
          $variant={behavioral.status === 'outlier' ? 'warning' : undefined}
        >
          <Section.Title icon={<Brain size={14} />}>
            Behavioral Insights
          </Section.Title>
        </SectionHeaderStyled>
        <Section.Content>
          {behavioral.status === 'cluster' ? (
            <StatusBadgeWrapper>
              <Badge variant="success">In Cluster</Badge>
              <Text size="sm" color="muted">
                Acts like{' '}
                <Text weight="semibold" mono>
                  {behavioral.cluster.percentage}%
                </Text>{' '}
                of other sessions
              </Text>
            </StatusBadgeWrapper>
          ) : (
            <>
              <StatusBadgeWrapper>
                <Badge
                  variant={
                    behavioral.outlier.severity === 'high'
                      ? 'critical'
                      : 'medium'
                  }
                >
                  Outlier
                </Badge>
                <Text size="sm" color="muted">
                  Unusual behavior detected
                </Text>
              </StatusBadgeWrapper>
              <OutlierReasons>
                {behavioral.outlier.causes.map((cause, idx) => (
                  <OutlierReason key={idx}>{cause}</OutlierReason>
                ))}
              </OutlierReasons>
            </>
          )}
        </Section.Content>
      </Section>
      */}

      {/* ====== SECURITY CHECKS ====== */}
      {/* TODO: Phase 4 - Uncomment when Security Checks API is implemented
      <Section>
        <SectionHeaderStyled $variant={securityVariant}>
          <Section.Title icon={<Shield size={14} />}>
            Security Checks
          </Section.Title>
        </SectionHeaderStyled>
        <Section.Content>
          <SecuritySummary>
            {security.summary.passed > 0 && (
              <Badge variant="success">{security.summary.passed} passed</Badge>
            )}
            {security.summary.warnings > 0 && (
              <Badge variant="medium">{security.summary.warnings} warning</Badge>
            )}
            {security.summary.critical > 0 && (
              <Badge variant="critical">
                {security.summary.critical} critical
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="critical">{errors} errors</Badge>
            )}
          </SecuritySummary>

          <SecurityCheckList>
            {security.checks.map((check, idx) => (
              <SecurityCheckItemWrapper key={idx} $status={check.status}>
                <SecurityCheckStatus $status={check.status}>
                  {check.status === 'passed'
                    ? 'OK'
                    : check.status === 'warning'
                      ? 'WARN'
                      : 'FAIL'}
                </SecurityCheckStatus>
                <SecurityCheckName>
                  {check.name}
                  {'value' in check && check.value && (
                    <Text size="xs" color="muted" as="span">
                      {' '}({check.value})
                    </Text>
                  )}
                </SecurityCheckName>
              </SecurityCheckItemWrapper>
            ))}
          </SecurityCheckList>
        </Section.Content>
      </Section>
      */}

      {/* ====== TOOL UTILIZATION ====== */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Wrench size={14} />}>
            Tool Utilization
            {toolUses !== undefined && (
              <span style={{ marginLeft: '8px' }}>
                <Badge variant="info">{toolUses} calls</Badge>
              </span>
            )}
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <UtilizationHeader>
            <Text size="xs" color="muted">
              {usedToolsCount} of {totalToolsCount} tools used
            </Text>
            <Text size="xs" weight="semibold" color="secondary">
              {utilizationPercentage}%
            </Text>
          </UtilizationHeader>
          <ProgressBar
            value={utilizationPercentage}
            variant="default"
            size="sm"
          />

          {/* TODO: Phase 2 - Uncomment when tool header estimation is implemented
          <div style={{ margin: '16px 0', padding: '12px 0', borderTop: '1px solid var(--border-medium)', borderBottom: '1px solid var(--border-medium)' }}>
            <KeyValueList items={toolEstimateItems} size="sm" />
          </div>
          */}

          <ToolsList>
            {displayedTools.map((tool) => {
              const count = toolUsageDetails[tool] || 0;
              const isUsed = count > 0;

              return (
                <ToolItem key={tool}>
                  <ToolName>{tool}</ToolName>
                  <ToolUsage>
                    {isUsed ? (
                      <ToolCount>{count}×</ToolCount>
                    ) : (
                      <ToolUnused>unused</ToolUnused>
                    )}
                  </ToolUsage>
                </ToolItem>
              );
            })}
          </ToolsList>

          {hasMoreTools && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              icon={showAllTools ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              onClick={() => setShowAllTools(!showAllTools)}
              style={{ marginTop: '8px' }}
            >
              {showAllTools
                ? 'Show less'
                : `Show ${sortedTools.length - INITIAL_TOOLS_SHOWN} more`}
            </Button>
          )}
        </Section.Content>
      </Section>
    </SidebarContainer>
  );
};
