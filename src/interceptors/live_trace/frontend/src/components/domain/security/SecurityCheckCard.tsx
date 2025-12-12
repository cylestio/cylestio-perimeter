import { useState } from 'react';
import type { FC, ReactNode } from 'react';

import { Check, X, AlertTriangle, ChevronDown } from 'lucide-react';

import type { Finding, FindingSeverity } from '@api/types/findings';

import { Badge } from '@ui/core/Badge';

import { FrameworkBadges } from './FrameworkBadges';
import {
  CheckCardWrapper,
  CheckCardHeader,
  CheckCardLeft,
  StatusIconWrapper,
  CheckInfo,
  CheckName,
  CheckMeta,
  CheckCardRight,
  FindingsCount,
  ExpandIcon,
  CheckCardBody,
  FindingsList,
  NoFindings,
} from './SecurityCheckCard.styles';

export type CheckStatus = 'PASS' | 'FAIL' | 'INFO';

export interface SecurityCheckCardProps {
  /** Category ID (e.g., 'PROMPT_SECURITY') */
  categoryId: string;
  /** Display name (e.g., 'Prompt Security') */
  name: string;
  /** Check status */
  status: CheckStatus;
  /** OWASP LLM mapping (e.g., 'LLM01') */
  owaspLlm?: string;
  /** CWE mappings */
  cwe?: string[];
  /** SOC2 controls */
  soc2Controls?: string[];
  /** Number of findings */
  findingsCount: number;
  /** Max severity of findings */
  maxSeverity?: FindingSeverity;
  /** The actual findings (for expanded view) */
  findings?: Finding[];
  /** Custom render function for findings */
  renderFinding?: (finding: Finding) => ReactNode;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  className?: string;
}

const StatusIcon: FC<{ status: CheckStatus }> = ({ status }) => {
  switch (status) {
    case 'PASS':
      return <Check size={16} />;
    case 'FAIL':
      return <X size={16} />;
    case 'INFO':
      return <AlertTriangle size={16} />;
  }
};

const getSeverityVariant = (severity?: FindingSeverity): 'critical' | 'high' | 'medium' | 'low' => {
  switch (severity) {
    case 'CRITICAL':
      return 'critical';
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    default:
      return 'low';
  }
};

/**
 * SecurityCheckCard - Displays a security check category with status and findings
 * 
 * Shows:
 * - Status icon (pass/fail/info)
 * - Category name with framework badges
 * - Findings count with max severity
 * - Expandable to show individual findings
 */
export const SecurityCheckCard: FC<SecurityCheckCardProps> = ({
  categoryId: _categoryId,
  name,
  status,
  owaspLlm,
  cwe,
  soc2Controls,
  findingsCount,
  maxSeverity,
  findings = [],
  renderFinding,
  defaultExpanded = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasFindings = findingsCount > 0;

  return (
    <CheckCardWrapper $status={status} $isExpanded={isExpanded} className={className}>
      <CheckCardHeader onClick={() => hasFindings && setIsExpanded(!isExpanded)}>
        <CheckCardLeft>
          <StatusIconWrapper $status={status}>
            <StatusIcon status={status} />
          </StatusIconWrapper>
          <CheckInfo>
            <CheckName>{name}</CheckName>
            <CheckMeta>
              <FrameworkBadges
                owaspLlm={owaspLlm}
                cwe={cwe}
                soc2Controls={soc2Controls}
                compact
              />
            </CheckMeta>
          </CheckInfo>
        </CheckCardLeft>
        <CheckCardRight>
          {maxSeverity && (
            <Badge variant={getSeverityVariant(maxSeverity)} size="sm">
              {maxSeverity}
            </Badge>
          )}
          <FindingsCount>
            {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}
          </FindingsCount>
          {hasFindings && (
            <ExpandIcon $isExpanded={isExpanded}>
              <ChevronDown size={18} />
            </ExpandIcon>
          )}
        </CheckCardRight>
      </CheckCardHeader>

      {isExpanded && hasFindings && (
        <CheckCardBody>
          <FindingsList>
            {findings.length > 0 ? (
              findings.map((finding) =>
                renderFinding ? (
                  renderFinding(finding)
                ) : (
                  <div key={finding.finding_id}>
                    {finding.title} - {finding.file_path}
                  </div>
                )
              )
            ) : (
              <NoFindings>
                {findingsCount} findings not loaded. Click to view details.
              </NoFindings>
            )}
          </FindingsList>
        </CheckCardBody>
      )}
    </CheckCardWrapper>
  );
};
