import type { FC } from 'react';

import {
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  TrendingUp,
  BarChart3,
  Play,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';
import { OrbLoader } from '@ui/feedback/OrbLoader';

import {
  CardWrapper,
  CardHeader,
  HeaderLeft,
  StatusIcon,
  HeaderContent,
  Title,
  Subtitle,
  RunningBadge,
  CardBody,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  AgentsStatusList,
  AgentStatusBadge,
  CTASection,
  LastAnalysisInfo,
  ExplanationCard,
  ExplanationHeader,
  ExplanationIconWrapper,
  ExplanationTitleGroup,
  ExplanationTitle,
  ExplanationSubtitle,
  ExplanationBody,
  ExplanationText,
  FeatureList,
  FeatureItem,
  FeatureIcon,
  FeatureContent,
  FeatureLabel,
  FeatureDescription,
  AccuracyHighlight,
  AccuracyIcon,
  AccuracyContent,
  AccuracyTitle,
  AccuracyText,
} from './DynamicOverviewCard.styles';

export interface AgentStatus {
  agent_id: string;
  display_name: string | null;
  total_sessions: number;
  unanalyzed_count: number;
}

export interface DynamicOverviewCardProps {
  /** Current status of analysis */
  status: 'running' | 'ready' | 'upToDate' | 'empty';
  /** Whether analysis trigger is loading */
  triggerLoading?: boolean;
  /** Total unanalyzed sessions */
  unanalyzedSessions?: number;
  /** Number of agents with new sessions */
  agentsWithNewSessions?: number;
  /** Per-agent status list */
  agentsStatus?: AgentStatus[];
  /** Last analysis timestamp (unix seconds) */
  lastAnalysisTime?: number | null;
  /** Findings count from last analysis */
  findingsCount?: number;
  /** Sessions analyzed in last analysis */
  sessionsAnalyzed?: number;
  /** Total sessions count */
  totalSessions?: number;
  /** Callback to trigger analysis */
  onRunAnalysis?: (force: boolean) => void;
  className?: string;
}

export const DynamicOverviewCard: FC<DynamicOverviewCardProps> = ({
  status,
  triggerLoading = false,
  unanalyzedSessions = 0,
  agentsWithNewSessions = 0,
  agentsStatus = [],
  lastAnalysisTime,
  findingsCount = 0,
  sessionsAnalyzed = 0,
  totalSessions = 0,
  onRunAnalysis,
  className,
}) => {
  // Format timestamp
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Get status content
  const getStatusContent = () => {
    switch (status) {
      case 'running':
        return {
          title: 'Analysis In Progress',
          subtitle: 'Security checks are being performed on runtime data...',
        };
      case 'ready':
        return {
          title: 'New Sessions Ready',
          subtitle: `${unanalyzedSessions} new session(s) from ${agentsWithNewSessions} agent(s) ready to analyze`,
        };
      case 'upToDate':
        return {
          title: 'Analysis Up to Date',
          subtitle: 'All sessions have been analyzed',
        };
      default:
        return {
          title: 'No Runtime Data',
          subtitle: 'Connect your agent to start capturing runtime data',
        };
    }
  };

  const { title, subtitle } = getStatusContent();

  // Render status icon
  const renderStatusIcon = () => {
    switch (status) {
      case 'running':
        return <OrbLoader size="sm" />;
      case 'ready':
        return <Clock size={24} />;
      case 'upToDate':
        return <CheckCircle size={24} />;
      default:
        return <Activity size={24} />;
    }
  };

  // Empty state - show explanation
  if (status === 'empty') {
    return (
      <ExplanationCard className={className}>
        <ExplanationHeader>
          <ExplanationIconWrapper>
            <Activity size={24} />
          </ExplanationIconWrapper>
          <ExplanationTitleGroup>
            <ExplanationTitle>Dynamic Analysis</ExplanationTitle>
            <ExplanationSubtitle>Runtime security monitoring for your AI agent</ExplanationSubtitle>
          </ExplanationTitleGroup>
        </ExplanationHeader>
        <ExplanationBody>
          <ExplanationText>
            Dynamic analysis monitors your agent's runtime behavior to detect security issues that
            only manifest during execution. By capturing actual LLM requests and responses, it can
            identify patterns like <strong>excessive tool usage</strong>, <strong>data exfiltration attempts</strong>,
            and <strong>anomalous behavior</strong> that static code analysis might miss.
          </ExplanationText>
          <ExplanationText>
            When combined with static analysis, dynamic findings are <strong>correlated</strong> to
            distinguish real vulnerabilities from theoretical risks—showing which code paths are
            actually exercised in production.
          </ExplanationText>

          <AccuracyHighlight>
            <AccuracyIcon>
              <TrendingUp size={18} />
            </AccuracyIcon>
            <AccuracyContent>
              <AccuracyTitle>More Sessions = More Accurate Analysis</AccuracyTitle>
              <AccuracyText>
                The analysis learns behavioral patterns from your agent's runtime data. With more sessions,
                the system better understands normal vs. anomalous behavior, reducing false positives and
                catching real security issues.
              </AccuracyText>
            </AccuracyContent>
          </AccuracyHighlight>

          <FeatureList>
            <FeatureItem>
              <FeatureIcon>
                <Activity size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Resource Monitoring</FeatureLabel>
                <FeatureDescription>Tracks tool call volume and token budget to detect resource abuse</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <BarChart3 size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Behavioral Analysis</FeatureLabel>
                <FeatureDescription>Detects anomalies through session clustering and pattern analysis</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <Brain size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Autonomy Analysis</FeatureLabel>
                <FeatureDescription>Monitors agent autonomy levels and decision-making boundaries</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <Lock size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Privacy Compliance</FeatureLabel>
                <FeatureDescription>Scans for PII exposure in requests and responses</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
          </FeatureList>
        </ExplanationBody>
      </ExplanationCard>
    );
  }

  return (
    <CardWrapper $status={status} className={className}>
      <CardHeader $status={status}>
        <HeaderLeft>
          <StatusIcon $status={status}>
            {renderStatusIcon()}
          </StatusIcon>
          <HeaderContent>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </HeaderContent>
        </HeaderLeft>
        {status === 'running' && (
          <RunningBadge>
            <Loader2 size={12} className="animate-spin" />
            Analyzing
          </RunningBadge>
        )}
        {status !== 'running' && onRunAnalysis && (
          <Button
            variant={status === 'ready' ? 'primary' : 'secondary'}
            size="md"
            icon={triggerLoading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            disabled={triggerLoading}
            onClick={() => onRunAnalysis(status === 'upToDate')}
          >
            {triggerLoading ? 'Running...' : status === 'ready' ? 'Run Analysis' : 'Re-run Analysis'}
          </Button>
        )}
      </CardHeader>

      <CardBody>
        {/* Stats Grid */}
        <StatsGrid>
          <StatItem>
            <StatValue $variant={totalSessions > 0 ? 'highlight' : undefined}>
              {totalSessions}
            </StatValue>
            <StatLabel>Total Sessions</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $variant={unanalyzedSessions > 0 ? 'warning' : undefined}>
              {unanalyzedSessions}
            </StatValue>
            <StatLabel>Unanalyzed</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{sessionsAnalyzed}</StatValue>
            <StatLabel>Last Analyzed</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue $variant={findingsCount > 0 ? 'warning' : 'success'}>
              {findingsCount}
            </StatValue>
            <StatLabel>Findings</StatLabel>
          </StatItem>
        </StatsGrid>

        {/* Per-agent status badges */}
        {agentsStatus.length > 0 && (
          <AgentsStatusList>
            {agentsStatus.map((agent) => (
              <AgentStatusBadge key={agent.agent_id} $hasNew={agent.unanalyzed_count > 0}>
                <span>{agent.display_name || agent.agent_id.slice(0, 8)}...</span>
                {agent.unanalyzed_count > 0 ? (
                  <Badge variant="high" size="sm">{agent.unanalyzed_count} new</Badge>
                ) : (
                  <Badge variant="medium" size="sm">{agent.total_sessions} sessions</Badge>
                )}
              </AgentStatusBadge>
            ))}
          </AgentsStatusList>
        )}

        {/* CTA Section */}
        <CTASection>
          <LastAnalysisInfo>
            <Clock size={14} />
            Last analysis: {formatTime(lastAnalysisTime || null)}
          </LastAnalysisInfo>
        </CTASection>
      </CardBody>
    </CardWrapper>
  );
};
