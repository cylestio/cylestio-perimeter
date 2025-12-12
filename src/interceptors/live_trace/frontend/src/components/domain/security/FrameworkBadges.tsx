import type { FC } from 'react';

import {
  BadgesContainer,
  FrameworkBadgeWrapper,
  CvssBadgeWrapper,
  BadgeLabel,
  BadgeValue,
} from './FrameworkBadges.styles';

export interface FrameworkBadgesProps {
  owaspLlm?: string;
  cwe?: string[];
  soc2Controls?: string[];
  cvssScore?: number;
  cvssVector?: string;
  mitreAtlas?: string;
  nistCsf?: string;
  /** Show compact version (fewer badges) */
  compact?: boolean;
  className?: string;
}

type CvssSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Get CVSS severity level from score.
 * CVSS v3.1 severity ratings:
 * - Critical: 9.0-10.0
 * - High: 7.0-8.9
 * - Medium: 4.0-6.9
 * - Low: 0.1-3.9
 * - Info: 0.0
 */
export function getCvssSeverity(score: number | undefined): CvssSeverity {
  if (score === undefined || score === null) return 'info';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'info';
}

/**
 * FrameworkBadges - Display security framework badges for findings
 * 
 * Shows badges for:
 * - OWASP LLM Top 10 (e.g., LLM01)
 * - CWE IDs (e.g., CWE-74)
 * - SOC2 Controls (e.g., CC6.1)
 * - CVSS Score (e.g., 9.8)
 * - MITRE ATLAS (e.g., AML.T0051)
 * - NIST CSF (e.g., PR.DS-5)
 */
export const FrameworkBadges: FC<FrameworkBadgesProps> = ({
  owaspLlm,
  cwe,
  soc2Controls,
  cvssScore,
  mitreAtlas,
  nistCsf,
  compact = false,
  className,
}) => {
  const hasBadges = owaspLlm || (cwe && cwe.length > 0) || (soc2Controls && soc2Controls.length > 0) || 
                   cvssScore !== undefined || mitreAtlas || nistCsf;

  if (!hasBadges) return null;

  const cvssSeverity = getCvssSeverity(cvssScore);

  // In compact mode, show fewer badges
  const cwesToShow = compact ? cwe?.slice(0, 1) : cwe;
  const soc2ToShow = compact ? soc2Controls?.slice(0, 1) : soc2Controls;

  return (
    <BadgesContainer className={className}>
      {/* CVSS Score - Most important, show first */}
      {cvssScore !== undefined && (
        <CvssBadgeWrapper $severity={cvssSeverity}>
          <BadgeLabel>CVSS</BadgeLabel>
          <BadgeValue>{cvssScore.toFixed(1)}</BadgeValue>
        </CvssBadgeWrapper>
      )}

      {/* OWASP LLM */}
      {owaspLlm && (
        <FrameworkBadgeWrapper $type="owasp">
          {owaspLlm}
        </FrameworkBadgeWrapper>
      )}

      {/* CWE IDs */}
      {cwesToShow?.map((cweId) => (
        <FrameworkBadgeWrapper key={cweId} $type="cwe">
          {cweId}
        </FrameworkBadgeWrapper>
      ))}
      {compact && cwe && cwe.length > 1 && (
        <FrameworkBadgeWrapper $type="cwe">
          +{cwe.length - 1}
        </FrameworkBadgeWrapper>
      )}

      {/* SOC2 Controls */}
      {soc2ToShow?.map((control) => (
        <FrameworkBadgeWrapper key={control} $type="soc2">
          {control}
        </FrameworkBadgeWrapper>
      ))}
      {compact && soc2Controls && soc2Controls.length > 1 && (
        <FrameworkBadgeWrapper $type="soc2">
          +{soc2Controls.length - 1}
        </FrameworkBadgeWrapper>
      )}

      {/* MITRE ATLAS */}
      {mitreAtlas && (
        <FrameworkBadgeWrapper $type="mitre">
          {mitreAtlas}
        </FrameworkBadgeWrapper>
      )}

      {/* NIST CSF */}
      {nistCsf && (
        <FrameworkBadgeWrapper $type="nist">
          {nistCsf}
        </FrameworkBadgeWrapper>
      )}
    </BadgesContainer>
  );
};
