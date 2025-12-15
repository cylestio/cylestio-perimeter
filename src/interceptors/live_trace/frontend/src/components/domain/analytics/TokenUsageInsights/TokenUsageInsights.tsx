import type { FC } from 'react';

import { Coins, TrendingUp, Clock, DollarSign, Hash } from 'lucide-react';

import type { AgentAnalytics } from '@api/types/agent';

import { Section } from '@ui/layout/Section';
import { StatsBar, type Stat } from '@ui/data-display';

import { BarChart, DistributionBar } from '@domain/charts';

import {
  Container,
  ChartsGrid,
  ChartSection,
  ChartTitle,
  ChartSubtitle,
  PricingNote,
} from './TokenUsageInsights.styles';

export interface TokenUsageInsightsProps {
  analytics: AgentAnalytics;
  totalSessions?: number;
  avgDurationMinutes?: number;
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

const formatCost = (cost: number): string => {
  if (cost === 0) return '-';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
};

export const TokenUsageInsights: FC<TokenUsageInsightsProps> = ({
  analytics,
  totalSessions = 0,
  avgDurationMinutes = 0,
  className,
}) => {
  const { token_summary, models } = analytics;

  if (!token_summary) {
    return null;
  }

  // Calculate per-session averages
  const avgCostPerSession = totalSessions > 0 ? token_summary.total_cost / totalSessions : 0;
  const avgTokensPerSession = totalSessions > 0 ? token_summary.total_tokens / totalSessions : 0;

  // Prepare bar chart data for model breakdown
  const modelTokenData =
    models?.map((m) => ({
      name: m.model,
      value: m.total_tokens,
    })) || [];

  // Build stats array for StatsBar
  const stats: (Stat | 'divider')[] = [];

  // Group 1: Per-session averages (only if totalSessions > 0)
  if (totalSessions > 0) {
    stats.push(
      { icon: <DollarSign size={18} />, value: formatCost(avgCostPerSession), label: 'Avg Cost/Session', iconColor: 'orange', valueColor: 'orange' },
      { icon: <Clock size={18} />, value: `${avgDurationMinutes.toFixed(1)}m`, label: 'Avg Session Time', iconColor: 'cyan' },
      { icon: <Hash size={18} />, value: formatNumber(avgTokensPerSession), label: 'Avg Tokens/Session', iconColor: 'purple', valueColor: 'purple' },
      'divider'
    );
  }

  // Group 3: Totals
  stats.push(
    { icon: <Coins size={18} />, value: formatNumber(token_summary.total_tokens), label: 'Total Tokens', iconColor: 'cyan' },
    { icon: <TrendingUp size={18} />, value: formatCost(token_summary.total_cost), label: token_summary.total_cost > 0 ? 'Total Cost' : 'Pricing unavailable', iconColor: 'orange', valueColor: 'orange' }
  );

  return (
    <Section className={className}>
      <Section.Header>
        <Section.Title>Token Usage Insights</Section.Title>
        {token_summary.pricing_last_updated && (
          <PricingNote>
            Pricing updated:{' '}
            {new Date(token_summary.pricing_last_updated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </PricingNote>
        )}
      </Section.Header>
      <Section.Content>
        <Container>
          <StatsBar stats={stats} />

          {/* Charts Grid */}
          <ChartsGrid>
            {/* Token Distribution Bar */}
            <ChartSection>
              <ChartSubtitle>Distribution by Type</ChartSubtitle>
              <ChartTitle>Input vs Output Tokens</ChartTitle>
              <DistributionBar
                segments={[
                  { name: 'Input', value: token_summary.input_tokens, color: 'cyan' },
                  { name: 'Output', value: token_summary.output_tokens, color: 'purple' },
                ]}
                formatValue={formatNumber}
              />
            </ChartSection>

            {/* Token by Model Bar Chart */}
            <ChartSection>
              <ChartSubtitle>Model Breakdown</ChartSubtitle>
              <ChartTitle>Token Usage by Model</ChartTitle>
              {modelTokenData.length > 0 ? (
                <BarChart
                  data={modelTokenData}
                  horizontal
                  height={Math.min(240, Math.max(80, modelTokenData.length * 45))}
                  color="cyan"
                  formatValue={formatNumber}
                  maxBars={6}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                  No model data available
                </div>
              )}
            </ChartSection>
          </ChartsGrid>
        </Container>
      </Section.Content>
    </Section>
  );
};
