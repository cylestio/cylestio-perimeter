import { useState, useMemo, type FC, type ReactNode } from 'react';

import { Check, ChevronDown, TrendingDown, CheckCircle } from 'lucide-react';

import type { DeveloperFinding, DevCategory } from '@api/types/code';
import type { FindingSeverity } from '@api/types/findings';

import { FindingCard } from '@domain/findings';

import {
  CardWrapper,
  CardHeader,
  CardHeaderLeft,
  CardHeaderRight,
  CategoryIcon,
  CardContent,
  CategoryName,
  CategoryDescription,
  FindingsCount,
  HealthPenalty,
  SeverityBadge,
  ExpandIcon,
  CardBody,
  FindingsList,
  FindingsGroup,
  FindingsGroupHeader,
} from './CodeCheckCard.styles';

export interface CodeCheckCardProps {
  /** Developer category ID */
  category: DevCategory;
  /** Category display name */
  name: string;
  /** Category description */
  description: string;
  /** Icon to display */
  icon: ReactNode;
  /** Total findings count */
  findingsCount: number;
  /** Open findings count */
  openCount: number;
  /** Developer findings in this category */
  findings: DeveloperFinding[];
  /** Total health penalty for this category */
  healthPenalty?: number;
  /** Whether the card is expanded by default */
  defaultExpanded?: boolean;
  className?: string;
}

// Sort findings by severity (CRITICAL > HIGH > MEDIUM > LOW)
const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// Get highest severity from findings
const getMaxSeverity = (findings: DeveloperFinding[]): FindingSeverity | null => {
  if (findings.length === 0) return null;

  let maxSeverity: FindingSeverity = 'LOW';
  let maxOrder = 3;

  for (const finding of findings) {
    const order = SEVERITY_ORDER[finding.severity] ?? 99;
    if (order < maxOrder) {
      maxOrder = order;
      maxSeverity = finding.severity;
    }
  }

  return maxSeverity;
};

/**
 * CodeCheckCard displays a developer check category
 * with its status, findings count, and expandable findings list.
 */
export const CodeCheckCard: FC<CodeCheckCardProps> = ({
  name,
  description,
  icon,
  findingsCount,
  openCount,
  findings,
  healthPenalty = 0,
  defaultExpanded = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasFindings = findingsCount > 0;
  const hasOpenFindings = openCount > 0;

  // Calculate open and resolved findings
  const { openFindings, resolvedFindings, resolvedCount } = useMemo(() => {
    const open = findings.filter((f) => f.status === 'OPEN');
    const resolved = findings.filter((f) => f.status !== 'OPEN');

    // Sort by severity
    const sortBySeverity = (a: DeveloperFinding, b: DeveloperFinding) => {
      const aOrder = SEVERITY_ORDER[a.severity] ?? 99;
      const bOrder = SEVERITY_ORDER[b.severity] ?? 99;
      return aOrder - bOrder;
    };

    return {
      openFindings: open.sort(sortBySeverity),
      resolvedFindings: resolved.sort(sortBySeverity),
      resolvedCount: findingsCount - openCount,
    };
  }, [findings, findingsCount, openCount]);

  // Get max severity from open findings
  const maxSeverity = getMaxSeverity(openFindings);

  // Determine badge display
  const getBadgeContent = () => {
    if (openCount > 0) {
      return {
        text: `${openCount} open`,
        isOpen: true,
      };
    } else if (findingsCount > 0) {
      return {
        text: `${findingsCount} resolved`,
        isOpen: false,
      };
    }
    return null;
  };

  const badgeContent = getBadgeContent();

  return (
    <CardWrapper
      className={className}
      $hasIssues={hasOpenFindings}
      $expanded={isExpanded}
      onClick={() => hasFindings && setIsExpanded(!isExpanded)}
    >
      <CardHeader>
        <CardHeaderLeft>
          <CategoryIcon $hasIssues={hasOpenFindings}>
            {hasOpenFindings ? icon : <Check size={14} />}
          </CategoryIcon>
          <CardContent>
            <CategoryName>{name}</CategoryName>
            <CategoryDescription>{description}</CategoryDescription>
          </CardContent>
        </CardHeaderLeft>

        <CardHeaderRight>
          {hasFindings && (
            <>
              <FindingsCount $hasFindings={hasOpenFindings} $isResolved={!badgeContent?.isOpen}>
                {badgeContent?.isOpen ? icon : <CheckCircle size={12} />}
                {badgeContent?.text}
              </FindingsCount>
              {hasOpenFindings && healthPenalty > 0 && (
                <HealthPenalty>
                  <TrendingDown size={10} />
                  -{healthPenalty}%
                </HealthPenalty>
              )}
              {hasOpenFindings && maxSeverity && (
                <SeverityBadge $severity={maxSeverity}>{maxSeverity}</SeverityBadge>
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
          {/* Open Findings Group */}
          {openFindings.length > 0 && (
            <FindingsGroup>
              <FindingsGroupHeader $variant="open">OPEN ({openCount})</FindingsGroupHeader>
              <FindingsList>
                {openFindings.map((finding) => (
                  <FindingCard key={finding.finding_id} finding={finding} defaultExpanded={false} />
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
                  <FindingCard key={finding.finding_id} finding={finding} defaultExpanded={false} />
                ))}
              </FindingsList>
            </FindingsGroup>
          )}
        </CardBody>
      )}
    </CardWrapper>
  );
};
