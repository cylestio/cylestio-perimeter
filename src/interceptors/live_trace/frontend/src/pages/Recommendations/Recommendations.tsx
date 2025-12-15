import { useCallback, useEffect, useState, type FC } from 'react';

import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import { RecommendationsIcon } from '@constants/pageIcons';
import { fetchAgentWorkflowFindings } from '@api/endpoints/agentWorkflow';
import type { Finding } from '@api/types/findings';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Badge } from '@ui/core/Badge';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { usePageMeta } from '../../context';
import {
  RecommendationsList,
  RecommendationCard,
  RecommendationIcon,
  RecommendationContent,
  RecommendationTitle,
  RecommendationDescription,
  RecommendationActions,
  ActionLink,
  EmptyState,
  ScoreCard,
  ScoreValue,
  ScoreLabel,
  ScoreBreakdown,
  ScoreItem,
} from './Recommendations.styles';

export interface RecommendationsProps {
  className?: string;
}

interface Recommendation {
  id: string;
  type: 'security' | 'performance' | 'best-practice';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

// Generate recommendations from findings
const generateRecommendations = (findings: Finding[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const openCount = findings.filter(f => f.status === 'OPEN').length;

  if (criticalCount > 0) {
    recommendations.push({
      id: 'critical-findings',
      type: 'security',
      severity: 'high',
      title: `Address ${criticalCount} critical security finding${criticalCount > 1 ? 's' : ''}`,
      description: 'Critical findings require immediate attention. These vulnerabilities could lead to prompt injection, data leakage, or unauthorized actions.',
      actionLabel: 'View Static Analysis',
      actionLink: 'static-analysis',
    });
  }

  if (highCount > 0) {
    recommendations.push({
      id: 'high-findings',
      type: 'security',
      severity: 'medium',
      title: `Review ${highCount} high severity finding${highCount > 1 ? 's' : ''}`,
      description: 'High severity findings should be addressed in your next development cycle to maintain security posture.',
      actionLabel: 'View Findings',
      actionLink: 'static-analysis',
    });
  }

  if (openCount === 0 && findings.length > 0) {
    recommendations.push({
      id: 'all-resolved',
      type: 'best-practice',
      severity: 'low',
      title: 'All findings have been addressed',
      description: 'Great job! Continue monitoring for new security findings as your agent evolves.',
    });
  }

  if (findings.length === 0) {
    recommendations.push({
      id: 'run-analysis',
      type: 'best-practice',
      severity: 'medium',
      title: 'Run your first security analysis',
      description: 'Use the AI-powered security scanner in your IDE to identify potential vulnerabilities in your agent code.',
    });
  }

  // Add general best-practice recommendations
  recommendations.push({
    id: 'dynamic-testing',
    type: 'performance',
    severity: 'low',
    title: 'Enable dynamic analysis for runtime insights',
    description: 'Dynamic analysis monitors your agent at runtime to identify issues that static analysis cannot detect, like unexpected tool usage patterns.',
    actionLabel: 'Learn More',
    actionLink: 'dynamic-analysis',
  });

  return recommendations;
};

export const Recommendations: FC<RecommendationsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!agentWorkflowId) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAgentWorkflowFindings(agentWorkflowId);
      setFindings(data.findings);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    } finally {
      setLoading(false);
    }
  }, [agentWorkflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Recommendations' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Recommendations' }],
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  const recommendations = generateRecommendations(findings);
  
  // Calculate a simple security score
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length;
  const highCount = findings.filter(f => f.severity === 'HIGH' && f.status === 'OPEN').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM' && f.status === 'OPEN').length;
  
  let score = 100;
  score -= criticalCount * 25;
  score -= highCount * 10;
  score -= mediumCount * 5;
  score = Math.max(0, score);

  const getScoreColor = () => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };

  const getSeverityIcon = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertCircle size={20} />;
      case 'medium':
        return <Lightbulb size={20} />;
      case 'low':
      default:
        return <CheckCircle2 size={20} />;
    }
  };

  return (
    <Page className={className} data-testid="recommendations">
      <PageHeader
        icon={<RecommendationsIcon size={24} />}
        title="Recommendations"
        description="AI-powered suggestions to improve your agent's security and performance"
      />

      {/* Security Score */}
      <Section>
        <Section.Content>
          <ScoreCard>
            <ScoreValue $color={getScoreColor()}>{score}</ScoreValue>
            <ScoreLabel>Security Score</ScoreLabel>
            <ScoreBreakdown>
              <ScoreItem $color="red">
                <span>{criticalCount}</span> Critical
              </ScoreItem>
              <ScoreItem $color="orange">
                <span>{highCount}</span> High
              </ScoreItem>
              <ScoreItem $color="yellow">
                <span>{mediumCount}</span> Medium
              </ScoreItem>
            </ScoreBreakdown>
          </ScoreCard>
        </Section.Content>
      </Section>

      {/* Recommendations List */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Lightbulb size={16} />}>
            Actionable Recommendations ({recommendations.length})
          </Section.Title>
        </Section.Header>
        <Section.Content>
          {recommendations.length > 0 ? (
            <RecommendationsList>
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} $severity={rec.severity}>
                  <RecommendationIcon $severity={rec.severity}>
                    {getSeverityIcon(rec.severity)}
                  </RecommendationIcon>
                  <RecommendationContent>
                    <RecommendationTitle>{rec.title}</RecommendationTitle>
                    <RecommendationDescription>{rec.description}</RecommendationDescription>
                    {rec.actionLink && (
                      <RecommendationActions>
                        <ActionLink
                          as={Link}
                          to={`/agent-workflow/${agentWorkflowId}/${rec.actionLink}`}
                        >
                          {rec.actionLabel} <ArrowRight size={14} />
                        </ActionLink>
                      </RecommendationActions>
                    )}
                  </RecommendationContent>
                  <Badge variant={rec.severity === 'high' ? 'critical' : rec.severity === 'medium' ? 'medium' : 'success'}>
                    {rec.type}
                  </Badge>
                </RecommendationCard>
              ))}
            </RecommendationsList>
          ) : (
            <EmptyState>
              <CheckCircle2 size={48} />
              <h3>No recommendations at this time</h3>
              <p>Your agent is looking great! We'll notify you when we have new suggestions.</p>
            </EmptyState>
          )}
        </Section.Content>
      </Section>
    </Page>
  );
};
