import { useState, type FC } from 'react';

import { AlertTriangle } from 'lucide-react';

import type { AgentAnalytics } from '@api/types/agent';

import { Section } from '@ui/layout/Section';
import { Tabs } from '@ui/navigation/Tabs';

import { DistributionBar, BarChart, LineChart, PieChart } from '@domain/charts';

import {
  Container,
  TabContent,
  ChartRow,
  ChartColumn,
  ChartTitle,
  ChartSubtitle,
  StatsTable,
  TableHeader,
  TableRow,
  TableCell,
  EmptyMessage,
  ErrorBadge,
  CostCell,
} from './ModelUsageAnalytics.styles';

export interface ModelUsageAnalyticsProps {
  analytics: AgentAnalytics;
  className?: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

const formatMs = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
};

const formatCost = (cost: number): string => {
  if (cost === 0) return '-';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'cost', label: 'Cost Analysis' },
  { id: 'trends', label: 'Trends' },
];

export const ModelUsageAnalytics: FC<ModelUsageAnalyticsProps> = ({ analytics, className }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { models, timeline } = analytics;

  if (!models || models.length === 0) {
    return (
      <Section className={className}>
        <Section.Header>
          <Section.Title>Model Usage Analytics</Section.Title>
        </Section.Header>
        <Section.Content>
          <EmptyMessage>No model usage data available</EmptyMessage>
        </Section.Content>
      </Section>
    );
  }

  // Sort models by total requests (descending)
  const sortedModels = [...models].sort((a, b) => b.requests - a.requests);
  const totalRequests = models.reduce((sum, m) => sum + m.requests, 0);
  const totalCost = models.reduce((sum, m) => sum + m.cost, 0);
  const totalErrors = models.reduce((sum, m) => sum + m.errors, 0);

  // Prepare distribution bar data for request distribution
  const requestDistributionData = sortedModels.map((m, i) => ({
    name: m.model,
    value: m.requests,
    color: (['cyan', 'purple', 'green', 'orange', 'red'] as const)[i % 5],
  })) as { name: string; value: number; color: 'cyan' | 'purple' | 'green' | 'orange' | 'red' }[];

  // Prepare bar chart data for response times
  const responseTimeData = sortedModels.map((m) => ({
    name: m.model,
    value: m.avg_response_time_ms,
  }));

  const p95ResponseTimeData = sortedModels.map((m) => ({
    name: m.model,
    value: m.p95_response_time_ms,
  }));

  // Prepare bar chart data for costs
  const costData = sortedModels
    .filter((m) => m.cost > 0)
    .map((m) => ({
      name: m.model,
      value: m.cost,
    }));

  // Prepare line chart data for timeline
  const timelineData =
    timeline?.map((t) => ({
      date: t.date,
      value: t.requests,
    })) || [];

  const tokenTimelineData =
    timeline?.map((t) => ({
      date: t.date,
      value: t.tokens,
    })) || [];

  return (
    <Section className={className}>
      <Section.Header>
        <Section.Title>Model Usage Analytics</Section.Title>
      </Section.Header>
      <Section.Content>
        <Container>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

          <TabContent>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <ChartRow>
                <ChartColumn>
                  <ChartSubtitle>Distribution</ChartSubtitle>
                  <ChartTitle>Request Distribution by Model</ChartTitle>
                  <DistributionBar
                    segments={requestDistributionData}
                    formatValue={(v: number) => `${v}`}
                  />
                </ChartColumn>

                <ChartColumn $grow>
                  <ChartSubtitle>Comparison</ChartSubtitle>
                  <ChartTitle>Model Comparison</ChartTitle>
                  <StatsTable>
                    <thead>
                      <tr>
                        <TableHeader>Model</TableHeader>
                        <TableHeader $align="right">Requests</TableHeader>
                        <TableHeader $align="right">Tokens</TableHeader>
                        <TableHeader $align="right">Avg Time</TableHeader>
                        <TableHeader $align="right">Errors</TableHeader>
                        <TableHeader $align="right">Cost</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedModels.map((model) => (
                        <TableRow key={model.model}>
                          <TableCell $mono>{model.model}</TableCell>
                          <TableCell $align="right">
                            {model.requests}{' '}
                            <span style={{ opacity: 0.5 }}>
                              ({((model.requests / totalRequests) * 100).toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell $align="right">{formatNumber(model.total_tokens)}</TableCell>
                          <TableCell $align="right">{formatMs(model.avg_response_time_ms)}</TableCell>
                          <TableCell $align="right">
                            {model.errors > 0 ? (
                              <ErrorBadge>
                                <AlertTriangle size={12} />
                                {model.errors}
                              </ErrorBadge>
                            ) : (
                              <span style={{ opacity: 0.3 }}>0</span>
                            )}
                          </TableCell>
                          <CostCell $align="right" $hasValue={model.cost > 0}>
                            {formatCost(model.cost)}
                          </CostCell>
                        </TableRow>
                      ))}
                    </tbody>
                    <tfoot>
                      <TableRow $isTotal>
                        <TableCell $mono>Total</TableCell>
                        <TableCell $align="right">{totalRequests}</TableCell>
                        <TableCell $align="right">
                          {formatNumber(models.reduce((sum, m) => sum + m.total_tokens, 0))}
                        </TableCell>
                        <TableCell $align="right">-</TableCell>
                        <TableCell $align="right">
                          {totalErrors > 0 ? (
                            <ErrorBadge>
                              <AlertTriangle size={12} />
                              {totalErrors}
                            </ErrorBadge>
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <CostCell $align="right" $hasValue={totalCost > 0}>
                          {formatCost(totalCost)}
                        </CostCell>
                      </TableRow>
                    </tfoot>
                  </StatsTable>
                </ChartColumn>
              </ChartRow>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <ChartRow>
                <ChartColumn>
                  <ChartSubtitle>Average</ChartSubtitle>
                  <ChartTitle>Average Response Time</ChartTitle>
                  <BarChart
                    data={responseTimeData}
                    horizontal
                    height={Math.max(180, sortedModels.length * 40)}
                    color="cyan"
                    formatValue={formatMs}
                    maxBars={10}
                  />
                </ChartColumn>

                <ChartColumn>
                  <ChartSubtitle>P95 Latency</ChartSubtitle>
                  <ChartTitle>95th Percentile Response Time</ChartTitle>
                  <BarChart
                    data={p95ResponseTimeData}
                    horizontal
                    height={Math.max(180, sortedModels.length * 40)}
                    color="orange"
                    formatValue={formatMs}
                    maxBars={10}
                  />
                </ChartColumn>
              </ChartRow>
            )}

            {/* Cost Tab */}
            {activeTab === 'cost' && (
              <ChartRow>
                <ChartColumn>
                  <ChartSubtitle>Breakdown</ChartSubtitle>
                  <ChartTitle>Cost by Model</ChartTitle>
                  {costData.length > 0 ? (
                    <BarChart
                      data={costData}
                      horizontal
                      height={Math.max(180, costData.length * 45)}
                      color="orange"
                      formatValue={(v: number) => `$${v.toFixed(2)}`}
                      maxBars={10}
                    />
                  ) : (
                    <EmptyMessage>No cost data available</EmptyMessage>
                  )}
                </ChartColumn>

                <ChartColumn>
                  <ChartSubtitle>Distribution</ChartSubtitle>
                  <ChartTitle>Cost Distribution</ChartTitle>
                  {costData.length > 0 ? (
                    <PieChart
                      data={costData.map((c, i) => ({
                        ...c,
                        color: (['orange', 'purple', 'cyan', 'green', 'red'] as const)[i % 5],
                      }))}
                      height={240}
                      innerRadius={50}
                      outerRadius={80}
                      formatValue={(v: number) => `$${v.toFixed(2)}`}
                    />
                  ) : (
                    <EmptyMessage>No cost data available</EmptyMessage>
                  )}
                </ChartColumn>
              </ChartRow>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <ChartRow>
                <ChartColumn>
                  <ChartSubtitle>Timeline</ChartSubtitle>
                  <ChartTitle>Requests Over Time</ChartTitle>
                  {timelineData.length > 0 ? (
                    <LineChart
                      data={timelineData}
                      height={200}
                      color="purple"
                      formatValue={(v) => v.toLocaleString()}
                    />
                  ) : (
                    <EmptyMessage>No timeline data available</EmptyMessage>
                  )}
                </ChartColumn>

                <ChartColumn>
                  <ChartSubtitle>Timeline</ChartSubtitle>
                  <ChartTitle>Token Usage Over Time</ChartTitle>
                  {tokenTimelineData.length > 0 ? (
                    <LineChart
                      data={tokenTimelineData}
                      height={200}
                      color="cyan"
                      formatValue={formatNumber}
                    />
                  ) : (
                    <EmptyMessage>No timeline data available</EmptyMessage>
                  )}
                </ChartColumn>
              </ChartRow>
            )}
          </TabContent>
        </Container>
      </Section.Content>
    </Section>
  );
};
