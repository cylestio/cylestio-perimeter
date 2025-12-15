import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import { Check, X, AlertTriangle, ChevronDown, Shield } from 'lucide-react';

import type { SecurityCheck, CheckStatus, Finding, FindingSeverity } from '@api/types/findings';

import { FindingCard } from '@domain/findings';

import { FrameworkBadges } from './FrameworkBadges';
import {
  CardWrapper,
  CardHeader,
  CardHeaderLeft,
  CardHeaderRight,
  StatusIcon,
  CardContent,
  CategoryName,
  CategoryDescription,
  FindingsCount,
  SeverityBadge,
  ExpandIcon,
  CardBody,
  FindingsList,
  BadgesRow,
} from './SecurityCheckCard.styles';

export interface SecurityCheckCardProps {
  /** The security check data */
  check: SecurityCheck;
  /** Whether the card is expanded by default */
  defaultExpanded?: boolean;
  /** Callback when a finding is clicked */
  onFindingClick?: (finding: Finding) => void;
  className?: string;
}

const getStatusIcon = (status: CheckStatus): ReactNode => {
  switch (status) {
    case 'PASS':
      return <Check size={14} />;
    case 'FAIL':
      return <X size={14} />;
    case 'INFO':
      return <AlertTriangle size={14} />;
    default:
      return null;
  }
};

const getStatusLabel = (status: CheckStatus): string => {
  switch (status) {
    case 'PASS':
      return 'PASS';
    case 'FAIL':
      return 'FAIL';
    case 'INFO':
      return 'INFO';
    default:
      return '';
  }
};

/**
 * SecurityCheckCard displays a single security check category
 * with its status, findings count, and expandable findings list.
 */
export const SecurityCheckCard: FC<SecurityCheckCardProps> = ({
  check,
  defaultExpanded = false,
  onFindingClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasFindings = check.findings_count > 0;

  return (
    <CardWrapper
      className={className}
      $status={check.status}
      $expanded={isExpanded}
      onClick={() => hasFindings && setIsExpanded(!isExpanded)}
    >
      <CardHeader>
        <CardHeaderLeft>
          <StatusIcon $status={check.status}>
            {getStatusIcon(check.status)}
          </StatusIcon>
          <CardContent>
            <CategoryName>{check.name}</CategoryName>
            <CategoryDescription>
              {check.owasp_llm.length > 0 && (
                <span>{check.owasp_llm.join(', ')} · </span>
              )}
              {getStatusLabel(check.status)}
            </CategoryDescription>
          </CardContent>
        </CardHeaderLeft>

        <CardHeaderRight>
          {hasFindings && (
            <>
              <FindingsCount $hasFindings={hasFindings}>
                <Shield size={12} />
                {check.findings_count} {check.findings_count === 1 ? 'finding' : 'findings'}
              </FindingsCount>
              {check.max_severity && (
                <SeverityBadge $severity={check.max_severity}>
                  {check.max_severity}
                </SeverityBadge>
              )}
              <ExpandIcon $expanded={isExpanded}>
                <ChevronDown size={16} />
              </ExpandIcon>
            </>
          )}
        </CardHeaderRight>
      </CardHeader>

      {isExpanded && hasFindings && (
        <CardBody onClick={(e) => e.stopPropagation()}>
          <BadgesRow>
            <FrameworkBadges owaspLlm={check.owasp_llm} />
          </BadgesRow>
          <FindingsList>
            {check.findings.map((finding) => (
              <FindingCard
                key={finding.finding_id}
                finding={finding}
                defaultExpanded={false}
              />
            ))}
          </FindingsList>
        </CardBody>
      )}
    </CardWrapper>
  );
};
