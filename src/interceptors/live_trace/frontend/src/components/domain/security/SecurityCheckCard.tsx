import { useState, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import { Check, X, AlertTriangle, ChevronDown, Shield, CheckCircle } from 'lucide-react';

import type { SecurityCheck, CheckStatus, Finding } from '@api/types/findings';

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
  FindingsGroupHeader,
  FindingsGroup,
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

// Sort findings by severity (CRITICAL > HIGH > MEDIUM > LOW)
const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * SecurityCheckCard displays a single security check category
 * with its status, findings count, and expandable findings list.
 */
export const SecurityCheckCard: FC<SecurityCheckCardProps> = ({
  check,
  defaultExpanded = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasFindings = check.findings_count > 0;

  // Calculate open and resolved counts from findings
  const { openFindings, resolvedFindings, openCount, resolvedCount } = useMemo(() => {
    const open = check.findings.filter(f => f.status === 'OPEN');
    const resolved = check.findings.filter(f => f.status !== 'OPEN');
    
    // Sort by severity
    const sortBySeverity = (a: Finding, b: Finding) => {
      const aOrder = SEVERITY_ORDER[a.severity] ?? 99;
      const bOrder = SEVERITY_ORDER[b.severity] ?? 99;
      return aOrder - bOrder;
    };
    
    return {
      openFindings: open.sort(sortBySeverity),
      resolvedFindings: resolved.sort(sortBySeverity),
      openCount: check.open_count ?? open.length,
      resolvedCount: (check.findings_count - (check.open_count ?? open.length)),
    };
  }, [check.findings, check.open_count, check.findings_count]);

  // Determine badge display
  const getBadgeContent = () => {
    if (openCount > 0) {
      return {
        text: `${openCount} open`,
        isOpen: true,
      };
    } else if (check.findings_count > 0) {
      return {
        text: `${check.findings_count} resolved`,
        isOpen: false,
      };
    }
    return null;
  };

  const badgeContent = getBadgeContent();

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
              <FindingsCount $hasFindings={hasFindings} $isResolved={!badgeContent?.isOpen}>
                {badgeContent?.isOpen ? <Shield size={12} /> : <CheckCircle size={12} />}
                {badgeContent?.text}
              </FindingsCount>
              {badgeContent?.isOpen && check.max_severity && (
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
          
          {/* Open Findings Group */}
          {openFindings.length > 0 && (
            <FindingsGroup>
              <FindingsGroupHeader $variant="open">
                OPEN ({openCount})
              </FindingsGroupHeader>
              <FindingsList>
                {openFindings.map((finding) => (
                  <FindingCard
                    key={finding.finding_id}
                    finding={finding}
                    defaultExpanded={false}
                  />
                ))}
              </FindingsList>
            </FindingsGroup>
          )}

          {/* Resolved Findings Group */}
          {resolvedFindings.length > 0 && (
            <FindingsGroup>
              <FindingsGroupHeader $variant="resolved">
                RESOLVED ({resolvedCount})
              </FindingsGroupHeader>
              <FindingsList>
                {resolvedFindings.map((finding) => (
                  <FindingCard
                    key={finding.finding_id}
                    finding={finding}
                    defaultExpanded={false}
                  />
                ))}
              </FindingsList>
            </FindingsGroup>
          )}
        </CardBody>
      )}
    </CardWrapper>
  );
};
