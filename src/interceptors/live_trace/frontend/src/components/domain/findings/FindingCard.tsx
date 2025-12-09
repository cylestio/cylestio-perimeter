import { useState } from 'react';
import type { FC } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { Finding } from '@api/types/findings';

import { Badge } from '@ui/core/Badge';
import { Text } from '@ui/core/Text';

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
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const lineInfo = formatLineNumbers(finding.line_start, finding.line_end);

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

          {finding.owasp_mapping && finding.owasp_mapping.length > 0 && (
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
