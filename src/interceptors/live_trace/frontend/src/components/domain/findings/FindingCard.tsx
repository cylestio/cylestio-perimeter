import { useState } from 'react';
import type { FC } from 'react';

import { ChevronDown, ChevronRight, ExternalLink, Wrench, Calendar } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

import type { Finding } from '@api/types/findings';
import { formatDateTime } from '@utils/formatting';

import { Badge } from '@ui/core/Badge';
import { Text } from '@ui/core/Text';

import { CorrelationBadge, type CorrelationState } from '@domain/correlation';

import {
  FindingCardWrapper,
  FindingCardHeader,
  FindingCardHeaderContent,
  FindingCardTitle,
  FindingCardMeta,
  FindingCardBadges,
  FindingCardDetails,
  FindingSection,
  FindingSectionTitle,
  CodeSnippet,
  TagList,
  Tag,
  ExpandButton,
  RecommendationLink,
  FixActionBox,
  TimestampBadge,
} from './FindingCard.styles';

export interface FindingCardProps {
  finding: Finding;
  defaultExpanded?: boolean;
  className?: string;
  /** Optional callback when view recommendation is clicked (for custom navigation) */
  onViewRecommendation?: (recommendationId: string) => void;
}

const getSeverityVariant = (severity: string): 'critical' | 'high' | 'medium' | 'low' => {
  switch (severity) {
    case 'CRITICAL':
      return 'critical';
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    default:
      return 'low';
  }
};

const getStatusVariant = (status: string): 'success' | 'info' | 'low' | undefined => {
  switch (status) {
    case 'OPEN':
      return undefined; // Don't show status badge for OPEN - severity is enough
    case 'FIXED':
    case 'ADDRESSED': // Normalize legacy status
      return 'success';
    case 'RESOLVED': // Auto-resolved (issue no longer present in codebase)
      return 'info'; // Use 'info' instead of 'cyan' which isn't a valid BadgeVariant
    case 'DISMISSED':
    case 'IGNORED':
      return 'low';
    default:
      return undefined;
  }
};

// Normalize status for display (ADDRESSED -> FIXED)
const normalizeStatus = (status: string): string => {
  if (status === 'ADDRESSED') return 'FIXED';
  if (status === 'RESOLVED') return 'Resolved';
  return status;
};

const formatLineNumbers = (lineStart?: number, lineEnd?: number): string => {
  if (!lineStart) return '';
  if (!lineEnd || lineStart === lineEnd) return `Line ${lineStart}`;
  return `Lines ${lineStart}-${lineEnd}`;
};

export const FindingCard: FC<FindingCardProps> = ({
  finding,
  defaultExpanded = false,
  className,
  onViewRecommendation,
}) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const lineInfo = formatLineNumbers(finding.line_start, finding.line_end);
  const hasRecommendation = !!finding.recommendation_id;

  return (
    <FindingCardWrapper className={className}>
      <FindingCardHeader onClick={() => setIsExpanded(!isExpanded)}>
        <ExpandButton $isExpanded={isExpanded}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </ExpandButton>
        <FindingCardHeaderContent>
          <FindingCardTitle>
            <Text size="sm" weight="medium">
              {finding.title}
            </Text>
            <FindingCardMeta>
              <Text size="xs" color="muted">
                {finding.file_path}
                {lineInfo && ` • ${lineInfo}`}
              </Text>
            </FindingCardMeta>
          </FindingCardTitle>
          <FindingCardBadges>
            <Badge variant={getSeverityVariant(finding.severity)} size="sm">
              {finding.severity}
            </Badge>
            {/* Phase 5: Show correlation badge if available */}
            {finding.correlation_state && (
              <CorrelationBadge
                state={finding.correlation_state as CorrelationState}
                evidence={
                  finding.correlation_evidence
                    ? typeof finding.correlation_evidence === 'object'
                      ? finding.correlation_evidence.runtime_observations ||
                        (finding.correlation_evidence.tool_calls
                          ? `Tool called ${finding.correlation_evidence.tool_calls} times`
                          : undefined)
                      : String(finding.correlation_evidence)
                    : undefined
                }
              />
            )}
            {/* Only show status badge for non-OPEN statuses (FIXED, DISMISSED, etc.) */}
            {finding.status !== 'OPEN' && (
              <>
                <Badge variant={getStatusVariant(finding.status)} size="sm">
                  {normalizeStatus(finding.status)}
                </Badge>
                {/* Show resolved timestamp for non-OPEN findings */}
                {finding.updated_at !== finding.created_at && (
                  <TimestampBadge>
                    <Calendar size={10} />
                    {formatDateTime(finding.updated_at)}
                  </TimestampBadge>
                )}
              </>
            )}
          </FindingCardBadges>
        </FindingCardHeaderContent>
      </FindingCardHeader>

      {isExpanded && (
        <FindingCardDetails>
          {finding.description && (
            <FindingSection>
              <FindingSectionTitle>Description</FindingSectionTitle>
              <Text size="sm" color="muted">
                {finding.description}
              </Text>
            </FindingSection>
          )}

          {finding.evidence?.code_snippet && (
            <FindingSection>
              <FindingSectionTitle>Code Snippet</FindingSectionTitle>
              <CodeSnippet>{finding.evidence.code_snippet}</CodeSnippet>
            </FindingSection>
          )}

          {finding.evidence?.context && (
            <FindingSection>
              <FindingSectionTitle>Context</FindingSectionTitle>
              <Text size="sm" color="muted">
                {finding.evidence.context}
              </Text>
            </FindingSection>
          )}

          {finding.owasp_mapping && (
            <FindingSection>
              <FindingSectionTitle>OWASP Mapping</FindingSectionTitle>
              <TagList>
                {(Array.isArray(finding.owasp_mapping) 
                  ? finding.owasp_mapping 
                  : [finding.owasp_mapping]
                ).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagList>
            </FindingSection>
          )}

          <FindingSection>
            <FindingSectionTitle>Metadata</FindingSectionTitle>
            <Text size="xs" color="muted">
              Type: {finding.finding_type} • Created: {new Date(finding.created_at).toLocaleString()}
              {finding.updated_at !== finding.created_at &&
                ` • Updated: ${new Date(finding.updated_at).toLocaleString()}`}
            </Text>
          </FindingSection>

          {/* Recommendation Link & Fix Action */}
          {hasRecommendation && finding.status === 'OPEN' && (
            <FindingSection>
              <FindingSectionTitle>Take Action</FindingSectionTitle>
              <FixActionBox>
                <Wrench size={16} />
                <span>Fix with: <code>/fix {finding.recommendation_id}</code></span>
              </FixActionBox>
              {agentWorkflowId && (
                <RecommendationLink
                  as={Link}
                  to={`/agent-workflow/${agentWorkflowId}/recommendations?finding=${finding.finding_id}`}
                  onClick={(e: React.MouseEvent) => {
                    if (onViewRecommendation) {
                      e.preventDefault();
                      onViewRecommendation(finding.recommendation_id!);
                    }
                  }}
                >
                  View Recommendation {finding.recommendation_id}
                  <ExternalLink size={12} />
                </RecommendationLink>
              )}
            </FindingSection>
          )}
        </FindingCardDetails>
      )}
    </FindingCardWrapper>
  );
};
