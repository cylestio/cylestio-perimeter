import { useState } from 'react';
import type { FC } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { Finding } from '@api/types/findings';

import { Badge } from '@ui/core/Badge';
import { Text } from '@ui/core/Text';

import { FrameworkBadges } from '@domain/security/FrameworkBadges';
import { FixActionCard } from '@domain/security/FixActionCard';

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
} from './FindingCard.styles';

export interface FindingCardProps {
  finding: Finding;
  defaultExpanded?: boolean;
  /** Show framework badges in the header */
  showFrameworkBadges?: boolean;
  /** Show fix action card in expanded view */
  showFixAction?: boolean;
  /** Recommendation ID for fix action (generated if not provided) */
  recommendationId?: string;
  className?: string;
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

const getStatusColor = (status: string): 'success' | 'critical' | 'low' => {
  switch (status) {
    case 'OPEN':
      return 'critical';
    case 'FIXED':
      return 'success';
    case 'IGNORED':
      return 'low';
    default:
      return 'low';
  }
};

const formatLineNumbers = (lineStart?: number, lineEnd?: number): string => {
  if (!lineStart) return '';
  if (!lineEnd || lineStart === lineEnd) return `Line ${lineStart}`;
  return `Lines ${lineStart}-${lineEnd}`;
};

export const FindingCard: FC<FindingCardProps> = ({
  finding,
  defaultExpanded = false,
  showFrameworkBadges = true,
  showFixAction = true,
  recommendationId,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const lineInfo = formatLineNumbers(finding.line_start, finding.line_end);
  
  // Get OWASP LLM ID from mapping (first one if available)
  const owaspLlm = finding.owasp_mapping?.[0];
  
  // Generate a recommendation ID if not provided
  const recId = recommendationId || `REC-${finding.finding_id.slice(-4).toUpperCase()}`;

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
            {showFrameworkBadges && (
              <FrameworkBadges
                cvssScore={finding.cvss_score}
                owaspLlm={owaspLlm}
                cwe={finding.cwe_mapping}
                soc2Controls={finding.soc2_controls}
                compact
              />
            )}
            <Badge variant={getSeverityVariant(finding.severity)} size="sm">
              {finding.severity}
            </Badge>
            <Badge variant={getStatusColor(finding.status)} size="sm">
              {finding.status}
            </Badge>
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

          {/* Full framework mappings when expanded */}
          {(owaspLlm || finding.cwe_mapping?.length || finding.soc2_controls?.length) && (
            <FindingSection>
              <FindingSectionTitle>Framework Mappings</FindingSectionTitle>
              <FrameworkBadges
                cvssScore={finding.cvss_score}
                cvssVector={finding.cvss_vector}
                owaspLlm={owaspLlm}
                cwe={finding.cwe_mapping}
                soc2Controls={finding.soc2_controls}
                mitreAtlas={finding.mitre_atlas}
                nistCsf={finding.nist_csf}
              />
            </FindingSection>
          )}

          {/* Fix action card for open findings */}
          {showFixAction && finding.status === 'OPEN' && (
            <FindingSection>
              <FindingSectionTitle>Fix This Issue</FindingSectionTitle>
              <FixActionCard recommendationId={recId} />
            </FindingSection>
          )}

          {/* Legacy OWASP mapping (for backward compatibility) */}
          {finding.owasp_mapping && finding.owasp_mapping.length > 0 && !owaspLlm && (
            <FindingSection>
              <FindingSectionTitle>OWASP Mapping</FindingSectionTitle>
              <TagList>
                {finding.owasp_mapping.map((tag) => (
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
        </FindingCardDetails>
      )}
    </FindingCardWrapper>
  );
};
